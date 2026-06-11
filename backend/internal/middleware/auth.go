package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/taskapp/backend/internal/apierror"
	"github.com/taskapp/backend/internal/auth"
)

func AuthRequired(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var token string
		if header := c.GetHeader("Authorization"); strings.HasPrefix(header, "Bearer ") {
			token = strings.TrimPrefix(header, "Bearer ")
		} else if cookie, err := c.Cookie("auth_token"); err == nil && cookie != "" {
			token = cookie
		}

		if token == "" {
			apierror.Unauthorized(c, "missing or malformed authorization header")
			c.Abort()
			return
		}
		claims, err := auth.ParseToken(token, jwtSecret)
		if err != nil {
			apierror.Unauthorized(c, "invalid or expired token")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}

func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("user_role")
		if role != "admin" {
			apierror.Forbidden(c)
			c.Abort()
			return
		}
		c.Next()
	}
}
