ローカル保存（IndexedDB）を基本とし、共有リンクボタンで一時的にサーバー（Firebase Storage / Firestore）にアップロードできるシングルページアプリです。
UI は Tailwind（CDN）で構築。UI だけ触りたい人向けのサンドボックスも同梱します。

目次

特徴

リポジトリ構成

クイックスタート：UIだけ触る

フル機能で動かす（Firebase連携）

1) Firebase プロジェクト作成

2) Firebase 設定ファイルの作成

3) Firebase コンソール設定

4) セキュリティルール

5) ローカル動作確認

デプロイ（手動）

よくあるエラーと対処

貢献ガイド（UI/機能それぞれ）

ライセンス

特徴

ローカル保存：タイトル/メモ/画像・動画を IndexedDB に保存（サーバー送信なし）

バックアップ書き出し（.tsp）／読み込み

共有リンク（1時間有効）：Storage に .tsp を保存し、Firestore にメタ情報（TTL）を書き込み

PWA 対応（動的 manifest / Service Worker）

UI は Tailwind（CDN）で編集容易

リポジトリ構成
.
├── index.html              # 本体（フル機能版）
├── firebase-init.js        # Firebase 初期化（各自のプロジェクト値に差し替え）
├── UI.html         # UIだけ触る人用のサンドボックス（機能なし）
├── public/                 # （任意）Hosting用に使う場合
├── functions/              # （任意）Cloud Functions（TTL後の掃除など）
├── firebase.json           # Firebase Hosting/Functions 設定
├── .firebaserc             # Firebase プロジェクトエイリアス
└── README.md


UI担当者は ui-sandbox.html を編集すれば、機能を壊さず見た目だけ変更できます。
機能担当者は index.html / firebase-init.js / functions/ を触ります。

クイックスタート：UIだけ触る

前提：ブラウザがあればOK（Nodeやnpm不要）

リポジトリをクローン or ZIP解凍

ui-sandbox.html をダブルクリックしてブラウザで開く

Tailwindのクラスや埋め込みCSSを編集 → ブラウザでリロード

（任意）VS Code の Live Server を使うと自動リロードできて便利

フル機能で動かす（Firebase連携）
1) Firebase プロジェクト作成

https://console.firebase.google.com/
 で新規プロジェクトを作成

プロジェクトID（例：toyama-sticker-project）を控える

2) Firebase 設定ファイルの作成

firebase-init.js を作り、あなたのプロジェクトの値に差し替えます。
（Firebaseコンソール > プロジェクト設定 > SDKの設定と構成）

// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com", // or "toyama-sticker-project-asia" など
  messagingSenderId: "XXXXXX",
  appId: "XXXXXX"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 認証完了を待つ Promise（index.html から await で利用）
export const authReady = new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, () => {
    unsub();
    resolve();
  });
});


別リージョンのバケットを使うなら、index.html 側の
getStorage(app, 'gs://YOUR_BUCKET') で明示します。

3) Firebase コンソール設定

Authentication → サインイン方法 → 匿名 を有効化

Firestore Database → 作成（本番/テスト どちらでも可）

Storage → バケットを作成 or 既存を使用

例：YOUR_PROJECT.appspot.com または toyama-sticker-project-asia

4) セキュリティルール

匿名ログインユーザーのみ shares/ 配下を読書き可能にする例です。

Firestore ルール（shares コレクション）

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shares/{id} {
      allow read, write: if request.auth != null; // 匿名でも可（要Auth）
    }
  }
}


Storage ルール（shares/ フォルダ）

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /shares/{allPaths=**} {
      allow read, write: if request.auth != null; // 匿名でも可（要Auth）
    }
  }
}


注意：公開範囲はプロダクト要件に合わせて調整してください。（厳しめにしたい場合は、書き込みのみ許可＆読み込みは所有者チェックなど）

TTL（有効期限）について

Firestore 側：shares/{id} に expiresAt フィールド（Timestamp）を書き込んでいます。

自動削除したい場合は、Firestore の TTLポリシー を有効化して expiresAt を対象に設定してください。

TTLでドキュメントが削除されると、Cloud Functions（onDocumentDeleted）で対応する Storage ファイルを削除するフックを置けます。

Functions の例は functions/index.js に配置（必要な場合のみ）。
課金が必要になるため、プロジェクトの課金（Blaze）・API有効化を忘れずに。

5) ローカル動作確認

ローカルで開くだけ

index.html をダブルクリック（匿名Auth/Storage/Firestoreにアクセス）

簡易サーバーで開く（CORSやモジュールの都合で必要な場合）

npx serve .
# → http://localhost:3000/index.html

デプロイ（手動）
Firebase Hosting を使う場合

Firebase CLI をインストール

npm i -g firebase-tools
firebase login


初期化（まだなら）

firebase init hosting
# public ディレクトリ or 直下を選択（本プロジェクトに合わせて）


デプロイ

firebase deploy --only hosting --project YOUR_PROJECT


CI/CD（GitHub Actions）で自動化したい場合は、Actions のワークフローを追加してください（※このREADMEでは割愛）。

よくあるエラーと対処
Service storage is not available

firebase-init.js の設定が間違っている / Storageが未有効化

匿名Auth有効化前に Storage を触っている
→ await authReady → signInAnonymously() → getStorage() の順に

FirebaseError: Missing or insufficient permissions.

Firestore/Storage のセキュリティルールが認証条件と一致していない

匿名ログイン前に書き込もうとしている

CORS/Preflight で失敗

Storage に 未認証で直接POST していないか確認

Web SDK の uploadBytes / getDownloadURL を使用（XHR直接より安全）

Identifier 'renderGallery' has already been declared

同名の関数/変数を重複定義している（UIコード統合時に発生しやすい）
→ どちらかをリネーム or 片方を削除

Cannot read properties of null (reading 'checked')

#compressToggle が DOM に存在しない状態で参照している
→ 該当要素の有無を確認 or document.getElementById(...)?.checked ?? false

貢献ガイド（UI/機能それぞれ）
UI のみ変更したい人

触るファイル：ui-sandbox.html（推奨）/ index.html の スタイル部分のみ

手順：ui-sandbox.html をブラウザで開いて、Tailwind クラスを編集

PR：スクリーンショット/GIF を添付してください

機能（データ/共有/削除）を変更したい人

触るファイル：index.html / firebase-init.js / functions/

共有リンクの仕様：.tsp を Storage shares/ に保存、Firestore shares/{id} に path/expiresAt

TTL後の後始末：Firestore TTL でドキュメント削除 → Functions で Storage ファイル削除

ブランチ運用例

feat/ui-xxxx（見た目）

feat/share-xxxx（共有機能）

fix/xxxx（不具合対応）

ライセンス

（必要に応じて記載）

差し替えが必要な箇所（チェックリスト）

 firebase-init.js の firebaseConfig

 index.html の getStorage(app, 'gs://...')（別バケットを使う場合）

 Firestore/Storage ルールの調整（匿名の扱い・読み取り条件など）

 TTL（FirestoreのTTL機能）・Functions（掃除用トリガー）を使うかどうか

 Firebase Hosting の public ディレクトリ設定