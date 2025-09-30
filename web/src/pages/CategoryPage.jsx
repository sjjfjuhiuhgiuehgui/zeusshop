import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { products } from '../data/products'
import { ArrowLeft, ShoppingCart } from 'lucide-react'

export default function CategoryPage({ title, matcher }) {
  const navigate = useNavigate()
  const [sort, setSort] = useState('new')

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  const filtered = useMemo(() => {
    // 先用 matcher 篩選，再做排序
    let a = products.filter(p => matcher(p))

    // 確保價格/ID是數字再排序
    const numId = v => Number(v?.id ?? 0)
    const numPrice = v => Number(v?.price ?? 0)

    if (sort === 'price_desc') a.sort((x, y) => numPrice(y) - numPrice(x))
    else if (sort === 'price_asc') a.sort((x, y) => numPrice(x) - numPrice(y))
    else if (sort === 'name_asc') a.sort((x, y) => String(x.name).localeCompare(String(y.name), 'zh-Hant'))
    else a.sort((x, y) => numId(y) - numId(x)) // 最新→舊（以 id 當近似）

    return a
  }, [sort, matcher])

  const onAdd = (p) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const idx = cart.findIndex(x => String(x.productId) === String(p.id))
    if (idx >= 0) {
      const next = [...cart]
      next[idx].quantity++
      localStorage.setItem('cart', JSON.stringify(next))
    } else {
      localStorage.setItem('cart', JSON.stringify([
        ...cart,
        {
          productId: String(p.id),
          name: p.name,
          price: Number(p.price) || 0,
          imageUrl: normalizePublicPath(p.images?.[0]),
          quantity: 1
        }
      ]))
    }
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

      {/* 排序區 */}
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

      {/* 商品清單 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(p => (
          <article key={p.id} className="group relative rounded-2xl border bg-white overflow-hidden">
            {/* 圖片：用 Link 包起來 */}
            <Link to={`/product/${p.id}`} className="block aspect-square">
              <img
                src={normalizePublicPath(p.images?.[0])}
                alt={p.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </Link>

            {/* 文字區：標題也可以包 Link */}
            <div className="p-4 space-y-1">
              <Link to={`/product/${p.id}`} className="font-medium line-clamp-1 hover:underline">
                {p.name}
              </Link>
              <div className="text-neutral-600">
                {Number(p.price).toLocaleString('zh-TW', { style: 'currency', currency: 'TWD' })}
              </div>
            </div>

            {/* 底部操作列：加入購物車 + 查看更多 */}
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

/** 確保 public 內圖片在任何頁面路徑皆能正確載入（避免 /product/3 時相對路徑壞掉） */
function normalizePublicPath(p) {
  if (!p) return '/img/placeholder.png'
  return p.startsWith('/') ? p : `/${p}`
}
