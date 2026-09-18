SECUREVAULT FRONTEND

Structure:
src/
  App.jsx
  api.js
  main.jsx
  style.css
  register/Register.jsx
  verify-email/VerifyEmail.jsx
  login/Login.jsx
  login-key/LoginKey.jsx
  home/Home.jsx

Each React route has its own folder:
Register.jsx -> Flask /register
VerifyEmail.jsx -> Flask /verify-email
Login.jsx -> Flask /login
LoginKey.jsx -> Flask /login-key
Home.jsx -> shown after successful login

Run:
npm install
npm run dev

Flask must run on:
http://127.0.0.1:5000

React normally runs on:
http://127.0.0.1:5173
