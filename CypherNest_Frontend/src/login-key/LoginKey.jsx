import {useState} from "react";
import api from "../api";
import {unlockWithSecretKey,decryptVault} from "../crypto";

function LoginKey({setPage,setEmail,loginSuccess}){
    const [email,setEmailInput]=useState("");
    const [keyFile,setKeyFile]=useState(null);
    const [message,setMessage]=useState("");
    const [loading,setLoading]=useState(false);

    const handleLogin=async(e)=>{
        e.preventDefault();
        setMessage("");
        if(!keyFile){
            setMessage("Please select your secret key file");
            return;
        }
        setLoading(true);
        try{
            const key=await keyFile.text();
            const secretKey=key.trim();
            if(!secretKey){
                setMessage("Secret key file is empty");
                return;
            }
            const formData=new FormData();
            formData.append("email",email);
            formData.append("key",keyFile);
            const response=await api.post("/login-key",formData);
            const userId=response.data.user_id;
            setEmail(email);
            const vaultResponse=await api.get("/vault");
            if(!vaultResponse.data.exists){
                loginSuccess(userId,email,secretKey,null);
                return;
            }
            const vaultData=vaultResponse.data;
            const vek=await unlockWithSecretKey(vaultData.wrapped_vek,secretKey);
            const vault=await decryptVault(vaultData.ciphertext,vaultData.iv,vek);
            sessionStorage.setItem("securevault_unlocked","true");
            loginSuccess(userId,email,secretKey,vek);
            window.secureVaultData=vault;
        }catch(error){
            console.error(error);
            if(error.response){
                setMessage(error.response.data.message||"Secret key login failed");
            }else if(error.name==="OperationError"||error.message?.includes("OperationError")){
                setMessage("Wrong secret key or vault cannot be decrypted");
            }else{
                setMessage(error.message||"Unable to connect to server");
            }
        }finally{
            setLoading(false);
        }
    };

    return(
        <div className="auth-shell">
            <div className="auth-brand-panel">
                <div className="auth-brand">
                    <div className="auth-brand-icon">🔐</div>
                    <div><strong>SecureVault</strong><span>Zero-Knowledge Password Manager</span></div>
                </div>
                <div className="auth-brand-copy">
                    <span className="auth-kicker">SECRET KEY ACCESS</span>
                    <h2>Unlock with your<br/>SecureVault key.</h2>
                    <p>Use the private key file issued during registration to access your encrypted vault.</p>
                </div>
                <div className="auth-security-list">
                    <div><span>✓</span> Alternative vault access</div>
                    <div><span>✓</span> Secret key verification</div>
                    <div><span>✓</span> Vault decrypted locally</div>
                </div>
            </div>
            <div className="auth-form-panel">
                <div className="auth-card">
                    <div className="auth-mobile-brand"><span>🔐</span><strong>SecureVault</strong></div>
                    <div className="auth-step">SECRET KEY ACCESS</div>
                    <div className="auth-icon">🔐</div>
                    <h1>Secret Key Login</h1>
                    <p>Upload the .txt file you received during registration.</p>
                    <form onSubmit={handleLogin}>
                        <input type="email" placeholder="Email" value={email} onChange={e=>setEmailInput(e.target.value)} required/>
                        <label className="file-upload">
                            📁 Choose secret key file
                            <input type="file" accept=".txt,text/plain" onChange={e=>setKeyFile(e.target.files[0])} required/>
                        </label>
                        {keyFile&&(
                            <div className="selected-file">✓ {keyFile.name}</div>
                        )}
                        <button type="submit" disabled={loading}>
                            {loading?"Unlocking...":"Unlock with Secret Key"}
                        </button>
                    </form>
                    {message&&(
                        <div className="message">{message}</div>
                    )}
                    <button className="link-button" onClick={()=>setPage("login")}>← Back to normal login</button>
                </div>
            </div>
        </div>
    );
}

export default LoginKey;
