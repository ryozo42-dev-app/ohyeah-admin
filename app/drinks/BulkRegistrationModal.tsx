"use client"

import { useState } from "react"
import { collection, addDoc } from "firebase/firestore"
import { db } from "../../lib/firebase"

type Props = {
onClose: () => void
}

type Row = {
name:string
name_en:string
drinkCategory:string
description:string
price:string
}

export default function BulkRegistrationModal({onClose}:Props){

const [rows,setRows] = useState<Row[]>([
{
name:"",
name_en:"",
drinkCategory:"",
description:"",
price:""
}
])

const addRow = () => {

setRows([
...rows,
{
name:"",
name_en:"",
drinkCategory:"",
description:"",
price:""
}
])

}

const updateRow = (i:number,key:string,value:string) => {

const newRows=[...rows]

newRows[i] = {
...newRows[i],
[key]:value
}

setRows(newRows)

}

const save = async() => {

for(const r of rows){

if(!r.name) continue

await addDoc(collection(db,"menu_items"),{
name:r.name,
name_en:r.name_en,
drinkCategory:r.drinkCategory,
description:r.description,
price:Number(r.price),
order:999
})

}

alert("登録完了")

onClose()

location.reload()

}

return(

<div style={{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,0.5)",
display:"flex",
justifyContent:"center",
alignItems:"center"
}}>

<div style={{
background:"#fff",
padding:"30px",
width:"900px",
borderRadius:"8px"
}}>

<h2>ドリンク一括登録</h2>

<table style={{
width:"100%",
marginTop:"20px",
borderCollapse:"collapse"
}}>

<thead>

<tr>

<th>名前</th>
<th>英語名</th>
<th>カテゴリー</th>
<th>説明</th>
<th>価格</th>

</tr>

</thead>

<tbody>

{rows.map((r,i)=>(
<tr key={i}>

<td>
<input
value={r.name}
onChange={(e)=>updateRow(i,"name",e.target.value)}
/>
</td>

<td>
<input
value={r.name_en}
onChange={(e)=>updateRow(i,"name_en",e.target.value)}
/>
</td>

<td>
<input
value={r.drinkCategory}
onChange={(e)=>updateRow(i,"drinkCategory",e.target.value)}
/>
</td>

<td>
<input
value={r.description}
onChange={(e)=>updateRow(i,"description",e.target.value)}
/>
</td>

<td>
<input
value={r.price}
onChange={(e)=>updateRow(i,"price",e.target.value)}
/>
</td>

</tr>
))}

</tbody>

</table>

<div style={{
marginTop:"20px",
display:"flex",
justifyContent:"space-between"
}}>

<button onClick={addRow}>
＋行追加
</button>

<div>

<button
onClick={save}
style={{marginRight:"10px"}}
>
保存
</button>

<button onClick={onClose}>
閉じる
</button>

</div>

</div>

</div>

</div>

)

}