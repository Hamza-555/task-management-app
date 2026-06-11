package model

import (
	"time"

	"github.com/google/uuid"
)

type Attachment struct {
	ID          uuid.UUID `json:"id"`
	TaskID      uuid.UUID `json:"task_id"`
	UserID      uuid.UUID `json:"user_id"`
	Filename    string    `json:"filename"`
	ContentType string    `json:"content_type"`
	Size        int       `json:"size"`
	CreatedAt   time.Time `json:"created_at"`
}

// AttachmentWithData includes the raw bytes, only used internally (never serialised directly).
type AttachmentWithData struct {
	Attachment
	Data []byte `json:"-"`
}

const MaxAttachmentSize = 1 << 20 // 1 MB
