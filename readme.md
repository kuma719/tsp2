# TSP QR アルバム

ローカル保存（IndexedDB）を基本とし、**共有リンク**ボタンで一時的にサーバー（Firebase Storage / Firestore）にアップロードできるシングルページアプリです。  
UI は Tailwind（CDN）で構築。**UI だけ触りたい人向けのサンドボックス**も同梱します。

---

## ✨ 特徴
- 🗂️ ローカル保存：タイトル / メモ / 画像・動画を IndexedDB に保存（サーバー送信なし）
- 💾 バックアップ書き出し（`.tsp`）／読み込み
- 🔗 共有リンク（1時間有効）：Storage に `.tsp` を保存し、Firestore にメタ情報（TTL）を書き込み
- ⏳ TTL（有効期限）到達後は Firestore TTL 機能＋Cloud Functions により **自動削除**
- 📱 PWA 対応（動的 manifest / Service Worker）
- 🎨 UI は Tailwind（CDN）で簡単編集

---

## 📂 リポジトリ構成

├── index.html # 本体（フル機能版）

├── firebase-init.js # Firebase 初期化（各自のプロジェクト値に差し替え）
├── ui-sandbox.html # UIだけ触る人用のサンドボックス（機能なし）

├── public/ # Hosting用ディレクトリ

├── functions/ # Cloud Functions（TTL後の掃除）

├── firebase.json # Firebase Hosting/Functions 設定

├── .firebaserc # Firebase プロジェクト設定

└── README.md


> **UI 担当者**は `ui-sandbox.html` を編集すれば、機能を壊さず見た目だけ変更できます。  
> **機能担当者**は `index.html` / `firebase-init.js` / `functions/` を触ります。

---

## 🚀 クイックスタート（UIだけ触る）

**前提**：ブラウザがあればOK（Node.js / npm不要）

1. リポジトリをクローン or ZIP解凍  
2. `ui-sandbox.html` をダブルクリックしてブラウザで開く  
3. Tailwind のクラスや埋め込みCSSを編集 → リロードで即確認  
   - 💡 VS Code の **Live Server** を使うと自動リロード可能

---

## 🔧 フル機能で動かす（Firebase連携）

### 1) Firebase プロジェクト作成
- [Firebase Console](https://console.firebase.google.com/) で新規プロジェクトを作成  
- プロジェクト ID（例：`toyama-sticker-project`）を控える  

### 2) Firebase 設定ファイルの作成
`firebase-init.js` を作り、プロジェクトの値に差し替えます。  

```js
// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "toyama-sticker-project.firebaseapp.com",
  projectId: "toyama-sticker-project",
  storageBucket: "toyama-sticker-project-asia", // 東京リージョンバケットを使用
  messagingSenderId: "XXXXXXX",
  appId: "XXXXXXX"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 匿名ログインを保証
signInAnonymously(auth).catch(console.error);

export const authReady = new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, () => {
    unsub();
    resolve();
  });
});
```
### 3) Firebase コンソール設定
- Authentication → サインイン方法 → 匿名 を有効化
- Firestore Database → 作成
- Storage → バケットを確認（toyama-sticker-project-asia を使用）

### 4) セキュリティルール
- Firestoreルール
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /shares/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
- Storageルール
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /shares/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
### 5) TTL（自動削除）
- Firestore に expiresAt フィールドを保存

- Firestore の TTLポリシーを有効化し、expiresAt を対象に設定

- TTLでドキュメント削除 → Cloud Functions (onDocumentDeleted) がトリガーされて対応する Storage ファイルも削除

### 6) ローカル確認
```
npx serve .
# → http://localhost:3000/index.html
```
