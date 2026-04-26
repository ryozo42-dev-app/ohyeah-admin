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

  useEffect(() => {
    load()
  }, [])

  const load = async () => {

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