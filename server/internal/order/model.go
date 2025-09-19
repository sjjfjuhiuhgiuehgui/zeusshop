package order

import "time"

// 寄送方式
type ShippingMethod string

const (
	ShippingPickup ShippingMethod = "pickup"
	Shipping711    ShippingMethod = "sevencv"
	ShippingHome   ShippingMethod = "home"
)

// 訂單狀態
const (
	StatusPending   = "pending"
	StatusShipped   = "shipped"
	StatusCompleted = "completed"
)

// 前端直傳的商品資訊（不再查 DB）
type ItemInput struct {
	ProductID uint64 `json:"productId"` // 可選，當作識別用
	Name      string `json:"name" binding:"required"`
	UnitPrice int64  `json:"unitPrice" binding:"required"` // 金額以「分」為單位
	Quantity  int    `json:"quantity" binding:"required"`
}

type CreateOrderInput struct {
	BuyerName      string         `json:"buyerName" binding:"required"`
	BuyerPhone     string         `json:"buyerPhone" binding:"required"`
	ShippingMethod ShippingMethod `json:"shippingMethod" binding:"required"` // pickup | sevencv | home
	StoreCode      string         `json:"storeCode"`
	Address        string         `json:"address"`
	Items          []ItemInput    `json:"items" binding:"required"`
}

type OrderCounter struct {
	Day string `gorm:"primaryKey;size:4"`
	Seq uint   `gorm:"not null"`
}

type Order struct {
	ID             uint64         `gorm:"primaryKey" json:"id"`
	OrderNo        string         `gorm:"index;size:32" json:"orderNo"`
	BuyerName      string         `json:"buyerName"`
	BuyerPhone     string         `json:"buyerPhone"`
	ShippingMethod ShippingMethod `json:"shippingMethod"`
	StoreCode      string         `json:"storeCode"`
	Address        string         `json:"address"`
	Status         string         `gorm:"default:pending" json:"status"`
	TotalAmount    int64          `json:"totalAmount"`
	RemitLast5     string         `gorm:"size:5" json:"remitLast5"`
	PaymentNote    string         `gorm:"size:255" json:"paymentNote"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	Items          []OrderItem    `json:"items"`
}

type OrderItem struct {
	ID          uint64 `gorm:"primaryKey" json:"id"`
	OrderID     uint64 `json:"orderId"`
	ProductID   uint64 `json:"productId"`
	ProductName string `json:"productName"`
	UnitPrice   int64  `json:"unitPrice"`
	Quantity    int    `json:"quantity"`
	Subtotal    int64  `json:"subtotal"`
}
