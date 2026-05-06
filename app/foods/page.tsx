"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { uploadImage } from "@/lib/uploadImage" // uploadImageユーティリティは引き続き使用

type Food = {
  id: string
  name: string
  name_en: string
  foodcategory: string
  description: string | null
  price: number
  image_url: string | null
  isactive: boolean
}

export default function Foods() {
  const [foods, setFoods] = useState<Food[]>([])
  const [userData, setUserData] = useState<any>(null)
  const isAdmin = userData?.role === "admin"
  const [selected, setSelected] = useState<string[]>([])
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
  const [showImageModal, setShowImageModal] = useState(false)
  const [targetFood, setTargetFood] = useState<any>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newFood, setNewFood] = useState({
    name: "",
    name_en: "",
    foodcategory: "MAIN",
    description: "",
    price: "",
    image_url: "",
    isactive: true
  })

  const perPage = 6

  const fetchFoods = async () => {
    let query = supabase.from("menu_foods").select("*");

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
      // 指定された特定のカテゴリー順序
      const priorityOrder = ["PIZZA", "FRIDE", "OHTER"];

      const sortedData = [...data].sort((a, b) => {
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

        // ② 名前（name）のソート
        const nameComp = a.name.localeCompare(b.name);
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

  const toggle = (id: string) => {
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
    try {
      const newImageUrl = await uploadImage(
        selectedFile,
        "food"
      )

      const { error: updateError } = await supabase
        .from("menu_foods")
        .update({ image_url: newImageUrl })
        .eq("id", targetFood.id)

      if (updateError) {
        alert("更新失敗")
        return
      }
      fetchFoods()
      setTargetFood({ ...targetFood, image_url: newImageUrl })
      setShowImageModal(false)
      setSelectedFile(null)
      setPreviewImage(null)
    } catch (error: any) {
      alert(error.message || String(error));
    } finally {
      setUploading(false)
    }
  }

  const saveEdit = async () => {
    if (!editFood) return

    setUploading(true)
    try {
      let imageUrl = editFood.image_url;

      if (selectedFile) {
        imageUrl = await uploadImage(
          selectedFile,
          "food"
        )
      }

      const { error } = await supabase
        .from("menu_foods")
        .update({
          name: editFood.name,
          name_en: editFood.name_en,
          foodcategory: editFood.foodcategory,
          description: editFood.description,
          image_url: imageUrl,
          price: Number(editFood.price),
          isactive: editFood.isactive
        })
        .eq("id", editFood.id)

      if (error) {
        console.error("UPDATE ERROR:", error)
        return
      }

      fetchFoods()
      setShowEdit(false)
      setSelectedFile(null)
      setPreviewImage(null)
    } catch (error: any) {
      alert(error.message || String(error));
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    console.log("🔥 DELETE:", id)

    const { error } = await supabase
      .from("menu_foods")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("DELETE ERROR:", error)
      return
    }

    fetchFoods()
  }

  const addFood = async () => {
    if (!newFood.name.trim()) {
      alert("名前を入力してください")
      return
    }

    if (!selectedFile) {
      alert("画像を選択してください")
      return
    }

    setUploading(true)
    try {
      const imageUrl = await uploadImage(
        selectedFile,
        "food"
      )

      const { data, error } = await supabase
        .from("menu_foods")
        .insert([
          {
            name: newFood.name,
            name_en: newFood.name_en || "",
            foodcategory: newFood.foodcategory || "MAIN",
            description: newFood.description || "",
            price: Number(newFood.price || 0),
            image_url: imageUrl, // アップロードされたURLを使用
            isactive: newFood.isactive
          }
        ])
        .select()

      if (error) {
        alert(error.message)
        return
      }

      await fetchFoods()

      setNewFood({
        name: "",
        name_en: "",
        foodcategory: "MAIN",
        description: "",
        price: "",
        image_url: "",
        isactive: true
      })

      setSelectedFile(null)
      setPreviewImage(null)
      setShowAdd(false)

      alert("登録完了")
    } catch (e) {
      console.error(e)
      alert("登録失敗")
    } finally {
      setUploading(false)
    }
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return

    const { error } = await supabase
      .from("food_categories")
      .insert([{ name: newCategoryName.trim() }])

    if (error) {
      alert("カテゴリーの追加に失敗しました")
      return
    }

    const updated = [...categories, newCategoryName.trim()].sort()
    setCategories(updated)

    if (editFood) setEditFood({ ...editFood, foodcategory: newCategoryName.trim() })
    if (showAdd) setNewFood({ ...newFood, foodcategory: newCategoryName.trim() })

    setNewCategoryName("")
    setShowAddCategory(false)
  }

  const bulkDelete = async () => {

    if (selected.length === 0) {
      alert("選択されていません")
      return
    }

    if (!confirm(`${selected.length}件削除しますか？`)) return

    console.log("🔥 BULK DELETE:", selected)

    const { error } = await supabase
      .from("menu_foods")
      .delete()
      .in("id", selected)

    if (error) {
      console.error("DELETE ERROR:", error)
      return
    }

    fetchFoods()
    setSelected([])
  }

  const bulkUpdatePrice = async () => {
    if (selected.length === 0) return

    const price = Number(newPrice)
    if (!newPrice || isNaN(price)) return

    const { error } = await supabase
      .from("menu_foods")
      .update({ price })
      .in("id", selected)

    if (error) {
      console.error("UPDATE ERROR:", error)
      return
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
      .from("menu_foods")
      .update({ foodcategory: bulkCategory })
      .in("id", selected)

    if (bulkUpdateError) {
      console.error("UPDATE ERROR:", bulkUpdateError)
      return
    }

    fetchFoods()

    setSelected([])
    setShowCategoryModal(false)
    setBulkCategory("")
  }

  const exportCSV = () => {
    const header = ["名前", "英語名", "カテゴリー", "説明", "価格"]

    const rows = foods.map(f => [
      f.name,
      f.name_en,
      f.foodcategory,
      f.description || "",
      f.price
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
          {view.map(food => (
            <tr
              key={food.id}
              style={{ opacity: food.isactive ? 1 : 0.4 }}
            >
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "0" }}>
                <input
                  type="checkbox"
                  checked={selected.includes(food.id)}
                  onChange={() => toggle(food.id)}
                  style={{ transform: "scale(0.8)" }}
                />
              </td>

              <td style={{ border: "1px solid #ddd", textAlign: "center", width: "60px" }}>
                {food.image_url && (
                  <img
                    src={food.image_url}
                    style={{
                      width: "40px",
                      height: "40px",
                      objectFit: "cover",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      setTargetFood(food)
                      setShowImageModal(true)
                    }}
                  />
                )}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px", whiteSpace: "nowrap" }}>
                {food.name}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {food.name_en}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px", textAlign: "center" }}>
                {food.foodcategory}
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
                {food.description || "-"}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px", textAlign: "right" }}>
                ¥{food.price}
              </td>

              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px 4px" }}>
                <input
                  type="checkbox"
                  checked={food.isactive}
                  onChange={async (e) => {
                    const checked = e.target.checked

                    // DB更新
                    const { error } = await supabase
                      .from("menu_foods")
                      .update({ isactive: checked })
                      .eq("id", food.id)

                    if (error) {
                      alert("更新失敗")
                      return
                    }

                    // UI更新（即反映）
                    setFoods(foods.map(x =>
                      x.id === food.id ? { ...x, isactive: checked } : x
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
                    setEditFood(food)
                    setShowEdit(true)
                    setPreviewImage(null)
                    setSelectedFile(null)
                  }}
                >
                  編集
                </button>

                <button
                  style={{ fontSize: "11px", padding: "1px 6px", color: "red" }}
                  onClick={() => {
                    if (!confirm("このフードを削除しますか？")) return
                    handleDelete(food.id)
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
                {f.image_url && (
                  <img
                    src={f.image_url}
                    alt={f.name}
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
                {f.name}
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
            width: "400px"
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
              フード編集
            </h2>

            <input
              value={editFood.name}
              onChange={(e)=>setEditFood({...editFood, name:e.target.value})}
              placeholder="名前"
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <input
              value={editFood.name_en}
              onChange={(e)=>setEditFood({...editFood, name_en:e.target.value})}
              placeholder="英語名"
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <select
              value={editFood.foodcategory}
              onChange={(e) => {
                if (e.target.value === "__add__") {
                  setShowAddCategory(true)
                  return
                }

                setEditFood({
                  ...editFood,
                  foodcategory: e.target.value
                })
              }}
            >
              <option value="">カテゴリーを選択</option>
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
                  onClick={addCategory}
                >
                  追加
                </button>
              </div>
            )}

            <input
              value={editFood.description || ""}
              onChange={(e)=>setEditFood({...editFood, description:e.target.value})}
              placeholder="説明"
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <input
              type="number"
              value={editFood.price === 0 ? "" : editFood.price}
              onChange={(e)=>setEditFood({
                ...editFood,
                price: e.target.value === "" ? 0 : Number(e.target.value)
              })}
              placeholder="価格"
              style={{ width:"100%", marginBottom:"10px" }}
            />

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>画像</label>
              {(previewImage || editFood?.image_url) && (
                <img
                  src={previewImage || editFood.image_url || ""}
                  alt="preview"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    marginTop: "8px"
                  }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  console.log("📸 FILE SELECTED:", file)
                  if (!file) return

                  setSelectedFile(file)
                  setPreviewImage(URL.createObjectURL(file))
                }}
                style={{ display: "block", fontSize: "11px", width: "200px", marginTop: "4px" }}
              />
              {editFood.image_url && (
                <button
                  style={{ fontSize: "10px", marginTop: "4px", display: "block" }}
                  onClick={() => setEditFood({ ...editFood, image_url: null })}
                >
                  画像を削除
                </button>
              )}
              {uploading && <span style={{ fontSize: "10px", color: "#666", marginLeft: "8px" }}>アップロード中...</span>}
            </div>

            <label>
              <input
                type="checkbox"
                checked={editFood.isactive}
                onChange={(e)=>setEditFood({
                  ...editFood,
                  isactive: e.target.checked
                })}
              />
              表示する
            </label>

            <div style={{
              marginTop:"15px",
              display:"flex",
              justifyContent:"space-between"
            }}>
              <button disabled={uploading} onClick={()=>setShowEdit(false)}>キャンセル</button>
              <button disabled={uploading} onClick={saveEdit}>{uploading ? "保存中..." : "保存"}</button>
            </div>

          </div>
        </div>
      )}

      {/* 新規追加モーダル */}
      {showAdd && (
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
            width: "400px"
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
              フード追加
            </h2>

            <input
              placeholder="名前"
              value={newFood.name}
              onChange={(e)=>setNewFood({...newFood, name:e.target.value})}
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <input
              placeholder="英語名"
              value={newFood.name_en}
              onChange={(e)=>setNewFood({...newFood, name_en:e.target.value})}
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <select
              value={newFood.foodcategory}
              onChange={(e) => {
                if (e.target.value === "__add__") {
                  setShowAddCategory(true)
                  return
                }
                setNewFood({ ...newFood, foodcategory: e.target.value })
              }}
              style={{ width: "100%", marginBottom: "6px" }}
            >
              <option value="">カテゴリーを選択</option>
              <option value="__add__">＋ カテゴリー追加</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {showAddCategory && (
              <div style={{
                marginTop: "10px",
                padding: "10px",
                background: "#f9f9f9",
                borderRadius: "4px",
                border: "1px solid #ddd"
              }}>
                <input
                  placeholder="新しいカテゴリー名"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ width: "100%", marginBottom: "6px" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button style={{ fontSize: "11px" }} onClick={() => setShowAddCategory(false)}>キャンセル</button>
                  <button style={{ fontSize: "11px" }} onClick={addCategory}>追加</button>
                </div>
              </div>
            )}

            <input
              placeholder="説明"
              value={newFood.description}
              onChange={(e)=>setNewFood({...newFood, description:e.target.value})}
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <input
              type="number"
              placeholder="価格"
              value={newFood.price}
              onChange={(e)=>setNewFood({...newFood, price:e.target.value})}
              style={{ width:"100%", marginBottom:"10px" }}
            />

            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", fontSize: "11px", marginBottom: "4px" }}>画像</label>
              {(previewImage || newFood?.image_url) && (
                <img
                  src={previewImage || newFood.image_url || ""}
                  alt="preview"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    marginTop: "8px"
                  }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ display: "block", fontSize: "11px", width: "200px", marginTop: "4px" }}
              />
              {newFood.image_url && (
                <button
                  style={{ fontSize: "10px", marginTop: "4px", display: "block" }}
                  onClick={() => setNewFood({ ...newFood, image_url: "" })}
                >
                  画像を削除
                </button>
              )}
              {uploading && <span style={{ fontSize: "10px", color: "#666", marginLeft: "8px" }}>アップロード中...</span>}
            </div>

            <label>
              <input
                type="checkbox"
                checked={newFood.isactive}
                onChange={(e)=>setNewFood({...newFood, isactive:e.target.checked})}
              />
              表示する
            </label>

            <div style={{
              marginTop:"15px",
              display:"flex",
              justifyContent:"space-between"
            }}>
              <button disabled={uploading} onClick={()=>setShowAdd(false)}>キャンセル</button>
              <button
                disabled={uploading}
                onClick={() => {
                  console.log("🔥 BUTTON CLICK")
                  addFood()
                }}
              >
                {uploading ? "登録中..." : "登録"}
              </button>
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
                    const name = newCategoryName.trim().toUpperCase()
                    if (!name) return

                    const { error } = await supabase
                      .from("food_categories")
                      .insert([{ name }])

                    if (error) {
                      alert("追加失敗（重複など）")
                      return
                    }

                    // categories更新
                    setCategories([...categories, name].sort())

                    // 選択状態にする
                    setBulkCategory(name)

                    setNewCategoryName("")
                    setShowAddCategory(false)
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
                  src={targetFood.image_url}
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
