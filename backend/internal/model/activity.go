package model

import (
	"time"

	"github.com/google/uuid"
)

type ActivityLog struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	TaskID    *uuid.UUID `json:"task_id"`
	TaskTitle *string    `json:"task_title"`
	Action    string     `json:"action"`
	Meta      any        `json:"meta,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

const (
	ActionTaskCreated = "task.created"
	ActionTaskUpdated = "task.updated"
	ActionTaskDeleted = "task.deleted"
)
