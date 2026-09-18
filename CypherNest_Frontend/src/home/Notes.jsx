import {useState} from "react";

export default function Notes({vault,setVault}){
    const [sub,setSub]=useState("");
    const [query,setQuery]=useState("");
    const [editing,setEditing]=useState(null);
    const [form,setForm]=useState({title:"",content:"",category:""});

    const categories=vault.notes?.categories||{};
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
        `${x.title} ${x.content}`.toLowerCase().includes(query.toLowerCase())
    );

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
            notes:{
                ...vault.notes,
                categories:newCategories
            }
        });

        setSub(category);
    };

    const deleteCategory=category=>{
        if(!confirm(`Delete "${category}" and all notes inside it?`))return;

        const newCategories={...categories};
        delete newCategories[category];

        setVault({
            ...vault,
            notes:{
                ...vault.notes,
                categories:newCategories
            }
        });

        if(sub===category)setSub("");
    };

    const openNew=()=>{
        if(!categoryNames.length){
            alert("Please create a category first");
            return;
        }

        setForm({
            title:"",
            content:"",
            category:sub||categoryNames[0]
        });

        setEditing("new");
    };

    const openEdit=item=>{
        setForm({
            title:item.title,
            content:item.content,
            category:item.category
        });

        setEditing(item);
    };

    const saveNote=()=>{
        if(!form.title.trim()){
            alert("Note title is required");
            return;
        }

        if(!form.content.trim()){
            alert("Note content is required");
            return;
        }

        if(!form.category){
            alert("Please select a category");
            return;
        }

        const newCategories={...categories};

        const newItem={
            title:form.title.trim(),
            content:form.content
        };

        if(editing==="new"){
            newCategories[form.category]=[
                ...(newCategories[form.category]||[]),
                newItem
            ];
        }else{
            const oldCategory=editing.category;
            const oldList=[...(newCategories[oldCategory]||[])];

            oldList.splice(editing.originalIndex,1);
            newCategories[oldCategory]=oldList;

            newCategories[form.category]=[
                ...(newCategories[form.category]||[]),
                newItem
            ];
        }

        setVault({
            ...vault,
            notes:{
                ...vault.notes,
                categories:newCategories
            }
        });

        setEditing(null);
    };

    const deleteNote=item=>{
        if(!confirm("Delete this note?"))return;

        const oldList=[...(categories[item.category]||[])];
        oldList.splice(item.originalIndex,1);

        setVault({
            ...vault,
            notes:{
                ...vault.notes,
                categories:{
                    ...categories,
                    [item.category]:oldList
                }
            }
        });
    };

    if(editing){
        return(
            <section className="editor content">
                <div className="editor-header">
                    <div>
                        <h1>{editing==="new"?"Add Note":"Edit Note"}</h1>
                        <p>Your note is encrypted in the browser.</p>
                    </div>
                </div>

                <div className="editor-form">
                    <label>Note Title</label>
                    <input
                        type="text"
                        placeholder="Enter note title"
                        value={form.title}
                        onChange={e=>setForm({...form,title:e.target.value})}
                    />

                    <label>Category</label>
                    <select
                        value={form.category}
                        onChange={e=>setForm({...form,category:e.target.value})}
                    >
                        {categoryNames.map(category=>(
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <label>Note Content</label>
                    <textarea
                        placeholder="Write your secure note..."
                        rows="10"
                        value={form.content}
                        onChange={e=>setForm({...form,content:e.target.value})}
                    />

                    <div className="editor-actions">
                        <button
                            className="secondary-button"
                            onClick={()=>setEditing(null)}
                        >
                            Cancel
                        </button>

                        <button
                            className="primary"
                            onClick={saveNote}
                        >
                            Save Note
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return(
        <section className="passwords-layout">
            <aside className="password-sidebar">
                <div className="password-sidebar-header">
                    <span>Categories</span>
                    <button onClick={addCategory}>+</button>
                </div>

                <div
                    className={`password-category ${!sub?"active":""}`}
                    onClick={()=>setSub("")}
                >
                    <span>All Notes</span>
                </div>

                {categoryNames.map(category=>(
                    <div
                        key={category}
                        className={`password-category ${sub===category?"active":""}`}
                        onClick={()=>setSub(category)}
                    >
                        <span>{category}</span>
                        <button
                            onClick={e=>{
                                e.stopPropagation();
                                deleteCategory(category);
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </aside>

            <main className="password-content">
                <div className="password-header">
                    <div>
                        <h1>{sub||"Important Notes"}</h1>
                        <p>Store your important information securely.</p>
                    </div>

                    <button
                        className="primary"
                        onClick={openNew}
                    >
                        + Add Note
                    </button>
                </div>

                <div className="password-search">
                    <span>⌕</span>
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={query}
                        onChange={e=>setQuery(e.target.value)}
                    />
                </div>

                <div className="password-list">
                    {filtered.length===0?(
                        <div className="empty-state">
                            No notes found.
                        </div>
                    ):(
                        filtered.map((item,index)=>(
                            <div className="password-item" key={index}>
                                <div className="password-icon">📝</div>

                                <div className="password-info">
                                    <strong>{item.title}</strong>
                                    <span>
                                        {item.category} · {item.content.slice(0,60)}
                                        {item.content.length>60?"...":""}
                                    </span>
                                </div>

                                <div className="password-actions">
                                    <span className="category-tag">
                                        {item.category}
                                    </span>

                                    <button onClick={()=>openEdit(item)}>
                                        Edit
                                    </button>

                                    <button onClick={()=>deleteNote(item)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </section>
    );
}