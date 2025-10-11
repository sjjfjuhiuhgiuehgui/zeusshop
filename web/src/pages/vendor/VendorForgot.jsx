import { useState } from "react";
import { vPOST } from "../../lib/vendorApi";

export default function VendorForgot() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [token, setToken] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await vPOST("/password/forgot", { email });
    setDone(true);
    setToken(res?.token || "");
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">忘記密碼</h1>
      {!done ? (
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            className="border rounded w-full p-2"
            placeholder="註冊的 Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="bg-teal-700 text-white w-full py-2 rounded">寄送重設連結</button>
        </form>
      ) : (
        <div className="text-sm">
          <p>重設連結已寄出（開發模式顯示 token）：</p>
          <code className="break-all">{token}</code>
          <p className="mt-2">
            <a className="underline" href={`/vendor/reset?token=${token}`}>
              前往重設頁面
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
