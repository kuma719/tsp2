// firebase-bridge.js (type="module")
// window.firebaseAPI を提供（Babel JSX から利用）
import { app, auth, authReady } from "./firebase-init.js";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore, serverTimestamp, collection, doc, setDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

await authReady; // 認証永続化が完了してから

// 初期化
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return result?.user ?? null;
}
async function doSignOut() {
  await signOut(auth);
}
function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}
async function uploadFile(path, fileOrBlob, contentType) {
  const storageRef = ref(storage, path);
  const snap = await uploadBytes(storageRef, fileOrBlob, contentType ? { contentType } : undefined);
  const url = await getDownloadURL(snap.ref);
  return { url, path: snap.ref.fullPath, contentType: contentType || fileOrBlob.type || null };
}
async function saveMemoryDoc(data) {
  const memoriesRef = collection(db, "memories");
  const newDocRef = doc(memoriesRef); // auto-ID
  await setDoc(newDocRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return newDocRef.id;
}

// 公開
window.firebaseAPI = {
  auth,
  signInWithGoogle,
  signOut: doSignOut,
  onAuth,
  uploadFile,
  saveMemoryDoc,
};
