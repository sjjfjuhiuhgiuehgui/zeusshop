import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/categories";
import { products } from "../data/products";
import MonthlySlider from "../components/MonthlySlider";

// 與 CategoryPage 一致的工具：價格格式化、圖片路徑、加入購物車
const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD" });
const nt = (n) => currency.format(Number(n) || 0);

function normalizePublicPath(p) {
  if (!p) return "/img/placeholder.png";
  return p.startsWith("/") ? p : `/${p}`;
}

function onAdd(p) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const pid = Number(p.id);
  const idx = cart.findIndex((x) => Number(x.productId ?? x.id) === pid);
  if (idx >= 0) {
    const next = [...cart];
    next[idx].quantity = Math.max(1, parseInt(next[idx].quantity, 10) || 0) + 1;
    localStorage.setItem("cart", JSON.stringify(next));
  } else {
    localStorage.setItem(
      "cart",
      JSON.stringify([
        ...cart,
        {
          productId: pid,
          name: p.name,
          price: Number(p.price) || 0,
          quantity: 1,
          imageUrl: normalizePublicPath(p.images?.[0] || p.image),
        },
      ])
    );
  }
  alert("已加入購物車");
}

// 排行榜（暫用前端打分；之後可改為後端銷量 API）
const popularityScore = (name = "") => Array.from(name).reduce((s, ch) => s + ch.charCodeAt(0), 0);

export default function Home() {
  const navigate = useNavigate();

  // 本月推薦：只取「有圖」商品，隨機挑 6 個，使用與 CategoryPage 相同的卡片結構
  const monthlyPicks = useMemo(() => {
    const withImg = products.filter((p) => (p.images && p.images.length) || p.image);
    const arr = [...withImg];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 6);
  }, []);

  // 排行榜 Top10（點整列導向商品頁；按鈕防冒泡）
  const top10 = useMemo(() => {
    return [...products]
      .sort((a, b) => popularityScore(b.name) - popularityScore(a.name))
      .slice(0, 10);
  }, []);

  return (
    <div className="pt-3 space-y-14">
      {/* 1) 本月活動：自動輪播（圖片放 /public/images/monthly/） */}
      <section className="wood-section" aria-label="本月活動">
        <h2 className="h2-wood">本月活動</h2>
        <MonthlySlider />
      </section>

      {/* 2) 本月推薦：直接用分類頁的商品卡（圖片／名稱／價格／加入購物車／查看更多） */}
      <section className="wood-section" aria-label="本月推薦">
        <h2 className="h2-wood">本月推薦</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3">
          {monthlyPicks.map((p) => {
            const cover = p.image || p.images?.[0];
            return (
              <article key={p.id} className="group relative rounded-2xl border bg-white overflow-hidden">
                <Link to={`/product/${p.id}`} className="block aspect-square">
                  <img
                    src={normalizePublicPath(cover)}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </Link>

                <div className="p-4 space-y-1">
                  <Link to={`/product/${p.id}`} className="font-medium line-clamp-1 hover:underline">
                    {p.name}
                  </Link>
                  <div className="font-medium">{nt(p.price)}</div>
                </div>

                <div className="p-4 pt-0 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(p);
                    }}
                    className="btn-wood"
                    type="button"
                  >
                    加入購物車
                  </button>

                  <Link to={`/product/${p.id}`} className="ml-auto btn-wood">
                    查看更多
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3) 商品種類：保留你的九宮格 */}
      <section className="wood-section" aria-label="請選擇商品分類">
        <h2 className="h2-wood">請選擇商品分類</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {CATEGORIES.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => navigate(`/category/${key}`)}
              title={label}
              aria-label={label}
              className="group flex flex-col items-center justify-center text-center gap-2 focus:outline-none"
            >
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full grid place-items-center border border-neutral-200 bg-[#DAB89433] text-neutral-800 shadow-sm transition-all duration-200 group-hover:bg-[#DAB89466] active:scale-95">
                {Icon && <Icon className="w-8 h-8 md:w-9 md:h-9" />}
              </div>
              <div className="text-sm md:text-base transition-colors duration-200" style={{ color: 'var(--wood-sub)' }}>
                {label}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 4) 購買排行榜：點整列導頁；右側按鈕防冒泡（含 hover 動效） */}
      <section className="wood-section" aria-label="購買排行榜">
        <h2 className="h2-wood">購買排行榜</h2>
        <ol className="space-y-3">
          {top10.map((p, i) => (
            <li
              key={p.id}
              onClick={() => navigate(`/product/${p.id}`)}
              className="rank-row wood-card cursor-pointer px-4 py-3 flex items-center gap-4 transition"
            >
              <span className="badge-rank">{i + 1}</span>
              <img
                src={normalizePublicPath(p.images?.[0] || p.image)}
                alt={p.name}
                className="w-12 h-12 rounded-lg object-cover"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-sm" style={{ color: 'var(--wood-sub)' }}>
                  NT$ {Number(p.price).toLocaleString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 避免點按鈕也導頁
                  onAdd(p);
                }}
                className="btn-wood"
              >
                加入購物車
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
