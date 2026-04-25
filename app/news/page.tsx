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
  const [showEdit, setShowEdit] = useState(false)

  const [editNews, setEditNews] = useState<any>(null)

  const [showImageModal, setShowImageModal] = useState(false)
  const [targetNews, setTargetNews] = useState<any>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

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
  image update
  ------------------------- */

  const handleImageUpdate = async (file: File) => {

    if (!targetNews) return

    setUploading(true)

    const fileName = `${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from("news-images")
      .upload(fileName, file)

    if (uploadError) {
      alert("画像アップロード失敗")
      console.error(uploadError)
      setUploading(false)
      return
    }

    const { data } = supabase.storage
      .from("news-images")
      .getPublicUrl(fileName)

    const imageUrl = data.publicUrl

    await supabase
      .from("news")
      .update({ imageUrl })
      .eq("id", targetNews.id)

    // UI更新
    setNews(news.map(n => n.id === targetNews.id ? { ...n, imageUrl } : n))
    setTargetNews({ ...targetNews, imageUrl })
    setUploading(false)
  }

  /* -------------------------
  edit
  ------------------------- */

  const saveEdit = async () => {
    if (!editNews?.id) return

    const { error } = await supabase
      .from("news")
      .update({
        title: editNews.title,
        body: editNews.body,
        isPublished: editNews.isPublished
      })
      .eq("id", editNews.id)

    if (error) {
      alert("更新失敗")
      return
    }

    setNews(news.map(n =>
      n.id === editNews.id ? editNews : n
    ))

    setShowEdit(false)
  }

  /* =========================
  UI
  ========================= */

  return (
    <div style={{ padding: "20px 30px" }}>

      <h1 style={{ textAlign: "center", margin: "0 0 10px" }}>News管理システム</h1>

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
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2",
                  textAlign: "center"
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(n.id!)}
                  onChange={() => toggleSelect(n.id!)}
                />
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {n.imageUrl && (
                  <img
                    src={n.imageUrl}
                    style={{ width: "40px", height: "40px", objectFit: "cover", cursor: "pointer" }}
                    onClick={() => {
                      setTargetNews(n)
                      setShowImageModal(true)
                    }}
                  />
                )}
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {n.title}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {n.body}
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {n.date ? new Date(n.date).toLocaleDateString() : ""}
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2",
                  textAlign: "center"
                }}
              >
                <input
                  type="checkbox"
                  checked={n.isPublished}
                  onChange={() => togglePublish(n)}
                />
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2",
                  textAlign: "center"
                }}
              >
                <button onClick={() => {
                  setEditNews({ ...n })
                  setShowEdit(true)
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

      {/* 編集モーダル */}
      {showEdit && editNews && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3 style={{ marginTop: 0 }}>ニュース編集</h3>

            <div className="modalField">
              <label>タイトル</label>
              <input
                type="text"
                value={editNews.title}
                onChange={(e) => setEditNews({ ...editNews, title: e.target.value })}
              />
            </div>

            <div className="modalField">
              <label>本文</label>
              <textarea
                rows={5}
                value={editNews.body}
                onChange={(e) => setEditNews({ ...editNews, body: e.target.value })}
              />
            </div>

            <div className="modalField">
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editNews.isPublished}
                  onChange={(e) => setEditNews({
                    ...editNews,
                    isPublished: e.target.checked
                  })}
                />
                公開する
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowEdit(false)}>
                キャンセル
              </button>
              <button onClick={saveEdit}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 画像変更モーダル */}
      {showImageModal && targetNews && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999
        }}>
          <div style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            width: "400px",
            textAlign: "center"
          }}>

            <h3>画像変更</h3>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px"
            }}>

              {/* 現在 */}
              <div>
                <p>現在</p>
                {targetNews.imageUrl ? (
                  <img src={targetNews.imageUrl} style={{ width: "140px", height: "140px", objectFit: "cover", border: "1px solid #eee" }} alt="現在の画像" />
                ) : (
                  <div style={{ width: "140px", height: "140px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ccc" }}>
                    画像なし
                  </div>
                )}
              </div>

              {/* 変更後 */}
              <div>
                <p>変更後</p>
                {previewImage ? (
                  <img src={previewImage} style={{ width: "140px", height: "140px", objectFit: "cover", border: "1px solid #eee" }} alt="プレビュー画像" />
                ) : (
                  <div style={{ width: "140px", height: "140px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ccc" }}>
                    未選択
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setSelectedFile(file)
                setPreviewImage(URL.createObjectURL(file))
              }}
            />

            {uploading && <p>アップロード中...</p>}

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
              <button onClick={() => {
                setShowImageModal(false)
                setPreviewImage(null)
                setSelectedFile(null)
                setTargetNews(null) // モーダルを閉じる際にtargetNewsもリセット
              }}>
                キャンセル
              </button>

              <button onClick={async () => {
                if (!selectedFile) {
                  alert("画像を選択してください")
                  return
                }
                await handleImageUpdate(selectedFile)
                setShowImageModal(false)
                setPreviewImage(null)
                setSelectedFile(null)
                setTargetNews(null) // モーダルを閉じる際にtargetNewsもリセット
              }}>
                変更
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}