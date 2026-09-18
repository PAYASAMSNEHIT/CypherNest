import {useState} from "react";
import IdentityEditor from "./IdentityEditor";

export default function IdentityCards({vault,setVault}){
    const [sub,setSub]=useState("");
    const [query,setQuery]=useState("");
    const [editing,setEditing]=useState(null);

    const categories=vault.identityCards?.categories||{};
    const categoryNames=Object.keys(categories);

    const items=categoryNames.flatMap(category=>
        categories[category].map((item,index)=>({
            ...item,
            category,
            originalIndex:index
        }))
    );

    const filtered=items.filter(x=>
        (!sub||x.category===sub)&&
        `${x.name} ${x.type} ${x.number}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );

    const saveItem=(item)=>{
        const category=item.category||sub||categoryNames[0];

        if(!category){
            alert("Please create a category first");
            return;
        }

        if(!item.name||!item.type||!item.number){
            alert("Please fill all required fields");
            return;
        }

        const newCategories={...categories};

        const newItem={
            name:item.name,
            type:item.type,
            number:item.number,
            issueDate:item.issueDate||"",
            expiryDate:item.expiryDate||"",
            notes:item.notes||""
        };

        if(editing==="new"){
            newCategories[category]=[
                ...(newCategories[category]||[]),
                newItem
            ];
        }else{
            const oldCategory=editing.category;
            const oldList=[...(newCategories[oldCategory]||[])];

            oldList.splice(editing.originalIndex,1);
            newCategories[oldCategory]=oldList;

            newCategories[category]=[
                ...(newCategories[category]||[]),
                newItem
            ];
        }

        setVault({
            ...vault,
            identityCards:{
                ...vault.identityCards,
                categories:newCategories
            }
        });

        setEditing(null);
    };

    const addCategory=()=>{
        const name=prompt("Enter category name");

        if(!name)return;

        const category=name.trim();

        if(!category)return;

        if(categories[category]){
            alert("Category already exists");
            return;
        }

        const newCategories={
            ...categories,
            [category]:[]
        };

        setVault({
            ...vault,
            identityCards:{
                ...vault.identityCards,
                categories:newCategories
            }
        });

        setSub(category);
    };

    const deleteCategory=(category)=>{
        if(!confirm(`Delete "${category}" and all documents inside it?`))return;

        const newCategories={...categories};

        delete newCategories[category];

        setVault({
            ...vault,
            identityCards:{
                ...vault.identityCards,
                categories:newCategories
            }
        });

        if(sub===category)setSub("");
    };

    const deleteItem=(item)=>{
        if(!confirm("Delete this identity document?"))return;

        const oldList=[...(categories[item.category]||[])];

        oldList.splice(item.originalIndex,1);

        setVault({
            ...vault,
            identityCards:{
                ...vault.identityCards,
                categories:{
                    ...categories,
                    [item.category]:oldList
                }
            }
        });
    };

    if(editing){
        return(
            <IdentityEditor
                item={editing==="new"?null:editing}
                categories={categoryNames}
                onBack={()=>setEditing(null)}
                onSave={saveItem}
            />
        );
    }

    return(
        <section className="passwords-layout">
            <aside className="password-sidebar">

                <div className="password-sidebar-top">
                    <strong>Categories</strong>

                    <button onClick={addCategory}>
                        ＋
                    </button>
                </div>

                <button
                    className={!sub?"password-category active":"password-category"}
                    onClick={()=>{
                        setSub("");
                        setEditing(null);
                    }}
                >
                    All Identity Cards
                </button>

                {categoryNames.map(category=>(
                    <div
                        className="password-category-row"
                        key={category}
                    >
                        <button
                            className={sub===category?"password-category active":"password-category"}
                            onClick={()=>{
                                setSub(category);
                                setEditing(null);
                            }}
                        >
                            {category}
                        </button>

                        <button
                            className="delete-category"
                            onClick={()=>deleteCategory(category)}
                        >
                            ×
                        </button>
                    </div>
                ))}

            </aside>

            <div className="password-main">

                <div className="section-head">

                    <div>
                        <h2>{sub||"Identity Cards"}</h2>

                        <p>
                            {sub?
                                `${sub} documents`:
                                "Keep important identity documents organized."
                            }
                        </p>
                    </div>

                    <button
                        className="primary-small"
                        onClick={()=>{
                            if(!categoryNames.length){
                                alert("Please create a category first");
                                return;
                            }

                            setEditing("new");
                        }}
                    >
                        ＋ Add Identity
                    </button>

                </div>

                <div className="search">
                    <span>⌕</span>

                    <input
                        placeholder="Search identity cards..."
                        value={query}
                        onChange={e=>setQuery(e.target.value)}
                    />
                </div>

                <div className="item-list">

                    {filtered.length?(
                        filtered.map((x,i)=>(
                            <div
                                className="vault-item"
                                key={`${x.category}-${x.originalIndex}-${i}`}
                            >

                                <div className="item-icon">
                                    🪪
                                </div>

                                <div className="item-info">
                                    <strong>{x.name}</strong>

                                    <span>
                                        {x.type} · {x.number}
                                    </span>
                                </div>

                                <span className="pill">
                                    {x.category}
                                </span>

                                <button
                                    className="icon-btn"
                                    onClick={()=>setEditing(x)}
                                >
                                    Edit
                                </button>

                                <button
                                    className="icon-btn"
                                    onClick={()=>deleteItem(x)}
                                >
                                    Delete
                                </button>

                            </div>
                        ))
                    ):(
                        <div className="empty">

                            <div>🪪</div>

                            <h3>
                                {sub?
                                    "No documents in this category yet.":
                                    "No identity documents yet."
                                }
                            </h3>

                            <p>
                                Add your first identity document.
                            </p>

                            <button
                                className="secondary-btn compact"
                                onClick={()=>{
                                    if(!categoryNames.length){
                                        addCategory();
                                    }else{
                                        setEditing("new");
                                    }
                                }}
                            >
                                ＋ Add Identity
                            </button>

                        </div>
                    )}

                </div>

            </div>
        </section>
    );
}