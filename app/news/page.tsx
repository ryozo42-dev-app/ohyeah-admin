"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type News = {
  id: number
  title: string
  body: string
  imageUrl?: string
  createdAt?: Date | null
  date?: Date | null
  isPublished: boolean
}

export default function Page() {

  const [news, setNews] = useState<News[]>([])
  const [userData, setUserData] = useState<any>(null)
  const isAdmin = userData?.role === "admin"
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const itemsPerPage = 8

  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const [editNews, setEditNews] = useState<any>(null)

  const [showImageModal, setShowImageModal] = useState(false)
  const [targetNews, setTargetNews] = useState<any>(null)
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
    if (!user) {
      setTimeout(loadUser, 500)
      return
    }
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

    load()
    setTargetNews({ ...targetNews, imageUrl })
    setUploading(false)
  }

  /* -------------------------
  edit
  ------------------------- */

  const saveEdit = async () => {
    if (!editNews?.id) return

    setUpdatingId(editNews.id)

    const { error } = await supabase
      .from("news")
      .update({
        title: editNews.title,
        body: editNews.body,
        isPublished: editNews.isPublished
      })
      .eq("id", editNews.id)

    if (error) {
      setUpdatingId(null)
      alert("更新失敗")
      return
    }

    load()
    setShowEdit(false)
    setUpdatingId(null)
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
          {paginatedNews.map((food) => (
            <tr key={food.id}>
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
                  checked={selected.includes(food.id)}
                  onChange={() => toggle(food.id)}
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
                {food.imageUrl && (
                  <img
                    src={food.imageUrl}
                    style={{
                      width: "40px",
                      height: "40px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      setTargetNews(food)
                      setShowImageModal(true)
                    }}
                  />
                )}
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
                {food.title}
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
                {food.body}
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "3px 6px",
                  fontSize: "12px",
                  lineHeight: "1.2"
                }}
              >
                {food.createdAt ? new Date(food.createdAt).toLocaleDateString() : ""}
              </td>

              <td style={{ textAlign: "center", border: "1px solid #ddd", padding: "3px 6px", fontSize: "12px", lineHeight: "1.2" }}>
                <input
                  type="checkbox"
                  checked={food.isPublished}
                  disabled={updatingId === food.id}
                  onChange={async (e) => {

                    const value = e.target.checked

                    setUpdatingId(food.id!)  // ← ロック開始

                    const { error } = await supabase
                      .from("news")
                      .update({ "isPublished": value })
                      .eq("id", food.id)

                    console.log("update error:", error)

                    if (error) {
                      alert("更新失敗")
                      setUpdatingId(null)
                      return
                    }

                    setNews(news.map(item =>
                      item.id === food.id
                        ? { ...item, isPublished: value }
                        : item
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
                    setEditNews({ ...food })
                    setShowEdit(true)
                  }}
                >
                  編集
                </button>

                <button
                  style={{ fontSize: "11px", padding: "1px 6px", color: "red" }}
                  onClick={async () => {
                    if (!confirm("このニュースを削除しますか？")) return
                    await handleDelete(food.id)
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
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
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
              <button onClick={saveEdit} disabled={updatingId === editNews.id}>
                {updatingId === editNews.id ? "保存中..." : "保存"}
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