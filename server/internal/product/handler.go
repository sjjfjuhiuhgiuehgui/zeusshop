package product

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yourname/shop-mvp/internal/cache"
	"gorm.io/gorm"
)

type Handler struct {
	repo *Repo
	rdb  *cache.Redis
}

func NewHandler(db *gorm.DB, rdb *cache.Redis) *Handler {
	return &Handler{repo: NewRepo(db, rdb), rdb: rdb}
}

// 前台：商品列表（只回傳上架中的）
func (h *Handler) List(c *gin.Context) {
	items, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

// 前台/後台：單一商品
func (h *Handler) Get(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	p, err := h.repo.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

// 後台：新增商品
func (h *Handler) Create(c *gin.Context) {
	var in Product
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.repo.Create(c.Request.Context(), &in); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, in)
}

// 後台：更新商品
func (h *Handler) Update(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	p, err := h.repo.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}

	var in Product
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 覆蓋可編輯欄位
	p.Name = in.Name
	p.Description = in.Description
	p.Price = in.Price
	p.Stock = in.Stock
	p.IsActive = in.IsActive
	p.ImageURL = in.ImageURL

	if err := h.repo.Update(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

// 後台：刪除商品
func (h *Handler) Delete(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
