package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/taskapp/backend/internal/auth"
	"github.com/taskapp/backend/internal/model"
	"github.com/taskapp/backend/internal/repository"
	"github.com/taskapp/backend/internal/validator"
)

var (
	ErrEmailTaken      = errors.New("email already in use")
	ErrInvalidPassword = errors.New("invalid credentials")
)

type SignupInput struct {
	Name     string `json:"name"     validate:"required,min=2,max=100"`
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=72"`
}

type LoginInput struct {
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	User  *model.User   `json:"user"`
	Token auth.TokenPair `json:"token"`
}

type AuthService struct {
	userRepo    *repository.UserRepository
	jwtSecret   string
	jwtExpHours int
}

func NewAuthService(userRepo *repository.UserRepository, jwtSecret string, jwtExpHours int) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSecret: jwtSecret, jwtExpHours: jwtExpHours}
}

func (s *AuthService) Signup(ctx context.Context, in SignupInput) (*AuthResponse, map[string]string) {
	if details := validator.Validate(in); details != nil {
		return nil, details
	}

	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		return nil, map[string]string{"_": "failed to process password"}
	}

	user, err := s.userRepo.Create(ctx, in.Email, hash, in.Name)
	if errors.Is(err, repository.ErrEmailTaken) {
		return nil, map[string]string{"email": "is already in use"}
	}
	if err != nil {
		return nil, map[string]string{"_": "could not create account"}
	}

	token, err := auth.GenerateToken(user.ID, user.Role, s.jwtSecret, s.jwtExpHours)
	if err != nil {
		return nil, map[string]string{"_": "could not generate token"}
	}

	return &AuthResponse{User: user, Token: token}, nil
}

func (s *AuthService) Login(ctx context.Context, in LoginInput) (*AuthResponse, error) {
	if details := validator.Validate(in); details != nil {
		return nil, fmt.Errorf("%w", ErrInvalidPassword)
	}

	user, err := s.userRepo.GetByEmail(ctx, in.Email)
	if errors.Is(err, repository.ErrNotFound) || user == nil {
		return nil, ErrInvalidPassword
	}
	if err != nil {
		return nil, fmt.Errorf("login: %w", err)
	}

	if !auth.CheckPassword(user.PasswordHash, in.Password) {
		return nil, ErrInvalidPassword
	}

	token, err := auth.GenerateToken(user.ID, user.Role, s.jwtSecret, s.jwtExpHours)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &AuthResponse{User: user, Token: token}, nil
}

func (s *AuthService) GetUserByID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrNotFound
	}
	return user, err
}
