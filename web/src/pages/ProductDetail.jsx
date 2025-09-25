import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Truck, ShieldCheck, Star, ShoppingCart, Plus, Minus, Heart } from "lucide-react";
import { products as staticProducts } from "../data/products"; // ⬅ 保底資料

const API_BASE = import.meta.env.VITE_API_BASE || "";

// demo fallback
const fallbackProducts = [
  { id: "1", name: "電腦A", price: 29900, images: ["/img/demo/pc-a-1.jpg"], rating: 4.6, reviewCount: 38, stock: 12, specs: { CPU: "Ryzen 7 7800X3D" }, description: "為電競玩家打造的性價比主機。", shipping: "宅配", warranty: "原廠保固 3 年", category: "3c" },
  { id: "2", name: "電腦B", price: 35900, images: ["/img/demo/pc-b-1.jpg"], rating: 4.7, reviewCount: 22, stock: 7, specs: { CPU: "Core i7-13700F" }, description: "創作者/遊戲雙棲配置。", shipping: "宅配", warranty: "原廠保固 3 年", category: "3c" },
  { id: "3", name: "電腦C", price: 19900, images: ["/img/demo/pc-c-1.jpg"], rating: 4.3, reviewCount: 10, stock: 0, specs: { CPU: "Ryzen 5 5600G" }, description: "文書與輕度遊戲首選。", shipping: "宅配", warranty: "原廠保固 2 年", category: "3c" },
  { id: "4", name: "泡腳機", price: 1890, images: ["/img/demo/spa-1.jpg"], rating: 4.5, reviewCount: 55, stock: 25, specs: { 功率: "800W" }, description: "三段溫控、定時、滾輪按摩。", shipping: "宅配", warranty: "保固 1 年", category: "appliances" },
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [qty, setQty] = useState(1);

  // 保底把靜態清單放到全域，避免深連結時沒有列表頁注入
  if (typeof window !== "undefined" && !Array.isArray(window.__ZEUS_PRODUCTS__)) {
    window.__ZEUS_PRODUCTS__ = staticProducts;
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      // 1) 全域清單
      const globalList = Array.isArray(window.__ZEUS_PRODUCTS__) ? window.__ZEUS_PRODUCTS__ : null;
      if (globalList) {
        const found = globalList.find((p) => String(p.id) === String(id));
        if (found && mounted) {
          setProduct(found);
          setLoading(false);
          return;
        }
      }

      // 2) 單筆 API（可有可無）
      try {
        const one = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`);
        if (one.ok) {
          const data = await one.json();
          if (data && mounted) {
            setProduct(data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 3) 清單 API（就算 200 但沒找到也要 fallback）
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (res.ok) {
          const list = await res.json();
          let found = Array.isArray(list) ? list.find((p) => String(p.id) === String(id)) : null;

          if (!found) {
            const pool = (Array.isArray(staticProducts) ? staticProducts : []).concat(
              Array.isArray(fallbackProducts) ? fallbackProducts : []
            );
            found = pool.find((p) => String(p.id) === String(id)) || null;
          }

          if (mounted) {
            setProduct(found);
            setError(found ? "" : "載入商品時發生問題，已顯示暫存資料。");
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 4) 最終兜底：靜態 + demo
      const pool = (Array.isArray(staticProducts) ? staticProducts : []).concat(
        Array.isArray(fallbackProducts) ? fallbackProducts : []
      );
      const found = pool.find((p) => String(p.id) === String(id)) || null;
      if (mounted) {
        setProduct(found);
        setError(found ? "" : "找不到此商品");
        setLoading(false);
      }
    }

    load();
    return () => void (mounted = false);
  }, [id]);

  const priceText = useMemo(() => {
    if (!product) return "";
    return new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD" }).format(product.price ?? 0);
  }, [product]);

  function addToCart() {
    if (!product) return;
    const key = "cart";
    const raw = localStorage.getItem(key);
    const cart = raw ? JSON.parse(raw) : [];
    const idx = cart.findIndex((c) => String(c.id) === String(product.id));
    if (idx >= 0) cart[idx].qty += qty;
    else cart.push({ id: String(product.id), name: product.name, price: product.price, qty, image: product.images?.[0] });
    localStorage.setItem(key, JSON.stringify(cart));
    navigate("/cart");
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
      {/* 麵包屑 */}
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-800">首頁</Link>
        <span>/</span>
        {product.category ? (
          <Link to={categoryPath(product.category)} className="hover:text-neutral-800">
            {categoryLabel(product.category)}
          </Link>
        ) : (
          <span className="text-neutral-400">未分類</span>
        )}
        <span>/</span>
        <span className="truncate text-neutral-800">{product.name}</span>

        <button onClick={() => navigate(-1)} className="ml-auto inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800">
          <ChevronLeft className="h-4 w-4" /> 上一頁
        </button>
      </nav>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 md:grid-cols-2">
        {/* LEFT: 圖片區 */}
        <section>
          <div className="aspect-square overflow-hidden rounded-2xl border bg-white">
            <img src={images[activeIdx]} alt={`${product.name} 圖片 ${activeIdx + 1}`} className="h-full w-full object-cover" loading="eager" />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.map((src, i) => (
              <button key={i} onClick={() => setActiveIdx(i)} className={`aspect-square overflow-hidden rounded-xl border bg-white ${i === activeIdx ? "ring-2 ring-neutral-800" : "hover:opacity-90"}`} aria-label={`預覽第 ${i + 1} 張`}>
                <img src={src} alt="縮圖" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        {/* RIGHT: 資訊區 */}
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

          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <li className="flex items-center gap-2 rounded-xl border bg白 p-3"><Truck className="h-4 w-4"/> {product.shipping || "多種配送"}</li>
            <li className="flex items-center gap-2 rounded-xl border bg白 p-3"><ShieldCheck className="h-4 w-4"/> {product.warranty || "保固 / 七天鑑賞"}</li>
            <li className="flex items-center gap-2 rounded-xl border bg白 p-3"><Heart className="h-4 w-4"/> 加入收藏</li>
          </ul>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-2xl border bg-white p-1">
              <button className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${canMinus ? "hover:bg-neutral-50" : "opacity-40"}`} onClick={() => canMinus && setQty((n) => Math.max(1, n - 1))} aria-label="減少數量">
                <Minus className="h-4 w-4" />
              </button>
              <div className="min-w-[3rem] text-center text-lg font-medium">{qty}</div>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-50" onClick={() => setQty((n) => n + 1)} aria-label="增加數量">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button disabled={!inStock} onClick={addToCart} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50">
              <ShoppingCart className="h-5 w-5" />
              {inStock ? "加入購物車" : "補貨通知"}
            </button>
          </div>

          <div className="mt-8 space-y-3">
            <Details title="商品規格">
              {product.specs ? (
                <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <li key={k} className="flex items-start justify-between gap-4 rounded-xl border bg白 p-3">
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
    </PageShell>
  );
}

function PageShell({ children }) {
  return <div className="min-h-[100dvh] bg-neutral-50 pb-20 md:pb-0">{children}</div>;
}

function Details({ title, children }) {
  return (
    <details className="group rounded-2xl border bg白 p-4" open>
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
  const items = Array.from({ length: 5 }, (_, i) => (i < full ? "full" : i === full && half ? "half" : "empty"));
  return (
    <div className="flex items-center gap-1" aria-label={`評分 ${rating}`}>
      {items.map((t, i) => (
        <Star key={i} className={`h-4 w-4 ${t === "empty" ? "text-neutral-300" : "text-amber-500"}`} fill={t === "empty" ? "none" : "currentColor"} />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

function categoryLabel(key) {
  const map = { baby: "母嬰", "3c": "電腦／事務設備", beauty: "美妝", appliances: "家電" };
  return map[key] || key;
}
function categoryPath(key) {
  const map = { "3c": "/category/computers-office", appliances: "/category/appliances", beauty: "/category/beauty", baby: "/category/baby" };
  return map[key] || "/";
}
