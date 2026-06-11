package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/taskapp/backend/internal/apierror"
	"github.com/taskapp/backend/internal/model"
	"github.com/taskapp/backend/internal/service"
	"github.com/taskapp/backend/internal/validator"
)

type TaskHandler struct {
	svc *service.TaskService
}

func NewTaskHandler(svc *service.TaskService) *TaskHandler {
	return &TaskHandler{svc: svc}
}

func (h *TaskHandler) Create(c *gin.Context) {
	userID := mustUserID(c)

	var in model.CreateTaskInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, "invalid request body")
		return
	}

	if details := validator.Validate(in); details != nil {
		apierror.BadRequestWithDetails(c, "validation failed", details)
		return
	}

	task, err := h.svc.Create(c.Request.Context(), userID, in)
	if err != nil {
		apierror.Internal(c)
		return
	}

	c.JSON(http.StatusCreated, task)
}

func (h *TaskHandler) List(c *gin.Context) {
	userID := mustUserID(c)

	filter := model.ListTasksFilter{
		Search:   c.Query("search"),
		SortBy:   c.Query("sort_by"),
		Page:     queryInt(c, "page", 1),
		PageSize: queryInt(c, "page_size", 20),
	}

	if s := c.Query("status"); s != "" {
		status := model.TaskStatus(s)
		filter.Status = &status
	}

	result, err := h.svc.List(c.Request.Context(), userID, filter)
	if err != nil {
		apierror.Internal(c)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *TaskHandler) GetByID(c *gin.Context) {
	userID := mustUserID(c)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apierror.BadRequest(c, "invalid task id")
		return
	}

	task, err := h.svc.GetByID(c.Request.Context(), id, userID)
	if errors.Is(err, service.ErrNotFound) {
		apierror.NotFound(c, "task")
		return
	}
	if err != nil {
		apierror.Internal(c)
		return
	}

	c.JSON(http.StatusOK, task)
}

func (h *TaskHandler) Update(c *gin.Context) {
	userID := mustUserID(c)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apierror.BadRequest(c, "invalid task id")
		return
	}

	var in model.UpdateTaskInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, "invalid request body")
		return
	}

	if details := validator.Validate(in); details != nil {
		apierror.BadRequestWithDetails(c, "validation failed", details)
		return
	}

	task, err := h.svc.Update(c.Request.Context(), id, userID, in)
	if errors.Is(err, service.ErrNotFound) {
		apierror.NotFound(c, "task")
		return
	}
	if err != nil {
		apierror.Internal(c)
		return
	}

	c.JSON(http.StatusOK, task)
}

func (h *TaskHandler) Delete(c *gin.Context) {
	userID := mustUserID(c)

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apierror.BadRequest(c, "invalid task id")
		return
	}

	err = h.svc.Delete(c.Request.Context(), id, userID)
	if errors.Is(err, service.ErrNotFound) {
		apierror.NotFound(c, "task")
		return
	}
	if err != nil {
		apierror.Internal(c)
		return
	}

	c.Status(http.StatusNoContent)
}

func mustUserID(c *gin.Context) uuid.UUID {
	v, _ := c.Get("user_id")
	id, _ := v.(uuid.UUID)
	return id
}

func queryInt(c *gin.Context, key string, fallback int) int {
	s := c.Query(key)
	if s == "" {
		return fallback
	}
	n, err := strconv.Atoi(s)
	if err != nil || n < 1 {
		return fallback
	}
	return n
}
