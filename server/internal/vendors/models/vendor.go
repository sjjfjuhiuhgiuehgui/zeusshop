package models

import "time"

type Vendor struct {
	ID           string    `gorm:"primaryKey;size:36"`
	Email        string    `gorm:"uniqueIndex;size:190;not null"`
	Name         string    `gorm:"size:190"`
	PasswordHash string    `gorm:"size:191;not null"`
	IsActive     bool      `gorm:"not null;default:true"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
}

type VendorPasswordReset struct {
	ID        string    `gorm:"primaryKey;size:36"`
	VendorID  string    `gorm:"size:36;index;not null"`
	Token     string    `gorm:"size:191;uniqueIndex;not null"`
	ExpiresAt time.Time `gorm:"index;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

