package order

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct {
	db   *gorm.DB
	repo *Repo
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db, repo: NewRepo(db)}
}

// 客戶下單：交易中呼叫 repo.Create(tx, in)，成功回傳 orderNo
func (h *Handler) Create(c *gin.Context) {
	var in CreateOrderInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var out *Order
	if err := h.db.Transaction(func(tx *gorm.DB) error {
		var err error
		out, err = h.repo.Create(tx, in) // 重要：傳入 tx
		return err
	}); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"orderId": out.ID,
		"orderNo": out.OrderNo,
		"total":   out.TotalAmount,
	})
}

// 後台：訂單列表
func (h *Handler) AdminList(c *gin.Context) {
	items, err := h.repo.AdminList()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

// 後台：單筆訂單（含 Items）
func (h *Handler) AdminGet(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	o, err := h.repo.AdminGet(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	c.JSON(http.StatusOK, o)
}

// 後台：更新狀態（pending/shipped/completed）
func (h *Handler) AdminUpdateStatus(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var in struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&in); err != nil || in.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}
	if err := h.repo.AdminUpdateStatus(id, in.Status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// 後台：刪除訂單（含項目）
func (h *Handler) AdminDelete(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.repo.AdminDelete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// 客戶回填匯款後五碼
func (h *Handler) UpdateRemit(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var in struct {
		Last5 string `json:"last5"`
		Note  string `json:"note"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	// 基本檢查（5 碼數字）
	if len(in.Last5) != 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "last5 must be 5 digits"})
		return
	}

	if err := h.db.Model(&Order{ID: id}).Updates(map[string]any{
		"remit_last5":  in.Last5,
		"payment_note": in.Note,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
