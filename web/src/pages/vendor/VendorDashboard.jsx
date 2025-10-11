import { useEffect, useState } from "react";
import { vGET, vPOST } from "../../lib/vendorApi";

export default function VendorDashboard() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      const m = await vGET("/me");
      if (!m) location.href = "/vendor/login";
      setMe(m);
    })();
  }, []);

  async function logout() {
    await vPOST("/logout", {});
    location.href = "/vendor/login";
  }

  if (!me) return null;
  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">廠商後台</h1>
        <button className="border px-3 py-1 rounded" onClick={logout}>
          登出
        </button>
      </div>
      <div className="border rounded p-4">
        <p>歡迎，{me.name || me.email}</p>
        <p className="text-sm text-gray-500 mt-2">
          這裡未來可擴充上架商品、查看自己的訂單。
        </p>
      </div>
    </div>
  );
}
