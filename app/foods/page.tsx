"use client"

import { useState } from "react"

type Food = {
  id: string
  name: string
  name_en: string
  foodCategory: string
  description: string
  price: number
}

export default function Foods() {
  const [foods] = useState<Food[]>([
    {
      id: "1",
      name: "ピザ",
      name_en: "Pizza",
      foodCategory: "pizza",
      description: "テスト用",
      price: 1000
    }
  ])

  return (
    <div style={{ padding: "20px 30px" }}>
      <h1 style={{ textAlign: "center", margin: "0 0 10px" }}>Food管理</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          marginTop: "20px"
        }}
      >
        <thead>
          <tr style={{ background: "#ddd" }}>
            <th>名前</th>
            <th>英語名</th>
            <th>カテゴリー</th>
            <th>説明</th>
            <th>価格</th>
          </tr>
        </thead>

        <tbody>
          {foods.map(f => (
            <tr key={f.id}>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {f.name}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {f.name_en}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {f.foodCategory}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {f.description}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                ¥{f.price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}