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

// Log writes an activity entry. For task.updated it upserts within a 5-minute
// window so rapid toggle-complete/undo doesn't produce duplicate rows.
// For task.deleted it removes any recent entry for that task first.
func (r *ActivityRepository) Log(ctx context.Context, userID uuid.UUID, taskID *uuid.UUID, action string, meta any) error {
	var metaJSON []byte
	if meta != nil {
		var err error
		metaJSON, err = json.Marshal(meta)
		if err != nil {
			return fmt.Errorf("marshal meta: %w", err)
		}
	}

	if action == model.ActionTaskDeleted && taskID != nil {
		// remove any recent entries for this task so the feed doesn't show
		// "created/updated" followed immediately by "deleted"
		_, _ = r.pool.Exec(ctx, `
			DELETE FROM activity_logs
			WHERE user_id = $1 AND task_id = $2
			  AND created_at > NOW() - INTERVAL '5 minutes'`,
			userID, *taskID,
		)
	}

	if action == model.ActionTaskUpdated && taskID != nil {
		// try to refresh an existing row within the 5-minute window
		tag, err := r.pool.Exec(ctx, `
			UPDATE activity_logs
			SET meta = $4, created_at = NOW()
			WHERE id = (
				SELECT id FROM activity_logs
				WHERE user_id = $1 AND task_id = $2 AND action = $3
				  AND created_at > NOW() - INTERVAL '5 minutes'
				ORDER BY created_at DESC
				LIMIT 1
			)`,
			userID, *taskID, action, metaJSON,
		)
		if err == nil && tag.RowsAffected() > 0 {
			return nil // updated in-place — no new row needed
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
