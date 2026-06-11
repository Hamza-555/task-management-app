package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/taskapp/backend/internal/model"
	"github.com/taskapp/backend/internal/service"
)

type AdminHandler struct {
	taskSvc *service.TaskService
}

func NewAdminHandler(taskSvc *service.TaskService) *AdminHandler {
	return &AdminHandler{taskSvc: taskSvc}
}

func (h *AdminHandler) ListTasks(c *gin.Context) {
	f := model.ListTasksFilter{
		Search:   c.Query("search"),
		SortBy:   c.Query("sort_by"),
		Page:     queryInt(c, "page", 1),
		PageSize: queryInt(c, "page_size", 20),
	}
	if s := c.Query("status"); s != "" {
		status := model.TaskStatus(s)
		f.Status = &status
	}

	result, err := h.taskSvc.ListAll(c.Request.Context(), f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list tasks"})
		return
	}

	c.JSON(http.StatusOK, result)
}
