// web/src/pages/Home.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../data/categories'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="pt-3">
      <h2 className="text-[18px] mb-4">請選擇商品分類</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
        {CATEGORIES.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => navigate(`/category/${key}`)}
            title={label}
            aria-label={label}
            className="group flex flex-col items-center justify-center text-center gap-2 focus:outline-none"
          >
            {/* 圓形圖示：置中 + hover 變色/縮放 */}
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full grid place-items-center border border-neutral-200 bg-amber-100 text-neutral-800 shadow-sm transition-all duration-200 group-hover:bg-[#3C7269] group-hover:text-white group-active:scale-95">
              {Icon && <Icon className="w-8 h-8 md:w-9 md:h-9" />}
            </div>
            {/* 置中文字 */}
            <div className="text-sm md:text-base transition-colors duration-200 text-neutral-800 group-hover:text-[#3C7269]">
              {label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
