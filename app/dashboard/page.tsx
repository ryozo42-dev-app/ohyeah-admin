"use client"

import { useEffect,useState } from "react"
import { collection,getDocs } from "firebase/firestore"
import { db } from "../../lib/firebase"
import AuthGuard from "../../components/AuthGuard"

export default function Dashboard(){

const [drink,setDrink]=useState(0)
const [food,setFood]=useState(0)
const [news,setNews]=useState(0)
const [latestNews,setLatestNews]=useState<any[]>([])

useEffect(()=>{

const load=async()=>{

const d=await getDocs(collection(db,"menu_items"))
setDrink(d.docs.filter(v=>v.data().category==="drink").length)

const f=await getDocs(collection(db,"menu_foods"))
setFood(f.size)

const n=await getDocs(collection(db,"news"))
setNews(n.size)

const newsSnap=await getDocs(collection(db,"news"))

const sorted=newsSnap.docs
.map(d=>d.data())
.sort((a,b)=>b.date?.seconds-a.date?.seconds)
.slice(0,3)

setLatestNews(sorted)

}

load()

},[])

return(

<AuthGuard>

<div style={{
padding:"30px",
maxWidth:"900px",
margin:"0 auto"
}}>

<h1 style={{marginBottom:"20px"}}>Dashboard</h1>

<div style={{
display:"flex",
gap:"20px"
}}>

<div style={card}>
<h3>Drink</h3>
<p style={num}>{drink}</p>
</div>

<div style={card}>
<h3>Food</h3>
<p style={num}>{food}</p>
</div>

<div style={card}>
<h3>News</h3>
<p style={num}>{news}</p>
</div>

</div>

<div style={{marginTop:"40px"}}>

<h2>最新ニュース</h2>

<ul style={{marginTop:"10px"}}>

{latestNews.map((n,i)=>(

<li key={i} style={{marginBottom:"6px"}}>
{n.title}
</li>

))}

</ul>

</div>

</div>

</AuthGuard>

)

}

const card:React.CSSProperties={
background:"#fff",
padding:"30px",
borderRadius:"8px",
width:"200px",
textAlign:"center",
boxShadow:"0 4px 10px rgba(0,0,0,0.1)"
}

const num:React.CSSProperties={
fontSize:"32px",
fontWeight:"bold"
}