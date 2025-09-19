import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { products } from '../data/products'

function nt(n){ return (n/100).toFixed(0) } // 分 → 元（整數顯示）

export default function ProductDetail(){
  const { id } = useParams()
  const p = useMemo(() => products.find(x => String(x.id) === String(id)), [id])

  // 購物車（與首頁/購物車同一套機制）
  const [cart, setCart] = useState(()=>JSON.parse(localStorage.getItem('cart')||'[]'))
  useEffect(()=>{ localStorage.setItem('cart', JSON.stringify(cart)) }, [cart])

  // 數量控制
  const [qty, setQty] = useState(1)
  const dec = () => setQty(q => Math.max(1, q - 1))
  const inc = () => setQty(q => Math.min(99, q + 1))
  const onQtyChange = (e) => {
    const v = parseInt(e.target.value, 10)
    if (isNaN(v)) setQty(1)
    else setQty(Math.max(1, Math.min(99, v)))
  }

  const addToCart = ()=>{
    if(!p) return
    const idx = cart.findIndex(x=>x.productId===p.id)
    if(idx>=0){
      const next=[...cart]; next[idx].quantity += qty; setCart(next)
    }else{
      setCart([...cart, {
        productId: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        quantity: qty
      }])
    }
    alert(`已加入購物車 x${qty}`)
  }

  if(!p) return <div>找不到此商品</div>

  return (
    <div>
      {/* 返回首頁 */}
      <div style={{marginBottom:16}}>
        <Link to="/" style={{
          display:'inline-block',
          padding:'6px 12px',
          background:'#3C7269',
          color:'#fff',
          borderRadius:6,
          textDecoration:'none'
        }}>
          ← 返回首頁
        </Link>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
        <div>
          {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{width:'100%', borderRadius:8}} />}
        </div>

        <div>
          <h2 style={{marginTop:0}}>{p.name}</h2>
          <p style={{color:'#666'}}>{p.description}</p>

        {/* 商品規格 */}
        {p.specs && p.specs.length > 0 && (
          <div style={{marginTop:12}}>
            <h4>商品規格</h4>
            <ul style={{margin:0, paddingLeft:20}}>
              {p.specs.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

          <p style={{marginTop:12, fontSize:18}}>
            價格：<strong>NT$ {nt(p.price)}</strong>
          </p>


          {/* 數量 + 加入購物車 */}
          <div style={{display:'flex', alignItems:'center', gap:12, marginTop:8}}>
            <div style={{display:'flex', alignItems:'center', gap:4}}>
              <button onClick={dec} aria-label="減少數量">−</button>
              <input
                type="number"
                min={1}
                max={99}
                value={qty}
                onChange={onQtyChange}
                style={{width:70, textAlign:'center'}}
              />
              <button onClick={inc} aria-label="增加數量">＋</button>
            </div>

            <button onClick={addToCart} style={{padding:'8px 16px'}}>加入購物車</button>
          </div>

          {/* 前往購物車捷徑 */}
          <div style={{marginTop:12}}>
            <Link to="/cart">前往購物車 →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
