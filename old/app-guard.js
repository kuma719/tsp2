// app-guard.js（修正版・type="module" で読み込み）
import { auth,authReady } from "./firebase-init.js";
await authReady;
import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const LOGIN_URL = "/login.html";
const isLoginPage = () => /(?:^|\/)login(?:-redirect)?(?:\.html)?$/.test(location.pathname);
console.log(isLoginPage());
onAuthStateChanged(auth, (user) => {
  if (!user && !isLoginPage()) {
    location.replace(LOGIN_URL);
  }
});

