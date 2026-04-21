"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"
import { updatePassword } from "firebase/auth"

export default function PasswordPage(){

  const [password,setPassword] = useState("")
  const [msg,setMsg] = useState("")

  const changePassword = async () => {
    if (!auth.currentUser) return

    try {
      await updatePassword(auth.currentUser, password)
      setMsg("変更完了！")
    } catch (e:any) {
      setMsg("エラー：" + e.message)
    }
  }

  return (
    <div style={{ padding: 20 }}>

      <h2>パスワード変更</h2>

      <input
        type="password"
        placeholder="新しいパスワード"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        style={{ padding: 8, marginTop: 10 }}
      />

      <br/>

      <button
        onClick={changePassword}
        style={{ marginTop: 10 }}
      >
        変更する
      </button>

      <p>{msg}</p>

    </div>
  )
}