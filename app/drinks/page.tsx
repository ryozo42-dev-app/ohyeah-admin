"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Drink = {
  id: string
  name: string
  name_en: string
  drinkcategory: string
  description: string | null
  price: number
  isactive: boolean
}

export default function Drinks() {
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [showEdit, setShowEdit] = useState(false)
  const [editDrink, setEditDrink] = useState<Drink | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [newDrink, setNewDrink] = useState({
    name: "",
    name_en: "",
    drinkcategory: "BEER",
    description: "",
    price: "",
    isactive: true
  })

  const perPage = 10

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("menu_drinks")
        .select("*")
        .order("id", { ascending: true })

      console.log("Drinks data:", data, "error:", error)
      console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

      setDrinks(data || [])
    }

    load()
  }, [])

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

  const saveEdit = async () => {
    if (!editDrink) return

    const { error } = await supabase
      .from("menu_drinks")
      .update({
        name: editDrink.name,
        name_en: editDrink.name_en,
        drinkcategory: editDrink.drinkcategory,
        description: editDrink.description,
        price: Number(editDrink.price),
        isactive: editDrink.isactive
      })
      .eq("id", editDrink.id)

    if (error) {
      alert("更新失敗")
      return
    }

    // UI更新
    setDrinks(drinks.map(d => (d.id === editDrink.id ? editDrink : d)))

    setShowEdit(false)
  }

  const deleteDrink = async (id: string) => {
    if (!confirm("削除しますか？")) return

    const { error } = await supabase
      .from("menu_drinks")
      .delete()
      .eq("id", id)

    if (error) {
      alert("削除に失敗しました")
      return
    }

    // UI更新
    setDrinks(drinks.filter(d => d.id !== id))

    // 選択状態からも削除
    setSelected(prev => prev.filter(s => s !== id))
  }

  const addDrink = async () => {
    if (!newDrink.name) {
      alert("名前を入力してください")
      return
    }

    const { data, error } = await supabase
      .from("menu_drinks")
      .insert([
        {
          name: newDrink.name,
          name_en: newDrink.name_en,
          drinkcategory: newDrink.drinkcategory,
          description: newDrink.description,
          price: Number(newDrink.price || 0),
          isactive: newDrink.isactive
        }
      ])
      .select()

    if (error) {
      alert("追加失敗")
      return
    }

    // UIに追加
    if (data) {
      setDrinks([...data, ...drinks])
    }

    // 初期化
    setNewDrink({
      name: "",
      name_en: "",
      drinkcategory: "BEER",
      description: "",
      price: "",
      isactive: true
    })

    setShowAdd(false)
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return

    const { error } = await supabase
      .from("drink_categories")
      .insert([{ name: newCategoryName.trim() }])

    if (error) {
      alert("カテゴリーの追加に失敗しました")
      return
    }

    // 一覧を更新（アルファベット順にソート）
    const updated = [...categories, newCategoryName.trim()].sort()
    setCategories(updated)

    // 現在編集/追加中の項目のカテゴリーを、今作ったものに自動セットする
    if (editDrink) setEditDrink({ ...editDrink, drinkcategory: newCategoryName.trim() })
    if (showAdd) setNewDrink({ ...newDrink, drinkcategory: newCategoryName.trim() })

    setNewCategoryName("")
    setShowAddCategory(false)
  }

  const bulkDelete = async () => {
    if (selected.length === 0) {
      alert("選択されていません")
      return
    }

    if (!confirm(`${selected.length}件削除しますか？`)) return

    const { error } = await supabase
      .from("menu_drinks")
      .delete()
      .in("id", selected)

    if (error) {
      alert("削除失敗")
      return
    }

    // UI更新
    setDrinks(drinks.filter(d => !selected.includes(d.id)))

    // 選択リセット
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
      .from("menu_drinks")
      .update({ price })
      .in("id", selected)

    if (error) {
      alert("更新失敗")
      return
    }

    // UI更新
    setDrinks(drinks.map(d =>
      selected.includes(d.id)
        ? { ...d, price }
        : d
    ))

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
      .from("menu_drinks")
      .update({ drinkcategory: newCategory })
      .in("id", selected)

    if (error) {
      alert("更新失敗")
      return
    }

    // UI更新
    setDrinks(drinks.map(d =>
      selected.includes(d.id)
        ? { ...d, drinkcategory: newCategory }
        : d
    ))

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
    const header = ["名前", "英語名", "カテゴリー", "説明", "価格"]

    // データ
    const rows = drinks.map(d => [
      d.name,
      d.name_en,
      d.drinkcategory,
      d.description || "",
      d.price
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
          {view.map(d => (
            <tr
              key={d.id}
              style={{ opacity: d.isactive ? 1 : 0.4 }}
            >
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px 4px" }}>
                <input
                  type="checkbox"
                  checked={selected.includes(d.id)}
                  onChange={() => toggle(d.id)}
                  style={{ transform: "scale(0.8)" }}
                />
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px", whiteSpace: "nowrap" }}>
                {d.name}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {d.name_en}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {d.drinkcategory}
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
                {d.description || "-"}
              </td>

              <td style={{ border: "1px solid #ddd", padding: "2px 4px", textAlign: "right" }}>
                ¥{d.price}
              </td>

              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px 4px" }}>
                <input
                  type="checkbox"
                  checked={d.isactive}
                  onChange={async (e) => {
                    const checked = e.target.checked

                    // DB更新
                    const { error } = await supabase
                      .from("menu_drinks")
                      .update({ isactive: checked })
                      .eq("id", d.id)

                    if (error) {
                      alert("更新失敗")
                      return
                    }

                    // UI更新（即反映）
                    setDrinks(drinks.map(x =>
                      x.id === d.id ? { ...x, isactive: checked } : x
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
                    setEditDrink(d)
                    setShowEdit(true)
                  }}
                >
                  編集
                </button>

                <button
                  style={{
                    fontSize: "11px",
                    padding: "1px 6px",
                    marginLeft: "2px",
                    color: "#d32f2f"
                  }}
                  onClick={() => deleteDrink(d.id)}
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
          style={{ fontSize: "12px", color: "#d32f2f" }}
          onClick={bulkDelete}
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
          {drinks.map(d => (
            <tr key={d.id} style={{ opacity: d.isactive ? 1 : 0.4 }}>
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px 4px" }}></td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px", whiteSpace: "nowrap" }}>
                {d.name}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {d.name_en}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}>
                {d.drinkcategory}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "2px 4px",
                  whiteSpace: "normal",
                  textAlign: "left"
                }}
              >
                {d.description || "-"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px", textAlign: "right" }}>
                ¥{d.price}
              </td>
              <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px 4px" }}>
                {d.isactive ? "○" : "×"}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "2px 4px" }}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEdit && editDrink && (
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

            <h3>ドリンク編集</h3>

            <input
              value={editDrink.name}
              onChange={(e)=>setEditDrink({...editDrink, name:e.target.value})}
              placeholder="名前"
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <input
              value={editDrink.name_en}
              onChange={(e)=>setEditDrink({...editDrink, name_en:e.target.value})}
              placeholder="英語名"
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <select
              value={editDrink.drinkcategory}
              onChange={(e) => {
                if (e.target.value === "__add__") {
                  setShowAddCategory(true)
                  return
                }

                setEditDrink({
                  ...editDrink,
                  drinkcategory: e.target.value
                })
              }}
              style={{ width: "100%", marginBottom: "6px" }}
            >
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
                  <button
                    style={{ fontSize: "11px" }}
                    onClick={() => setShowAddCategory(false)}
                  >キャンセル</button>
                  <button style={{ fontSize: "11px" }} onClick={addCategory}>追加</button>
                </div>
              </div>
            )}

            <input
              value={editDrink.description || ""}
              onChange={(e)=>setEditDrink({...editDrink, description:e.target.value})}
              placeholder="説明"
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <input
              type="number"
              value={editDrink.price === 0 ? "" : editDrink.price}
              onChange={(e)=>setEditDrink({
                ...editDrink,
                price: e.target.value === "" ? 0 : Number(e.target.value)
              })}
              placeholder="価格"
              style={{ width:"100%", marginBottom:"10px" }}
            />

            <label>
              <input
                type="checkbox"
                checked={editDrink.isactive}
                onChange={(e)=>setEditDrink({
                  ...editDrink,
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
              <button onClick={()=>setShowEdit(false)}>キャンセル</button>
              <button onClick={saveEdit}>保存</button>
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

            <h3>ドリンク追加</h3>

            <input
              placeholder="名前"
              value={newDrink.name}
              onChange={(e)=>setNewDrink({...newDrink, name:e.target.value})}
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <input
              placeholder="英語名"
              value={newDrink.name_en}
              onChange={(e)=>setNewDrink({...newDrink, name_en:e.target.value})}
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <select
              value={newDrink.drinkcategory}
              onChange={(e) => {
                if (e.target.value === "__add__") {
                  setShowAddCategory(true)
                  return
                }
                setNewDrink({ ...newDrink, drinkcategory: e.target.value })
              }}
              style={{ width: "100%", marginBottom: "6px" }}
            >
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
              value={newDrink.description}
              onChange={(e)=>setNewDrink({...newDrink, description:e.target.value})}
              style={{ width:"100%", marginBottom:"6px" }}
            />

            <input
              type="number"
              placeholder="価格"
              value={newDrink.price}
              onChange={(e)=>setNewDrink({...newDrink, price:e.target.value})}
              style={{ width:"100%", marginBottom:"10px" }}
            />

            <label>
              <input
                type="checkbox"
                checked={newDrink.isactive}
                onChange={(e)=>setNewDrink({...newDrink, isactive:e.target.checked})}
              />
              表示する
            </label>

            <div style={{
              marginTop:"15px",
              display:"flex",
              justifyContent:"space-between"
            }}>
              <button onClick={()=>setShowAdd(false)}>キャンセル</button>
              <button onClick={addDrink}>登録</button>
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

            <h3>一括価格変更</h3>

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

            <h3>一括カテゴリー変更</h3>

            <select
              value={newCategory}
              onChange={(e) => {
                if (e.target.value === "__add__") {
                  setShowAddCategory(true)
                  return
                }
                setNewCategory(e.target.value)
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
                  onClick={addCategory}
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
                setNewCategory("")
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
    </div>
  )
}