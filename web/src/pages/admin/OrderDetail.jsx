import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  adminGetOrder,
  adminUpdateOrderStatus,
  adminDeleteOrder,
} from '../../api'

export default function OrderDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const loc = useLocation()
  const [o, setO] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await adminGetOrder(id)
      setO(data)
    } catch (e) {
      alert(e.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  // 若帶 print=1，頁面載入後自動列印
  const shouldAutoPrint = useMemo(() => {
    const params = new URLSearchParams(loc.search)
    return params.get('print') === '1'
  }, [loc.search])

  useEffect(() => {
    if (o && shouldAutoPrint) {
      // 等一拍讓畫面渲染完整
      const t = setTimeout(() => window.print(), 300)
      return () => clearTimeout(t)
    }
  }, [o, shouldAutoPrint])

  const onStatus = async (status) => {
    try {
      await adminUpdateOrderStatus(o.id, status)
      await load()
    } catch (e) {
      alert(e.response?.data?.error || e.message)
    }
  }

  const onDelete = async () => {
    if (!confirm('確定刪除此訂單？')) return
    try {
      await adminDeleteOrder(o.id)
      nav('/admin/orders')
    } catch (e) {
      alert(e.response?.data?.error || e.message)
    }
  }

  if (!o) return <div>載入中…</div>

  const shipInfo = o.shippingMethod === 'sevencv'
    ? `7-11 門市：${o.storeCode || '-'}`
    : (o.shippingMethod === 'home' ? `宅配地址：${o.address || '-'}` : '自取')

  return (
    <div>
      {/* ✅ 返回 + 列印 按鈕 */}
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <button onClick={()=>nav(-1)}>返回</button>
        <button onClick={()=>window.print()}>列印</button>
      </div>

      <h2>訂單詳情 #{o.orderNo}</h2>

      <div style={{display:'grid', gap:8, marginBottom:16}}>
        <div><strong>訂單 ID：</strong>{o.id}</div>
        <div><strong>買家：</strong>{o.buyerName}（{o.buyerPhone}）</div>
        <div><strong>寄送方式：</strong>{o.shippingMethod}（{shipInfo}）</div>
        <div><strong>狀態：</strong>{o.status}</div>
        <div><strong>匯款後五碼：</strong>{o.remitLast5 || '-'}</div>
        <div><strong>付款備註：</strong>{o.paymentNote || '-'}</div>
        <div><strong>總額：</strong>NT$ {(o.totalAmount/100).toFixed(0)}</div>
        <div><strong>建立時間：</strong>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</div>
        <div><strong>更新時間：</strong>{o.updatedAt ? new Date(o.updatedAt).toLocaleString() : '-'}</div>
      </div>

      <h3>品項</h3>
      <div style={{overflowX:'auto'}}>
        <table width="100%" cellPadding="8" style={{borderCollapse:'collapse', minWidth: 600}}>
          <thead>
            <tr style={{background:'#fafafa'}}>
              <th align="left">品名</th>
              <th align="right">單價</th>
              <th align="right">數量</th>
              <th align="right">小計</th>
            </tr>
          </thead>
          <tbody>
            {(o.items || []).map(it => (
              <tr key={it.id} style={{borderTop:'1px solid #eee'}}>
                <td>{it.productName}</td>
                <td align="right">NT$ {(it.unitPrice/100).toFixed(0)}</td>
                <td align="right">{it.quantity}</td>
                <td align="right">NT$ {(it.subtotal/100).toFixed(0)}</td>
              </tr>
            ))}
            {(!o.items || o.items.length === 0) && (
              <tr><td colSpan={4} style={{padding:16, textAlign:'center', color:'#666'}}>沒有品項</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{display:'flex', gap:8, marginTop:16, flexWrap:'wrap'}}>
        <button onClick={()=>onStatus('shipped')} disabled={loading}>標記出貨</button>
        <button onClick={()=>onStatus('completed')} disabled={loading}>標記完成</button>
        <button onClick={onDelete} style={{color:'#b00'}} disabled={loading}>刪除此訂單</button>
      </div>
    </div>
  )
}
