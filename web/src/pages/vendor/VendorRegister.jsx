import { useState } from "react";
import { vPOST } from "../../lib/vendorApi";

export default function VendorRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await vPOST("/register", { email, password, name });
      location.href = "/vendor";
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">廠商註冊</h1>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className="border rounded w-full p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded w-full p-2"
          placeholder="公司/品牌名稱（可選）"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded w-full p-2"
          type="password"
          placeholder="密碼（至少8碼）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="bg-teal-700 text-white w-full py-2 rounded">建立帳號</button>
      </form>
    </div>
  );
}
