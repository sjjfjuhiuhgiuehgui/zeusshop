package routes

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"

	p "github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/product"
)

// 這裡複用一份簡易 vendor 驗證（和 vendor.go 的邏輯一致）
// 若你已經有共用的 middleware，可改為使用共用版本。
func requireVendorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "dev-secret"
		}
		tokenStr, _ := c.Cookie("vtoken")
		if tokenStr == "" {
			if auth := c.GetHeader("Authorization"); len(auth) > 7 && auth[:7] == "Bearer " {
				tokenStr = auth[7:]
			}
		}
		if tokenStr == "" {
			c.AbortWithStatusJSON(401, gin.H{"ok": false, "error": "UNAUTHENTICATED"})
			return
		}
		claims := jwt.MapClaims{}
		parsed, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !parsed.Valid || claims["role"] != "vendor" {
			c.AbortWithStatusJSON(401, gin.H{"ok": false, "error": "INVALID_TOKEN"})
			return
		}
		c.Set("vendor_id", claims["id"])
		c.Next()
	}
}

func RegisterVendorProductRoutes(r *gin.Engine, gdb *gorm.DB) {
	grp := r.Group("/api/vendor")
	grp.Use(requireVendorMiddleware())

	// 1) 上傳單張圖片，回傳 URL（/uploads/xxx）
	grp.POST("/uploads", func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(400, gin.H{"ok": false, "error": "FILE_REQUIRED"})
			return
		}
		_ = os.MkdirAll("uploads", 0o755)
		ext := filepath.Ext(file.Filename)
		base := strings.TrimSuffix(file.Filename, ext)
		base = strings.ReplaceAll(base, " ", "_")
		name := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), base, ext)
		dst := filepath.Join("uploads", name)
		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(500, gin.H{"ok": false, "error": "SAVE_FAILED"})
			return
		}
		c.JSON(200, gin.H{"ok": true, "url": "/uploads/" + name})
	})

	// 2) 新增商品（含多圖）
	grp.POST("/products", func(c *gin.Context) {
		vid := c.GetString("vendor_id")

		var req struct {
			Name        string   `json:"name" binding:"required"`        // ← 對齊 model.go
			Description string   `json:"description"`                    // ← 對齊 model.go
			Spec        string   `json:"spec"`                           // 建議傳 JSON 字串
			Category    string   `json:"category"`
			Price       int64    `json:"price" binding:"required"`
			Stock       int      `json:"stock" binding:"required"`       // ← 對齊 model.go（int）
			IsActive    bool     `json:"isActive"`                       // ← 對齊 model.go
			Visible     bool     `json:"visible"`     // ★ 新增
			Images      []string `json:"images"`                         // 上傳後得到的 URL 陣列
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"ok": false, "error": "INVALID_INPUT"})
			return
		}

		prd := &p.Product{
			Name:        req.Name,
			Description: req.Description,
			Spec:        req.Spec,
			Category:    req.Category,
			Price:       req.Price,
			Stock:       req.Stock,
			IsActive:    req.IsActive,
			Visible:     req.Visible,
			VendorID:    vid,
		}
		if err := gdb.Create(prd).Error; err != nil {
			c.JSON(500, gin.H{"ok": false, "error": "DB_ERROR"})
			return
		}

		for i, url := range req.Images {
			if url == "" {
				continue
			}
			gdb.Create(&p.ProductImage{
				ProductID: prd.ID,
				URL:       url,
				Sort:      i,
			})
			// 也可以將第一張當封面：if i==0 { gdb.Model(prd).Update("image_url", url) }
		}

		c.JSON(200, gin.H{"ok": true, "product": prd})
	})

	// 3) 取自己上架的商品列表
	grp.GET("/products", func(c *gin.Context) {
		vid := c.GetString("vendor_id")
		var list []p.Product
		if err := gdb.Where("vendor_id = ?", vid).Order("id DESC").Find(&list).Error; err != nil {
			c.JSON(500, gin.H{"ok": false, "error": "DB_ERROR"})
			return
		}
		c.JSON(200, gin.H{"ok": true, "items": list})
	})

	// 4) 取單一商品（含圖片）
	grp.GET("/products/:id", func(c *gin.Context) {
		vid := c.GetString("vendor_id")
		var prd p.Product
		if err := gdb.Where("id = ? AND vendor_id = ?", c.Param("id"), vid).First(&prd).Error; err != nil {
			c.JSON(404, gin.H{"ok": false, "error": "NOT_FOUND"})
			return
		}
		var imgs []p.ProductImage
		gdb.Where("product_id = ?", prd.ID).Order("sort ASC, id ASC").Find(&imgs)
		c.JSON(200, gin.H{"ok": true, "product": prd, "images": imgs})
	})

	// 5) 更新商品（含圖片覆蓋）
	grp.PUT("/products/:id", func(c *gin.Context) {
		vid := c.GetString("vendor_id")
		var prd p.Product
		if err := gdb.Where("id = ? AND vendor_id = ?", c.Param("id"), vid).First(&prd).Error; err != nil {
			c.JSON(404, gin.H{"ok": false, "error": "NOT_FOUND"})
			return
		}
		var req struct {
			Name        *string   `json:"name"`
			Description *string   `json:"description"`
			Spec        *string   `json:"spec"`
			Price       *int64    `json:"price"`
			Stock       *int      `json:"stock"`
			IsActive    *bool     `json:"isActive"`
			Images      *[]string `json:"images"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"ok": false, "error": "INVALID_INPUT"})
			return
		}
		upd := map[string]any{}
		if req.Name != nil {
			upd["name"] = *req.Name
		}
		if req.Description != nil {
			upd["description"] = *req.Description
		}
		if req.Spec != nil {
			upd["spec"] = *req.Spec
		}
		if req.Price != nil {
			upd["price"] = *req.Price
		}
		if req.Stock != nil {
			upd["stock"] = *req.Stock
		}
		if req.IsActive != nil {
			upd["is_active"] = *req.IsActive
		}
		if len(upd) > 0 {
			if err := gdb.Model(&prd).Updates(upd).Error; err != nil {
				c.JSON(500, gin.H{"ok": false, "error": "DB_ERROR"})
				return
			}
		}
		if req.Images != nil {
			gdb.Where("product_id = ?", prd.ID).Delete(&p.ProductImage{})
			for i, url := range *req.Images {
				if url == "" {
					continue
				}
				gdb.Create(&p.ProductImage{
					ProductID: prd.ID,
					URL:       url,
					Sort:      i,
				})
			}
		}
		c.JSON(200, gin.H{"ok": true})
	})

	// 6) 刪除商品（含圖片）
	grp.DELETE("/products/:id", func(c *gin.Context) {
		vid := c.GetString("vendor_id")
		tx := gdb.Begin()
		var prd p.Product
		if err := tx.Where("id = ? AND vendor_id = ?", c.Param("id"), vid).First(&prd).Error; err != nil {
			tx.Rollback()
			c.JSON(404, gin.H{"ok": false, "error": "NOT_FOUND"})
			return
		}
		tx.Where("product_id = ?", prd.ID).Delete(&p.ProductImage{})
		tx.Delete(&prd)
		tx.Commit()
		c.JSON(200, gin.H{"ok": true})
	})
}
