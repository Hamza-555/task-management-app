package handler

import (
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/taskapp/backend/internal/apierror"
	"github.com/taskapp/backend/internal/model"
	"github.com/taskapp/backend/internal/repository"
)

type AttachmentHandler struct {
	repo *repository.AttachmentRepository
}

func NewAttachmentHandler(r *repository.AttachmentRepository) *AttachmentHandler {
	return &AttachmentHandler{repo: r}
}

func (h *AttachmentHandler) Upload(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apierror.BadRequest(c, "invalid task id")
		return
	}

	if err := c.Request.ParseMultipartForm(model.MaxAttachmentSize + 512); err != nil {
		apierror.BadRequest(c, "request too large")
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		apierror.BadRequest(c, "file field required")
		return
	}
	defer file.Close()

	if header.Size > model.MaxAttachmentSize {
		apierror.BadRequest(c, fmt.Sprintf("file exceeds %d bytes limit", model.MaxAttachmentSize))
		return
	}

	data, err := io.ReadAll(file)
	if err != nil {
		apierror.Internal(c)
		return
	}

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	att, err := h.repo.Create(c.Request.Context(), userID, taskID, header.Filename, contentType, data)
	if err != nil {
		apierror.Internal(c)
		return
	}

	c.JSON(http.StatusCreated, att)
}

func (h *AttachmentHandler) List(c *gin.Context) {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		apierror.BadRequest(c, "invalid task id")
		return
	}

	atts, err := h.repo.ListByTask(c.Request.Context(), taskID)
	if err != nil {
		apierror.Internal(c)
		return
	}

	if atts == nil {
		atts = []model.Attachment{}
	}
	c.JSON(http.StatusOK, gin.H{"attachments": atts})
}

func (h *AttachmentHandler) Download(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	attID, err := uuid.Parse(c.Param("attid"))
	if err != nil {
		apierror.BadRequest(c, "invalid attachment id")
		return
	}

	att, err := h.repo.GetData(c.Request.Context(), attID, userID)
	if errors.Is(err, repository.ErrNotFound) {
		apierror.NotFound(c)
		return
	}
	if err != nil {
		apierror.Internal(c)
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, att.Filename))
	c.Data(http.StatusOK, att.ContentType, att.Data)
}

func (h *AttachmentHandler) Delete(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	attID, err := uuid.Parse(c.Param("attid"))
	if err != nil {
		apierror.BadRequest(c, "invalid attachment id")
		return
	}

	err = h.repo.Delete(c.Request.Context(), attID, userID)
	if errors.Is(err, repository.ErrNotFound) {
		apierror.NotFound(c)
		return
	}
	if err != nil {
		apierror.Internal(c)
		return
	}

	c.Status(http.StatusNoContent)
}
