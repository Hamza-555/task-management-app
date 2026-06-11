package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/taskapp/backend/internal/apierror"
	"github.com/taskapp/backend/internal/service"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Signup(c *gin.Context) {
	var in service.SignupInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, "invalid request body")
		return
	}

	resp, details := h.svc.Signup(c.Request.Context(), in)
	if details != nil {
		apierror.BadRequestWithDetails(c, "validation failed", details)
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var in service.LoginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, "invalid request body")
		return
	}

	resp, err := h.svc.Login(c.Request.Context(), in)
	if errors.Is(err, service.ErrInvalidPassword) {
		apierror.Unauthorized(c, "invalid email or password")
		return
	}
	if err != nil {
		apierror.Internal(c)
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID := mustUserID(c)

	user, err := h.svc.GetUserByID(c.Request.Context(), userID)
	if errors.Is(err, service.ErrNotFound) {
		apierror.NotFound(c, "user")
		return
	}
	if err != nil {
		apierror.Internal(c)
		return
	}

	c.JSON(http.StatusOK, user)
}
