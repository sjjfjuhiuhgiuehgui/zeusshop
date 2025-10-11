package main

import (
	"log"
	"strings"

	"github.com/joho/godotenv"
	"github.com/gin-gonic/gin"

	// 改成你的專案模組路徑（依 go.mod）
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/cache"
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/config"
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/db"
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/middleware"
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/order"
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/product"

	// Vendor
	vendormodels "github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/vendors/models"
	vendorroutes "github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/vendors/routes"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	if cfg.DBDSN == "" { log.Fatal("config: DBDSN is empty") }
	if cfg.AdminToken == "" { log.Fatal("config: AdminToken is empty") }
	if cfg.Port == "" { cfg.Port = "8080" }

	log.Printf("starting ZeusShop… port=%s, db=%s, redis=%s",
		cfg.Port, safeDSN(cfg.DBDSN), safeRedis(cfg.RedisAddr),
	)

	gormDB := db.MustOpen(cfg.DBDSN)
	rdb := cache.MustOpen(cfg.RedisAddr)

	// AutoMigrate（保留原本 + Vendor）
	if err := gormDB.AutoMigrate(
		&product.Product{},
		&product.ProductImage{}, // ★
		&order.Order{},
		&order.OrderItem{},
		&order.OrderCounter{},
		&vendormodels.Vendor{},
		&vendormodels.VendorPasswordReset{},
	); err != nil {
		log.Fatalf("auto migrate: %v", err)
	}

	r := gin.Default()
	r.Use(middleware.CORS(cfg.CORSOrigins))

	// ★ 靜態檔（圖片上傳對外公開）
	r.Static("/uploads", "./uploads")

	// Health
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })

	// Public APIs
	ph := product.NewHandler(gormDB, rdb)
	r.GET("/api/products", ph.List)
	r.GET("/api/products/:id", ph.Get)

	oh := order.NewHandler(gormDB)
	r.POST("/api/orders", oh.Create)
	r.PUT("/api/orders/:id/remit", oh.UpdateRemit)

	// Admin（保留）
	admin := r.Group("/api/admin", func(c *gin.Context) {
		if c.GetHeader("X-Admin-Token") != cfg.AdminToken {
			c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
			return
		}
	})
	admin.POST("/products", ph.Create)
	admin.PUT("/products/:id", ph.Update)
	admin.DELETE("/products/:id", ph.Delete)
	admin.GET("/orders", oh.AdminList)
	admin.GET("/orders/:id", oh.AdminGet)
	admin.PUT("/orders/:id/status", oh.AdminUpdateStatus)
	admin.DELETE("/orders/:id", oh.AdminDelete)

	// ★ 廠商專用 API
	vendorroutes.RegisterVendorRoutes(r, gormDB)                 // 註冊/登入/密碼
	vendorroutes.RegisterVendorProductRoutes(r, gormDB)          // 上架商品 / 多圖上傳 / CRUD
	vendorroutes.RegisterVendorOrderRoutes(r, gormDB)            // 只看自己的訂單

	log.Printf("listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

// === Helpers ===
func safeDSN(dsn string) string {
	at := strings.LastIndex(dsn, "@")
	if at == -1 { return maskIfURL(dsn) }
	rest := dsn[at+1:]
	if q := strings.Index(rest, "?"); q >= 0 { rest = rest[:q] }
	return rest
}

func safeRedis(addr string) string {
	if addr == "" { return "" }
	if i := strings.Index(addr, "://:"); i >= 0 {
		if j := strings.Index(addr[i+4:], "@"); j > 0 {
			return addr[:i+3] + addr[i+4+j+1:]
		}
	}
	return addr
}

func maskIfURL(s string) string {
	if !strings.Contains(s, "://") { return s }
	schemeEnd := strings.Index(s, "://")
	hostPart := s[schemeEnd+3:]
	if at := strings.Index(hostPart, "@"); at >= 0 { hostPart = hostPart[at+1:] }
	return s[:schemeEnd+3] + hostPart
}
