"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import imageCompression from "browser-image-compression"

type SliderImage = {
  id: number
  imageUrl: string
  order: number
  newsId: number | null
  isActive: boolean
}

type News = {
  id: number
  title: string
}

export default function Page() {
  const [sliders, setSliders] = useState<SliderImage[]>([])
  const [newsList, setNewsList] = useState<News[]>([])
  const [targetSlider, setTargetSlider] = useState<SliderImage | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from("slider_images")
      .select("*")
      .order("order", { ascending: true })

    if (data) setSliders(data as SliderImage[])

    const { data: newsData } = await supabase
      .from("news")
      .select("id, title")

    if (newsData) setNewsList(newsData as News[])
  }

  const openEditModal = (slider: SliderImage) => {
    setTargetSlider(slider)
    setSelectedNewsId(slider.newsId)
    setUploadFile(null)
    setIsActive(slider.isActive ?? true)
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!targetSlider) return

    setLoading(true)

    try {
      let imageUrl = targetSlider.imageUrl

      // 🔥 新しい画像がある場合
      if (uploadFile) {
        let fileToUpload: File | Blob = uploadFile

        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: "image/webp" as const,
        }

        try {
          fileToUpload = await imageCompression(uploadFile, options)
        } catch (error) {
          alert("画像変換失敗")
          return
        }

        const fileName = `${Date.now()}.webp`
        const filePath = `slider/${fileName}` // ← フォルダ分け

        // 🔥 アップロード
        const { error: uploadError } = await supabase.storage
          .from("slider-images")
          .upload(filePath, fileToUpload, { upsert: true })

        if (uploadError) {
          alert("画像アップロード失敗")
          return
        }

        // 🔥 URL取得
        const { data } = supabase.storage
          .from("slider-images")
          .getPublicUrl(filePath)

        imageUrl = data.publicUrl

        // 🔥 古い画像削除（重要）
        try {
          const oldPath = targetSlider.imageUrl.split("/slider-images/")[1]
          if (oldPath) {
            await supabase.storage.from("slider-images").remove([oldPath])
          }
        } catch (e) {
          console.log("旧画像削除スキップ")
        }
      }

      // 🔥 DB更新
      const { error } = await supabase
        .from("slider_images")
        .update({
          newsId: selectedNewsId,
          isActive: isActive,
          imageUrl: imageUrl,
        })
        .eq("id", targetSlider.id)

      if (error) {
        alert("DB更新失敗")
        return
      }

      alert("保存しました")
      setShowEditModal(false)
      setUploadFile(null)
      load()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "20px 30px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Slider管理
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "40px",
          justifyItems: "center",
        }}
      >
        {sliders.map((s) => (
          <div key={s.id} style={{ textAlign: "center" }}>
            <img
              src={s.imageUrl}
              style={{
                width: "280px",
                height: "160px",
                objectFit: "cover",
                borderRadius: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            />

            <div style={{ marginTop: "8px", fontWeight: "bold" }}>
              {s.order} 番目
            </div>

            <div style={{ marginTop: "10px" }}>
              <button onClick={() => openEditModal(s)}>編集</button>
            </div>
          </div>
        ))}
      </div>

      {/* モーダル */}
      {showEditModal && targetSlider && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h2>スライダー編集</h2>

            {/* 画像 */}
            <div style={{ marginBottom: "20px" }}>
              <label>画像差し替え</label>

              <div style={{ display: "flex", gap: "10px" }}>
                <img src={targetSlider.imageUrl} style={imgStyle} />

                {uploadFile ? (
                  <img
                    src={URL.createObjectURL(uploadFile)}
                    style={imgStyle}
                  />
                ) : (
                  <div
                    style={{
                      ...imgStyle,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f5f5f5",
                      color: "#999",
                      fontSize: "12px",
                      border: "1px dashed #ccc",
                    }}
                  >
                    未選択
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setUploadFile(file)
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: "bold" }}>
                遷移先ニュース
              </label>

              <p style={{ fontSize: "12px", color: "#333" }}>
                現在：
                {selectedNewsId
                  ? newsList.find((n) => n.id === selectedNewsId)?.title
                  : "リンクなし"}
              </p>

              <select
                value={selectedNewsId || ""}
                onChange={(e) =>
                  setSelectedNewsId(Number(e.target.value) || null)
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "6px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">選択しない（リンクなし）</option>

                {newsList.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>

              <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                ※選択するとニュース詳細に遷移します
              </p>
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                リンク有効
              </label>
            </div>

            {/* ボタン */}
            <div>
              <button onClick={() => setShowEditModal(false)}>
                キャンセル
              </button>
              <button disabled={loading} onClick={handleSave}>
                {loading ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const overlayStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}

const modalStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "8px",
  width: "400px",
}

const imgStyle = {
  width: "100%",
  height: "100px",
  objectFit: "cover" as const,
}