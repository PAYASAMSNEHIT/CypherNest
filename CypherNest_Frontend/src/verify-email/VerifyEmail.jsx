import {useState} from "react";
import api from "../api";

function VerifyEmail({email,setPage,setEmail}){
    const [otp,setOtp]=useState("");
    const [qrCode,setQrCode]=useState("");
    const [message,setMessage]=useState("");
    const [loading,setLoading]=useState(false);

    const submit=async(e)=>{
        e.preventDefault();
        setMessage("");
        if(!email||!otp){
            setMessage("Email and OTP are required");
            return;
        }
        setLoading(true);
        try{
            const r=await api.post("/verify-email",{email:email,otp:otp});
            setMessage("Email verified successfully");
            setQrCode(r.data.qr_code);
        }catch(e){
            console.error(e);
            setMessage(e.response?.data?.message||"Verification failed");
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
                    <span className="auth-kicker">ACCOUNT VERIFICATION</span>
                    <h2>Verify once.<br/>Protect everything.</h2>
                    <p>Confirm your email, then connect Google Authenticator to strengthen your account.</p>
                </div>
                <div className="auth-security-list">
                    <div><span>01</span> Verify email address</div>
                    <div><span>02</span> Configure authenticator</div>
                    <div><span>03</span> Unlock your vault</div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-card">
                    <div className="auth-mobile-brand">
                        <span>🔐</span>
                        <strong>SecureVault</strong>
                    </div>

                    <div className="auth-step">ACCOUNT VERIFICATION</div>

                    {!qrCode?(
                        <>
                            <h1>Email Verification</h1>
                            <p>Enter the OTP sent to {email}</p>

                            <form onSubmit={submit}>
                                <input
                                    type="text"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={e=>setOtp(e.target.value)}
                                    maxLength="6"
                                    required
                                />

                                <button
                                    type="submit"
                                    className="primary"
                                    disabled={loading}
                                >
                                    {loading?"Verifying...":"Verify Email"}
                                </button>
                            </form>
                        </>
                    ):(
                        <>
                            <h1>Authenticator Setup</h1>
                            <p>Scan this QR code with Google Authenticator.</p>

                            <div className="qr-box">
                                <img
                                    src={`https://quickchart.io/qr?text=${encodeURIComponent(qrCode)}&size=250`}
                                    alt="Google Authenticator QR Code"
                                />
                            </div>

                            <p>After scanning, your Google Authenticator will generate a 6-digit code.</p>

                            <button
                                className="primary"
                                onClick={()=>setPage("login")}
                            >
                                Continue to Login
                            </button>
                        </>
                    )}

                    {message&&(
                        <div className="message">
                            {message}
                        </div>
                    )}

                    {!qrCode&&(
                        <button
                            className="text-button"
                            onClick={()=>setPage("login")}
                        >
                            Back to Login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VerifyEmail;
