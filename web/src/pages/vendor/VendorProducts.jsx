import { useEffect, useState } from "react";

export default function VendorProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/vendor/products", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data.products || data || []); // 後端可能回 {products:[]}
    } catch (e) {
      setErr(e.message || "載入失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(p) {
    // 用 PUT /api/vendor/products/:id 更新 isActive（保守：帶完整欄位）
    const body = {
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      description: p.description,
      spec: p.spec,
      images: (p.images || []).map((x) => x.url ?? x),
      isActive: !p.isActive,
    };
    const res = await fetch(`/api/vendor/products/${p.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    await load();
  }

  async function remove(id) {
    if (!confirm("確定要刪除這個商品嗎？")) return;
    const res = await fetch(`/api/vendor/products/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error(await res.text());
    await load();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">我的商品</h1>
        <a
          href="/vendor/products/new"
          className="bg-teal-700 text-white px-4 py-2 rounded"
        >
          新增商品
        </a>
      </div>

      {loading && <p>載入中…</p>}
      {err && <p className="text-red-600 text-sm">{err}</p>}

      {!loading && items.length === 0 && (
        <p className="text-neutral-500">目前沒有商品，點右上角「新增商品」。</p>
      )}

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead className="bg-neutral-100">
            <tr>
              <th className="p-2 border">圖片</th>
              <th className="p-2 border">名稱</th>
              <th className="p-2 border">分類</th>
              <th className="p-2 border">價格</th>
              <th className="p-2 border">庫存</th>
              <th className="p-2 border">上架</th>
              <th className="p-2 border">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const cover =
                (p.images && p.images[0] && (p.images[0].url || p.images[0])) ||
                "";
              return (
                <tr key={p.id}>
                  <td className="p-2 border">
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="w-14 h-14 object-cover rounded border"
                      />
                    ) : (
                      <span className="text-xs text-neutral-400">無</span>
                    )}
                  </td>
                  <td className="p-2 border">{p.name}</td>
                  <td className="p-2 border">{p.category || "-"}</td>
                  <td className="p-2 border">{p.price}</td>
                  <td className="p-2 border">{p.stock}</td>
                  <td className="p-2 border">
                    <span
                      className={
                        "inline-block px-2 py-0.5 rounded text-xs " +
                        (p.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-100 text-neutral-600")
                      }
                    >
                      {p.isActive ? "是" : "否"}
                    </span>
                  </td>
                  <td className="p-2 border">
                    <div className="flex gap-2">
                      <button
                        className={
                          "px-3 py-1 rounded border " +
                          (p.isActive
                            ? "bg-white hover:bg-neutral-50"
                            : "bg-teal-700 text-white")
                        }
                        onClick={() => toggleActive(p)}
                        title={p.isActive ? "下架" : "上架"}
                      >
                        {p.isActive ? "下架" : "上架"}
                      </button>
                      <a
                        href={`/vendor/products/${p.id}/edit`}
                        className="px-3 py-1 rounded border"
                      >
                        編輯
                      </a>
                      <button
                        className="px-3 py-1 rounded border hover:bg-red-50"
                        onClick={() => remove(p.id)}
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
