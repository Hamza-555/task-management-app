package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/taskapp/backend/internal/model"
	"github.com/taskapp/backend/internal/repository"
)

type ActivityService struct {
	repo *repository.ActivityRepository
}

func NewActivityService(repo *repository.ActivityRepository) *ActivityService {
	return &ActivityService{repo: repo}
}

func (s *ActivityService) ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]model.ActivityLog, error) {
	logs, err := s.repo.ListByUser(ctx, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("list activity logs: %w", err)
	}
	return logs, nil
}
