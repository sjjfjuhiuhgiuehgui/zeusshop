import React, { useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { products } from '../data/products'

export default function Home(){
  // 商品資料
  const [items] = useState(products)

  // 分類列表（動態抓所有商品的 category）
  const categories = ["全部", ...new Set(items.map(p => p.category))]

  // 狀態
  const [cart, setCart] = useState(()=>JSON.parse(localStorage.getItem('cart')||'[]'))
  const [sort, setSort] = useState(() => localStorage.getItem('sort') || 'new')
  const [selectedCategory, setSelectedCategory] = useState("全部")

  useEffect(()=>{ localStorage.setItem('cart', JSON.stringify(cart)) }, [cart])
  useEffect(()=>{ localStorage.setItem('sort', sort) }, [sort])

  const onAdd = (p)=>{
    const idx = cart.findIndex(x=>x.productId===p.id)
    if(idx>=0){
      const next=[...cart]; next[idx].quantity++; setCart(next)
    } else {
      setCart([...cart, {productId:p.id, name:p.name, price:p.price, imageUrl:p.imageUrl, quantity:1}])
    }
    alert('已加入購物車')
  }

  // 過濾 + 排序
  const filtered = useMemo(()=>{
    let a = [...items]
    if (selectedCategory !== "全部") {
      a = a.filter(p => p.category === selectedCategory)
    }
    if (sort === 'price_desc') a.sort((x,y)=> y.price - x.price)
    else if (sort === 'price_asc') a.sort((x,y)=> x.price - y.price)
    else if (sort === 'name_asc') a.sort((x,y)=> x.name.localeCompare(y.name, 'zh-Hant'))
    else a.sort((x,y)=> y.id - x.id)
    return a
  }, [items, sort, selectedCategory])

  return (
    <div style={{display:'grid', gridTemplateColumns:'200px 1fr', gap:20}}>
      {/* 左側分類列表 */}
      <div style={{borderRight:'1px solid #ddd', paddingRight:12}}>
        <h3>商品分類</h3>
        <ul style={{listStyle:'none', padding:0}}>
          {categories.map(c => (
            <li key={c} style={{marginBottom:8}}>
              <button
                onClick={()=>setSelectedCategory(c)}
                style={{
                  background: selectedCategory===c ? '#3C7269' : '#f5f5f5',
                  color: selectedCategory===c ? '#fff' : '#333',
                  border:'none',
                  borderRadius:4,
                  padding:'6px 10px',
                  width:'100%',
                  textAlign:'left',
                  cursor:'pointer'
                }}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 右側商品區 */}
      <div>
        <div style={{margin:'8px 0 16px', display:'flex', gap:12, alignItems:'center'}}>
          <span>排序：</span>
          <select value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="new">最新</option>
            <option value="price_desc">價格（高→低）</option>
            <option value="price_asc">價格（低→高）</option>
            <option value="name_asc">名稱（A→Z）</option>
          </select>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12}}>
          {filtered.map(p=> <ProductCard key={p.id} p={p} onAdd={onAdd}/>) }
        </div>
      </div>
    </div>
  )
}
