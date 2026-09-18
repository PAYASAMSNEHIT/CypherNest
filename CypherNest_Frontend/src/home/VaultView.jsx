import {useState} from "react"
import Passwords from "./Passwords"
import AtmCards from "./AtmCards"
import IdentityCards from "./IdentityCards"
import Notes from "./Notes"

export default function VaultView({section,sub,email}){
const [query,setQuery]=useState("")
const props={sub,query,setQuery}
return <main className="vault-main">
<header className="vault-header"><div><div className="eyebrow">MY VAULT</div><h1>Welcome back</h1><p>{email}</p></div><div className="header-avatar">🔐</div></header>
{section==="passwords"&&<Passwords {...props}/>}
{section==="atm"&&<AtmCards {...props}/>}
{section==="identity"&&<IdentityCards {...props}/>}
{section==="notes"&&<Notes {...props}/>}
</main>
}