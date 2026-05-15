"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { uploadImage } from "@/lib/uploadImage" // uploadImageユーティリティは引き続き使用
import { deleteImage } from "@/lib/deleteImage"

type Food = {
  id: number

  name_ja: string
  name_en?: string
  name_zh?: string
  name_ko?: string

  description?: string

  category?: string
  foodcategory?: string

  price?: number

  imageurl?: string

  isactive: boolean

  displayorder?: number

  createdat?: Date | null
}

export default function Foods() {
  const [foods, setFoods] = useState<Food[]>([])
  const [userData, setUserData] = useState<any>(null)
  const isAdmin = userData?.role === "admin"
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const [showEdit, setShowEdit] = useState(false)
  const [editFood, setEditFood] = useState<Food | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null);
  const [selectedFilterPrice, setSelectedFilterPrice] = useState<string | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [bulkCategory, setBulkCategory] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showEditAddCategory, setShowEditAddCategory] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [targetFood, setTargetFood] = useState<any>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newFood, setNewFood] = useState({
    name_ja: "",
    name_en: "",
    name_zh: "",
    name_ko: "",
    foodcategory: "MAIN",
    description: "",
    price: "",
    imageurl: "",
    isactive: true
  })

  const perPage = 6

  const fetchFoods = async () => {
    let query = supabase.from("world_foods").select("*");

    // カテゴリーフィルターを適用
    if (selectedFilterCategory) {
      query = query.eq("foodcategory", selectedFilterCategory);
    }

    // 価格帯フィルターを適用
    if (selectedFilterPrice) {
      const [minStr, maxStr] = selectedFilterPrice.split('-');
      const minPrice = parseInt(minStr);
      if (!isNaN(minPrice)) query = query.gte("price", minPrice);
      if (maxStr && maxStr !== '+') {
        const maxPrice = parseInt(maxStr);
        if (!isNaN(maxPrice)) query = query.lte("price", maxPrice);
      }
    }

    const { data, error } = await query; // フィルター適用後のクエリを実行

    if (error) {
      console.error("FETCH ERROR:", error)
      return
    }

    if (data) {
      const list: Food[] = (data || []).map((d: any) => ({
        id: d.id,
        name_ja: d.name_ja || "",
        name_en: d.name_en || "",
        name_zh: d.name_zh || "",
        name_ko: d.name_ko || "",
        description: d.description || "",
        category: d.category || "",
        foodcategory: d.foodcategory || "",
        price: d.price || 0,
        imageurl: d.imageurl || "",
        isactive: d.isactive ?? true,
        displayorder: d.displayorder || 0,
        createdat: d.createdat ? new Date(d.createdat) : null,
      }))

      // 指定された特定のカテゴリー順序
      const priorityOrder = ["PIZZA", "FRIDE", "OHTER"];

      const sortedData = [...list].sort((a, b) => {
        // ① カテゴリー（foodcategory）のソート
        const idxA = priorityOrder.indexOf(a.foodcategory);
        const idxB = priorityOrder.indexOf(b.foodcategory);

        let catComp = 0;
        if (idxA !== -1 && idxB !== -1) {
          catComp = idxA - idxB;
        } else if (idxA !== -1) {
          catComp = -1;
        } else if (idxB !== -1) {
          catComp = 1;
        } else {
          catComp = a.foodcategory.localeCompare(b.foodcategory);
        }

        if (catComp !== 0) return catComp;

        // ② 名前（name_ja）のソート
        const nameComp = a.name_ja.localeCompare(b.name_ja);
        if (nameComp !== 0) return nameComp;

        // ③ 価格（price）のソート
        return a.price - b.price;
      });

      setFoods(sortedData);
    } else {
      setFoods([]);
    }
  }

  useEffect(() => {
    fetchFoods()
    loadUser()
  }, [selectedFilterCategory, selectedFilterPrice]); // フィルター状態が変更されたら再フェッチ

  // 📸 メモリリーク防止: previewImageが変わるたびに古いObjectURLを解放
  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage)
    }
  }, [previewImage])

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
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from("food_categories")
        .select("name")
        .order("name")

      console.log(data, error)

      if (data) {
        setCategories(data.map(c => c.name))
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    console.log(categories)
  }, [categories])

  const start = (page - 1) * perPage
  const view = foods.slice(start, start + perPage)
  const totalPage = Math.ceil(foods.length / perPage)

  const toggle = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id))
    } else {
      setSelected([...selected, id])
    }
  }

  const toggleAll = () => {
    const viewIds = view.map(v => v.id)
    const isAllSelected = viewIds.length > 0 && viewIds.every(id => selected.includes(id))

    if (isAllSelected) {
      setSelected(selected.filter(id => !viewIds.includes(id)))
    } else {
      setSelected(Array.from(new Set([...selected, ...viewIds])))
    }
  }

  // 共通の画像選択処理（メモリ管理含む）
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 古いプレビューURLがあれば解放
    if (previewImage) URL.revokeObjectURL(previewImage)

    setSelectedFile(file)
    setPreviewImage(URL.createObjectURL(file))
  }

  const handleImageUpdate = async () => {
    if (!targetFood || !selectedFile) {
      alert("画像を選択してください")
      return
    }
    setUploading(true)
    setIsSaving(true)
    try {
      const oldImageUrl = targetFood.imageurl
      const newImageUrl = await uploadImage(
        selectedFile,
        "food-images"
      )

      const { error: updateError } = await supabase
        .from("world_foods")
        .update({ imageurl: newImageUrl })
        .eq("id", targetFood.id)

      if (updateError) {
        alert("更新失敗")
        return
      }

      if (oldImageUrl) {
        await deleteImage(oldImageUrl)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            user_name: userData?.name,
            action: "FOOD_UPDATE",
            target: `画像変更: ${targetFood.name_ja}`
          })
      }

      fetchFoods()
      setTargetFood({ ...targetFood, imageurl: newImageUrl })
      setShowImageModal(false)
      setSelectedFile(null)
      setPreviewImage(null)
    } catch (error: any) {
      alert(error.message || String(error));
    } finally {
      setUploading(false)
      setIsSaving(false)
    }
  }

  const saveEdit = async () => {
    if (!editFood) return

    setUploading(true)
    setIsSaving(true)
    try {
      let imageUrl = editFood.imageurl;
      const oldImageUrl = editFood.imageurl;

      if (selectedFile) {
        imageUrl = await uploadImage(
          selectedFile,
          "food-images"
        )
      }

      const { error } = await supabase
        .from("world_foods")
        .update({
          name_ja: editFood.name_ja,
          name_en: editFood.name_en,
          name_zh: editFood.name_zh,
          name_ko: editFood.name_ko,
          foodcategory: editFood.foodcategory,
          description: editFood.description,
          imageurl: imageUrl,
          price: Number(editFood.price),
          isactive: editFood.isactive
        })
        .eq("id", editFood.id)

      if (error) {
        console.error("UPDATE ERROR:", error)
        alert(`保存に失敗しました: ${error.message}`)
        return
      }

      if (selectedFile && oldImageUrl) {
        await deleteImage(oldImageUrl)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            user_name: userData?.name,
            action: "FOOD_UPDATE",
            target: editFood.name_ja
          })
      }

      fetchFoods()
      setIsSaved(true)
      setTimeout(() => {
        setIsSaved(false)
        setIsSaving(false)
        setShowEdit(false)
      }, 1000)

      setSelectedFile(null)
      setPreviewImage(null)
    } catch (error: any) {
      alert(error.message || String(error));
      setIsSaving(false)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    console.log("🔥 DELETE:", id)

    const target = foods.find(f => f.id === id)

    const { error } = await supabase
      .from("world_foods")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("DELETE ERROR:", error)
      return
    }

    if (target?.imageurl) {
      await deleteImage(target.imageurl)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          user_name: userData?.name,
          action: "FOOD_DELETE",
          target: target?.name_ja || id
        })
    }

    fetchFoods()
  }

  const addFood = async () => {
    if (!newFood.name_ja.trim()) {
      alert("名前を入力してください")
      return
    }

    if (!selectedFile) {
      alert("画像を選択してください")
      return
    }

    setUploading(true)
    setIsSaving(true)
    try {
      const imageUrl = await uploadImage(
        selectedFile,
        "food-images"
      )

      const { data, error } = await supabase
        .from("world_foods")
        .insert([
          {
            name_ja: newFood.name_ja,
            name_en: newFood.name_en || "",
            name_zh: newFood.name_zh || "",
            name_ko: newFood.name_ko || "",
            foodcategory: newFood.foodcategory || "MAIN",
            description: newFood.description || "",
            price: Number(newFood.price || 0),
            imageurl: imageUrl, // アップロードされたURLを使用
            isactive: newFood.isactive
          }
        ])
        .select()

      if (error) {
        alert(error.message)
        setIsSaving(false)
        setUploading(false)
        return
      }

      await fetchFoods()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("activity_logs")
          .insert({
            user_id: user.id,
            user_name: userData?.name,
            action: "FOOD_CREATE",
            target: newFood.name_ja
          })
      }

      setNewFood({
        name_ja: "",
        name_en: "",
        name_zh: "",
        name_ko: "",
        foodcategory: "MAIN",
        description: "",
        price: "",
        imageurl: "",
        isactive: true
      })

      setSelectedFile(null)
      setPreviewImage(null)
      setIsSaved(true)

      setTimeout(() => {
        setIsSaved(false)
        setIsSaving(false)
        setShowAdd(false)
      }, 1000)

    } catch (e) {
      console.error(e)
      alert("登録失敗")
    } finally {
      setUploading(false)
      setIsSaving(false)
    }
  }

  const handleTranslate = async () => {
    if (!editFood) return
    setIsTranslating(true)

    try {
      const res = await fetch(
        "https://ikezocnvlrhluxhxwfug.supabase.co/functions/v1/translate-news",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editFood.name_ja,
            body: editFood.description || "",
          }),
        }
      )

      const data = await res.json()

      setEditFood({
        ...editFood,
        name_en: data.title_en,
        name_zh: data.title_zh,
        name_ko: data.title_ko,
      })
    } catch (err) {
      console.error(err)
      alert("翻訳失敗")
    } finally {
      setIsTranslating(false)
    }
  }

  const handleAddCategory = async (categoryName: string) => {
    if (!categoryName.trim()) {
      alert("カテゴリー名を入力してください")
      return null
    }
    const name = categoryName.trim().toUpperCase()
    const { error } = await supabase
      .from("food_categories")
      .insert([{ name }])
    if (error) {
      alert("カテゴリーの追加に失敗しました: " + error.message)
      return null
    }
    const updated = [...categories, name].sort()
    setCategories(updated)
    setNewCategoryName("")
    return name
  }

  const bulkDelete = async () => {

    if (selected.length === 0) {
      alert("選択されていません")
      return
    }

    if (!confirm(`${selected.length}件削除しますか？`)) return

    console.log("🔥 BULK DELETE:", selected)

    const { error } = await supabase
      .from("world_foods")
      .delete()
      .in("id", selected)

    if (error) {
      console.error("DELETE ERROR:", error)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          user_name: userData?.name,
          action: "FOOD_DELETE",
          target: `一括削除: ${selected.length}件`
        })
    }

    fetchFoods()
    setSelected([])
  }

  const bulkUpdatePrice = async () => {
    if (selected.length === 0) return

    const price = Number(newPrice)
    if (!newPrice || isNaN(price)) return

    const { error } = await supabase
      .from("world_foods")
      .update({ price })
      .in("id", selected)

    if (error) {
      console.error("UPDATE ERROR:", error)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          user_name: userData?.name,
          action: "FOOD_UPDATE",
          target: `一括価格変更: ${selected.length}件 -> ¥${price}`
        })
    }

    fetchFoods()

    setSelected([])
    setShowPriceModal(false)
    setNewPrice("")
  }

  const bulkUpdateCategory = async () => {
    if (selected.length === 0) {
      alert("選択されていません")
      return
    }

    if (!bulkCategory) {
      alert("カテゴリーを選択してください")
      return
    }

    const { error: bulkUpdateError } = await supabase
      .from("world_foods")
      .update({ foodcategory: bulkCategory })
      .in("id", selected)

    if (bulkUpdateError) {
      console.error("UPDATE ERROR:", bulkUpdateError)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          user_name: userData?.name,
          action: "FOOD_UPDATE",
          target: `一括カテゴリー変更: ${selected.length}件 -> ${bulkCategory}`
        })
    }

    fetchFoods()

    setSelected([])
    setShowCategoryModal(false)
    setBulkCategory("")
  }

  const exportCSV = () => {
    const header = ["id", "name_ja", "name_en", "name_zh", "name_ko", "foodcategory", "description", "price", "imageurl", "isactive", "displayorder"]

    const rows = foods.map(f => [
      f.id,
      f.name_ja,
      f.name_en || "",
      f.name_zh || "",
      f.name_ko || "",
      f.foodcategory || "",
      f.description || "",
      f.price,
      f.imageurl || "",
      f.isactive,
      f.displayorder || 0
    ])

    const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "foods.csv"
    link.click()
  }

  return (
    <div className="page" style={{ padding: "20px 30px" }}>
      <style>{`
        /* 価格欄の上下ボタン（スピンボタン）を非表示にする */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      <h1 style={{ textAlign: "center", margin: "0 0 10px", fontSize: "35px" }}>
        Food管理
      </h1>

      {/* フィルターUI */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
        {/* カテゴリーフィルター */}
        <div>
          <label htmlFor="foodCategoryFilter" style={{ marginRight: "5px" }}>カテゴリー:</label>
          <select
            id="foodCategoryFilter"
            value={selectedFilterCategory || ""}
            onChange={(e) => setSelectedFilterCategory(e.target.value || null)}
            style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value="">全て</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* 価格帯フィルター */}
        <div>
          <label htmlFor="foodPriceFilter" style={{ marginRight: "5px" }}>価格帯:</label>
          <select
            id="foodPriceFilter"
            value={selectedFilterPrice || ""}
            onChange={(e) => setSelectedFilterPrice(e.target.value || null)}
            style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value="">全て</option>
            <option value="0-500">¥0 - ¥500</option>
            <option value="501-1000">¥501 - ¥1,000</option>
            <option value="1001-2000">¥1,001 - ¥2,000</option>
            <option value="2001+">¥2,001 以上</option>
          </select>
        </div>
      </div>

      {/* 画面表示用エリア（ページネーション・ボタン・操作用テーブル） */}
      <div className="no-print">
        <table
        style={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
          background: "#fff",
          fontSize: "12px",
          lineHeight: "1.2"
        }}
      >
        <thead>
          <tr style={{ background: "#ddd" }}>
            <th style={{ width: "3%" }}>
              <input
                type="checkbox"
                onChange={toggleAll}
                checked={view.length > 0 && view.every(v => selected.includes(v.id))}
              />
            </th>
            <th style={{ width: "7%", textAlign: "center" }}>画像</th>
            <th style={{ width: "15%", textAlign: "center" }}>名前</th>
            <th style={{ width: "15%", textAlign: "center" }}>英語名</th>
            <th style={{ width: "10%", textAlign: "center" }}>カテゴリー</th>
            <th style={{ width: "30%", textAlign: "center" }}>説明</th>
            <th style={{ width: "8%", textAlign: "center" }}>価格</th>
            <th style={{ width: "5%", textAlign: "center" }}>表示</th>
            <th style={{ width: "7%", textAlign: "center" }}>操作</th>
          </tr>
        </thead>

        <tbody>
          {view.map(item => (
            <tr
              key={item.id}
              style={{ opacity: item.isactive ? 1 : 0.4 }}
            >
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "0" }}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggle(item.id)}
                  style={{ transform: "scale(0.8)" }}
                />
              </td>

              <td style={{ border: "1px solid #ddd", textAlign: "center", width: "60px" }}>
                <div
                  onClick={() => {
                    setTargetFood(item)
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
                {item.imageurl ? (
                  <img
                    src={item.imageurl}
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

              <td style={{ border: "1px solid #ddd", padding: "2px 4px", whiteSpace: "nowrap" }}>
                {item.name_ja}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {item.name_en}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px", textAlign: "center" }}>
                {item.foodcategory}
              </td>

              {/* 👇 説明は広く＋省略なし */}
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "2px 4px",
                  whiteSpace: "normal",
                  textAlign: "left"
                }}
              >
                {item.description || "-"}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px", textAlign: "right" }}>
                ¥{item.price}
              </td>

              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px 4px" }}>
                <input
                  type="checkbox"
                  checked={item.isactive}
                  onChange={async (e) => {
                    const checked = e.target.checked

                    // DB更新
                    const { error } = await supabase
                      .from("world_foods")
                      .update({ isactive: checked })
                      .eq("id", item.id)

                    if (error) {
                      alert("更新失敗")
                      return
                    }

                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                      await supabase
                        .from("activity_logs")
                        .insert({
                          user_id: user.id,
                          user_name: userData?.name,
                          action: "FOOD_UPDATE",
                          target: `表示設定変更: ${item.name_ja} (${checked ? "表示" : "非表示"})`
                        })
                    }

                    // UI更新（即反映）
                    setFoods(foods.map(x =>
                      x.id === item.id ? { ...x, isactive: checked } : x
                    ))
                  }}
                />
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  whiteSpace: "nowrap",
                  display: "flex", // Flexboxを有効にする
                  justifyContent: "center", // 水平方向の中央揃え
                  alignItems: "center", // 垂直方向の中央揃え
                  height: "54px", // 画像の高さに合わせる
                  padding: "2px 4px"
                }}
              >
                <button
                  style={{ fontSize: "11px", padding: "1px 6px" }}
                  onClick={() => {
                    setEditFood(item)
                    setShowEdit(true)
                    setPreviewImage(null)
                    setSelectedFile(null)
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
                  onClick={() => {
                    if (!confirm("このフードを削除しますか？")) return
                    handleDelete(item.id)
                  }}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>

        <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
        選択中: {selected.length} 件
      </div>

      {/* ページャー */}
      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <button onClick={() => page > 1 && setPage(page - 1)}>◀</button>

        {Array.from({ length: totalPage }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              margin: "0 3px",
              background: page === p ? "#7b5a36" : "#fff",
              color: page === p ? "#fff" : "#000",
              fontSize: "12px"
            }}
          >
            {p}
          </button>
        ))}

        <button onClick={() => page < totalPage && setPage(page + 1)}>▶</button>
      </div>

      {/* ボタン */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "12px",
          flexWrap: "wrap"
        }}
      >
        <button
          style={{ fontSize: "12px" }}
          onClick={() => {
            setShowAdd(true)
            setPreviewImage(null)
            setSelectedFile(null)
          }}
        >
          フード追加
        </button>
        <button
          style={{ fontSize: "12px" }}
          onClick={() => {
            if (selected.length === 0) {
              alert("選択されていません")
              return
            }
            setShowPriceModal(true)
          }}
        >一括価格変更</button>
        <button
          style={{ fontSize: "12px" }}
          onClick={() => {
            if (selected.length === 0) {
              alert("選択されていません")
              return
            }
            setShowCategoryModal(true)
          }}
        >
          一括カテゴリー変更
        </button>

        <button
          onClick={() => {
            if (!isAdmin) return
            bulkDelete()
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

        <button
          onClick={exportCSV}
          style={{ fontSize: "12px", color: "#2e7d32" }}
        >
          CSV出力
        </button>

        <button style={{ fontSize: "12px" }} onClick={() => window.print()}>
          一覧印刷
        </button>
      </div>
      </div>

      {/* 印刷用全件テーブル（通常は非表示、印刷時のみ foods ステートから全件表示） */}
      <table
        id="print-area"
        className="print-only"
        style={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
          background: "#fff",
          fontSize: "12px",
          lineHeight: "1.2"
        }}
      >
        <thead>
          <tr style={{ background: "#ddd" }}>
            <th style={{ width: "3%" }}></th>
            <th style={{ width: "7%", textAlign: "center" }}>画像</th>
            <th style={{ width: "15%", textAlign: "center" }}>名前</th>
            <th style={{ width: "15%", textAlign: "center" }}>英語名</th>
            <th style={{ width: "10%", textAlign: "center" }}>カテゴリー</th>
            <th style={{ width: "30%", textAlign: "center" }}>説明</th>
            <th style={{ width: "8%", textAlign: "center" }}>価格</th>
            <th style={{ width: "5%", textAlign: "center" }}>表示</th>
            <th style={{ width: "7%", textAlign: "center" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {foods.map(f => (
            <tr key={f.id} style={{ opacity: f.isactive ? 1 : 0.4 }}>
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px 4px" }}></td>
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px" }}>
                {f.imageurl && (
                  <img
                    src={f.imageurl}
                    alt={f.name_ja}
                    style={{
                      width: "50px",
                      height: "50px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      display: "block",
                      margin: "0 auto"
                    }}
                  />
                )}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px", whiteSpace: "nowrap" }}>
                {f.name_ja}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {f.name_en}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px", textAlign: "center" }}>
                {f.foodcategory}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "2px 4px",
                  whiteSpace: "normal",
                  textAlign: "left"
                }}
              >
                {f.description || "-"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px", textAlign: "right" }}>
                ¥{f.price}
              </td>
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px 4px" }}>
                {f.isactive ? "○" : "×"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEdit && editFood && (
        <div className="modalOverlay">
          <div
            className="modalContent"
            style={{
              width: "92vw",
              maxWidth: "680px",
              borderRadius: "14px",
              overflow: "hidden",
              padding: 0,
              position: "relative",
            }}
          >
            {/* 翻訳中・保存中のオーバーレイ表示 */}
            {(isTranslating || isSaving || isSaved) && (
              <div style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                animation: "fadeIn 0.3s ease"
              }}>
                <div className="loader" />
                <p style={{
                  marginTop: "16px",
                  color: "#8B5E3C",
                  fontWeight: "bold",
                  fontSize: "14px",
                  letterSpacing: "0.1em"
                }}>
                  {isTranslating ? "翻訳中..." : (isSaved ? "保存済み！" : "保存中...")}
                </p>
                <style>{`
                  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                  .loader {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #8B5E3C;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                  }
                  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
              </div>
            )}

            {/* 上ブラウンバー */}
            <div
              style={{
                height: "14px",
                background: "#8B5E3C",
              }}
            />

            <div
              style={{
                padding: "22px",
              }}
            >

              {/* タイトル */}
              <h2
                style={{
                  textAlign: "center",
                  fontSize: "34px",
                  marginBottom: "22px",
                  fontWeight: "bold",
                }}
              >
                Food編集
              </h2>

              {/* 4言語 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px",
                }}
              >

                {/* 日本語 */}
                <div>
                  <label
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    日本語
                  </label>

                  <input
                    type="text"
                    value={editFood.name_ja}
                    onChange={(e) =>
                      setEditFood({
                        ...editFood,
                        name_ja: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      height: "42px",
                      marginTop: "6px",
                      fontSize: "15px",
                      padding: "0 10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      boxShadow:
                        "0 1px 4px rgba(0,0,0,0.12)",
                    }}
                  />

                  {/* 多言語反映 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "8px",
                    }}
                  >
                    <button
                      onClick={handleTranslate}
                      style={{
                        fontSize: "13px",
                      }}
                    >
                      多言語へ反映
                    </button>
                  </div>
                </div>

                {/* English */}
                <div>
                  <label
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    English
                  </label>

                  <input
                    type="text"
                    value={editFood.name_en || ""}
                    readOnly
                    style={{
                      width: "100%",
                      height: "42px",
                      marginTop: "6px",
                      fontSize: "15px",
                      padding: "0 14px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background: "#f5f5f5",
                    }}
                  />
                </div>

                {/* 中文 */}
                <div>
                  <label
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    中文
                  </label>

                  <input
                    type="text"
                    value={editFood.name_zh || ""}
                    readOnly
                    style={{
                      width: "100%",
                      height: "42px",
                      marginTop: "6px",
                      fontSize: "15px",
                      padding: "0 14px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background: "#f5f5f5",
                    }}
                  />
                </div>

                {/* 한국어 */}
                <div>
                  <label
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    한국어
                  </label>

                  <input
                    type="text"
                    value={editFood.name_ko || ""}
                    readOnly
                    style={{
                      width: "100%",
                      height: "42px",
                      marginTop: "6px",
                      fontSize: "14px",
                      padding: "0 14px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background: "#f5f5f5",
                    }}
                  />
                </div>

              </div>

              {/* 共通項目 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px 1fr 140px",
                  gap: "10px",
                  marginTop: "18px",
                }}
              >

                {/* Category */}
                <div>
                  <label
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    Category
                  </label>

                <select
                    value={editFood.foodcategory || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__add__") {
                        setShowEditAddCategory(true);
                      } else {
                        setEditFood({
                          ...editFood,
                          category: val,
                          foodcategory: val,
                        });
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "40px",
                      marginTop: "6px",
                      padding: "0 10px",
                      fontSize: "14px",
                    }}
                >

                  <option value="">選択してください</option>
                  <option value="__add__">＋ カテゴリー追加</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}

                </select>

                {showEditAddCategory && (
                  <div style={{ marginTop: "10px", padding: "10px", background: "#f9f9f9", borderRadius: "4px", border: "1px solid #ddd" }}>
                    <input
                      placeholder="新しいカテゴリー名"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      style={{ width: "100%", marginBottom: "6px" }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button style={{ fontSize: "11px" }} onClick={() => { setShowEditAddCategory(false); setNewCategoryName(""); }}>キャンセル</button>
                      <button style={{ fontSize: "11px" }} onClick={async () => {
                        const newCat = await handleAddCategory(newCategoryName);
                        if (newCat && editFood) {
                          setEditFood({ ...editFood, category: newCat, foodcategory: newCat });
                        }
                        setShowEditAddCategory(false);
                      }}>追加</button>
                    </div>
                  </div>
                )}
                </div>

                {/* Description */}
                <div>
                  <label
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    Description
                  </label>

                  <input
                    type="text"
                    value={editFood.description || ""}
                    onChange={(e) =>
                      setEditFood({
                        ...editFood,
                        description: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      height: "40px",
                      marginTop: "6px",
                      padding: "0 12px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {/* Price */}
                <div>
                  <label
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    Price
                  </label>

                  <input
                    type="number"
                    value={editFood.price || 0}
                    onChange={(e) =>
                      setEditFood({
                        ...editFood,
                        price: Number(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      height: "40px",
                      marginTop: "6px",
                      padding: "0 10px",
                      fontSize: "14px",
                    }}
                  />
                </div>

              </div>

              {/* 公開 */}
              <div
                style={{
                  marginTop: "18px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editFood.isactive}
                    onChange={(e) =>
                      setEditFood({
                        ...editFood,
                        isactive: e.target.checked,
                      })
                    }
                  />

                  表示する
                </label>
              </div>

              {/* ボタン */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "28px",
                }}
              >
                <button
                  onClick={() => setShowEdit(false)}
                >
                  キャンセル
                </button>

                <button onClick={saveEdit}>
                  保存
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 新規追加モーダル */}
      {showAdd && (
        <div className="modalOverlay">
          <div className="modalContent" style={{
            width: "92vw",
            maxWidth: "680px",
            borderRadius: "14px",
            overflow: "hidden",
            padding: 0,
            position: "relative",
          }}>
            {/* 翻訳中・保存中のオーバーレイ */}
            {(isTranslating || isSaving || isSaved) && (
              <div style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(4px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
              }}>
                <div className="loader" />
                <p style={{ marginTop: "16px", color: "#8B5E3C", fontWeight: "bold" }}>
                  {isTranslating ? "翻訳中..." : (isSaved ? "登録済み！" : "保存中...")}
                </p>
                <style>{`
                  .loader {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #8B5E3C;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                  }
                  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
              </div>
            )}

            <div style={{ height: "14px", background: "#8B5E3C" }} />

            <div style={{ padding: "22px" }}>
              <h2 style={{ textAlign: "center", fontSize: "34px", marginBottom: "22px", fontWeight: "bold" }}>
                Food追加
              </h2>

              {/* 多言語エリア */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 250px)",
                gap: "30px",
                justifyContent: "center",
                maxWidth: "580px",
                margin: "0 auto",
              }}>
                {/* 日本語 */}
                <div>
                  <label style={{ fontSize: "16px", fontWeight: "bold" }}>日本語</label>
                  <input
                    type="text"
                    value={newFood.name_ja}
                    onChange={(e) => setNewFood({ ...newFood, name_ja: e.target.value })}
                    style={{ width: "100%", height: "42px", marginTop: "6px", padding: "0 10px", borderRadius: "8px", border: "1px solid #ccc" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button
                      onClick={async () => {
                        setIsTranslating(true);
                        try {
                          const res = await fetch("https://ikezocnvlrhluxhxwfug.supabase.co/functions/v1/translate-news", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ title: newFood.name_ja, body: newFood.description || "" }),
                          });
                          const data = await res.json();
                          setNewFood({ ...newFood, name_en: data.title_en, name_zh: data.title_zh, name_ko: data.title_ko });
                        } catch (err) {
                          alert("翻訳失敗");
                        } finally {
                          setIsTranslating(false);
                        }
                      }}
                      style={{ fontSize: "12px" }}
                    >
                      多言語へ反映
                    </button>
                  </div>
                </div>

                {/* English */}
                <div>
                  <label style={{ fontSize: "16px", fontWeight: "bold" }}>English</label>
                  <input
                    type="text"
                    value={newFood.name_en || ""}
                    readOnly
                    style={{ width: "100%", height: "42px", marginTop: "6px", padding: "0 10px", borderRadius: "8px", border: "1px solid #ccc", background: "#f5f5f5" }}
                  />
                </div>

                {/* 中文 */}
                <div>
                  <label style={{ fontSize: "16px", fontWeight: "bold" }}>中文</label>
                  <input
                    type="text"
                    value={newFood.name_zh || ""}
                    readOnly
                    style={{ width: "100%", height: "42px", marginTop: "6px", padding: "0 10px", borderRadius: "8px", border: "1px solid #ccc", background: "#f5f5f5" }}
                  />
                </div>

                {/* 韓国語 */}
                <div>
                  <label style={{ fontSize: "16px", fontWeight: "bold" }}>한국어</label>
                  <input
                    type="text"
                    value={newFood.name_ko || ""}
                    readOnly
                    style={{ width: "100%", height: "42px", marginTop: "6px", padding: "0 10px", borderRadius: "8px", border: "1px solid #ccc", background: "#f5f5f5" }}
                  />
                </div>
              </div>

              {/* 共通項目 */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 100px",
                gap: "10px",
                marginTop: "18px",
                maxWidth: "580px",
                margin: "0 auto",
              }}>
                <div>
                  <label style={{ fontSize: "14px" }}>カテゴリー</label>
                  <select
                    value={newFood.foodcategory || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__add__") { setShowAddCategory(true); }
                      else { setNewFood({ ...newFood, foodcategory: val }); }
                    }}
                    style={{ width: "100%", height: "40px", marginTop: "6px", fontSize: "14px" }}
                  >
                    <option value="">選択してください</option>
                    <option value="__add__">＋ カテゴリー追加</option>
                    {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                  {showAddCategory && (
                    <div style={{ marginTop: "10px", padding: "10px", background: "#f9f9f9", border: "1px solid #ddd" }}>
                      <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ width: "100%", marginBottom: "6px" }} />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button onClick={() => setShowAddCategory(false)}>キャンセル</button>
                        <button onClick={async () => {
                          const newCat = await handleAddCategory(newCategoryName);
                          if (newCat) setNewFood({ ...newFood, foodcategory: newCat });
                          setShowAddCategory(false);
                        }}>追加</button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "14px" }}>Description</label>
                  <input type="text" value={newFood.description} onChange={(e) => setNewFood({ ...newFood, description: e.target.value })} style={{ width: "100%", height: "40px", marginTop: "6px" }} />
                </div>

                <div>
                  <label style={{ fontSize: "14px" }}>Price</label>
                  <input type="number" value={newFood.price} onChange={(e) => setNewFood({ ...newFood, price: e.target.value })} style={{ width: "100%", height: "40px", marginTop: "6px" }} />
                </div>
              </div>

              {/* 画像セクション (Foodに必須) */}
              <div style={{ marginTop: "18px", maxWidth: "580px", margin: "18px auto 0" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>画像</label>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  {previewImage ? (
                    <img src={previewImage} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ccc" }} />
                  ) : (
                    <div style={{ width: "80px", height: "80px", background: "#eee", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#999" }}>未選択</div>
                  )}
                  <input type="file" accept="image/*" onChange={onFileChange} style={{ fontSize: "12px" }} />
                </div>
              </div>

              <div style={{ marginTop: "18px", maxWidth: "580px", margin: "18px auto 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={newFood.isactive}
                    onChange={(e) => setNewFood({ ...newFood, isactive: e.target.checked })}
                  />
                  表示する
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", maxWidth: "580px", margin: "28px auto 0" }}>
                <button onClick={() => setShowAdd(false)}>キャンセル</button>
                <button onClick={addFood}>追加</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 一括価格変更モーダル */}
      {showPriceModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            width: "300px"
          }}>
            <div
              style={{
                height: "18px",
                background: "#8B5E3C",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                margin: "-20px -20px 20px -20px",
              }}
            />

            <h2
              style={{
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              一括価格変更
            </h2>

            <div style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
              <span style={{ marginRight: "4px" }}>¥</span>

              <input
                type="number"
                placeholder="価格"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{
              marginTop:"20px",
              display:"flex",
              justifyContent:"space-between"
            }}>
              <button onClick={()=>{
                setShowPriceModal(false)
                setNewPrice("")
              }}>
                キャンセル
              </button>

              <button onClick={bulkUpdatePrice}>
                変更
              </button>
            </div>

          </div>
        </div>
      )}

      {showCategoryModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            width: "300px"
          }}>
            <div
              style={{
                height: "18px",
                background: "#8B5E3C",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                margin: "-20px -20px 20px -20px",
              }}
            />

            <h2
              style={{
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              一括カテゴリー変更
            </h2>

            <select
              value={bulkCategory}
              onChange={(e) => {
                if (e.target.value === "__add__") {
                  setShowAddCategory(true)
                  return
                }
                setBulkCategory(e.target.value)
              }}
              style={{ width:"100%", marginTop:"10px" }}
            >
              <option value="">選択してください</option>
              <option value="__add__">＋ カテゴリー追加</option>

              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {showAddCategory && (
              <div style={{ marginTop: "10px" }}>
                <input
                  placeholder="新カテゴリー"
                  value={newCategoryName}
                  onChange={(e)=>setNewCategoryName(e.target.value)}
                  style={{ width: "70%" }}
                />

                <button
                  onClick={async () => {
                    const newCat = await handleAddCategory(newCategoryName);
                    if (newCat) {
                      setBulkCategory(newCat);
                    }
                    setShowAddCategory(false);
                  }}
                >
                  追加
                </button>
              </div>
            )}

            <div style={{
              marginTop:"20px",
              display:"flex",
              justifyContent:"space-between"
            }}>
              <button onClick={()=>{
                setShowCategoryModal(false)
                setBulkCategory("")
              }}>
                キャンセル
              </button>

              <button onClick={bulkUpdateCategory}>
                変更
              </button>
            </div>

          </div>
        </div>
      )}

      {showImageModal && targetFood && (
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
            <div
              style={{
                height: "18px",
                background: "#8B5E3C",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                margin: "-20px -20px 20px -20px",
              }}
            />

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
              marginTop: "10px"
            }}>

              {/* 現在 */}
              <div>
                <p style={{ fontSize: "12px" }}>現在</p>
                <img
                  src={targetFood.imageurl}
                  style={{ width: "140px", height: "140px", objectFit: "cover" }}
                />
              </div>

              {/* 変更後 */}
              <div>
                <p style={{ fontSize: "12px" }}>変更後</p>
                {previewImage ? (
                  <img
                    src={previewImage}
                    style={{ width: "140px", height: "140px", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{
                    width: "140px",
                    height: "140px",
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px"
                  }}>
                    未選択
                  </div>
                )}
              </div>
            </div>

            {/* ファイル選択 */}
            <input
              type="file"
              accept="image/*"
              style={{ marginTop: "15px" }}
              onChange={onFileChange}
            />

            {uploading && <p>アップロード中...</p>}

            {/* ボタン */}
            <div style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "space-between"
            }}>

              <button
                disabled={uploading}
                onClick={() => {
                  setShowImageModal(false)
                  setPreviewImage(null)
                  setSelectedFile(null)
                }}
              >
                キャンセル
              </button>

              <button
                disabled={uploading}
                onClick={async () => {
                  console.log("🔥 BUTTON CLICK")

                  if (!selectedFile) {
                    console.log("❌ selectedFileなし")
                    alert("画像を選択してください")
                    return
                  }

                  console.log("✅ selectedFileあり", selectedFile)

                  await handleImageUpdate() // 引数なしで呼び出し
                }}
              >
                {uploading ? "変更中..." : "変更"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
