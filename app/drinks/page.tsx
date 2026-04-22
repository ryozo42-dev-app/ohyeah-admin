"use client"

import { useState } from "react"

type Drink = {
  id: string
  name: string
  name_en: string
  drinkCategory: string
  description: string
  price: number
}

export default function Drinks() {
  const [drinks] = useState<Drink[]>([
    {
      id: "1",
      name: "コーラ",
      name_en: "Cola",
      drinkCategory: "soft",
      description: "テスト用",
      price: 500
    }
  ])

  return (
    <div style={{ padding: "20px 30px" }}>
      <h1 style={{ textAlign: "center", margin: "0 0 10px" }}>Drink管理</h1>

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
          {drinks.map(d => (
            <tr key={d.id}>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {d.name}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {d.name_en}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {d.drinkCategory}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                {d.description}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  fontSize: "14px",
                  lineHeight: "1.2"
                }}
              >
                ¥{d.price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}