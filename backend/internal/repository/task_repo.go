package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/taskapp/backend/internal/model"
)

var ErrNotFound = errors.New("not found")

type TaskRepository struct {
	pool *pgxpool.Pool
}

func NewTaskRepository(pool *pgxpool.Pool) *TaskRepository {
	return &TaskRepository{pool: pool}
}

func (r *TaskRepository) Create(ctx context.Context, userID uuid.UUID, in model.CreateTaskInput) (*model.Task, error) {
	if in.Status == "" {
		in.Status = model.StatusTodo
	}
	if in.Priority == "" {
		in.Priority = model.PriorityMedium
	}

	row := r.pool.QueryRow(ctx, `
		INSERT INTO tasks (user_id, title, description, status, priority, due_date)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at`,
		userID, in.Title, in.Description, in.Status, in.Priority, in.DueDate,
	)

	return scanTask(row)
}

func (r *TaskRepository) GetByID(ctx context.Context, id, userID uuid.UUID) (*model.Task, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
		FROM tasks
		WHERE id = $1 AND user_id = $2`,
		id, userID,
	)

	task, err := scanTask(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return task, err
}

func (r *TaskRepository) List(ctx context.Context, userID uuid.UUID, f model.ListTasksFilter) (*model.TaskListResult, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PageSize < 1 || f.PageSize > 100 {
		f.PageSize = 20
	}
	offset := (f.Page - 1) * f.PageSize

	args := []any{userID}
	where := "WHERE user_id = $1"
	argIdx := 2

	if f.Status != nil {
		where += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, *f.Status)
		argIdx++
	}
	if f.Search != "" {
		where += fmt.Sprintf(" AND title ILIKE $%d", argIdx)
		args = append(args, "%"+f.Search+"%")
		argIdx++
	}

	orderBy := "created_at DESC"
	switch f.SortBy {
	case "due_date":
		orderBy = "due_date ASC NULLS LAST, created_at DESC"
	case "priority":
		orderBy = "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ASC, created_at DESC"
	}

	countRow := r.pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM tasks %s", where),
		args...,
	)
	var total int
	if err := countRow.Scan(&total); err != nil {
		return nil, fmt.Errorf("count tasks: %w", err)
	}

	args = append(args, f.PageSize, offset)
	rows, err := r.pool.Query(ctx, fmt.Sprintf(`
		SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
		FROM tasks %s
		ORDER BY %s
		LIMIT $%d OFFSET $%d`,
		where, orderBy, argIdx, argIdx+1,
	), args...)
	if err != nil {
		return nil, fmt.Errorf("list tasks: %w", err)
	}
	defer rows.Close()

	tasks := make([]model.Task, 0)
	for rows.Next() {
		t, err := scanTaskRow(rows)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, *t)
	}

	totalPages := (total + f.PageSize - 1) / f.PageSize

	return &model.TaskListResult{
		Tasks: tasks,
		Pagination: model.PaginationMeta{
			Total:      total,
			Page:       f.Page,
			PageSize:   f.PageSize,
			TotalPages: totalPages,
		},
	}, nil
}

func (r *TaskRepository) Update(ctx context.Context, id, userID uuid.UUID, in model.UpdateTaskInput) (*model.Task, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE tasks SET
			title       = COALESCE($3, title),
			description = COALESCE($4, description),
			status      = COALESCE($5, status),
			priority    = COALESCE($6, priority),
			due_date    = COALESCE($7, due_date),
			updated_at  = NOW()
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at`,
		id, userID,
		in.Title, in.Description,
		in.Status, in.Priority,
		in.DueDate,
	)

	task, err := scanTask(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return task, err
}

func (r *TaskRepository) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		"DELETE FROM tasks WHERE id = $1 AND user_id = $2",
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("delete task: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *TaskRepository) ListAll(ctx context.Context, f model.ListTasksFilter) (*model.AdminTaskListResult, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PageSize < 1 || f.PageSize > 100 {
		f.PageSize = 20
	}
	offset := (f.Page - 1) * f.PageSize

	args := []any{}
	where := "WHERE 1=1"
	argIdx := 1

	if f.Status != nil {
		where += fmt.Sprintf(" AND t.status = $%d", argIdx)
		args = append(args, *f.Status)
		argIdx++
	}
	if f.Search != "" {
		where += fmt.Sprintf(" AND t.title ILIKE $%d", argIdx)
		args = append(args, "%"+f.Search+"%")
		argIdx++
	}

	orderBy := "t.created_at DESC"
	switch f.SortBy {
	case "due_date":
		orderBy = "t.due_date ASC NULLS LAST, t.created_at DESC"
	case "priority":
		orderBy = "CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ASC, t.created_at DESC"
	}

	countRow := r.pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM tasks t %s", where),
		args...,
	)
	var total int
	if err := countRow.Scan(&total); err != nil {
		return nil, fmt.Errorf("count tasks: %w", err)
	}

	args = append(args, f.PageSize, offset)
	rows, err := r.pool.Query(ctx, fmt.Sprintf(`
		SELECT t.id, t.user_id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at, t.updated_at,
		       u.name, u.email
		FROM tasks t
		JOIN users u ON u.id = t.user_id
		%s
		ORDER BY %s
		LIMIT $%d OFFSET $%d`,
		where, orderBy, argIdx, argIdx+1,
	), args...)
	if err != nil {
		return nil, fmt.Errorf("list all tasks: %w", err)
	}
	defer rows.Close()

	tasks := make([]model.AdminTask, 0)
	for rows.Next() {
		var t model.AdminTask
		err := rows.Scan(
			&t.ID, &t.UserID, &t.Title, &t.Description,
			&t.Status, &t.Priority, &t.DueDate,
			&t.CreatedAt, &t.UpdatedAt,
			&t.UserName, &t.UserEmail,
		)
		if err != nil {
			return nil, fmt.Errorf("scan admin task: %w", err)
		}
		tasks = append(tasks, t)
	}

	totalPages := (total + f.PageSize - 1) / f.PageSize

	return &model.AdminTaskListResult{
		Tasks: tasks,
		Pagination: model.PaginationMeta{
			Total:      total,
			Page:       f.Page,
			PageSize:   f.PageSize,
			TotalPages: totalPages,
		},
	}, nil
}

func scanTask(row pgx.Row) (*model.Task, error) {
	var t model.Task
	err := row.Scan(
		&t.ID, &t.UserID, &t.Title, &t.Description,
		&t.Status, &t.Priority, &t.DueDate,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func scanTaskRow(rows pgx.Rows) (*model.Task, error) {
	var t model.Task
	err := rows.Scan(
		&t.ID, &t.UserID, &t.Title, &t.Description,
		&t.Status, &t.Priority, &t.DueDate,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
