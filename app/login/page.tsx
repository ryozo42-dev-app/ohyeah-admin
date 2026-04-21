"use client"

import { useState } from "react"
import {
signInWithEmailAndPassword,
setPersistence,
browserLocalPersistence
} from "firebase/auth"
import { auth } from "../../lib/firebase"


export default function Login(){

const [email,setEmail]=useState("")
const [password,setPassword]=useState("")

const login = async () => {

try{

await setPersistence(auth, browserLocalPersistence)

await signInWithEmailAndPassword(auth,email,password)

location.href="/dashboard"

}catch(e){

alert("ログイン失敗")

}

}

return(

<div style={{
display:"flex",
flexDirection:"column",
alignItems:"center",
paddingTop:"120px",
height:"100vh",
background:"#f2f2f2"
}}>

{/* ADMIN LOGO */}

<h1 style={{
marginBottom:"30px",
fontWeight:"bold",
letterSpacing:"2px"
}}>
ADMIN
</h1>

{/* LOGIN CARD */}

<div style={{
background:"#fff",
padding:"40px",
borderRadius:"10px",
width:"320px",
boxShadow:"0 10px 30px rgba(0,0,0,0.15)"
}}>

<h2 style={{
textAlign:"center",
marginBottom:"20px"
}}>
Admin Login
</h2>

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={{
width:"100%",
padding:"10px",
marginBottom:"12px",
border:"1px solid #ccc",
borderRadius:"4px"
}}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{
width:"100%",
padding:"10px",
marginBottom:"18px",
border:"1px solid #ccc",
borderRadius:"4px"
}}
/>

<button
onClick={login}
style={{
width:"100%",
padding:"10px",
background:"#7b5a36",
color:"#fff",
border:"none",
borderRadius:"4px",
fontWeight:"bold",
cursor:"pointer"
}}
>
LOGIN
</button>

</div>

</div>

)

}