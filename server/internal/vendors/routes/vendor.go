// server/internal/vendors/routes/vendor.go
package routes

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/vendors/models"
)

// 統一成功/錯誤回應（確保前端永遠拿到 JSON）
func ok(c *gin.Context, payload gin.H) {
	if payload == nil {
		payload = gin.H{}
	}
	payload["ok"] = true
	c.JSON(http.StatusOK, payload)
}

func fail(c *gin.Context, code int, msg string) {
	c.JSON(code, gin.H{"ok": false, "error": msg})
}

func RegisterVendorRoutes(r *gin.Engine, gdb *gorm.DB) {
	grp := r.Group("/api/vendor")

	// 註冊
	grp.POST("/register", func(c *gin.Context) {
		var req struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required,min=8"`
			Name     string `json:"name"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			fail(c, http.StatusBadRequest, "INVALID_INPUT"); return
		}
		var count int64
		gdb.Model(&models.Vendor{}).Where("email = ?", req.Email).Count(&count)
		if count > 0 {
			fail(c, http.StatusConflict, "EMAIL_EXISTS"); return
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
		v := &models.Vendor{
			ID:           uuid.NewString(),
			Email:        req.Email,
			Name:         req.Name,
			PasswordHash: string(hash),
			IsActive:     true,
		}
		if err := gdb.Create(v).Error; err != nil {
			fail(c, http.StatusInternalServerError, "DB_ERROR"); return
		}
		issueVendorToken(c, v)
		ok(c, gin.H{"vendor": gin.H{"id": v.ID, "email": v.Email, "name": v.Name}})
	})

	// 登入
	grp.POST("/login", func(c *gin.Context) {
		var req struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			fail(c, http.StatusBadRequest, "INVALID_INPUT"); return
		}
		var v models.Vendor
		if err := gdb.Where("email = ? AND is_active = 1", req.Email).First(&v).Error; err != nil {
			fail(c, http.StatusUnauthorized, "INVALID_CREDENTIALS"); return
		}
		if bcrypt.CompareHashAndPassword([]byte(v.PasswordHash), []byte(req.Password)) != nil {
			fail(c, http.StatusUnauthorized, "INVALID_CREDENTIALS"); return
		}
		issueVendorToken(c, &v)
		ok(c, gin.H{"vendor": gin.H{"id": v.ID, "email": v.Email, "name": v.Name}})
	})

	// 登出
	grp.POST("/logout", func(c *gin.Context) {
		// 立即失效 cookie
		c.SetCookie("vtoken", "", -1, "/", "", isSecure(), true)
		ok(c, nil)
	})

	// 簡易驗證中介（僅此檔使用，不影響你的全局 middleware）
	requireVendor := func(c *gin.Context) {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {                      // ★ 新增這兩行
			secret = "dev-secret"
		}
		tokenStr, _ := c.Cookie("vtoken")
		if tokenStr == "" {
			if auth := c.GetHeader("Authorization"); len(auth) > 7 && auth[:7] == "Bearer " {
			tokenStr = auth[7:]
			}
		}
		if tokenStr == "" {
			fail(c, http.StatusUnauthorized, "UNAUTHENTICATED"); c.Abort(); return
		}
		claims := jwt.MapClaims{}
		parsed, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !parsed.Valid || claims["role"] != "vendor" {
			fail(c, http.StatusUnauthorized, "INVALID_TOKEN"); c.Abort(); return
		}
		c.Set("vendor_id", claims["id"])
		c.Next()
		}

	// 取得自己
	grp.GET("/me", requireVendor, func(c *gin.Context) {
		id, _ := c.Get("vendor_id")
		var v models.Vendor
		if err := gdb.Select("id,email,name").First(&v, "id = ?", id).Error; err != nil {
			// 還是回 200，但 vendor = null
			ok(c, gin.H{"vendor": nil}); return
		}
		ok(c, gin.H{"vendor": v})
	})

	// 更改密碼
	grp.POST("/change-password", requireVendor, func(c *gin.Context) {
		id, _ := c.Get("vendor_id")
		var req struct {
			OldPassword string `json:"oldPassword" binding:"required"`
			NewPassword string `json:"newPassword" binding:"required,min=8"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			fail(c, http.StatusBadRequest, "INVALID_INPUT"); return
		}
		var v models.Vendor
		if err := gdb.First(&v, "id = ?", id).Error; err != nil {
			fail(c, http.StatusUnauthorized, "UNAUTHENTICATED"); return
		}
		if bcrypt.CompareHashAndPassword([]byte(v.PasswordHash), []byte(req.OldPassword)) != nil {
			fail(c, http.StatusBadRequest, "WRONG_OLD_PASSWORD"); return
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
		if err := gdb.Model(&v).Update("password_hash", string(hash)).Error; err != nil {
			fail(c, http.StatusInternalServerError, "DB_ERROR"); return
		}
		ok(c, nil)
	})

	// 忘記密碼（開發期直接回 token，正式環境應寄信）
	grp.POST("/password/forgot", func(c *gin.Context) {
		var req struct{ Email string `json:"email" binding:"required,email"` }
		if err := c.ShouldBindJSON(&req); err != nil {
			fail(c, http.StatusBadRequest, "INVALID_INPUT"); return
		}
		var v models.Vendor
		if err := gdb.First(&v, "email = ?", req.Email).Error; err != nil {
			// 隱匿存在性：即使沒有該帳號也回 ok=true
			ok(c, nil); return
		}
		token := uuid.NewString()
		reset := &models.VendorPasswordReset{
			ID:        uuid.NewString(),
			VendorID:  v.ID,
			Token:     token,
			ExpiresAt: time.Now().Add(30 * time.Minute),
		}
		if err := gdb.Create(reset).Error; err != nil {
			fail(c, http.StatusInternalServerError, "DB_ERROR"); return
		}
		// 開發模式：一併回 token，方便前端測試；正式環境應改為寄信
		ok(c, gin.H{"token": token})
	})

	// 重設密碼
	grp.POST("/password/reset", func(c *gin.Context) {
		var req struct {
			Token       string `json:"token" binding:"required"`
			NewPassword string `json:"newPassword" binding:"required,min=8"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			fail(c, http.StatusBadRequest, "INVALID_INPUT"); return
		}
		var pr models.VendorPasswordReset
		if err := gdb.First(&pr, "token = ?", req.Token).Error; err != nil {
			fail(c, http.StatusBadRequest, "INVALID_TOKEN"); return
		}
		if time.Now().After(pr.ExpiresAt) {
			fail(c, http.StatusBadRequest, "TOKEN_EXPIRED"); return
		}
		var v models.Vendor
		if err := gdb.First(&v, "id = ?", pr.VendorID).Error; err != nil {
			fail(c, http.StatusBadRequest, "INVALID_VENDOR"); return
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
		if err := gdb.Model(&v).Update("password_hash", string(hash)).Error; err != nil {
			fail(c, http.StatusInternalServerError, "DB_ERROR"); return
		}
		gdb.Delete(&pr)
		ok(c, nil)
	})
}

func issueVendorToken(c *gin.Context, v *models.Vendor) {
  secret := os.Getenv("JWT_SECRET")
  if secret == "" { secret = "dev-secret" }

  ttl := 7 * 24 * time.Hour
  claims := jwt.MapClaims{
    "id": v.ID, "email": v.Email, "role": "vendor",
    "exp": time.Now().Add(ttl).Unix(),
  }
  token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
  signed, _ := token.SignedString([]byte(secret))

  // 明確設置 Cookie 屬性（本地非 https → Secure=false；SameSite=Lax）
  http.SetCookie(c.Writer, &http.Cookie{
    Name:     "vtoken",
    Value:    signed,
    Path:     "/",
    MaxAge:   int(ttl.Seconds()),
    HttpOnly: true,
    Secure:   os.Getenv("APP_ENV") == "production",
    SameSite: http.SameSiteLaxMode,
  })
  // 讓 gin 知道我們已寫 header
  c.Writer.Header().Add("Vary", "Cookie")
}

// isSecure：本地開發用 http，正式用 https
func isSecure() bool {
	// 你可以換成讀 ENV：APP_ENV=production
	return os.Getenv("APP_ENV") == "production"
}
