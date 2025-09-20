// web/src/api.js
import axios from 'axios'

// 正式環境請用 /api，本地可在 .env 設 VITE_API_BASE=http://127.0.0.1:8080
const BASE_URL = (import.meta.env && import.meta.env.VITE_API_BASE) ?? '/api'

const api = axios.create({
  baseURL: BASE_URL,      // ⚠️ 已含 /api
  withCredentials: false,
})

// ===== Token helpers =====
export const getAdminToken = () => localStorage.getItem('adminToken')
export const setAdminToken = (t) => localStorage.setItem('adminToken', t)

// 自動帶上 Admin Token（僅 admin 路徑）
api.interceptors.request.use(cfg => {
  const t = getAdminToken()
  const path = cfg.url || ''
  if (t && (path.startsWith('/admin/') || path.startsWith('admin/'))) {
    cfg.headers['X-Admin-Token'] = t
  }
  return cfg
})

// 401 防呆：提醒並導向登入頁
api.interceptors.response.use(
  r => r,
  e => {
    const status = e?.response?.status
    if (status === 401) {
      if (!location.pathname.startsWith('/admin/login')) {
        alert('未授權：請先在 /admin/login 設定正確的管理 Token')
        try {
          sessionStorage.setItem('postLoginRedirect', location.pathname + location.search)
        } catch {}
        location.href = '/admin/login'
      }
    }
    throw e
  }
)

/* ==========
 * Public APIs（⚠️ 路徑不再含 /api）
 * ========== */
export const listProducts = async () =>
  (await api.get('/products')).data.items

export const getProduct = async (id) =>
  (await api.get(`/products/${id}`)).data

export const createOrder = async (payload) =>
  (await api.post('/orders', payload)).data

export const updateOrderRemit = async (id, payload) =>
  (await api.put(`/orders/${id}/remit`, payload)).data

/* ==========
 * Admin APIs（需 X-Admin-Token）
 * ========== */
export const adminListOrders = async () =>
  (await api.get('/admin/orders')).data.items

export const adminGetOrder = async (id) =>
  (await api.get(`/admin/orders/${id}`)).data

export const adminUpdateOrderStatus = async (id, status) =>
  (await api.put(`/admin/orders/${id}/status`, { status })).data

export const adminDeleteOrder = async (id) =>
  (await api.delete(`/admin/orders/${id}`)).data

export const adminCreateProduct = async (payload) =>
  (await api.post('/admin/products', payload)).data

export const adminUpdateProduct = async (id, payload) =>
  (await api.put(`/admin/products/${id}`, payload)).data

export const adminDeleteProductAdmin = async (id) =>
  (await api.delete(`/admin/products/${id}`)).data

export default api
