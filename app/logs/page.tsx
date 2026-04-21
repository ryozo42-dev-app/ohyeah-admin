"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore"
import { getStorage, ref, getDownloadURL } from "firebase/storage"

export default function LogsPage(){

  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {

    const fetch = async () => {
      const q = query(collection(db, "logs"), orderBy("timestamp", "desc"))
      const snap = await getDocs(q)

      setLogs(snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })))
    }

    fetch()

  }, [])

  // CSVダウンロード
  const downloadCSV = async () => {
    const storage = getStorage()
    const today = new Date().toISOString().split("T")[0]

    const fileRef = ref(storage, `logs/${today}.csv`)
    const url = await getDownloadURL(fileRef)

    window.open(url)
  }

  const addTestLog = async () => {
    await addDoc(collection(db, "logs"), {
      action: "edit_user",
      operator: auth.currentUser?.email,
      timestamp: serverTimestamp()
    })
  }

  return (
    <div style={{ padding:20 }}>

      <h2>操作ログ</h2>

      <button onClick={downloadCSV}>
        今日のCSVダウンロード
      </button>

      <button onClick={addTestLog} style={{marginLeft:10}}>
        テストログ追加
      </button>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop:20 }}>
        <thead>
          <tr>
            <th>操作</th>
            <th>実行者</th>
            <th>時間</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.action}</td>
              <td>{log.operator}</td>
              <td>
                {log.timestamp?.seconds
                  ? new Date(log.timestamp.seconds * 1000).toLocaleString("ja-JP")
                  : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}