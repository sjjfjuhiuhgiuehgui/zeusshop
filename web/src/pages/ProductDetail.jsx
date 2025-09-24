import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Truck, ShieldCheck, Star, ShoppingCart, Plus, Minus, Heart } from "lucide-react";

// ✅ Optional: if you already have a central products source, replace this import.
// import { products } from "../data/products";

// Minimal fallback demo data (only used if nothing else found/fetched)
const fallbackProducts = [
  {
    id: "1",
    name: "電腦A",
    price: 29900,
    images: ["/img/demo/pc-a-1.jpg", "/img/demo/pc-a-2.jpg", "/img/demo/pc-a-3.jpg"],
    rating: 4.6,
    reviewCount: 38,
    stock: 12,
    specs: { CPU: "Ryzen 7 7800X3D", RAM: "32GB DDR5", SSD: "1TB NVMe", GPU: "RTX 4070" },
    description: "為電競玩家打造的性價比主機，流暢遊玩 1440p 高幀率，兼顧創作與剪輯。",
    shipping: "宅配 / 7-11 取貨 / 門市自取",
    warranty: "原廠保固 3 年",
    category: "3c",
  },
  {
    id: "2",
    name: "電腦B",
    price: 35900,
    images: ["/img/demo/pc-b-1.jpg", "/img/demo/pc-b-2.jpg"],
    rating: 4.7,
    reviewCount: 22,
    stock: 7,
    specs: { CPU: "Core i7-13700F", RAM: "32GB DDR5", SSD: "1TB NVMe", GPU: "RTX 4070 Super" },
    description: "創作者/遊戲雙棲配置，4K 剪輯入門與 2K 高幀率皆適用。",
    shipping: "宅配 / 7-11 取貨",
    warranty: "原廠保固 3 年",
    category: "3c",
  },
  {
    id: "3",
    name: "電腦C",
    price: 19900,
    images: ["/img/demo/pc-c-1.jpg"],
    rating: 4.3,
    reviewCount: 10,
    stock: 0,
    specs: { CPU: "Ryzen 5 5600G", RAM: "16GB DDR4", SSD: "512GB NVMe", GPU: "整合 Vega" },
    description: "文書與輕度遊戲首選，小資入門。",
    shipping: "宅配",
    warranty: "原廠保固 2 年",
    category: "3c",
  },
  {
    id: "4",
    name: "泡腳機",
    price: 1890,
    images: ["/img/demo/spa-1.jpg"],
    rating: 4.5,
    reviewCount: 55,
    stock: 25,
    specs: { 功率: "800W", 模式: "溫熱 / 按摩 / 氣泡", 容量: "8L" },
    description: "三段溫控、定時、滾輪按摩，冬日暖足神器。",
    shipping: "宅配 / 7-11 取貨",
    warranty: "保固 1 年",
    category: "appliances",
  },
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [qty, setQty] = useState(1);

  // ❤️ 收藏狀態
  const [isFav, setIsFav] = useState(false);

  // Try get from client bundle first (window.__ZEUS_PRODUCTS__), else fetch
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        // 1) Prefer in-memory global (若你的 Home / 列表頁已注入資料)
        const bundleList = Array.isArray(window.__ZEUS_PRODUCTS__)
          ? window.__ZEUS_PRODUCTS__
          : null;
        if (bundleList) {
          const found = bundleList.find((p) => String(p.id) === String(id));
          if (mounted) {
            setProduct(found || null);
            setLoading(false);
          }
          if (found) return;
        }
        // 2) Fallback: call API (若後端已接 /api/products)
        const res = await fetch(`/api/products`);
        if (!res.ok) throw new Error(`API 回應 ${res.status}`);
        const list = await res.json();
        const found = Array.isArray(list)
          ? list.find((p) => String(p.id) === String(id))
          : null;
        if (mounted) {
          setProduct(found || null);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        // 3) Ultimate fallback: use local demo
        const found = fallbackProducts.find((p) => String(p.id) === String(id));
        if (mounted) {
          setProduct(found || null);
          setError("載入商品時發生問題，已顯示暫存資料。");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // 依商品初始化收藏狀態
  useEffect(() => {
    if (!product) return;
    try {
      const raw = localStorage.getItem("favorites");
      const list = raw ? JSON.parse(raw) : [];
      const exists = list.find((p) => String(p.id) === String(product.id));
      setIsFav(!!exists);
    } catch {
      setIsFav(false);
    }
  }, [product]);

  const priceText = useMemo(() => {
    if (!product) return "";
    return new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD" }).format(product.price ?? 0);
  }, [product]);

  function addToCart() {
    if (!product) return;
    const key = "cart";
    const raw = localStorage.getItem(key);
    /** @type {{id:string,name:string,price:number,qty:number,image?:string}[]} */
    const cart = raw ? JSON.parse(raw) : [];
    const idx = cart.findIndex((c) => String(c.id) === String(product.id));
    if (idx >= 0) {
      cart[idx].qty += qty;
    } else {
      cart.push({
        id: String(product.id),
        name: product.name,
        price: product.price,
        qty: qty,
        image: product.images?.[0],
      });
    }
    localStorage.setItem(key, JSON.stringify(cart));
    // 跳轉到購物車或給提示
    navigate("/cart");
  }

  // 收藏切換
  function toggleFavorite() {
    if (!product) return;
    const raw = localStorage.getItem("favorites");
    const list = raw ? JSON.parse(raw) : [];
    const exists = list.find((p) => String(p.id) === String(product.id));
    let newList;
    if (exists) {
      newList = list.filter((p) => String(p.id) !== String(product.id));
      setIsFav(false);
    } else {
      newList = [
        ...list,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0],
        },
      ];
      setIsFav(true);
    }
    localStorage.setItem("favorites", JSON.stringify(newList));
  }

  if (loading) return <PageShell><Skeleton /></PageShell>;
  if (!product) return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 text-center">
        <p className="text-lg">找不到此商品</p>
        <button onClick={() => navigate(-1)} className="mt-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2">
          <ChevronLeft className="h-4 w-4" /> 返回上一頁
        </button>
      </div>
    </PageShell>
  );

  const images = product.images?.length ? product.images : ["/img/placeholder.png"];
  const canMinus = qty > 1;
  const inStock = (product.stock ?? 0) > 0;

  return (
    <PageShell>
      {/* 麵包屑：首頁 > 類別 > 商品名；右側上一頁 */}
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-800">首頁</Link>
        <span>/</span>

        {product?.category ? (
          <Link to={categoryPath(product.category)} className="hover:text-neutral-800">
            {categoryLabel(product.category)}
          </Link>
        ) : (
          <span className="text-neutral-400">未分類</span>
        )}

        {product?.name && (
          <>
            <span>/</span>
            <span className="truncate text-neutral-800">{product.name}</span>
          </>
        )}

        <button
          onClick={() => navigate(-1)}
          className="ml-auto inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ChevronLeft className="h-4 w-4" /> 上一頁
        </button>
      </nav>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 md:grid-cols-2">
        {/* LEFT: Image Gallery */}
        <section>
          <div className="aspect-square overflow-hidden rounded-2xl border bg-white">
            <img
              src={images[activeIdx]}
              alt={`${product.name} 圖片 ${activeIdx + 1}`}
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`aspect-square overflow-hidden rounded-xl border bg-white ${
                  i === activeIdx ? "ring-2 ring-neutral-800" : "hover:opacity-90"
                }`}
                aria-label={`預覽第 ${i + 1} 張`}
              >
                <img src={src} alt="縮圖" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        {/* RIGHT: Info */}
        <section className="flex flex-col">
          <h1 className="text-2xl font-semibold md:text-3xl">{product.name}</h1>

          <div className="mt-2 flex items-center gap-3 text-sm">
            <Stars rating={product.rating ?? 4.8} />
            <span className="text-neutral-500">({product.reviewCount ?? 0})</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${inStock ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
              {inStock ? `現貨 ${product.stock} 件` : "補貨中"}
            </span>
          </div>

          <div className="mt-4 text-3xl font-bold tracking-tight">{priceText}</div>

          <p className="mt-3 text-neutral-600">{product.description}</p>

          {/* Service badges */}
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <li className="flex items-center gap-2 rounded-xl border bg-white p-3">
              <Truck className="h-4 w-4"/> {product.shipping || "多種配送"}
            </li>
            <li className="flex items-center gap-2 rounded-xl border bg-white p-3">
              <ShieldCheck className="h-4 w-4"/> {product.warranty || "保固 / 七天鑑賞"}
            </li>
            <li
              onClick={toggleFavorite}
              className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white p-3 hover:bg-neutral-50"
              title={isFav ? "點擊取消收藏" : "點擊加入收藏"}
            >
              <Heart className={`h-4 w-4 ${isFav ? "text-red-500 fill-red-500" : ""}`} />
              {isFav ? "已收藏" : "加入收藏"}
            </li>
          </ul>

          {/* Qty + CTA */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-2xl border bg-white p-1">
              <button
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${canMinus ? "hover:bg-neutral-50" : "opacity-40"}`}
                onClick={() => canMinus && setQty((n) => Math.max(1, n - 1))}
                aria-label="減少數量"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="min-w-[3rem] text-center text-lg font-medium">{qty}</div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-50"
                onClick={() => setQty((n) => n + 1)}
                aria-label="增加數量"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              disabled={!inStock}
              onClick={addToCart}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="h-5 w-5" />
              {inStock ? "加入購物車" : "補貨通知"}
            </button>
          </div>

          {/* Details */}
          <div className="mt-8 space-y-3">
            <Details title="商品規格">
              {product.specs ? (
                <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <li key={k} className="flex items-start justify-between gap-4 rounded-xl border bg-white p-3">
                      <span className="text-neutral-500">{k}</span>
                      <span className="font-medium">{String(v)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-500">無提供規格。</p>
              )}
            </Details>
            <Details title="出貨與退貨">
              <ul className="list-disc pl-5 text-sm text-neutral-700">
                <li>工作日 24-48 小時內出貨（實際依訂單量調整）。</li>
                <li>七天鑑賞期（不含人為損壞，保持新品完整）。</li>
                <li>大型商品可能需加收樓層搬運費，請留意配送通知。</li>
              </ul>
            </Details>
          </div>
        </section>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/70 md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex items-center rounded-2xl border bg-white p-1">
            <button
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${canMinus ? "hover:bg-neutral-50" : "opacity-40"}`}
              onClick={() => canMinus && setQty((n) => Math.max(1, n - 1))}
              aria-label="減少數量"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="min-w-[3rem] text-center text-lg font-medium">{qty}</div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-50"
              onClick={() => setQty((n) => n + 1)}
              aria-label="增加數量"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            disabled={!inStock}
            onClick={addToCart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="h-5 w-5" />
            {inStock ? `加入購物車｜${priceText}` : "補貨通知"}
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-[100dvh] bg-neutral-50 pb-20 md:pb-0">
      {children}
    </div>
  );
}

function Details({ title, children }) {
  return (
    <details className="group rounded-2xl border bg-white p-4" open>
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <span className="text-lg font-semibold">{title}</span>
        <span className="text-sm text-neutral-500 group-open:hidden">展開</span>
        <span className="hidden text-sm text-neutral-500 group-open:block">收合</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function Stars({ rating = 4.8 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const items = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return "full";
    if (i === full && half) return "half";
    return "empty";
  });
  return (
    <div className="flex items-center gap-1" aria-label={`評分 ${rating}`}>
      {items.map((t, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${t === "empty" ? "text-neutral-300" : "text-amber-500"}`}
          fill={t === "empty" ? "none" : "currentColor"}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 md:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-2xl bg-neutral-200" />
      <div className="space-y-3">
        <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-200" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-neutral-200" />
        <div className="h-10 w-1/4 animate-pulse rounded bg-neutral-200" />
        <div className="h-20 w-full animate-pulse rounded bg-neutral-200" />
        <div className="h-12 w-1/2 animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  );
}

// ---- 類別顯示與路由映射 ----
function categoryLabel(key) {
  const map = {
    "3c": "電腦／事務設備",
    appliances: "家電",
    baby: "母嬰",
    beauty: "美妝",
  };
  return map[key] || key;
}

function categoryPath(key) {
  // 你的實際分類路由：3c 映射到 /category/computers-office
  const map = {
    "3c": "/category/computers-office",
    appliances: "/category/appliances",
    baby: "/category/baby",
    beauty: "/category/beauty",
  };
  return map[key] || "/";
}
