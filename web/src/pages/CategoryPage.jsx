import React, { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";

// 將路由 slug 對應到資料內部使用的 category key
// 例：/category/computers-office => "3c"
const slugToKey = {
  "computers-office": "3c",
  appliances: "appliances",
  beauty: "beauty",
  baby: "baby",
};

// 顯示名稱（麵包屑用）
const keyToLabel = {
  "3c": "電腦／事務設備",
  appliances: "家電",
  beauty: "美妝",
  baby: "母嬰",
};

export default function CategoryPage() {
  const { slug } = useParams(); // /category/:slug
  const navigate = useNavigate();

  const categoryKey = slugToKey[slug] ?? slug ?? "all";
  const categoryLabel = keyToLabel[categoryKey] ?? categoryKey;

  // 依分類過濾
  const list = useMemo(() => {
    if (categoryKey === "all") return products;
    return products.filter((p) => String(p.category) === String(categoryKey));
  }, [categoryKey]);

  // ✅ 將本頁的清單注入到全域，供 ProductDetail 直接讀取
  useEffect(() => {
    if (Array.isArray(list) && list.length) {
      const prev = Array.isArray(window.__ZEUS_PRODUCTS__) ? window.__ZEUS_PRODUCTS__ : [];
      const byId = new Map(prev.map((p) => [String(p.id), p]));
      list.forEach((p) => byId.set(String(p.id), p));
      window.__ZEUS_PRODUCTS__ = Array.from(byId.values());
    }
  }, [list]);

  return (
    <div className="min-h-[100dvh] bg-neutral-50 pb-16">
      {/* 麵包屑 */}
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 pt-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-800">首頁</Link>
        <span>/</span>
        <span className="text-neutral-800">{categoryLabel}</span>

        <button
          onClick={() => navigate(-1)}
          className="ml-auto inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          {/* 簡單的左箭頭 */}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          上一頁
        </button>
      </nav>

      <header className="mx-auto max-w-6xl px-4 py-4">
        <h1 className="text-2xl font-semibold">{categoryLabel}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          共 {list.length} 件商品
        </p>
      </header>

      {/* 商品網格 */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        {list.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-neutral-600">
            這個分類目前沒有商品。
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {list.map((p) => (
              <li key={p.id}>
                <ProductCard p={p} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
