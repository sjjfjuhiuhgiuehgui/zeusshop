import { useEffect, useState } from "react";
import { vGET } from "../../lib/vendorApi";

export default function VendorProducts() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const { items: list } = await (await fetch('/api/vendor/products', { credentials:'include' })).json();
      setItems(list || []);
    })();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">我的商品</h1>
        <a className="border px-3 py-1 rounded" href="/vendor/products/new">新增商品</a>
      </div>
      <div className="space-y-2">
        {items.map(p => (
          <a key={p.id} href={`/vendor/products/${p.id}/edit`} className="block border rounded p-3 hover:bg-neutral-50">
            <div className="font-medium">{p.title}</div>
            <div className="text-sm text-neutral-600">價格：{p.price}、庫存：{p.stock}、上架：{p.visible ? '是' : '否'}</div>
          </a>
        ))}
        {items.length===0 && <div className="text-neutral-500">尚無商品</div>}
      </div>
    </div>
  );
}
