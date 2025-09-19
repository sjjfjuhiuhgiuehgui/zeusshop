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
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (Product) TableName() string { return "products" }
