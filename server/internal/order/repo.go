package order

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repo struct{ db *gorm.DB }

func NewRepo(db *gorm.DB) *Repo { return &Repo{db: db} }

// 建立訂單（不查 products；以前端送來的 name/unitPrice 為準）
func (r *Repo) Create(tx *gorm.DB, in CreateOrderInput) (*Order, error) {
	if len(in.Items) == 0 {
		return nil, fmt.Errorf("no items")
	}

	var items []OrderItem
	var total int64

	for _, it := range in.Items {
		if it.Quantity <= 0 {
			return nil, fmt.Errorf("invalid quantity")
		}
		if it.UnitPrice < 0 {
			return nil, fmt.Errorf("invalid unit price")
		}
		name := it.Name
		if name == "" {
			return nil, fmt.Errorf("name required")
		}

		oi := OrderItem{
			ProductID:   it.ProductID,
			ProductName: name,
			UnitPrice:   it.UnitPrice,
			Quantity:    it.Quantity,
			Subtotal:    int64(it.Quantity) * it.UnitPrice,
		}
		items = append(items, oi)
		total += oi.Subtotal
	}

	o := &Order{
		BuyerName:      in.BuyerName,
		BuyerPhone:     in.BuyerPhone,
		ShippingMethod: in.ShippingMethod,
		StoreCode:      in.StoreCode,
		Address:        in.Address,
		Status:         StatusPending,
		TotalAmount:    total,
		Items:          items,
	}
	if err := tx.Create(o).Error; err != nil {
		return nil, err
	}

	// 訂單編號：114 + MMDD + 當日 3 碼流水
	today := time.Now().Format("0102") // e.g. 0914
	var oc OrderCounter
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("day = ?", today).
		First(&oc).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			oc = OrderCounter{Day: today, Seq: 1}
			if err := tx.Create(&oc).Error; err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	} else {
		oc.Seq++
		if err := tx.Save(&oc).Error; err != nil {
			return nil, err
		}
	}
	o.OrderNo = fmt.Sprintf("114%s%03d", today, oc.Seq)
	if err := tx.Model(o).Update("order_no", o.OrderNo).Error; err != nil {
		return nil, err
	}

	return o, nil
}

// 列表（不 preload items）
func (r *Repo) AdminList() ([]Order, error) {
	var os []Order
	if err := r.db.Order("id DESC").Find(&os).Error; err != nil {
		return nil, err
	}
	return os, nil
}

// 單筆（含 items）
func (r *Repo) AdminGet(id uint64) (*Order, error) {
	var o Order
	if err := r.db.Preload("Items").First(&o, id).Error; err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *Repo) AdminUpdateStatus(id uint64, status string) error {
	switch status {
	case StatusPending, StatusShipped, StatusCompleted:
	default:
		return fmt.Errorf("invalid status")
	}
	return r.db.Model(&Order{ID: id}).Update("status", status).Error
}

func (r *Repo) AdminDelete(id uint64) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("order_id = ?", id).Delete(&OrderItem{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&Order{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}
