import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ProductCard({ p, onAdd }) {
  const [qty, setQty] = useState(1)

  const dec = () => setQty(q => Math.max(1, q - 1))
  const inc = () => setQty(q => Math.min(99, q + 1)) // 可自行調整上限
  const onChange = (e) => {
    const v = parseInt(e.target.value, 10)
    if (isNaN(v)) setQty(1)
    else setQty(Math.max(1, Math.min(99, v)))
  }

  return (
    <div style={{border:'1px solid #ddd', borderRadius:8, padding:12, display:'flex', flexDirection:'column', gap:8}}>
      {p.imageUrl && (
        <img src={p.imageUrl} alt={p.name} style={{width:'100%', height:160, objectFit:'cover', borderRadius:8}} />
      )}

      <h3 style={{margin:'8px 0 0 0'}}>{p.name}</h3>
      <p style={{color:'#444', margin:'4px 0'}}>{p.description}</p>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>NT$ {(p.price/100).toFixed(0)}</strong>
        <Link to={`/product/${p.id}`}>查看</Link>
      </div>

      {/* 數量控制 + 加入購物車 */}
      <div style={{display:'flex', gap:8, alignItems:'center', marginTop:4}}>
        <div style={{display:'flex', alignItems:'center', gap:4}}>
          <button aria-label="減少數量" onClick={dec}>−</button>
          <input
            type="number"
            min={1}
            max={99}
            value={qty}
            onChange={onChange}
            style={{width:60, textAlign:'center'}}
          />
          <button aria-label="增加數量" onClick={inc}>＋</button>
        </div>
        <button onClick={()=>onAdd(p, qty)} style={{flex:1}}>加入購物車</button>
      </div>
    </div>
  )
}
