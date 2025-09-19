import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'

import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'

import AdminLogin from './pages/admin/Login'
import Orders from './pages/admin/Orders'
import OrderDetail from './pages/admin/OrderDetail'
import PaymentInfo from './pages/PaymentInfo'

// 簡單的 admin 驗證狀態
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

// 路由守衛：未登入時導去 /admin/login
function RequireAdmin({ children }) {
  const [authed] = useAdminAuthed()
  if (!authed) return <Navigate to="/admin/login" replace />
  return children
}

function Header() {
  const [authed, setAuthed] = useAdminAuthed()
  const navigate = useNavigate()

  // 客戶端不顯示任何管理入口
  const logout = () => {
    localStorage.removeItem('adminToken')
    setAuthed(false)
    navigate('/') // 登出就回首頁
  }

  return (
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom:24}}>
      <Link to="/">🛒 Zeus Shop</Link>
      <nav style={{display:'flex', gap:12}}>
        <Link to="/cart">購物車</Link>
        {/* 不顯示管理入口；只有你知道 /admin/login 的網址 */}
        {authed && <button onClick={logout}>登出</button>}
      </nav>
    </header>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div style={{maxWidth: 960, margin: '0 auto', padding: 16}}>
        <Header />
        <Routes>
          {/* 前台頁面 */}
          <Route path="/" element={<Home/>} />
          <Route path="/product/:id" element={<ProductDetail/>} />
          <Route path="/cart" element={<Cart/>} />
          <Route path="/checkout" element={<Checkout/>} />
          {/* ✅ 付款頁一定要帶訂單 id，供 PaymentInfo 使用 useParams() */}
          <Route path="/payment/:id" element={<PaymentInfo/>} />

          {/* 後台：隱藏登入頁（不在 UI 顯示，只能手動輸入網址） */}
          <Route path="/admin/login" element={<AdminLogin/>} />

          {/* 後台：必須已登入才可進入 */}
          <Route
            path="/admin/orders"
            element={<RequireAdmin><Orders/></RequireAdmin>}
          />
          <Route
            path="/admin/orders/:id"
            element={<RequireAdmin><OrderDetail/></RequireAdmin>}
          />

          {/* 兜底（可選）：未知路徑回首頁 */}
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        </Routes>
      </div>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
