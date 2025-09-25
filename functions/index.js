// Gen2 Storage trigger + Cloud Tasks 経由で Cloud Run を呼ぶ最小構成 (CommonJS)

const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { CloudTasksClient } = require("@google-cloud/tasks");
const { onRequest } = require("firebase-functions/v2/https");
const { getAuth: getAdminAuth } = require("firebase-admin/auth");
const { Storage } = require("@google-cloud/storage");
const crypto = require("node:crypto");
const logger = require("firebase-functions/logger");
const corsLib = require("cors"); 
const { getStorage,FieldValue } = require("firebase-admin/storage");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");




admin.initializeApp();
const cors = require("cors")({
  origin: [
    "https://toyama-sticker-project.web.app",
    "http://localhost:5000",
  ],
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
const db = admin.firestore();
const tasks = new CloudTasksClient();

const storage = new Storage();

// --- Secrets（RUN_URL と INVOKER_SA は実行時に参照）---
const RUN_URL    = defineSecret("RUN_URL");      // 例: https://.../transcode
const INVOKER_SA = defineSecret("INVOKER_SA");   // 例: functions-invoker@...iam.gserviceaccount.com

// バケット名はデプロイ時に評価が必要なので固定文字列にする
const RAW_BUCKET = "toyama-sticker-project-asia";

const REGION = "asia-northeast1";
const QUEUE  = "tsp-transcode-queue";

// 簡易MIMEホワイトリスト（必要に応じて拡張）
const ALLOWED = new Set([
  "video/mp4",
  "video/quicktime",     // .mov
  "video/x-matroska",    // .mkv
  "video/avi",
  "video/webm",
    // image
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
]);

exports.onRawUploaded = onObjectFinalized(
  {
    region: REGION,
    bucket: RAW_BUCKET,
    eventFilters: { matchesPath: "raw/{uid}/{filename}" },
    secrets: [RUN_URL, INVOKER_SA],
    retry: false
  },
  async (event) => {
    const { name: rawPath, contentType } = event.data;
    if (!rawPath?.startsWith("raw/")) return;

    const parts = rawPath.split("/");
    const uid = parts[1];
    const filename = parts[2] || "";
    const assetId = filename.replace(/\.[^.]+$/, "");

    // 画像か動画かで分岐
    if (contentType?.startsWith("image/")) {
      // Firestoreに直接 ready を記録
      await db.doc(`assets/${assetId}`).set({
        ownerUid: uid,
        status: "ready",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        media: {
          srcPath: rawPath,
          outPath: rawPath,   // 画像は raw をそのまま使う
          thumbPath: null     // 必要ならここで Cloud Functions で縮小サムネを作る
        },
        contentType
      }, { merge: true });

      return;
    }

    if (contentType?.startsWith("video/")) {
      // 動画はこれまで通り Cloud Run に送って圧縮
      await db.doc(`assets/${assetId}`).set({
        ownerUid: uid,
        status: "processing",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        media: { srcPath: rawPath },
        contentType
      }, { merge: true });

      const parent = tasks.queuePath(process.env.GCLOUD_PROJECT, REGION, QUEUE);
      const payload = {
        bucket: RAW_BUCKET,
        rawPath,
        outPath: `public/${uid}/${assetId}.mp4`,
        thumbPath: `thumbs/${uid}/${assetId}.jpg`,
        assetId
      };

      await tasks.createTask({
        parent,
        task: {
          httpRequest: {
            httpMethod: "POST",
            url: RUN_URL.value(),
            headers: { "Content-Type": "application/json" },
            body: Buffer.from(JSON.stringify(payload)).toString("base64"),
            oidcToken: { serviceAccountEmail: INVOKER_SA.value() }
          }
        }
      });
    }
  }
);

// /raw/{uid}/{filename} に原本が置かれたら起動
// exports.onRawUploaded = onObjectFinalized(
//   {
//     region: REGION,
//     bucket: RAW_BUCKET, // ← Secretは不可。固定文字列で。
//     eventFilters: { matchesPath: "raw/{uid}/{filename}" },
//     secrets: [RUN_URL, INVOKER_SA],
//     retry: false
//   },
//   async (event) => {
//     // メタ更新による再発火を抑止
//     const mg = Number(event.data.metageneration || 1);
//     if (mg > 1) return;

//     const { name: rawPath, contentType } = event.data;
//     if (!rawPath?.startsWith("raw/")) return;

//     // raw/{uid}/{assetId}.orig → uid, assetId を抽出
//     const parts = rawPath.split("/");
//     const uid = parts[1];
//     const filename = parts[2] || "";
//     const assetId = filename.replace(/\.[^.]+$/, "");

//     // Firestore: 処理中を記録（UIで表示したい場合）
//     await db.doc(`assets/${assetId}`).set({
//       ownerUid: uid,
//       status: "processing",
//       createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//       media: { srcPath: rawPath },
//       contentType: contentType || null
//     }, { merge: true });

//     // Cloud Tasks 経由で Cloud Run /transcode を呼ぶ
//     const parent = tasks.queuePath(process.env.GCLOUD_PROJECT, REGION, QUEUE);
//     const payload = {
//       bucket: RAW_BUCKET,
//       rawPath,
//       outPath: `public/${uid}/${assetId}.mp4`,
//       thumbPath: `thumbs/${uid}/${assetId}.jpg`,
//       assetId
//     };

//     await tasks.createTask({
//       parent,
//       task: {
//         httpRequest: {
//           httpMethod: "POST",
//           url: RUN_URL.value(), // ← Secret は実行時に参照OK
//           headers: { "Content-Type": "application/json" },
//           body: Buffer.from(JSON.stringify(payload)).toString("base64"),
//           // Cloud Tasks が INVOKER_SA になりすまして OIDC トークンを付与
//           oidcToken: { serviceAccountEmail: INVOKER_SA.value() }
//         }
//       }
//     });
//   }
// );

// 署名付きURLを発行して返す（要ログイン）
// exports.issueUploadUrl = onRequest(
//   { region: "asia-northeast1", cors: true }, // CORS許可（必要ならoriginsを絞る）
//   async (req, res) => {
    
//     try {
//       if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

//       // Firebase Auth のIDトークン（Bearer）を検証
//       const authz = req.headers.authorization || "";
//       const idToken = authz.startsWith("Bearer ") ? authz.slice(7) : null;
//       if (!idToken) return res.status(401).json({ error: "UNAUTHENTICATED" });
//       const decoded = await getAuth().verifyIdToken(idToken);
//       const uid = decoded.uid;

//       // クライアントから送られるメタ（contentTypeと任意のファイル名）
//       const { contentType, filename } = req.body || {};
//       if (!contentType || !ALLOWED.has(contentType)) {
//         return res.status(400).json({ error: "UNSUPPORTED_CONTENT_TYPE" });
//       }

//       // assetId はサーバ生成（衝突防止のためランダム短縮ID）
//       const assetId = crypto.randomUUID().split("-")[0]; // 8〜12文字程度
//       const rawPath = `raw/${uid}/${assetId}.orig`;      // 拡張子は固定でもOK

//       // Firestoreに「作成直後」の状態を入れておく（UI表示用）
//       await db.doc(`assets/${assetId}`).set({
//         ownerUid: uid,
//         status: "uploading",      // → finalize後に processing → ready へ
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//         updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//         media: { srcPath: rawPath, clientName: filename || null }
//       }, { merge: true });

//       // V4署名URL（PUT）
//       const expires = Date.now() + 10 * 60 * 1000; // 10分有効
//       const [uploadUrl] = await storage.bucket(RAW_BUCKET).file(rawPath).getSignedUrl({
//         version: "v4",
//         action: "write",
//         expires,
//         contentType,              // クライアントは同じContent-TypeでPUTする必要あり
//       });

//       // クライアントが知りたい情報を返却
//       res.json({
//         ok: true,
//         assetId,
//         uploadUrl,
//         expiresAt: new Date(expires).toISOString(),
//         bucket: RAW_BUCKET,
//         rawPath,                 // 参考：どこに入るか
//         outPath: `public/${uid}/${assetId}.mp4`,
//         thumbPath: `thumbs/${uid}/${assetId}.jpg`
//       });
//     } catch (e) {
//         logger.error("issueUploadUrl failed", { message: e?.message, stack: e?.stack });
//         res.status(500).json({
//             message: "Failed to issue signed URL",
//             error: String(e?.message || e),
//             stack: e?.stack || null,
//         });


//     }
//   }
// );
// 

// 

exports.issueUploadUrl = onRequest(
  { region: "asia-northeast1", cors: false },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");
        if (req.method !== "POST") {
          res.set("Allow", "POST, OPTIONS");
          return res.status(405).json({ message: "Method Not Allowed" });
        }

        // 1) 認証
        const authHeader = req.get("Authorization") || "";
        const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!idToken) return res.status(401).json({ message: "Missing ID token" });
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        const uid = decoded.uid;

        // 2) 入力（objectPathは受け取らない／信用しない）
        const { contentType, assetId } = req.body || {};
        if (!contentType || !assetId) {
          return res.status(400).json({ message: "contentType and assetId are required" });
        }

        // （任意）contentType を簡易バリデーションしても良い
        // if (!/^[-\w.+]+\/[-\w.+]+$/.test(contentType)) return res.status(400).json({ message: "invalid contentType" });

        // 3) サーバ側で最終パスを強制
        const objectPath = `raw/${uid}/${assetId}.orig`; // ★ここが安全の肝

        // 4) 署名URL発行（onRawUploaded と同じRAWバケットを明示）
        const bucket = getStorage().bucket(RAW_BUCKET);
        const file = bucket.file(objectPath);
        const expires = Date.now() + 10 * 60 * 1000; // 10分
        const [url] = await file.getSignedUrl({
          version: "v4",
          action: "write",
          expires,
          contentType,
        });

        logger.info("Issued signed URL", { uid, objectPath, assetId, expires });

        return res.status(200).json({
          url,
          method: "PUT",
          headers: { "Content-Type": contentType },
          expiresAt: expires,
          objectPath,   // ← エコー（クライアントで参照可能）
          assetId,      // ← エコー
        });
      } catch (e) {
        logger.error("issueUploadUrl failed", { message: e?.message, stack: e?.stack });
        return res.status(500).json({
          message: "Failed to issue signed URL",
          error: String(e?.message || e),
          stack: e?.stack || null,
        });
      }
    });
  }
);

// GCS 直リンク（公開読み取り前提）
function gcsPublicUrl(path) {
  return `https://storage.googleapis.com/${RAW_BUCKET}/${path}`;
}


// function mediaFromAsset(assetSnap) {
//   const a = assetSnap.data();
//   if (!a) return null;

//   // 入力はあなたのスクショ準拠
//   const outPath   = a.media?.outPath   || null;
//   const thumbPath = a.media?.thumbPath || null;

//   // contentType が "video/quicktime"（元の .MOV）でも、出力は .mp4
//   const type =
//     (a.contentType || "").startsWith("image/") ? "image" :
//     (outPath?.endsWith(".mp4") ? "video" :
//      (a.contentType || "").startsWith("video/") ? "video" : "unknown");

//   const url      = outPath   ? gcsPublicUrl(outPath)   : null;
//   const thumbUrl = thumbPath ? gcsPublicUrl(thumbPath) : null;

//   return {
//     assetId: assetSnap.id,
//     type,
//     url,                       // ← ここが outPath 由来
//     thumbUrl,                  // ← ここが thumbPath 由来
//     width:       a.width ?? null,
//     height:      a.height ?? null,
//     durationSec: a.durationSec ?? null,
//     status:      a.status || "processing",
//   };
// }

function mediaFromAsset(assetSnap) {
  const a = assetSnap.data();
  if (!a) return null;

  const outPath   = a.media?.outPath || null;
  const thumbPath = a.media?.thumbPath || null;

  let type = "unknown";
  if ((a.contentType || "").startsWith("image/")) type = "image";
  else if ((a.contentType || "").startsWith("video/")) type = "video";

  const url      = outPath   ? gcsPublicUrl(outPath)   : null;
  const thumbUrl = thumbPath ? gcsPublicUrl(thumbPath) : null;

  return {
    assetId: assetSnap.id,
    type,
    url,
    thumbUrl,
    width: a.width ?? null,
    height: a.height ?? null,
    durationSec: a.durationSec ?? null,
    status: a.status || "processing",
  };
}


// ====== Firestore トリガ（assets/{assetId} の書き込み時に発火） ======
exports.onAssetWritten = onDocumentWritten(
  { document: "assets/{assetId}", region: "asia-northeast1", retry: false },
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return; // 削除はスキップ

    const assetId = event.params.assetId;
    const mediaItem = mediaFromAsset(after);
    if (!mediaItem) return;

    // この asset を参照している memories を探す
    let updated = 0;
    let last = null;
    const pageSize = 300;

    while (true) {
      let q = db.collection("memories")
        .where("assetIds", "array-contains", assetId)
        .limit(pageSize);
      if (last) q = q.startAfter(last);

      const snap = await q.get();
      if (snap.empty) break;

      const batch = db.batch();
      for (const docSnap of snap.docs) {
        const d = docSnap.data() || {};
        // ここでオーナー整合性を追加チェック（任意・安全強化）
        if (d.ownerUid && after.get("ownerUid") && d.ownerUid !== after.get("ownerUid")) {
          logger.warn("owner mismatch; skip", { memoryId: docSnap.id, assetId });
          continue;
        }

        const mediaArr = Array.isArray(d.media) ? d.media.slice() : [];
        const idx = mediaArr.findIndex(m => m && m.assetId === assetId);
        if (idx >= 0) mediaArr[idx] = { ...mediaArr[idx], ...mediaItem };
        else mediaArr.push(mediaItem);

        batch.update(docSnap.ref, {
          media: mediaArr,
          updatedAt: FieldValue.serverTimestamp(),
        });
        updated++;
      }
      await batch.commit();

      last = snap.docs[snap.docs.length - 1];
      if (snap.size < pageSize) break;
    }

    logger.info("onAssetWritten done", {
      assetId,
      status: after.get("status"),
      updatedCount: updated,
    });
  }
);
exports.getSignedDownloadUrl = onRequest(
  { region: "asia-northeast1", cors: false },   // ← v2の簡易CORSは使わず自前で
  (req, res) => {
    cors(req, res, async () => {
      try {
        // プリフライトはここで終了（必須）
        if (req.method === "OPTIONS") return res.status(204).send("");

        if (req.method !== "POST") {
          res.set("Allow", "POST, OPTIONS");
          return res.status(405).json({ message: "Method Not Allowed" });
        }

        // 認証
        const authHeader = req.get("Authorization") || "";
        const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!idToken) return res.status(401).json({ message: "Missing ID token" });

        const decoded = await getAdminAuth().verifyIdToken(idToken);
        const uid = decoded.uid;

        // 入力
        const { assetId } = req.body || {};
        if (!assetId) return res.status(400).json({ message: "assetId required" });

        // 資格確認（オーナー一致）
        const fs = getFirestore();
        const snap = await fs.doc(`assets/${assetId}`).get();
        if (!snap.exists) return res.status(404).json({ message: "asset not found" });

        const a = snap.data();
        if (a.ownerUid !== uid) return res.status(403).json({ message: "forbidden" });

        const outPath = a.media?.outPath;
        const thumbPath = a.media?.thumbPath;
        if (!outPath) return res.status(409).json({ message: "asset not ready" });

        const bucket = getStorage().bucket(RAW_BUCKET); // asia 側のバケットをデフォルトにしていること
        const expires = Date.now() + 10 * 60 * 1000; // 10分

        const [url] = await bucket.file(outPath).getSignedUrl({
          version: "v4",
          action: "read",
          expires,
        });

        let thumbUrl = null;
        if (thumbPath) {
          [thumbUrl] = await bucket.file(thumbPath).getSignedUrl({
            version: "v4",
            action: "read",
            expires,
          });
        }

        // CORS レスポンスヘッダは cors ミドルウェアが付与
        return res.status(200).json({ url, thumbUrl, expiresAt: expires });
      } catch (e) {
        logger.error("getSignedDownloadUrl failed", { message: e?.message, stack: e?.stack });
        return res.status(500).json({ message: "error", error: String(e?.message || e) });
      }
    });
  }
);