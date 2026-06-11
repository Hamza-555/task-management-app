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

type AttachmentRepository struct {
	pool *pgxpool.Pool
}

func NewAttachmentRepository(pool *pgxpool.Pool) *AttachmentRepository {
	return &AttachmentRepository{pool: pool}
}

func (r *AttachmentRepository) Create(ctx context.Context, userID, taskID uuid.UUID, filename, contentType string, data []byte) (*model.Attachment, error) {
	var a model.Attachment
	err := r.pool.QueryRow(ctx, `
		INSERT INTO task_attachments (task_id, user_id, filename, content_type, size, data)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, task_id, user_id, filename, content_type, size, created_at`,
		taskID, userID, filename, contentType, len(data), data,
	).Scan(&a.ID, &a.TaskID, &a.UserID, &a.Filename, &a.ContentType, &a.Size, &a.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create attachment: %w", err)
	}
	return &a, nil
}

func (r *AttachmentRepository) ListByTask(ctx context.Context, taskID uuid.UUID) ([]model.Attachment, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, task_id, user_id, filename, content_type, size, created_at
		FROM task_attachments
		WHERE task_id = $1
		ORDER BY created_at ASC`,
		taskID,
	)
	if err != nil {
		return nil, fmt.Errorf("list attachments: %w", err)
	}
	defer rows.Close()

	var attachments []model.Attachment
	for rows.Next() {
		var a model.Attachment
		if err := rows.Scan(&a.ID, &a.TaskID, &a.UserID, &a.Filename, &a.ContentType, &a.Size, &a.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan attachment: %w", err)
		}
		attachments = append(attachments, a)
	}
	return attachments, nil
}

func (r *AttachmentRepository) GetData(ctx context.Context, id, userID uuid.UUID) (*model.AttachmentWithData, error) {
	var a model.AttachmentWithData
	err := r.pool.QueryRow(ctx, `
		SELECT a.id, a.task_id, a.user_id, a.filename, a.content_type, a.size, a.created_at, a.data
		FROM task_attachments a
		JOIN tasks t ON t.id = a.task_id
		WHERE a.id = $1 AND t.user_id = $2`,
		id, userID,
	).Scan(&a.ID, &a.TaskID, &a.UserID, &a.Filename, &a.ContentType, &a.Size, &a.CreatedAt, &a.Data)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get attachment data: %w", err)
	}
	return &a, nil
}

func (r *AttachmentRepository) Delete(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM task_attachments a
		USING tasks t
		WHERE a.id = $1 AND a.task_id = t.id AND t.user_id = $2`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("delete attachment: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
