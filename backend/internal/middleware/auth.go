package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/taskapp/backend/internal/apierror"
)

// AuthRequired is a placeholder replaced with the real JWT middleware in Phase 3.
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Phase 3: parse + validate JWT, set user_id and role in context.
		// Until then, all protected routes return 401.
		apierror.Unauthorized(c, "authentication required")
		c.Abort()
	}
}
