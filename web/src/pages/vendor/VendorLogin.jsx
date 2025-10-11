import { useState } from "react";
import { vPOST } from "../../lib/vendorApi";

export default function VendorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await vPOST("/login", { email, password });
      location.href = "/vendor";
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">廠商登入</h1>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className="border rounded w-full p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded w-full p-2"
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="bg-teal-700 text-white w-full py-2 rounded">登入</button>
      </form>
      <div className="text-sm mt-3 flex justify-between">
        <a href="/vendor/register">註冊帳號</a>
        <a href="/vendor/forgot">忘記密碼？</a>
      </div>
    </div>
  );
}
