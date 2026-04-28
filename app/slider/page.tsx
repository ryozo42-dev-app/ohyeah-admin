"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

type SliderImage = {
  id: number
  imageUrl: string
  order: number
}

export default function Page() {
  const [sliders, setSliders] = useState<SliderImage[]>([])
  const [targetSlider, setTargetSlider] = useState<SliderImage | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from("slider_images")
      .select("*")
      .order("order", { ascending: true })

    if (data) setSliders(data as SliderImage[])
  }

  const handleImageUpdate = async () => {
    if (!selectedFile || !targetSlider) {
      alert("画像を選択してください")
      return
    }

    setUploading(true)

    try {

      // 画像アップロード
      const fileName = `${Date.now()}_${selectedFile.name}`

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("images")
          .upload(fileName, selectedFile, {
            upsert: true
          })

      console.log("UPLOAD DATA:", uploadData)
      console.log("UPLOAD ERROR:", uploadError)

      if (uploadError) {
        alert("アップロード失敗")
        setUploading(false)
        return
      }

      // 公開URL取得
      const { data: publicData } =
        supabase.storage
          .from("images")
          .getPublicUrl(fileName)

      const imageUrl = publicData.publicUrl

      console.log("NEW URL:", imageUrl)

      // DB更新
      const { data: updateData, error: updateError } =
        await supabase
          .from("slider_images")
          .update({
            imageUrl: imageUrl
          })
          .eq("id", targetSlider.id)
          .select()

      console.log("UPDATE DATA:", updateData)
      console.log("UPDATE ERROR:", updateError)

      if (updateError) {
        alert("DB更新失敗")
        setUploading(false)
        return
      }

      // 再取得
      await load()

      setShowImageModal(false)
      setPreviewImage(null)
      setSelectedFile(null)

    } catch (e) {

      console.error(e)
      alert("更新失敗")

    } finally {

      setUploading(false)

    }
  }

  return (
    <div style={{ padding: "20px 30px" }}>

  <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
    Slider管理
  </h1>

  {/* グリッド */}
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "40px",
    justifyItems: "center"
  }}>

    {sliders.map(s => (
      <div key={s.id} style={{ textAlign: "center" }}>

        <img
          src={s.imageUrl}
          style={{
            width: "280px",
            height: "160px",
            objectFit: "cover",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
          }}
        />

        <div style={{ marginTop: "10px" }}>
          <button
            style={{
              background: "#7a5a3a",
              color: "#fff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer"
            }}
            onClick={() => {
              setTargetSlider(s)
              setShowImageModal(true)
            }}
          >
            画像変更
          </button>
        </div>

      </div>
    ))}

  </div>

  {/* 画像変更モーダル */}
  {showImageModal && targetSlider && (
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
        textAlign: "center"
      }}>

        <h3>画像変更</h3>

        <div style={{ display: "flex", gap: "20px" }}>

          {/* 現在 */}
          <div>
            <p>現在</p>
            <img src={targetSlider.imageUrl} style={{ width: "150px" }} />
          </div>

          {/* 変更後 */}
          <div>
            <p>変更後</p>
            {previewImage ? (
              <img src={previewImage} style={{ width: "150px" }} />
            ) : (
              <div style={{
                width: "150px",
                height: "150px",
                background: "#eee"
              }}>
                未選択
              </div>
            )}
          </div>

        </div>

        <input
          type="file"
          style={{ marginTop: "10px" }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return

            setSelectedFile(file)
            setPreviewImage(URL.createObjectURL(file))
          }}
        />

        {uploading && <p>アップロード中...</p>}

        <div style={{ marginTop: "10px" }}>
          <button onClick={() => {
            setShowImageModal(false)
            setPreviewImage(null)
            setSelectedFile(null)
          }}>
            キャンセル
          </button>

          <button onClick={async () => {
            await handleImageUpdate()
            setShowImageModal(false)
            setPreviewImage(null)
            setSelectedFile(null)
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