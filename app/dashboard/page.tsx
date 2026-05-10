"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {

  const [stats, setStats] = useState({
    drinks: 0,
    foods: 0,
    news: 0,
    publishedNews: 0
  })

  const [latestNews, setLatestNews] = useState<any[]>([])

  const [userEmail, setUserEmail] =
    useState("")

  const [showCsvModal, setShowCsvModal] =
    useState(false)

  const [exportActivityLogs, setExportActivityLogs] =
    useState(true)

  const [exportLoginAttempts, setExportLoginAttempts] =
    useState(false)

  const [startDate, setStartDate] =
    useState("")

  const [endDate, setEndDate] =
    useState("")

  useEffect(() => {

    load()

    const {
      data: listener
    } = supabase.auth.onAuthStateChange(
      () => {
        load()
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }

  }, [])

  const load = async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser()

    setUserEmail(user?.email || "")

    const { count: drinks } = await supabase
      .from("menu_drinks")
      .select("*", { count: "exact", head: true })

    const { count: foods } = await supabase
      .from("menu_foods")
      .select("*", { count: "exact", head: true })

    const { count: news } = await supabase
      .from("news")
      .select("*", { count: "exact", head: true })

    const { count: publishedNews } = await supabase
      .from("news")
      .select("*", { count: "exact", head: true })
      .eq("isPublished", true)

    const { data: latest } = await supabase
      .from("news")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(3)

    setStats({
      drinks: drinks || 0,
      foods: foods || 0,
      news: news || 0,
      publishedNews: publishedNews || 0
    })

    setLatestNews(latest || [])
  }

  return (
    <div>

      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Dashboard
      </h1>

      {/* 件数カード */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "15px",
        marginBottom: "30px"
      }}>

        <Card title="Drinks" value={stats.drinks} />
        <Card title="Foods" value={stats.foods} />
        <Card title="News" value={stats.news} />
        <Card title="公開News" value={stats.publishedNews} />

      </div>

      {/* 最新ニュース */}
      <div>
        <h2 style={{ marginBottom: "10px" }}>最新News</h2>

        {latestNews.map(n => (
          <div key={n.id} style={{
            padding: "10px",
            borderBottom: "1px solid #ccc"
          }}>
            <strong>{n.title}</strong>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {n.createdAt}
            </div>
          </div>
        ))}

      </div>

      {/* CSV出力 */}

      {userEmail === "ryozo.42@gmail.com" && (

        <div
          style={{
            marginTop: "30px",
            textAlign: "center"
          }}
        >

          <button
            onClick={() => setShowCsvModal(true)}
            style={{
              background: "#7a5a3a",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            CSV出力
          </button>

        </div>

      )}

      {showCsvModal && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
        >

          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "360px",
              overflow: "hidden",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.2)"
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
                  textAlign: "center",
                  marginBottom: "20px"
                }}
              >
                CSV出力
              </h2>

              {/* 出力対象 */}

              <div style={{ marginBottom: "20px" }}>

                <label
                  style={{
                    display: "block",
                    marginBottom: "10px"
                  }}
                >

                  <input
                    type="checkbox"
                    checked={exportActivityLogs}
                    onChange={(e) =>
                      setExportActivityLogs(
                        e.target.checked
                      )
                    }
                  />

                  {" "}activity_logs

                </label>

                <label
                  style={{
                    display: "block"
                  }}
                >

                  <input
                    type="checkbox"
                    checked={exportLoginAttempts}
                    onChange={(e) =>
                      setExportLoginAttempts(
                        e.target.checked
                      )
                    }
                  />

                  {" "}login_attempts

                </label>

              </div>

              {/* 日付 */}

              <div
                style={{
                  marginBottom: "20px"
                }}
              >

                <div
                  style={{
                    marginBottom: "10px"
                  }}
                >
                  開始日
                </div>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(
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

                <div
                  style={{
                    marginBottom: "10px"
                  }}
                >
                  終了日
                </div>

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) =>
                    setEndDate(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box"
                  }}
                />

              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px"
                }}
              >

                <button
                  onClick={() =>
                    setShowCsvModal(false)
                  }
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#eee",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  閉じる
                </button>

                <button
            onClick={async () => {

              if (
                !startDate ||
                !endDate
              ) {

                alert(
                  "開始日と終了日を選択してください"
                )

                return
              }

              if (exportActivityLogs) {

                const { data, error } =
                  await supabase
                    .from("activity_logs")
                    .select("*")
                    .gte(
                      "created_at",
                      `${startDate}T00:00:00`
                    )
                    .lte(
                      "created_at",
                      `${endDate}T23:59:59`
                    )
                    .order(
                      "created_at",
                      { ascending: false }
                    )

                if (error) {

                  alert(
                    "activity_logs取得失敗"
                  )

                  return
                }

                const csvRows = [

                  ["user_name", "action", "target", "created_at"].join(","),

                  ...(data || []).map((row) =>
                    [
                      row.user_name,
                      row.action,
                      row.target,
                      row.created_at
                    ].join(",")
                  )

                ]

                const csvContent = csvRows.join("\n")
                const blob = new Blob([csvContent], { type: "text/csv" })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `activity_logs_${startDate}_${endDate}.csv`
                a.click()
                window.URL.revokeObjectURL(url)

              }

              if (exportLoginAttempts) {

                const { data, error } =
                  await supabase
                    .from("login_attempts")
                    .select("*")
                    .gte(
                      "updated_at",
                      `${startDate}T00:00:00`
                    )
                    .lte(
                      "updated_at",
                      `${endDate}T23:59:59`
                    )
                    .order(
                      "updated_at",
                      { ascending: false }
                    )

                if (error) {

                  alert(
                    "login_attempts取得失敗"
                  )

                  return
                }

                const csvRows = [

                  [
                    "email",
                    "failed_count",
                    "locked_until",
                    "updated_at"
                  ].join(","),

                  ...(data || []).map(
                    (row) =>
                      [
                        row.email,
                        row.failed_count,
                        row.locked_until,
                        row.updated_at
                      ].join(",")
                  )

                ]

                const csvContent =
                  csvRows.join("\n")

                const blob = new Blob(
                  [csvContent],
                  {
                    type: "text/csv"
                  }
                )

                const url =
                  window.URL.createObjectURL(
                    blob
                  )

                const a =
                  document.createElement("a")

                a.href = url

                a.download =
                  `login_attempts_${startDate}_${endDate}.csv`

                a.click()

                window.URL.revokeObjectURL(
                  url
                )

              }

            }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#7a5a3a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600"
                  }}
                >
                  CSV出力
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      textAlign: "center"
    }}>
      <div style={{ fontSize: "14px", color: "#666" }}>
        {title}
      </div>
      <div style={{ fontSize: "24px", fontWeight: "bold" }}>
        {value}
      </div>
    </div>
  )
}