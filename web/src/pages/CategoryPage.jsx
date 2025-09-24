import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { products } from '../data/products'
import { ArrowLeft } from 'lucide-react'

export default function CategoryPage({ title, matcher }) {
  const navigate = useNavigate()
  const [sort, setSort] = useState('new')

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  const filtered = useMemo(() => {
    let a = products.filter(p => matcher(p))
    if (sort === 'price_desc') a.sort((x,y)=> y.price - x.price)
    else if (sort === 'price_asc') a.sort((x,y)=> x.price - y.price)
    else if (sort === 'name_asc') a.sort((x,y)=> x.name.localeCompare(y.name, 'zh-Hant'))
    else a.sort((x,y)=> y.id - x.id)
    return a
  }, [sort, matcher])

  const onAdd = (p)=>{
    const cart = JSON.parse(localStorage.getItem('cart')||'[]')
    const idx = cart.findIndex(x=>x.productId===p.id)
    if(idx>=0){ const next=[...cart]; next[idx].quantity++; localStorage.setItem('cart', JSON.stringify(next)) }
    else { localStorage.setItem('cart', JSON.stringify([...cart, {productId:p.id, name:p.name, price:p.price, imageUrl:p.imageUrl, quantity:1}])) }
    alert('已加入購物車')
  }

  return (
    <div className="space-y-3">
      {/* 上一頁：amber → hover 綠、按下縮放 */}
      <div>
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-amber-100 px-3 py-1.5 text-sm text-neutral-800 shadow-sm transition-all hover:bg-[#3C7269] hover:text-white active:scale-95"
          aria-label="上一頁"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>上一頁</span>
        </button>
      </div>

      <h2 className="text-[20px] mb-1">{title}</h2>

      {/* 排序區：外層做成圓角膠囊，hover 同步變綠；內層 select 文字跟著變色 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-700">排序：</span>
        <div className="group rounded-full border border-neutral-200 bg-amber-100 px-2 transition-colors hover:bg-[#3C7269]">
          <select
            value={sort}
            onChange={e=>setSort(e.target.value)}
            className="bg-transparent px-3 py-1.5 text-sm text-neutral-800 group-hover:text-white outline-none focus:ring-2 focus:ring-[#3C7269]/50 rounded-full"
          >
            <option value="new">最新</option>
            <option value="price_desc">價格（高→低）</option>
            <option value="price_asc">價格（低→高）</option>
            <option value="name_asc">名稱（A→Z）</option>
          </select>
        </div>
      </div>

      {/* 商品清單 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(p=> <ProductCard key={p.id} p={p} onAdd={onAdd}/>) }
      </div>
    </div>
  )
}