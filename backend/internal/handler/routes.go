package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/taskapp/backend/internal/config"
	"github.com/taskapp/backend/internal/middleware"
	"github.com/taskapp/backend/internal/repository"
	"github.com/taskapp/backend/internal/service"
	"github.com/taskapp/backend/internal/sse"
)

type Router struct {
	pool *pgxpool.Pool
	cfg  *config.Config
}

func NewRouter(pool *pgxpool.Pool, cfg *config.Config) *Router {
	return &Router{pool: pool, cfg: cfg}
}

func (r *Router) Register(engine *gin.Engine, allowedOrigins []string) {
	engine.Use(middleware.Logger())
	engine.Use(middleware.CORS(allowedOrigins))

	engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	taskRepo := repository.NewTaskRepository(r.pool)
	userRepo := repository.NewUserRepository(r.pool)
	activityRepo := repository.NewActivityRepository(r.pool)
	attachmentRepo := repository.NewAttachmentRepository(r.pool)

	broadcaster := sse.New()

	taskSvc := service.NewTaskService(taskRepo, activityRepo, broadcaster)
	authSvc := service.NewAuthService(userRepo, r.cfg.JWT.Secret, r.cfg.JWT.ExpiryHours)
	activitySvc := service.NewActivityService(activityRepo)

	taskHandler := NewTaskHandler(taskSvc)
	authHandler := NewAuthHandler(authSvc)
	sseHandler := NewSSEHandler(broadcaster)
	adminHandler := NewAdminHandler(taskSvc)
	activityHandler := NewActivityHandler(activitySvc)
	attachmentHandler := NewAttachmentHandler(attachmentRepo)

	v1 := engine.Group("/api/v1")

	// public auth routes
	authRoutes := v1.Group("/auth")
	{
		authRoutes.POST("/signup", authHandler.Signup)
		authRoutes.POST("/login", authHandler.Login)
	}

	// protected routes
	protected := v1.Group("")
	protected.Use(middleware.AuthRequired(r.cfg.JWT.Secret))
	{
		protected.GET("/auth/me", authHandler.Me)

		tasks := protected.Group("/tasks")
		tasks.POST("", taskHandler.Create)
		tasks.GET("", taskHandler.List)
		tasks.GET("/stats", taskHandler.Stats)
		tasks.GET("/events", sseHandler.Events)
		tasks.GET("/:id", taskHandler.GetByID)
		tasks.PATCH("/:id", taskHandler.Update)
		tasks.DELETE("/:id", taskHandler.Delete)
		tasks.POST("/:id/attachments", attachmentHandler.Upload)
		tasks.GET("/:id/attachments", attachmentHandler.List)
		tasks.GET("/:id/attachments/:attid", attachmentHandler.Download)
		tasks.DELETE("/:id/attachments/:attid", attachmentHandler.Delete)

		protected.GET("/activity", activityHandler.List)

		admin := protected.Group("/admin")
		admin.Use(middleware.AdminRequired())
		admin.GET("/tasks", adminHandler.ListTasks)
	}
}
