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
	repo *Repo
	rdb  *cache.Redis
}

func NewHandler(db *gorm.DB, rdb *cache.Redis) *Handler {
	return &Handler{repo: NewRepo(db, rdb), rdb: rdb}
}

// GET /api/products
// 支援：
//   ?category=home|3C|beauty       分類（不分大小寫）
//   ?q=keyword                      關鍵字（name/description 模糊匹配，大小寫不敏感）
//   ?sort=price_asc|price_desc|name_asc|new(預設；以 id DESC)
//   ?limit=20&offset=0              簡易分頁（在 handler 端切分）
//
// 注意：repo.List(ctx) 依你原始註解為「只回上架中的」，本函式維持該語意，
//      這裡僅在記憶體內做進一步篩選與排序、分頁，並統一輸出格式。
func (h *Handler) List(c *gin.Context) {
	// 先撈出上架商品
	items, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": err.Error()})
		return
	}

	// 參數讀取
	cat := strings.TrimSpace(c.Query("category"))
	q := strings.TrimSpace(c.Query("q"))
	sortKey := strings.ToLower(strings.TrimSpace(c.Query("sort")))
	limit := clamp(toInt(c.Query("limit"), 20), 1, 100)
	offset := toInt(c.Query("offset"), 0)

	// 正規化工具
	eqFold := func(a, b string) bool { return strings.EqualFold(strings.TrimSpace(a), strings.TrimSpace(b)) }
	containsFold := func(s, sub string) bool { return sub == "" || strings.Contains(strings.ToLower(s), strings.ToLower(sub)) }

	// 過濾（分類 + 關鍵字）
	filtered := make([]Product, 0, len(items))
	for _, p := range items {
		// 類別相符（若有指定）
		if cat != "" {
			// p.Category 可能為空，或大小寫不同，使用不分大小寫比對
			if !eqFold(p.Category, cat) {
				continue
			}
		}
		// 關鍵字（name/description）
		if q != "" {
			if !containsFold(p.Name, q) && !containsFold(p.Description, q) {
				continue
			}
		}
		filtered = append(filtered, p)
	}

	// 排序
	switch sortKey {
	case "price_asc":
		sort.SliceStable(filtered, func(i, j int) bool { return filtered[i].Price < filtered[j].Price })
	case "price_desc":
		sort.SliceStable(filtered, func(i, j int) bool { return filtered[i].Price > filtered[j].Price })
	case "name_asc":
		sort.SliceStable(filtered, func(i, j int) bool {
			return strings.Compare(strings.ToLower(filtered[i].Name), strings.ToLower(filtered[j].Name)) < 0
		})
	default: // "new"：以 id DESC
		sort.SliceStable(filtered, func(i, j int) bool { return filtered[i].ID > filtered[j].ID })
	}

	// 分頁（以 handler 端 slice 切分）
	start := offset
	if start < 0 {
		start = 0
	}
	if start > len(filtered) {
		start = len(filtered)
	}
	end := start + limit
	if end > len(filtered) {
		end = len(filtered)
	}
	page := filtered[start:end]

	c.JSON(http.StatusOK, gin.H{
		"ok":       true,
		"products": page,
		"total":    len(filtered),
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

// Admin：新增商品（保留原邏輯，統一包裝）
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

// Admin：更新商品（保留原邏輯，統一包裝）
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

	// 覆蓋可編輯欄位（保留你原先的欄位）
	p.Name = in.Name
	p.Description = in.Description
	p.Price = in.Price
	p.Stock = in.Stock
	p.IsActive = in.IsActive
	p.ImageURL = in.ImageURL
	// 若你已加上 Category / Visible，也可一併對齊：
	if in.Category != "" {
		p.Category = in.Category
	}
	p.Visible = in.Visible // 若 in.Visible 為預設 false，也能顯式覆蓋

	if err := h.repo.Update(c.Request.Context(), p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"ok": false, "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "product": p})
}

// Admin：刪除商品（保留原邏輯，統一包裝）
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
	if n < min {
		return min
	}
	if n > max {
		return max
	}
	return n
}
