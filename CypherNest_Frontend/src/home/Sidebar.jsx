import {useState} from "react"
import logo from "../assets/logo.png"

const defaults={
passwords:["Banking","Gaming","Email","Work","Shopping"],
atm:["Visa","Mastercard","RuPay","American Express"],
identity:["Aadhaar","PAN","Passport","Driving License","Voter ID"],
notes:["Personal","Work","Recovery Codes"]
}

export default function Sidebar({section,setSection,sub,setSub,setPage}){
const [cats,setCats]=useState(defaults)
const [open,setOpen]=useState({passwords:true,atm:false,identity:false,notes:false})
const [newCat,setNewCat]=useState("")
const [adding,setAdding]=useState(null)
const names={passwords:"Passwords",atm:"ATM Cards",identity:"Identity Cards",notes:"Important Notes"}
const icons={passwords:"🔑",atm:"💳",identity:"🪪",notes:"📝"}
const add=key=>{
if(!newCat.trim())return
setCats({...cats,[key]:[...cats[key],newCat.trim()]});setNewCat("");setAdding(null)
}
return <aside className="sidebar">
<div className="side-brand"><img src={logo} alt="CypherNest Logo" /><div><strong>CypherNest</strong><small>Zero-Knowledge</small></div></div>
<div className="side-scroll">
{Object.keys(names).map(key=><div className="nav-group" key={key}>
<button className={"main-nav "+(section===key?"active":"")} onClick={()=>{setSection(key);setOpen({...open,[key]:!open[key]});setSub(null)}}>
<span>{icons[key]}</span><span>{names[key]}</span><span className="chevron">{open[key]?"⌄":"›"}</span>
</button>
{open[key]&&<div className="sub-nav">
{cats[key].map(cat=><button key={cat} className={sub===cat&&section===key?"sub-active":""} onClick={()=>{setSection(key);setSub(cat)}}><span className="dot">•</span>{cat}</button>)}
{adding===key?<div className="add-cat"><input autoFocus placeholder="Category name" value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add(key)}/><div><button onClick={()=>add(key)}>Add</button><button onClick={()=>setAdding(null)}>×</button></div></div>:<button className="add-cat-btn" onClick={()=>setAdding(key)}>＋ Add Category</button>}
</div>}
</div>)}
</div>
<div className="side-bottom">
<button className="bottom-btn">⚙ Settings</button>
<button className="lock-btn" onClick={()=>setPage("login")}>🔒 Lock Vault</button>
</div>
</aside>
}