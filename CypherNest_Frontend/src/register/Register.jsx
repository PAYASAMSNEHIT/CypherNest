import {useState} from "react";
import api from "../api";

function Register({setPage,setEmail}){
    const [email,setE]=useState("");
    const [phone,setPhone]=useState("");
    const [password,setPassword]=useState("");
    const [message,setMessage]=useState("");
    const [loading,setLoading]=useState(false);

    const submit=async(e)=>{
        e.preventDefault();
        setMessage("");
        if(!email||!phone||!password){
            setMessage("Please fill all fields");
            return;
        }
        if(password.length<8){
            setMessage("Password must be at least 8 characters");
            return;
        }
        setLoading(true);
        try{
            const r=await api.post("/register",{email,phone,password});
            console.log("REGISTER RESPONSE:",r.data);
            setEmail(email);
            setPage("verify");
        }catch(e){
            console.error("REGISTER ERROR:",e);
            if(e.response){
                setMessage(e.response.data?.message||"Registration failed");
            }else{
                setMessage("Cannot connect to Flask server");
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
                    <div>
                        <strong>SecureVault</strong>
                        <span>Zero-Knowledge Password Manager</span>
                    </div>
                </div>

                <div className="auth-brand-copy">
                    <span className="auth-kicker">NEW ACCOUNT</span>
                    <h2>Build your private<br/>security workspace.</h2>
                    <p>Create an encrypted vault protected by strong authentication and browser-side encryption.</p>
                </div>

                <div className="auth-security-list">
                    <div><span>✓</span> Secure account authentication</div>
                    <div><span>✓</span> Google Authenticator setup</div>
                    <div><span>✓</span> Personal secret-key backup</div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-card">
                    <div className="auth-mobile-brand">
                        <span>🔐</span>
                        <strong>SecureVault</strong>
                    </div>

                    <div className="auth-step">CREATE ACCOUNT</div>

                    <h1>Create Account</h1>
                    <p className="auth-description">Set up your SecureVault account to begin.</p>

                    <form onSubmit={submit}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e=>setE(e.target.value)}
                            required
                        />

                        <input
                            type="tel"
                            placeholder="Phone Number"
                            value={phone}
                            onChange={e=>setPhone(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password (minimum 8 characters)"
                            value={password}
                            onChange={e=>setPassword(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            className="primary"
                            disabled={loading}
                        >
                            {loading?"Creating Account...":"Create Account"}
                        </button>
                    </form>

                    {message&&(
                        <div className="message">
                            {message}
                        </div>
                    )}

                    <button
                        className="text-button"
                        onClick={()=>setPage("login")}
                    >
                        Already have an account? Sign in
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Register;
