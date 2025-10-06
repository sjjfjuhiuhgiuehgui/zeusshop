// web/src/pages/Checkout.jsx
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../api'

// TWD 顯示工具
const currency = new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' })
const nt = (n) => currency.format(Number(n) || 0)

// 讀取並矯正購物車資料（統一欄位與型別）
function loadCart() {
  const raw = JSON.parse(localStorage.getItem('cart') || '[]')
  const fixed = raw.map(it => {
    const pid = Number(it.productId ?? it.id)
    const price = Number(it.price) || 0
    const quantity = Math.max(1, parseInt(it.quantity ?? it.qty ?? 1, 10) || 1)
    return {
      productId: pid,
      price,
      quantity,
      name: String(it.name || ''),
      imageUrl: it.imageUrl || it.image || '',
    }
  })
  localStorage.setItem('cart', JSON.stringify(fixed))
  return fixed
}

export default function Checkout() {
  const [cart, setCart] = useState(loadCart)
  const total = useMemo(
    () => cart.reduce((s, x) => s + Number(x.price) * Number(x.quantity), 0),
    [cart]
  )

  const [form, setForm] = useState({
    buyerName: '',
    buyerPhone: '',
    shippingMethod: 'pickup', // pickup | sevencv | home
    storeCode: '',
    address: '',
  })
  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const navigate = useNavigate()

  async function submit() {
    if (cart.length === 0) { alert('購物車為空'); return }
    if (!form.buyerName.trim()) { alert('請輸入姓名'); return }
    if (!/^09\d{8}$/.test(form.buyerPhone)) { alert('請輸入正確手機號碼（09 開頭，共 10 碼）'); return }
    if (form.shippingMethod === 'sevencv' && !form.storeCode.trim()) { alert('請輸入 7-11 門市代碼/名稱'); return }
    if (form.shippingMethod === 'home' && !form.address.trim()) { alert('請輸入宅配地址'); return }

    // ✅ quantity（不是 qty），正整數且最小 1
    const items = cart
      .map(it => ({
        productId: Number(it.productId),
        quantity: Math.max(1, parseInt(it.quantity, 10) || 0),
        price: Number(it.price) || 0,
      }))
      .filter(it =>
        Number.isFinite(it.productId) && it.productId > 0 &&
        Number.isInteger(it.quantity) && it.quantity > 0 &&
        Number.isFinite(it.price) && it.price >= 0
      )

    if (items.length === 0) {
      localStorage.removeItem('cart'); setCart([])
      alert('購物車資料異常，已重置，請重新加入商品')
      return
    }

    const payload = {
      buyerName: form.buyerName.trim(),
      buyerPhone: form.buyerPhone.trim(),
      shippingMethod: form.shippingMethod,
      storeCode: form.shippingMethod === 'sevencv' ? form.storeCode.trim() : '',
      address: form.shippingMethod === 'home' ? form.address.trim() : '',
      amount: items.reduce((s, x) => s + x.price * x.quantity, 0), // 可有助於後端驗證
      items,
    }

    // 🔎 一次性除錯（看實際送出的 JSON）
    console.log('POST /api/orders payload =', payload)

    try {
      const res = await createOrder(payload)
      const state = { orderNo: res.orderNo || res.orderId, total: res.total ?? payload.amount }
      sessionStorage.setItem('lastOrderInfo', JSON.stringify(state))
      localStorage.removeItem('cart'); setCart([])
      navigate(`/payment/${res.orderId || state.orderNo}`, { state })
    } catch (e) {
      alert(e?.response?.data?.error || e.message || '下單失敗')
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 className="text-xl font-semibold mb-3">結帳</h2>

      <div className="grid gap-3">
        <label className="flex flex-col gap-1">
          <span>姓名</span>
          <input
            value={form.buyerName}
            onChange={e => onChange('buyerName', e.target.value)}
            placeholder="請輸入訂購人姓名"
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>電話</span>
          <input
            value={form.buyerPhone}
            onChange={e => onChange('buyerPhone', e.target.value)}
            placeholder="09xxxxxxxx"
            inputMode="numeric"
            maxLength={10}
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span>寄送方式</span>
          <select
            value={form.shippingMethod}
            onChange={e => onChange('shippingMethod', e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="pickup">自取</option>
            <option value="sevencv">7-11 賣貨便</option>
            <option value="home">宅配</option>
          </select>
        </label>

        {form.shippingMethod === 'sevencv' && (
          <label className="flex flex-col gap-1">
            <span>門市代碼 / 名稱</span>
            <input
              value={form.storeCode}
              onChange={e => onChange('storeCode', e.target.value)}
              placeholder="例如：7-11_123456 或 OO門市"
              className="border rounded px-3 py-2"
            />
          </label>
        )}

        {form.shippingMethod === 'home' && (
          <label className="flex flex-col gap-1">
            <span>地址</span>
            <input
              value={form.address}
              onChange={e => onChange('address', e.target.value)}
              placeholder="請輸入收件地址"
              className="border rounded px-3 py-2"
            />
          </label>
        )}

        <p className="mt-2 text-lg">應付：<strong>{nt(total)}</strong></p>

        <button
          onClick={submit}
          disabled={cart.length === 0}
          className="mt-2 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
        >
          送出訂單
        </button>
      </div>
    </div>
  )
}
