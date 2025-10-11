package db

import (
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/order"
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/product"
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/vendors/models"
)

func MustOpen(dsn string) *gorm.DB {
	gdb, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("db open: %v", err)
	}

	// 啟動時自動建表/更新結構（保留原本並擴充）
	if err := gdb.AutoMigrate(
		&product.Product{},
		&product.ProductImage{}, // ★ 新增：多圖
		&order.Order{},
		&order.OrderItem{},
		&order.OrderCounter{},
		// ★ 廠商登入/重設密碼
		&models.Vendor{},
		&models.VendorPasswordReset{},
	); err != nil {
		log.Fatalf("db migrate: %v", err)
	}

	return gdb
}
