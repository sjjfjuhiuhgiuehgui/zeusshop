package product

import "time"

type Product struct {
	ID          uint64    `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       int64     `json:"price"`
	Stock       int       `json:"stock"`
	IsActive    bool      `json:"isActive"`
	ImageURL    string    `gorm:"column:image_url" json:"imageUrl"`

	// ★ 新增：所屬廠商、規格（建議存 JSON 字串）
	VendorID string `gorm:"size:36;index" json:"vendorId"`
	Spec     string `gorm:"type:text" json:"spec"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (Product) TableName() string { return "products" }

// ★ 新增：商品多張圖片（若只用 ImageURL 也可，但多圖較彈性）
type ProductImage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProductID uint64    `gorm:"index" json:"productId"`
	URL       string    `gorm:"size:500;not null" json:"url"`
	Sort      int       `gorm:"index;default:0" json:"sort"`
	CreatedAt time.Time `json:"createdAt"`
}
