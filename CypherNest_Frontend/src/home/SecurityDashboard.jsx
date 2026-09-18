import {useMemo,useState} from "react";

export default function SecurityDashboard({vault,onFixPassword}){

    const [length,setLength]=useState(20);
    const [upper,setUpper]=useState(true);
    const [lower,setLower]=useState(true);
    const [numbers,setNumbers]=useState(true);
    const [symbols,setSymbols]=useState(true);
    const [generated,setGenerated]=useState("");
    const [copied,setCopied]=useState(false);

    const analysis=useMemo(function(){

        const categories=vault && vault.passwords && vault.passwords.categories
            ? vault.passwords.categories
            : {};

        const items=[];

        Object.keys(categories).forEach(function(category){
            const list=Array.isArray(categories[category])
                ? categories[category]
                : [];

            list.forEach(function(item,index){
                items.push({
                    title:item.title||"",
                    user:item.user||"",
                    password:item.password||"",
                    website:item.website||"",
                    notes:item.notes||"",
                    category:category,
                    originalIndex:index
                });
            });
        });

        function getStrength(password){
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
        }

        const weak=[];
        const medium=[];
        const strong=[];
        const passwordMap={};

        items.forEach(function(item){
            const strength=getStrength(item.password);

            if(strength==="Weak")weak.push(item);
            if(strength==="Medium")medium.push(item);
            if(strength==="Strong")strong.push(item);

            if(item.password){
                if(!passwordMap[item.password]){
                    passwordMap[item.password]=[];
                }
                passwordMap[item.password].push(item);
            }
        });

        const reusedGroups=Object.keys(passwordMap)
            .map(function(password){
                return passwordMap[password];
            })
            .filter(function(group){
                return group.length>1;
            });

        let score=100;
        score-=weak.length*10;
        score-=reusedGroups.length*10;
        score-=items.filter(function(item){
            return item.password.length<8;
        }).length*5;

        if(score<0)score=0;
        if(score>100)score=100;

        let rating="Excellent";

        if(score<60){
            rating="Critical";
        }else if(score<75){
            rating="Needs Attention";
        }else if(score<90){
            rating="Good";
        }

        const findings=[];

        weak.forEach(function(item){
            const reasons=[];
            const password=item.password;

            if(password.length<8)reasons.push("less than 8 characters");
            if(!/[A-Z]/.test(password))reasons.push("no uppercase");
            if(!/[a-z]/.test(password))reasons.push("no lowercase");
            if(!/[0-9]/.test(password))reasons.push("no number");
            if(!/[^A-Za-z0-9]/.test(password))reasons.push("no special character");

            findings.push({
                type:"weak",
                icon:"⚠",
                title:"Weak Password",
                item:item,
                detail:"Password needs improvement: "+reasons.join(", ")+"."
            });
        });

        reusedGroups.forEach(function(group){
            findings.push({
                type:"reused",
                icon:"↻",
                title:"Reused Password",
                item:group[0],
                group:group,
                detail:"This password is shared across "+group.length+" accounts."
            });
        });

        medium.forEach(function(item){
            findings.push({
                type:"medium",
                icon:"◆",
                title:"Medium Strength",
                item:item,
                detail:"Consider using a longer password with uppercase, lowercase, numbers, and special characters."
            });
        });

        return {
            total:items.length,
            weak:weak,
            medium:medium,
            strong:strong,
            reusedGroups:reusedGroups,
            findings:findings,
            score:score,
            rating:rating
        };

    },[vault]);

    function generatePassword(){

        let chars="";

        if(upper)chars+="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if(lower)chars+="abcdefghijklmnopqrstuvwxyz";
        if(numbers)chars+="0123456789";
        if(symbols)chars+="!@#$%^&*()-_=+[]{};:,.?";

        if(!chars){
            alert("Select at least one character type.");
            return;
        }

        const values=new Uint32Array(length);
        window.crypto.getRandomValues(values);

        let password="";

        for(let i=0;i<length;i++){
            password+=chars[values[i]%chars.length];
        }

        setGenerated(password);
        setCopied(false);
    }

    async function copyPassword(){

        if(!generated)return;

        try{
            await navigator.clipboard.writeText(generated);
            setCopied(true);

            setTimeout(function(){
                setCopied(false);
            },1500);

        }catch(error){
            console.error("Unable to copy password",error);
        }
    }

    const score=analysis.score;

    return(
        <section className="security-dashboard">

            <div className="section-head">
                <div>
                    <h2>Security Dashboard</h2>
                    <p>Analyze and audit your password security locally.</p>
                </div>
            </div>

            <div className="security-metrics">
                <MetricCard value={analysis.total} label="Total Passwords" icon="🔑"/>
                <MetricCard value={analysis.strong.length} label="Strong Passwords" icon="✓"/>
                <MetricCard value={analysis.weak.length} label="Weak Passwords" icon="⚠"/>
                <MetricCard value={analysis.reusedGroups.length} label="Reused Groups" icon="↻"/>
            </div>

            <div className="security-dashboard-grid">

                <div className="security-panel score-panel">

                    <div className="security-panel-head">
                        <div>
                            <span className="security-eyebrow">OVERALL SECURITY</span>
                            <h3>Security Score</h3>
                        </div>
                        <span className="security-panel-icon">🛡️</span>
                    </div>

                    <div className="security-score">
                        <div className="security-score-number">{score}</div>
                        <div className="security-score-max">/ 100</div>
                    </div>

                    <div className="security-rating">
                        {analysis.rating}
                    </div>

                    <div className="security-score-bar">
                        <span style={{width:score+"%"}}></span>
                    </div>

                    <p className="security-muted">
                        Score is calculated locally from password strength, length, and reuse.
                    </p>

                </div>

                <div className="security-panel">

                    <div className="security-panel-head">
                        <div>
                            <span className="security-eyebrow">ACTION REQUIRED</span>
                            <h3>Security Alerts</h3>
                        </div>

                        <span className="security-alert-count">
                            {analysis.weak.length+analysis.reusedGroups.length}
                        </span>
                    </div>

                    <div className="security-alert-list">

                        {analysis.weak.length>0&&(
                            <div className="security-alert">
                                <span className="security-alert-icon">⚠</span>
                                <div>
                                    <strong>{analysis.weak.length} weak password{analysis.weak.length===1?"":"s"}</strong>
                                    <p>These credentials should be replaced.</p>
                                </div>
                            </div>
                        )}

                        {analysis.reusedGroups.length>0&&(
                            <div className="security-alert">
                                <span className="security-alert-icon">↻</span>
                                <div>
                                    <strong>{analysis.reusedGroups.length} reused password group{analysis.reusedGroups.length===1?"":"s"}</strong>
                                    <p>Using the same password across accounts increases risk.</p>
                                </div>
                            </div>
                        )}

                        {!analysis.weak.length&&!analysis.reusedGroups.length&&(
                            <div className="security-alert secure">
                                <span className="security-alert-icon">✓</span>
                                <div>
                                    <strong>No critical alerts</strong>
                                    <p>No weak or reused passwords were detected.</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>

            <div className="security-panel security-audit-panel">

                <div className="security-panel-head">
                    <div>
                        <span className="security-eyebrow">DETAILED ANALYSIS</span>
                        <h3>Security Audit</h3>
                    </div>

                    <span className="security-audit-total">
                        {analysis.findings.length} finding{analysis.findings.length===1?"":"s"}
                    </span>
                </div>

                {analysis.findings.length>0 ? (
                    <div className="security-findings">

                        {analysis.findings.map(function(finding,index){

                            const item=finding.item;

                            return(
                                <div
                                    className={"security-finding security-finding-"+finding.type}
                                    key={finding.type+"-"+item.category+"-"+item.originalIndex+"-"+index}
                                >

                                    <div className="security-finding-icon">
                                        {finding.icon}
                                    </div>

                                    <div className="security-finding-info">

                                        <div className="security-finding-top">
                                            <div>
                                                <strong>{finding.title}</strong>
                                                <span>{item.category}</span>
                                            </div>

                                            <span className={"security-finding-badge "+(finding.type==="medium"?"medium":"high")}>
                                                {finding.type==="medium"?"Medium":"High"}
                                            </span>
                                        </div>

                                        <h4>{item.title||"Untitled Password"}</h4>
                                        <p>{item.user||"No username provided"}</p>
                                        <small>{finding.detail}</small>

                                        {onFixPassword&&(
                                            <button
                                                type="button"
                                                className="secondary-btn compact security-fix-btn"
                                                onClick={function(){
                                                    onFixPassword(item);
                                                }}
                                            >
                                                Fix Password
                                            </button>
                                        )}

                                    </div>
                                </div>
                            );
                        })}

                    </div>
                ):(
                    <div className="security-empty-audit">
                        <div>✓</div>
                        <strong>All clear</strong>
                        <p>No password security findings were detected.</p>
                    </div>
                )}

            </div>

            <div className="security-panel recommendations-panel">

                <div className="security-panel-head">
                    <div>
                        <span className="security-eyebrow">NEXT STEPS</span>
                        <h3>Recommendations</h3>
                    </div>
                </div>

                <div className="security-recommendations">

                    {analysis.weak.length>0&&(
                        <Recommendation
                            icon="⚠"
                            title="Replace weak passwords"
                            text={"Update "+analysis.weak.length+" weak password"+(analysis.weak.length===1?"":"s")+" using unique credentials."}
                        />
                    )}

                    {analysis.reusedGroups.length>0&&(
                        <Recommendation
                            icon="↻"
                            title="Remove password reuse"
                            text="Use a unique password for every account."
                        />
                    )}

                    {analysis.medium.length>0&&(
                        <Recommendation
                            icon="◆"
                            title="Improve medium passwords"
                            text={"Strengthen "+analysis.medium.length+" medium password"+(analysis.medium.length===1?"":"s")+" for better protection."}
                        />
                    )}

                    {!analysis.weak.length&&!analysis.medium.length&&!analysis.reusedGroups.length&&(
                        <Recommendation
                            icon="✓"
                            title="Maintain your security"
                            text="Your stored passwords currently pass the analyzer checks."
                        />
                    )}

                </div>
            </div>

            <div className="security-panel security-generator-panel">

                <div className="security-panel-head">
                    <div>
                        <span className="security-eyebrow">PASSWORD TOOLKIT</span>
                        <h3>Secure Password Generator</h3>
                    </div>

                    <span className="security-panel-icon">⚡</span>
                </div>

                <div className="security-generator-controls">

                    <div className="security-generator-length">
                        <div>
                            <span>Password Length</span>
                            <strong>{length}</strong>
                        </div>

                        <input
                            type="range"
                            min="8"
                            max="64"
                            value={length}
                            onChange={function(e){
                                setLength(Number(e.target.value));
                            }}
                        />
                    </div>

                    <div className="security-generator-options">

                        <label>
                            <input
                                type="checkbox"
                                checked={upper}
                                onChange={function(e){
                                    setUpper(e.target.checked);
                                }}
                            />
                            Uppercase
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={lower}
                                onChange={function(e){
                                    setLower(e.target.checked);
                                }}
                            />
                            Lowercase
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={numbers}
                                onChange={function(e){
                                    setNumbers(e.target.checked);
                                }}
                            />
                            Numbers
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                checked={symbols}
                                onChange={function(e){
                                    setSymbols(e.target.checked);
                                }}
                            />
                            Symbols
                        </label>

                    </div>
                </div>

                <div className="security-generated-password">

                    <input
                        type="text"
                        value={generated}
                        readOnly
                        placeholder="Generate a secure password..."
                    />

                    <button
                        type="button"
                        className="icon-btn"
                        onClick={copyPassword}
                        disabled={!generated}
                    >
                        {copied?"Copied":"Copy"}
                    </button>

                </div>

                <div className="security-generator-actions">

                    <button
                        type="button"
                        className="secondary-btn compact"
                        onClick={generatePassword}
                    >
                        ⚡ Generate
                    </button>

                    <span>Generated locally using the Web Crypto API.</span>

                </div>

            </div>

            <div className="security-privacy-note">
                <span>🔒</span>
                <div>
                    <strong>Private local analysis</strong>
                    <p>
                        Your encrypted vault is decrypted in browser memory.
                        Security analysis runs locally and plaintext passwords
                        are not sent to the CypherNest backend.
                    </p>
                </div>
            </div>

        </section>
    );
}

function MetricCard({value,label,icon}){
    return(
        <div className="security-metric-card">
            <div className="security-metric-icon">{icon}</div>
            <div>
                <strong>{value}</strong>
                <span>{label}</span>
            </div>
        </div>
    );
}

function Recommendation({icon,title,text}){
    return(
        <div className="security-recommendation">
            <span>{icon}</span>
            <div>
                <strong>{title}</strong>
                <p>{text}</p>
            </div>
        </div>
    );
}
