"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { usePathname, useRouter } from "next/navigation"
import "./globals.css"
import {
  Home,
  Users,
  Beer,
  Utensils,
  Newspaper,
  Image
} from "lucide-react"
import Link from "next/link"

export default function Layout({
  children
}: {
  children: React.ReactNode
}) {

  const pathname = usePathname()
  const isResetPasswordPage =
  pathname === "/reset-password"

  const router = useRouter()

  const [user, setUser] = useState<any>(null)

  const [userData, setUserData] = useState<any>(null)

  const [openMenu, setOpenMenu] = useState(false)

  const [showPassModal, setShowPassModal] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut()
      setUser(null)
      setUserData(null)
      alert("30分間操作がなかったためログアウトしました")
      router.push("/dashboard")
    }, 30 * 60 * 1000)
  }, [router])

  useEffect(() => {

    resetTimer()

    window.addEventListener("mousemove", resetTimer)
    window.addEventListener("mousedown", resetTimer)
    window.addEventListener("keydown", resetTimer)
    window.addEventListener("touchstart", resetTimer)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      window.removeEventListener("mousemove", resetTimer)
      window.removeEventListener("mousedown", resetTimer)
      window.removeEventListener("keydown", resetTimer)
      window.removeEventListener("touchstart", resetTimer)
    }
  }, [resetTimer])

  const loadUser = async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser()

    console.log("Auth:", user)

    if (!user) {

      setUser(null)

      setUserData(null)

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

          {!isResetPasswordPage ? (

          <div>

            <div
              className="app"
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh"
              }}
            >

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

              <div
                className="content"
                style={{
                  display: "flex",
                  flex: 1
                }}
              >

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

                    <Link
                      href="/dashboard"
                      className="menuItem"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "140px"
                      }}
                    >
                      <Home size={30} />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      href="/users"
                      className="menuItem"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "140px"
                      }}
                    >
                      <Users size={30} />
                      <span>Users</span>
                    </Link>

                    <Link
                      href="/drinks"
                      className="menuItem"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "140px"
                      }}
                    >
                      <Beer size={30} />
                      <span>Drink</span>
                    </Link>

                    <Link
                      href="/foods"
                      className="menuItem"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "140px"
                      }}
                    >
                      <Utensils size={30} />
                      <span>Food</span>
                    </Link>

                    <Link
                      href="/news"
                      className="menuItem"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "140px"
                      }}
                    >
                      <Newspaper size={30} />
                      <span>News</span>
                    </Link>

                    <Link
                      href="/slider"
                      className="menuItem"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "140px"
                      }}
                    >
                      <Image size={30} />
                      <span>Slider</span>
                    </Link>

                  </nav>

                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      textAlign: "center",
                      color: "#333"
                    }}
                  >

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

                      <div
                        style={{
                          background: "#fff",
                          marginTop: "8px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.15)"
                        }}
                      >

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

                            setUser(null)

                            setUserData(null)

                            setOpenMenu(false)

                            router.push("/dashboard")

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

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center"
                  }}
                >
                  {children}
                </div>

              </div>

            </div>

          </div>

          ) : (

            children

          )}


          {/* モーダル */}

          {!user && (
            <LoginModal onLogin={loadUser} />
          )}

          {showPassModal && (
            <PasswordModal
              onClose={() => setShowPassModal(false)}
            />
          )}

        </div>

      </body>

    </html>
  )
}

/**
 * 簡易ログイン促しモーダル
 */

function LoginModal({
  onLogin
}: {
  onLogin: () => void
}) {

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)

  const [showResetModal, setShowResetModal] =
    useState(false)

  const [resetEmail, setResetEmail] =
    useState("")

  const [resetMessage, setResetMessage] =
    useState("")

  const [resetLoading, setResetLoading] =
    useState(false)

  const handleLogin = async () => {

    const cleanEmail = email.trim().toLowerCase()

    setLoading(true)

    const { data: attempt, error: fetchError } =
      await supabase
        .from("login_attempts")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle()

    if (fetchError) {
      console.error("Fetch attempt error:", fetchError)
      // RLSエラーなどで取得できない場合でも処理は続行させる（初回失敗扱いになる）
    }

    if (
      attempt?.locked_until &&
      new Date(attempt.locked_until) >
        new Date()
    ) {

      alert(
        "ログイン失敗回数が上限に達しました。\n15分後に再試行してください。"
      )

      setLoading(false)

      return
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password.trim()
      })

    if (error) {

      const failedCount =
        (attempt?.failed_count || 0) + 1

      const lockUntil =
        failedCount >= 5
          ? new Date(
              Date.now() +
              15 * 60 * 1000
            ).toISOString()
      : ""

      await supabase
        .from("login_attempts")
        .upsert(
          {
            email: cleanEmail,
            failed_count: failedCount,
            locked_until: lockUntil || null,
            updated_at:
              new Date().toISOString()
          },
          {
            onConflict: "email"
          }
        )
        .then(({ error }) => {
          if (error) console.error("Upsert failed:", error)
        })

      await supabase
        .from("activity_logs")
        .insert({
          action: "LOGIN_FAILED",
          target: cleanEmail
        })

      if (failedCount >= 5) {

        alert(
          "ログイン失敗が5回に達しました。\n15分間ログインできません。"
        )

      } else {

        alert(
          `ログイン失敗 (${failedCount}/5)`
        )

      }

      setLoading(false)

      return
    }

    await supabase
      .from("login_attempts")
      .upsert(
        {
          email: cleanEmail,
          failed_count: 0,
          locked_until: null,
          updated_at:
            new Date().toISOString()
        },
        {
          onConflict: "email"
        }
      )

    await supabase
      .from("activity_logs")
      .insert({
        action: "LOGIN_SUCCESS",
        target: cleanEmail
      })

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

        <div
          style={{
            height: "20px",
            background: "#7a5a3a"
          }}
        />

        <div style={{ padding: "30px" }}>

          <h2
            style={{
              marginBottom: "20px",
              textAlign: "center",
              fontSize: "22px",
              fontWeight: "600"
            }}
          >
            Login
          </h2>

          <input
            placeholder="Email"
            value={email}
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

          <div
            style={{
              position: "relative",
              marginBottom: "16px"
            }}
          >

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <div style={{ textAlign: "center" }}>

            <button
              onClick={handleLogin}
              disabled={loading}
            >
              {loading
                ? "ログイン中..."
                : "ログイン"}
            </button>

          </div>

          <div
            style={{
              marginTop: "14px",
              textAlign: "center"
            }}
          >

            <span
              onClick={() =>
                setShowResetModal(true)
              }
              style={{
                fontSize: "13px",
                color: "#7a5a3a",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              パスワードを忘れましたか？
            </span>

          </div>

        </div>

      </div>

      {showResetModal && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "320px",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.2)",
              overflow: "hidden"
            }}
          >

            <div
              style={{
                height: "20px",
                background: "#7a5a3a"
              }}
            />

            <div style={{ padding: "30px" }}>

              <h2
                style={{
                  marginBottom: "20px",
                  textAlign: "center",
                  fontSize: "20px",
                  fontWeight: "600"
                }}
              >
                パスワードリセット
              </h2>

              <input
                type="email"
                placeholder="メールアドレス"
                value={resetEmail}
                onChange={(e) =>
                  setResetEmail(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box"
                }}
              />

              {resetMessage && (

                <p
                  style={{
                    color:
                      resetMessage.startsWith(
                        "エラー"
                      )
                        ? "red"
                        : "green",
                    fontSize: "13px",
                    textAlign: "center",
                    marginBottom: "15px"
                  }}
                >
                  {resetMessage}
                </p>

              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px"
                }}
              >

                <button
                  onClick={() => {

                    setShowResetModal(false)

                    setResetMessage("")

                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#eee",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600"
                  }}
                >
                  閉じる
                </button>

                <button
                  onClick={async () => {

                    if (!resetEmail) {

                      setResetMessage(
                        "メールアドレスを入力してください"
                      )

                      return
                    }

                    setResetLoading(true)

                    setResetMessage("")

                    const { error } =
                      await supabase.auth
                        .resetPasswordForEmail(
                          resetEmail,
                          {
                            redirectTo:
                              "https://ohyeah-admin.vercel.app/reset-password"
                          }
                        )

                    if (error) {

                      setResetMessage(
                        "エラー: " +
                        error.message
                      )

                    } else {

                      setResetMessage(
                        "リセットメールを送信しました"
                      )

                    }

                    setResetLoading(false)

                  }}
                  disabled={resetLoading}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background:
                      resetLoading
                        ? "#ccc"
                        : "#7a5a3a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor:
                      resetLoading
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: "600"
                  }}
                >
                  {resetLoading
                    ? "送信中..."
                    : "送信"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

/**
 * パスワード変更モーダル
 */

function PasswordModal({
  onClose
}: {
  onClose: () => void
}) {

  const [currentPassword, setCurrentPassword] =
    useState("")

  const [currentPasswordOk, setCurrentPasswordOk] =
    useState<boolean | null>(null)

  const [newPassword, setNewPassword] =
    useState("")

  const [confirmPassword, setConfirmPassword] =
    useState("")

  const [loading, setLoading] = useState(false)

  const [message, setMessage] = useState("")

  const [showPassword, setShowPassword] =
    useState(false)

  const checkCurrentPassword = async (
    password: string
  ) => {

    setCurrentPassword(password)
    setCurrentPasswordOk(null)

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user?.email || !password) {

      setCurrentPasswordOk(null)

      return
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password
      })

    setCurrentPasswordOk(!error)
  }

  const handleUpdate = async () => {

    if (!currentPasswordOk) {

      setMessage(
        "エラー: 現在のパスワードが違います"
      )

      return
    }

    if (!newPassword) {

      setMessage(
        "新しいパスワードを入力してください"
      )

      return
    }

    if (newPassword.length < 8) {

      setMessage(
        "エラー: 8文字以上で入力してください"
      )

      return
    }

    if (newPassword !== confirmPassword) {

      setMessage(
        "エラー: 新しいパスワードが一致していません"
      )

      return
    }

    setLoading(true)

    setMessage("")

    const { error } =
      await supabase.auth.updateUser({
        password: newPassword
      })

    if (error) {

      setMessage(
        "エラー: " + error.message
      )

    } else {

      setMessage(
        "パスワードを更新しました"
      )

      setTimeout(onClose, 1500)
    }

    setLoading(false)
  }

  const isPasswordMatch =
    confirmPassword &&
    newPassword === confirmPassword

  const isFormValid =
    currentPasswordOk === true &&
    newPassword.length >= 8 &&
    isPasswordMatch

  const canSave = !loading && isFormValid

  return (

    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
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

        <div
          style={{
            height: "20px",
            background: "#7a5a3a"
          }}
        />

        <div style={{ padding: "30px" }}>

          <h2
            style={{
              marginBottom: "20px",
              textAlign: "center",
              fontSize: "20px",
              fontWeight: "600"
            }}
          >
            パスワード変更
          </h2>

          {/* 現在のパスワード */}

          <div
            style={{
              position: "relative",
              marginBottom: "16px"
            }}
          >

            <input
              type={showPassword ? "text" : "password"}
              placeholder="現在のパスワード"
              value={currentPassword}
              onChange={(e) =>
                checkCurrentPassword(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "10px 40px 10px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box"
              }}
            />

            <span
              onClick={() =>
                setShowPassword(!showPassword)
              }
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

          {currentPassword && (

            <div
              style={{
                fontSize: "12px",
                marginTop: "-12px",
                marginBottom: "12px",
                textAlign: "left",
                color:
                  currentPasswordOk
                    ? "#28a745"
                    : "#dc3545",
                fontWeight: "600"
              }}
            >

              <span
                style={{
                  fontSize: "8px",
                  verticalAlign: "middle",
                  marginRight: "4px"
                }}
              >
                ●
              </span>

              {currentPasswordOk
                ? "現在のパスワードと一致しています"
                : "現在のパスワードと違います"}

            </div>

          )}

          {/* 新しいパスワード */}

          <div
            style={{
              position: "relative",
              marginBottom: "16px"
            }}
          >

            <input
              type={showPassword ? "text" : "password"}
              placeholder="新しいパスワード"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              style={{
                width: "100%",
                padding: "10px 40px 10px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box"
              }}
            />

            <span
              onClick={() =>
                setShowPassword(!showPassword)
              }
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

          {newPassword && (

            <div
              style={{
                fontSize: "12px",
                marginTop: "-12px",
                marginBottom: "12px",
                textAlign: "left",
                color:
                  newPassword.length >= 8
                    ? "#28a745"
                    : "#dc3545",
                fontWeight: "600"
              }}
            >

              <span
                style={{
                  fontSize: "8px",
                  verticalAlign: "middle",
                  marginRight: "4px"
                }}
              >
                ●
              </span>

              {newPassword.length >= 8
                ? "8文字以上の条件を満たしています"
                : "8文字以上で入力してください"}

            </div>

          )}

          {/* 確認用 */}

          <div
            style={{
              position: "relative",
              marginBottom: "16px"
            }}
          >

            <input
              type={showPassword ? "text" : "password"}
              placeholder="確認用パスワード"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              style={{
                width: "100%",
                padding: "10px 40px 10px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box"
              }}
            />

            <span
              onClick={() =>
                setShowPassword(!showPassword)
              }
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

            <div
              style={{
                fontSize: "12px",
                marginTop: "-12px",
                marginBottom: "12px",
                textAlign: "left",
                color:
                  isPasswordMatch
                    ? "#28a745"
                    : "#dc3545",
                fontWeight: "600"
              }}
            >

              <span
                style={{
                  fontSize: "8px",
                  verticalAlign: "middle",
                  marginRight: "4px"
                }}
              >
                ●
              </span>

              {isPasswordMatch
                ? "新しいパスワードと一致しています"
                : "新しいパスワードと一致していません"}

            </div>

          )}

          {message && (

            <p
              style={{
                color:
                  message.startsWith("エラー")
                    ? "red"
                    : "green",
                fontSize: "13px",
                textAlign: "center",
                marginBottom: "15px"
              }}
            >
              {message}
            </p>

          )}

          <div
            style={{
              display: "flex",
              gap: "10px"
            }}
          >

            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                background: "#eee",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              閉じる
            </button>

            <button
              onClick={handleUpdate}
              disabled={!canSave}
              style={{
                flex: 1,
                padding: "10px",
                background: canSave ? "#7a5a3a" : "#ccc",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: canSave ? "pointer" : "not-allowed",
                fontWeight: "600"
              }}
            >
              {loading
                ? "更新中..."
                : "保存"}
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}