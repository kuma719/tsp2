// firebase-bridge.js (ESM)
// Exposes modular Firebase helpers on window.firebaseAPI for non-module scripts (e.g., Babel JSX).
import { app, auth, authReady} from "./firebase-init.js";
await authReady; // ← これが大事
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  getIdToken as _getIdToken,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  getFirestore,
  serverTimestamp,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  initializeFirestore,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  getStorage as _getStorage,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";


// 初期化完了を通知する Promise（アプリ側は window.firebaseReady を await 可能）
window.firebaseReady = (async () => {
  try {

    const db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true, // ← ネット環境に応じて自動で Long Polling に切替
      useFetchStreams: false,                  // ← 古い端末/プロキシで安定しやすい
    });
    const storage = getStorage(app); // = _getStorage(app)
    const provider = new GoogleAuthProvider();

    // --- API 定義（ポップアップ方式） ---
    async function signInWithGoogle() {
      const result = await signInWithPopup(auth, provider); // ← ポップアップで完結
      return result?.user ?? null;                           // 呼び出し元で user を使えるよう返す
    }

    async function doSignOut() {
      await signOut(auth);
    }

    function onAuth(cb) {
      return onAuthStateChanged(auth, cb);
    }

    async function uploadFile(path, fileOrBlob, contentType) {
      const storageRef = ref(storage, path);
      const metadata = contentType ? { contentType } : undefined;
      const snap = await uploadBytes(storageRef, fileOrBlob, metadata);
      const url = await getDownloadURL(snap.ref);
      return {
        url,
        path: snap.ref.fullPath,
        contentType: contentType || fileOrBlob.type || null,
      };
    }

    async function updateMemoryDoc(docId, data) {
      const memoriesRef = collection(db, "memories");
      const docRef = doc(memoriesRef, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(), // 更新日時を自動設定
      });
    }
    

    async function saveMemoryDoc(data) {
      const memoriesRef = collection(db, "memories");
      const newDoc = doc(memoriesRef); // auto-ID
      const payload = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newDoc, payload);
      return newDoc.id;
    }

    async function ensureUserProfile(user) {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          email: user.email || null,
          displayName: user.displayName || null,
          onboardingDone: false,
          createdAt: new Date(),
        });
      }
      return ref;
    }

    async function markOnboardingDone(user) {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, { onboardingDone: true });
    }

    async function getIdToken() {
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      } else {
        console.warn("ユーザーが未ログインです");
        return null;
      }
    }

    // グローバル公開
    window.firebaseAPI = {
      auth,
      getDoc,
      signInWithGoogle, 
      signOut: doSignOut,
      onAuth,
      uploadFile,
      saveMemoryDoc,
      updateMemoryDoc, // 更新用の関数も追加
      ensureUserProfile,
      markOnboardingDone,
      getIdToken,
    };

    return true;
  } catch (e) {
    console.error("[firebase-bridge] init failed:", e);
    throw e;
  }
})();