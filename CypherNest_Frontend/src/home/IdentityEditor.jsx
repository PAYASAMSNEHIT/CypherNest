import {useState} from "react";

export default function IdentityEditor({item,categories,onBack,onSave}){
    const [form,setForm]=useState(item||{
        name:"",
        type:"Aadhaar",
        fullName:"",
        number:"",
        dob:"",
        issue:"",
        expiry:"",
        issuer:"",
        category:categories[0]||"",
        notes:""
    });

    const change=(k,v)=>setForm({...form,[k]:v});

    return(
        <section className="editor content">
            <div className="editor-top">
                <button
                    className="back-link"
                    onClick={onBack}
                >
                    ← Identity Cards
                </button>

                <button
                    className="primary-small"
                    onClick={()=>onSave(form)}
                >
                    Save Identity
                </button>
            </div>

            <h2>
                {item?"Edit Identity Card":"Add Identity Card"}
            </h2>

            <p className="editor-sub">
                Identity information is encrypted in the browser before being stored.
            </p>

            <div className="form-grid">

                <label>
                    Document Name *
                    <input
                        value={form.name}
                        onChange={e=>change("name",e.target.value)}
                        placeholder="e.g. My Passport"
                    />
                </label>

                <label>
                    Document Type *
                    <select
                        value={form.type}
                        onChange={e=>change("type",e.target.value)}
                    >
                        <option>Aadhaar</option>
                        <option>PAN</option>
                        <option>Passport</option>
                        <option>Driving License</option>
                        <option>Voter ID</option>
                        <option>Other</option>
                    </select>
                </label>

                <label>
                    Full Name *
                    <input
                        value={form.fullName}
                        onChange={e=>change("fullName",e.target.value)}
                        placeholder="Name on document"
                    />
                </label>

                <label>
                    Document Number *
                    <input
                        value={form.number}
                        onChange={e=>change("number",e.target.value)}
                        placeholder="Document number"
                    />
                </label>

                <label>
                    Date of Birth
                    <input
                        type="date"
                        value={form.dob}
                        onChange={e=>change("dob",e.target.value)}
                    />
                </label>

                <label>
                    Issue Date
                    <input
                        type="date"
                        value={form.issue}
                        onChange={e=>change("issue",e.target.value)}
                    />
                </label>

                <label>
                    Expiry Date
                    <input
                        type="date"
                        value={form.expiry}
                        onChange={e=>change("expiry",e.target.value)}
                    />
                </label>

                <label>
                    Issued By
                    <input
                        value={form.issuer}
                        onChange={e=>change("issuer",e.target.value)}
                        placeholder="Issuing authority"
                    />
                </label>

                <label>
                    Category *
                    <select
                        value={form.category}
                        onChange={e=>change("category",e.target.value)}
                    >
                        {categories.map(category=>(
                            <option key={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="wide">
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