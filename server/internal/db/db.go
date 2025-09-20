package db

import (
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	// 用你 go.mod 的 module 路徑
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/order"
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/product"
)

func MustOpen(dsn string) *gorm.DB {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("db open: %v", err)
	}

	// 啟動時自動建表/更新結構
	if err := db.AutoMigrate(
		&product.Product{},
		&order.Order{},
		&order.OrderItem{},
		&order.OrderCounter{},
	); err != nil {
		log.Fatalf("db migrate: %v", err)
	}

	return db
}
