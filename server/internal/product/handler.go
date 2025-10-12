package product

import (
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sjjfjuhiuhgiuehgui/zeusshop/server/internal/cache"
	"gorm.io/gorm"
)

type Handler struct {
	db   *gorm.DB      // 新增：直接用 GORM 查詢
	repo *Repo         // 保留：給單筆/建立/更新/刪除沿用你的 Repo
	rdb  *cache.Redis
}

func NewHandler(db *gorm.DB, rdb *cache.Redis) *Handler {
	return &Handler{
		db:   db,
		repo: NewRepo(db, rdb),
		rdb:  rdb,
	}
}

// GET /api/products
// 支援：
//   ?category=home|3C|beauty
//   ?visible=1           -> 僅回上架（預設就會這樣；visible=true 或 is_active=true 任一為真）
//   ?q=keyword           -> name/description 模糊搜尋
//   ?sort=price_asc|price_desc|name_asc|new(預設；id DESC)
//   ?limit=20&offset=0   -> 簡單分頁
func (h *Handler) List(c *gin.Context) {
	var rows []Product

	q := h.db.Model(&Product{})

	// 預設：只回上架（任一欄位為真）
	visibleParam := strings.TrimSpace(c.Query("visible"))
	if visibleParam == "" || visibleParam == "1" || strings.EqualFold(visibleParam, "true") {
		q = q.Where("(visible = ? OR is_active = ?)", true, true)
	}

	// 類別
	if cat := strings.TrimSpace(c.Query("category")); cat != "" {
		q = q.Where("category = ?", cat)
	}

	// 關鍵字
	if kw := strings.TrimSpace(c.Query("q")); kw != "" {
		like := "%" + kw + "%"
		q = q.Where("name LIKE ? OR description LIKE ?", like, like)
	}

	// 排序
	orderBy := "id DESC"
	switch strings.ToLower(strings.TrimSpace(c.Query("sort"))) {
	case "price_asc":
		orderBy = "price ASC, id DESC"
	case "price_desc":
		orderBy = "price DESC, id DESC"
	case "name_asc":
		orderBy = "name ASC, id DESC"
	}
	q = q.Order(orderBy)

	// 分頁
	limit := clamp(toInt(c.Query("limit"), 20), 1, 100)
	offset := toInt(c.Query("offset"), 0)
	q = q.Limit(limit).Offset(offset)

	if err := q.Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": "DB_ERROR"})
		return
	}

	// 輸出固定使用 products（前端在用這個鍵）
	c.JSON(http.StatusOK, gin.H{
		"ok":       true,
		"products": rows,
		"total":    len(rows), // 簡單回一頁長度；若要回全部總數可再查一次 Count
		"limit":    limit,
		"offset":   offset,
	})
}

// GET /api/products/:id
func (h *Handler) Get(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	p, err := h.repo.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "NOT_FOUND"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "product": p})
}

// Admin：新增商品
func (h *Handler) Create(c *gin.Context) {
	var in Product
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}
	if err := h.repo.Create(c.Request.Context(), &in); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"ok": true, "product": in})
}

// Admin：更新商品
func (h *Handler) Update(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	p, err := h.repo.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"ok": false, "error": "NOT_FOUND"})
		return
	}

	var in Product
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"ok": false, "error": err.Error()})
		return
	}

	// 覆蓋可編輯欄位（對齊你的模型，含 Category / Visible）
	p.Name = in.Name
	p.Description = in.Description
	p.Price = in.Price
	p.Stock = in.Stock
	p.IsActive = in.IsActive
	p.ImageURL = in.ImageURL
	if in.Category != "" {
		p.Category = in.Category
	}
	p.Visible = in.Visible
	p.Spec = in.Spec
	p.VendorID = in.VendorID // 正常不會讓 Admin 改 VendorID；如需限制可移除

	if err := h.repo.Update(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "product": p})
}

// Admin：刪除商品
func (h *Handler) Delete(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ---- helpers ----
func toInt(s string, def int) int {
	if s == "" {
		return def
	}
	if n, err := strconv.Atoi(s); err == nil {
		return n
	}
	return def
}

func clamp(n, min, max int) int {
	return minMax(n, min, max)
}

func minMax(n, min, max int) int {
	if n < min {
		return min
	}
	if n > max {
		return max
	}
	return n
}

// 為避免未使用引入報錯（若你暫時沒用 rdb/repo 的排序工具，以下是個示範）：
var _ = sort.Slice
