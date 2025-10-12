import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { products as LOCAL_PRODUCTS } from '../data/products'
import { ArrowLeft } from 'lucide-react'

const currency = new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' })
const nt = (n) => currency.format(Number(n) || 0)

// 後端商品 → 正規化成前端卡片同樣格式（盡量相容你的 matcher）
function normalizeRemote(p) {
  const imgs = p.images || p.Images || []
  const cover = (imgs[0] && (imgs[0].url || imgs[0].URL || imgs[0])) || p.imageUrl || p.ImageURL || ''
  return {
    id: Number(p.id ?? p.ID ?? 0),
    name: p.name ?? p.Name ?? '',
    price: Number(p.price ?? p.Price ?? 0),
    images: cover ? [cover] : [],
    // 讓 matcher 能判斷分類（你的 matchByKey 會用到產品自身的分類欄位）
    category: (p.category ?? p.Category ?? '').toString(),
    // 供本頁判斷是否公開
    __active: Boolean(p.visible ?? p.isActive ?? p.IsActive ?? p.Visible ?? false),
  }
}

// 合併 + 去重（以 id 為主，沒有 id 就用 name+img）
function mergeAndDedupe(localArr, remoteArr) {
  const map = new Map()
  const put = (x, source) => {
    const key = (x.id && `id:${x.id}`) || `nk:${x.name}::${x.images?.[0] || ''}`
    if (!map.has(key)) map.set(key, { ...x, __source: source })
  }
  remoteArr.forEach(p => put(p, 'remote')) // 讓遠端（真正上架）優先
  localArr.forEach(p => put(p, 'local'))
  return Array.from(map.values())
}

export default function CategoryPage({ title, matcher }) {
  const navigate = useNavigate()
  const [sort, setSort] = useState('new')

  // 遠端資料
  const [remote, setRemote] = useState([])
  const [loading, setLoading] = useState(true)

  // 抓公開產品（不需帶 cookie）
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/products')
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        // 嘗試從常見鍵取出陣列
        const list =
          (Array.isArray(data.products) && data.products) ||
          (Array.isArray(data.data) && data.data) ||
          (Array.isArray(data.items) && data.items) ||
          (Array.isArray(data) && data) ||
          []
        const normalized = list.map(normalizeRemote)
        if (alive) setRemote(normalized)
      } catch (e) {
        console.warn('fetch /api/products failed:', e)
        if (alive) setRemote([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // 1) 原本寫死的本地資料
  const localFiltered = useMemo(() => {
    return (LOCAL_PRODUCTS || []).filter(p => matcher(p))
  }, [matcher])

  // 2) 後端資料：需符合分類（用同一個 matcher）且為公開上架
  const remoteFiltered = useMemo(() => {
    // 先把 remote 轉成本地相容的形狀，才能用同一個 matcher
    const asLocalShape = remote.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      images: p.images,
      category: p.category,
      // 注意：matcher 只會看必要欄位（通常是 category）
    }))
    return asLocalShape
      .map((x, i) => ({ ...x, __active: remote[i].__active })) // 把 active 帶回來
      .filter(x => x.__active && matcher(x))
      .map(x => ({ ...x, images: x.images || [] })) // 確保 images 是陣列
  }, [remote, matcher])

  // 3) 合併 + 去重
  const combined = useMemo(() => mergeAndDedupe(localFiltered, remoteFiltered), [localFiltered, remoteFiltered])

  // 4) 排序（沿用你原本的四種）
  const sorted = useMemo(() => {
    const a = [...combined]
    const numId = v => Number(v?.id ?? 0)
    const numPrice = v => Number(v?.price ?? 0)
    if (sort === 'price_desc') a.sort((x, y) => numPrice(y) - numPrice(x))
    else if (sort === 'price_asc') a.sort((x, y) => numPrice(x) - numPrice(y))
    else if (sort === 'name_asc') a.sort((x, y) => String(x.name).localeCompare(String(y.name), 'zh-Hant'))
    else a.sort((x, y) => numId(y) - numId(x)) // new：以 id 大者為新
    return a
  }, [combined, sort])

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

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

      {loading && <div className="text-sm text-neutral-500">同步最新上架中…</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {sorted.map(p => (
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
