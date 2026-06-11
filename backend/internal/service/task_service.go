package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/taskapp/backend/internal/model"
	"github.com/taskapp/backend/internal/repository"
	"github.com/taskapp/backend/internal/sse"
)

type TaskService struct {
	repo        *repository.TaskRepository
	activityRepo *repository.ActivityRepository
	broadcaster *sse.Broadcaster
}

func NewTaskService(repo *repository.TaskRepository, activityRepo *repository.ActivityRepository, broadcaster *sse.Broadcaster) *TaskService {
	return &TaskService{repo: repo, activityRepo: activityRepo, broadcaster: broadcaster}
}

var ErrNotFound = errors.New("not found")

func (s *TaskService) Create(ctx context.Context, userID uuid.UUID, in model.CreateTaskInput) (*model.Task, error) {
	task, err := s.repo.Create(ctx, userID, in)
	if err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}
	s.broadcaster.Emit(userID.String(), sse.Event{Type: sse.EventTaskCreated, Payload: task})
	_ = s.activityRepo.Log(ctx, userID, &task.ID, model.ActionTaskCreated, map[string]string{"title": task.Title})
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
	s.broadcaster.Emit(userID.String(), sse.Event{Type: sse.EventTaskUpdated, Payload: task})
	_ = s.activityRepo.Log(ctx, userID, &task.ID, model.ActionTaskUpdated, map[string]string{"title": task.Title})
	return task, nil
}

func (s *TaskService) ListAll(ctx context.Context, f model.ListTasksFilter) (*model.AdminTaskListResult, error) {
	result, err := s.repo.ListAll(ctx, f)
	if err != nil {
		return nil, fmt.Errorf("list all tasks: %w", err)
	}
	return result, nil
}

func (s *TaskService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	err := s.repo.Delete(ctx, id, userID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("delete task: %w", err)
	}
	s.broadcaster.Emit(userID.String(), sse.Event{Type: sse.EventTaskDeleted, Payload: map[string]string{"id": id.String()}})
	_ = s.activityRepo.Log(ctx, userID, &id, model.ActionTaskDeleted, nil)
	return nil
}
