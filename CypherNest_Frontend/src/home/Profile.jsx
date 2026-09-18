import {useEffect,useState,useCallback} from "react";
import Cropper from "react-easy-crop";
import api from "../api";

const createCroppedImage=async(imageSrc,pixelCrop)=>{
    const image=new Image();
    image.src=imageSrc;

    await new Promise((resolve,reject)=>{
        image.onload=resolve;
        image.onerror=reject;
    });

    const canvas=document.createElement("canvas");
    const size=Math.min(pixelCrop.width,pixelCrop.height);
    canvas.width=size;
    canvas.height=size;

    const context=canvas.getContext("2d");

    context.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size
    );

    return new Promise((resolve,reject)=>{
        canvas.toBlob(blob=>{
            if(!blob){
                reject(new Error("Unable to crop image"));
                return;
            }
            resolve(blob);
        },"image/jpeg",0.92);
    });
};

export default function Profile(){
    const [profile,setProfile]=useState(null);
    const [username,setUsername]=useState("");
    const [phone,setPhone]=useState("");
    const [image,setImage]=useState(null);
    const [preview,setPreview]=useState(null);

    const [cropImage,setCropImage]=useState(null);
    const [crop,setCrop]=useState({x:0,y:0});
    const [zoom,setZoom]=useState(1);
    const [croppedAreaPixels,setCroppedAreaPixels]=useState(null);
    const [showCropper,setShowCropper]=useState(false);

    const [message,setMessage]=useState("");
    const [error,setError]=useState("");
    const [loading,setLoading]=useState(true);

    useEffect(()=>{
        loadProfile();
    },[]);

    const loadProfile=async()=>{
        try{
            const response=await api.get("/profile",{withCredentials:true});
            const data=response.data;

            setProfile(data);
            setUsername(data.username||"");
            setPhone(data.phone||"");

            if(data.profile_picture){
                setPreview(`data:${data.profile_picture_type};base64,${data.profile_picture}`);
            }
        }catch(error){
            console.error(error);
            setError(error.response?.data?.error||"Unable to load profile");
        }finally{
            setLoading(false);
        }
    };

    const saveProfile=async()=>{
        setMessage("");
        setError("");

        if(!username.trim()){
            setError("Username is required");
            return;
        }

        try{
            await api.put(
                "/profile",
                {
                    username:username.trim(),
                    phone:phone.trim()
                },
                {withCredentials:true}
            );

            setMessage("Profile updated successfully");
            await loadProfile();
        }catch(error){
            console.error(error);
            setError(error.response?.data?.error||"Unable to update profile");
        }
    };

    const selectImage=(event)=>{
        const file=event.target.files[0];

        if(!file)return;

        if(!["image/jpeg","image/png","image/webp"].includes(file.type)){
            setError("Only JPG, PNG and WEBP images are allowed");
            event.target.value="";
            return;
        }

        if(file.size>2*1024*1024){
            setError("Image must be smaller than 2 MB");
            event.target.value="";
            return;
        }

        const reader=new FileReader();

        reader.onload=()=>{
            setCropImage(reader.result);
            setCrop({x:0,y:0});
            setZoom(1);
            setShowCropper(true);
            setError("");
            setMessage("");
        };

        reader.onerror=()=>{
            setError("Unable to read selected image");
        };

        reader.readAsDataURL(file);
        event.target.value="";
    };

    const onCropComplete=useCallback((_,pixels)=>{
        setCroppedAreaPixels(pixels);
    },[]);

    const cancelCrop=()=>{
        setShowCropper(false);
        setCropImage(null);
        setCroppedAreaPixels(null);
        setZoom(1);
    };

    const applyCrop=async()=>{
        if(!cropImage||!croppedAreaPixels)return;

        try{
            const croppedBlob=await createCroppedImage(cropImage,croppedAreaPixels);
            const croppedFile=new File([croppedBlob],"profile-picture.jpg",{type:"image/jpeg"});

            const localPreview=URL.createObjectURL(croppedBlob);

            if(preview&&preview.startsWith("blob:")){
                URL.revokeObjectURL(preview);
            }

            setImage(croppedFile);
            setPreview(localPreview);
            setShowCropper(false);
            setCropImage(null);
            setCroppedAreaPixels(null);
            setZoom(1);
        }catch(error){
            console.error(error);
            setError("Unable to crop image");
        }
    };

    const uploadImage=async()=>{
        if(!image)return;

        setMessage("");
        setError("");

        if(image.size>2*1024*1024){
            setError("Cropped image is larger than 2 MB");
            return;
        }

        const formData=new FormData();
        formData.append("image",image);

        try{
            await api.post(
                "/profile-picture",
                formData,
                {withCredentials:true}
            );

            setMessage("Profile picture updated successfully");

            if(preview&&preview.startsWith("blob:")){
                URL.revokeObjectURL(preview);
            }

            setImage(null);
            await loadProfile();
        }catch(error){
            console.error(error);
            setError(error.response?.data?.error||"Unable to upload profile picture");
        }
    };

    if(loading){
        return(
            <div className="profile-loading">
                <div className="profile-loading-icon">◉</div>
                <h2>Loading Profile</h2>
                <p>Retrieving your account information.</p>
            </div>
        );
    }

    const initial=(username||profile?.email||"U").charAt(0).toUpperCase();

    return(
        <>
            <div className="profile-page">
                <div className="profile-header">
                    <div>
                        <div className="profile-kicker">ACCOUNT</div>
                        <h1>Profile</h1>
                        <p>Manage your CypherNest account and personal information.</p>
                    </div>

                    <div className="profile-security-badge">
                        <span>●</span>
                        Account Protected
                    </div>
                </div>

                {message&&(
                    <div className="profile-alert profile-success">
                        <span>✓</span>
                        {message}
                    </div>
                )}

                {error&&(
                    <div className="profile-alert profile-error">
                        <span>!</span>
                        {error}
                    </div>
                )}

                <div className="profile-layout">
                    <section className="profile-card profile-main-card">
                        <div className="profile-card-header">
                            <div>
                                <span className="profile-section-label">PROFILE</span>
                                <h2>Personal Information</h2>
                            </div>
                            <span className="profile-card-icon">👤</span>
                        </div>

                        <div className="profile-person">
                            <div className="profile-avatar-large">
                                {preview?
                                    <img src={preview} alt="Profile"/>
                                    :
                                    <span>{initial}</span>
                                }
                            </div>

                            <div className="profile-person-info">
                                <h3>{username||"CypherNest User"}</h3>
                                <p>{profile?.email}</p>

                                <div className="profile-picture-actions">
                                    <label className="profile-upload-button">
                                        Choose Picture
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={selectImage}
                                        />
                                    </label>

                                    {image&&(
                                        <button
                                            className="profile-save-small"
                                            onClick={uploadImage}
                                        >
                                            Upload
                                        </button>
                                    )}
                                </div>

                                <small>Choose a picture, adjust the crop, then upload • Maximum 2 MB</small>
                            </div>
                        </div>

                        <div className="profile-divider"></div>

                        <div className="profile-form">
                            <div className="profile-field">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e=>setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    maxLength="100"
                                />
                            </div>

                            <div className="profile-field">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={profile?.email||""}
                                    disabled
                                />
                                <span className="profile-field-note">
                                    Email is linked to your account and cannot be changed here.
                                </span>
                            </div>

                            <div className="profile-field">
                                <label>Phone Number</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={e=>setPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    maxLength="20"
                                />
                            </div>

                            <button
                                className="profile-save-button"
                                onClick={saveProfile}
                            >
                                Save Changes
                            </button>
                        </div>
                    </section>

                    <aside className="profile-side">
                        <div className="profile-card security-card">
                            <div className="profile-card-header">
                                <div>
                                    <span className="profile-section-label">SECURITY</span>
                                    <h2>Account Status</h2>
                                </div>
                                <span className="profile-card-icon">🛡️</span>
                            </div>

                            <div className="profile-status-row">
                                <div className="status-icon">✓</div>
                                <div>
                                    <strong>Account Active</strong>
                                    <span>Your account is active and protected.</span>
                                </div>
                            </div>

                            <div className="profile-status-row">
                                <div className="status-icon">🔐</div>
                                <div>
                                    <strong>Vault Encryption</strong>
                                    <span>Your vault is encrypted locally.</span>
                                </div>
                            </div>

                            <div className="profile-status-row">
                                <div className="status-icon">✓</div>
                                <div>
                                    <strong>Secure Session</strong>
                                    <span>Your current session is authenticated.</span>
                                </div>
                            </div>
                        </div>

                        <div className="profile-card account-card">
                            <span className="profile-section-label">ACCOUNT</span>
                            <h2>CypherNest</h2>
                            <p>Your profile information is separate from your encrypted vault.</p>

                            <div className="account-detail">
                                <span>Account ID</span>
                                <strong>#{profile?.id}</strong>
                            </div>

                            <div className="account-detail">
                                <span>Member Since</span>
                                <strong>
                                    {profile?.created_at?
                                        new Date(profile.created_at).toLocaleDateString():
                                        "—"
                                    }
                                </strong>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {showCropper&&(
                <div className="crop-modal-overlay">
                    <div className="crop-modal">
                        <div className="crop-modal-header">
                            <div>
                                <span className="profile-section-label">PROFILE PICTURE</span>
                                <h2>Adjust Your Picture</h2>
                                <p>Drag to position and use the slider to zoom.</p>
                            </div>

                            <button className="crop-close-button" onClick={cancelCrop}>×</button>
                        </div>

                        <div className="crop-area">
                            <Cropper
                                image={cropImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={true}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        <div className="crop-controls">
                            <span>−</span>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.05"
                                value={zoom}
                                onChange={e=>setZoom(Number(e.target.value))}
                            />
                            <span>+</span>
                        </div>

                        <div className="crop-actions">
                            <button className="crop-cancel-button" onClick={cancelCrop}>
                                Cancel
                            </button>
                            <button className="crop-apply-button" onClick={applyCrop}>
                                Set Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
