package product

import (
	"context"

	"gorm.io/gorm"

	// 你的快取封裝（若之後沒用到也無妨）
	"github.com/yourname/shop-mvp/internal/cache"
)

type Repo struct {
	db  *gorm.DB
	rdb *cache.Redis // 可為 nil；目前先不強制使用
}

func NewRepo(db *gorm.DB, rdb *cache.Redis) *Repo {
	return &Repo{db: db, rdb: rdb}
}

// List：前台用，列出可售商品（is_active = true，預設新→舊）
func (r *Repo) List(ctx context.Context) ([]Product, error) {
	var ps []Product
	if err := r.db.WithContext(ctx).
		Where("is_active = ?", true).
		Order("id DESC").
		Find(&ps).Error; err != nil {
		return nil, err
	}
	return ps, nil
}

// Get：取單一商品（不限制 is_active，給前台/後台共用）
func (r *Repo) Get(ctx context.Context, id uint64) (*Product, error) {
	var p Product
	if err := r.db.WithContext(ctx).First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

// Create：後台新增商品
func (r *Repo) Create(ctx context.Context, p *Product) error {
	return r.db.WithContext(ctx).Create(p).Error
}

// Update：後台更新商品
func (r *Repo) Update(ctx context.Context, p *Product) error {
	// 假設 p.ID 已帶入；只更新變動欄位
	return r.db.WithContext(ctx).Model(&Product{ID: p.ID}).Updates(p).Error
}

// Delete：後台刪除商品
func (r *Repo) Delete(ctx context.Context, id uint64) error {
	return r.db.WithContext(ctx).Delete(&Product{}, id).Error
}
