import {useState} from "react";
import api from "../api";
import {generateVEK,encryptVault,createVEKBundle,unlockWithPassword,decryptVault} from "../crypto";

function Login({setPage,setEmail,loginSuccess}){
    const [email,setEmailInput]=useState("");
    const [password,setPassword]=useState("");
    const [otp,setOtp]=useState("");
    const [keyFile,setKeyFile]=useState(null);
    const [setup,setSetup]=useState(false);
    const [userId,setUserId]=useState(null);
    const [message,setMessage]=useState("");
    const [loading,setLoading]=useState(false);

    const handleLogin=async(e)=>{
        e.preventDefault();
        setMessage("");
        setLoading(true);
        try{
            const response=await api.post("/login",{email,password,otp});
            const loggedUserId=response.data.user_id;
            setUserId(loggedUserId);
            setEmail(email);
            const vaultResponse=await api.get("/vault");
            if(!vaultResponse.data.exists){
                setSetup(true);
                setLoading(false);
                return;
            }
            const vaultData=vaultResponse.data;
            const vek=await unlockWithPassword(vaultData.wrapped_vek,password);
            const vault=await decryptVault(vaultData.ciphertext,vaultData.iv,vek);
            sessionStorage.setItem("securevault_unlocked","true");
            window.secureVaultData=vault;
            loginSuccess(loggedUserId,email,password,vek);
        }catch(error){
            console.error(error);
            if(error.response){
                setMessage(error.response.data.message||"Login failed");
            }else{
                setMessage(error.message||"Unable to connect to server");
            }
        }finally{
            setLoading(false);
        }
    };

    const createFirstVault=async()=>{
        setMessage("");
        if(!keyFile){
            setMessage("Please select your secret key file");
            return;
        }
        setLoading(true);
        try{
            const secretKey=(await keyFile.text()).trim();
            if(!secretKey){
                setMessage("Secret key file is empty");
                setLoading(false);
                return;
            }
            const formData=new FormData();
            formData.append("email",email);
            formData.append("key",keyFile);
            await api.post("/login-key",formData);
            const vek=await generateVEK();
            const emptyVault={
                passwords:{categories:{}},
                atmCards:{categories:{}},
                identityCards:{categories:{}},
                notes:{categories:{}}
            };
            const encrypted=await encryptVault(emptyVault,vek);
            const wrappedVEK=await createVEKBundle(vek,password,secretKey);
            await api.post("/vault",{
                ciphertext:encrypted.ciphertext,
                iv:encrypted.iv,
                salt:"",
                wrapped_vek:wrappedVEK
            });
            sessionStorage.setItem("securevault_unlocked","true");
            window.secureVaultData=emptyVault;
            loginSuccess(userId,email,password,vek);
        }catch(error){
            console.error(error);
            if(error.response){
                setMessage(error.response.data.message||"Vault setup failed");
            }else if(error.name==="OperationError"||error.message?.includes("OperationError")){
                setMessage("Secret key is incorrect or encryption failed");
            }else{
                setMessage(error.message||"Unable to create vault");
            }
        }finally{
            setLoading(false);
        }
    };

    if(setup){
        return(
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-icon">🔐</div>
                    <h1>Create Your Vault</h1>
                    <p>Your account is verified. Select the SecureVault secret key file you received by email.</p>
                    <label className="file-upload">
                        📁 Choose Secret Key File
                        <input type="file" accept=".txt,text/plain" onChange={e=>setKeyFile(e.target.files[0])}/>
                    </label>
                    {keyFile&&(
                        <div className="selected-file">✓ {keyFile.name}</div>
                    )}
                    <button className="primary" onClick={createFirstVault} disabled={loading}>
                        {loading?"Creating Vault...":"Create Secure Vault"}
                    </button>
                    {message&&(
                        <div className="message">{message}</div>
                    )}
                </div>
            </div>
        );
    }

    return(
        <div className="auth-shell">
            <div className="auth-brand-panel">
                <div className="auth-brand">
                    <div className="auth-brand-icon">🔐</div>
                    <div><strong>SecureVault</strong><span>Zero-Knowledge Password Manager</span></div>
                </div>
                <div className="auth-brand-copy">
                    <span className="auth-kicker">SECURE LOGIN</span>
                    <h2>One vault.<br/>Zero plaintext.</h2>
                    <p>Unlock your encrypted workspace and manage your digital secrets from one secure place.</p>
                </div>
                <div className="auth-security-list">
                    <div><span>✓</span> Password + TOTP authentication</div>
                    <div><span>✓</span> Secret-key recovery access</div>
                    <div><span>✓</span> Client-side vault encryption</div>
                </div>
            </div>
            <div className="auth-form-panel">
                <div className="auth-card">
                    <div className="auth-mobile-brand"><span>🔐</span><strong>SecureVault</strong></div>
                    <div className="auth-step">SECURE LOGIN</div>
                    <div className="auth-icon">🔐</div>
                    <h1>Welcome Back</h1>
                    <p>Unlock your SecureVault</p>
                    <form onSubmit={handleLogin}>
                        <input type="email" placeholder="Email" value={email} onChange={e=>setEmailInput(e.target.value)} required/>
                        <input type="password" placeholder="Master password" value={password} onChange={e=>setPassword(e.target.value)} required/>
                        <input type="text" placeholder="6-digit Google Authenticator code" value={otp} onChange={e=>setOtp(e.target.value)} maxLength="6" required/>
                        <button type="submit" className="primary" disabled={loading}>
                            {loading?"Unlocking...":"Login"}
                        </button>
                    </form>
                    {message&&(
                        <div className="message">{message}</div>
                    )}
                    <button className="secondary-button" onClick={()=>setPage("login-key")}>🔑 Login with Secret Key</button>
                    <button className="link-button" onClick={()=>setPage("register")}>Don't have an account? Register</button>
                </div>
            </div>
        </div>
    );
}

export default Login;
