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

        <div className="app">

          {/* ヘッダー */}
          <div className="header">
            Oh Yeah！管理ツール
          </div>

          {/* 下エリア */}
          <div className="content">

            {/* サイドバー */}
            <div
              style={{
                width: "220px",
                background: "#7b5a36",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: "20px"
              }}
            >
              <div className="logo">ADMIN</div>

              <nav className="menuList">

                <Link href="/dashboard" className="menuItem">
                  <Home size={20}/>
                  <span>Dashboard</span>
                </Link>

                <Link href="/users" className="menuItem">
                  <Users size={20}/>
                  <span>Users</span>
                </Link>

                <Link href="/drinks" className="menuItem">
                  <Beer size={20}/>
                  <span>Drink</span>
                </Link>

                <Link href="/foods" className="menuItem">
                  <Utensils size={20}/>
                  <span>Food</span>
                </Link>

                <Link href="/news" className="menuItem">
                  <Newspaper size={20}/>
                  <span>News</span>
                </Link>

                <Link href="/slider" className="menuItem">
                  <Image size={18}/>
                  <span>Slider</span>
                </Link>

              </nav>
            </div>

            {/* メイン */}
            <div className="main">
              <div className="page">
                {children}
              </div>
            </div>

          </div>

        </div>

      </body>
    </html>
  )
}