"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Drink = {
  id: number

  name_ja: string
  name_en?: string
  name_zh?: string
  name_ko?: string

  description?: string

  category?: string
  drinkcategory?: string

  price?: number

  imageurl?: string

  isactive: boolean

  displayorder?: number

  createdat?: Date | null
}

export default function Drinks() {
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [userData, setUserData] = useState<any>(null)
  const isAdmin = userData?.role === "admin"
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const [showEdit, setShowEdit] = useState(false)
  const [editDrink, setEditDrink] = useState<Drink | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null);
  const [selectedFilterPrice, setSelectedFilterPrice] = useState<string | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [showAddAddCategory, setShowAddAddCategory] = useState(false) // For add modal's category add
  const [isSaving, setIsSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newDrink, setNewDrink] = useState({
    name_ja: "",
    name_en: "",
    name_zh: "",
    name_ko: "",
    drinkcategory: "BEER",
    description: "",
    price: "",
    isactive: true
  })

  const perPage = 10

  const load = async () => {
    let query = supabase.from("world_drinks").select("*");

    // カテゴリーフィルターを適用
    if (selectedFilterCategory) {
      query = query.eq("drinkcategory", selectedFilterCategory);
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
      console.error("Drinks load error:", error)
      return
    }

    if (data) {
      const list: Drink[] = (data || []).map((d: any) => ({
        id: d.id,

        name_ja: d.name_ja || "",
        name_en: d.name_en || "",
        name_zh: d.name_zh || "",
        name_ko: d.name_ko || "",

        description: d.description || "",

        category: d.category || "",
        drinkcategory: d.drinkcategory || "",

        price: d.price || 0,

        imageurl: d.imageurl || "",

        isactive: d.isactive ?? true,

        displayorder: d.displayorder || 0,

        createdat: d.createdat
          ? new Date(d.createdat)
          : null,
      }))

      const priorityOrder = [
        "BEER",
        "BEER_COCKTAIL",
        "COCKTAIL",
        "BOMB",
        "WINE",
        "AWAMORI",
        "NON_ALCHOL",
        "SOFT_DRINK",
      ]

      const sortedData = [...list].sort((a, b) => {
        // ① カテゴリー（drinkcategory）のソート
        const idxA = priorityOrder.indexOf(a.drinkcategory)
        const idxB = priorityOrder.indexOf(b.drinkcategory)

        let catComp = 0
        if (idxA !== -1 && idxB !== -1) {
          catComp = idxA - idxB
        } else if (idxA !== -1) {
          catComp = -1
        } else if (idxB !== -1) {
          catComp = 1
        } else {
          catComp = a.drinkcategory.localeCompare(b.drinkcategory)
        }

        if (catComp !== 0) return catComp

        // ② 名前（name_ja）のソート
        const nameComp = a.name_ja.localeCompare(b.name_ja);
        if (nameComp !== 0) return nameComp;

        // ③ 価格（price）のソート
        return a.price - b.price;
      });
      setDrinks(sortedData);
    } else {
      setDrinks([]);
    }
  }

  useEffect(() => {
    load()
    loadUser()
  }, [selectedFilterCategory, selectedFilterPrice]); // フィルター状態が変更されたら再フェッチ

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
        .from("drink_categories")
        .select("name")
        .order("name")

      console.log("Drink categories data:", data, "error:", error)

      if (data) {
        setCategories(data.map(c => c.name))
      }
    }

    loadCategories()
  }, [])

  const start = (page - 1) * perPage
  const view = drinks.slice(start, start + perPage)
  const totalPage = Math.ceil(drinks.length / perPage)

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

  const saveEdit = async () => {
    if (!editDrink) return

    setIsSaving(true)

    const { error } = await supabase
      .from("world_drinks")
      .update({
        name_ja: editDrink.name_ja,
        name_en: editDrink.name_en,
        name_zh: editDrink.name_zh,
        name_ko: editDrink.name_ko,
        description: editDrink.description,
        drinkcategory: editDrink.drinkcategory,
        category: editDrink.drinkcategory,
        price: Number(editDrink.price),
        isactive: editDrink.isactive ?? true,
      })
      .eq("id", editDrink.id)

    if (error) {
      console.error("UPDATE ERROR:", error)
      alert(error.message)
      setIsSaving(false)
      return
    }

    load()
    setIsSaving(false)
    setShowEdit(false)
  }

  const handleDelete = async (id: number) => {
    console.log("🔥 DELETE:", id)

    const { error } = await supabase
      .from("world_drinks")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("DELETE ERROR:", error)
      alert(error.message)
      return
    }

    load()
  }

  const addDrink = async () => {
    if (!newDrink.name_ja) {
      alert("名前を入力してください")
      return
    }

    setIsSaving(true)
    const { data, error } = await supabase
      .from("world_drinks")
      .insert([
        {
          name_ja: newDrink.name_ja,
          name_en: newDrink.name_en,
          name_zh: newDrink.name_zh,
          name_ko: newDrink.name_ko,
          drinkcategory: newDrink.drinkcategory,
          description: newDrink.description,
          price: Number(newDrink.price || 0),
          isactive: newDrink.isactive
        }
      ])
      .select()

    if (error) {
      console.error("INSERT ERROR:", error)
      setIsSaving(false)
      return
    }

    load()
    setIsSaving(false)

    // 初期化
    setNewDrink({
      name_ja: "",
      name_en: "",
      name_zh: "",
      name_ko: "",
      drinkcategory: "BEER",
      description: "",
      price: "",
      isactive: true
    })

    setShowAdd(false)
  }

  const handleTranslate = async () => {
    if (!editDrink) return
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
            title: editDrink.name_ja,
            body: editDrink.description || "",
          }),
        }
      )

      const data = await res.json()

      setEditDrink(prev => ({
        ...prev!,
        name_en: data.title_en,
        name_zh: data.title_zh,
        name_ko: data.title_ko,
      }))
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
      .from("drink_categories")
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

  // addCategoryはもう使わないので削除
  // const addCategory = async () => { ... }


  const bulkDelete = async () => {
    if (selected.length === 0) {
      alert("選択されていません")
      return
    }

    if (!confirm(`${selected.length}件削除しますか？`)) return

    console.log("🔥 BULK DELETE:", selected)

    const { error } = await supabase
      .from("world_drinks")
      .delete()
      .in("id", selected)

    if (error) {
      console.error("BULK DELETE ERROR:", error)
      return
    }

    load()
    setSelected([])
  }

  const bulkUpdatePrice = async () => {
    if (selected.length === 0) {
      alert("選択されていません")
      return
    }

    const price = Number(newPrice)

    if (!newPrice || isNaN(price)) {
      alert("価格を入力してください")
      return
    }

    const { error } = await supabase
      .from("world_drinks")
      .update({ price })
      .in("id", selected)

    if (error) {
      console.error("UPDATE ERROR:", error)
      alert(error.message)
      return
    }

    load()

    setSelected([])
    setShowPriceModal(false)
    setNewPrice("")
  }

  const bulkUpdateCategory = async () => {
    if (selected.length === 0) {
      alert("選択されていません")
      return
    }

    if (!newCategory) {
      alert("カテゴリーを選択してください")
      return
    }

    const { error } = await supabase
      .from("world_drinks")
      .update({ drinkcategory: newCategory })
      .in("id", selected)

    if (error) {
      console.error("UPDATE ERROR:", error)
      alert(error.message)
      return
    }

    load()

    setSelected([])
    setShowCategoryModal(false)
    setNewCategory("")
  }

  const exportCSV = () => {
    if (drinks.length === 0) {
      alert("データがありません")
      return
    }

    // ヘッダー
    const header = ["id", "name_ja", "name_en", "name_zh", "name_ko", "drinkcategory", "description", "price", "imageurl", "isactive", "displayorder"]

    // データ
    const rows = drinks.map(item => [
      item.id,
      item.name_ja,
      item.name_en || "",
      item.name_zh || "",
      item.name_ko || "",
      item.drinkcategory,
      item.description || "",
      item.price,
      item.imageurl || "",
      item.isactive,
      item.displayorder || 0
    ])

    // CSV文字列作成
    const csvContent = [
      header.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n")

    // BOM付き（Excel対策）
    const bom = "\uFEFF"

    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "drinks.csv"
    link.click()
  }

  return (
    <div className="page" style={{ padding: "20px 30px" }}>
      <h1 style={{ textAlign: "center", margin: "0 0 10px", fontSize: "35px" }}>
        Drink管理
      </h1>

      {/* フィルターUI */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
        {/* カテゴリーフィルター */}
        <div>
          <label htmlFor="drinkCategoryFilter" style={{ marginRight: "5px" }}>カテゴリー:</label>
          <select
            id="drinkCategoryFilter"
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
          <label htmlFor="drinkPriceFilter" style={{ marginRight: "5px" }}>価格帯:</label>
          <select
            id="drinkPriceFilter"
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
            <th style={{ width: "18%", textAlign: "center" }}>名前</th>
            <th style={{ width: "18%", textAlign: "center" }}>英語名</th>
            <th style={{ width: "10%", textAlign: "center" }}>カテゴリー</th>
            <th style={{ width: "31%", textAlign: "center" }}>説明</th>
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
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px 4px" }}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggle(item.id)}
                  style={{ transform: "scale(0.8)" }}
                />
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px", whiteSpace: "nowrap" }}>
                {item.name_ja}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {item.name_en}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {item.drinkcategory}
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
                      .from("world_drinks")
                      .update({ isactive: checked })
                      .eq("id", item.id)

                    if (error) {
                      alert("更新失敗")
                      return
                    }

                    // UI更新（即反映）
                    setDrinks(drinks.map(x =>
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
                  height: "30px", // セルの高さを明示的に指定して中央揃えを安定させる
                  padding: "2px 4px"
                }}
              >
                <button
                  style={{ fontSize: "11px", padding: "1px 6px" }}
                  onClick={() => {
                    setEditDrink(item)
                    setShowEdit(true)
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
                    if (!confirm("このドリンクを削除しますか？")) return
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
          onClick={() => setShowAdd(true)}
        >
          ドリンク追加
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

      {/* 印刷用全件テーブル（通常は非表示、印刷時のみ drinks ステートから全件表示） */}
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
            <th style={{ width: "18%", textAlign: "center" }}>名前</th>
            <th style={{ width: "18%", textAlign: "center" }}>英語名</th>
            <th style={{ width: "10%", textAlign: "center" }}>カテゴリー</th>
            <th style={{ width: "31%", textAlign: "center" }}>説明</th>
            <th style={{ width: "8%", textAlign: "center" }}>価格</th>
            <th style={{ width: "5%", textAlign: "center" }}>表示</th>
            <th style={{ width: "7%", textAlign: "center" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {drinks.map(item => (
            <tr key={item.id} style={{ opacity: item.isactive ? 1 : 0.4 }}>
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px 4px" }}></td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px", whiteSpace: "nowrap" }}>
                {item.name_ja}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {item.name_en}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {item.drinkcategory}
              </td>
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
                {item.isactive ? "○" : "×"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEdit && editDrink && (
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
            {(isTranslating || isSaving) && (
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
                  {isTranslating ? "翻訳中..." : "保存中..."}
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

            <div style={{ padding: "22px" }}>
              {/* タイトル */}
              <h2
                style={{
                  textAlign: "center",
                  fontSize: "34px",
                  marginBottom: "22px",
                  fontWeight: "bold",
                }}
              >
                Drink編集
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
                    value={editDrink.name_ja}
                    onChange={(e) => setEditDrink(prev => ({ ...prev!, name_ja: e.target.value }))}
                    style={{
                      width: "100%",
                      height: "42px",
                      marginTop: "6px",
                      fontSize: "15px",
                      padding: "0 10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                    }}
                  />
                  {/* 多言語へ反映ボタン */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button 
                      onClick={handleTranslate} 
                      style={{ fontSize: "13px" }}
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
                    value={editDrink.name_en || ""}
                    readOnly
                    style={{
                      width: "100%",
                      height: "42px",
                      marginTop: "6px",
                      fontSize: "15px",
                      padding: "0 10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background: "#f5f5f5",
                    }}
                  />
                </div>

                {/* 中文 */}
                <div>
                  <label style={{ fontSize: "16px", fontWeight: "bold" }}>中文</label>
                  <input
                    type="text"
                    value={editDrink.name_zh || ""}
                    readOnly
                    style={{
                      width: "100%",
                      height: "42px",
                      marginTop: "6px",
                      fontSize: "15px",
                      padding: "0 10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background: "#f5f5f5",
                    }}
                  />
                </div>

                {/* 한국어 */}
                <div>
                  <label style={{ fontSize: "16px", fontWeight: "bold" }}>한국어</label>
                  <input
                    type="text"
                    value={editDrink.name_ko || ""}
                    readOnly
                    style={{
                      width: "100%",
                      height: "42px",
                      marginTop: "6px",
                      fontSize: "14px",
                      padding: "0 10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background: "#f5f5f5",
                    }}
                  />
                </div>
              </div>

              {/* 共通項目 */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 100px",
                gap: "10px",
                marginTop: "18px",
                maxWidth: "580px",
                margin: "18px auto 0",
              }}>
                {/* Category */}
                <div>
                  <label style={{ fontSize: "14px" }}>Category</label>
                  <select
                    value={editDrink.drinkcategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__add__") {
                        setShowAddCategory(true)
                        return
                      }
                      setEditDrink(prev => ({
                        ...prev!,
                        category: val,
                        drinkcategory: val,
                      }))
                    }}
                    style={{ width: "100%", height: "40px", marginTop: "6px", padding: "0 10px", fontSize: "14px" }}
                  >
                    <option value="">選択してください</option>
                    <option value="__add__">＋ カテゴリー追加</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {showAddCategory && (
                    <div style={{ marginTop: "10px", padding: "10px", background: "#f9f9f9", borderRadius: "4px", border: "1px solid #ddd" }}>
                      <input
                        placeholder="新しいカテゴリー名"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        style={{ width: "100%", marginBottom: "6px" }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button style={{ fontSize: "11px" }} onClick={() => { setShowAddCategory(false); setNewCategoryName(""); }}>キャンセル</button>
                        <button style={{ fontSize: "11px" }} onClick={async () => {
                          const newCat = await handleAddCategory(newCategoryName);
                          if (newCat) {
                            setEditDrink(prev => ({
                              ...prev!,
                              category: newCat,
                              drinkcategory: newCat,
                            }))
                          }
                          setShowAddCategory(false);
                        }}>追加</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: "14px" }}>Description</label>
                  <input
                    type="text"
                    value={editDrink.description || ""}
                    onChange={(e) => setEditDrink(prev => ({ ...prev!, description: e.target.value }))}
                    style={{ width: "100%", height: "40px", marginTop: "6px", padding: "0 10px", fontSize: "14px" }}
                  />
                </div>

                {/* Price */}
                <div>
                  <label style={{ fontSize: "14px" }}>Price</label>
                  <input
                    type="number"
                    value={editDrink.price === 0 ? "" : editDrink.price}
                    onChange={(e) => setEditDrink(prev => ({ ...prev!, price: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    style={{ width: "100%", height: "40px", marginTop: "6px", padding: "0 10px", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* 表示 */}
              <div style={{ marginTop: "18px", maxWidth: "580px", margin: "18px auto 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editDrink.isactive}
                    onChange={(e) => setEditDrink(prev => ({ ...prev!, isactive: e.target.checked }))}
                  />
                  表示する
                </label>
              </div>

              {/* ボタン */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", maxWidth: "580px", margin: "28px auto 0" }}>
                <button onClick={() => setShowEdit(false)}>キャンセル</button>
                <button onClick={saveEdit}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規追加モーダル (最新の2列レイアウト版) */}
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
            {(isTranslating || isSaving) && (
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
                  {isTranslating ? "翻訳中..." : "保存中..."}
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
                Drink追加
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
                    value={newDrink.name_ja}
                    onChange={(e) => setNewDrink({ ...newDrink, name_ja: e.target.value })}
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
                            body: JSON.stringify({ title: newDrink.name_ja, body: newDrink.description || "" }),
                          });
                          const data = await res.json();
                          setNewDrink({ ...newDrink, name_en: data.title_en, name_zh: data.title_zh, name_ko: data.title_ko });
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
                    value={newDrink.name_en || ""}
                    readOnly
                    style={{ width: "100%", height: "42px", marginTop: "6px", padding: "0 10px", borderRadius: "8px", border: "1px solid #ccc", background: "#f5f5f5" }}
                  />
                </div>

                {/* 中文 */}
                <div>
                  <label style={{ fontSize: "16px", fontWeight: "bold" }}>中文</label>
                  <input
                    type="text"
                    value={newDrink.name_zh || ""}
                    readOnly
                    style={{ width: "100%", height: "42px", marginTop: "6px", padding: "0 10px", borderRadius: "8px", border: "1px solid #ccc", background: "#f5f5f5" }}
                  />
                </div>

                {/* 韓国語 */}
                <div>
                  <label style={{ fontSize: "16px", fontWeight: "bold" }}>한국어</label>
                  <input
                    type="text"
                    value={newDrink.name_ko || ""}
                    readOnly
                    style={{ width: "100%", height: "42px", marginTop: "6px", padding: "0 10px", borderRadius: "8px", border: "1px solid #ccc", background: "#f5f5f5" }}
                  />
                </div>
              </div>

              {/* 共通項目 */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 100px",
                gap: "10px",
                marginTop: "18px",
                maxWidth: "580px",
                margin: "0 auto",
              }}>
                <div>
                  <label style={{ fontSize: "14px" }}>カテゴリー</label>
                  <select
                    value={newDrink.drinkcategory || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__add__") { setShowAddAddCategory(true); }
                      else { setNewDrink({ ...newDrink, drinkcategory: val }); }
                    }}
                    style={{ width: "100%", height: "40px", marginTop: "6px", fontSize: "14px" }}
                  >
                    <option value="">選択してください</option>
                    <option value="__add__">＋ カテゴリー追加</option>
                    {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                  {showAddAddCategory && (
                    <div style={{ marginTop: "10px", padding: "10px", background: "#f9f9f9", border: "1px solid #ddd" }}>
                      <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={{ width: "100%", marginBottom: "6px" }} />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button onClick={() => setShowAddAddCategory(false)}>キャンセル</button>
                        <button onClick={async () => {
                          const newCat = await handleAddCategory(newCategoryName);
                          if (newCat) setNewDrink({ ...newDrink, drinkcategory: newCat });
                          setShowAddAddCategory(false);
                        }}>追加</button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "14px" }}>Description</label>
                  <input type="text" value={newDrink.description} onChange={(e) => setNewDrink({ ...newDrink, description: e.target.value })} style={{ width: "100%", height: "40px", marginTop: "6px" }} />
                </div>

                <div>
                  <label style={{ fontSize: "14px" }}>Price</label>
                  <input type="number" value={newDrink.price} onChange={(e) => setNewDrink({ ...newDrink, price: e.target.value })} style={{ width: "100%", height: "40px", marginTop: "6px" }} />
                </div>
              </div>

              <div style={{ marginTop: "18px", maxWidth: "580px", margin: "18px auto 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={newDrink.isactive}
                    onChange={(e) => setNewDrink({ ...newDrink, isactive: e.target.checked })}
                  />
                  表示する
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", maxWidth: "580px", margin: "28px auto 0" }}>
                <button onClick={() => setShowAdd(false)}>キャンセル</button>
                <button onClick={addDrink}>追加</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 一括価格変更モーダル */}
      {showPriceModal && (
        <div className="modalOverlay">
          <div className="modalContent" style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "300px" }}>
            <h3 style={{ textAlign: "center", marginBottom: "15px" }}>一括価格変更</h3>
            <div style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
              <span style={{ marginRight: "4px" }}>¥</span>
              <input
                type="number"
                placeholder="価格"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                style={{ width: "100%", height: "35px", padding: "0 8px" }}
              />
            </div>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => { setShowPriceModal(false); setNewPrice(""); }}>キャンセル</button>
              <button onClick={bulkUpdatePrice}>変更</button>
            </div>
          </div>
        </div>
      )}

      {/* 一括カテゴリー変更モーダル */}
      {showCategoryModal && (
        <div className="modalOverlay">
          <div className="modalContent" style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "300px" }}>
            <h3 style={{ textAlign: "center", marginBottom: "15px" }}>一括カテゴリー変更</h3>
            <select
              value={newCategory}
              onChange={(e) => {
                if (e.target.value === "__add__") {
                  setShowAddCategory(true)
                  return
                }
                setNewCategory(e.target.value)
              }}
              style={{ width: "100%", height: "35px", marginTop: "10px" }}
            >
              <option value="">選択してください</option>
              <option value="__add__">＋ カテゴリー追加</option>
              {categories.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
            {showAddCategory && (
              <div style={{ marginTop: "10px", padding: "10px", background: "#f9f9f9" }}>
                <input
                  placeholder="新カテゴリー"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ width: "100%", marginBottom: "6px" }}
                />
                <button onClick={async () => {
                  const newCat = await handleAddCategory(newCategoryName);
                  if (newCat) setNewCategory(newCat);
                  setShowAddCategory(false);
                }}>追加</button>
              </div>
            )}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => { setShowCategoryModal(false); setNewCategory(""); }}>キャンセル</button>
              <button onClick={bulkUpdateCategory}>変更</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}