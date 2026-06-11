package sse

import (
	"encoding/json"
	"sync"
)

type EventType string

const (
	EventTaskCreated EventType = "task.created"
	EventTaskUpdated EventType = "task.updated"
	EventTaskDeleted EventType = "task.deleted"
)

type Event struct {
	Type    EventType   `json:"type"`
	Payload interface{} `json:"payload"`
}

type Client struct {
	UserID string
	ch     chan Event
}

type Broadcaster struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]struct{}
}

func New() *Broadcaster {
	return &Broadcaster{clients: make(map[string]map[*Client]struct{})}
}

func (b *Broadcaster) Subscribe(userID string) *Client {
	c := &Client{UserID: userID, ch: make(chan Event, 16)}
	b.mu.Lock()
	if b.clients[userID] == nil {
		b.clients[userID] = make(map[*Client]struct{})
	}
	b.clients[userID][c] = struct{}{}
	b.mu.Unlock()
	return c
}

func (b *Broadcaster) Unsubscribe(c *Client) {
	b.mu.Lock()
	if group := b.clients[c.UserID]; group != nil {
		delete(group, c)
		if len(group) == 0 {
			delete(b.clients, c.UserID)
		}
	}
	b.mu.Unlock()
	close(c.ch)
}

func (b *Broadcaster) Emit(userID string, ev Event) {
	b.mu.RLock()
	clients := b.clients[userID]
	b.mu.RUnlock()
	for c := range clients {
		select {
		case c.ch <- ev:
		default:
		}
	}
}

func (b *Broadcaster) Chan(c *Client) <-chan Event {
	return c.ch
}

func FormatEvent(ev Event) ([]byte, error) {
	return json.Marshal(ev)
}
