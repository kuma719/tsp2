// app-guard.js (type="module")
import { auth, authReady } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


// scriptタグを動的に追加する小ヘルパ
function loadScript(src, { type, attrs } = {}) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    if (type) s.type = type;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    s.onload = () => resolve(true);
    s.onerror = (e) => reject(e);
    document.body.appendChild(s);
  });
}

async function startApp() {
  // 1) Firebase Bridge（window.firebaseAPI を公開）
  await import("./firebase-bridge.js");

  // 2) React / ReactDOM / Babel / Lucide（UMD）
  await loadScript("https://unpkg.com/react@18/umd/react.development.js", { attrs: { crossorigin: "" } });
  await loadScript("https://unpkg.com/react-dom@18/umd/react-dom.development.js", { attrs: { crossorigin: "" } });
  await loadScript("https://unpkg.com/@babel/standalone/babel.min.js");
  await loadScript("https://unpkg.com/lucide@latest");

  // 3) あなたの JSX アプリ本体を Babel で実行
  await loadScript("./script-app.jsx", { type: "text/babel", attrs: { "data-presets": "env,react" } });
}

await authReady; // 永続化完了を待つ（重要）

onAuthStateChanged(auth, (user) => {
  console.log("[guard] auth state changed:", user);
  if (!user) {
    // 未ログイン → ログイン画面へ
    location.replace("/login.html");
  } else {
    // ログイン済み → アプリ開始
    startApp().catch(e => {
      console.error("[guard] startApp failed:", e);
      alert("アプリの読み込みに失敗しました。リロードしてください。");
    });
  }
});
