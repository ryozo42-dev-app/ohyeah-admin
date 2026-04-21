"use client"

import AuthGuard from "../../components/AuthGuard"
import { useEffect, useState } from "react"
import {
collection,
getDocs,
query,
orderBy,
deleteDoc,
updateDoc,
addDoc,
doc
} from "firebase/firestore"

import { db } from "../../lib/firebase"

type Drink={
id?:string
name:string
name_en:string
drinkCategory:string
description:string
price:number|string
}

export default function Drinks(){

const [drinks,setDrinks]=useState<Drink[]>([])
const [categories,setCategories]=useState<string[]>([])
const [selected,setSelected]=useState<string[]>([])

const [page,setPage]=useState(1)
const perPage=10

const [nameFilter,setNameFilter]=useState("")
const [enFilter,setEnFilter]=useState("")
const [catFilter,setCatFilter]=useState("")

const [showEdit,setShowEdit]=useState(false)
const [editDrink,setEditDrink]=useState<Drink|null>(null)

const [showPriceModal,setShowPriceModal]=useState(false)
const [newPrice,setNewPrice]=useState("")

const [showCategoryModal,setShowCategoryModal]=useState(false)
const [newCategory,setNewCategory]=useState("")

const [showAddModal,setShowAddModal]=useState(false)

const [newDrinks,setNewDrinks]=useState([
{name:"",name_en:"",drinkCategory:"",description:"",price:""},
{name:"",name_en:"",drinkCategory:"",description:"",price:""},
{name:"",name_en:"",drinkCategory:"",description:"",price:""},
{name:"",name_en:"",drinkCategory:"",description:"",price:""},
{name:"",name_en:"",drinkCategory:"",description:"",price:""}
])

useEffect(()=>{

const load=async()=>{

const q=query(
collection(db,"menu_items"),
orderBy("order","asc")
)

const snapshot=await getDocs(q)

const list=snapshot.docs.map(doc=>{

const d=doc.data()

return{
id:doc.id,
name:d.name||"",
name_en:d.name_en||"",
drinkCategory:d.drinkCategory||"",
description:d.description||"",
price:d.price||0
}

})

setDrinks(list)

const setCat=new Set<string>()

list.forEach(d=>{
if(d.drinkCategory) setCat.add(d.drinkCategory)
})

setCategories(Array.from(setCat))

}

load()

},[])

const filtered=drinks.filter(d=>{

if(nameFilter && !d.name.includes(nameFilter)) return false
if(enFilter && !d.name_en.includes(enFilter)) return false
if(catFilter && d.drinkCategory!==catFilter) return false

return true

})

const start=(page-1)*perPage
const end=start+perPage
const view=filtered.slice(start,end)

const totalPage=Math.ceil(filtered.length/perPage)
const pages=Array.from({length:totalPage},(_,i)=>i+1)

const toggleSelect=(id:string)=>{

if(selected.includes(id)){
setSelected(selected.filter(n=>n!==id))
}else{
setSelected([...selected,id])
}

}

const deleteRow=async(id:string)=>{

if(!confirm("削除しますか？")) return

await deleteDoc(doc(db,"menu_items",id))

setDrinks(drinks.filter(d=>d.id!==id))

}

const saveEdit=async()=>{

if(!editDrink?.id) return

await updateDoc(doc(db,"menu_items",editDrink.id),{

name:editDrink.name,
name_en:editDrink.name_en,
drinkCategory:editDrink.drinkCategory,
description:editDrink.description,
price:Number(editDrink.price)

})

setDrinks(
drinks.map(d=>
d.id===editDrink.id ? {...editDrink} : d
)
)

setShowEdit(false)

}

const bulkDelete=async()=>{

if(selected.length===0) return alert("データを選択してください")

if(!confirm("削除しますか？")) return

for(const id of selected){
await deleteDoc(doc(db,"menu_items",id))
}

setDrinks(drinks.filter(d=>!selected.includes(d.id!)))
setSelected([])

}

const changePrice=async()=>{

if(selected.length===0 || !newPrice)
return alert("価格を入力してください")

for(const id of selected){

await updateDoc(doc(db,"menu_items",id),{
price:Number(newPrice)
})

}

setDrinks(
drinks.map(d=>
selected.includes(d.id!)
? {...d,price:Number(newPrice)}
: d
)
)

setSelected([])
setShowPriceModal(false)

}

const changeCategory=async()=>{

if(selected.length===0 || !newCategory)
return alert("カテゴリーを選択してください")

for(const id of selected){

await updateDoc(doc(db,"menu_items",id),{
drinkCategory:newCategory
})

}

setDrinks(
drinks.map(d=>
selected.includes(d.id!)
? {...d,drinkCategory:newCategory}
: d
)
)

setSelected([])
setShowCategoryModal(false)

}

const exportCSV=()=>{

const headers=["名前","英語名","カテゴリー","説明","価格"]

const rows=filtered.map(d=>[
d.name,
d.name_en,
d.drinkCategory,
d.description,
d.price
])

let csv="\uFEFF"+headers.join(",")+"\n"

rows.forEach(r=>{
csv+=r.join(",")+"\n"
})

const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"})

const link=document.createElement("a")
link.href=URL.createObjectURL(blob)
link.download="drink_list.csv"
link.click()

}

const addDrinks=async()=>{

const targets=newDrinks.filter(d=>d.name.trim()!=="")

if(targets.length===0) return alert("名前を入力してください")

for(const d of targets){

await addDoc(collection(db,"menu_items"),{

name:d.name,
name_en:d.name_en,
drinkCategory:d.drinkCategory,
description:d.description,
price:d.price===""?0:Number(d.price),
order:999,
isActive:true,
category:"drink"

})

}

setShowAddModal(false)

}

return(

<AuthGuard>

<div style={{padding:"10px 30px"}}>

<h1 style={{textAlign:"center"}}>Drink管理システム</h1>

<table style={{width:"100%",borderCollapse:"collapse",background:"#fff",tableLayout:"fixed"}}>

<thead>

<tr style={{background:"#ddd"}}>
<th style={{width:"40px",border:"1px solid #ccc"}}></th>
<th style={{width:"200px",border:"1px solid #ccc"}}>名前</th>
<th style={{width:"200px",border:"1px solid #ccc"}}>英語名</th>
<th style={{width:"200px",border:"1px solid #ccc"}}>カテゴリー</th>
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

<th>
<input placeholder="名前検索" value={nameFilter}
onChange={(e)=>setNameFilter(e.target.value)}
style={{width:"90%"}}/>
</th>

<th>
<input placeholder="英語検索" value={enFilter}
onChange={(e)=>setEnFilter(e.target.value)}
style={{width:"90%"}}/>
</th>

<th>
<select value={catFilter}
onChange={(e)=>setCatFilter(e.target.value)}
style={{width:"100%"}}>
<option value="">すべて</option>
{categories.map(c=><option key={c}>{c}</option>)}
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
<input type="checkbox"
checked={selected.includes(d.id!)}
onChange={()=>toggleSelect(d.id!)}/>
</td>

<td style={{border:"1px solid #ddd",padding:"6px"}}>{d.name}</td>
<td style={{border:"1px solid #ddd",padding:"6px"}}>{d.name_en}</td>
<td style={{border:"1px solid #ddd",padding:"6px"}}>{d.drinkCategory}</td>
<td style={{border:"1px solid #ddd",padding:"6px"}}>{d.description}</td>
<td style={{border:"1px solid #ddd",textAlign:"right"}}>¥{d.price}</td>

<td style={{border:"1px solid #ddd",textAlign:"center"}}>

<button
onClick={()=>{
setEditDrink({...d})
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

<div style={{display:"flex",justifyContent:"center",gap:"6px",marginTop:"15px"}}>

<button onClick={()=>page>1 && setPage(page-1)}>◀</button>

{pages.map(p=>(
<button
key={p}
onClick={()=>setPage(p)}
style={{
padding:"4px 10px",
background: page===p ? "#7b5a36" : "#fff",
color: page===p ? "#fff" : "#000",
border:"1px solid #999",
cursor:"pointer"
}}
>
{p}
</button>
))}

<button onClick={()=>page<totalPage && setPage(page+1)}>▶</button>

</div>

<div style={{display:"flex",justifyContent:"center",gap:"12px",marginTop:"20px",flexWrap:"wrap"}}>

<button style={{background:"#7b5a36",color:"#fff",padding:"8px 16px"}}
onClick={()=>setShowAddModal(true)}>
一括ドリンク登録
</button>

<button style={{background:"#7b5a36",color:"#fff",padding:"8px 16px"}}
onClick={()=>setShowPriceModal(true)}>
一括価格変更
</button>

<button style={{background:"#7b5a36",color:"#fff",padding:"8px 16px"}}
onClick={()=>setShowCategoryModal(true)}>
一括カテゴリー変更
</button>

<button style={{background:"#b00020",color:"#fff",padding:"8px 16px"}}
onClick={bulkDelete}>
一括削除
</button>

<button style={{background:"#2e7d32",color:"#fff",padding:"8px 16px"}}
onClick={exportCSV}>
CSV出力
</button>

<button style={{background:"#555",color:"#fff",padding:"8px 16px"}}
onClick={()=>window.print()}>
一覧印刷
</button>

</div>

{/* 編集モーダル */}

{showEdit && editDrink && (

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

<h3 style={{marginBottom:"15px"}}>ドリンク編集</h3>

<label>名前</label>
<input
value={editDrink.name}
onChange={(e)=>setEditDrink({...editDrink,name:e.target.value})}
style={{width:"100%"}}
/>

<label>英語名</label>
<input
value={editDrink.name_en}
onChange={(e)=>setEditDrink({...editDrink,name_en:e.target.value})}
style={{width:"100%"}}
/>

<label>カテゴリー</label>
<select
value={editDrink.drinkCategory}
onChange={(e)=>setEditDrink({...editDrink,drinkCategory:e.target.value})}
style={{width:"100%"}}
>

{categories.map(c=>(
<option key={c}>{c}</option>
))}

</select>

<label>説明</label>
<input
value={editDrink.description}
onChange={(e)=>setEditDrink({...editDrink,description:e.target.value})}
style={{width:"100%"}}
/>

<label>価格</label>
<input
type="number"
value={editDrink.price}
onChange={(e)=>setEditDrink({...editDrink,price:Number(e.target.value)})}
style={{width:"100%"}}
/>

<div style={{
marginTop:"20px",
display:"flex",
justifyContent:"flex-end",
gap:"10px"
}}>

<button onClick={()=>setShowEdit(false)}>
キャンセル
</button>

<button onClick={saveEdit}>
保存
</button>

</div>

</div>

</div>

)}

{showAddModal && (

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
padding:"30px",
borderRadius:"8px",
width:"1000px"
}}>

<h3 style={{marginBottom:"20px"}}>一括ドリンク登録</h3>

{/* ラベル行 */}

<div style={{
display:"grid",
gridTemplateColumns:"1fr 1fr 1fr 2fr 120px",
gap:"6px",
fontWeight:"bold",
marginBottom:"8px"
}}>

<div>名前</div>
<div>英語名</div>
<div>カテゴリー</div>
<div>説明</div>
<div>価格</div>

</div>

{/* 入力行 */}

{newDrinks.map((d,i)=>(

<div key={i}
style={{
display:"grid",
gridTemplateColumns:"1fr 1fr 1fr 2fr 120px",
gap:"6px",
marginTop:"6px"
}}
>

<input
value={d.name}
onChange={(e)=>{
const arr=[...newDrinks]
arr[i].name=e.target.value
setNewDrinks(arr)
}}
/>

<input
value={d.name_en}
onChange={(e)=>{
const arr=[...newDrinks]
arr[i].name_en=e.target.value
setNewDrinks(arr)
}}
/>

<select
value={d.drinkCategory}
onChange={(e)=>{
const arr=[...newDrinks]
arr[i].drinkCategory=e.target.value
setNewDrinks(arr)
}}
>

<option value="">選択</option>

{categories.map(c=>(
<option key={c}>{c}</option>
))}

</select>

<input
value={d.description}
onChange={(e)=>{
const arr=[...newDrinks]
arr[i].description=e.target.value
setNewDrinks(arr)
}}
/>

<input
type="number"
value={d.price}
onChange={(e)=>{
const arr=[...newDrinks]
arr[i].price=e.target.value
setNewDrinks(arr)
}}
/>

</div>

))}

<div style={{
marginTop:"25px",
display:"flex",
justifyContent:"space-between"
}}>

<button onClick={()=>setShowAddModal(false)}>
キャンセル
</button>

<button onClick={addDrinks}>
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

<button onClick={()=>setShowPriceModal(false)}>
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

{categories.map(c=>(
<option key={c}>{c}</option>
))}

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

</div>

</AuthGuard>

)

}