import {useState} from "react";
import Login from "./login/Login";
import LoginKey from "./login-key/LoginKey";
import Register from "./register/Register";
import VerifyEmail from "./verify-email/VerifyEmail";
import Home from "./home/Home";

function App(){
    const [page,setPage]=useState("login");
    const [email,setEmail]=useState("");
    const [userId,setUserId]=useState(null);
    const [vek,setVek]=useState(null);
    const [unlockSecret,setUnlockSecret]=useState("");

    const loginSuccess=(id,userEmail,key,userVek)=>{
    setUserId(id);
    setEmail(userEmail);
    setUnlockSecret(key);
    setVek(userVek);
    setPage("home");
};

    const lockVault=()=>{
        setVek(null);
        setUnlockSecret("");
        setUserId(null);
        setPage("login");
    };

    if(page==="register"){
    return(
        <Register
            setPage={setPage}
            setEmail={setEmail}
        />
    );
}

    if(page==="verify"){
    return(
        <VerifyEmail
            email={email}
            setPage={setPage}
            setEmail={setEmail}
        />
    );
}

   if(page==="login-key"){
    return <LoginKey setPage={setPage} setEmail={setEmail} loginSuccess={loginSuccess}/>;
}

    if(page==="home"){
        return <Home userId={userId} email={email} vek={vek} setVek={setVek} unlockSecret={unlockSecret} lockVault={lockVault}/>;
    }

    return <Login setPage={setPage} setEmail={setEmail} loginSuccess={loginSuccess}/>;
}

export default App;