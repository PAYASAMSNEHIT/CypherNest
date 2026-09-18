import {useState} from "react";
import PasswordEditor from "./PasswordEditor";

export default function Passwords({vault,setVault}) {
    const [sub,setSub]=useState("");
    const [query,setQuery]=useState("");
    const [editing,setEditing]=useState(null);

    const categories=vault.passwords.categories||{};
    const categoryNames=Object.keys(categories);

    const items=categoryNames.flatMap(category =>
        categories[category].map((item,index) => ({
            ...item,
            category,
            originalIndex:index
        }))
    );

    const filtered=items.filter(x =>
        (!sub||x.category===sub) &&
        `${x.title} ${x.user}`.toLowerCase().includes(query.toLowerCase())
    );

    const saveItem=(item)=>{
        const category=item.category||sub||categoryNames[0];

        if(!category){
            alert("Please create a category first");
            return;
        }

        const newCategories={...categories};

        const newItem={
            title:item.title,
            user:item.user,
            password:item.password,
            website:item.website,
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

            if(editing.originalIndex===undefined){
                setEditing(null);
                return;
            }

            oldList.splice(editing.originalIndex,1);
            newCategories[oldCategory]=oldList;

            newCategories[category]=[
                ...(newCategories[category]||[]),
                newItem
            ];
        }

        setVault({
            ...vault,
            passwords:{
                ...vault.passwords,
                categories:newCategories
            }
        });

        setEditing(null);
    };

    const addCategory=()=>{
        const name=prompt("Enter category name");

        if(!name){
            return;
        }

        const category=name.trim();

        if(!category){
            return;
        }

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
            passwords:{
                ...vault.passwords,
                categories:newCategories
            }
        });

        setSub(category);
    };

    const deleteCategory=(category)=>{
        if(!confirm(`Delete "${category}" and all passwords inside it?`)){
            return;
        }

        const newCategories={...categories};
        delete newCategories[category];

        setVault({
            ...vault,
            passwords:{
                ...vault.passwords,
                categories:newCategories
            }
        });

        if(sub===category){
            setSub("");
        }
    };

    const deletePassword=(item)=>{
        if(!confirm("Delete this password?")){
            return;
        }

        const category=item.category;
        const oldList=[...(categories[category]||[])];

        if(item.originalIndex===undefined){
            return;
        }

        oldList.splice(item.originalIndex,1);

        setVault({
            ...vault,
            passwords:{
                ...vault.passwords,
                categories:{
                    ...categories,
                    [category]:oldList
                }
            }
        });
    };

    return(
        <section className="passwords-layout">
            <aside className="password-sidebar">
                <div className="password-sidebar-top">
                    <strong>Categories</strong>
                    <button onClick={addCategory}>＋</button>
                </div>

                <button
                    className={!sub?"password-category active":"password-category"}
                    onClick={()=>{
                        setSub("");
                        setEditing(null);
                    }}
                >
                    All Passwords
                </button>

                {categoryNames.map(category=>(
                    <div className="password-category-row" key={category}>
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
                {editing ? (
                    <PasswordEditor
                        item={editing==="new"?null:editing}
                        categories={categoryNames}
                        onBack={()=>setEditing(null)}
                        onSave={saveItem}
                    />
                ) : (
                    <>
                        <div className="section-head">
                            <div>
                                <h2>{sub||"Passwords"}</h2>
                                <p>
                                    {sub
                                        ? `${sub} passwords`
                                        : "Store and organize your login credentials."
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
                                ＋ Add Password
                            </button>
                        </div>

                        <div className="search">
                            <span>⌕</span>

                            <input
                                placeholder="Search passwords..."
                                value={query}
                                onChange={e=>setQuery(e.target.value)}
                            />
                        </div>

                        <div className="item-list">
                            {filtered.length ? (
                                filtered.map((x,i)=>(
                                    <div
                                        className="vault-item"
                                        key={`${x.category}-${x.originalIndex}-${i}`}
                                    >
                                        <div className="item-icon">
                                            🔑
                                        </div>

                                        <div className="item-info">
                                            <strong>{x.title}</strong>
                                            <span>{x.user}</span>
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
                                            onClick={()=>deletePassword(x)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <Empty
                                    text={
                                        sub
                                            ? "No passwords in this category yet."
                                            : "No passwords yet."
                                    }
                                    onClick={()=>{
                                        if(!categoryNames.length){
                                            addCategory();
                                        }else{
                                            setEditing("new");
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

function Empty({text,onClick}) {
    return(
        <div className="empty">
            <div>🔐</div>

            <h3>{text}</h3>

            <p>
                Add your first item to this category.
            </p>

            <button
                className="secondary-btn compact"
                onClick={onClick}
            >
                ＋ Add
            </button>
        </div>
    );
}