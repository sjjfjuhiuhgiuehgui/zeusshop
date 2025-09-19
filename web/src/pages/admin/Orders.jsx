import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  adminListOrders,
  adminUpdateOrderStatus,
  adminDeleteOrder,
} from '../../api'

export default function Orders() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('') // 簡易搜尋：訂單編號/電話/姓名/後五碼
  const navigate = useNavigate()

  const refresh = async () => {
    try {
      setLoading(true)
      const data = await adminListOrders()
      setItems(data || [])
    } catch (e) {
      // 401 → 送回登入頁（路徑保持不變：/admin/login）
      if (e?.response?.status === 401) {
        alert('未授權：請先登入管理後台')
        navigate('/admin/login')
        return
      }
      alert(e?.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 若沒有 token，減少無謂請求，直接去登入
    const t = localStorage.getItem('adminToken')
    if (!t) {
      navigate('/admin/login')
      return
    }
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase()
    if (!text) return items
    return items.filter(o =>
      String(o.orderNo || '').toLowerCase().includes(text) ||
      String(o.buyerPhone || '').toLowerCase().includes(text) ||
      String(o.buyerName || '').toLowerCase().includes(text) ||
      String(o.remitLast5 || '').toLowerCase().includes(text)
    )
  }, [items, q])

  const onStatus = async (id, status) => {
    try {
      await adminUpdateOrderStatus(id, status)
      refresh()
    } catch (e) {
      if (e?.response?.status === 401) {
        alert('未授權：請先登入管理後台')
        navigate('/admin/login')
        return
      }
      alert(e?.response?.data?.error || e.message)
    }
  }

  const onDelete = async (id) => {
    if (!confirm(`確定刪除訂單 #${id}？`)) return
    try {
      await adminDeleteOrder(id)
      refresh()
    } catch (e) {
      if (e?.response?.status === 401) {
        alert('未授權：請先登入管理後台')
        navigate('/admin/login')
        return
      }
      alert(e?.response?.data?.error || e.message)
    }
  }

  // 列印：開新分頁到詳情 + 自動列印
  const onPrint = (id) => {
    window.open(`/admin/orders/${id}?print=1`, '_blank')
  }

  const fmtMoney = (cents) => {
    const n = Number.isFinite(cents) ? Math.round(cents / 100) : 0
    return n.toLocaleString('zh-TW')
  }

  return (
    <div>
      <h2>訂單管理</h2>

      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:12}}>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="搜尋：訂單編號 / 電話 / 姓名 / 後五碼"
          style={{flex:1, maxWidth:420}}
        />
        <button onClick={refresh} disabled={loading}>{loading ? '更新中…' : '重新整理'}</button>
      </div>

      <div style={{overflowX:'auto'}}>
        <table width="100%" cellPadding="8" style={{borderCollapse:'collapse', minWidth: 980}}>
          <thead>
            <tr style={{background:'#fafafa'}}>
              <th align="left">ID</th>
              <th align="left">訂單編號</th>
              <th align="left">買家</th>
              <th align="left">電話</th>
              <th align="right">總額</th>
              <th align="left">狀態</th>
              <th align="left">匯款後五碼</th>
              <th align="left">建立時間</th>
              <th align="left">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} style={{borderTop:'1px solid #eee'}}>
                <td>{o.id}</td>
                <td>
                  {/* 點訂單號進入詳情：/admin/orders/:id */}
                  <Link to={`/admin/orders/${o.id}`}>{o.orderNo}</Link>
                </td>
                <td>{o.buyerName || '-'}</td>
                <td>{o.buyerPhone || '-'}</td>
                <td align="right">NT$ {fmtMoney(o.totalAmount)}</td>
                <td>{o.status}</td>
                <td>{o.remitLast5 || '-'}</td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}</td>
                <td style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  {/* 查看 → /admin/orders/:id */}
                  <button onClick={()=>navigate(`/admin/orders/${o.id}`)}>查看</button>
                  {/* 列印 */}
                  <button onClick={()=>onPrint(o.id)}>列印</button>
                  <button onClick={()=>onStatus(o.id, 'shipped')}>出貨</button>
                  <button onClick={()=>onStatus(o.id, 'completed')}>完成</button>
                  <button onClick={()=>onDelete(o.id)} style={{color:'#b00'}}>刪除</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={9} style={{padding:24, textAlign:'center', color:'#666'}}>沒有符合條件的訂單</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
