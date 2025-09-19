package middleware

import (
	"github.com/gin-gonic/gin"
)

func CORS(origins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		o := "*"
		if len(origins) > 0 { o = origins[0] }
		c.Header("Access-Control-Allow-Origin", o)
		c.Header("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		if c.Request.Method == "OPTIONS" { c.AbortWithStatus(204); return }
		c.Next()
	}
}
