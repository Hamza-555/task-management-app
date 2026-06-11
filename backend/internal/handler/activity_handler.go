package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/taskapp/backend/internal/service"
)

type ActivityHandler struct {
	activitySvc *service.ActivityService
}

func NewActivityHandler(svc *service.ActivityService) *ActivityHandler {
	return &ActivityHandler{activitySvc: svc}
}

func (h *ActivityHandler) List(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)
	limit := queryInt(c, "limit", 20)

	logs, err := h.activitySvc.ListByUser(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch activity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}
