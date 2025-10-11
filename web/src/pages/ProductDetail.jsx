// web/src/pages/ProductDetail.jsx（最小替換：改抓 API）
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Truck, ShieldCheck, Star, ShoppingCart, Plus, Minus, Heart } from "lucide-react";
import { getCategoryLabel } from "../data/categories";

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD" });

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) { setProduct(null); return; }
      const data = await res.json();
      setProduct(data || null);
      const imgs = Array.isArray(data?.images) ? data.images.map(it => it.url) : [];
      setImages(imgs.length ? imgs : (data?.imageUrl ? [data.imageUrl] : []));
    })();
  }, [id]);

  // 這個專案先不做變體（variants），直接顯示產品的價格與圖片
  const hasVariants = false;
  const [activeIdx, setActiveIdx] = useState(0);
  const gallery = images.length ? images : ["/images/no-image.png"];
  const displayImage = gallery[activeIdx] || "/images/no-image.png";
  const priceNumber = Number(product?.price || 0);
  const priceText = currency.format(priceNumber);

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
  const inStock = (product?.stock ?? 0) > 0;

  // 規格：後端是 JSON 字串，這裡嘗試 parse；失敗就當成單行字串顯示
  const parsedSpecs = useMemo(() => {
    if (!product?.spec) return [];
    try {
      const v = JSON.parse(product.spec);
      if (Array.isArray(v)) return v;
      if (typeof v === 'object') return Object.entries(v).map(([k,val]) => `${k}：${val}`);
      return [String(v)];
    } catch { return [String(product.spec)]; }
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
        price: priceNumber,
        quantity: addQty,
        imageUrl: displayImage,
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
      newList = [...list, { id: product.id, name: product.name, price: priceNumber, image: displayImage }];
      setIsFav(true);
    }
    localStorage.setItem("favorites", JSON.stringify(newList));
  }

  if (!product) return <NotFoundProduct />;

  return (
    <PageShell>
      {/* 麵包屑 */}
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-800">首頁</Link>
        <span>/</span>
        {product?.category ? (
          <Link to={`/category/${product.category}`} className="hover:text-neutral-800">
            {getCategoryLabel(product.category)}
          </Link>
        ) : <span className="text-neutral-400">未分類</span>}
        <span>/</span>
        <span className="truncate text-neutral-800">{product.name}</span>
        <button onClick={() => navigate(-1)} className="ml-auto inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800">
          <ChevronLeft className="h-4 w-4" /> 上一頁
        </button>
      </nav>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 md:grid-cols-2">
        {/* LEFT */}
        <section>
          <div className="aspect-square overflow-hidden rounded-2xl border bg-white">
            <img
              src={gallery[activeIdx] || "/images/no-image.png"}
              alt={`${product.name} 圖片 ${activeIdx + 1}`}
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {gallery.map((src, i) => (
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
            <span className={`rounded-full px-2 py-0.5 text-xs ${(product?.stock ?? 0) > 0 ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
              {(product?.stock ?? 0) > 0 ? `現貨 ${product.stock ?? 0} 件` : "補貨中"}
            </span>
          </div>

          {/* 價格 */}
          <div className="mt-4 text-3xl font-bold tracking-tight">{priceText}</div>

          {/* 介紹（可含多行） */}
          {product.description && (
            <p className="mt-3 whitespace-pre-wrap text-neutral-600">{product.description}</p>
          )}

          {/* 規格 */}
          <div className="mt-4">
            <Details title="商品規格">
              {renderSpecs(parsedSpecs)}
            </Details>
          </div>

          {/* 購物操作 */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-2xl border bg-white p-1">
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="h-5 w-5" />
              {(product?.stock ?? 0) > 0 ? "加入購物車" : "補貨通知"}
            </button>
          </div>

          {/* 服務說明 */}
          <div className="mt-8 space-y-3">
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

/* === 以下輔助元件維持你的原寫法 === */
function PageShell({ children }) { return <div className="min-h-[100dvh] bg-neutral-50 pb-20 md:pb-0">{children}</div>; }
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
        <Star key={i} className={`h-4 w-4 ${t === "empty" ? "text-neutral-300" : "text-amber-500"}`} fill={t === "empty" ? "none" : "currentColor"} />
      ))}
      <span className="ml-1 text-sm font-medium">{Number(rating).toFixed(1)}</span>
    </div>
  );
}
function renderSpecs(specs) {
  if (!specs || specs.length === 0) return <p className="text-sm text-neutral-500">無提供規格。</p>;
  return (
    <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
      {specs.map((line, i) => (
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
