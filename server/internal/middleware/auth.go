package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func RequireVendor() gin.HandlerFunc {
	secret := os.Getenv("JWT_SECRET")
	return func(c *gin.Context) {
		tokenStr := c.GetHeader("Authorization")
		if strings.HasPrefix(tokenStr, "Bearer ") {
			tokenStr = strings.TrimPrefix(tokenStr, "Bearer ")
		} else if cookie, err := c.Cookie("vtoken"); err == nil {
			tokenStr = cookie
		}
		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHENTICATED"})
			return
		}
		claims := jwt.MapClaims{}
		_, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "INVALID_TOKEN"})
			return
		}
		if role, _ := claims["role"].(string); role != "vendor" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "NOT_VENDOR"})
			return
		}
		c.Set("vendor_id", claims["id"])
		c.Next()
	}
}
