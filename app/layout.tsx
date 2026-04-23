import "./globals.css"
import { Home, Users, Beer, Utensils, Newspaper, Image } from "lucide-react"
import Link from "next/link"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          {/* HEADER */}
          <div
            style={{
              background: "#7b5a36",
              color: "#fff",
              padding: "40px 0", // 上下は40px、左右は0にしてpaddingLeftで調整
              fontSize: "25px",
              fontWeight: "bold",
              display: "flex", // Flexboxを有効にする
              paddingLeft: "220px", // サイドバーの幅と同じ220pxを左に確保
              justifyContent: "center", // サイドバーを除いた残りの領域で中央揃え
              alignItems: "center" // 垂直方向の中央揃え (任意だが、見た目を整える)
            }}
          >
            {/* テキストをh2で囲み、デフォルトのマージンをリセット */}
            <h2 style={{ margin: 0 }}>Oh Yeah！管理ツール</h2>
          </div>

          {/* BODY */}
          <div style={{ display: "flex", flex: 1 }}>
            {/* SIDEBAR */}
            <div
              style={{
                width: "220px",
                background: "#7b5a36",
                color: "#fff"
              }}
            >
              <div
                className="logo"
                style={{
                  textAlign: "center",
                  padding: "20px 0 10px",
                  fontSize: "24px",
                  fontWeight: "bold"
                }}
              >
                ADMIN
              </div>
              <nav
                className="menuList"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "20px"
                }}
              >
                <Link href="/dashboard" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                  <Home size={30} />
                  <span>Dashboard</span>
                </Link>
                <Link href="/users" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                  <Users size={30} />
                  <span>Users</span>
                </Link>
                <Link href="/drinks" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                  <Beer size={30} />
                  <span>Drink</span>
                </Link>
                <Link href="/foods" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                  <Utensils size={30} />
                  <span>Food</span>
                </Link>
                <Link href="/news" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                  <Newspaper size={30} />
                  <span>News</span>
                </Link>
                <Link href="/slider" className="menuItem" style={{ display: "flex", alignItems: "center", gap: "10px", width: "140px" }}>
                  <Image size={30} />
                  <span>Slider</span>
                </Link>
              </nav>
            </div>

            {/* MAIN */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}