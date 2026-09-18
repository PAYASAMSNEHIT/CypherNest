import {useEffect,useState} from "react";
import api from "../api";
import {decryptVault,encryptVault} from "../crypto";
import Passwords from "./Passwords";
import AtmCards from "./AtmCards";
import IdentityCards from "./IdentityCards";
import Notes from "./Notes";
import Profile from "./Profile";
import SecurityDashboard from "./SecurityDashboard";
import SecurityCenter from "./SecurityCenter";
import cypherNestAvatar from "../assets/cyphernest-avatar.gif";

function Home({userId,email,vek,lockVault}){
    const [activeCategory,setActiveCategory]=useState("Passwords");
    const [vault,setVault]=useState({
        passwords:{categories:{}},
        atmCards:{categories:{}},
        identityCards:{categories:{}},
        notes:{categories:{}}
    });
    const [loading,setLoading]=useState(true);
    const [saving,setSaving]=useState(false);
    const [message,setMessage]=useState("");
    const [profile,setProfile]=useState(null);

    useEffect(()=>{
        loadVault();
        loadProfile();
    },[]);

    const loadProfile=async()=>{
        try{
            const response=await api.get("/profile");
            setProfile(response.data);
        }catch(error){
            console.error("Unable to load profile",error);
        }
    };

    const loadVault=async()=>{
        try{
            const response=await api.get("/vault");

            if(!response.data.exists){
                setVault({
                    passwords:{categories:{}},
                    atmCards:{categories:{}},
                    identityCards:{categories:{}},
                    notes:{categories:{}}
                });
                setLoading(false);
                return;
            }

            if(!vek){
                setMessage("Vault encryption key is unavailable");
                setLoading(false);
                return;
            }

            const decrypted=await decryptVault(
                response.data.ciphertext,
                response.data.iv,
                vek
            );

            setVault(decrypted);
        }catch(error){
            console.error(error);
            setMessage("Unable to load vault");
        }finally{
            setLoading(false);
        }
    };

    const saveVault=async(newVault)=>{
        if(!vek){
            setMessage("Vault is locked");
            return;
        }

        setSaving(true);
        setMessage("");

        try{
            const encrypted=await encryptVault(newVault,vek);

            await api.put(
                "/vault",
                {
                    ciphertext:encrypted.ciphertext,
                    iv:encrypted.iv
                }
            );

            setVault(newVault);
            setMessage("Saved securely");
        }catch(error){
            console.error(error);

            if(error.response){
                setMessage(
                    error.response.data.message||"Could not save vault"
                );
            }else{
                setMessage("Could not save vault");
            }
        }finally{
            setSaving(false);
        }
    };

    const updateVault=(newVault)=>{
        setVault(newVault);
        saveVault(newVault);
    };

    const renderCategory=()=>{
        if(activeCategory==="Passwords"){
            return <Passwords vault={vault} setVault={updateVault}/>;
        }

        if(activeCategory==="ATM Cards"){
            return <AtmCards vault={vault} setVault={updateVault}/>;
        }

        if(activeCategory==="Identity Cards"){
            return <IdentityCards vault={vault} setVault={updateVault}/>;
        }

        if(activeCategory==="Important Notes"){
            return <Notes vault={vault} setVault={updateVault}/>;
        }

        if(activeCategory==="Security Dashboard"){
            return <SecurityDashboard vault={vault}/>;
        }

        if(activeCategory==="Security Center"){
            return <SecurityCenter/>;
        }

        if(activeCategory==="Profile"){
            return <Profile/>;
        }

        return null;
    };

    if(loading){
        return(
            <div className="vault-loading">
                <div className="loading-mark">🔐</div>
                <h2>Unlocking CypherNest...</h2>
                <p>Decrypting your vault locally.</p>
            </div>
        );
    }

    const navItem=(name,icon)=>(
        <button
            className={`category ${activeCategory===name?"active":""}`}
            onClick={()=>setActiveCategory(name)}
        >
            <span className="nav-icon">{icon}</span>
            <span>{name}</span>
        </button>
    );

    return(
        <div className="vault-layout">
            <aside className="vault-sidebar">
                <div className="vault-logo">
                    <span className="logo-icon">🔐</span>
                    <div>
                        <strong>CypherNest</strong>
                        <small>Zero-Knowledge</small>
                    </div>
                </div>

                <div className="user-box">
                    <div className="user-avatar">
                        <img
                            src={cypherNestAvatar}
                            alt="CypherNest"
                            className="fixed-cyphernest-avatar"
                        />
                    </div>

                    <div className="user-details">
                        <strong>{email}</strong>
                        <small><span className="online-dot"></span>Vault unlocked</small>
                    </div>
                </div>

                <div className="sidebar-scroll">
                    <div className="sidebar-title">VAULT</div>
                    {navItem("Passwords","🔑")}
                    {navItem("ATM Cards","💳")}
                    {navItem("Identity Cards","🪪")}
                    {navItem("Important Notes","📝")}

                    <div className="sidebar-title security-title">SECURITY</div>
                    {navItem("Security Dashboard","🛡️")}
                    {navItem("Security Center","⚙️")}
                </div>

                <div className="sidebar-bottom">
                    <div className="security-status">
                        <span className="status-dot">●</span>
                        <div>
                            <strong>Vault Encrypted</strong>
                            <small>Protected locally</small>
                        </div>
                    </div>

                    <button className="lock-button" onClick={lockVault}>
                        <span>🔒</span>
                        <span>Lock Vault</span>
                    </button>
                </div>
            </aside>

            <main className="vault-main">
                <header className="sv-topbar">
                    <div className="sv-topbar-left">
                        <div className="sv-page-icon">
                            {activeCategory==="Passwords"?"🔑":
                             activeCategory==="ATM Cards"?"💳":
                             activeCategory==="Identity Cards"?"🪪":
                             activeCategory==="Important Notes"?"📝":
                             activeCategory==="Security Dashboard"?"🛡️":
                             activeCategory==="Security Center"?"⚙️":
                             "👤"}
                        </div>

                        <div>
                            <strong>{activeCategory}</strong>
                            <span>CypherNest Workspace</span>
                        </div>
                    </div>

                    <div className="sv-topbar-right">
                        {saving&&(
                            <div className="sv-save-status saving">
                                <span>●</span> Encrypting changes...
                            </div>
                        )}

                        {!saving&&message&&(
                            <div className="sv-save-status saved">
                                <span>●</span> {message}
                            </div>
                        )}

                        <div className="sv-protection-badge">
                            <span>●</span> Local encryption
                        </div>

                        <button
                            className="sv-user-mini"
                            onClick={()=>setActiveCategory("Profile")}
                            title="Open Profile"
                            aria-label="Open Profile"
                        >
                            {profile?.profile_picture?
                                <img
                                    src={`data:${profile.profile_picture_type};base64,${profile.profile_picture}`}
                                    alt="Profile"
                                />:
                                email?.charAt(0).toUpperCase()
                            }
                        </button>
                    </div>
                </header>

                <div className="vault-content">
                    {renderCategory()}
                </div>
            </main>
        </div>
    );
}

export default Home;
