import { useEffect, useState } from "react";

export default function VendorOrders(){
  const [orders,setOrders]=useState([]);

  useEffect(()=>{ (async()=>{
    const res = await fetch('/api/vendor/orders',{ credentials:'include' });
    const data = await res.json();
    setOrders(data.orders || []);
  })(); },[]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">我的訂單</h1>
      {orders.length===0 && <div className="text-neutral-500">尚無訂單</div>}
      <div className="space-y-4">
        {orders.map(o=>(
          <div key={o.orderId} className="border rounded p-3">
            <div className="font-medium">訂單：{o.number}</div>
            <div className="text-sm text-neutral-600">收件人：{o.buyerName}｜電話：{o.phone}</div>
            <div className="text-sm text-neutral-600">地址：{o.address}</div>
            <div className="text-sm text-neutral-600 mb-2">狀態：{o.status}</div>
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th>商品</th><th>數量</th><th>單價</th><th>小計</th></tr></thead>
              <tbody>
                {o.items.map(it=>(
                  <tr key={it.itemId} className="border-b last:border-0">
                    <td className="py-1">{it.title}</td>
                    <td>{it.quantity}</td>
                    <td>{it.unitPrice}</td>
                    <td>{it.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
