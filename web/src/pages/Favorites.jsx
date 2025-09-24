import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem("favorites");
    if (raw) {
      try {
        setFavorites(JSON.parse(raw));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  if (favorites.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-center">
        <h1 className="text-2xl font-semibold mb-4">我的收藏</h1>
        <p className="text-neutral-500">目前還沒有收藏的商品</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-2xl bg-neutral-900 px-5 py-3 text-white hover:opacity-90"
        >
          去逛逛
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">我的收藏</h1>
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {favorites.map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border bg-white overflow-hidden hover:shadow"
          >
            <Link to={`/product/${p.id}`}>
              <div className="aspect-square bg-neutral-100">
                <img
                  src={p.image || "/img/placeholder.png"}
                  alt={p.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <div className="line-clamp-1 font-medium">{p.name}</div>
                <div className="mt-1 text-sm text-neutral-500">
                  NT$ {Number(p.price ?? 0).toLocaleString("zh-TW")}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
