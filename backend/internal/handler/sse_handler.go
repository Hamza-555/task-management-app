package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/taskapp/backend/internal/sse"
)

type SSEHandler struct {
	broadcaster *sse.Broadcaster
}

func NewSSEHandler(b *sse.Broadcaster) *SSEHandler {
	return &SSEHandler{broadcaster: b}
}

func (h *SSEHandler) Events(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")
	c.Writer.WriteHeader(http.StatusOK)

	client := h.broadcaster.Subscribe(userID.String())
	defer h.broadcaster.Unsubscribe(client)

	// initial ping
	fmt.Fprintf(c.Writer, "event: ping\ndata: {}\n\n")
	c.Writer.Flush()

	ctx := c.Request.Context()
	for {
		select {
		case ev, ok := <-h.broadcaster.Chan(client):
			if !ok {
				return
			}
			data, err := json.Marshal(ev)
			if err != nil {
				continue
			}
			fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", ev.Type, data)
			c.Writer.Flush()
		case <-ctx.Done():
			return
		}
	}
}
