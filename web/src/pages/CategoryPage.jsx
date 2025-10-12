import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { products as LOCAL_PRODUCTS } from '../data/products'
import { ArrowLeft } from 'lucide-react'

const currency = new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' })
const nt = (n) => currency.format(Number(n) || 0)
const normalizePublicPath = (p) => (!p ? '/img/placeholder.png' : p.startsWith('/') ? p : `/${p}`)

function normalizeRemote(p) {
  const imgs = p.images || p.Images || []
  const cover = (imgs[0] && (imgs[0].url || imgs[0].URL || imgs[0])) || p.imageUrl || p.ImageURL || ''
  return {
    id: Number(p.id ?? p.ID ?? 0),
    name: p.name ?? p.Name ?? '',
    price: Number(p.price ?? p.Price ?? 0),
    images: cover ? [cover] : [],
    category: (p.category ?? p.Category ?? '').toString(),
    __active: Boolean(p.visible ?? p.isActive ?? p.IsActive ?? p.Visible ?? false),
  }
}

function mergeAndDedupe(localArr, remoteArr) {
  const map = new Map()
  const put = (x, source) => {
    const key = (x.id && `id:${x.id}`) || `nk:${x.name}::${x.images?.[0] || ''}`
    if (!map.has(key)) map.set(key, { ...x, __source: source })
  }
  remoteArr.forEach(p => put(p, 'remote'))
  localArr.forEach(p => put(p, 'local'))
  return Array.from(map.values())
}

function onAdd(p) {
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

export default function CategoryPage({ title, matcher }) {
  const navigate = useNavigate()
  const [sort, setSort] = useState('new')
  const [remote, setRemote] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/products')
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
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

  const localFiltered = useMemo(() => {
    return (LOCAL_PRODUCTS || []).filter(p => matcher(p))
  }, [matcher])

  const remoteFiltered = useMemo(() => {
    const asLocalShape = remote.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      images: p.images,
      category: p.category,
    }))
    return asLocalShape
      .map((x, i) => ({ ...x, __active: remote[i].__active }))
      .filter(x => x.__active && matcher(x))
      .map(x => ({ ...x, images: x.images || [] }))
  }, [remote, matcher])

  const combined = useMemo(() => mergeAndDedupe(localFiltered, remoteFiltered), [localFiltered, remoteFiltered])

  const sorted = useMemo(() => {
    const a = [...combined]
    const numId = v => Number(v?.id ?? 0)
    const numPrice = v => Number(v?.price ?? 0)
    if (sort === 'price_desc') a.sort((x, y) => numPrice(y) - numPrice(x))
    else if (sort === 'price_asc') a.sort((x, y) => numPrice(x) - numPrice(y))
    else if (sort === 'name_asc') a.sort((x, y) => String(x.name).localeCompare(String(y.name), 'zh-Hant'))
    else a.sort((x, y) => numId(y) - numId(x))
    return a
  }, [combined, sort])

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  return (
    <div className="space-y-6">
      <section className="wood-section">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button onClick={goBack} className="inline-flex items-center gap-2 btn-wood" type="button">
              <ArrowLeft className="w-4 h-4" />
              <span>上一頁</span>
            </button>

            <nav className="text-sm mt-3" aria-label="breadcrumb" style={{ color: 'var(--wood-sub)' }}>
              <Link to="/" className="hover:underline">首頁</Link>
              <span className="mx-2">/</span>
              <span>{title}</span>
            </nav>
            <h1 className="h2-wood mt-1">{title}</h1>
          </div>

          <label className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--wood-sub)' }}>排序：</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--wood-accent)', background: 'white' }}
            >
              <option value="new">最新</option>
              <option value="price_desc">價格：高 → 低</option>
              <option value="price_asc">價格：低 → 高</option>
              <option value="name_asc">名稱：A → Z</option>
            </select>
          </label>
        </div>

        {loading && (
          <div className="mt-3 text-sm" style={{ color: 'var(--wood-sub)' }}>
            正在同步最新上架商品…
          </div>
        )}
      </section>

      <section className="wood-section">
        {sorted.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--wood-sub)' }}>
            這個分類目前沒有商品，歡迎稍後再來 🗒️
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3">
            {sorted.map(p => {
              const cover = p.images?.[0]
              return (
                <article
                  key={p.id}
                  className="group relative rounded-2xl border bg-white overflow-hidden transition-transform duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-[rgba(139,94,60,0.25)]"
                >
                  <Link to={`/product/${p.id}`} className="block aspect-square overflow-hidden">
                    <img
                      src={normalizePublicPath(cover)}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05] group-hover:brightness-105"
                      loading="lazy"
                    />
                  </Link>

                  <div className="p-4 space-y-1">
                    <Link to={`/product/${p.id}`} className="font-medium line-clamp-1 hover:underline">
                      {p.name}
                    </Link>
                    <div className="font-medium">{nt(p.price)}</div>
                  </div>

                  <div className="p-4 pt-0 flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onAdd(p) }} className="btn-wood" type="button">
                      加入購物車
                    </button>
                    <Link to={`/product/${p.id}`} className="ml-auto btn-wood">
                      查看更多
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
