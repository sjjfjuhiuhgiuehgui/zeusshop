package main

import (
	"log"

	"github.com/joho/godotenv"

	"github.com/gin-gonic/gin"

	"github.com/yourname/shop-mvp/internal/cache"
	"github.com/yourname/shop-mvp/internal/config"
	"github.com/yourname/shop-mvp/internal/db"
	"github.com/yourname/shop-mvp/internal/middleware"
	"github.com/yourname/shop-mvp/internal/order"
	"github.com/yourname/shop-mvp/internal/product"
)

func main() {
	// 載入 .env（若不存在則略過）
	_ = godotenv.Load()

	// 基礎組態 & 連線
	cfg := config.Load()
	gormDB := db.MustOpen(cfg.DBDSN)
	rdb := cache.MustOpen(cfg.RedisAddr)

	// 自動建表 / 更新結構
	if err := gormDB.AutoMigrate(
		&product.Product{},
		&order.Order{},
		&order.OrderItem{},
		&order.OrderCounter{}, // 產生訂單編號用的每日流水
	); err != nil {
		log.Fatalf("auto migrate: %v", err)
	}

	// Gin
	r := gin.Default()
	r.Use(middleware.CORS(cfg.CORSOrigins))

	// Health
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })

	// Public APIs
	ph := product.NewHandler(gormDB, rdb) // 產品（前台）
	r.GET("/api/products", ph.List)
	r.GET("/api/products/:id", ph.Get)

	oh := order.NewHandler(gormDB) // 訂單（前台/管理）
	r.POST("/api/orders", oh.Create)
	// 客戶回填匯款資料（後五碼、備註）
	r.PUT("/api/orders/:id/remit", oh.UpdateRemit)

	// Admin（簡易 Token 驗證）
	admin := r.Group("/api/admin", func(c *gin.Context) {
		if c.GetHeader("X-Admin-Token") != cfg.AdminToken {
			c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
			return
		}
	})

	// 產品管理
	admin.POST("/products", ph.Create)
	admin.PUT("/products/:id", ph.Update)
	admin.DELETE("/products/:id", ph.Delete)

	// 訂單管理
	admin.GET("/orders", oh.AdminList)
	admin.GET("/orders/:id", oh.AdminGet)
	admin.PUT("/orders/:id/status", oh.AdminUpdateStatus) // 出貨 / 完成
	admin.DELETE("/orders/:id", oh.AdminDelete)           // 刪除訂單

	log.Printf("listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
