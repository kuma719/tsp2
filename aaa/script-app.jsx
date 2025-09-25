
const { useEffect, useRef, useState } = React;


// Simple Lucide icon wrapper
function Icon({ name, className = "" }) {
  return <i data-lucide={name} className={className} aria-hidden="true"></i>;
}

const demoMedia = [
  { id: "p1", type: "image", src: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1200&auto=format&fit=crop", caption: "立山の朝焼け" },
  { id: "p2", type: "image", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop", caption: "ガラス美術館の光" },
  { id: "v1", type: "video", src: "", caption: "路面電車に揺られて" }, // <- 例: publicに置く
];

const moodOptions = [
  { key: "happy", label: "うれしい" },
  { key: "excited", label: "ワクワク" },
  { key: "calm", label: "しずか" },
  { key: "nostalgic", label: "ノスタルジック" },
];

function MemoryApp() {
  const [title, setTitle] = useState("Memory of Toyama");
  const [destination, setDestination] = useState("富山市 → 立山");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("あの日の空気、音、匂いまで閉じ込める。");
  const [media, setMedia] = useState(demoMedia);
  const [entries, setEntries] = useState([
    { id: "e1", time: "09:10", text: "ます寿司で朝ピクニック", tags: ["#朝ごはん"], people: ["You"], mood: "excited" },
    { id: "e2", time: "12:40", text: "越中八尾でおわらを練習している人を見かけた", tags: ["#偶然"], people: ["友人A"], mood: "happy" },
  ]);
  const [tags, setTags] = useState(["#富山", "#立山", "#氷見うどん"]);
  const [people, setPeople] = useState(["You", "友人A"]);
  const [mood, setMood] = useState("excited");
  const [weather, setWeather] = useState("晴れ / 28℃");
  const [privacy, setPrivacy] = useState("private");
  const [pairLink, setPairLink] = useState(null);

  // Save status
  const [saving, setSaving] = useState(false);

  // Auth state
  const [user, setUser] = useState(null);

  // Audio recorder state
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioBlobRef = useRef(null);

  // Selected files map
  const fileMapRef = useRef(new Map());

  // Init lucide each render
  useEffect(() => {
    window.lucide?.createIcons?.();
  });

  // Subscribe auth
  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    (async () => {
      try {
        // 1) bridge の初期化を待つ
        if (window.firebaseReady && typeof window.firebaseReady.then === "function") {
          await window.firebaseReady;
        }
        // 2) 念のための待機ループ（最大 ~2 秒）
        for (let i = 0; i < 40 && (!window.firebaseAPI || !window.firebaseAPI.onAuth); i++) {
          await new Promise(r => setTimeout(r, 50));
        }

        if (cancelled) return;

        // 3) ガード（未定義なら早期return）
        if (!window.firebaseAPI || !window.firebaseAPI.onAuth) {
          console.error("firebaseAPI.onAuth is not available. Check script order or bridge errors.");
          return;
        }

        unsub = window.firebaseAPI.onAuth((u) => setUser(u));
      } catch (e) {
        console.error("Failed to init Firebase in app:", e);
      }
    })();

    return () => {
      cancelled = true;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      alert("マイクへのアクセスを許可してください。");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const addEntry = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setEntries((prev) => [{ id: `e${Date.now()}`, time, text: "新しいメモ", tags: [], people: [], mood }, ...prev]);
  };

  const onAddMedia = (file) => {
    const id = `${file.type.startsWith("video") ? "v" : "p"}${Date.now()}`;
    const src = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    fileMapRef.current.set(id, file);
    setMedia((prev) => [{ id, type, src, caption: file.name }, ...prev]);
  };

  const onUpload = (e) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(onAddMedia);
    e.currentTarget.value = "";
  };

  const generatePairLink = () => {
    const token = Math.random().toString(36).slice(2, 10);
    setPairLink(`https://tsp.app/m/${token}`);
  };

  const handleLoginLogout = async () => {
    // まだ bridge 初期化前なら弾く
    if (!window.firebaseAPI || typeof window.firebaseAPI.signInWithGoogle !== "function") {
      alert("初期化中です。少し待ってからお試しください。");
      return;
    }

    try {
      if (user) {
        // signOut は関数か確認
        if (typeof window.firebaseAPI.signOut !== "function") {
          console.error("firebaseAPI.signOut が見つかりません");
          alert("ログアウト機能が初期化されていません。");
          return;
        }
        await window.firebaseAPI.signOut();
        // onAuthStateChanged により user が null になります
      } else {
        await window.firebaseAPI.signInWithGoogle(); // ← リダイレクト方式ならここで遷移します
      }
    } catch (e) {
      console.error(e);
      alert(user ? "ログアウトに失敗しました" : "Googleログインに失敗しました");
    }
  };

  const saveMemory = async () => {
    if (!user) {
      alert("ログインが必要です。右上からログインしてください。");
      return;
    }
    setSaving(true);
    try {
      const basePath = `memories/${user.uid}/${Date.now()}`;
      const uploadedMedia = [];

      // Upload files
      for (const m of media) {
        if (fileMapRef.current.has(m.id)) {
          const f = fileMapRef.current.get(m.id);
          const path = `${basePath}/${m.id}_${f.name}`;
          const res = await window.firebaseAPI.uploadFile(path, f, f.type);
          uploadedMedia.push({ id: m.id, type: m.type, url: res.url, path: res.path, contentType: res.contentType, caption: m.caption || "" });
        } else if (m.src.startsWith("http")) {
          uploadedMedia.push({ id: m.id, type: m.type, url: m.src, path: null, contentType: null, caption: m.caption || "", external: true });
        }
      }

      // Upload audio
      if (audioBlobRef.current) {
        const audioPath = `${basePath}/audio_${Date.now()}.webm`;
        const res = await window.firebaseAPI.uploadFile(audioPath, audioBlobRef.current, "audio/webm");
        uploadedMedia.push({ id: `a${Date.now()}`, type: "audio", url: res.url, path: res.path, contentType: res.contentType, caption: "音声メモ" });
      }

      const doc = {
        ownerUid: user.uid,
        title, destination, date, message,
        tags, people, mood, weather, privacy,
        entries,
        media: uploadedMedia,
      };

      const id = await window.firebaseAPI.saveMemoryDoc(doc);
      alert("保存しました！ ID: " + id);
      fileMapRef.current.clear();
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。コンソールを確認してください。");
    } finally {
      setSaving(false);
    }
  };

  const acccentGradient =
    "bg-[radial-gradient(1200px_500px_at_20%_0%,#ffe7a4_0%,transparent_40%),radial-gradient(800px_400px_at_100%_10%,#c9eaff_0%,transparent_40%),radial-gradient(700px_400px_at_50%_100%,#ffd1dc_0%,transparent_40%)]";

  return (
    <div className={`min-h-screen ${acccentGradient} relative`}>
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(transparent,black)] opacity-50">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
      </div>

      <div className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/40 bg-white/70 border-b border-white/60">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <Icon name="sparkles" className="w-5 h-5" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg md:text-xl font-bold bg-transparent outline-none w-full" />
          <div className="flex items-center gap-2 text-sm">
            <button onClick={handleLoginLogout} className="px-3 py-1 rounded-full border border-black/10 hover:bg-black/5 transition">
              {user ? "ログアウト" : "Googleでログイン"}
            </button>
            <button onClick={() => setPrivacy(p => p === "private" ? "public" : "private")} className="px-3 py-1 rounded-full border border-black/10 hover:bg-black/5 transition" disabled={saving}>
              <div className="flex items-center gap-1">
                {privacy === "private" ? <Icon name="lock" className="w-4 h-4" /> : <Icon name="unlock" className="w-4 h-4" />}
                <span>{privacy === "private" ? "非公開" : "公開"}</span>
              </div>
            </button>
            <button onClick={saveMemory} className={`px-3 py-1 rounded-lg border border-black/10 hover:bg-black/5 transition ${saving ? "opacity-60 cursor-not-allowed" : ""}`} disabled={saving}>
              <div className="flex items-center gap-1">
                <Icon name="save" className="w-4 h-4" />
                <span>{saving ? "保存中..." : "保存"}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 mt-6">
        <div className="grid md:grid-cols-5 gap-4">
          <div className="md:col-span-3 overflow-hidden rounded-2xl shadow-lg bg-white/60 border border-white/70">
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop" alt="cover" className="h-56 w-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
              <div className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-3 text-white drop-shadow">
                <div className="flex items-center gap-2">
                  <Icon name="map-pin" className="w-4 h-4"/>
                  <input value={destination} onChange={(e)=>setDestination(e.target.value)} className="bg-transparent outline-none font-medium w-60"/>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="calendar" className="w-4 h-4"/>
                  <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="bg-white/10 rounded px-2 py-0.5 outline-none"/>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="clock" className="w-4 h-4"/>
                  <span>ムード: </span>
                  <select value={mood} onChange={(e)=>setMood(e.target.value)} className="bg-white/10 rounded px-2 py-0.5 outline-none">
                    {moodOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">天気:</span>
                  <input value={weather} onChange={(e)=>setWeather(e.target.value)} className="bg-white/10 rounded px-2 py-0.5 outline-none w-32"/>
                </div>
              </div>
            </div>
            <div className="p-4">
              <textarea value={message} onChange={(e)=>setMessage(e.target.value)} rows={2} className="w-full bg-white/60 rounded-xl px-3 py-2 outline-none" placeholder="メッセージや概要"/>
              {pairLink && (
                <div className="mt-3 text-sm flex items-center gap-2">
                  <Icon name="share-2" className="w-4 h-4"/> 共有リンク: <a href={pairLink} className="underline" target="_blank" rel="noreferrer">{pairLink}</a>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 grid grid-rows-3 gap-4">
            <div className="rounded-2xl p-4 bg-white/70 border border-white/70 shadow flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="image" className="w-5 h-5"/>
                <div className="font-semibold">写真 / 動画を追加</div>
              </div>
              <label className="cursor-pointer px-3 py-1 rounded-lg border border-black/10 hover:bg-black/5">
                <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={onUpload}/>
                <div className="flex items-center gap-2"><Icon name="upload" className="w-4 h-4"/>アップロード</div>
              </label>
            </div>

            <div className="rounded-2xl p-4 bg-white/70 border border-white/70 shadow flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="mic" className="w-5 h-5"/>
                <div className="font-semibold">音声メモ</div>
              </div>
              <div className="flex items-center gap-2">
                {!recording ? (
                  <button onClick={startRecording} className="px-3 py-1 rounded-lg border border-black/10 hover:bg-black/5 flex items-center gap-2"><Icon name="mic" className="w-4 h-4"/>録音</button>
                ) : (
                  <button onClick={stopRecording} className="px-3 py-1 rounded-lg border border-black/10 hover:bg-black/5 flex items-center gap-2"><Icon name="pause" className="w-4 h-4"/>停止</button>
                )}
                {audioURL && <audio controls src={audioURL} className="h-9"/>}
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white/70 border border-white/70 shadow">
              <div className="flex items-center gap-2 font-semibold mb-2"><Icon name="tag" className="w-5 h-5"/>タグ & 人</div>
              <div className="flex flex-wrap gap-2">
                {tags.map(t => <span key={t} className="px-2 py-1 rounded-full text-sm bg-black/5">{t}</span>)}
                <button onClick={()=>setTags(prev => [...prev, `#tag${prev.length+1}`])} className="px-2 py-1 rounded-full text-sm border border-black/10 hover:bg-black/5"><span className="inline-flex items-center gap-1"><Icon name="plus" className="w-3 h-3"/>追加</span></button>
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm"><Icon name="users" className="w-4 h-4"/>一緒にいた人: {people.join(", ")} <button onClick={()=>setPeople(p=>[...p, `友人${p.length}`])} className="ml-2 underline">追加</button></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 my-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl p-4 bg-white/70 border border-white/70 shadow">
          <div className="flex items-center gap-2 font-semibold mb-3"><Icon name="calendar" className="w-5 h-5"/>タイムライン</div>
          <div className="space-y-5">
            <button onClick={addEntry} className="w-full justify-center items-center gap-2 rounded-xl border border-dashed border-black/20 py-2 hover:bg-black/5 flex"><Icon name="plus" className="w-4 h-4"/> 新規メモ</button>
            <ul className="space-y-4">
              {entries.map(e => (
                <li key={e.id} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-emerald-400 shadow"/>
                  <div className="text-xs text-black/60">{e.time}</div>
                  <input value={e.text} onChange={(ev)=>{ const text = ev.target.value; setEntries(prev=>prev.map(x=>x.id===e.id?{...x, text}:x)) }} className="w-full bg-white/60 rounded-lg px-2 py-1 mt-1 outline-none"/>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <button onClick={()=>setEntries(prev=>prev.map(x=>x.id===e.id?{...x, tags:[...x.tags, "#タグ"]}:x))} className="px-2 py-0.5 rounded-full bg-black/5">+タグ</button>
                    <button onClick={()=>setEntries(prev=>prev.map(x=>x.id===e.id?{...x, people:[...x.people, "友人"]}:x))} className="px-2 py-0.5 rounded-full bg-black/5">+人</button>
                    <select value={e.mood} onChange={(ev)=>{ const v = ev.target.value; setEntries(prev=>prev.map(x=>x.id===e.id?{...x, mood:v}:x)) }} className="px-2 py-0.5 rounded-full bg-black/5">
                      {moodOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl p-4 bg-white/70 border border-white/70 shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold"><Icon name="image" className="w-5 h-5"/>写真・動画</div>
            <label className="cursor-pointer px-3 py-1 rounded-lg border border-black/10 hover:bg-black/5 text-sm">
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={onUpload}/>
              追加する
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {media.map(m => (
              <div key={m.id} className="relative group overflow-hidden rounded-xl">
                {m.type === "image" ? (
                  <img src={m.src} alt={m.caption || ""} className="h-40 w-full object-cover group-hover:scale-105 transition" />
                ) : (
                  <video src={m.src} controls className="h-40 w-full object-cover"/>
                )}
                {m.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-xs bg-gradient-to-t from-black/60 to-transparent text-white">{m.caption}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 mb-10 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-4 bg-white/70 border border-white/70 shadow min-h-[220px]">
          <div className="flex items-center gap-2 font-semibold mb-2"><Icon name="map-pin" className="w-5 h-5"/>場所の記録</div>
          <div className="text-sm mb-3">現在地やスポット名をメモしておくと、後で地図に落とし込めます。</div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="スポット名" className="px-3 py-2 rounded-lg bg-white/60 outline-none"/>
            <input placeholder="メモ (例: カフェ、神社など)" className="px-3 py-2 rounded-lg bg-white/60 outline-none"/>
            <input placeholder="緯度" className="px-3 py-2 rounded-lg bg-white/60 outline-none"/>
            <input placeholder="経度" className="px-3 py-2 rounded-lg bg-white/60 outline-none"/>
          </div>
          <div className="mt-3 rounded-xl border border-dashed border-black/20 h-28 flex items-center justify-center text-sm text-black/60">
            地図プレビュー（後でAPIと接続）
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-white/70 border border-white/70 shadow">
          <div className="flex items-center gap-2 font-semibold mb-2"><Icon name="sparkles" className="w-5 h-5"/>思い出プロンプト</div>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>この瞬間の「音」は？（波、祭囃子、風…）</li>
            <li>匂い・温度・触感は？</li>
            <li>一番驚いたこと・笑ったことは？</li>
            <li>未来の自分へ 140字メッセージ</li>
          </ul>
          <textarea rows={3} placeholder="自由入力" className="mt-3 w-full px-3 py-2 rounded-lg bg-white/60 outline-none"/>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-2xl p-4 bg-white/70 border border-white/70 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm">© TSP Memories — このページはQRからの専用ビューです。</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-lg border border-black/10 hover:bg-black/5 text-sm flex items-center gap-2">
              <Icon name="download" className="w-4 h-4" />PDF書き出し（後で実装）
            </button>
            <button className="px-3 py-1 rounded-lg border border-black/10 hover:bg-black/5 text-sm flex items-center gap-2">
              <Icon name="share-2" className="w-4 h-4" />共有
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<MemoryApp />);
