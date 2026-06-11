package apierror

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error   string            `json:"error"`
	Details map[string]string `json:"details,omitempty"`
}

func BadRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, ErrorResponse{Error: msg})
}

func BadRequestWithDetails(c *gin.Context, msg string, details map[string]string) {
	c.JSON(http.StatusBadRequest, ErrorResponse{Error: msg, Details: details})
}

func Unauthorized(c *gin.Context, msg string) {
	c.JSON(http.StatusUnauthorized, ErrorResponse{Error: msg})
}

func Forbidden(c *gin.Context) {
	c.JSON(http.StatusForbidden, ErrorResponse{Error: "forbidden"})
}

func NotFound(c *gin.Context, resource string) {
	c.JSON(http.StatusNotFound, ErrorResponse{Error: resource + " not found"})
}

func Conflict(c *gin.Context, msg string) {
	c.JSON(http.StatusConflict, ErrorResponse{Error: msg})
}

func Internal(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
}
