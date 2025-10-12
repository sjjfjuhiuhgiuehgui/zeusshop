// web/src/pages/ProductDetail.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Truck, ShieldCheck, Star, ShoppingCart, Plus, Minus, Heart,
} from "lucide-react";
import { products } from "../data/products";
import { getCategoryLabel } from "../data/categories";

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD" });

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const product = useMemo(() => {
    if (!id) return null;
    return products.find((p) => Number(p.id) === Number(id) || String(p.slug) === String(id)) || null;
  }, [id]);

  const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;

  // 初始選取容量
  const [variantKey, setVariantKey] = useState(product?.defaultVariantKey || product?.variants?.[0]?.key);
  useEffect(() => {
    setVariantKey(product?.defaultVariantKey || product?.variants?.[0]?.key);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return product.variants.find(v => v.key === variantKey) || product.variants[0];
  }, [hasVariants, product, variantKey]);

  // ---------------- 變體圖片畫廊 + 容量切換對應圖片 ----------------
  const variantImages = hasVariants ? (product?.variants || []).map(v => v.image).filter(Boolean) : [];
  const gallery = hasVariants
    ? Array.from(new Set(variantImages))
    : (product?.images || []);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!hasVariants) return;
    const v = product.variants.find(x => x.key === variantKey) || product.variants[0];
    const idx = gallery.findIndex(u => u === v?.image);
    setActiveIdx(idx >= 0 ? idx : 0);
  }, [variantKey, hasVariants, product, gallery]);

  const displayImage = gallery[activeIdx] || "/images/no-image.png";

  // 價格（變體優先）
  const displayPriceNumber = hasVariants ? (selectedVariant?.price ?? 0) : (Number(product?.price) || 0);
  const priceText = currency.format(displayPriceNumber);

  // 收藏
  const [isFav, setIsFav] = useState(false);
  useEffect(() => {
    if (!product) return;
    try {
      const raw = localStorage.getItem("favorites");
      const list = raw ? JSON.parse(raw) : [];
      const exists = list.find((p) => String(p.id) === String(product.id));
      setIsFav(!!exists);
    } catch { setIsFav(false); }
  }, [product]);

  const [qty, setQty] = useState(1);
  const canMinus = qty > 1;
  const inStock = (product?.stock ?? 10) > 0;

  // 合併規格：變體優先
  const mergedSpecs = useMemo(() => {
    const base = Array.isArray(product?.specs) ? product.specs : [];
    const v = Array.isArray(selectedVariant?.specs) ? selectedVariant.specs : [];
    const keys = (s) => String(s).split("：")[0];
    const baseFiltered = base.filter(bs => !v.some(vs => keys(vs) === keys(bs)));
    return [...v, ...baseFiltered];
  }, [product, selectedVariant]);

  function addToCart() {
    if (!product) return;
    const key = "cart";
    const raw = localStorage.getItem(key);
    const cart = raw ? JSON.parse(raw) : [];
    const pid = Number(product.id);
    const addQty = Math.max(1, parseInt(qty, 10) || 1);
    const idx = cart.findIndex((c) =>
      Number(c.productId ?? c.id) === pid &&
      String(c.variantKey || "") === String(hasVariants ? selectedVariant?.key : "")
    );
    if (idx >= 0) {
      const next = [...cart];
      next[idx].quantity = Math.max(1, parseInt(next[idx].quantity, 10) || 0) + addQty;
      localStorage.setItem(key, JSON.stringify(next));
    } else {
      cart.push({
        productId: pid,
        name: product.name + (hasVariants ? `（${selectedVariant?.label}）` : ""),
        price: displayPriceNumber,
        quantity: addQty,
        imageUrl: displayImage,            // ✅ 帶入目前大圖
        variantKey: hasVariants ? selectedVariant?.key : undefined,
        category: product.category,
      });
      localStorage.setItem(key, JSON.stringify(cart));
    }
    navigate("/cart");
  }

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
      newList = [...list, { id: product.id, name: product.name, price: displayPriceNumber, image: displayImage }];
      setIsFav(true);
    }
    localStorage.setItem("favorites", JSON.stringify(newList));
  }

  if (!product) return <NotFoundProduct />;

  return (
    <PageShell>
      {/* 麵包屑（木質色） */}
      <nav
        className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-6 text-sm"
        style={{ color: 'var(--wood-sub)' }}
      >
        <Link to="/" className="hover:underline">首頁</Link>
        <span>/</span>
        {product?.category ? (
          <Link to={`/category/${product.category}`} className="hover:underline">
            {getCategoryLabel(product.category)}
          </Link>
        ) : <span className="opacity-70">未分類</span>}
        <span>/</span>
        <span className="truncate" style={{ color: 'var(--wood-text)' }}>{product.name}</span>
        <button
          onClick={() => navigate(-1)}
          className="ml-auto inline-flex items-center gap-1 btn-wood"
          aria-label="上一頁"
        >
          <ChevronLeft className="h-4 w-4" /> 上一頁
        </button>
      </nav>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 md:grid-cols-2">
        {/* LEFT：圖片區 */}
        <section className="wood-section">
          <div className="aspect-square overflow-hidden rounded-2xl border bg-white shadow-sm">
            <img
              src={displayImage}
              alt={`${product.name} 圖片 ${activeIdx + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
              loading="eager"
            />
          </div>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {gallery.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`aspect-square overflow-hidden rounded-xl border bg-white transition-all ${
                  i === activeIdx
                    ? "ring-2"
                    : "hover:opacity-90"
                }`}
                style={{
                  borderColor: 'color-mix(in oklab, var(--wood-accent) 55%, transparent)',
                  boxShadow: i === activeIdx ? '0 0 0 2px var(--wood-accent) inset' : 'none'
                }}
                aria-label={`預覽第 ${i + 1} 張`}
              >
                <img src={src} alt="縮圖" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        {/* RIGHT：資訊區（桌機 sticky） */}
        <section className="wood-section md:sticky md:top-20 h-max">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold md:text-3xl" style={{ color: 'var(--wood-primary-dark)' }}>
              {product.name}
            </h1>
            <button
              onClick={toggleFavorite}
              className="btn-wood inline-flex items-center gap-2"
              aria-label="收藏"
              title={isFav ? "取消收藏" : "加入收藏"}
            >
              <Heart className={`h-4 w-4 ${isFav ? "fill-[#8B5E3C] text-[#8B5E3C]" : ""}`} />
              {isFav ? "已收藏" : "收藏"}
            </button>
          </div>

          <div className="mt-2 flex items-center gap-3 text-sm">
            <Stars rating={product.rating ?? 4.8} />
            <span style={{ color: 'var(--wood-sub)' }}>({product.reviewCount ?? 0})</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              (product?.stock ?? 10) > 0 ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
            }`}>
              {(product?.stock ?? 10) > 0 ? `現貨 ${product.stock ?? 10} 件` : "補貨中"}
            </span>
          </div>

          {/* 容量選擇器（僅對有 variants 的商品顯示） */}
          {hasVariants && (
            <div className="mt-4">
              <label className="text-sm" style={{ color: 'var(--wood-sub)' }}>容量</label>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2"
                style={{ borderColor: 'var(--wood-accent)' }}
                value={variantKey}
                onChange={(e) => setVariantKey(e.target.value)}
              >
                {product.variants.map(v => (
                  <option key={v.key} value={v.key}>{v.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 價格 */}
          <div className="mt-4 text-3xl font-bold tracking-tight">{priceText}</div>

          {/* 介紹 */}
          {product.description && (
            <p className="mt-3 whitespace-pre-wrap" style={{ color: 'var(--wood-sub)' }}>
              {product.description}
            </p>
          )}

          {/* 規格 */}
          <div className="mt-4">
            <Details title="商品規格">
              {renderSpecs(mergedSpecs)}
            </Details>
          </div>

          {/* 服務（木質小條列） */}
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <li className="wood-card flex items-center gap-2 px-3 py-2">
              <Truck className="h-4 w-4" /> 工作日 24–48 小時內出貨
            </li>
            <li className="wood-card flex items-center gap-2 px-3 py-2">
              <ShieldCheck className="h-4 w-4" /> 七天鑑賞期
            </li>
            <li className="wood-card flex items-center gap-2 px-3 py-2">
              <Star className="h-4 w-4" /> 優良賣家保證
            </li>
          </ul>

          {/* 購物操作 */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-2xl border bg-white p-1" style={{ borderColor: 'var(--wood-accent)' }}>
              <button
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${canMinus ? "hover:bg-neutral-50" : "opacity-40"}`}
                onClick={() => canMinus && setQty(n => Math.max(1, (parseInt(n, 10) || 1) - 1))}
                aria-label="減少數量"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="min-w-[3rem] text-center text-lg font-medium">{qty}</div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-50"
                onClick={() => setQty(n => (parseInt(n, 10) || 1) + 1)}
                aria-label="增加數量"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              disabled={!inStock}
              onClick={addToCart}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-white shadow transition"
              style={{
                background: 'linear-gradient(90deg,var(--wood-primary-dark),var(--wood-primary-light))',
                boxShadow: '0 8px 18px rgba(139,94,60,.18)'
              }}
            >
              <ShoppingCart className="h-5 w-5" />
              {(product?.stock ?? 10) > 0 ? "加入購物車" : "補貨通知"}
            </button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

/* === 輔助元件（以木質視覺微調） === */
function PageShell({ children }) {
  // 背景沿用全站木質漸層；內層留白由 wood-section 承擔
  return <div className="min-h-[100dvh] pb-20 md:pb-0">{children}</div>;
}

function Details({ title, children }) {
  return (
    <details className="group wood-card p-4" open>
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <span className="text-lg font-semibold">{title}</span>
        <span className="text-sm" style={{ color: 'var(--wood-sub)' }}>
          <span className="group-open:hidden">展開</span>
          <span className="hidden group-open:inline">收合</span>
        </span>
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
        <Star
          key={i}
          className={`h-4 w-4 ${t === "empty" ? "text-neutral-300" : "text-amber-500"}`}
          fill={t === "empty" ? "none" : "currentColor"}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

function renderSpecs(specs) {
  if (!specs) return <p className="text-sm" style={{ color: 'var(--wood-sub)' }}>無提供規格。</p>;
  if (!Array.isArray(specs) && typeof specs === 'object') {
    return (
      <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        {Object.entries(specs).map(([k, v]) => (
          <li key={k} className="flex items-start justify-between gap-4 rounded-xl border bg-white p-3"
              style={{ borderColor: 'color-mix(in oklab, var(--wood-accent) 40%, transparent)' }}>
            <span style={{ color: 'var(--wood-sub)' }}>{k}</span>
            <span className="font-medium">{String(v)}</span>
          </li>
        ))}
      </ul>
    );
  }
  const items = Array.isArray(specs) ? specs : [String(specs)];
  return (
    <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
      {items.map((line, i) => (
        <li key={i} className="flex items-start justify-between gap-4 rounded-xl border bg-white p-3"
            style={{ borderColor: 'color-mix(in oklab, var(--wood-accent) 40%, transparent)' }}>
          <span style={{ color: 'var(--wood-sub)' }}>規格</span>
          <span className="font-medium">{line}</span>
        </li>
      ))}
    </ul>
  );
}

function NotFoundProduct() {
  const navigate = useNavigate();
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 text-center">
        <p className="text-lg">找不到此商品</p>
        <button onClick={() => navigate(-1)} className="mt-4 btn-wood inline-flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> 返回上一頁
        </button>
      </div>
    </PageShell>
  );
}
