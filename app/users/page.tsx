"use client"

import AuthGuard from "../../components/AuthGuard"
import { useEffect,useState } from "react"
import { auth, db, functions, secondaryAuth } from "../../lib/firebase"
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc, setDoc } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { createUserWithEmailAndPassword } from "firebase/auth"


type User={
id:string
name:string
email:string
role:string
}

export default function Users(){

const [users,setUsers]=useState<User[]>([])
const [showAdd,setShowAdd]=useState(false)

const [newUser,setNewUser]=useState({
name:"",
email:"",
password:"",
role:"admin"
})

const [editingUser, setEditingUser] = useState<any>(null)
const [editName, setEditName] = useState("")
const [showEdit, setShowEdit] = useState(false)
const [editEmail, setEditEmail] = useState("")
const [editRole, setEditRole] = useState("staff")
const [myRole, setMyRole] = useState("")

/* -----------------------
load users
----------------------- */

useEffect(()=>{

const load=async()=>{

const snap=await getDocs(collection(db,"users"))

const list=snap.docs.map(d=>({
id:d.id,
...d.data()
})) as User[]

setUsers(list)

}

load()

},[])

useEffect(() => {

  const fetchRole = async () => {

    if (!auth.currentUser) return

    const snap = await getDoc(doc(db, "users", auth.currentUser.uid))

    if (snap.exists()) {
      setMyRole(snap.data().role)
    }

  }

  fetchRole()

}, [])

const closeAddModal = () => {
  setShowAdd(false)
  setNewUser({
    name: "",
    email: "",
    password: "",
    role: "admin"
  })
}


// -----------------------
// add user
// -----------------------

const addUser = async () => {

  try {

    const createUser = httpsCallable(functions, "createUserAuth")

    await createUser({
      email: newUser.email,
      password: newUser.password,
      name: newUser.name,
      role: newUser.role
    })

    // 再取得
    const snap = await getDocs(collection(db, "users"))
    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as User[]

    setUsers(list)

    setShowAdd(false)

    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "admin"
    })

  } catch (e:any) {
    console.error(e)
    alert(e.message)
  }

}

const openEdit = (user:any) => {
  setEditingUser(user)
  setEditName(user.name)
  setEditEmail(user.email)
  setEditRole(user.role || "staff")
  setShowEdit(true)
}

const saveEdit = async () => {

  if (myRole !== "admin") {
    alert("権限がありません")
    return
  }

  if (!editingUser) return

  await updateDoc(
    doc(db, "users", editingUser.id),
    {
      name: editName,
      role: editRole
      // emailは更新しない
    }
  )

  await addDoc(collection(db, "logs"), {
    action: "edit_user",
    operator: auth.currentUser?.email,
    timestamp: serverTimestamp()
  })

  setShowEdit(false)
}


// -----------------------
// delete user
// -----------------------

const deleteUser = async (id: string) => {

  if (myRole !== "admin") {
    alert("権限がありません")
    return
  }

  if (!confirm("削除しますか？")) return

  try {

    // 🔥 Auth削除
    const deleteAuth = httpsCallable(functions, "deleteUserAuth")
    await deleteAuth({ uid: id })

    // 🔥 Firestore削除
    await deleteDoc(doc(db, "users", id))

    setUsers(users.filter(u => u.id !== id))

    // 🔥 ログ
    await addDoc(collection(db, "logs"), {
      action: "delete_user",
      operator: auth.currentUser?.email,
      timestamp: serverTimestamp()
    })

  } catch (e:any) {
    console.error(e)
    alert("削除に失敗しました")
  }

}


/* =====================
UI
===================== */

return(

<AuthGuard>

<div style={{padding:"40px"}}>

<h1 style={{textAlign:"center"}}>Users管理</h1>

<table
style={{
width:"100%",
borderCollapse:"collapse",
background:"#fff",
marginTop:"30px"
}}
>

<thead>

<tr style={{background:"#ddd"}}>

<th style={{border:"1px solid #ccc"}}>名前</th>
<th style={{border:"1px solid #ccc"}}>メール</th>
<th style={{border:"1px solid #ccc"}}>権限</th>
<th style={{border:"1px solid #ccc"}}>操作</th>

</tr>

</thead>

<tbody>

{users.map(u=>(

<tr key={u.id}>

<td style={{border:"1px solid #ddd",padding:"8px"}}>
{u.name}
</td>

<td style={{border:"1px solid #ddd",padding:"8px"}}>
{u.email}
</td>

<td style={{border:"1px solid #ddd",padding:"8px"}}>
{u.role}
</td>

<td style={{border:"1px solid #ddd",padding:"8px"}}>

{myRole === "admin" && (
<button onClick={()=>openEdit(u)} style={{marginRight:"6px"}}>
編集
</button>
)}

{myRole === "admin" && (
  <button onClick={() => deleteUser(u.id)}>
    削除
  </button>
)}

</td>

</tr>

))}

</tbody>

</table>


<div style={{textAlign:"center",marginTop:"30px"}}>

<button
style={{
background:"#7b5a36",
color:"#fff",
padding:"10px 20px"
}}
onClick={()=>setShowAdd(true)}
>
ユーザー追加
</button>

</div>


{/* 追加モーダル */}

{showAdd && (

<div style={{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,0.4)",
display:"flex",
alignItems:"center",
justifyContent:"center"
}}
onClick={closeAddModal}
>

<div style={{
background:"#fff",
padding:"25px",
borderRadius:"8px",
width:"400px"
}}
onClick={(e)=>e.stopPropagation()}
>

<h3>ユーザー追加</h3>

<form autoComplete="off">

<label>名前</label>

<input
value={newUser.name}
onChange={(e)=>setNewUser({...newUser,name:e.target.value})}
style={{width:"100%"}}
/>

<label>メール</label>

<input
value={newUser.email}
onChange={(e)=>setNewUser({...newUser,email:e.target.value})}
style={{width:"100%"}}
autoComplete="off"
/>

<label>パスワード</label>

<input
type="password"
value={newUser.password}
onChange={(e)=>setNewUser({...newUser,password:e.target.value})}
style={{width:"100%"}}
autoComplete="off"
/>

<label>権限</label>

<select
value={newUser.role}
onChange={(e)=>setNewUser({...newUser,role:e.target.value})}
style={{width:"100%"}}
>

<option value="admin">admin</option>
<option value="staff">staff</option>

</select>

</form>

<div style={{
display:"flex",
justifyContent:"space-between",
marginTop:"20px"
}}>

<button onClick={closeAddModal}>
キャンセル
</button>

<button
onClick={addUser}
style={{
background:"#7b5a36",
color:"#fff",
padding:"6px 16px"
}}
>
登録
</button>

</div>

</div>

</div>

)}

{showEdit && (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }}>
    <div style={{
      background: "#fff",
      padding: 20,
      borderRadius: 10,
      width: 300
    }}>

      <h3>ユーザー編集</h3>

<input
        value={editName}
        onChange={(e)=>setEditName(e.target.value)}
  placeholder="名前"
  style={{ width:"100%", marginBottom:8 }}
/>

<input
  value={editEmail}
  disabled
  style={{
    width:"100%",
    marginBottom:8,
    background:"#eee",
    color:"#666",
    cursor:"not-allowed"
  }}
/>

<p style={{ fontSize: "12px", color: "#999" }}>
  ※メール変更は再登録してください
</p>

<select
  value={editRole}
  onChange={(e)=>setEditRole(e.target.value)}
  style={{ width:"100%", marginBottom:10 }}
>
  <option value="admin">管理者</option>
  <option value="staff">スタッフ</option>
</select>

      <button onClick={saveEdit}>
        保存
      </button>

      <button onClick={()=>setShowEdit(false)}>
        キャンセル
      </button>

    </div>
  </div>
)}

</div>

</AuthGuard>

)

}
