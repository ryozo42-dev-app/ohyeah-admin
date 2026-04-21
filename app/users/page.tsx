"use client"

import { useState } from "react"

type User = {
  id: string
  name: string
  email: string
  role: string
}

export default function Users() {
  const [users] = useState<User[]>([
    { id: "1", name: "テストユーザー", email: "test@test.com", role: "admin" }
  ])

  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ textAlign: "center" }}>Users管理</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          marginTop: "30px"
        }}
      >
        <thead>
          <tr style={{ background: "#ddd" }}>
            <th style={{ border: "1px solid #ccc" }}>名前</th>
            <th style={{ border: "1px solid #ccc" }}>メール</th>
            <th style={{ border: "1px solid #ccc" }}>権限</th>
          </tr>
        </thead>

        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{u.name}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{u.email}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}