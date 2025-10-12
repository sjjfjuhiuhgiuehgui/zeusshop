// web/src/lib/combinedProducts.js
import RAW from "../data/products"; // 你原本寫死的商品陣列

// URL 分類 slug ↔ 後端/資料內部 key 對照
const SLUG_TO_KEY = {
  appliances: "home",
  computers: "3C",
  beauty: "beauty",
};
const KEY_TO_SLUG = Object.fromEntries(Object.entries(SLUG_TO_KEY).map(([k, v]) => [v, k]));

// 把各來源的商品正規化成前端卡片要的統一格式
function normalize(item) {
  // 來源 1：你寫死的 products.js（可能已是 name/price/img/category 格式）
  if (item && item.name && item.img) {
    return {
      id: item.id ?? `local-${item.name}-${item.img}`,
      name: item.name,
      price: Number(item.price ?? 0),
      image: item.img,
      category: item.category || "",
      visible: true,
      source: "local",
    };
  }

  // 來源 2：後端 /api/products（可能是 name/price/imageUrl 或 images[0].url）
  const imgArr = item.images || item.Images || [];
  const firstImg = (imgArr[0] && (imgArr[0].url || imgArr[0].URL || imgArr[0])) || null;

  return {
    id: item.id ?? item.ID ?? `remote-${item.name}-${firstImg || item.imageUrl || ""}`,
    name: item.name ?? item.Name ?? "",
    price: Number(item.price ?? item.Price ?? 0),
    image: item.imageUrl || item.ImageURL || firstImg || "",
    category: item.category ?? item.Category ?? "",
    visible: Boolean(item.visible ?? item.isActive ?? item.IsActive ?? item.Visible ?? false),
    source: "remote",
  };
}

// 合併 + 去重（以 id 優先，退而求其次 name+image）
function mergeAndDedupe(localList, remoteList) {
  const map = new Map();
  const put = (p) => {
    const key = p.id || `${p.name}::${p.image}`;
    if (!map.has(key)) map.set(key, p);
  };
  localList.forEach(put);
  remoteList.forEach(put);

  // 把 remote（真正上架）排前面，再來 local
  return Array.from(map.values()).sort((a, b) => {
    if (a.source !== b.source) return a.source === "remote" ? -1 : 1;
    return (b.price || 0) - (a.price || 0); // 同來源以價格由高到低
  });
}

/**
 * 取得合併後的列表
 * @param {string} slug - 路由上的分類（appliances / computers / beauty）
 */
export async function fetchCombinedProducts(slug) {
  const key = SLUG_TO_KEY[slug] || slug; // 容錯：如果直接傳 key 也行

  // 1) 本地靜態資料先過濾
  const local = (Array.isArray(RAW) ? RAW : []).filter(
    (p) => (p.category || "").toLowerCase() === key.toLowerCase()
  ).map(normalize);

  // 2) 後端資料（公開 API，不需要 credentials）
  let remote = [];
  try {
    // 若你的後端有支援 query，可用 ?category=key 來減少傳輸
    const res = await fetch(`/api/products?category=${encodeURIComponent(key)}&visible=1`);
    if (res.ok) {
      const data = await res.json();
      const list =
        (Array.isArray(data.products) && data.products) ||
        (Array.isArray(data.data) && data.data) ||
        (Array.isArray(data.items) && data.items) ||
        (Array.isArray(data) && data) ||
        [];
      remote = list
        .map(normalize)
        .filter((p) => p.visible && (p.category || "").toLowerCase() === key.toLowerCase());
    }
  } catch (e) {
    // 靜默失敗：只用本地資料也不會整頁炸掉
    console.warn("fetch /api/products failed:", e);
  }

  return mergeAndDedupe(local, remote);
}

export { SLUG_TO_KEY, KEY_TO_SLUG };
