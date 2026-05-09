"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {

  const router = useRouter()

  const [newPassword, setNewPassword] =
    useState("")

  const [confirmPassword, setConfirmPassword] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState("")

  const [showPassword, setShowPassword] =
    useState(false)

  const isPasswordMatch =
    confirmPassword &&
    newPassword === confirmPassword

  const handleUpdate = async () => {

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

      setLoading(false)

      return
    }

    setMessage(
      "パスワードを更新しました"
    )

    setTimeout(() => {

      router.push("/dashboard")

    }, 1500)

    setLoading(false)
  }

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "360px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.15)",
          overflow: "hidden"
        }}
      >

        <div
          style={{
            height: "20px",
            background: "#7a5a3a"
          }}
        />

        <div
          style={{
            padding: "30px"
          }}
        >

          <h2
            style={{
              textAlign: "center",
              marginBottom: "24px",
              fontSize: "22px",
              fontWeight: "600"
            }}
          >
            パスワード再設定
          </h2>

          {/* 新しいパスワード */}

          <div
            style={{
              position: "relative",
              marginBottom: "16px"
            }}
          >

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="新しいパスワード"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding:
                  "10px 40px 10px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box"
              }}
            />

            <span
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform:
                  "translateY(-50%)",
                cursor: "pointer",
                zIndex: 10,
                fontSize: "14px"
              }}
            >
              {showPassword
                ? "🙈"
                : "👁"}
            </span>

          </div>

          {/* 確認用 */}

          <div
            style={{
              position: "relative",
              marginBottom: "16px"
            }}
          >

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="確認用パスワード"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding:
                  "10px 40px 10px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box"
              }}
            />

          </div>

          {confirmPassword && (

            <div
              style={{
                fontSize: "12px",
                marginTop: "-12px",
                marginBottom: "16px",
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
                  verticalAlign:
                    "middle",
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
                  message.startsWith(
                    "エラー"
                  )
                    ? "red"
                    : "green",
                fontSize: "13px",
                textAlign: "center",
                marginBottom: "16px"
              }}
            >
              {message}
            </p>

          )}

          <button
            onClick={handleUpdate}
            disabled={
              loading ||
              !isPasswordMatch ||
              newPassword.length < 8
            }
            style={{
              width: "100%",
              padding: "12px",
              background:
                loading ||
                !isPasswordMatch ||
                newPassword.length < 8
                  ? "#ccc"
                  : "#7a5a3a",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
              fontWeight: "600"
            }}
          >
            {loading
              ? "更新中..."
              : "パスワード更新"}
          </button>

        </div>

      </div>

    </div>
  )
}