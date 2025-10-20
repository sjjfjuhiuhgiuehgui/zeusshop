package routes

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/product"
)

const ctxKeyVendorID = "vendorID"

// 供 main.go 呼叫：廠商商品管理（需登入）
func RegisterVendorProductRoutes(r *gin.Engine, db *gorm.DB) {
	grp := r.Group("/api/vendor")

	// 上傳圖片（需登入）: POST /api/vendor/upload
	grp.POST("/upload", requireVendor, func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "NO_FILE"})
			return
		}
		ext := strings.ToLower(filepath.Ext(file.Filename))
		if ext == "" {
			ext = ".jpg"
		}
		filename := time.Now().Format("20060102_150405") + "_" + uuid.NewString() + ext

		// 確保目錄存在
		dst := filepath.Join("uploads", "vendor", filename)
		if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "MKDIR_FAIL"})
			return
		}

		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "UPLOAD_FAIL"})
			return
		}
		// 對外 URL（main.go 有 r.Static("/uploads", "./uploads")）
		url := "/uploads/vendor/" + filename
		c.JSON(http.StatusOK, gin.H{"ok": true, "url": url})
	})

	// 新增商品（自動上架）
	grp.POST("/products", requireVendor, func(c *gin.Context) {
		vendorID := c.GetString(ctxKeyVendorID)

		var req struct {
			Name        string `json:"name"`
			Category    string `json:"category"`
			Price       int64  `json:"price"` // 與 model 對齊
			Stock       int    `json:"stock"`
			Description string `json:"description"`
			ImageURL    string `json:"imageUrl"`
			Spec        string `json:"spec"`
			IsActive    *bool  `json:"isActive"` // 允許覆寫
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "BAD_JSON"})
			return
		}

		// 必填檢查
		if strings.TrimSpace(req.Name) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "NAME_REQUIRED"})
			return
		}
		cat := strings.TrimSpace(req.Category)
		if cat == "" {
			c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "CATEGORY_REQUIRED"})
			return
		}
		switch strings.ToLower(cat) {
		case "home", "3c", "beauty":
		default:
			c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "INVALID_CATEGORY"})
			return
		}

		active := true
		if req.IsActive != nil {
			active = *req.IsActive
		}

		p := &product.Product{
			Name:        req.Name,
			Category:    normalizeCategory(cat),
			Price:       req.Price,
			Stock:       req.Stock,
			Description: req.Description,
			ImageURL:    req.ImageURL,
			Spec:        req.Spec,
			VendorID:    vendorID,

			// ★ 自動上架（也可用 isActive 覆寫）
			Visible:  active,
			IsActive: active,
		}

		if err := db.WithContext(c.Request.Context()).Create(p).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "DB_CREATE_FAIL"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"ok": true, "product": p})
	})

	// 取得我的商品列表（登入廠商）
	grp.GET("/products", requireVendor, func(c *gin.Context) {
		vendorID := c.GetString(ctxKeyVendorID)
		var rows []product.Product
		if err := db.WithContext(c.Request.Context()).
			Where("vendor_id = ?", vendorID).
			Order("id DESC").
			Find(&rows).Error; err != nil {
		 c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "DB_ERROR"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true, "products": rows})
	})

	// 單筆讀取（登入廠商，僅能看自己的）
	grp.GET("/products/:id", requireVendor, func(c *gin.Context) {
		vendorID := c.GetString(ctxKeyVendorID)
		var p product.Product
		if err := db.WithContext(c.Request.Context()).
			Where("vendor_id = ?", vendorID).
			First(&p, c.Param("id")).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "NOT_FOUND"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "DB_ERROR"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true, "product": p})
	})

	// 更新（可切換上/下架）
	grp.PUT("/products/:id", requireVendor, func(c *gin.Context) {
		vendorID := c.GetString(ctxKeyVendorID)

		var p product.Product
		if err := db.WithContext(c.Request.Context()).
			Where("vendor_id = ?", vendorID).
			First(&p, c.Param("id")).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "NOT_FOUND"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "DB_ERROR"})
			return
		}

		var req struct {
			Name        *string `json:"name"`
			Category    *string `json:"category"`
			Price       *int64  `json:"price"`
			Stock       *int    `json:"stock"`
			Description *string `json:"description"`
			ImageURL    *string `json:"imageUrl"`
			Spec        *string `json:"spec"`
			Visible     *bool   `json:"visible"`
			IsActive    *bool   `json:"isActive"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "BAD_JSON"})
			return
		}

		if req.Name != nil {
			p.Name = *req.Name
		}
		if req.Category != nil {
			cat := strings.TrimSpace(*req.Category)
			if cat != "" {
				switch strings.ToLower(cat) {
				case "home", "3c", "beauty":
					p.Category = normalizeCategory(cat)
				default:
					c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": "INVALID_CATEGORY"})
					return
				}
			}
		}
		if req.Price != nil {
			p.Price = *req.Price
		}
		if req.Stock != nil {
			p.Stock = *req.Stock
		}
		if req.Description != nil {
			p.Description = *req.Description
		}
		if req.ImageURL != nil {
			p.ImageURL = *req.ImageURL
		}
		if req.Spec != nil {
			p.Spec = *req.Spec
		}
		if req.Visible != nil {
			p.Visible = *req.Visible
		}
		if req.IsActive != nil {
			p.IsActive = *req.IsActive
		}

		if err := db.WithContext(c.Request.Context()).Save(&p).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "DB_UPDATE_FAIL"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true, "product": p})
	})

	// 刪除（僅限自己）
	grp.DELETE("/products/:id", requireVendor, func(c *gin.Context) {
		vendorID := c.GetString(ctxKeyVendorID)
		if err := db.WithContext(c.Request.Context()).
			Where("vendor_id = ?", vendorID).
			Delete(&product.Product{}, c.Param("id")).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "DB_DELETE_FAIL"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
}

// ==== helpers ====

// 讀取 vtoken cookie 驗證，寫入 vendorID 到 context
func requireVendor(c *gin.Context) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "INVALID_TOKEN"})
		return
	}
	tokenStr, err := c.Cookie("vtoken")
	if err != nil || tokenStr == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "INVALID_TOKEN"})
		return
	}
	tkn, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil || !tkn.Valid {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "INVALID_TOKEN"})
		return
	}
	claims, _ := tkn.Claims.(jwt.MapClaims)
	idRaw := claims["id"]
	idStr, _ := idRaw.(string)
	if idStr == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "INVALID_TOKEN"})
		return
	}
	c.Set(ctxKeyVendorID, idStr)
	c.Next()
}

func normalizeCategory(cat string) string {
	switch strings.ToLower(cat) {
	case "3c":
		return "3C"
	case "home":
		return "home"
	case "beauty":
		return "beauty"
	default:
		return cat
	}
}
