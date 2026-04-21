"use client"

import AuthGuard from "../../components/AuthGuard"

import { useEffect,useState } from "react"

import {
collection,
getDocs,
doc,
setDoc
} from "firebase/firestore"

import {
ref,
uploadBytes,
getDownloadURL
} from "firebase/storage"

import { db,storage } from "../../lib/firebase"

type Slide={
id:string
imageUrl:string
}

export default function Slider(){

const [slides,setSlides] = useState<Slide[]>([])

const [showModal,setShowModal] = useState(false)
const [currentSlide,setCurrentSlide] = useState<Slide|null>(null)

const [newImage,setNewImage] = useState<File | null>(null)
const [preview,setPreview] = useState("")

/* -------------------------
load
------------------------- */

useEffect(()=>{

const load = async()=>{

const snap = await getDocs(collection(db,"slider_images"))

const list = snap.docs.map(d=>({

id:d.id,
imageUrl:d.data().imageUrl

}))

setSlides(list)

}

load()

},[])

/* -------------------------
file select
------------------------- */

const handleFile = (e:any)=>{

const file = e.target.files[0]

if(!file) return

if(!file.type.includes("jpeg") && !file.type.includes("jpg")){
alert("JPG / JPEGのみアップロード可能です")
return
}

setNewImage(file)

setPreview(URL.createObjectURL(file))

}

/* -------------------------
save image
------------------------- */

const saveImage = async()=>{

if(!newImage || !currentSlide) return

const storageRef = ref(storage,`slider/${currentSlide.id}.jpg`)

await uploadBytes(storageRef,newImage)

const url = await getDownloadURL(storageRef)

await setDoc(doc(db,"slider_images",currentSlide.id),{

imageUrl:url,
isActive:true

})

setSlides(
slides.map(s=>
s.id===currentSlide.id
? {...s,imageUrl:url}
: s
)
)

setShowModal(false)

}

/* =========================
UI
========================= */

return(

<AuthGuard>

<div style={{padding:"30px"}}>

<h1 style={{textAlign:"center"}}>Slider管理</h1>

<div
style={{
maxWidth:"1000px",
margin:"0 auto",
display:"grid",
gridTemplateColumns:"repeat(3,260px)",
columnGap:"60px",
rowGap:"40px",
justifyContent:"center",
marginTop:"30px"
}}
>

{slides.map((s,i)=>(

<div key={s.id} style={{textAlign:"center"}}>

<img
src={s.imageUrl}
style={{
width:"260px",
aspectRatio:"16 / 9",
objectFit:"cover",
borderRadius:"8px",
boxShadow:"0 6px 16px rgba(0,0,0,0.15)"
}}
/>

<button
onClick={()=>{
setCurrentSlide(s)
setPreview("")
setNewImage(null)
setShowModal(true)
}}
style={{
marginTop:"12px",
background:"#7b5a36",
color:"#fff",
padding:"8px 16px",
borderRadius:"6px",
cursor:"pointer"
}}
>
画像変更
</button>

</div>

))}

</div>


{/* -------------------------
image modal
------------------------- */}

{showModal && currentSlide && (

<div
style={{
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
>

<div
style={{
background:"#fff",
padding:"25px",
borderRadius:"8px",
width:"420px",
textAlign:"center"
}}
>

<h3>画像変更</h3>

<p>現在の画像</p>

<img
src={currentSlide.imageUrl}
style={{
width:"100%",
aspectRatio:"16 / 9",
objectFit:"cover",
borderRadius:"6px"
}}
/>

{preview && (

<>
<p style={{marginTop:"15px"}}>新しい画像</p>

<img
src={preview}
style={{
width:"100%",
aspectRatio:"16 / 9",
objectFit:"cover",
borderRadius:"6px"
}}
/>
</>

)}

<input
type="file"
onChange={handleFile}
style={{marginTop:"15px"}}
/>

<div
style={{
marginTop:"20px",
display:"flex",
justifyContent:"space-between"
}}
>

<button onClick={()=>setShowModal(false)}>
キャンセル
</button>

<button
onClick={saveImage}
style={{
background:"#7b5a36",
color:"#fff",
padding:"6px 16px"
}}
>
変更
</button>

</div>

</div>

</div>

)}

</div>

</AuthGuard>

)

}