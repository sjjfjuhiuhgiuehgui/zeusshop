import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [pwd, setPwd] = useState('')
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    if (!pwd) {
      alert("請輸入管理 Token（需與後端 ADMIN_TOKEN 一致）")
      return
    }
    // 不做硬碼比對，直接把輸入值當 Token 存起來
    localStorage.setItem("adminToken", pwd)
    alert("登入成功")
    // 路徑保持你原來的行為：登入後跳 /admin/orders
    navigate("/admin/orders")
  }

  return (
    <div style={{maxWidth:400, margin:"50px auto", padding:20, border:"1px solid #ccc", borderRadius:8}}>
      <h2>管理員登入</h2>
      <p style={{color:'#666', fontSize:14, lineHeight:1.6}}>
        請輸入後端設定的 <code>ADMIN_TOKEN</code>（例如 <code>secret123</code>）。
      </p>
      <form onSubmit={submit} style={{display:"grid", gap:12}}>
        <input
          type="password"
          value={pwd}
          onChange={(e)=>setPwd(e.target.value)}
          placeholder="請輸入管理 Token（與後端一致）"
          style={{padding:8, fontSize:16}}
        />
        <button type="submit" style={{padding:10}}>登入</button>
      </form>
    </div>
  )
}
