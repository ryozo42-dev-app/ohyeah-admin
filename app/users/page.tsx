"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type User = {
  id: string
  name: string
  email: string
  role: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [userData, setUserData] = useState<any>(null)
  const isAdmin = userData?.role === "admin"

  const [showAdd, setShowAdd] = useState(false)

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff"
  })
  const [showPassword, setShowPassword] = useState(false)

  const [showEdit, setShowEdit] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("staff")

  const [page, setPage] = useState(1)
  const perPage = 10

  // -----------------------
  // load users
  // -----------------------
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("createdat", { ascending: false })

      if (error) {
        console.error(error)
        alert("データ取得失敗")
        return
      }

      setUsers(data || [])
    }

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

  // -----------------------
  // add user
  // -----------------------
  const addUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("入力してください")
      return
    }

    // ① Authに登録
    const { data, error: authError } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password
    })

    if (authError) {
      alert(authError.message)
      return
    }

    const user = data.user
    if (!user) return

    // ② usersテーブルに登録
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: user.id,
        name: newUser.name,
        email: user.email,
        role: newUser.role
      }
    ])

    if (dbError) {
      alert(dbError.message)
      return
    }

    alert("ユーザー作成完了")
    setShowAdd(false)
    location.reload()
  }

  const updateUser = async () => {
    if (!editingUser) return

    const { error } = await supabase
      .from("users")
      .update({
        name: editName,
        role: editRole
      })
      .eq("id", editingUser.id)

    if (error) {
      alert(error.message)
      return
    }

    setShowEdit(false)
    location.reload()
  }

  const deleteUser = async (id: string) => {
    if (!confirm("削除しますか？")) return

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)

    if (error) {
      alert(error.message)
      return
    }

    location.reload()
  }

  // =====================
  // UI
  // =====================
  return (
    <div style={{ padding: "20px 30px" }}>
      <h1 style={{ textAlign: "center", margin: "0 0 10px" }}>Users管理</h1>

      

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          marginTop: "30px",
          tableLayout: "fixed"
        }}
      >
        <thead>
          <tr style={{ background: "#ddd" }}>
            <th style={{ width: "180px", border: "1px solid #ccc" }}>名前</th>
            <th style={{ width: "280px", border: "1px solid #ccc" }}>メール</th>
            <th style={{ width: "120px", border: "1px solid #ccc" }}>権限</th>
            <th style={{ width: "180px", border: "1px solid #ccc" }}>操作</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {u.name}
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {u.email}
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
                {u.role}
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
                <button
                  onClick={() => {
                    setEditingUser(u)
                    setEditName(u.name)
                    setEditRole(u.role)
                    setShowEdit(true)
                  }}
                  style={{ padding: "2px 8px", fontSize: "13px", cursor: "pointer" }}
                >
                  編集
                </button>

                <button
                  onClick={() => {
                    if (!isAdmin) return
                    deleteUser(u.id)
                  }}
                  disabled={!isAdmin}
                  style={{
                    opacity: isAdmin ? 1 : 0.4,
                    cursor: isAdmin ? "pointer" : "not-allowed",
                    background: "#d9534f",
                    color: "#fff",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    marginLeft: "8px"
                  }}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ textAlign: "center", marginTop: "30px" }}>
  <button
  onClick={() => setShowAdd(true)}
  style={{
    padding: "6px 16px",
    cursor: "pointer"
  }}
>
  ユーザー追加
</button>
</div>

      {/* モーダル */}
      {showAdd && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setShowAdd(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "25px",
              borderRadius: "8px",
              width: "400px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>ユーザー追加</h3>

            <label>名前</label>
            <input
              value={newUser.name}
              onChange={(e) =>
                setNewUser({ ...newUser, name: e.target.value })
              }
              style={{ width: "100%" }}
            />

            <label>メール</label>
            <input
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              style={{ width: "100%" }}
            />

            <label style={{ display: "block", marginTop: "10px" }}>パスワード</label>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 10px", // 👈 右余白重要
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box"
                }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  zIndex: 10,
                  fontSize: "14px"
                }}
              >
                {showPassword ? "🙈" : "👁"}
              </span>
            </div>

            <label>権限</label>
            <select
              value={newUser.role}
              onChange={(e) =>
                setNewUser({ ...newUser, role: e.target.value })
              }
              style={{ width: "100%" }}
            >
              <option value="admin">admin</option>
              <option value="staff">staff</option>
            </select>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <button onClick={() => setShowAdd(false)} style={{ padding: "2px 8px", fontSize: "13px", cursor: "pointer" }}>
                キャンセル
              </button>

              <button
                onClick={addUser}
                style={{
                  background: "#7b5a36",
                  color: "#fff",
                padding: "2px 8px",
                fontSize: "13px",
                cursor: "pointer"
                }}
              >
                登録
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setShowEdit(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "25px",
              borderRadius: "8px",
              width: "400px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>ユーザー編集</h3>

            <label>名前</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ width: "100%" }}
            />

            <label>権限</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="admin">admin</option>
              <option value="staff">staff</option>
            </select>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <button onClick={() => setShowEdit(false)} style={{ padding: "2px 8px", fontSize: "13px", cursor: "pointer" }}>
                キャンセル
              </button>

              <button onClick={updateUser} style={{ padding: "2px 8px", fontSize: "13px", cursor: "pointer" }}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}