import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { updateOrderRemit } from '../api'

export default function PaymentInfo(){
  const { id } = useParams()               // 來自 /payment/:id
  const nav = useNavigate()
  const loc = useLocation()
  const [last5, setLast5] = useState('')
  const [note, setNote] = useState('')

  // 從 state 或 sessionStorage 取下單資訊
  const info = useMemo(()=>{
    const fromState = loc.state || {}
    if(fromState.orderNo && fromState.total){
      sessionStorage.setItem('lastOrderInfo', JSON.stringify(fromState))
      return fromState
    }
    try{
      return JSON.parse(sessionStorage.getItem('lastOrderInfo')||'{}')
    }catch{ return {} }
  }, [loc.state])

  const totalNT = useMemo(()=> info?.total ? (info.total/100).toFixed(0) : '—', [info.total])

  const submit = async ()=>{
    if(!/^\d{5}$/.test(last5)){ alert('請輸入 5 位數字的後五碼'); return }
    try{
      await updateOrderRemit(id, { last5, note })
      alert('感謝回報！我們將儘快核對款項。')
      sessionStorage.removeItem('lastOrderInfo')
      nav('/')
    }catch(e){
      alert(e.response?.data?.error || e.message)
    }
  }

  return (
    <div style={{maxWidth: 680, margin: '0 auto'}}>
      <h2>匯款資訊</h2>

      <div style={{display:'grid', gap:12, marginBottom:16}}>
        <div><strong>訂單編號：</strong>{info.orderNo || id}</div>
        <div><strong>應付金額：</strong>NT$ {totalNT}</div>
      </div>

      <div style={{padding:16, border:'1px solid #eee', borderRadius:8, background:'#fafafa', marginBottom:16}}>
        <div><strong>銀行：</strong>合作金庫（代碼 006）</div>
        <div><strong>戶名：</strong>天騵國際有限公司</div>
        <div><strong>帳號：</strong>123-456-789-012</div>
        <div style={{color:'#666', marginTop:8}}>※ 轉帳完成後，請於下方回報您的匯款帳號後五碼，方便我們加速對帳。</div>
      </div>

      <div style={{display:'grid', gap:12, maxWidth:420}}>
        <label>匯款帳號後五碼
          <input
            value={last5}
            onChange={e=>setLast5(e.target.value.replace(/\D/g,''))}
            maxLength={5}
            placeholder="例如：12345"
          />
        </label>
        <label>備註（選填）
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="例如：公司帳戶匯出 / 需要三聯式發票等" />
        </label>
        <div style={{display:'flex', gap:8}}>
          <button onClick={submit}>送出</button>
          <Link to="/">返回首頁</Link>
        </div>
      </div>
    </div>
  )
}
