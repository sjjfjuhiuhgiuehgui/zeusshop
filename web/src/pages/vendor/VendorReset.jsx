import { useEffect, useState } from "react";
import { vPOST } from "../../lib/vendorApi";

export default function VendorReset() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(location.search).get("token");
    setToken(t || "");
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await vPOST("/password/reset", { token, newPassword: password });
    setDone(true);
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">重設密碼</h1>
      {!done ? (
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            className="border rounded w-full p-2"
            placeholder="Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <input
            className="border rounded w-full p-2"
            type="password"
            placeholder="新密碼（至少8碼）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-teal-700 text-white w-full py-2 rounded">重設密碼</button>
        </form>
      ) : (
        <div className="text-green-600">密碼已更新，<a href="/vendor/login">回登入</a></div>
      )}
    </div>
  );
}
