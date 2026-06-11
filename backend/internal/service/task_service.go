package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/taskapp/backend/internal/model"
	"github.com/taskapp/backend/internal/repository"
)

type TaskService struct {
	repo *repository.TaskRepository
}

func NewTaskService(repo *repository.TaskRepository) *TaskService {
	return &TaskService{repo: repo}
}

var ErrNotFound = errors.New("not found")

func (s *TaskService) Create(ctx context.Context, userID uuid.UUID, in model.CreateTaskInput) (*model.Task, error) {
	task, err := s.repo.Create(ctx, userID, in)
	if err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}
	return task, nil
}

func (s *TaskService) GetByID(ctx context.Context, id, userID uuid.UUID) (*model.Task, error) {
	task, err := s.repo.GetByID(ctx, id, userID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get task: %w", err)
	}
	return task, nil
}

func (s *TaskService) List(ctx context.Context, userID uuid.UUID, f model.ListTasksFilter) (*model.TaskListResult, error) {
	result, err := s.repo.List(ctx, userID, f)
	if err != nil {
		return nil, fmt.Errorf("list tasks: %w", err)
	}
	return result, nil
}

func (s *TaskService) Update(ctx context.Context, id, userID uuid.UUID, in model.UpdateTaskInput) (*model.Task, error) {
	task, err := s.repo.Update(ctx, id, userID, in)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update task: %w", err)
	}
	return task, nil
}

func (s *TaskService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	err := s.repo.Delete(ctx, id, userID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("delete task: %w", err)
	}
	return nil
}
