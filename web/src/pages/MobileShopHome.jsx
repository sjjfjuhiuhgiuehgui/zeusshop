import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { motion, AnimatePresence } from "framer-motion";
import "swiper/css";

import { products } from "../data/products";

// 金額格式
function formatMoney(n) {
  return new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(n);
}

/* ===========================
   Top Bar（左：漢堡＋最新消息｜中：ZEUS SHOP｜右：購物車）
   =========================== */
function TopBar({ onOpenMenu, onOpenNews, onGoCart }) {
  return (
    <div className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="mx-auto max-w-md px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={onOpenMenu} className="p-2 -ml-1 active:scale-[0.98]">
            <MenuIcon className="w-6 h-6" />
          </button>
          <button onClick={onOpenNews} className="p-2 active:scale-[0.98]">
            <BellIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="text-lg font-extrabold tracking-wide">ZEUS SHOP</div>

        <div className="flex items-center gap-1">
          <button onClick={onGoCart} className="p-2 active:scale-[0.98]">
            <CartIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   左側抽屜選單（含分類、首頁、管理員登入）
   =========================== */
function SideDrawer({ open, onClose, categoryList, onSelectCategory }) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 蒙層 */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {/* 抽屜 */}
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-72 max-w-[80%] bg-white shadow-2xl flex flex-col"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "tween", duration: 0.18 }}
          >
            <div className="p-4 border-b">
              <div className="text-lg font-semibold">選單</div>
            </div>

            <nav className="p-2 flex-1 overflow-auto">
              <MenuItem
                label="首頁"
                onClick={() => {
                  navigate("/m");
                  onClose();
                }}
                icon={HomeIcon}
              />

              <div className="px-4 pt-3 pb-1 text-xs text-neutral-500">商品分類</div>
              <div className="px-2">
                {categoryList
                  .filter((c) => c.key !== "all")
                  .map((c) => (
                    <MenuItem
                      key={c.key}
                      label={c.label}
                      onClick={() => {
                        onSelectCategory(c.key);
                        navigate("/m");
                        onClose();
                      }}
                      icon={GridIcon}
                    />
                  ))}
              </div>

              <div className="px-4 pt-3 pb-1 text-xs text-neutral-500">其他</div>
              <MenuItem
                label="管理員登入"
                onClick={() => {
                  navigate("/admin/login");
                  onClose();
                }}
                icon={LockIcon}
              />
            </nav>

            <div className="p-3 border-t text-[11px] text-neutral-500">© Zeus Shop</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function MenuItem({ label, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-50 active:scale-[0.99]"
    >
      {Icon && <Icon className="w-5 h-5 opacity-75" />}
      <span className="text-[15px]">{label}</span>
    </button>
  );
}

/* ===========================
   分類 Tabs
   =========================== */
function CategoryTabs({ list, active, setActive }) {
  return (
    <div className="sticky top-[48px] z-40 bg-white border-b border-neutral-200">
      <div className="flex overflow-x-auto no-scrollbar">
        {list.map((c) => (
          <button
            key={c.key}
            onClick={() => setActive(c.key)}
            className={`px-4 py-3 text-sm whitespace-nowrap relative ${
              active === c.key ? "font-semibold text-black" : "text-neutral-500"
            }`}
          >
            {c.label}
            {active === c.key && (
              <motion.span
                layoutId="tab-underline"
                className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-black rounded"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===========================
   Banner 輪播
   =========================== */
function Banner() {
  const banners = [
    { id: 1, img: "/images/banner-1.jpg", alt: "Big Sale" },
    { id: 2, img: "/images/banner-2.jpg", alt: "New Arrivals" },
    { id: 3, img: "/images/banner-3.jpg", alt: "Trending Now" },
  ];
  return (
    <div className="px-4 pt-3">
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <Swiper spaceBetween={8} slidesPerView={1} loop>
          {banners.map((b) => (
            <SwiperSlide key={b.id}>
              <img src={b.img} alt={b.alt} className="w-full h-40 object-cover" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

/* ===========================
   商品卡
   =========================== */
function ProductCard({ p, onAdd, onOpen }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200">
      <button onClick={onOpen} className="w-full text-left">
        <div className="aspect-[3/4] overflow-hidden">
          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-3">
          <div className="text-sm line-clamp-2 min-h-[2.5rem]">{p.name}</div>
          <div className="mt-1 font-semibold">{formatMoney(p.price)}</div>
        </div>
      </button>
      <div className="px-3 pb-3">
        <button
          onClick={onAdd}
          className="mt-1 w-full rounded-full py-2 text-sm font-medium bg-black text-white active:scale-[0.98] transition"
        >
          加入購物車
        </button>
      </div>
    </div>
  );
}

function ProductGrid({ list, onAdd, onOpen }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-24">
      {list.map((p) => (
        <ProductCard key={p.id} p={p} onAdd={() => onAdd(p)} onOpen={() => onOpen(p)} />
      ))}
    </div>
  );
}

/* ===========================
   底部 Tab
   =========================== */
function BottomTabBar() {
  const navigate = useNavigate();
  const [active, setActive] = useState("home");
  const tabs = [
    { key: "home", label: "首頁", icon: HomeIcon, to: "/m" },
    { key: "categories", label: "分類", icon: GridIcon, to: "/m#categories" },
    { key: "cart", label: "購物車", icon: CartIcon, to: "/cart" },
    { key: "me", label: "我的", icon: UserIcon, to: "/me" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md">
        <div className="m-3 rounded-2xl border border-neutral-200 bg-white shadow-lg">
          <div className="grid grid-cols-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setActive(t.key);
                  if (t.to.startsWith("/")) navigate(t.to);
                  else navigate("/m");
                }}
                className={`py-2.5 flex flex-col items-center gap-1 ${
                  active === t.key ? "text-black" : "text-neutral-500"
                }`}
              >
                <t.icon className="w-5 h-5" />
                <span className="text-[11px]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Icons
   =========================== */
function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
function BellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2z" />
      <path d="M18 16V9a6 6 0 1 0-12 0v7l-2 2h16l-2-2z" />
    </svg>
  );
}
function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function GridIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  );
}
function CartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M3 4h2l1.6 9.6a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 2-1.6L20 8H6" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
}
function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c2.5-3 5-4.5 8-4.5S17.5 17 20 20" />
    </svg>
  );
}
function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* ===========================
   主頁
   =========================== */
export default function MobileShopHome() {
  const navigate = useNavigate();

  // 關鍵字保留（之後要做搜尋時可用）
  const [keyword] = useState("");

  // 分類清單（含「全部」）
  const categoryList = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return [{ key: "all", label: "全部" }, ...Array.from(set).map((c) => ({ key: c, label: c }))];
  }, []);

  const [activeCat, setActiveCat] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 過濾後的商品
  const filtered = useMemo(() => {
    let list = products;
    if (activeCat !== "all") list = list.filter((p) => p.category === activeCat);
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      list = list.filter((p) => (p.name + String(p.price)).toLowerCase().includes(k));
    }
    return list;
  }, [activeCat, keyword]);

  // [ZEUS] 將首頁（或目前視圖）的商品清單注入到全域，讓 ProductDetail 可直接使用
  useEffect(() => {
    const arr = products; // 若你想注入當前過濾後清單，改成 const arr = filtered;
    if (Array.isArray(arr) && arr.length) {
      const prev = Array.isArray(window.__ZEUS_PRODUCTS__) ? window.__ZEUS_PRODUCTS__ : [];
      const byId = new Map(prev.map((p) => [String(p.id), p]));
      arr.forEach((p) => byId.set(String(p.id), p)); // 以 id 合併去重
      window.__ZEUS_PRODUCTS__ = Array.from(byId.values());
    }
  }, [products]); // 若上面用 filtered，這裡也改成 [filtered]

  // 購物車
  const onAdd = (p) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex((x) => x.productId === p.id);
    if (idx >= 0) {
      const next = [...cart];
      next[idx].quantity++;
      localStorage.setItem("cart", JSON.stringify(next));
    } else {
      const next = [...cart, { productId: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, quantity: 1 }];
      localStorage.setItem("cart", JSON.stringify(next));
    }
    alert("已加入購物車");
  };

  const onOpen = (p) => navigate(`/product/${p.id}`);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-md">
        <TopBar
          onOpenMenu={() => setDrawerOpen(true)}
          onOpenNews={() => navigate("/m#news")}
          onGoCart={() => navigate("/cart")}
        />

        <CategoryTabs list={categoryList} active={activeCat} setActive={setActiveCat} />
        <Banner />

        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="text-sm text-neutral-600">共 {filtered.length} 件商品</div>
          <button className="text-sm underline">篩選</button>
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeCat + keyword}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ProductGrid list={filtered} onAdd={onAdd} onOpen={onOpen} />
          </motion.div>
        </AnimatePresence>

        <BottomTabBar />

        {/* 左側抽屜 */}
        <SideDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          categoryList={categoryList}
          onSelectCategory={(key) => setActiveCat(key)}
        />
      </div>
    </div>
  );
}
