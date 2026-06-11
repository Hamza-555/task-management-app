package model

import (
	"time"

	"github.com/google/uuid"
)

type TaskStatus string
type TaskPriority string

const (
	StatusTodo       TaskStatus = "todo"
	StatusInProgress TaskStatus = "in_progress"
	StatusDone       TaskStatus = "done"
)

const (
	PriorityLow    TaskPriority = "low"
	PriorityMedium TaskPriority = "medium"
	PriorityHigh   TaskPriority = "high"
)

type Task struct {
	ID          uuid.UUID    `json:"id"`
	UserID      uuid.UUID    `json:"user_id"`
	Title       string       `json:"title"`
	Description *string      `json:"description"`
	Status      TaskStatus   `json:"status"`
	Priority    TaskPriority `json:"priority"`
	DueDate     *time.Time   `json:"due_date"`
	DueTime     *string      `json:"due_time"` // "HH:MM", nullable
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// CreateTaskInput holds validated data for creating a task.
type CreateTaskInput struct {
	Title       string       `json:"title"       validate:"required,min=1,max=255"`
	Description *string      `json:"description" validate:"omitempty,max=2000"`
	Status      TaskStatus   `json:"status"      validate:"omitempty,oneof=todo in_progress done"`
	Priority    TaskPriority `json:"priority"    validate:"omitempty,oneof=low medium high"`
	DueDate     *time.Time   `json:"due_date"`
	DueTime     *string      `json:"due_time"  validate:"omitempty,len=5"`
}

// UpdateTaskInput holds validated data for updating a task.
type UpdateTaskInput struct {
	Title       *string       `json:"title"       validate:"omitempty,min=1,max=255"`
	Description *string       `json:"description" validate:"omitempty,max=2000"`
	Status      *TaskStatus   `json:"status"      validate:"omitempty,oneof=todo in_progress done"`
	Priority    *TaskPriority `json:"priority"    validate:"omitempty,oneof=low medium high"`
	DueDate     *time.Time    `json:"due_date"`
	DueTime     *string       `json:"due_time"    validate:"omitempty,len=5"`
}

// ListTasksFilter holds query parameters for listing tasks.
type ListTasksFilter struct {
	Status   *TaskStatus
	Search   string
	SortBy   string // due_date | priority | created_at
	DueToday bool
	Page     int
	PageSize int
}

type TaskStats struct {
	Total       int `json:"total"`
	Todo        int `json:"todo"`
	InProgress  int `json:"in_progress"`
	Done        int `json:"done"`
	HighPriority int `json:"high_priority"`
	DueToday    int `json:"due_today"`
	Overdue     int `json:"overdue"`
}

// TaskListResult wraps tasks with pagination metadata.
type TaskListResult struct {
	Tasks      []Task         `json:"tasks"`
	Pagination PaginationMeta `json:"pagination"`
}

type PaginationMeta struct {
	Total      int `json:"total"`
	Page       int `json:"page"`
	PageSize   int `json:"page_size"`
	TotalPages int `json:"total_pages"`
}

// AdminTask is a task with the owning user's name and email, used by admin endpoints.
type AdminTask struct {
	Task
	UserName  string `json:"user_name"`
	UserEmail string `json:"user_email"`
}

type AdminTaskListResult struct {
	Tasks      []AdminTask    `json:"tasks"`
	Pagination PaginationMeta `json:"pagination"`
}
