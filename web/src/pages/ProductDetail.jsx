import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Truck, ShieldCheck, Star, ShoppingCart, Plus, Minus, Heart } from "lucide-react";
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

  const [isFav, setIsFav] = useState(false);
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

  const [activeIdx, setActiveIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const images = (product?.images?.length ? product.images : ["/img/placeholder.png"]);
  const canMinus = qty > 1;
  const inStock = (product?.stock ?? 10) > 0;

  const priceText = useMemo(() => {
    if (!product) return "";
    const val = typeof product.price === "number" ? product.price : Number(product.price || 0);
    return currency.format(val);
  }, [product]);

  function addToCart() {
    if (!product) return;
    const key = "cart";
    const raw = localStorage.getItem(key);
    const cart = raw ? JSON.parse(raw) : [];
    const pid = Number(product.id);
    const addQty = Math.max(1, parseInt(qty, 10) || 1);

    const idx = cart.findIndex((c) => Number(c.productId ?? c.id) === pid);
    if (idx >= 0) {
      const next = [...cart];
      next[idx].quantity = Math.max(1, parseInt(next[idx].quantity, 10) || 0) + addQty;
      localStorage.setItem(key, JSON.stringify(next));
    } else {
      cart.push({
        productId: pid,
        name: product.name,
        price: Number(product.price) || 0,
        quantity: addQty,
        imageUrl: images[0] || "",
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
      newList = [...list, { id: product.id, name: product.name, price: product.price, image: images[0] }];
      setIsFav(true);
    }
    localStorage.setItem("favorites", JSON.stringify(newList));
  }

  if (!product) return <NotFoundProduct />;

  return (
    <PageShell>
      {/* 麵包屑：首頁 > 分類(key對應) > 商品名 */}
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-800">首頁</Link>
        <span>/</span>
        {product?.category ? (
          <Link to={`/category/${product.category}`} className="hover:text-neutral-800">
            {getCategoryLabel(product.category)}
          </Link>
        ) : (
          <span className="text-neutral-400">未分類</span>
        )}
        <span>/</span>
        <span className="truncate text-neutral-800">{product.name}</span>

        <button
          onClick={() => navigate(-1)}
          className="ml-auto inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ChevronLeft className="h-4 w-4" /> 上一頁
        </button>
      </nav>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 md:grid-cols-2">
        {/* LEFT */}
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
                className={`aspect-square overflow-hidden rounded-xl border bg-white ${i === activeIdx ? "ring-2 ring-neutral-800" : "hover:opacity-90"}`}
                aria-label={`預覽第 ${i + 1} 張`}
              >
                <img src={src} alt="縮圖" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        {/* RIGHT */}
        <section className="flex flex-col">
          <h1 className="text-2xl font-semibold md:text-3xl">{product.name}</h1>

          <div className="mt-2 flex items-center gap-3 text-sm">
            <Stars rating={product.rating ?? 4.8} />
            <span className="text-neutral-500">({product.reviewCount ?? 0})</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${inStock ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
              {inStock ? `現貨 ${product.stock ?? 10} 件` : "補貨中"}
            </span>
          </div>

          <div className="mt-4 text-3xl font-bold tracking-tight">{priceText}</div>
          <p className="mt-3 text-neutral-600">{product.description}</p>

          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <li className="flex items-center gap-2 rounded-xl border bg-white p-3">
              <Truck className="h-4 w-4" /> {product.shipping || "多種配送"}
            </li>
            <li className="flex items-center gap-2 rounded-xl border bg-white p-3">
              <ShieldCheck className="h-4 w-4" /> {product.warranty || "保固 / 七天鑑賞"}
            </li>
            <li onClick={toggleFavorite} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white p-3 hover:bg-neutral-50">
              <Heart className={`h-4 w-4 ${isFav ? "text-red-500 fill-red-500" : ""}`} />
              {isFav ? "已收藏" : "加入收藏"}
            </li>
          </ul>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-2xl border bg-white p-1">
              <button
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${canMinus ? "hover:bg-neutral-50" : "opacity-40"}`}
                onClick={() => canMinus && setQty((n) => Math.max(1, (parseInt(n, 10) || 1) - 1))}
                aria-label="減少數量"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="min-w-[3rem] text-center text-lg font-medium">{qty}</div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-neutral-50"
                onClick={() => setQty((n) => (parseInt(n, 10) || 1) + 1)}
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

          <div className="mt-8 space-y-3">
            <Details title="商品規格">
              {renderSpecs(product.specs)}
            </Details>
            <Details title="出貨與退貨">
              <ul className="list-disc pl-5 text-sm text-neutral-700">
                <li>工作日 24–48 小時內出貨（實際依訂單量調整）。</li>
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
  if (!specs) return <p className="text-sm text-neutral-500">無提供規格。</p>;
  if (!Array.isArray(specs) && typeof specs === 'object') {
    return (
      <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        {Object.entries(specs).map(([k, v]) => (
          <li key={k} className="flex items-start justify-between gap-4 rounded-xl border bg-white p-3">
            <span className="text-neutral-500">{k}</span>
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
        <li key={i} className="flex items-start justify-between gap-4 rounded-xl border bg-white p-3">
          <span className="text-neutral-500">規格</span>
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
        <button onClick={() => navigate(-1)} className="mt-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2">
          <ChevronLeft className="h-4 w-4" /> 返回上一頁
        </button>
      </div>
    </PageShell>
  );
}