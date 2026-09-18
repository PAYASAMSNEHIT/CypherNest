import {useState} from "react";

export default function AtmCardEditor({item,categories,onBack,onSave}){
    const [form,setForm]=useState(item||{
        name:"",
        type:"Visa",
        bank:"",
        holder:"",
        number:"",
        expiry:"",
        cvv:"",
        pin:"",
        category:categories[0]||"",
        notes:""
    });

    const change=(k,v)=>setForm({...form,[k]:v});

    return(
        <section className="editor content">
            <div className="editor-top">
                <button className="back-link" onClick={onBack}>
                    ← ATM Cards
                </button>

                <button
                    className="primary-small"
                    onClick={()=>onSave(form)}
                >
                    Save Card
                </button>
            </div>

            <h2>{item?"Edit ATM Card":"Add ATM Card"}</h2>

            <p className="editor-sub">
                Sensitive card fields will be encrypted in the browser.
            </p>

            <div className="form-grid">

                <label>
                    Card Name *
                    <input
                        value={form.name}
                        onChange={e=>change("name",e.target.value)}
                        placeholder="e.g. HDFC Debit Card"
                    />
                </label>

                <label>
                    Card Type *
                    <select
                        value={form.type}
                        onChange={e=>change("type",e.target.value)}
                    >
                        <option>Visa</option>
                        <option>Mastercard</option>
                        <option>RuPay</option>
                        <option>American Express</option>
                        <option>Other</option>
                    </select>
                </label>

                <label>
                    Bank *
                    <input
                        value={form.bank}
                        onChange={e=>change("bank",e.target.value)}
                        placeholder="Bank name"
                    />
                </label>

                <label>
                    Cardholder Name *
                    <input
                        value={form.holder}
                        onChange={e=>change("holder",e.target.value)}
                        placeholder="Name on card"
                    />
                </label>

                <label>
                    Card Number *
                    <input
                        value={form.number}
                        onChange={e=>change("number",e.target.value)}
                        placeholder="Card number"
                    />
                </label>

                <label>
                    Expiry Date *
                    <input
                        value={form.expiry}
                        onChange={e=>change("expiry",e.target.value)}
                        placeholder="MM/YY"
                    />
                </label>

                <label>
                    CVV *
                    <input
                        type="password"
                        value={form.cvv}
                        onChange={e=>change("cvv",e.target.value)}
                        placeholder="CVV"
                    />
                </label>

                <label>
                    PIN *
                    <input
                        type="password"
                        value={form.pin}
                        onChange={e=>change("pin",e.target.value)}
                        placeholder="ATM PIN"
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