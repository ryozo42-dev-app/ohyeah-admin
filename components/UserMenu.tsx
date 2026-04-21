"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, db } from "../lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { useRef } from "react"

export default function UserMenu() {

  const [name, setName] = useState("")
  const [show, setShow] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [current, setCurrent] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirm, setConfirm] = useState("")
  const [msg, setMsg] = useState("")

  const menuRef = useRef<HTMLDivElement>(null)

  const changePassword = async () => {

    if (!auth.currentUser) return

    if (newPass !== confirm) {
      setMsg("パスワードが一致しません")
      return
    }

    try {
      // 再認証（超重要）
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        current
      )

      await reauthenticateWithCredential(auth.currentUser, credential)

      // 更新
      await updatePassword(auth.currentUser, newPass)

      setMsg("変更成功！")
      setShowModal(false)

    } catch (e: any) {
      setMsg("エラー：" + e.message)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {

      if (!user) return

      try {
        const snap = await getDoc(doc(db, "users", user.uid))

        if (snap.exists()) {
          setName(snap.data().name)
        } else {
          setName(user.email || "User")
        }

      } catch (e) {
        // Firestore失敗時 fallback
        setName(user.email || "User")
      }

    })

    return () => unsub()
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShow(false)
      }
    }

    document.addEventListener("mousedown", handleClick)

    return () => {
      document.removeEventListener("mousedown", handleClick)
    }
  }, [])

  if (!name) return null

  return (
    <div ref={menuRef} style={{ position: "relative", textAlign: "center" }}>

      {/* ボタン */}
      <button
        onClick={() => setShow(!show)}
        style={{
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "6px",
          padding: "6px 10px",
          fontSize: "13px",
          cursor: "pointer",
          whiteSpace: "nowrap"
        }}
      >
        {name} ▼
      </button>

      {/* メニュー */}
      {show && (
        <div style={{
          position: "absolute",
          top: "110%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "6px",
          minWidth: "160px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>

          {/* 👇 これが出ない問題の本体だった */}
          <div
  onClick={() => {
    setShow(false)
    setShowModal(true)
  }}
  style={{
    padding: "10px",
    cursor: "pointer",
    color: "#333",
    background: "#fff"
  }}
>
  パスワード変更
</div>

          <div style={{ height: "1px", background: "#eee" }} />

          <div
  onClick={async () => {
  await signOut(auth)
  location.href = "/login"
}}
  style={{
    padding: "10px",
    cursor: "pointer",
    color: "red",
    fontWeight: "bold",
    background: "#fff"
  }}
>
  ログアウト
</div>

        </div>
      )}

      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999
        }}>

          <div style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            width: "300px"
          }}>

            <h3>パスワード変更</h3>

            <input
              type="password"
              placeholder="今のパスワード"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />

            <input
              type="password"
              placeholder="新しいパスワード"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />

            <input
              type="password"
              placeholder="確認用"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />

            <button onClick={changePassword}>
              変更する
            </button>

            <button onClick={() => setShowModal(false)}>
              キャンセル
            </button>

            <p>{msg}</p>

          </div>
        </div>
      )}

    </div>
  )
}