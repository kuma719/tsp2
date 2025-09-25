// firebase-init.js (ES Modules, Firebase v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence,browserSessionPersistence,inMemoryPersistence } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ▼▼▼ あなたの Firebase 設定に置き換えてください ▼▼▼
export const firebaseConfig = {
  apiKey: "AIzaSyCu3Y-5Cxf4OEdww3q_hcT-nydrW1-o3mc",
  authDomain: "toyama-sticker-project.firebaseapp.com",
  projectId: "toyama-sticker-project",
  storageBucket: "toyama-sticker-project.firebasestorage.app",
  messagingSenderId: "491041450999",
  appId: "1:491041450999:web:05744e00152305b3d15cf2"
};
// ▲▲▲ ここまで ▲▲▲
console.log("FIrebase init:",firebaseConfig);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
console.log("auth:",auth);

// ★ 永続化はここ1か所で実施し、必ず await（フォールバック付き）
export const authReady = (async () => {
  try { await setPersistence(auth, browserLocalPersistence); console.log("[auth] persistence=local"); }
  catch { try { await setPersistence(auth, browserSessionPersistence); console.log("[auth] persistence=session"); }
          catch { await setPersistence(auth, inMemoryPersistence); console.log("[auth] persistence=memory"); } }
})();

