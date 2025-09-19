// web/src/api.js
import axios from 'axios'

// 允許用環境變數覆蓋，預設本機後端
const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

// 建立 axios instance（全站統一用這個）
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
})

// ===== Token helpers =====
export const getAdminToken = () => localStorage.getItem('adminToken')
export const setAdminToken = (t) => localStorage.setItem('adminToken', t)

// 自動帶上 Admin Token（若存在 localStorage）
api.interceptors.request.use(cfg => {
  const t = getAdminToken()
  if (t) cfg.headers['X-Admin-Token'] = t
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
 * Public APIs
 * ========== */
export const listProducts = async () =>
  (await api.get('/api/products')).data.items

export const getProduct = async (id) =>
  (await api.get(`/api/products/${id}`)).data

export const createOrder = async (payload) =>
  (await api.post('/api/orders', payload)).data

export const updateOrderRemit = async (id, payload) =>
  (await api.put(`/api/orders/${id}/remit`, payload)).data

/* ==========
 * Admin APIs（需 X-Admin-Token）
 * ========== */
export const adminListOrders = async () =>
  (await api.get('/api/admin/orders')).data.items

export const adminGetOrder = async (id) =>
  (await api.get(`/api/admin/orders/${id}`)).data

export const adminUpdateOrderStatus = async (id, status) =>
  (await api.put(`/api/admin/orders/${id}/status`, { status })).data

export const adminDeleteOrder = async (id) =>
  (await api.delete(`/api/admin/orders/${id}`)).data

// 產品管理（依你專案路由補齊）
export const adminCreateProduct = async (payload) =>
  (await api.post('/api/admin/products', payload)).data

export const adminUpdateProduct = async (id, payload) =>
  (await api.put(`/api/admin/products/${id}`, payload)).data

export const adminDeleteProductAdmin = async (id) =>
  (await api.delete(`/api/admin/products/${id}`)).data

export default api
