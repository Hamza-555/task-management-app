package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/taskapp/backend/internal/model"
)

type ActivityRepository struct {
	pool *pgxpool.Pool
}

func NewActivityRepository(pool *pgxpool.Pool) *ActivityRepository {
	return &ActivityRepository{pool: pool}
}

func (r *ActivityRepository) Log(ctx context.Context, userID uuid.UUID, taskID *uuid.UUID, action string, meta any) error {
	var metaJSON []byte
	if meta != nil {
		var err error
		metaJSON, err = json.Marshal(meta)
		if err != nil {
			return fmt.Errorf("marshal meta: %w", err)
		}
	}

	_, err := r.pool.Exec(ctx,
		`INSERT INTO activity_logs (user_id, task_id, action, meta) VALUES ($1, $2, $3, $4)`,
		userID, taskID, action, metaJSON,
	)
	return err
}

func (r *ActivityRepository) ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]model.ActivityLog, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}

	rows, err := r.pool.Query(ctx, `
		SELECT a.id, a.user_id, a.task_id, t.title, a.action, a.meta, a.created_at
		FROM activity_logs a
		LEFT JOIN tasks t ON t.id = a.task_id
		WHERE a.user_id = $1
		ORDER BY a.created_at DESC
		LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("list activity logs: %w", err)
	}
	defer rows.Close()

	var logs []model.ActivityLog
	for rows.Next() {
		var l model.ActivityLog
		var metaRaw []byte
		err := rows.Scan(&l.ID, &l.UserID, &l.TaskID, &l.TaskTitle, &l.Action, &metaRaw, &l.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("scan activity log: %w", err)
		}
		if metaRaw != nil {
			var m any
			if err := json.Unmarshal(metaRaw, &m); err == nil {
				l.Meta = m
			}
		}
		logs = append(logs, l)
	}

	return logs, nil
}
