package routes

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"server/internal/db"
	"server/internal/middlewares"
	"server/internal/models"
)

type registerReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name"`
}

type loginReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type changePwdReq struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

type forgotReq struct {
	Email string `json:"email" binding:"required,email"`
}

type resetReq struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

func VendorRoutes(r *gin.Engine) {
	// 自動建表（僅限開發期；正式環境用 migration）
	db.DB.AutoMigrate(&models.Vendor{}, &models.VendorPasswordReset{})

	grp := r.Group("/api/vendor")

	// 註冊
	grp.POST("/register", func(c *gin.Context) {
		var req registerReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT"})
			return
		}
		var count int64
		db.DB.Model(&models.Vendor{}).Where("email = ?", req.Email).Count(&count)
		if count > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "EMAIL_EXISTS"})
			return
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
		v := &models.Vendor{
			ID:           uuid.NewString(),
			Email:        req.Email,
			Name:         req.Name,
			PasswordHash: string(hash),
			IsActive:     true,
		}
		if err := db.DB.Create(v).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DB_ERROR"})
			return
		}
		issueVendorToken(c, v)
		c.JSON(http.StatusOK, gin.H{"id": v.ID, "email": v.Email, "name": v.Name})
	})

	// 登入
	grp.POST("/login", func(c *gin.Context) {
		var req loginReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT"})
			return
		}
		var v models.Vendor
		if err := db.DB.Where("email = ? AND is_active = 1", req.Email).First(&v).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CREDENTIALS"})
			return
		}
		if bcrypt.CompareHashAndPassword([]byte(v.PasswordHash), []byte(req.Password)) != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CREDENTIALS"})
			return
		}
		issueVendorToken(c, &v)
		c.JSON(http.StatusOK, gin.H{"id": v.ID, "email": v.Email, "name": v.Name})
	})

	// 登出
	grp.POST("/logout", func(c *gin.Context) {
		c.SetCookie("vtoken", "", -1, "/", "", false, true)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// 取得當前廠商
	grp.GET("/me", middlewares.RequireVendor(), func(c *gin.Context) {
		vendorID := c.GetString("vendor_id")
		var v models.Vendor
		if err := db.DB.Select("id,email,name").First(&v, "id = ?", vendorID).Error; err != nil {
			c.JSON(http.StatusOK, nil)
			return
		}
		c.JSON(http.StatusOK, v)
	})

	// 更改密碼（需登入）
	grp.POST("/change-password", middlewares.RequireVendor(), func(c *gin.Context) {
		vendorID := c.GetString("vendor_id")
		var req changePwdReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT"})
			return
		}
		var v models.Vendor
		if err := db.DB.First(&v, "id = ?", vendorID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHENTICATED"})
			return
		}
		if bcrypt.CompareHashAndPassword([]byte(v.PasswordHash), []byte(req.OldPassword)) != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "WRONG_OLD_PASSWORD"})
			return
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
		if err := db.DB.Model(&v).Updates(map[string]any{
			"password_hash": string(hash),
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DB_ERROR"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// 忘記密碼：產生 token（實務要寄信；開發先回 token）
	grp.POST("/password/forgot", func(c *gin.Context) {
		var req forgotReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT"})
			return
		}
		var v models.Vendor
		if err := db.DB.First(&v, "email = ?", req.Email).Error; err != nil {
			c.JSON(http.StatusOK, gin.H{"ok": true})
			return
		}
		token := uuid.NewString()
		exp := time.Now().Add(30 * time.Minute)
		reset := &models.VendorPasswordReset{
			ID:        uuid.NewString(),
			VendorID:  v.ID,
			Token:     token,
			ExpiresAt: exp,
		}
		if err := db.DB.Create(reset).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DB_ERROR"})
			return
		}
		// TODO: 寄送含 token 的重設連結（/vendor/reset?token=...）
		c.JSON(http.StatusOK, gin.H{"ok": true, "token": token}) // 開發期先回 token
	})

	// 重設密碼
	grp.POST("/password/reset", func(c *gin.Context) {
		var req resetReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT"})
			return
		}
		var pr models.VendorPasswordReset
		if err := db.DB.First(&pr, "token = ?", req.Token).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_TOKEN"})
			return
		}
		if time.Now().After(pr.ExpiresAt) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "TOKEN_EXPIRED"})
			return
		}
		var v models.Vendor
		if err := db.DB.First(&v, "id = ?", pr.VendorID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_VENDOR"})
			return
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
		if err := db.DB.Model(&v).Update("password_hash", string(hash)).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DB_ERROR"})
			return
		}
		// 使此 token 失效
		db.DB.Delete(&pr)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
}

func issueVendorToken(c *gin.Context, v *models.Vendor) {
	secret := os.Getenv("JWT_SECRET")
	expiresStr := os.Getenv("JWT_EXPIRES")
	if expiresStr == "" {
		expiresStr = "168h"
	}
	dur, _ := time.ParseDuration(expiresStr)
	claims := jwt.MapClaims{
		"id":    v.ID,
		"email": v.Email,
		"role":  "vendor",
		"exp":   time.Now().Add(dur).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, _ := token.SignedString([]byte(secret))

	// 設置 HttpOnly cookie（也支援前端用 Authorization: Bearer）
	c.SetCookie("vtoken", t, int(dur.Seconds()), "/", "", false, true)
}
