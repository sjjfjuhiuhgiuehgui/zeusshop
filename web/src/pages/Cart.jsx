import React, { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const currency = new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' })
const nt = (n) => currency.format(Number(n) || 0)

// 將舊資料矯正為統一格式
function loadCart() {
  const raw = JSON.parse(localStorage.getItem('cart') || '[]')
  const fixed = raw.map(x => ({
    productId: Number(x.productId ?? x.id),
    name: String(x.name || ''),
    price: Number(x.price) || 0,
    quantity: Math.max(1, parseInt(x.quantity ?? x.qty ?? 1, 10) || 1),
    imageUrl: x.imageUrl || x.image || '',
  }))
  localStorage.setItem('cart', JSON.stringify(fixed))
  return fixed
}

export default function Cart() {
  const [cart, setCart] = useState(loadCart)

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)) }, [cart])

  const total = useMemo(
    () => cart.reduce((s, x) => s + Number(x.price) * Number(x.quantity), 0),
    [cart]
  )

  const inc = (i) => { const n = [...cart]; n[i].quantity = Math.max(1, parseInt(n[i].quantity, 10) || 0) + 1; setCart(n) }
  const dec = (i) => { const n = [...cart]; n[i].quantity = Math.max(1, (parseInt(n[i].quantity, 10) || 1) - 1); setCart(n) }
  const del = (i) => { const n = [...cart]; n.splice(i, 1); setCart(n) }
  const clear = () => { if (confirm('清空購物車？')) { localStorage.removeItem('cart'); setCart([]) } }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">購物車</h2>

      {cart.length === 0 ? (
        <p>尚無商品，去 <Link to="/">逛逛商品</Link></p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th align="left" style={{ padding: '8px' }}>商品</th>
                <th style={{ padding: '8px' }}>單價</th>
                <th style={{ padding: '8px' }}>數量</th>
                <th style={{ padding: '8px' }}>小計</th>
                <th style={{ padding: '8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((x, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {x.imageUrl ? (
                        <img
                          src={x.imageUrl}
                          alt={x.name}
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
                        />
                      ) : null}
                      <div>{x.name}</div>
                    </div>
                  </td>
                  <td align="center" style={{ padding: '8px' }}>{nt(x.price)}</td>
                  <td align="center" style={{ padding: '8px' }}>
                    <button onClick={() => dec(i)}>-</button>
                    <span style={{ margin: '0 8px' }}>{x.quantity}</span>
                    <button onClick={() => inc(i)}>+</button>
                  </td>
                  <td align="center" style={{ padding: '8px' }}>{nt(Number(x.price) * Number(x.quantity))}</td>
                  <td align="center" style={{ padding: '8px' }}>
                    <button onClick={() => del(i)}>移除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <button onClick={clear}>清空購物車</button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: 8 }}>總計：<strong>{nt(total)}</strong></div>
              <Link to="/checkout">前往結帳</Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}