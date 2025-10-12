import { useEffect, useState } from "react";

// 把任何可能的 API 回傳正規化為「陣列」
function toArrayPayload(raw) {
  if (!raw) return [];
  // 常見結構優先
  if (Array.isArray(raw.products)) return raw.products;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.list)) return raw.list;
  if (Array.isArray(raw)) return raw;

  // 若回單一物件 {product:{...}} 或 {id:..., name:...}
  if (raw.product && typeof raw.product === "object") return [raw.product];
  if (typeof raw === "object" && raw.id) return [raw];

  return [];
}

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
      if (res.status === 401) {
        // 未登入導回登入頁
        location.href = "/vendor/login";
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(toArrayPayload(data));
    } catch (e) {
      setErr(e.message || "載入失敗");
      setItems([]); // 確保不是 undefined
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(p) {
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
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert("更新失敗：" + t);
      return;
    }
    await load();
  }

  async function remove(id) {
    if (!confirm("確定要刪除這個商品嗎？")) return;
    const res = await fetch(`/api/vendor/products/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert("刪除失敗：" + t);
      return;
    }
    await load();
  }

  const hasItems = Array.isArray(items) && items.length > 0;

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

      {!loading && !hasItems && !err && (
        <p className="text-neutral-500">目前沒有商品，點右上角「新增商品」。</p>
      )}

      {hasItems && (
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
                const id = p.id ?? p.ID ?? p.product_id; // 兼容大小寫
                const imgs = p.images || p.Images || [];
                const cover =
                  (imgs[0] && (imgs[0].url || imgs[0].URL || imgs[0])) || "";
                const isActive = !!(p.isActive ?? p.visible ?? p.Visible);

                return (
                  <tr key={id}>
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
                    <td className="p-2 border">{p.name ?? p.Name ?? "-"}</td>
                    <td className="p-2 border">{p.category ?? p.Category ?? "-"}</td>
                    <td className="p-2 border">{p.price ?? p.Price ?? "-"}</td>
                    <td className="p-2 border">{p.stock ?? p.Stock ?? "-"}</td>
                    <td className="p-2 border">
                      <span
                        className={
                          "inline-block px-2 py-0.5 rounded text-xs " +
                          (isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-600")
                        }
                      >
                        {isActive ? "是" : "否"}
                      </span>
                    </td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <button
                          className={
                            "px-3 py-1 rounded border " +
                            (isActive
                              ? "bg-white hover:bg-neutral-50"
                              : "bg-teal-700 text-white")
                          }
                          onClick={() =>
                            toggleActive({
                              ...p,
                              id, // 確保 id 帶到
                              isActive,
                            })
                          }
                          title={isActive ? "下架" : "上架"}
                        >
                          {isActive ? "下架" : "上架"}
                        </button>
                        <a
                          href={`/vendor/products/${id}/edit`}
                          className="px-3 py-1 rounded border"
                        >
                          編輯
                        </a>
                        <button
                          className="px-3 py-1 rounded border hover:bg-red-50"
                          onClick={() => remove(id)}
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
      )}
    </div>
  );
}
