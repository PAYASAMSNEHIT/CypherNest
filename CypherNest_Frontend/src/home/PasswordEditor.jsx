import {useState} from "react";

export default function PasswordEditor({item,categories,onBack,onSave}){

    const [form,setForm]=useState(
        item||{
            title:"",
            user:"",
            password:"",
            website:"",
            category:categories[0]||"",
            notes:""
        }
    );

    const [show,setShow]=useState(false);
    const [showGenerator,setShowGenerator]=useState(false);
    const [length,setLength]=useState(20);
    const [upper,setUpper]=useState(true);
    const [lower,setLower]=useState(true);
    const [numbers,setNumbers]=useState(true);
    const [symbols,setSymbols]=useState(true);
    const [generated,setGenerated]=useState("");
    const [copied,setCopied]=useState(false);

    const change=(k,v)=>setForm({...form,[k]:v});

    const generatePassword=()=>{
        let chars="";

        if(upper)chars+="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if(lower)chars+="abcdefghijklmnopqrstuvwxyz";
        if(numbers)chars+="0123456789";
        if(symbols)chars+="!@#$%^&*()-_=+[]{};:,.?";

        if(!chars){
            alert("Select at least one character type");
            return;
        }

        const values=new Uint32Array(length);
        crypto.getRandomValues(values);

        let password="";
        for(let i=0;i<length;i++){
            password+=chars[values[i]%chars.length];
        }

        setGenerated(password);
        setCopied(false);
    };

    const useGenerated=()=>{
        if(!generated)return;
        change("password",generated);
        setShow(true);
        setShowGenerator(false);
    };

    const copyGenerated=async()=>{
        if(!generated)return;

        try{
            await navigator.clipboard.writeText(generated);
            setCopied(true);

            setTimeout(()=>{
                setCopied(false);
            },1500);
        }catch(error){
            console.error("Unable to copy password",error);
        }
    };

    const getStrength=(password)=>{
        if(!password)return "Not set";

        let score=0;

        if(password.length>=8)score++;
        if(password.length>=12)score++;
        if(/[A-Z]/.test(password))score++;
        if(/[a-z]/.test(password))score++;
        if(/[0-9]/.test(password))score++;
        if(/[^A-Za-z0-9]/.test(password))score++;

        if(password.length<8)return "Weak";
        if(score>=5)return "Strong";
        return "Medium";
    };

    const strength=getStrength(form.password);

    const save=()=>{
        if(!form.title||!form.user||!form.password||!form.category){
            alert("Please fill all required fields");
            return;
        }

        onSave(form);
    };

    return(
        <section className="editor content">
            <div className="editor-top">
                <button className="back-link" onClick={onBack}>← Passwords</button>
                <button className="primary-small" onClick={save}>Save Password</button>
            </div>

            <h2>{item?"Edit Password":"Add Password"}</h2>
            <p className="editor-sub">These fields are encrypted locally before being stored.</p>

            <div className="form-grid">
                <label>
                    Title *
                    <input
                        value={form.title}
                        onChange={e=>change("title",e.target.value)}
                        placeholder="e.g. Gmail"
                    />
                </label>

                <label>
                    Username / Email *
                    <input
                        value={form.user}
                        onChange={e=>change("user",e.target.value)}
                        placeholder="username or email"
                    />
                </label>

                <label>
                    Password *
                    <div className="password-input">
                        <input
                            type={show?"text":"password"}
                            value={form.password}
                            onChange={e=>change("password",e.target.value)}
                            placeholder="Enter password"
                        />
                        <button type="button" onClick={()=>setShow(!show)}>
                            {show?"Hide":"Show"}
                        </button>
                    </div>

                    <div className={`password-strength strength-${strength.toLowerCase().replace(" ","-")}`}>
                        <span>Password strength: {strength}</span>
                    </div>

                    <button
                        type="button"
                        className="secondary-btn compact"
                        onClick={()=>{
                            setShowGenerator(!showGenerator);
                            if(!generated)generatePassword();
                        }}
                    >
                        ⚡ {showGenerator?"Close Generator":"Generate Password"}
                    </button>
                </label>

                {showGenerator&&(
                    <div className="password-generator-panel">
                        <div className="generator-head">
                            <div>
                                <strong>Password Generator</strong>
                                <small>Generated locally with Web Crypto API.</small>
                            </div>
                            <span>🔐</span>
                        </div>

                        <div className="generator-length">
                            <div>
                                <span>Password Length</span>
                                <strong>{length}</strong>
                            </div>
                            <input
                                type="range"
                                min="8"
                                max="64"
                                value={length}
                                onChange={e=>setLength(Number(e.target.value))}
                            />
                        </div>

                        <div className="generator-options">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={upper}
                                    onChange={e=>setUpper(e.target.checked)}
                                />
                                Uppercase
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={lower}
                                    onChange={e=>setLower(e.target.checked)}
                                />
                                Lowercase
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={numbers}
                                    onChange={e=>setNumbers(e.target.checked)}
                                />
                                Numbers
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={symbols}
                                    onChange={e=>setSymbols(e.target.checked)}
                                />
                                Symbols
                            </label>
                        </div>

                        <div className="generated-password">
                            <input
                                type="text"
                                value={generated}
                                readOnly
                            />

                            <button
                                type="button"
                                className="icon-btn"
                                onClick={copyGenerated}
                                disabled={!generated}
                            >
                                {copied?"Copied":"Copy"}
                            </button>
                        </div>

                        <div className="generator-actions">
                            <button
                                type="button"
                                className="secondary-btn compact"
                                onClick={generatePassword}
                            >
                                ↻ Regenerate
                            </button>

                            <button
                                type="button"
                                className="primary-small"
                                onClick={useGenerated}
                                disabled={!generated}
                            >
                                Use Password
                            </button>
                        </div>
                    </div>
                )}

                <label>
                    Website
                    <input
                        value={form.website}
                        onChange={e=>change("website",e.target.value)}
                        placeholder="https://example.com"
                    />
                </label>

                <label>
                    Category *
                    <select
                        value={form.category}
                        onChange={e=>change("category",e.target.value)}
                    >
                        <option value="">Select category</option>
                        {categories.map(x=>
                            <option key={x} value={x}>{x}</option>
                        )}
                    </select>
                </label>

                <label>
                    Notes
                    <textarea
                        value={form.notes}
                        onChange={e=>change("notes",e.target.value)}
                        placeholder="Optional notes"
                    />
                </label>
            </div>
        </section>
    );
}
