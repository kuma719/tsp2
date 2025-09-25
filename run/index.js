import express from "express";
import { Storage } from "@google-cloud/storage";
import { spawn } from "node:child_process";
import admin from "firebase-admin";

const app = express();
app.use(express.json({ limit: "1mb" }));
admin.initializeApp();
const db = admin.firestore();
const storage = new Storage();

const run = (cmd) => new Promise((resolve, reject) => {
  const p = spawn("bash", ["-lc", cmd], { stdio: "inherit" });
  p.on("exit", code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
});

app.post("/transcode", async (req, res) => {
  const { bucket, rawPath, outPath, thumbPath, assetId } = req.body || {};
  if (!bucket || !rawPath || !outPath || !thumbPath || !assetId) {
    return res.status(400).json({ ok: false, error: "missing params" });
  }
  const docRef = db.doc(`assets/${assetId}`);
  try {
    const tmpIn = `/tmp/in.orig`;
    const tmpOut = `/tmp/out.mp4`;
    const tmpThumb = `/tmp/thumb.jpg`;

    await storage.bucket(bucket).file(rawPath).download({ destination: tmpIn });
    await run(
      `ffmpeg -y -i ${tmpIn} -vf "scale=-2:720,fps=30" ` +
      `-c:v libx264 -profile:v main -preset veryfast -b:v 2000k -maxrate 2500k -bufsize 4000k ` +
      `-c:a aac -b:a 128k -movflags +faststart -pix_fmt yuv420p ${tmpOut}`
    );
    await run(`ffmpeg -y -ss 00:00:01 -i ${tmpOut} -frames:v 1 -qscale:v 3 ${tmpThumb}`);

    await storage.bucket(bucket).upload(tmpOut, {
      destination: outPath,
      metadata: { contentType: "video/mp4", cacheControl: "public, max-age=3600", metadata: { transcoded: "true" } }
    });
    await storage.bucket(bucket).upload(tmpThumb, {
      destination: thumbPath,
      metadata: { contentType: "image/jpeg", cacheControl: "public, max-age=3600" }
    });

    const [meta] = await storage.bucket(bucket).file(outPath).getMetadata();
    await docRef.set({
      status: "ready",
      media: { outPath, thumbPath },
      bytes: { out: Number(meta.size || 0) },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ ok: true });
  } catch (e) {
    await docRef.set({
      status: "failed",
      error: { code: "TRANSCODE_ERROR", message: String(e) },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Cloud Run listening on ${port}`));
