package main

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"

	"github.com/gin-gonic/gin"

	// 你的專案模組路徑（依 go.mod）
	"github.com/yourname/shop-mvp/internal/cache"
	"github.com/yourname/shop-mvp/internal/config"
	"github.com/yourname/shop-mvp/internal/db"
	"github.com/yourname/shop-mvp/internal/middleware"
	"github.com/yourname/shop-mvp/internal/order"
	"github.com/yourname/shop-mvp/internal/product"
)

func main() {
	// 1) 先嘗試載入 .env（不存在也不報錯）
	_ = godotenv.Load()

	// 2) 載入組態（建議 config.Load() 內部以環境變數為主，並給安全的預設值）
	cfg := config.Load()

	// 基本健檢：必要變數缺少就先中止，避免靜默用到錯誤預設
	if cfg.DBDSN == "" {
		log.Fatal("config: DBDSN is empty (請設定環境變數 DBDSN 或在 .env 檔中設定)")
	}
	if cfg.AdminToken == "" {
		log.Fatal("config: AdminToken is empty (請設定環境變數 ADMIN_TOKEN 或在 .env 檔中設定)")
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}

	// 顯示關鍵啟動資訊（避免洩漏密碼，只顯示 DSN 的目標端點）
	log.Printf("starting ZeusShop… port=%s, db=%s, redis=%s",
		cfg.Port, safeDSN(cfg.DBDSN), safeRedis(cfg.RedisAddr),
	)

	// 3) 初始化外部資源
	gormDB := db.MustOpen(cfg.DBDSN)
	rdb := cache.MustOpen(cfg.RedisAddr)

	// 4) 自動建表 / schema 更新
	if err := gormDB.AutoMigrate(
		&product.Product{},
		&order.Order{},
		&order.OrderItem{},
		&order.OrderCounter{}, // 產生訂單編號用的每日流水
	); err != nil {
		log.Fatalf("auto migrate: %v", err)
	}

	// 5) 啟動 Gin 與中介層
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

// safeDSN 只輸出 DSN 的目標端點，避免把帳密寫進日誌。
// 例：user:pass@tcp(127.0.0.1:3306)/db?... → tcp(127.0.0.1:3306)/db
//     user:pass@unix(/var/run/mysqld/mysqld.sock)/db?... → unix(/var/run/mysqld/mysqld.sock)/db
func safeDSN(dsn string) string {
	at := strings.LastIndex(dsn, "@")
	if at == -1 {
		return maskIfURL(dsn)
	}
	rest := dsn[at+1:]
	// 去 query string
	if q := strings.Index(rest, "?"); q >= 0 {
		rest = rest[:q]
	}
	return rest
}

// safeRedis 簡單處理 redis://:pass@host:port/0 → redis://host:port/0
func safeRedis(addr string) string {
	if addr == "" {
		return ""
	}
	// 粗略處理：去掉 "://:password@" 這段
	if i := strings.Index(addr, "://:"); i >= 0 {
		// 從 "://:" 開始找到下一個 '@' 並移除
		j := strings.Index(addr[i+4:], "@")
		if j > 0 {
			return addr[:i+3] + addr[i+4+j+1:]
		}
	}
	return addr
}

// 當 DSN 是 URL 形式時的粗略遮罩（目前你的 MySQL DSN 非 URL，保留以備後用）
func maskIfURL(s string) string {
	if !strings.Contains(s, "://") {
		return s
	}
	// e.g. scheme://user:pass@host → scheme://host
	schemeEnd := strings.Index(s, "://")
	hostPart := s[schemeEnd+3:]
	if at := strings.Index(hostPart, "@"); at >= 0 {
		hostPart = hostPart[at+1:]
	}
	return s[:schemeEnd+3] + hostPart
}
