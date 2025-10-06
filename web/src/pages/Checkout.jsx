import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../api'

const currency = new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' })

export default function Checkout() {
  const [cart, setCart] = useState(() => {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]')
    // 🔧 在載入時矯正所有數字欄位型別
    const fixed = raw.map(it => ({
      productId: Number(it.productId ?? it.id),
      price: Number(it.price) || 0,
      quantity: Number(it.quantity ?? it.qty ?? 1),
      name: it.name,
      imageUrl: it.imageUrl || it.image || ''
    }))
    localStorage.setItem('cart', JSON.stringify(fixed))
    return fixed
  })

  const total = useMemo(() => cart.reduce((s, x) => s + Number(x.price) * Number(x.quantity), 0), [cart])
  const [form, setForm] = useState({ buyerName: '', buyerPhone: '', shippingMethod: 'pickup', storeCode: '', address: '' })
  const onChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const navigate = useNavigate()

  const submit = async () => {
    if (cart.length === 0) { alert('購物車為空'); return }
    if (!form.buyerName.trim()) { alert('請輸入姓名'); return }
    if (!/^09\d{8}$/.test(form.buyerPhone)) { alert('請輸入正確手機號碼（09 開頭，共 10 碼）'); return }
    if (form.shippingMethod === 'sevencv' && !form.storeCode.trim()) { alert('請輸入 7-11 門市代碼/名稱'); return }
    if (form.shippingMethod === 'home' && !form.address.trim()) { alert('請輸入宅配地址'); return }

    try {
      const payload = {
        buyerName: form.buyerName.trim(),
        buyerPhone: form.buyerPhone.trim(),
        shippingMethod: form.shippingMethod,
        storeCode: form.shippingMethod === 'sevencv' ? form.storeCode.trim() : '',
        address: form.shippingMethod === 'home' ? form.address.trim() : '',
        items: cart.map(it => ({
          productId: Number(it.productId),  // ✅ 確保是數字
          qty: Number(it.quantity),
          price: Number(it.price)
        }))
      }

      const res = await createOrder(payload)
      const state = { orderNo: res.orderNo || res.orderId, total: res.total }
      sessionStorage.setItem('lastOrderInfo', JSON.stringify(state))
      localStorage.removeItem('cart'); setCart([])
      navigate(`/payment/${res.orderId}`, { state })
    } catch (e) {
      alert(e.response?.data?.error || e.message)
    }
  }

  return (
    <div>
      <h2>結帳</h2>
      <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <label>姓名
          <input value={form.buyerName} onChange={e => onChange('buyerName', e.target.value)} placeholder="請輸入訂購人姓名" />
        </label>

        <label>電話
          <input value={form.buyerPhone} onChange={e => onChange('buyerPhone', e.target.value)} placeholder="09xxxxxxxx" inputMode="numeric" maxLength={10} />
        </label>

        <label>寄送方式
          <select value={form.shippingMethod} onChange={e => onChange('shippingMethod', e.target.value)}>
            <option value="pickup">自取</option>
            <option value="sevencv">7-11 賣貨便</option>
            <option value="home">宅配</option>
          </select>
        </label>

        {form.shippingMethod === 'sevencv' && (
          <label>門市代碼/名稱
            <input value={form.storeCode} onChange={e => onChange('storeCode', e.target.value)} placeholder="例如：7-11_123456 或 OO門市" />
          </label>
        )}

        {form.shippingMethod === 'home' && (
          <label>地址
            <input value={form.address} onChange={e => onChange('address', e.target.value)} placeholder="請輸入收件地址" />
          </label>
        )}

        {/* ✅ 改成 TWD formatter，不再除以 100 */}
        <p>應付：<strong>{currency.format(total)}</strong></p>
        <button onClick={submit} disabled={cart.length === 0}>送出訂單</button>
      </div>
    </div>
  )
}
