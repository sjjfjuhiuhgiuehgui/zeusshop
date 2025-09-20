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
)

func main() {
	// 1) 嘗試載入 .env（不存在也不報錯）
	_ = godotenv.Load()

	// 2) 載入組態（以環境變數為主，config 內有預設值）
	cfg := config.Load()

	// 基本健檢：必要變數
	if cfg.DBDSN == "" {
		log.Fatal("config: DBDSN is empty (請設定環境變數 DBDSN 或在 .env 檔中設定)")
	}
	if cfg.AdminToken == "" {
		log.Fatal("config: AdminToken is empty (請設定環境變數 ADMIN_TOKEN 或在 .env 檔中設定)")
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}

	// 啟動訊息（遮蔽密碼，只顯示端點）
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

	// Public APIs（後端維持 /api 前綴；前端 baseURL=/api，呼叫不再含 /api）
	ph := product.NewHandler(gormDB, rdb) // 產品（前台）
	r.GET("/api/products", ph.List)
	r.GET("/api/products/:id", ph.Get)

	oh := order.NewHandler(gormDB) // 訂單（前台/管理）
	r.POST("/api/orders", oh.Create)
	r.PUT("/api/orders/:id/remit", oh.UpdateRemit) // 客戶回填匯款資料（後五碼、備註）

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

// === Helpers: 只輸出 DSN 端點，避免把帳密寫進日誌 ===

// 例：user:pass@tcp(127.0.0.1:3306)/db?... → tcp(127.0.0.1:3306)/db
//     user:pass@unix(/var/run/mysqld/mysqld.sock)/db?... → unix(/var/run/mysqld/mysqld.sock)/db
func safeDSN(dsn string) string {
	at := strings.LastIndex(dsn, "@")
	if at == -1 {
		return maskIfURL(dsn)
	}
	rest := dsn[at+1:]
	if q := strings.Index(rest, "?"); q >= 0 {
		rest = rest[:q]
	}
	return rest
}

// redis://:pass@host:port/0 → redis://host:port/0
func safeRedis(addr string) string {
	if addr == "" {
		return ""
	}
	if i := strings.Index(addr, "://:"); i >= 0 {
		if j := strings.Index(addr[i+4:], "@"); j > 0 {
			return addr[:i+3] + addr[i+4+j+1:]
		}
	}
	return addr
}

// 當 DSN 是 URL 形式時的遮罩（目前你的 MySQL DSN 非 URL，保留以備後用）
func maskIfURL(s string) string {
	if !strings.Contains(s, "://") {
		return s
	}
	schemeEnd := strings.Index(s, "://")
	hostPart := s[schemeEnd+3:]
	if at := strings.Index(hostPart, "@"); at >= 0 {
		hostPart = hostPart[at+1:]
	}
	return s[:schemeEnd+3] + hostPart
}
