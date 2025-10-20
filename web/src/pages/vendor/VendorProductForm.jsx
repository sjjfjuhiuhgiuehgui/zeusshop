import { useEffect, useState } from "react";
import { CATEGORIES } from "../../data/categories";
import { vUPLOAD } from "../../lib/vendorApi";

export default function VendorProductForm() {
  const isEdit = location.pathname.includes("/edit");
  const id = isEdit ? location.pathname.split("/").slice(-2, -1)[0] : null;

  // 表單欄位（價格/數量預設為空字串，不帶 0）
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [spec, setSpec] = useState(() =>
    JSON.stringify(
      [
        { label: "容量", value: "11ml" },
        { label: "產地", value: "韓國進口" },
        { label: "適用膚質", value: "一般膚質" },
      ],
      null,
      2
    )
  );
  const [images, setImages] = useState([]);  // URL 陣列
  const [isActive, setIsActive] = useState(true);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  // 編輯模式載入
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const res = await fetch(`/api/vendor/products/${id}`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const p = data.product || {};
      const imgs = data.images || [];
      setName(p.name || "");
      setCategory(p.category || "");
      setPrice(p.price ?? "");
      setStock(p.stock ?? "");
      setDescription(p.description || "");
      setSpec(p.spec || spec);
      setIsActive(!!(p.isActive ?? p.visible));
      setImages(imgs.map((x) => x.url ?? x));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  async function onUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const url = await vUPLOAD(f);      // ★ POST /api/vendor/upload
      setImages((prev) => [...prev, url]);
    } catch (e) {
      alert("上傳失敗：" + (e.message || e));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    // 驗證
    if (!name.trim()) return setErr("請輸入商品名稱");
    if (!category) return setErr("請選擇商品分類");
    if (price === "" || isNaN(Number(price)) || Number(price) <= 0) {
      return setErr("請輸入有效的價格");
    }
    if (stock === "" || isNaN(Number(stock)) || Number(stock) < 0) {
      return setErr("請輸入有效的庫存數量");
    }

    // 後端目前收 imageUrl（單張），若之後支援多圖可一併傳 images
    const body = {
      name: name.trim(),
      category,
      price: Number(price),
      stock: Number(stock),
      description,
      spec,                // TEXT 存 JSON 字串
      imageUrl: images[0] || "", // 先用第一張當主圖
      isActive,            // 可覆寫預設的自動上架
    };

    try {
      if (!isEdit) {
        const res = await fetch("/api/vendor/products", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch(`/api/vendor/products/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      location.href = "/vendor/products";
    } catch (e) {
      setErr(e.message || "儲存失敗");
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">
        {isEdit ? "編輯商品" : "新增商品"}
      </h1>

      <form className="space-y-4" onSubmit={onSubmit}>
        {/* 名稱 */}
        <div>
          <label className="mb-1 block text-sm text-neutral-600">商品名稱</label>
          <input
            className="border rounded w-full p-2"
            placeholder="請輸入商品名稱"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* 分類 */}
        <div>
          <label className="mb-1 block text-sm text-neutral-600">分類</label>
          <select
            className="border rounded w-full p-2 bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">— 請選擇分類 —</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* 價格／庫存 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-neutral-600">價格（元）</label>
            <input
              className="border rounded w-full p-2"
              type="number"
              inputMode="numeric"
              placeholder="請輸入價格"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">庫存數量</label>
            <input
              className="border rounded w-full p-2"
              type="number"
              inputMode="numeric"
              placeholder="請輸入數量"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
        </div>

        {/* 敘述 */}
        <div>
          <label className="mb-1 block text-sm text-neutral-600">商品敘述</label>
          <textarea
            className="border rounded w-full p-2 h-28"
            placeholder="請輸入商品敘述（可多行）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* 規格（JSON 字串） */}
        <div>
          <label className="mb-1 block text-sm text-neutral-600">商品規格</label>
          <textarea
            className="font-mono border rounded w-full p-2 h-40"
            placeholder='例如：
[
  {"label":"容量","value":"11ml"},
  {"label":"產地","value":"韓國進口"},
  {"label":"適用膚質","value":"一般膚質"}
]'
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
          />
          <p className="mt-1 text-xs text-neutral-500">
            若還有需要新增其他規格，請直接複製一個繼續填寫。
          </p>
        </div>

        {/* 圖片 */}
        <div>
          <label className="mb-1 block text-sm text-neutral-600">商品圖片</label>
          <input type="file" onChange={onUpload} />
          {uploading && <div className="text-sm text-neutral-500 mt-1">上傳中…</div>}
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.map((u, i) => (
              <div key={i} className="relative">
                <img src={u} alt="" className="w-full h-24 object-cover border rounded" />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6"
                  onClick={() => setImages(images.filter((_, x) => x !== i))}
                  aria-label="移除圖片"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 是否上架 */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          上架顯示（isActive）
        </label>

        {/* 動作 */}
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex gap-2">
          <button className="bg-teal-700 text-white px-4 py-2 rounded">
            {isEdit ? "儲存" : "建立"}
          </button>
          <a className="border px-3 py-2 rounded" href="/vendor/products">返回</a>
        </div>
      </form>
    </div>
  );
}
