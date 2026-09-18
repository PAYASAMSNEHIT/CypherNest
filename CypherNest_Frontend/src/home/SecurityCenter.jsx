export default function SecurityCenter({profile}){

    const emailVerified=profile?.email_verified;

    const checks=[
        {
            icon:"🔐",
            title:"Vault Encryption",
            status:"Active",
            description:"Vault contents are encrypted with AES-GCM before they are persisted."
        },
        {
            icon:"🧠",
            title:"Local Decryption",
            status:"Active",
            description:"The encrypted vault is decrypted in the browser for authorized use."
        },
        {
            icon:"🛡️",
            title:"TOTP Authentication",
            status:"Available",
            description:"Google Authenticator compatible TOTP two-factor authentication is supported by the account security flow."
        },
        {
            icon:"✉️",
            title:"Email Verification",
            status:emailVerified?"Verified":"Configured",
            description:emailVerified
                ?"Your account email is verified."
                :"Email verification is part of the registration and authentication flow."
        },
        {
            icon:"🔑",
            title:"Secret-Key Login",
            status:"Available",
            description:"CypherNest provides a separate secret-key login path for account access."
        },
        {
            icon:"☁️",
            title:"Server Storage",
            status:"Encrypted Only",
            description:"The backend stores encrypted vault data rather than plaintext vault contents."
        }
    ];

    return(
        <section className="security-dashboard security-center">

            <div className="section-head">
                <div>
                    <h2>Security Center</h2>
                    <p>Review the security controls and architecture protecting your vault.</p>
                </div>
            </div>

            <div className="security-center-banner">
                <div className="security-center-banner-icon">🛡️</div>

                <div>
                    <span className="security-eyebrow">PROTECTION STATUS</span>
                    <h3>Vault protection is active</h3>
                    <p>
                        Sensitive vault contents are encrypted before persistence
                        and security analysis runs locally in the browser.
                    </p>
                </div>

                <span className="security-center-active">PROTECTED</span>
            </div>

            <div className="security-center-grid">
                {checks.map((check,index)=>(
                    <div className="security-center-card" key={index}>

                        <div className="security-center-card-top">
                            <span className="security-center-icon">{check.icon}</span>

                            <span className={`security-center-status ${
                                check.status==="Active"||
                                check.status==="Verified"||
                                check.status==="Encrypted Only"
                                    ?"active"
                                    :"available"
                            }`}>
                                {check.status}
                            </span>
                        </div>

                        <h3>{check.title}</h3>
                        <p>{check.description}</p>

                    </div>
                ))}
            </div>

            <div className="security-panel security-principles">

                <div className="security-panel-head">
                    <div>
                        <span className="security-eyebrow">SECURITY MODEL</span>
                        <h3>How CypherNest protects your vault</h3>
                    </div>
                </div>

                <div className="security-principle-list">

                    <Principle
                        number="01"
                        title="Client-side encryption"
                        text="Vault data is encrypted in the browser before it is sent for persistence."
                    />

                    <Principle
                        number="02"
                        title="Protected vault key"
                        text="A randomly generated Vault Encryption Key protects the encrypted vault through password and secret-key based wrapping."
                    />

                    <Principle
                        number="03"
                        title="Local security analysis"
                        text="Password security checks operate on decrypted vault data in browser memory."
                    />

                    <Principle
                        number="04"
                        title="Lock clears sensitive state"
                        text="Locking the vault removes the active vault key and returns the application to the login flow."
                    />

                </div>
            </div>

            <div className="security-privacy-note">
                <span>🔒</span>

                <div>
                    <strong>Zero-knowledge vault architecture</strong>
                    <p>
                        CypherNest keeps vault contents encrypted for backend
                        persistence. Plaintext vault data is not persisted by
                        the server.
                    </p>
                </div>
            </div>

        </section>
    );
}

function Principle({number,title,text}){
    return(
        <div className="security-principle">
            <span>{number}</span>

            <div>
                <strong>{title}</strong>
                <p>{text}</p>
            </div>
        </div>
    );
}
