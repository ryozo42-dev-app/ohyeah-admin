"use client"

import { useEffect,useState } from "react"
import { auth,db } from "../lib/firebase"
import { onAuthStateChanged,signOut } from "firebase/auth"
import { doc,getDoc } from "firebase/firestore"

export default function Header(){

const [name,setName]=useState("")
const [open,setOpen]=useState(false)

useEffect(()=>{

const load = async(user:any)=>{

const snap = await getDoc(doc(db,"users",user.uid))

if(snap.exists()){
setName(snap.data().name)
}

}

const unsub = onAuthStateChanged(auth,(user)=>{

if(user){
load(user)
}

})

return ()=>unsub()

},[])

const logout = async()=>{

await signOut(auth)
location.href="/login"

}

return(

<div style={{
display:"flex",
justifyContent:"flex-end",
padding:"10px 20px",
background:"#f5f5f5",
borderBottom:"1px solid #ddd"
}}>

<div style={{position:"relative"}}>

<div
onClick={()=>setOpen(!open)}
style={{cursor:"pointer",fontWeight:"bold"}}
>

{name} ▼

</div>

{open && (

<div style={{
position:"absolute",
right:0,
top:"30px",
background:"#fff",
border:"1px solid #ddd",
borderRadius:"6px",
width:"160px"
}}>

<div
onClick={()=>location.href="/password"}
style={{padding:"10px",cursor:"pointer"}}
>

パスワード変更

</div>

<div
onClick={logout}
style={{padding:"10px",cursor:"pointer"}}
>

ログアウト

</div>

</div>

)}

</div>

</div>

)

}