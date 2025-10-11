package routes

import (
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

func requireVendorMiddlewareForOrders() gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "dev-secret"
		}
		tokenStr, _ := c.Cookie("vtoken")
		if tokenStr == "" {
			if auth := c.GetHeader("Authorization"); len(auth) > 7 && auth[:7] == "Bearer " {
				tokenStr = auth[7:]
			}
		}
		if tokenStr == "" {
			c.AbortWithStatusJSON(401, gin.H{"ok": false, "error": "UNAUTHENTICATED"})
			return
		}
		claims := jwt.MapClaims{}
		parsed, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !parsed.Valid || claims["role"] != "vendor" {
			c.AbortWithStatusJSON(401, gin.H{"ok": false, "error": "INVALID_TOKEN"})
			return
		}
		c.Set("vendor_id", claims["id"])
		c.Next()
	}
}

type VendorOrderItem struct {
	ItemID    uint   `json:"itemId"`
	OrderID   uint   `json:"orderId"`
	ProductID uint   `json:"productId"`
	Title     string `json:"title"`
	Quantity  int    `json:"quantity"`
	UnitPrice int64  `json:"unitPrice"`
	Subtotal  int64  `json:"subtotal"`
	Status    string `json:"status"`
}

type VendorOrder struct {
	OrderID   uint              `json:"orderId"`
	Number    string            `json:"number"`
	BuyerName string            `json:"buyerName"`
	Phone     string            `json:"phone"`
	Address   string            `json:"address"`
	Status    string            `json:"status"`
	Items     []VendorOrderItem `json:"items"`
}

func RegisterVendorOrderRoutes(r *gin.Engine, gdb *gorm.DB) {
	grp := r.Group("/api/vendor")
	grp.Use(requireVendorMiddlewareForOrders())

	grp.GET("/orders", func(c *gin.Context) {
		vid := c.GetString("vendor_id")

		type row struct {
			ItemID    uint
			OrderID   uint
			ProductID uint
			Title     string
			Quantity  int
			UnitPrice int64
			Number    string
			BuyerName string
			Phone     string
			Address   string
			Status    string
		}

		var rows []row
		err := gdb.Table("order_items AS oi").
			Select(`oi.id AS item_id,
			        oi.order_id,
			        oi.product_id,
			        p.name AS title,
			        oi.quantity,
			        oi.unit_price AS unit_price,
			        o.order_no AS number,
			        o.buyer_name,
			        o.buyer_phone AS phone,
			        o.address,
			        o.status`).
			Joins("JOIN products p ON p.id = oi.product_id").
			Joins("JOIN orders o ON o.id = oi.order_id").
			Where("p.vendor_id = ?", vid).
			Order("o.id DESC, oi.id ASC").
			Scan(&rows).Error
		if err != nil {
			c.JSON(500, gin.H{"ok": false, "error": "DB_ERROR"})
			return
		}

		byOrder := map[uint]*VendorOrder{}
		for _, r1 := range rows {
			vo := byOrder[r1.OrderID]
			if vo == nil {
				vo = &VendorOrder{
					OrderID:   r1.OrderID,
					Number:    r1.Number,
					BuyerName: r1.BuyerName,
					Phone:     r1.Phone,
					Address:   r1.Address,
					Status:    r1.Status,
				}
				byOrder[r1.OrderID] = vo
			}
			sub := r1.UnitPrice * int64(r1.Quantity)
			vo.Items = append(vo.Items, VendorOrderItem{
				ItemID:    r1.ItemID,
				OrderID:   r1.OrderID,
				ProductID: r1.ProductID,
				Title:     r1.Title,
				Quantity:  r1.Quantity,
				UnitPrice: r1.UnitPrice,
				Subtotal:  sub,
				Status:    r1.Status,
			})
		}

		list := make([]*VendorOrder, 0, len(byOrder))
		for _, v := range byOrder {
			list = append(list, v)
		}
		c.JSON(200, gin.H{"ok": true, "orders": list})
	})
}

// （小工具）uint 轉字串：若你之後想用 o.id 當字串顯示，可用 strconv
func utoa(u uint) string { return strconv.FormatUint(uint64(u), 10) }
