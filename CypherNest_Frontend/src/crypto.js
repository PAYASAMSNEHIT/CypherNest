const encoder=new TextEncoder();
const decoder=new TextDecoder();
const ITERATIONS=600000;
const KEY_LENGTH=256;
const IV_LENGTH=12;
const SALT_LENGTH=16;

function bufferToBase64(buffer){
    const bytes=new Uint8Array(buffer);
    let binary="";
    for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function base64ToBuffer(value){
    const binary=atob(value);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return bytes.buffer;
}

function randomBytes(length){
    return crypto.getRandomValues(new Uint8Array(length));
}

async function deriveKey(secret,salt,iterations=ITERATIONS){
    if(!secret)throw new Error("Unlock secret is required");
    const material=await crypto.subtle.importKey("raw",encoder.encode(secret),"PBKDF2",false,["deriveKey"]);
    return crypto.subtle.deriveKey(
        {name:"PBKDF2",salt,iterations,hash:"SHA-256"},
        material,
        {name:"AES-GCM",length:KEY_LENGTH},
        false,
        ["encrypt","decrypt"]
    );
}

async function generateVEK(){
    return crypto.subtle.generateKey(
        {name:"AES-GCM",length:KEY_LENGTH},
        true,
        ["encrypt","decrypt"]
    );
}

async function encryptVault(vault,vek){
    const iv=randomBytes(IV_LENGTH);
    const plaintext=encoder.encode(JSON.stringify(vault));
    const ciphertext=await crypto.subtle.encrypt(
        {name:"AES-GCM",iv},
        vek,
        plaintext
    );
    return {
        ciphertext:bufferToBase64(ciphertext),
        iv:bufferToBase64(iv.buffer)
    };
}

async function decryptVault(ciphertext,iv,vek){
    const plaintext=await crypto.subtle.decrypt(
        {name:"AES-GCM",iv:new Uint8Array(base64ToBuffer(iv))},
        vek,
        base64ToBuffer(ciphertext)
    );
    return JSON.parse(decoder.decode(plaintext));
}

async function wrapVEK(vek,secret){
    const salt=randomBytes(SALT_LENGTH);
    const iv=randomBytes(IV_LENGTH);
    const key=await deriveKey(secret,salt);
    const rawVEK=await crypto.subtle.exportKey("raw",vek);
    const wrapped=await crypto.subtle.encrypt(
        {name:"AES-GCM",iv},
        key,
        rawVEK
    );
    return {
        salt:bufferToBase64(salt.buffer),
        iv:bufferToBase64(iv.buffer),
        data:bufferToBase64(wrapped),
        iterations:ITERATIONS
    };
}

async function unwrapVEK(bundle,secret){
    if(!bundle||!bundle.salt||!bundle.iv||!bundle.data){
        throw new Error("Invalid wrapped VEK");
    }
    const salt=new Uint8Array(base64ToBuffer(bundle.salt));
    const iv=new Uint8Array(base64ToBuffer(bundle.iv));
    const key=await deriveKey(secret,salt,bundle.iterations||ITERATIONS);
    const rawVEK=await crypto.subtle.decrypt(
        {name:"AES-GCM",iv},
        key,
        base64ToBuffer(bundle.data)
    );
    return crypto.subtle.importKey(
        "raw",
        rawVEK,
        {name:"AES-GCM",length:KEY_LENGTH},
        true,
        ["encrypt","decrypt"]
    );
}

async function createVEKBundle(vek,password,secretKey){
    const passwordWrap=await wrapVEK(vek,password);
    const secretWrap=await wrapVEK(vek,secretKey);
    return JSON.stringify({
        version:1,
        algorithm:"AES-GCM-256",
        kdf:"PBKDF2-SHA256",
        password:passwordWrap,
        secretKey:secretWrap
    });
}

function parseVEKBundle(value){
    if(typeof value==="string")return JSON.parse(value);
    return value;
}

async function unlockWithPassword(wrappedVEK,password){
    const bundle=parseVEKBundle(wrappedVEK);
    return unwrapVEK(bundle.password,password);
}

async function unlockWithSecretKey(wrappedVEK,secretKey){
    const bundle=parseVEKBundle(wrappedVEK);
    return unwrapVEK(bundle.secretKey,secretKey);
}

export {
    generateVEK,
    deriveKey,
    encryptVault,
    decryptVault,
    wrapVEK,
    unwrapVEK,
    createVEKBundle,
    unlockWithPassword,
    unlockWithSecretKey,
    bufferToBase64,
    base64ToBuffer
};