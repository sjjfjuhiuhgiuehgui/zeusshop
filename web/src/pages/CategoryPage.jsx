import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { products } from '../data/products'
import { ArrowLeft } from 'lucide-react'

const currency = new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' })
const nt = (n) => currency.format(Number(n) || 0)

export default function CategoryPage({ title, matcher }) {
  const navigate = useNavigate()
  const [sort, setSort] = useState('new')

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  const filtered = useMemo(() => {
    let a = products.filter(p => matcher(p))
    const numId = v => Number(v?.id ?? 0)
    const numPrice = v => Number(v?.price ?? 0)

    if (sort === 'price_desc') a.sort((x, y) => numPrice(y) - numPrice(x))
    else if (sort === 'price_asc') a.sort((x, y) => numPrice(x) - numPrice(y))
    else if (sort === 'name_asc') a.sort((x, y) => String(x.name).localeCompare(String(y.name), 'zh-Hant'))
    else a.sort((x, y) => numId(y) - numId(x))
    return a
  }, [sort, matcher])

  // 購物車寫入統一格式
  const onAdd = (p) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const pid = Number(p.id)
    const idx = cart.findIndex(x => Number(x.productId ?? x.id) === pid)
    if (idx >= 0) {
      const next = [...cart]
      next[idx].quantity = Math.max(1, parseInt(next[idx].quantity, 10) || 0) + 1
      localStorage.setItem('cart', JSON.stringify(next))
    } else {
      localStorage.setItem('cart', JSON.stringify([
        ...cart,
        {
          productId: pid,
          name: p.name,
          price: Number(p.price) || 0,
          quantity: 1,
          imageUrl: normalizePublicPath(p.images?.[0]),
        }
      ]))
    }
    alert('已加入購物車')
  }

  return (
    <div className="space-y-3">
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

      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-700">排序：</span>
        <div className="group rounded-full border border-neutral-200 bg-amber-100 px-2 transition-colors hover:bg-[#3C7269]">
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-transparent px-3 py-1.5 text-sm text-neutral-800 group-hover:text-white outline-none focus:ring-2 focus:ring-[#3C7269]/50 rounded-full"
          >
            <option value="new">最新</option>
            <option value="price_desc">價格（高→低）</option>
            <option value="price_asc">價格（低→高）</option>
            <option value="name_asc">名稱（A→Z）</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(p => (
          <article key={p.id} className="group relative rounded-2xl border bg-white overflow-hidden">
            <Link to={`/product/${p.id}`} className="block aspect-square">
              <img
                src={normalizePublicPath(p.images?.[0])}
                alt={p.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </Link>

            <div className="p-4 space-y-1">
              <Link to={`/product/${p.id}`} className="font-medium line-clamp-1 hover:underline">
                {p.name}
              </Link>
              <div className="text-neutral-800 font-medium">
                {nt(p.price)}
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onAdd(p) }}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
                type="button"
              >
                加入購物車
              </button>

              <Link
                to={`/product/${p.id}`}
                className="ml-auto inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
              >
                查看更多
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function normalizePublicPath(p) {
  if (!p) return '/img/placeholder.png'
  return p.startsWith('/') ? p : `/${p}`
}