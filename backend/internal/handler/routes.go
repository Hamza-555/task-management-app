package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/taskapp/backend/internal/middleware"
	"github.com/taskapp/backend/internal/repository"
	"github.com/taskapp/backend/internal/service"
)

type Router struct {
	pool *pgxpool.Pool
}

func NewRouter(pool *pgxpool.Pool) *Router {
	return &Router{pool: pool}
}

func (r *Router) Register(engine *gin.Engine, allowedOrigins []string) {
	engine.Use(middleware.Logger())
	engine.Use(middleware.CORS(allowedOrigins))

	engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// wire up dependencies
	taskRepo := repository.NewTaskRepository(r.pool)
	taskSvc := service.NewTaskService(taskRepo)
	taskHandler := NewTaskHandler(taskSvc)

	v1 := engine.Group("/api/v1")

	// auth routes registered in Phase 3
	// task routes — protected by auth middleware (stubbed until Phase 3)
	tasks := v1.Group("/tasks")
	tasks.Use(middleware.AuthRequired())
	{
		tasks.POST("", taskHandler.Create)
		tasks.GET("", taskHandler.List)
		tasks.GET("/:id", taskHandler.GetByID)
		tasks.PATCH("/:id", taskHandler.Update)
		tasks.DELETE("/:id", taskHandler.Delete)
	}
}
