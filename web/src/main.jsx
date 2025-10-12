// web/src/main.jsx
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom'

import './index.css'

// Pages（前台）
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import PaymentInfo from './pages/PaymentInfo'
import Favorites from './pages/Favorites'

// Pages（後台）
import AdminLogin from './pages/admin/Login'
import Orders from './pages/admin/Orders'
import OrderDetail from './pages/admin/OrderDetail'

// 分類頁
import CategoryPage from './pages/CategoryPage.jsx'

// 動畫
import { motion, AnimatePresence } from 'framer-motion'

// Icons
import { Menu, Heart, ShoppingCart, Home as HomeIcon, Lock, ListChecks, LogOut, Package, Receipt } from 'lucide-react'

// 分類設定
import { CATEGORIES, matchByKey } from './data/categories'

// 廠商頁面
import VendorLogin from "./pages/vendor/VendorLogin";
import VendorRegister from "./pages/vendor/VendorRegister";
import VendorForgot from "./pages/vendor/VendorForgot";
import VendorReset from "./pages/vendor/VendorReset";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorProductForm from "./pages/vendor/VendorProductForm";
import VendorOrders from "./pages/vendor/VendorOrders";

// Vendor API（保護頁面＆檢查登入）
import { vGET } from './lib/vendorApi'

/* ---------------- Admin 驗證狀態 ---------------- */
function useAdminAuthed() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('adminToken'))
  useEffect(() => {
    const refresh = () => setAuthed(!!localStorage.getItem('adminToken'))
    const onStorage = (e) => { if (e.key === 'adminToken') refresh() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  return [authed, setAuthed]
}

function RequireAdmin({ children }) {
  const [authed] = useAdminAuthed()
  if (!authed) return <Navigate to="/admin/login" replace />
  return children
}

/* ---------------- Vendor 保護元件 ---------------- */
function RequireVendor({ children }) {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { vendor } = await vGET('/me'); // 後端以 Cookie 驗證
        if (!alive) return;
        if (vendor) setState({ loading: false, ok: true });
        else {
          setState({ loading: false, ok: false });
          navigate('/vendor/login', { replace: true });
        }
      } catch {
        if (!alive) return;
        setState({ loading: false, ok: false });
        navigate('/vendor/login', { replace: true });
      }
    })();
    return () => { alive = false; };
  }, [navigate]);

  if (state.loading) return null; // 可以改成 skeleton
  if (!state.ok) return null;     // 已導到登入
  return children;
}

/* ---------------- Header（毛玻璃＋半透明 on scroll） ---------------- */
function Header() {
  const [authed, setAuthed] = useAdminAuthed()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const logout = () => {
    localStorage.removeItem('adminToken')
    setAuthed(false)
    navigate('/')
  }

  // 玻璃感背景：漸層＋透明度隨捲動調整
  const glassBg = scrolled
    ? 'linear-gradient(90deg, rgba(123,79,42,0.85) 0%, rgba(201,164,114,0.85) 100%)'
    : 'linear-gradient(90deg, rgba(123,79,42,0.65) 0%, rgba(201,164,114,0.65) 100%)'

  return (
    <>
      <div
        className="sticky top-0 z-50 header-wood-glass"
        style={{
          background: glassBg,
          backdropFilter: 'saturate(160%) blur(10px)',
          WebkitBackdropFilter: 'saturate(160%) blur(10px)',
          boxShadow: scrolled ? '0 6px 14px rgba(0,0,0,0.12)' : '0 3px 8px rgba(0,0,0,0.08)',
          transition: 'box-shadow .2s ease, background .2s ease',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-2 text-white">
          <div className="flex items-center gap-1">
            <button onClick={() => setOpen(true)} className="p-2 -ml-1 active:scale-[0.98] text-white/95">
              <Menu className="w-6 h-6" />
            </button>
            <button onClick={() => navigate('/favorites')} className="p-2 text-white/95">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          <button onClick={() => navigate('/')} className="text-lg font-extrabold tracking-wide">
            ZEUS SHOP
          </button>

          <div className="flex items-center gap-1">
            <button onClick={() => navigate('/cart')} className="p-2 active:scale-[0.98] text-white/95">
              <ShoppingCart className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <MenuDrawer
        open={open}
        onClose={() => setOpen(false)}
        onNavigate={(to) => { setOpen(false); navigate(to) }}
        authed={authed}
        onLogout={logout}
      />
    </>
  )
}

function Footer() {
  return (
    <footer className="footer-wood mt-16 py-4">
      <div className="max-w-6xl mx-auto px-6 text-center text-sm opacity-90">
        © {new Date().getFullYear()} ZeusShop. 以木質溫度打造溫暖購物體驗 🌾
      </div>
    </footer>
  )
}

/* ---------------- 左側抽屜 ---------------- */
function MenuDrawer({ open, onClose, onNavigate, authed, onLogout }) {
  const [vendorAuthed, setVendorAuthed] = useState(false);

  // 抽屜打開時才去檢查一次 vendor 是否登入，避免每次載入都打 API
  useEffect(() => {
    let alive = true;
    if (open) {
      (async () => {
        try {
          const { vendor } = await vGET('/me');
          if (!alive) return;
          setVendorAuthed(!!vendor);
        } catch {
          if (!alive) return;
          setVendorAuthed(false);
        }
      })();
    }
    return () => { alive = false; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[82%] bg-white shadow-2xl flex flex-col"
            initial={{ x: -340 }}
            animate={{ x: 0 }}
            exit={{ x: -340 }}
            transition={{ type: 'tween', duration: 0.18 }}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-lg font-semibold">選單</div>
              <button onClick={onClose} className="p-1 text-neutral-600">✕</button>
            </div>

            <nav className="p-2 overflow-auto flex-1">
              <NavItem label="首頁" icon={HomeIcon} onClick={() => onNavigate('/')} />
              <div className="px-4 pt-3 pb-1 text-xs text-neutral-500">全部分類</div>
              <div className="px-2">
                {CATEGORIES.map(({ key, label, Icon }) => (
                  <NavItem key={key} label={label} icon={Icon} onClick={() => onNavigate(`/category/${key}`)} />
                ))}
              </div>

              {/* 廠商專區 */}
              <div className="px-4 pt-3 text-xs text-neutral-500">廠商專區</div>
              <div className="px-2 space-y-1">
                <NavItem label="廠商登入" icon={Lock} onClick={() => onNavigate('/vendor/login')} />
                {vendorAuthed && (
                  <>
                    <NavItem label="我的商品" icon={Package} onClick={() => onNavigate('/vendor/products')} />
                    <NavItem label="我的訂單" icon={Receipt} onClick={() => onNavigate('/vendor/orders')} />
                  </>
                )}
              </div>
            </nav>

            <div className="border-t p-2">
              {!authed ? (
                <NavItem label="賣家登入" icon={Lock} onClick={() => onNavigate('/admin/login')} />
              ) : (
                <>
                  <NavItem label="訂單管理" icon={ListChecks} onClick={() => onNavigate('/admin/orders')} />
                  <NavItem label="登出" icon={LogOut} onClick={onLogout} />
                </>
              )}

              <div className="px-2 pt-2 text-[11px] text-neutral-500">© Zeus Shop</div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function NavItem({ label, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-50 active:scale-[0.99] text-[15px]"
    >
      {Icon && <Icon className="w-5 h-5 opacity-75" />}
      <span>{label}</span>
    </button>
  )
}

/* ---------------- 桌面殼 ---------------- */
function DesktopShell() {
  return (
    <div className="wood-app" style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <Header />
      <Outlet />
    </div>
  )
}

/* ---------------- 路由 ---------------- */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DesktopShell />}>
          {/* 首頁 */}
          <Route path="/" element={<Home />} />

          {/* 分類頁 */}
          {CATEGORIES.map(cat => (
            <Route
              key={cat.key}
              path={`/category/${cat.key}`}
              element={<CategoryPage title={cat.label} matcher={matchByKey(cat.key)} />}
            />
          ))}

          {/* 其他頁 */}
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/:id" element={<PaymentInfo />} />
          <Route path="/favorites" element={<Favorites />} />

          {/* 後台（保留） */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/orders" element={<RequireAdmin><Orders /></RequireAdmin>} />
          <Route path="/admin/orders/:id" element={<RequireAdmin><OrderDetail /></RequireAdmin>} />

          {/* 廠商：公開頁（可未登入） */}
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor/forgot" element={<VendorForgot />} />
          <Route path="/vendor/reset" element={<VendorReset />} />

          {/* 廠商：需登入頁 */}
          <Route path="/vendor" element={<RequireVendor><VendorDashboard /></RequireVendor>} />
          <Route path="/vendor/products" element={<RequireVendor><VendorProducts /></RequireVendor>} />
          <Route path="/vendor/products/new" element={<RequireVendor><VendorProductForm /></RequireVendor>} />
          <Route path="/vendor/products/:id/edit" element={<RequireVendor><VendorProductForm /></RequireVendor>} />
          <Route path="/vendor/orders" element={<RequireVendor><VendorOrders /></RequireVendor>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
