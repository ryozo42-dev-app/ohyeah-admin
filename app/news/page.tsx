"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type News = {
  id?: string
  title: string
  body: string
  imageUrl?: string
  createdAt?: Date | null
  date?: Date | null
  isPublished: boolean
}

export default function Page() {

  const [news, setNews] = useState<News[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)

  const [showAdd, setShowAdd] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [editNews, setEditNews] = useState<News | null>(null)

  const [modalImage, setModalImage] = useState("")
  const [showImageModal, setShowImageModal] = useState(false)

  const [newNews, setNewNews] = useState({
    title: "",
    body: "",
    imageUrl: "",
    isPublished: true
  })

  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [previewAdd, setPreviewAdd] = useState<string | null>(null)

  const [editImage, setEditImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const perPage = 6

  /* -------------------------
  load
  ------------------------- */

  const load = async () => {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("createdAt", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    const list: News[] = (data || []).map((d: any) => ({
      id: d.id,
      title: d.title || "",
      body: d.body || "",
      imageUrl: d.imageUrl || "",
      createdAt: d.createdAt ? new Date(d.createdAt) : null,
      date: d.date ? new Date(d.date) : null,
      isPublished: d.isPublished ?? true
    }))

    setNews(list)
  }

  useEffect(() => {
    load()
  }, [])

  /* -------------------------
  page
  ------------------------- */

  const start = (page - 1) * perPage
  const view = news.slice(start, start + perPage)

  const totalPage = Math.ceil(news.length / perPage)
  const pages = Array.from({ length: totalPage }, (_, i) => i + 1)

  /* -------------------------
  checkbox
  ------------------------- */

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(n => n !== id)
        : [...prev, id]
    )
  }

  /* -------------------------
  delete
  ------------------------- */

  const deleteRow = async (id: string) => {
    if (!confirm("削除しますか？")) return

    await supabase.from("news").delete().eq("id", id)
    await load()
  }

  const bulkDelete = async () => {
    if (selected.length === 0) {
      alert("ニュースを選択してください")
      return
    }

    if (!confirm("削除しますか？")) return

    await supabase.from("news").delete().in("id", selected)
    setSelected([])
    await load()
  }

  /* -------------------------
  publish
  ------------------------- */

  const togglePublish = async (n: News) => {
    await supabase
      .from("news")
      .update({ isPublished: !n.isPublished })
      .eq("id", n.id)

    await load()
  }

  /* -------------------------
  add
  ------------------------- */

  const addNews = async () => {
    if (!newNews.title.trim()) {
      alert("タイトルを入力してください")
      return
    }

    let imageUrl = ""

    if (newImageFile) {
      const fileName = `${Date.now()}_${newImageFile.name}`

      const { error: uploadError } = await supabase.storage
        .from("news-images")
        .upload(fileName, newImageFile)

      console.log("UPLOAD ERROR:", uploadError)

      if (uploadError) {
        alert("画像アップロード失敗")
        return
      }

      const { data } = supabase.storage
        .from("news-images")
        .getPublicUrl(fileName)

      console.log("PUBLIC URL:", data?.publicUrl)

      imageUrl = data?.publicUrl || ""

      console.log("FINAL imageUrl:", imageUrl)
    }

    console.log("INSERT DATA:", {
      title: newNews.title,
      body: newNews.body,
      imageUrl,
      isPublished: newNews.isPublished
    })

    const { error } = await supabase.from("news").insert({
      title: newNews.title,
      body: newNews.body,
      imageUrl,
      isPublished: newNews.isPublished,
      createdAt: new Date().toISOString()
    })

    console.log("INSERT ERROR:", JSON.stringify(error, null, 2))

    if (error) {
      alert("投稿失敗")
      console.error(error)
      return
    }

    await load()
    setShowAdd(false)
    setNewNews({ title: "", body: "", imageUrl: "", isPublished: true })
    setNewImageFile(null)
    setPreviewAdd(null)
  }

  /* -------------------------
  edit
  ------------------------- */

  const saveEdit = async () => {
    if (!editNews?.id) return

    await supabase
      .from("news")
      .update({
        title: editNews.title,
        body: editNews.body,
        imageUrl: editNews.imageUrl || "",
        isPublished: editNews.isPublished
      })
      .eq("id", editNews.id)

    setShowEditModal(false)
    await load()
  }

  /* =========================
  UI
  ========================= */

  return (
    <div className="page">

      <h1 style={{ textAlign: "center" }}>News管理システム</h1>

      {/* table */}
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
        <thead>
          <tr style={{ background: "#ddd" }}>
            <th><input type="checkbox" /></th>
            <th>画像</th>
            <th>タイトル</th>
            <th>本文</th>
            <th>日付</th>
            <th>公開</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          {view.map((n, i) => (
            <tr key={n.id || i}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(n.id!)}
                  onChange={() => toggleSelect(n.id!)}
                />
              </td>

              <td>
                {n.imageUrl && (
                  <img
                    src={n.imageUrl}
                    style={{ height: 60, width: 80, objectFit: "cover", cursor: "pointer" }}
                    onClick={() => {
                      setModalImage(n.imageUrl || "")
                      setShowImageModal(true)
                    }}
                  />
                )}
              </td>

              <td>{n.title}</td>
              <td>{n.body}</td>

              <td>
                {n.date ? new Date(n.date).toLocaleDateString() : ""}
              </td>

              <td>
                <input
                  type="checkbox"
                  checked={n.isPublished}
                  onChange={() => togglePublish(n)}
                />
              </td>

              <td>
                <button onClick={() => {
                  setEditNews({ ...n })
                  setShowEditModal(true)
                }}>編集</button>

                <button className="dangerText" onClick={() => deleteRow(n.id!)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 10 }}>
        選択 {selected.length} 件
      </div>

      {/* ページ */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 15 }}>
        <button onClick={() => page > 1 && setPage(page - 1)}>◀</button>
        {pages.map(p => (
          <button key={p} onClick={() => setPage(p)}>
            {p}
          </button>
        ))}
        <button onClick={() => page < totalPage && setPage(page + 1)}>▶</button>
      </div>

      {/* 下ボタン */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
        <button onClick={() => setShowAdd(true)}>ニュース投稿</button>
        <button className="dangerText" onClick={bulkDelete}>一括削除</button>
      </div>

      {/* 新規投稿モーダル */}
      {showAdd && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h2 style={{ marginTop: 0 }}>ニュース新規投稿</h2>
            <div className="modalField">
              <label>タイトル</label>
              <input
                type="text"
                value={newNews.title}
                onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
              />
            </div>
            <div className="modalField">
              <label>本文</label>
              <textarea
                rows={5}
                value={newNews.body}
                onChange={(e) => setNewNews({ ...newNews, body: e.target.value })}
              />
            </div>

            <div className="modalField">
              <label style={{ marginTop: "10px" }}>画像</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setNewImageFile(file)
                  setPreviewAdd(URL.createObjectURL(file))
                }}
              />
              {previewAdd && (
                <img
                  src={previewAdd}
                  style={{
                    marginTop: "10px",
                    width: "140px",
                    height: "140px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #ccc"
                  }}
                />
              )}
            </div>

            <div className="modalField">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newNews.isPublished}
                  onChange={(e) => setNewNews({ ...newNews, isPublished: e.target.checked })}
                />
                公開する
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setShowAdd(false)}>キャンセル</button>
              <button onClick={addNews}>投稿する</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}