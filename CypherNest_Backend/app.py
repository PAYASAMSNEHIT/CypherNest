from flask import Flask,request,jsonify,session
import os
from dotenv import load_dotenv
from flask_cors import CORS
import mysql.connector
import bcrypt
import pyotp
import qrcode
import base64
import smtplib
from email.message import EmailMessage
from flask import Flask,request,jsonify,session
from otp import genotp
from phrase import genphrase

load_dotenv()

app=Flask(__name__)
app.secret_key=os.getenv("FLASK_SECRET_KEY")
if not app.secret_key:
    raise RuntimeError("FLASK_SECRET_KEY is not set")

frontend_url=os.getenv("FRONTEND_URL","http://localhost:5173")
CORS(app,supports_credentials=True,origins=[frontend_url])

is_production=os.getenv("FLASK_ENV","").lower()=="production"
app.config.update(
    SESSION_COOKIE_SECURE=is_production,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="None" if is_production else "Lax"
)

def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST","127.0.0.1"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME","securevault")
    )

EMAIL=os.getenv("EMAIL")
EMAIL_PASSWORD=os.getenv("EMAIL_PASSWORD")


@app.route("/")
def home():
    return "SecureVault is running"

def send_email(to,subject,message,file_name=None,file_data=None):
    email=EmailMessage()
    email["From"]=EMAIL
    email["To"]=to
    email["Subject"]=subject
    email.set_content(message)
    if file_name and file_data:
        email.add_attachment(file_data,maintype="text",subtype="plain",filename=file_name)
    server=smtplib.SMTP("smtp.gmail.com",587)
    server.starttls()
    server.login(EMAIL,EMAIL_PASSWORD)
    server.send_message(email)
    server.quit()

@app.route("/register",methods=["POST"])
def register():
    data=request.get_json()
    email=data.get("email")
    phone=data.get("phone")
    password=data.get("password")
    if not email or not phone or not password:
        return jsonify({"message":"Email,phone and password are required"}),400
    if len(password)<8:
        return jsonify({"message":"Password must be at least 8 characters"}),400
    db=get_db()
    cursor=db.cursor()
    cursor.execute("SELECT id FROM users WHERE email=%s",(email,))
    user=cursor.fetchone()
    if user:
        cursor.close()
        return jsonify({"message":"User already exists"}),400
    password_hash=bcrypt.hashpw(password.encode(),bcrypt.gensalt()).decode()
    totp_secret=pyotp.random_base32()
    email_otp=genotp()
    email_otp_hash=bcrypt.hashpw(email_otp.encode(),bcrypt.gensalt()).decode()
    cursor.execute("INSERT INTO users(email,phone,password_hash,totp_secret,email_otp_hash,totp_enabled) VALUES(%s,%s,%s,%s,%s,FALSE)",(email,phone,password_hash,totp_secret,email_otp_hash))
    db.commit()
    cursor.close()
    send_email(email,"SecureVault Email Verification","Your SecureVault OTP is: "+email_otp)
    return jsonify({"message":"OTP sent to your email"}),201

@app.route("/verify-email",methods=["POST"])
def verify_email():
    data=request.get_json()
    email=data.get("email")
    otp=data.get("otp")
    if not email or not otp:
        return jsonify({"message":"Email and OTP are required"}),400
    db=get_db()
    cursor=db.cursor()
    cursor.execute("SELECT id,email_otp_hash,totp_secret FROM users WHERE email=%s",(email,))
    user=cursor.fetchone()
    if not user:
        cursor.close()
        return jsonify({"message":"User not found"}),404
    if not bcrypt.checkpw(otp.encode(),user[1].encode()):
        cursor.close()
        return jsonify({"message":"Wrong OTP"}),400
    phrase=genphrase()
    phrase_hash=bcrypt.hashpw(phrase.encode(),bcrypt.gensalt()).decode()
    cursor.execute("UPDATE users SET email_verified=1,phrase_hash=%s WHERE email=%s",(phrase_hash,email))
    db.commit()
    totp=pyotp.TOTP(user[2])
    uri=totp.provisioning_uri(name=email,issuer_name="SecureVault")
    qrcode.make(uri).save("google_authenticator.png")
    cursor.close()
    send_email(email,"Your SecureVault Secret Key","Your SecureVault secret key is attached as a text file. Keep this file safe.","securevault_secret_key.txt",phrase.encode())
    return jsonify({"message":"Email verified","phrase_sent":True,"message2":"Secret key sent as a text file","qr_code":uri}),200

@app.route("/login",methods=["POST"])
def login():
    data=request.get_json()
    email=data.get("email")
    password=data.get("password")
    otp=data.get("otp")
    if not email or not password or not otp:
        return jsonify({"message":"Email,password and OTP are required"}),400
    db=get_db()
    cursor=db.cursor()
    cursor.execute("SELECT id,email,password_hash,totp_secret,email_verified,totp_enabled FROM users WHERE email=%s",(email,))
    user=cursor.fetchone()
    if not user:
        cursor.close()
        return jsonify({"message":"User not found"}),400
    if not user[4]:
        cursor.close()
        return jsonify({"message":"Please verify your email first"}),400
    if not bcrypt.checkpw(password.encode(),user[2].encode()):
        cursor.close()
        return jsonify({"message":"Wrong password"}),400
    totp=pyotp.TOTP(user[3])
    if not totp.verify(otp,valid_window=1):
        cursor.close()
        return jsonify({"message":"Wrong authenticator OTP"}),400
    if not user[5]:
        cursor.execute("UPDATE users SET totp_enabled=TRUE WHERE id=%s",(user[0],))
        db.commit()
    session["user_id"]=user[0]
    session["email"]=user[1]
    cursor.close()
    return jsonify({"message":"Login successful","user_id":user[0],"email":user[1]}),200

@app.route("/login-key",methods=["POST"])
def login_key():
    email=request.form.get("email")
    key_file=request.files.get("key")
    if not email or not key_file:
        return jsonify({"message":"Email and secret key file are required"}),400
    try:
        key=key_file.read().decode().strip()
    except:
        return jsonify({"message":"Invalid secret key file"}),400
    db=get_db()
    cursor=db.cursor()
    cursor.execute("SELECT id,email,phrase_hash,email_verified FROM users WHERE email=%s",(email,))
    user=cursor.fetchone()
    if not user:
        cursor.close()
        return jsonify({"message":"User not found"}),400
    if not user[3]:
        cursor.close()
        return jsonify({"message":"Please verify your email first"}),400
    if not user[2]:
        cursor.close()
        return jsonify({"message":"Secret key is not available"}),400
    if not bcrypt.checkpw(key.encode(),user[2].encode()):
        cursor.close()
        return jsonify({"message":"Wrong secret key"}),400
    session["user_id"]=user[0]
    session["email"]=user[1]
    cursor.close()
    return jsonify({"message":"Login successful","user_id":user[0],"email":user[1]}),200

@app.route("/vault",methods=["GET"])
def get_vault():
    if "user_id" not in session:
        return jsonify({"message":"Not logged in"}),401
    user_id=session["user_id"]
    db=get_db()
    cursor=db.cursor()
    cursor.execute("SELECT ciphertext,iv,salt,wrapped_vek FROM vaults WHERE user_id=%s",(user_id,))
    vault=cursor.fetchone()
    cursor.close()
    if not vault:
        return jsonify({"exists":False}),200
    return jsonify({
        "exists":True,
        "ciphertext":vault[0],
        "iv":vault[1],
        "salt":vault[2],
        "wrapped_vek":vault[3]
    }),200

@app.route("/vault",methods=["POST"])
def create_vault():
    if "user_id" not in session:
        return jsonify({"message":"Not logged in"}),401
    data=request.get_json()
    ciphertext=data.get("ciphertext")
    iv=data.get("iv")
    salt=data.get("salt","")
    wrapped_vek=data.get("wrapped_vek")
    if not ciphertext or not iv or not wrapped_vek:
        return jsonify({"message":"Encrypted vault data is required"}),400
    user_id=session["user_id"]
    db=get_db()
    cursor=db.cursor()
    cursor.execute("SELECT id FROM vaults WHERE user_id=%s",(user_id,))
    if cursor.fetchone():
        cursor.close()
        return jsonify({"message":"Vault already exists"}),400
    cursor.execute("INSERT INTO vaults(user_id,ciphertext,iv,salt,wrapped_vek) VALUES(%s,%s,%s,%s,%s)",(user_id,ciphertext,iv,salt,wrapped_vek))
    db.commit()
    cursor.close()
    return jsonify({"message":"Encrypted vault created"}),201

@app.route("/vault",methods=["PUT"])
def update_vault():
    if "user_id" not in session:
        return jsonify({"message":"Not logged in"}),401
    data=request.get_json()
    ciphertext=data.get("ciphertext")
    iv=data.get("iv")
    if not ciphertext or not iv:
        return jsonify({"message":"Encrypted vault data is required"}),400
    user_id=session["user_id"]
    db=get_db()
    cursor=db.cursor()
    cursor.execute("SELECT id FROM vaults WHERE user_id=%s",(user_id,))
    if not cursor.fetchone():
        cursor.close()
        return jsonify({"message":"Vault does not exist"}),404
    cursor.execute("UPDATE vaults SET ciphertext=%s,iv=%s WHERE user_id=%s",(ciphertext,iv,user_id))
    db.commit()
    cursor.close()
    return jsonify({"message":"Vault updated successfully"}),200

@app.route("/vault",methods=["DELETE"])
def delete_vault():
    if "user_id" not in session:
        return jsonify({"message":"Not logged in"}),401
    user_id=session["user_id"]
    db=get_db()
    cursor=db.cursor()
    cursor.execute("DELETE FROM vaults WHERE user_id=%s",(user_id,))
    db.commit()
    cursor.close()
    session.clear()
    return jsonify({"message":"Vault deleted"}),200

@app.route("/logout",methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message":"Logged out"}),200


@app.route("/profile",methods=["GET"])
def get_profile():
    if "user_id" not in session:
        return jsonify({"error":"Not logged in"}),401

    db=get_db()
    cursor=db.cursor(dictionary=True)
    cursor.execute("SELECT id,email,username,phone,profile_picture_type,created_at,email_verified,totp_enabled FROM users WHERE id=%s",(session["user_id"],))
    user=cursor.fetchone()
    cursor.close()
    db.close()

    if not user:
        return jsonify({"error":"User not found"}),404

    user["profile_picture"]=None

    db=get_db()
    cursor=db.cursor()
    cursor.execute("SELECT profile_picture FROM users WHERE id=%s",(session["user_id"],))
    result=cursor.fetchone()
    cursor.close()
    db.close()

    if result and result[0]:
        user["profile_picture"]=base64.b64encode(result[0]).decode("utf-8")

    return jsonify(user),200


@app.route("/profile",methods=["PUT"])
def update_profile():
    if "user_id" not in session:
        return jsonify({"error":"Not logged in"}),401

    data=request.get_json()
    username=data.get("username","").strip()
    phone=data.get("phone","").strip()

    if not username:
        return jsonify({"error":"Username is required"}),400

    if len(username)>100:
        return jsonify({"error":"Username is too long"}),400

    if len(phone)>20:
        return jsonify({"error":"Phone number is too long"}),400

    db=get_db()
    cursor=db.cursor()

    try:
        cursor.execute("UPDATE users SET username=%s,phone=%s WHERE id=%s",(username,phone,session["user_id"]))
        db.commit()
    except mysql.connector.IntegrityError:
        cursor.close()
        db.close()
        return jsonify({"error":"Username already exists"}),409

    cursor.close()
    db.close()

    return jsonify({"message":"Profile updated successfully"}),200


@app.route("/profile-picture",methods=["POST"])
def update_profile_picture():
    if "user_id" not in session:
        return jsonify({"error":"Not logged in"}),401

    if "image" not in request.files:
        return jsonify({"error":"No image uploaded"}),400

    image=request.files["image"]

    if not image.mimetype in ["image/jpeg","image/png","image/webp"]:
        return jsonify({"error":"Only JPG, PNG and WEBP images are allowed"}),400

    image_data=image.read()

    if len(image_data)>2*1024*1024:
        return jsonify({"error":"Image must be smaller than 2 MB"}),400

    db=get_db()
    cursor=db.cursor()
    cursor.execute("UPDATE users SET profile_picture=%s,profile_picture_type=%s WHERE id=%s",(image_data,image.mimetype,session["user_id"]))
    db.commit()
    cursor.close()
    db.close()

    return jsonify({"message":"Profile picture updated successfully"}),200



if __name__=="__main__":
    app.run(host="127.0.0.1",port=5000,debug=True)