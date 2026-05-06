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

  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const perPage = 10

  // -----------------------
  // load users
  // -----------------------

  const load = async () => {

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("createdat", { ascending: false })

    console.log("USERS:", data)
    console.log("ERROR:", error)

    if (error) {
      console.error(error)
      alert("データ取得失敗")
      return
    }

    setUsers(data || [])
  }

  // -----------------------
  // load login user
  // -----------------------

  const loadUser = async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      setTimeout(loadUser, 500)
      return
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    console.log("LOGIN USER:", data)
    console.log("LOGIN ERROR:", error)

    setUserData(data)
  }

  useEffect(() => {
    load()
    loadUser()
  }, [])

  // -----------------------
  // add user
  // -----------------------

  const addUser = async () => {

    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("入力してください")
      return
    }

    setLoading(true)

    try {

      // Auth登録
      const { data, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password
      })

      if (authError) {
        alert(authError.message)
        return
      }

      const user = data.user

      if (!user) {
        alert("ユーザー取得失敗")
        return
      }

      // users table 登録
      const { error: dbError } = await supabase
        .from("users")
        .insert([
          {
            id: user.id,
            name: newUser.name,
            email: user.email,
            role: newUser.role,
            createdat: new Date().toISOString()
          }
        ])

      if (dbError) {
        console.error(dbError)
        alert(dbError.message)
        return
      }

      alert("ユーザー作成完了")

      setShowAdd(false)

      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "staff"
      })

      await load()

    } catch (err) {

      console.error(err)

      alert("登録に失敗しました")

    } finally {

      setLoading(false)

    }
  }

  // -----------------------
  // update user
  // -----------------------

  const updateUser = async () => {

    if (!editingUser) return

    setLoading(true)

    try {

      const { error } = await supabase
        .from("users")
        .update({
          name: editName,
          role: editRole
        })
        .eq("id", editingUser.id)

      if (error) {

        console.error("UPDATE ERROR:", error)

        alert("更新に失敗しました")

        return
      }

      setShowEdit(false)

      await load()

    } catch (err) {

      console.error(err)

    } finally {

      setLoading(false)

    }
  }

  // -----------------------
  // delete
  // -----------------------

  const handleDelete = async (id: string) => {

    console.log("🔥 DELETE:", id)

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)

    if (error) {

      console.error("DELETE ERROR:", error)

      alert("削除失敗")

      return
    }

    await load()
  }

  // -----------------------
  // pagination
  // -----------------------

  const start = (page - 1) * perPage

  const paginatedUsers = users.slice(start, start + perPage)

  const totalPage = Math.ceil(users.length / perPage)

  // =====================
  // UI
  // =====================

  return (

    <div style={{ padding: "20px 30px" }}>

      <h1 style={{ textAlign: "center", margin: "0 0 10px" }}>
        Users管理
      </h1>

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
            <th style={{ width: "180px", border: "1px solid #ccc" }}>
              名前
            </th>

            <th style={{ width: "280px", border: "1px solid #ccc" }}>
              メール
            </th>

            <th style={{ width: "120px", border: "1px solid #ccc" }}>
              権限
            </th>

            <th style={{ width: "180px", border: "1px solid #ccc" }}>
              操作
            </th>
          </tr>
        </thead>

        <tbody>

          {paginatedUsers.map((user) => (

            <tr key={user.id}>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {user.name}
              </td>

              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {user.email}
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
                {user.role}
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

                    setEditingUser(user)

                    setEditName(user.name)

                    setEditRole(user.role)

                    setShowEdit(true)
                  }}
                  style={{
                    fontSize: "11px",
                    padding: "1px 6px"
                  }}
                >
                  編集
                </button>

                <button
                  style={{
                    fontSize: "11px",
                    padding: "1px 6px",
                    color: "red"
                  }}
                  onClick={() => {

                    if (!confirm("このユーザーを削除しますか？")) return

                    handleDelete(user.id)
                  }}
                >
                  削除
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {/* pagination */}

      <div
        style={{
          marginTop: "20px",
          textAlign: "center"
        }}
      >

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          style={{ marginRight: "8px" }}
        >
          ◀
        </button>

        {Array.from({ length: totalPage }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              margin: "0 4px",
              background: page === p ? "#8B5E3C" : "#fff",
              color: page === p ? "#fff" : "#000",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "4px 10px"
            }}
          >
            {p}
          </button>
        ))}

        <button
          disabled={page === totalPage}
          onClick={() => setPage(page + 1)}
          style={{ marginLeft: "8px" }}
        >
          ▶
        </button>

      </div>

      {/* add button */}

      <div style={{ textAlign: "center", marginTop: "30px" }}>

        <button
          onClick={() => setShowAdd(true)}
          style={{ fontSize: "12px" }}
        >
          ユーザー追加
        </button>

      </div>

      {/* ADD MODAL */}

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
              borderRadius: "8px",
              width: "400px",
              padding: 0,
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >

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
                ユーザー追加
              </h2>

              <label>名前</label>

              <input
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    name: e.target.value
                  })
                }
                style={{
                  width: "100%",
                  marginBottom: "10px"
                }}
              />

              <label>メール</label>

              <input
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    email: e.target.value
                  })
                }
                style={{
                  width: "100%",
                  marginBottom: "10px"
                }}
              />

              <label
                style={{
                  display: "block",
                  marginTop: "10px"
                }}
              >
                パスワード
              </label>

              <div
                style={{
                  position: "relative",
                  marginBottom: "16px"
                }}
              >

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      password: e.target.value
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 10px",
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
                  setNewUser({
                    ...newUser,
                    role: e.target.value
                  })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
              >
                <option value="admin">admin</option>
                <option value="staff">staff</option>
              </select>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px"
                }}
              >

                <button
                  disabled={loading}
                  onClick={() => setShowAdd(false)}
                >
                  キャンセル
                </button>

                <button
                  disabled={loading}
                  onClick={addUser}
                >
                  {loading ? "登録中..." : "登録"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* EDIT MODAL */}

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
              borderRadius: "8px",
              width: "400px",
              padding: 0,
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >

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
                ユーザー編集
              </h2>

              <label>名前</label>

              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: "100%",
                  marginBottom: "10px"
                }}
              />

              <label>権限</label>

              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
              >
                <option value="admin">admin</option>
                <option value="staff">staff</option>
              </select>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px"
                }}
              >

                <button
                  disabled={loading}
                  onClick={() => setShowEdit(false)}
                >
                  キャンセル
                </button>

                <button
                  disabled={loading}
                  onClick={updateUser}
                >
                  {loading ? "保存中..." : "保存"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}