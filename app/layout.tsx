"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { usePathname } from "next/navigation"
import "./globals.css"
import { Home, Users, Beer, Utensils, Newspaper, Image } from "lucide-react"
import Link from "next/link"

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [openMenu, setOpenMenu] = useState(false)
  const [showPassModal, setShowPassModal] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    console.log("Auth:", user)

    if (!user) {
      setTimeout(loadUser, 300) // 少し待って再取得
      return
    }

    setUser(user)

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    console.log("DB:", data)
    setUserData(data)
  }

  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>
        <div style={{ position: "relative" }}>
          {/* 通常レイアウト */}
          <div>
            <div className="app" style={{ 
              display: "flex", 
              flexDirection: "column", 
              height: "100vh" 
            }}>
              {/* HEADER */}
              <header
                className="header no-print"
                style={{
                  height: "120px",
                  background: "#7a5a3a",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: "bold",
                  flexShrink: 0,
                  paddingLeft: "200px",
                }}
              >
                Oh Yeah！管理ツール
              </header>

              {/* BODY */}
              <div className="content" style={{ display: "flex", flex: 1 }}>
                {/* SIDEBAR */}
                <aside
                  className="sidebar no-print"
                  style={{
                    width: "200px",
                    background: "#7a5a3a",
                    color: "#fff",
                    padding: "20px 10px",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div
                    className="logo"
                    style={{
                      textAlign: "center",
                      padding: "20px 0 10px",
                      fontSize: "24px",
                      fontWeight: "bold"
                    }}
                  >
                    ADMIN
                  </div>
                  <nav
                    className="menuList"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "20px"
                    }}
                  >
                    <Link href="/dashboard" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                      <Home size={30} />
                      <span>Dashboard</span>
                    </Link>
                    <Link href="/users" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                      <Users size={30} />
                      <span>Users</span>
                    </Link>
                    <Link href="/drinks" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                      <Beer size={30} />
                      <span>Drink</span>
                    </Link>
                    <Link href="/foods" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                      <Utensils size={30} />
                      <span>Food</span>
                    </Link>
                    <Link href="/news" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                      <Newspaper size={30} />
                      <span>News</span>
                    </Link>
                    <Link href="/slider" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                      <Image size={30} />
                      <span>Slider</span>
                    </Link>
                  </nav>

                  <div style={{
                    marginTop: "10px",
                    padding: "10px",
                    textAlign: "center",
                    color: "#333"
                  }}>
                    {/* ボタン */}
                    <div
                      onClick={() => setOpenMenu(!openMenu)}
                      style={{
                        background: "#fff",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        display: "inline-block",
                        textAlign: "center",
                        cursor: "pointer",
                        fontWeight: "500",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      {userData?.name} ▼
                    </div>

                    {/* ドロップダウン */}
                    {openMenu && (
                      <div style={{
                        background: "#fff",
                        marginTop: "8px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.15)"
                      }}>
                        <div
                          onClick={() => {
                            setShowPassModal(true)
                            setOpenMenu(false)
                          }}
                          style={{
                            padding: "10px",
                            cursor: "pointer",
                            borderBottom: "1px solid #eee"
                          }}
                        >
                          パスワード変更
                        </div>
                        <div
                          onClick={async () => {
                            await supabase.auth.signOut()
                            location.reload()
                          }}
                          style={{
                            padding: "10px",
                            cursor: "pointer",
                            color: "red",
                            fontWeight: "bold"
                          }}
                        >
                          ログアウト
                        </div>
                      </div>
                    )}
                  </div>
                </aside>

                {/* MAIN */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center"
                }}>
                  {children}
                </div>
              </div>
            </div>
          </div>

          {/* モーダル */}
          {!user && <LoginModal onLogin={loadUser} />}
          {showPassModal && <PasswordModal onClose={() => setShowPassModal(false)} />}
        </div>
      </body>
    </html>
  )
}

/**
 * 簡易ログイン促しモーダル
 */
function LoginModal({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert("ログイン失敗")
      setLoading(false)
      return
    }

    onLogin()
    setLoading(false)
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "320px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          overflow: "hidden"
        }}
      >
        {/* 上のカラーバー */}
        <div style={{
          height: "20px",
          background: "#7a5a3a"
        }} />

        <div style={{ padding: "30px" }}>
          <h2 style={{
            marginBottom: "20px",
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "600"
          }}>
            Login
          </h2>

          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              boxSizing: "border-box"
            }}
          />

          <div style={{ position: "relative", marginBottom: "16px" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 40px 10px 10px", // 👈 右余白重要
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box"
              }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                zIndex: 10,
                fontSize: "14px"
              }}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: loading ? "#ccc" : "#7a5a3a",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600"
            }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * パスワード変更モーダル
 */
function PasswordModal({ onClose }: { onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleUpdate = async () => {
    if (!newPassword) {
      setMessage("新しいパスワードを入力してください")
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage("エラー: パスワードが一致しません")
      return
    }
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setMessage("エラー: " + error.message)
    } else {
      setMessage("パスワードを更新しました")
      setTimeout(onClose, 1500)
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        width: "320px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        overflow: "hidden"
      }}>
        <div style={{ height: "20px", background: "#7a5a3a" }} />
        <div style={{ padding: "30px" }}>
          <h2 style={{ marginBottom: "20px", textAlign: "center", fontSize: "20px", fontWeight: "600" }}>
            パスワード変更
          </h2>

          <div style={{ position: "relative", marginBottom: "16px" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="新しいパスワード"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 40px 10px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box"
              }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                zIndex: 10,
                fontSize: "14px"
              }}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <div style={{ position: "relative", marginBottom: "16px" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="確認用パスワード"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 40px 10px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box"
              }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                zIndex: 10,
                fontSize: "14px"
              }}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          {confirmPassword && (
            <div style={{
              fontSize: "12px",
              marginTop: "-12px",
              marginBottom: "12px",
              textAlign: "left",
              color: newPassword === confirmPassword ? "#28a745" : "#dc3545",
              fontWeight: "600"
            }}>
              <span style={{ fontSize: "8px", verticalAlign: "middle", marginRight: "4px" }}>●</span>
              {newPassword === confirmPassword ? "一致しています" : "一致していません"}
            </div>
          )}

          {message && (
            <p style={{
              color: message.startsWith("エラー") ? "red" : "green",
              fontSize: "13px",
              textAlign: "center",
              marginBottom: "15px"
            }}>
              {message}
            </p>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "#eee", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
              閉じる
            </button>
            <button onClick={handleUpdate} disabled={loading} style={{
              flex: 1, padding: "10px", background: loading ? "#ccc" : "#7a5a3a", color: "#fff", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "600"
            }}>
              {loading ? "更新中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}