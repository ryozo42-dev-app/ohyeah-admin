"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { uploadImage } from "@/lib/uploadImage"
import { deleteImage } from "@/lib/deleteImage"

type News = {
  id: number
  title: string
  body: string
  imageUrl?: string
  createdAt?: Date | null
  date?: Date | null
  isPublished: boolean
}

type UserData = {
  id: string
  role: string
} | null

export default function Page() {

  const [news, setNews] = useState<News[]>([])
  const [userData, setUserData] = useState<UserData>(null)
  const isAdmin = userData?.role === "admin"
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const itemsPerPage = 8

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const [editNews, setEditNews] = useState<News | null>(null)

  const [showImageModal, setShowImageModal] = useState(false)
  const [targetNews, setTargetNews] = useState<News | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

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
    loadUser()
  }, [])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
    setUserData(data)
  }

  useEffect(() => {
    setSelected([])
  }, [page, news])

  /* -------------------------
  page
  ------------------------- */

  const start = (page - 1) * itemsPerPage
  const paginatedNews = news.slice(start, start + itemsPerPage)

  const totalPage = Math.ceil(news.length / itemsPerPage)

  const toggleAll = () => {
    const viewIds = paginatedNews.map(v => v.id)
    const isAllSelected = viewIds.length > 0 && viewIds.every(id => selected.includes(id))

    if (isAllSelected) {
      setSelected(selected.filter(id => !viewIds.includes(id)))
    } else {
      setSelected(Array.from(new Set([...selected, ...viewIds])))
    }
  }

  /* -------------------------
  checkbox
  ------------------------- */

  const toggle = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id))
    } else {
      setSelected([...selected, id])
    }
  }

  /* -------------------------
  delete
  ------------------------- */

  const handleDelete = async (id: number) => {
    console.log("🔥 DELETE START - ID:", id, "Type:", typeof id)

    const target = news.find(n => n.id === id)

    const { data, error } = await supabase
      .from("news")
      .delete()
      .eq("id", id)
      .select()

    console.log("DELETE RESULT DATA:", data)

    if (error) {
      console.error("DELETE ERROR:", error)
      alert("削除失敗")
      return
    }

    if (target?.imageUrl) {
      await deleteImage(target.imageUrl)
    }

    if (!data || data.length === 0) {
      console.warn("削除対象が見つかりませんでした。RLSポリシーまたはIDの型を確認してください。")
    }

    load()
  }

  const bulkDelete = async () => {
    if (selected.length === 0) {
      alert("選択されていません")
      return
    }

    if (!confirm(`${selected.length}件削除しますか？`)) return

    console.log("🔥 BULK DELETE:", selected)

    const { data, error } = await supabase
      .from("news")
      .delete()
      .in("id", selected)
      .select()

    console.log("BULK DELETE RESULT DATA:", data)

    if (error) {
      console.error("BULK DELETE ERROR:", error)
      alert("一括削除失敗")
      return
    }

    load()
    setSelected([])
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

  try {

    if (newImageFile) {
      imageUrl = await uploadImage(newImageFile)
    }

  } catch (err) {

    console.error(err)
    alert("画像アップロード失敗")
    return

  }

  const { data, error } = await supabase
    .from("news")
    .insert({
      title: newNews.title,
      body: newNews.body,
      imageUrl,
      isPublished: newNews.isPublished,
      createdAt: new Date().toISOString()
    })
    .select()
    .single()

  console.log("INSERT DATA:", data)
  console.log("INSERT ERROR:", error)

  if (error || !data) {

    alert("投稿失敗")
    console.error(error)
    return

  }

  try {

    console.log("START PUSH FETCH")

    const res = await fetch("/api/send-news-push", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        title: "新着ニュース",
        message: newNews.title,
        newsId: data.id
      })

    })

    const result = await res.text()

    console.log("PUSH RESPONSE:", result)

  } catch (pushErr) {

    console.error("PUSH FETCH ERROR:", pushErr)

  }

  await load()

  setShowAdd(false)

  setNewNews({
    title: "",
    body: "",
    imageUrl: "",
    isPublished: true
  })

  setNewImageFile(null)
  setPreviewAdd(null)
  }

  /* -------------------------
  image update
  ------------------------- */

  const handleImageUpdate = async (file: File) => {

    if (!targetNews) return

    try {

      setUploading(true)

      const oldImageUrl = targetNews.imageUrl
      const imageUrl = await uploadImage(file)

      const { error } = await supabase
        .from("news")
        .update({ imageUrl })
        .eq("id", targetNews.id)

      if (error) {
        console.error(error)
        alert("DB更新失敗")
        setUploading(false)
        return
      }

      if (oldImageUrl) {
        await deleteImage(oldImageUrl)
      }

      await load()

      setTargetNews({
        ...targetNews,
        imageUrl
      })

    } catch (err) {

      console.error(err)
      alert("画像変更失敗")

    } finally {

      setUploading(false)

    }
  }

  /* -------------------------
  edit
  ------------------------- */

  const saveEdit = async () => {
    if (!editNews?.id) return

    setUpdatingId(editNews.id)

    try {
      let imageUrl = editNews.imageUrl || ""
      let oldImageUrl = editNews.imageUrl || "" // oldImageUrlは既に存在します

      // 新画像がある場合アップロード
      if (editImage) {
        imageUrl = await uploadImage(editImage)
      }

      const { error } = await supabase
        .from("news")
        .update({
          title: editNews.title,
          body: editNews.body,
          imageUrl, // ここで更新されたimageUrlを使用
          isPublished: editNews.isPublished
        })
        .eq("id", editNews.id)

      if (error) {
        console.error(error)
        alert("更新失敗")
        setUpdatingId(null)
        return
      }

      if (editImage && oldImageUrl) { // この条件で、新しい画像が選択され、かつ古い画像が存在する場合にのみ削除されます
        await deleteImage(oldImageUrl)
      }

      await load()
      setShowEdit(false)
      setEditImage(null)
      setPreview(null)

    } catch (err) {

      console.error(err)
      alert("画像アップロード失敗")

    } finally {

      setUpdatingId(null)

    }
  }

  /* =========================
  UI
  ========================= */

  return (
    <div style={{
      padding: "20px 30px",
      display: "flex",
      flexDirection: "column"
    }}>

      <h1 style={{ textAlign: "center", margin: "0 0 10px" }}>News管理システム</h1>

      {/* table */}
      <table
        style={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
          background: "#fff"
        }}
      >
        <thead>
          <tr style={{ background: "#ddd" }}>
            <th style={{ width: "3%", border: "1px solid #ddd", padding: "3px 6px", fontSize: "12px", lineHeight: "1.2" }}>
              <input
                type="checkbox"
                checked={paginatedNews.length > 0 && paginatedNews.every(n => selected.includes(n.id))} // 全選択状態の表示
                onChange={toggleAll}
              />
            </th>
            <th style={{ width: "7%", border: "1px solid #ddd", padding: "3px 6px", fontSize: "12px", lineHeight: "1.2" }}>画像</th>
            <th style={{ width: "23%", border: "1px solid #ddd", padding: "3px 6px", fontSize: "12px", lineHeight: "1.2" }}>タイトル</th>
            <th style={{ width: "42%", border: "1px solid #ddd", padding: "3px 6px", fontSize: "12px", lineHeight: "1.2" }}>本文</th>
            <th style={{ width: "10%", border: "1px solid #ddd", padding: "3px 6px", fontSize: "12px", lineHeight: "1.2" }}>日付</th>
            <th style={{ width: "3%", border: "1px solid #ddd", padding: "3px 6px", fontSize: "12px", lineHeight: "1.2" }}>公開</th>
            <th style={{ width: "12%", border: "1px solid #ddd", padding: "3px 6px", fontSize: "12px", lineHeight: "1.2" }}>操作</th>
          </tr>
        </thead>

        <tbody>
          {paginatedNews.map((item) => (
            <tr key={item.id}>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "3px 6px",
                  fontSize: "12px",
                  lineHeight: "1.2",
                  textAlign: "center"
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggle(item.id)}
                />
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "3px 6px",
                  fontSize: "12px",
                  lineHeight: "1.2",
                  textAlign: "center"
                }}
              >
                <div
                  onClick={() => {
                    setTargetNews(item)
                    setShowImageModal(true)
                  }}
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f5f5f5",
                    fontSize: "10px",
                    margin: "0 auto"
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    <span>画像なし</span>
                  )}
                </div>
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "3px 6px",
                  fontSize: "12px",
                  lineHeight: "1.2",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {item.title}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "3px 6px",
                  fontSize: "12px",
                  lineHeight: "1.2",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {item.body}
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "3px 6px",
                  fontSize: "12px",
                  lineHeight: "1.2"
                }}
              >
                {item.createdAt ? item.createdAt.toLocaleDateString() : ""}
              </td>

              <td style={{ textAlign: "center", border: "1px solid #ddd", padding: "3px 6px", fontSize: "12px", lineHeight: "1.2" }}>
                <input
                  type="checkbox"
                  checked={item.isPublished}
                  disabled={updatingId === item.id}
                  onChange={async (e) => {

                    const value = e.target.checked

                    setUpdatingId(item.id)  // ← ロック開始

                    const { error } = await supabase
                      .from("news")
                      .update({ "isPublished": value })
                      .eq("id", item.id)

                    console.log("update error:", error)

                    if (error) {
                      alert("更新失敗")
                      setUpdatingId(null)
                      return
                    }

                    setNews(news.map(n =>
                      n.id === item.id
                        ? { ...n, isPublished: value }
                        : n
                    ))

                    setUpdatingId(null) // ← ロック解除
                  }}
                />
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "3px 6px",
                  fontSize: "12px",
                  lineHeight: "1.2",
                  textAlign: "center"
                }}
              >
                <button
                  style={{ fontSize: "11px", padding: "1px 6px" }}
                  onClick={() => {
                    setEditNews({ ...item })
                    setShowEdit(true)
                    setEditImage(null)
                    setPreview(null)
                  }}
                >
                  編集
                </button>

                <button
                  style={{
                    fontSize: "11px",
                    padding: "1px 6px",
                    color: "red",
                    opacity: isAdmin ? 1 : 0.4,
                    cursor: isAdmin ? "pointer" : "not-allowed"
                  }}
                  disabled={!isAdmin}
                  onClick={async () => {
                    if (!confirm("このニュースを削除しますか？")) return
                    await handleDelete(item.id)
                  }}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ページネーションと操作ボタン */}
      <div style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: 10 }}>
          選択 {selected.length} 件
        </div>

        {/* ページ */}
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button
            onClick={() => page > 1 && setPage(page - 1)}
            style={{
              margin: "0 3px",
              background: "#fff",
              color: "#000",
              fontSize: "12px",
              border: "1px solid #ccc",
              padding: "4px 10px",
              borderRadius: "4px"
            }}
          >
            ◀
          </button>

          {Array.from({ length: totalPage }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                margin: "0 3px",
                background: page === p ? "#7b5a36" : "#fff",
                color: page === p ? "#fff" : "#000",
                fontSize: "12px",
                border: "1px solid #ccc",
                padding: "4px 10px",
                borderRadius: "4px"
              }}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => page < totalPage && setPage(page + 1)}
            style={{
              margin: "0 3px",
              background: "#fff",
              color: "#000",
              fontSize: "12px",
              border: "1px solid #ccc",
              padding: "4px 10px",
              borderRadius: "4px"
            }}
          >
            ▶
          </button>
        </div>

        {/* 下ボタン */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 20
          }}
        >
          <button onClick={() => setShowAdd(true)}>ニュース投稿</button>
          <button
            onClick={async () => {
              if (!isAdmin) return
              await bulkDelete()
            }}
            disabled={!isAdmin}
            style={{
              opacity: isAdmin ? 1 : 0.4,
              cursor: isAdmin ? "pointer" : "not-allowed",
              fontSize: "12px",
              color: "red"
            }}
          >
            一括削除
          </button>
        </div>
      </div>

      {/* 新規投稿モーダル */}
      {showAdd && (
        <div className="modalOverlay">
          <div className="modalContent" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                height: "18px",
                background: "#8B5E3C",
              }}
            />
            <div style={{ padding: "0 20px 20px 20px" }}>
              <h2
                style={{
                  textAlign: "center",
                  marginBottom: "24px",
                  marginTop: "20px"
                }}
              >
                ニュース新規投稿
              </h2>
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
                <button
                  onClick={() => {
                    setShowAdd(false)
                    setNewImageFile(null)
                    setPreviewAdd(null)
                  }}
                >
                  キャンセル
                </button>
                <button onClick={addNews}>投稿する</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEdit && editNews && (
        <div className="modalOverlay">
          <div className="modalContent" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                height: "18px",
                background: "#8B5E3C",
              }}
            />
            <div style={{ padding: "0 20px 20px 20px" }}>
              <h2
                style={{
                  textAlign: "center",
                  marginBottom: "24px",
                  marginTop: "20px"
                }}
              >
                ニュース編集
              </h2>

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
                <button
                  onClick={() => {
                    setShowEdit(false)
                    setEditImage(null)
                    setPreview(null)
                  }}
                >
                  キャンセル
                </button>
                <button onClick={saveEdit} disabled={updatingId === editNews.id}>
                  {updatingId === editNews.id ? "保存中..." : "保存"}
                </button>
              </div>
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
            padding: 0,
            overflow: "hidden",
            borderRadius: "8px",
            width: "400px",
            textAlign: "center"
          }}>

            <div
              style={{
                height: "18px",
                background: "#8B5E3C",
              }}
            />
            <div style={{ padding: "20px" }}>
              <h2
                style={{
                  textAlign: "center",
                  marginBottom: "24px",
                }}
              >
                画像変更
              </h2>

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
                  setTargetNews(null)
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
                  setTargetNews(null)
                }}>
                  変更
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}