"use client"

import AuthGuard from "../../components/AuthGuard"
import { useEffect,useState } from "react"
import {
collection,
getDocs,
query,
orderBy,
deleteDoc,
doc,
addDoc,
updateDoc
} from "firebase/firestore"

import {
ref,
uploadBytes,
getDownloadURL,
deleteObject
} from "firebase/storage"

import { db, storage } from "../../lib/firebase"

type Food={
id?:string
name:string
name_en:string
foodCategory:string
description:string
price:number|string
imageUrl?:string
}

export default function Foods(){

const [foods,setFoods]=useState<Food[]>([])
const [selected,setSelected]=useState<string[]>([])

const [page,setPage]=useState(1)
const perPage=6

const [nameFilter,setNameFilter]=useState("")
const [enFilter,setEnFilter]=useState("")
const [catFilter,setCatFilter]=useState("")

const [showEdit,setShowEdit]=useState(false)
const [editFood,setEditFood]=useState<Food|null>(null)
const [editImage,setEditImage]=useState<File|null>(null)
const [preview,setPreview]=useState<string | null>(null)

const [showImage,setShowImage]=useState(false)
const [modalImage,setModalImage]=useState("")
const [showImageModal,setShowImageModal]=useState(false)
const [showImageEditModal,setShowImageEditModal]=useState(false)
const [targetFoodId,setTargetFoodId]=useState("")
const [newImage,setNewImage]=useState<File|null>(null)
const [previewImage,setPreviewImage]=useState<string | null>(null)

const [showAddModal,setShowAddModal]=useState(false)

const [newFood,setNewFood]=useState({
name:"",
name_en:"",
foodCategory:"pizza",
description:"",
price:"",
image:null as File | null
})

const [previewAdd,setPreviewAdd]=useState<string | null>(null)

const [showPriceModal,setShowPriceModal]=useState(false)
const [newPrice,setNewPrice]=useState("")

const [showCategoryModal,setShowCategoryModal]=useState(false)
const [newCategory,setNewCategory]=useState("")

// =========================
// 共通画像処理（完全版）
// =========================
const processImage = async (file: File) => {

  const img = new Image()
  img.src = URL.createObjectURL(file)

  await new Promise((resolve) => {
    img.onload = resolve
  })

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  // 横幅固定（スマホ最適）
  const maxWidth = 800
  const scale = maxWidth / img.width

  canvas.width = maxWidth
  canvas.height = img.height * scale

  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

  // JPEG圧縮（軽量化）
  const blob: Blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.7)
  })

  // ファイル名強制
  const fileName = `food_${Date.now()}.jpg`

  const storageRef = ref(storage, `foods/${fileName}`)

  await uploadBytes(storageRef, blob)

  const url = await getDownloadURL(storageRef)

  return url
}

const deleteOldImage = async (url: string) => {

  try {

    if(!url) return

    // URL → パス抽出
    const decoded = decodeURIComponent(url)
    const path = decoded.split("/o/")[1].split("?")[0]

    const imageRef = ref(storage, path)

    await deleteObject(imageRef)

  } catch (e) {
    console.log("旧画像削除失敗（無視OK）", e)
  }

}

/* -------------------------
load
------------------------- */

useEffect(()=>{

const load=async()=>{

const q = query(
collection(db,"menu_foods"),
orderBy("order","asc")
)

const snap = await getDocs(q)

const list=snap.docs.map(doc=>{

const d=doc.data()

return{
id:doc.id,
name:d.name||"",
name_en:d.name_en||"",
foodCategory:d.foodCategory||"",
description:d.description||"",
price:d.price||0,
imageUrl:d.imageUrl||""
}

})

setFoods(list)

}

load()

},[])

/* -------------------------
filter
------------------------- */

const filtered=foods.filter(d=>{

if(nameFilter && !d.name.includes(nameFilter)) return false
if(enFilter && !d.name_en.includes(enFilter)) return false
if(catFilter && d.foodCategory!==catFilter) return false

return true

})

/* -------------------------
pagination
------------------------- */

const start=(page-1)*perPage
const end=start+perPage
const view=filtered.slice(start,end)

const totalPage=Math.ceil(filtered.length/perPage)
const pages=Array.from({length:totalPage},(_,i)=>i+1)

/* -------------------------
checkbox
------------------------- */

const toggleSelect=(id:string)=>{

if(selected.includes(id)){
setSelected(selected.filter(n=>n!==id))
}else{
setSelected([...selected,id])
}

}

/* -------------------------
delete
------------------------- */

const deleteRow=async(id:string)=>{

if(!confirm("削除しますか？")) return

await deleteDoc(doc(db,"menu_foods",id))

setFoods(foods.filter(d=>d.id!==id))

}

const bulkDelete = async () => {

if(selected.length===0){
alert("データを選択してください")
return
}

if(!confirm("削除しますか？")) return

for(const id of selected){

await deleteDoc(doc(db,"menu_foods",id))

}

setFoods(foods.filter(f=>!selected.includes(f.id!)))
setSelected([])

}

const changePrice = async () => {

if(selected.length===0 || !newPrice){
alert("価格を入力してください")
return
}

for(const id of selected){

await updateDoc(doc(db,"menu_foods",id),{
price:Number(newPrice)
})

}

setFoods(
foods.map(f=>
selected.includes(f.id!)
? {...f,price:Number(newPrice)}
: f
)
)

setSelected([])
setShowPriceModal(false)
setNewPrice("")

}

const changeCategory = async () => {

if(selected.length===0 || !newCategory){
alert("カテゴリーを選択してください")
return
}

for(const id of selected){

await updateDoc(doc(db,"menu_foods",id),{
foodCategory:newCategory
})

}

setFoods(
foods.map(f=>
selected.includes(f.id!)
? {...f,foodCategory:newCategory}
: f
)
)

setSelected([])

setShowCategoryModal(false)

}

const changeImage = async () => {

if(!newImage || !targetFoodId){
alert("画像を選択してください")
return
}

const target = foods.find(f=>f.id===targetFoodId)

// ★古い画像削除
if(target?.imageUrl){
await deleteOldImage(target.imageUrl)
}

const url = await processImage(newImage)

await updateDoc(doc(db,"menu_foods",targetFoodId),{
imageUrl:url
})

setFoods(
foods.map(f=>
f.id===targetFoodId
? {...f,imageUrl:url}
: f
)
)

setShowImageEditModal(false)
setNewImage(null)
setPreviewImage(null)

}

const addFood = async () => {

  if (!newFood.name) {
    alert("名前を入力してください")
    return
  }

  const snap = await getDocs(collection(db, "menu_foods"))

  let maxOrder = 0

  snap.docs.forEach(d => {
    const o = d.data().order || 0
    if (o > maxOrder) maxOrder = o
  })

  const nextOrder = maxOrder + 1

  let imageUrl = ""

  if (newFood.image) {
    imageUrl = await processImage(newFood.image)
  }

  await addDoc(collection(db, "menu_foods"), {

    name: newFood.name,
    name_en: newFood.name_en,
    foodCategory: newFood.foodCategory,
    description: newFood.description,
    price: Number(newFood.price),
    imageUrl,
    order: nextOrder,
    isActive: true

  })

  setShowAddModal(false)
  location.reload()
}

const saveEdit=async()=>{

if(!editFood?.id) return

let imageUrl=editFood.imageUrl||""

if(editImage){

if(editFood.imageUrl){
await deleteOldImage(editFood.imageUrl)
}

imageUrl = await processImage(editImage)

}

await updateDoc(doc(db,"menu_foods",editFood.id),{

name:editFood.name,
name_en:editFood.name_en,
foodCategory:editFood.foodCategory,
description:editFood.description,
price:Number(editFood.price),
    imageUrl

})

setFoods(
foods.map(f=>
f.id===editFood.id
? {...editFood,imageUrl}
: f
)
)

setShowEdit(false)
setPreview(null)
setEditImage(null)

}

const exportCSV = () => {

const headers = [
"名前",
"英語名",
"カテゴリー",
"説明",
"価格"
]

const rows = filtered.map(f => [

f.name,
f.name_en,
f.foodCategory,
f.description,
f.price

])

let csv = "\uFEFF" + headers.join(",") + "\n"

rows.forEach(r => {
csv += r.join(",") + "\n"
})

const blob = new Blob([csv], {
type: "text/csv;charset=utf-8;"
})

const link = document.createElement("a")

link.href = URL.createObjectURL(blob)

link.download = "food_list.csv"

link.click()

}

/* =========================
UI
========================= */

return(

<AuthGuard>

<div style={{padding:"10px 30px"}}>

<style>{`
  /* number input の上下ボタン削除 */
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }
`}</style>

<h1 style={{textAlign:"center"}}>Food管理システム</h1>

<div id="printTitle" style={{display:"none",textAlign:"center",marginBottom:"20px"}}>

<h1 style={{margin:0}}>Cafe Bar Oh Yeah</h1>

<h2 style={{margin:0}}>Food Menu List</h2>

</div>

<table
id="foodTable"
style={{
width:"100%",
borderCollapse:"collapse",
background:"#fff",
tableLayout:"fixed"
}}
>

<thead>

<tr style={{background:"#ddd"}}>

<th style={{width:"40px",border:"1px solid #ccc"}}></th>

<th style={{width:"70px",border:"1px solid #ccc"}}>画像</th>

<th style={{width:"170px",border:"1px solid #ccc"}}>名前</th>

<th style={{width:"170px",border:"1px solid #ccc"}}>英語名</th>

<th style={{width:"150px",border:"1px solid #ccc"}}>カテゴリー</th>

<th style={{border:"1px solid #ccc"}}>説明</th>

<th style={{width:"80px",border:"1px solid #ccc"}}>価格</th>

<th style={{width:"120px",border:"1px solid #ccc"}}>操作</th>

</tr>

<tr style={{background:"#eee"}}>

<th>

<input
type="checkbox"
onChange={(e)=>{

if(e.target.checked){
setSelected(view.map(d=>d.id!))
}else{
setSelected([])
}

}}
/>

</th>

<th></th>

<th>

<input
placeholder="名前検索"
value={nameFilter}
onChange={(e)=>setNameFilter(e.target.value)}
style={{width:"90%"}}
/>

</th>

<th>

<input
placeholder="英語検索"
value={enFilter}
onChange={(e)=>setEnFilter(e.target.value)}
style={{width:"90%"}}
/>

</th>

<th>

<select
value={catFilter}
onChange={(e)=>setCatFilter(e.target.value)}
style={{width:"100%"}}
>

<option value="">すべて</option>
<option value="pizza">pizza</option>
<option value="fried">fried</option>
<option value="other">other</option>

</select>

</th>

<th style={{textAlign:"left"}}>

<button>検索</button>

<button
onClick={()=>{
setNameFilter("")
setEnFilter("")
setCatFilter("")
}}
style={{marginLeft:"6px"}}
>
クリア
</button>

<button
onClick={()=>window.print()}
style={{marginLeft:"6px"}}
>
印刷
</button>

</th>

<th></th>
<th></th>

</tr>

</thead>

<tbody>

{view.map((d,i)=>(

<tr key={d.id||i}>

<td style={{border:"1px solid #ddd",textAlign:"center"}}>

<input
type="checkbox"
checked={selected.includes(d.id!)}
onChange={()=>toggleSelect(d.id!)}
/>

</td>

<td style={{border:"1px solid #ddd",textAlign:"center"}}>

{d.imageUrl && (

<img
src={d.imageUrl}
style={{
height:"50px",
width:"60px",
objectFit:"cover",
borderRadius:"6px",
cursor:"pointer"
}}
onClick={()=>{
setModalImage(d.imageUrl || "")
setTargetFoodId(d.id!)
setShowImageModal(true)
}}
/>

)}

</td>

<td style={{border:"1px solid #ddd",padding:"6px"}}>{d.name}</td>

<td style={{border:"1px solid #ddd",padding:"6px"}}>{d.name_en}</td>

<td style={{border:"1px solid #ddd",padding:"6px"}}>{d.foodCategory}</td>

<td style={{border:"1px solid #ddd",padding:"6px"}}>{d.description}</td>

<td style={{border:"1px solid #ddd",textAlign:"right"}}>¥{d.price}</td>

<td style={{border:"1px solid #ddd",textAlign:"center"}}>

<button
onClick={()=>{
setEditFood({...d})
setPreview(null)
setEditImage(null)
setShowEdit(true)
}}
>
編集
</button>

<button
onClick={()=>deleteRow(d.id!)}
style={{marginLeft:"6px"}}
>
削除
</button>

</td>

</tr>

))}

</tbody>

</table>

<div style={{marginTop:"10px"}}>
選択 {selected.length} 件
</div>

{/* ページ */}

<div style={{
display:"flex",
justifyContent:"center",
gap:"6px",
marginTop:"15px"
}}>

<button onClick={()=>page>1 && setPage(page-1)}>◀</button>

{pages.map(p=>(
<button
key={p}
onClick={()=>setPage(p)}
style={{
padding:"4px 10px",
background: page===p ? "#7b5a36" : "#fff",
color: page===p ? "#fff" : "#000",
border:"1px solid #999"
}}
>
{p}
</button>
))}

<button onClick={()=>page<totalPage && setPage(page+1)}>▶</button>

</div>

{/* ボタン */}

<div style={{
display:"flex",
justifyContent:"center",
gap:"12px",
marginTop:"20px",
flexWrap:"wrap"
}}>

<button
style={{background:"#7b5a36",color:"#fff",padding:"8px 16px"}}
onClick={() => setShowAddModal(true)}
>
フード登録
</button>

<button
style={{background:"#7b5a36",color:"#fff",padding:"8px 16px"}}
onClick={()=>setShowPriceModal(true)}
>
一括価格変更
</button>

<button
style={{background:"#7b5a36",color:"#fff",padding:"8px 16px"}}
onClick={()=>setShowCategoryModal(true)}
>
一括カテゴリー変更
</button>

<button
style={{background:"#b00020",color:"#fff",padding:"8px 16px"}}
onClick={bulkDelete}
>
一括削除
</button>

<button
style={{
background:"#2e7d32",
color:"#fff",
padding:"8px 16px"
}}
onClick={exportCSV}
>
CSV出力
</button>

<button
style={{background:"#555",color:"#fff",padding:"8px 16px"}}
onClick={()=>window.print()}
>
一覧印刷
</button>

</div>

{showEdit && editFood && (

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
width:"420px"
}}
>

<h3 style={{marginBottom:"15px"}}>フード編集</h3>

<label>名前</label>
<input
value={editFood.name}
onChange={(e)=>setEditFood({...editFood,name:e.target.value})}
style={{width:"100%"}}
/>

<label>英語名</label>
<input
value={editFood.name_en}
onChange={(e)=>setEditFood({...editFood,name_en:e.target.value})}
style={{width:"100%"}}
/>

<label>カテゴリー</label>

<select
value={editFood.foodCategory}
onChange={(e)=>setEditFood({...editFood,foodCategory:e.target.value})}
style={{width:"100%"}}
>

<option value="pizza">pizza</option>
<option value="fried">fried</option>
<option value="other">other</option>

</select>

<label>説明</label>

<input
value={editFood.description}
onChange={(e)=>setEditFood({...editFood,description:e.target.value})}
style={{width:"100%"}}
/>

<label>価格</label>

<input
type="number"
value={editFood.price}
onChange={(e)=>setEditFood({...editFood,price:Number(e.target.value)})}
style={{width:"100%"}}
/>

<label>画像変更</label>

<input
type="file"
accept="image/*"
onChange={(e)=>{

if(!e.target.files) return

const file=e.target.files[0]

setEditImage(file)

setPreview(URL.createObjectURL(file))

}}
/>

{preview && (

<img
src={preview}
style={{
marginTop:"12px",
width:"140px",
height:"140px",
objectFit:"cover",
borderRadius:"8px",
border:"1px solid #ccc"
}}
/>

)}

<div
style={{
marginTop:"20px",
display:"flex",
justifyContent:"flex-end",
gap:"10px"
}}
>

<button
onClick={()=>{
setShowEdit(false)
setPreview(null)
setEditImage(null)
}}
>
キャンセル
</button>

<button onClick={saveEdit}>
保存
</button>

</div>

</div>

</div>

)}

{showImageModal && (

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
}}>

<div style={{
background:"#fff",
padding:"20px",
borderRadius:"8px",
width:"420px",
textAlign:"center"
}}>

<img
src={modalImage}
style={{
maxWidth:"100%",
maxHeight:"300px"
}}
/>

<div style={{
marginTop:"15px",
display:"flex",
justifyContent:"space-between"
}}>

<button
onClick={()=>{
setShowImageModal(false)
setShowImageEditModal(true)
}}
>
画像変更
</button>

<button onClick={()=>{
setShowImageModal(false)
setNewImage(null)
setPreviewImage(null)
}}>
閉じる
</button>

</div>

</div>

</div>

)}

{showImageEditModal && (

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
}}>

<div style={{
background:"#fff",
padding:"25px",
borderRadius:"8px",
width:"420px"
}}>

<h3>画像変更</h3>

<input
type="file"
accept="image/*"
onChange={(e) => {

if(!e.target.files) return

const file = e.target.files[0]

setNewImage(file)

setPreviewImage(URL.createObjectURL(file))

}}
/>

{previewImage && (

<img
src={previewImage}
style={{
marginTop:"12px",
width:"160px",
height:"160px",
objectFit:"cover",
borderRadius:"8px",
border:"1px solid #ccc"
}}
/>

)}

<div style={{
marginTop:"20px",
display:"flex",
justifyContent:"space-between"
}}>

<button onClick={()=>{
setShowImageEditModal(false)
setNewImage(null)
setPreviewImage(null)
}}>
キャンセル
</button>

<button onClick={changeImage}>
変更
</button>

</div>

</div>

</div>

)}

{showAddModal && (

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
width:"420px"
}}
>

<h3 style={{marginBottom:"15px"}}>フード登録</h3>

<label>名前</label>
<input
value={newFood.name}
onChange={(e)=>setNewFood({...newFood,name:e.target.value})}
style={{width:"100%"}}
/>

<label>英語名</label>
<input
value={newFood.name_en}
onChange={(e)=>setNewFood({...newFood,name_en:e.target.value})}
style={{width:"100%"}}
/>

<label>カテゴリー</label>

<select
value={newFood.foodCategory}
onChange={(e)=>setNewFood({...newFood,foodCategory:e.target.value})}
style={{width:"100%"}}
>

<option value="pizza">pizza</option>
<option value="fried">fried</option>
<option value="other">other</option>

</select>

<label>説明</label>

<input
value={newFood.description}
onChange={(e)=>setNewFood({...newFood,description:e.target.value})}
style={{width:"100%"}}
/>

<label>価格</label>

<input
type="number"
value={newFood.price}
onChange={(e)=>setNewFood({...newFood,price:e.target.value})}
style={{width:"100%"}}
/>

<label>画像</label>

<input
type="file"
accept="image/*"
onChange={(e)=>{

if(!e.target.files) return

const file=e.target.files[0]

setNewFood({...newFood,image:file})

setPreviewAdd(URL.createObjectURL(file))

}}
/>

{previewAdd && (

<img
src={previewAdd}
style={{
marginTop:"10px",
width:"140px",
height:"140px",
objectFit:"cover",
borderRadius:"8px",
border:"1px solid #ccc"
}}
/>

)}

<div
style={{
marginTop:"20px",
display:"flex",
justifyContent:"space-between"
}}
>

<button onClick={()=>setShowAddModal(false)}>
キャンセル
</button>

<button onClick={addFood}>
登録
</button>

</div>

</div>

</div>

)}

{showPriceModal && (

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
}}>

<div style={{
background:"#fff",
padding:"25px",
borderRadius:"8px",
width:"320px"
}}>

<h3>一括価格変更</h3>

<input
type="number"
placeholder="新価格"
value={newPrice}
onChange={(e)=>setNewPrice(e.target.value)}
style={{width:"100%",marginTop:"10px"}}
/>

<div style={{
marginTop:"20px",
display:"flex",
justifyContent:"space-between"
}}>

<button onClick={()=>{
setShowPriceModal(false)
setNewPrice("")
}}>
キャンセル
</button>

<button onClick={changePrice}>
変更
</button>

</div>

</div>

</div>

)}

{showCategoryModal && (

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
}}>

<div style={{
background:"#fff",
padding:"25px",
borderRadius:"8px",
width:"320px"
}}>

<h3>一括カテゴリー変更</h3>

<select
value={newCategory}
onChange={(e)=>setNewCategory(e.target.value)}
style={{width:"100%",marginTop:"10px"}}
>

<option value="">選択</option>
<option value="pizza">pizza</option>
<option value="fried">fried</option>
<option value="other">other</option>

</select>

<div style={{
marginTop:"20px",
display:"flex",
justifyContent:"space-between"
}}>

<button onClick={()=>setShowCategoryModal(false)}>
キャンセル
</button>

<button onClick={changeCategory}>
変更
</button>

</div>

</div>

</div>

)}

<style jsx global>{`

@media print {

/* 全体非表示 */

body * {
visibility: hidden;
}

/* タイトル表示 */

#printTitle,
#printTitle *{
visibility:visible;
}

/* テーブル表示 */

#foodTable,
#foodTable * {
visibility: visible;
}

/* 配置 */

#printTitle{
position:absolute;
top:0;
left:0;
width:100%;
display:block;
}

#foodTable {
position: absolute;
top:80px;
left: 0;
width: 100%;
}

/* ボタン非表示 */

button {
display:none !important;
}

input {
display:none !important;
}

select {
display:none !important;
}

}

`}</style>

</div>

</AuthGuard>

)

}