const { useEffect, useRef, useState } = React;

// Simple Lucide icon wrapper
function Icon({ name, className = "" }) {
  return <i data-lucide={name} className={className} aria-hidden="true"></i>;
}

const moodOptions = [
  { key: "happy", label: "うれしい" },
  { key: "excited", label: "ワクワク" },
  { key: "calm", label: "しずか" },
  { key: "nostalgic", label: "ノスタルジック" },
];



function GlobalTagEditor({ tags = [], setTags, onPersist }) {
  const [newTag, setNewTag] = React.useState("");
  const [composing, setComposing] = React.useState(false);

  const tryPersist = async (next) => {
    if (!onPersist) return;
    try { await onPersist(next); }
    catch (e) {
      console.error("Failed to persist tags:", e);
      alert("タグの保存に失敗しました。");
    }
  };

  const add = async () => {
    const raw = newTag.trim();
    if (!raw) return;
    const tag = raw.startsWith("#") ? raw : `#${raw}`;
    const next = [...new Set([...tags, tag])];
    setTags(next);
    setNewTag("");
    await tryPersist(next);
  };

  const remove = async (t) => {
    const next = tags.filter(x => x !== t);
    setTags(next);
    await tryPersist(next);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !composing) {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <span className="text-xs text-black/50">まだタグがありません</span>
        ) : (
          tags.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-1 text-sm">
              <span className="truncate max-w-[10rem]">{tag}</span>
              <button
                type="button"
                onClick={() => remove(tag)}
                className="rounded p-1 text-xs opacity-70 transition hover:bg-black/10 hover:opacity-100"
                aria-label={`${tag} を削除`}
                title="削除"
              >
                <Icon name="x" className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={onKeyDown}
          enterKeyHint="done"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="タグを入力（例: 富山 → #富山）"
          className="flex-1 rounded-lg bg-white/60 px-3 py-3 outline-none ring-1 ring-black/10 focus:ring-2"
          // onBlur={() => add()}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium transition hover:bg-black/5 active:scale-[0.98]"
        >
          ＋ 追加
        </button>
      </div>
    </div>
  );
}

function GlobalPeopleEditor({ people = [], setPeople, onPersist }) {
  const [newPerson, setNewPerson] = React.useState("");
  const [composing, setComposing] = React.useState(false); // IME中フラグ

  const tryPersist = async (next) => {
    if (!onPersist) return;
    try { await onPersist(next); }
    catch (e) {
      console.error("Failed to persist people:", e);
      alert("メンバーの保存に失敗しました。");
    }
  };

  const add = async () => {
    const name = newPerson.trim();
    if (!name) return;
    const next = [...new Set([...people, name])];
    setPeople(next);
    setNewPerson("");
    await tryPersist(next);
  };

  const remove = async (name) => {
    const next = people.filter(p => p !== name);
    setPeople(next);
    await tryPersist(next);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !composing) {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {people.length === 0 ? (
          <span className="text-xs text-black/50">まだ追加されていません</span>
        ) : (
          people.map((name, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-1 text-sm">
              <span className="truncate max-w-[10rem]">{name}</span>
              <button
                type="button"
                onClick={() => remove(name)}
                className="rounded p-1 text-xs opacity-70 transition hover:bg-black/10 hover:opacity-100"
                aria-label={`${name} を削除`}
                title="削除"
              >
                <Icon name="x" className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={newPerson}
          onChange={(e) => setNewPerson(e.target.value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={onKeyDown}
          // ↓ モバイル配慮
          enterKeyHint="done"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="一緒にいた人（例: 友人A）"
          className="flex-1 rounded-lg bg-white/60 px-3 py-3 outline-none ring-1 ring-black/10 focus:ring-2"
          // 必要なら blur でも追加したい場合は ↓ を有効化
          // onBlur={() => add()}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium transition hover:bg-black/5 active:scale-[0.98]"
        >
          ＋ 追加
        </button>
      </div>
    </div>
  );
}



function EntryTagEditor({ entry, setEntries, onPersist }) {
  const [newTag, setNewTag] = React.useState("");

  // タグを追加
  const add = () => {
    const tag = newTag.trim();
    if (!tag) return;

    let nextEntries; // ← 後で親に渡すため保持
    setEntries(prev => {
      nextEntries = prev.map(x =>
        x.id === entry.id
          ? { ...x, tags: [...(x.tags || []), tag] }
          : x
      );
      return nextEntries;
    });

    setNewTag("");

    // 追加直後に即保存したい場合：最新の nextEntries を渡す
    if (typeof onPersist === "function") {
      onPersist(nextEntries);
    }
  };

  // タグを削除（index 指定）
  const removeAt = (idx) => {
    let nextEntries;
    setEntries(prev => {
      nextEntries = prev.map(x => {
        if (x.id !== entry.id) return x;
        const nextTags = (x.tags || []).filter((_, i) => i !== idx);
        return { ...x, tags: nextTags };
      });
      return nextEntries;
    });

    if (typeof onPersist === "function") {
      onPersist(nextEntries);
    }
  };

  // タグ文字列の直接編集（オプション）
  const editAt = (idx, text) => {
    let nextEntries;
    setEntries(prev => {
      nextEntries = prev.map(x => {
        if (x.id !== entry.id) return x;
        const tags = [...(x.tags || [])];
        tags[idx] = text;
        return { ...x, tags };
      });
      return nextEntries;
    });
    if (typeof onPersist === "function") {
      onPersist(nextEntries);
    }
  };

  const tags = entry.tags || [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 既存タグ */}
      {tags.map((t, i) => (
        <span key={`${entry.id}-tag-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5">
          <input
            className="bg-transparent outline-none text-xs w-24"
            value={t}
            onChange={(e) => editAt(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="text-xs text-black/50 hover:text-black"
            aria-label="タグを削除"
          >
            ×
          </button>
        </span>
      ))}

      {/* 追加入力 */}
      <input
        className="px-2 py-1 rounded-lg bg-white/60 outline-none text-xs"
        placeholder="#タグを追加"
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        // onKeyDown={(e) => {
        //   if (e.key === "Enter") {
        //     e.preventDefault();
        //     add();
        //   }
        // }}
      />
      <button
        type="button"
        onClick={add}
        className="px-2 py-0.5 rounded-full bg-black/5 text-xs hover:bg-black/10"
      >
        +追加
      </button>
    </div>
  );
}

function OnboardingModal({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const containerRef = useRef(null);

  const slides = [
    { title: "QRコードから写真を投稿", desc: "QRコード経由で思い出を記録できます。" },
    { title: "思い出を一覧で確認", desc: "保存した思い出をきれいに並べて表示できます。" },
    { title: "友達とシェア", desc: "リンクで友達と共有できます。" },
  ];

  // スワイプの最小距離
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 overflow-hidden">
        {/* スライドコンテナ */}
        <div
          ref={containerRef}
          className="relative h-80 cursor-pointer select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={nextSlide}
        >
          <div
            className="flex transition-transform duration-300 ease-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                className="w-full flex-shrink-0 flex flex-col items-center justify-center p-8 text-center"
              >
                {/* アイコンエリア */}
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  {index === 0 && (
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M20 12h.01m-5.01-5.01h.01m0 0V7m0 0h.01" />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  )}
                </div>
                
                <h2 className="text-xl font-bold mb-3 text-gray-800">{slide.title}</h2>
                <p className="text-gray-600 leading-relaxed">{slide.desc}</p>
              </div>
            ))}
          </div>

          {/* ナビゲーション矢印 */}
          {currentSlide > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {currentSlide < slides.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* インジケーターとボタン */}
        <div className="p-6">
          {/* ページインジケーター */}
          <div className="flex justify-center space-x-2 mb-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            {currentSlide < slides.length - 1 ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  スキップ
                </button>
                <button
                  onClick={nextSlide}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  次へ
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                はじめる
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaGrid({ media, onUpload, remaining, uploads }) {
  const disabled = remaining.total <= 0;
  return (

        <div className="lg:col-span-2 rounded-2xl p-4 bg-white/70 border border-white/70 shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold">
              <Icon name="image" className="w-5 h-5" />写真・動画
            </div>

            {/* 残り表示 */}
            <div className="text-xs text-black/60 mr-2">
              {Math.max(0, remaining.total)}（画像 {Math.max(0, remaining.img)} / 動画 {Math.max(0, remaining.vid)}）
            </div>

            <label className={`cursor-pointer px-3 py-1 rounded-lg border border-black/10 text-sm
                              ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-black/5"}`}>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={onUpload}
                disabled={disabled}
              />
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

                      {/* ここに進捗オーバーレイを追加 */}
                {m.type === "video" && uploads?.get?.(m.id)?.status && (
                  <div className="absolute inset-0 bg-black/30 flex flex-col justify-end">
                      {/* プログレスバー本体 */}
                      {uploads.get(m.id).status === "uploading" && (
                        <div className="w-full bg-black/40 h-2">
                          <div
                            className="bg-emerald-400 h-2 transition-all duration-200"
                            style={{ width: `${uploads.get(m.id).percent || 0}%` }}
                          />
                        </div>
                      )}

                      {/* テキスト（中央に表示） */}
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
                        {uploads.get(m.id).status === "uploading" &&
                          `${uploads.get(m.id).percent || 0}% アップロード中`}
                        {uploads.get(m.id).status === "processing" && "圧縮中..."}
                        {uploads.get(m.id).status === "failed" && "失敗"}
                      </div>
                    </div>
                )}
                  {m.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 text-xs bg-gradient-to-t from-black/60 to-transparent text-white">{m.caption}</div>
                  )}
                </div>
              ))}
            </div>
         </div>
  );
}

// function OnboardingModal({ onClose }) {
//   const slides = [
//     { title: "QRコードから写真を投稿", desc: "QRコード経由で思い出を記録できます。" },
//     { title: "思い出を一覧で確認", desc: "保存した思い出をきれいに並べて表示できます。" },
//     { title: "友達とシェア", desc: "リンクで友達と共有できます。" },
//   ];

//   return (
//     <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
//       <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
//         {slides.map((s, i) => (
//           <div key={i} className="mb-6 text-center">
//             <h2 className="text-xl font-bold mb-2">{s.title}</h2>
//             <p className="text-sm text-gray-600">{s.desc}</p>
//           </div>
//         ))}
//         <button
//           onClick={onClose}
//           className="w-full py-2 bg-blue-500 text-white rounded-lg"
//         >
//           はじめる
//         </button>
//       </div>
//     </div>
//   );
// }

// function OnboardingModal({ onClose }) {
//   return (
//     <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
//         <h2 className="text-xl font-bold mb-3">ようこそ TSP Memories へ</h2>
//         <ul className="text-sm text-black/70 space-y-2 mb-6 list-disc pl-5">
//           <li>写真や動画を追加して思い出を保存できます。</li>
//           <li>「保存」で Firestore に記録され、あとで一覧から見返せます。</li>
//           <li>タグや一緒にいた人を編集して整理しましょう。</li>
//         </ul>
//         <button
//           onClick={onClose}
//           className="w-full py-2 rounded-xl bg-black text-white hover:opacity-90 transition"
//         >
//           はじめる
//         </button>
//       </div>
//     </div>
//   );
// }

// /** --- 署名付きURLを発行する Functions を呼ぶ --- */
// async function requestUploadUrl(file) {
//   // ユーザーのIDトークンを取得（window.firebaseAPI に無い場合は SDK から取る）
//   let idToken = null;
//   if (window.firebaseAPI?.getIdToken) {
//     idToken = await window.firebaseAPI.getIdToken();
//   } else if (window.firebase?.auth?.().currentUser?.getIdToken) {
//     idToken = await window.firebase.auth().currentUser.getIdToken();
//   }
//   if (!idToken) throw new Error("ログインが必要です");
// console.log("ID Token:", idToken);
// const endpoint =
//   "https://asia-northeast1-toyama-sticker-project.cloudfunctions.net/issueUploadUrl";


//   const res = await fetch(endpoint, {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${idToken}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       contentType: file.type,
//       filename: file.name,
//     }),
//   });
//   if (!res.ok) throw new Error("署名URLの発行に失敗");
//   return res.json();
// }

function parseUidFromIdToken(idToken) {
  const [, payloadB64] = idToken.split(".");
  const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
  const payload = JSON.parse(payloadJson);
  return payload.user_id || payload.sub; // どちらかに uid が入る
}

/** --- 署名付きURLを発行する Functions を呼ぶ --- */
async function requestUploadUrl(file) {
  // ユーザーのIDトークンを取得
  let idToken = null;
  if (window.firebaseAPI?.getIdToken) {
    idToken = await window.firebaseAPI.getIdToken();
  } else if (window.firebase?.auth?.().currentUser?.getIdToken) {
    idToken = await window.firebase.auth().currentUser.getIdToken();
  }
  if (!idToken) throw new Error("ログインが必要です");
  console.log("ID Token:", idToken);

  // // SDK から uid を取得（こっちの方が簡単＆確実）
  // const user = window.firebase?.auth?.().currentUser;
  // const uid = user ? user.uid : "unknown";

  
  // // ユーザーごとにフォルダ分け
  // const = `uploads/${uid}/${Date.now()}-${encodeURIComponent(file.name)}`;
  // const contentType = file.type || "application/octet-stream";
// 2) uid & assetId &
  const uid = parseUidFromIdToken(idToken);   // ★トークンからuid抽出
  if (!uid) throw new Error("ログインが必要です（uid取得不可）");

  const assetId = crypto.randomUUID();
  // 拡張子はそのままでもOKですが、後段で .orig など固定したいならここで変更
  const safeName = encodeURIComponent(file.name);


  const contentType = file.type || "application/octet-stream";

  const endpoint =
    "https://asia-northeast1-toyama-sticker-project.cloudfunctions.net/issueUploadUrl";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({

      contentType,  // ← ファイルの Content-Type
      assetId,     // ← クライアント側で管理する一意ID
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("署名URLエラー:", res.status, text);
    throw new Error("署名URLの発行に失敗");
  }
  return JSON.parse(text);
}



/** --- 進捗付きで PUT する（署名URL） --- */
function putWithProgress(url, file, onProgress, contentType) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    // 署名時に指定した contentType と完全一致させるのが超重要
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () =>
      (xhr.status >= 200 && xhr.status < 300)
        ? resolve()
        : reject(new Error(`PUT ${xhr.status}`));

    xhr.onerror = () => reject(new Error("ネットワークエラー"));
    xhr.send(file);
  });
}

function guessTypeFromContentType(ct) {
  if (!ct) return "image";
  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("image/")) return "image";
  return "image";
}

// 署名URLを発行（idToken取得は既存の手順でOK）
async function requestUploadUrlByAsset(file, assetId) {
  // idToken の取得
  let idToken = null;
  if (window.firebaseAPI?.getIdToken) {
    idToken = await window.firebaseAPI.getIdToken();
  } else if (window.firebase?.auth?.().currentUser?.getIdToken) {
    idToken = await window.firebase.auth().currentUser.getIdToken();
  }
  if (!idToken) throw new Error("ログインが必要です（idToken）");

  const contentType = file.type || "application/octet-stream";
  const endpoint = "https://asia-northeast1-toyama-sticker-project.cloudfunctions.net/issueUploadUrl";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ assetId, contentType }), // ← objectPathはサーバで強制
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("issueUploadUrl error:", res.status, text);
    throw new Error("署名URLの発行に失敗");
  }
  return JSON.parse(text); // { url, headers, objectPath, assetId, ... }
}


function MemoryApp() {
  const [title, setTitle] = useState("Memory of Toyama");
  const [destination, setDestination] = useState("富山市 → 立山");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("あの日の空気、音、匂いまで閉じ込める。");
  const [media, setMedia] = useState([]);
  const MAX_MEDIA = 5, MAX_IMG = 4, MAX_VID = 1;
  const [entries, setEntries] = useState([
    { id: "e1", time: "09:10", text: "ます寿司で朝ピクニック", tags: ["#朝ごはん"], people: ["You"], mood: "excited" },
    { id: "e2", time: "12:40", text: "越中八尾でおわらを練習している人を見かけた", tags: ["#偶然"], people: ["友人A"], mood: "happy" },
  ]);
  const [tags, setTags] = useState([]);
  const [people, setPeople] = useState([]);
  const [mood, setMood] = useState("excited");
  const [weather, setWeather] = useState("晴れ / 28℃");
  // const [privacy, setPrivacy] = useState("private");
  const [pairLink, setPairLink] = useState(null);

  // 保存関連
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 追加：クイックノート
  const [note, setNote] = useState("");

  // 選択ファイルの管理
  const fileMapRef = useRef(new Map());

  // ドキュメントID（編集時に使用）
  const [docId, setDocId] = useState(null);

  // 進捗を item.id => { percent, status, assetId } で持つ
  const [uploads, setUploads] = useState(new Map());



  // // メディアの上限チェック
  // const images = media.filter(m => m.type === "image");
  // const videos = media.filter(m => m.type === "video");

  // const remainingTotal = Math.max(0, MAX_MEDIA - media.length);
  // const remainingImg   = Math.max(0, MAX_IMG - images.length);
  // const remainingVid   = Math.max(0, MAX_VID - videos.length);

  // const disabled = remainingTotal === 0; // もう追加不可

  // アイコン描画
  useEffect(() => {
    window.lucide?.createIcons?.();
  });

  // useEffect(() => {
  // if (!window.firebaseAPI) return;

  // const unsub = window.firebaseAPI.onAuth(async (u) => {
  //   setUser(u);
  //   if (u) {
  //     // Firestoreからプロフィール確認
  //     const db = window.firebaseAPI.db;
  //     const ref = await window.firebaseAPI.ensureUserProfile(u, db);
  //     const snap = await getDoc(ref);
  //     if (snap.exists() && !snap.data().onboardingDone) {
  //       setShowOnboarding(true);
  //     }
  //   }
  // });

  // return () => unsub && unsub();
  // }, []);
  // useEffect(() => {
  //   if (!window.firebaseAPI) return;

  //   const unsub = window.firebaseAPI.onAuth(async (u) => {
  //     setUser(u);
  //     if (u) {
  //       try {
  //         // Firestoreにプロフィールドキュメントを確保
  //         const ref = await window.firebaseAPI.ensureUserProfile(u);
  //         const snap = await window.firebaseAPI.getDoc(ref);

  //         // onboardingDone フラグが false ならモーダルを表示
  //         if (snap.exists() && !snap.data().onboardingDone) {
  //           await window.firebaseAPI.markOnboardingDone(true);
  //         }
  //       } catch (e) {
  //         console.error("[onboarding check failed]", e);
  //       }
  //     }
  //   });

  //   return () => unsub && unsub();
  // }, []);

  useEffect(() => {
  if (!window.firebaseAPI) return;

  const unsub = window.firebaseAPI.onAuth(async (u) => {
    setUser(u);
    if (u) {
      // Firestoreからプロフィール確認
      const ref = await window.firebaseAPI.ensureUserProfile(u);
      const snap = await window.firebaseAPI.getDoc(ref);
      if (snap.exists() && !snap.data().onboardingDone) {
        setShowOnboarding(true);
      }
    }
  });

    return () => unsub && unsub();
  }, []);




  // Auth購読
  useEffect(() => {
    let unsub = null;
    let cancelled = false;
    (async () => {
      try {
        if (window.firebaseReady && typeof window.firebaseReady.then === "function") {
          await window.firebaseReady;
        }
        for (let i = 0; i < 40 && (!window.firebaseAPI || !window.firebaseAPI.onAuth); i++) {
          await new Promise(r => setTimeout(r, 50));
        }
        if (cancelled) return;
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

  const addEntry = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setEntries((prev) => [{ id: `e${Date.now()}`, time, text: "新しいメモ", tags: [], people: [], mood }, ...prev]);
  };

  // const onAddMedia = (file) => {
  //   const id = `${file.type.startsWith("video") ? "v" : "p"}${Date.now()}`;
  //   const src = URL.createObjectURL(file);
  //   const type = file.type.startsWith("video") ? "video" : "image";
  //   fileMapRef.current.set(id, file);
  //   setMedia((prev) => [{ id, type, src, caption: file.name }, ...prev]);
  // };


  // const onAddMedia = (file) => {
  //   const type = file.type.startsWith("image/") ? "image" : "video";
  //   const id = crypto.randomUUID();
  //   const src = URL.createObjectURL(file);
  //   setMedia(prev => [...prev, { id, type, src }]);
  // };

  const onAddMedia = (file) => {
    const isVideo = file.type.startsWith("video/");
    const type = isVideo ? "video" : "image";
    const id = (crypto?.randomUUID?.() || `m_${Date.now()}_${Math.random()}`).toString();
    const src = URL.createObjectURL(file);
    // ← ここで元ファイルを保持（保存機能でも使える）
    fileMapRef.current.set(id, file);

    setMedia(prev => [...prev, { id, type, src, caption: file.name }]);
  };

  //   // input の onChange を親で受けて制限する
  // const onUpload = (e) => {
  //   const all = Array.from(e.target?.files || []);
  //   if (!all.length) return;

  //   const imgs = media.filter(m => m.type === "image").length;
  //   const vids = media.filter(m => m.type === "video").length;

  //   const remainingTotal = Math.max(0, MAX_MEDIA - media.length);
  //   const remainingImg   = Math.max(0, MAX_IMG - imgs);
  //   const remainingVid   = Math.max(0, MAX_VID - vids);

  //   const pickImg = all.filter(f => f.type.startsWith("image/")).slice(0, remainingImg);
  //   const pickVid = all.filter(f => f.type.startsWith("video/")).slice(0, remainingVid);

  //   const allowed = [...pickImg, ...pickVid].slice(0, remainingTotal);
  //   if (!allowed.length) {
  //     alert("保存上限に達しています。");
  //     e.target.value = "";
  //     return;
  //   }
  //   allowed.forEach(onAddMedia);
  //   e.target.value = "";
  // };

  // const onUpload = async (e) => {
  //   const all = Array.from(e.target?.files || []);
  //   if (!all.length) return;

  //   const imgs = media.filter(m => m.type === "image").length;
  //   const vids = media.filter(m => m.type === "video").length;

  //   const remainingTotal = Math.max(0, MAX_MEDIA - media.length);
  //   const remainingImg   = Math.max(0, MAX_IMG - imgs);
  //   const remainingVid   = Math.max(0, MAX_VID - vids);

  //   const pickImg = all.filter(f => f.type.startsWith("image/")).slice(0, remainingImg);
  //   const pickVid = all.filter(f => f.type.startsWith("video/")).slice(0, remainingVid);

  //   const allowed = [...pickImg, ...pickVid].slice(0, remainingTotal);
  //   if (!allowed.length) {
  //     alert("保存上限に達しています。");
  //     e.target.value = "";
  //     return;
  //   }

  //   // まず UI に並べる（プレビュー）
  //   allowed.forEach(onAddMedia);

  //   // ここから 動画だけ 自動圧縮フローを開始
  //   for (const file of allowed) {
  //     if (!file.type.startsWith("video/")) continue;

  //     // 対応する media.id を探す（同名で最後に追加したものを使う）
  //     const found = [...fileMapRef.current.entries()].find(([, v]) => v === file);
  //     if (!found) continue;
  //     const [mediaId] = found;
  //     console.log(`動画アップロード開始: ${file.name} (${mediaId})`);

  //     try {
  //       // 署名URLの発行（= /raw/{uid}/{assetId}.orig の行先が決まる）
  //       const { url,headers ,assetId } = await requestUploadUrl(file);
  //       console.log(`署名URLを取得: ${url} (assetId=${assetId})`);
        

  //       // 進捗を初期化
  //       setUploads(prev => {
  //         const next = new Map(prev);
  //         next.set(mediaId, { percent: 0, status: "uploading", assetId });
  //         return next;
  //       });

  // アップロードハンドラ
  const onUpload = async (e) => {
    const all = Array.from(e.target?.files || []);
    if (!all.length) return;

    const imgs = media.filter(m => m.type === "image").length;
    const vids = media.filter(m => m.type === "video").length;

    const remainingTotal = Math.max(0, MAX_MEDIA - media.length);
    const remainingImg   = Math.max(0, MAX_IMG - imgs);
    const remainingVid   = Math.max(0, MAX_VID - vids);

    const pickImg = all.filter(f => f.type.startsWith("image/")).slice(0, remainingImg);
    const pickVid = all.filter(f => f.type.startsWith("video/")).slice(0, remainingVid);

    const allowed = [...pickImg, ...pickVid].slice(0, remainingTotal);
    if (!allowed.length) {
      alert("保存上限に達しています。");
      e.target.value = "";
      return;
    }

    // UI にプレビューとして並べる
    allowed.forEach(onAddMedia);

    // アップロード処理
    for (const file of allowed) {
      // UI で追加された media.id を探す
      const found = [...fileMapRef.current.entries()].find(([, v]) => v === file);
      if (!found) continue;
      const [mediaId] = found;

      try {
        // 新しい assetId を発行
        const assetId = crypto.randomUUID();
        const type = file.type.startsWith("video/") ? "video" : "image";

        // 署名付きURLを発行（アップロード用）
        const { url, headers } = await requestUploadUrlByAsset(file, assetId);
        console.log(`署名URL発行成功: assetId=${assetId}`);

        // media[] に assetId と初期状態を反映
        setMedia(prev => {
          const next = [...prev];
          const idx = next.findIndex(m => m.id === mediaId);
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              assetId,
              type,
              status: "uploading",
              url: null,
              thumbUrl: null,
              contentType: file.type,
              caption: next[idx].caption || file.name,
            };
          }
          return next;
        });

        // 進捗管理を初期化
        setUploads(prev => {
          const next = new Map(prev);
          next.set(mediaId, { percent: 0, status: "uploading", assetId });
          return next;
        });

        // 実際のPUT
        await putWithProgress(
          url,
          file,
          (p) => {
            setUploads(prev => {
              const next = new Map(prev);
              const rec = next.get(mediaId) || { percent: 0, status: "uploading", assetId };
              rec.percent = p;
              next.set(mediaId, rec);
              return next;
            });
          },
          headers?.["Content-Type"] || file.type || "application/octet-stream"
        );

        // 完了 → status を processing に更新
        setUploads(prev => {
          const next = new Map(prev);
          const rec = next.get(mediaId);
          if (rec) rec.status = "processing";
          return next;
        });
        setMedia(prev => {
          const next = [...prev];
          const idx = next.findIndex(m => m.id === mediaId);
          if (idx >= 0) {
            next[idx] = { ...next[idx], status: "processing" };
          }
          return next;
        });

        console.log(`アップロード完了: assetId=${assetId} → 処理中`);

        // 任意: Firestore の assets/{assetId} を監視して ready になったらUI差し替え
        // watchAssetReady(assetId, ...)

      } catch (err) {
        console.error("アップロード失敗:", err);
        setUploads(prev => {
          const next = new Map(prev);
          const rec = next.get(mediaId);
          if (rec) rec.status = "failed";
          return next;
        });
        setMedia(prev => {
          const next = [...prev];
          const idx = next.findIndex(m => m.id === mediaId);
          if (idx >= 0) {
            next[idx] = { ...next[idx], status: "failed" };
          }
          return next;
        });
        alert("アップロードに失敗しました");
      }
    }

    // input をクリア
    e.target.value = "";
  };

          // // 直PUT → Storage finalize → onRawUploaded → Cloud Run（自動で進む）
          // await putWithProgress(uploadUrl, file, (p) => {
          //   setUploads(prev => {
          //     const next = new Map(prev);
          //     const rec = next.get(mediaId) || { percent: 0, status: "uploading", assetId };
          //     rec.percent = p;
          //     next.set(mediaId, rec);
          //     return next;
          //   });
          // });

    //       await putWithProgress(
    //         url,
    //         file,
    //         (p) => {
    //           setUploads(prev => {
    //             const next = new Map(prev);
    //             const rec = next.get(mediaId) || { percent: 0, status: "uploading", assetId };
    //             rec.percent = p;
    //             next.set(mediaId, rec);
    //             return next;
    //           });
    //         },
    //         headers && headers["Content-Type"] ? headers["Content-Type"] : (file.type || "application/octet-stream")
    //       );

    //       // PUT 完了（= Functions 側が processing に遷移させ、少し待つと ready）
    //       setUploads(prev => {
    //         const next = new Map(prev);
    //         const rec = next.get(mediaId);
    //         if (rec) rec.status = "processing";
    //         return next;
    //       });

    //       // ここではシンプルに通知のみ（本格実装は Firestore onSnapshot で assetId を購読して ready を検知）
    //       console.log(`アップロード完了。圧縮を開始します（assetId=${assetId}）`);
    //     } catch (err) {
    //       console.error(err);
    //       setUploads(prev => {
    //         const next = new Map(prev);
    //         const rec = next.get(mediaId);
    //         if (rec) rec.status = "failed";
    //         return next;
    //       });
    //       alert("動画のアップロード/圧縮開始に失敗しました");
    //     }
    //   }

    //   e.target.value = "";
    // };


    // const onUpload = (e) => {
    //   const files = e.target.files;
    //   if (!files) return;
    //   Array.from(files).forEach(onAddMedia);
    //   e.currentTarget.value = "";
    // };

    const generatePairLink = () => {
      const token = Math.random().toString(36).slice(2, 10);
      setPairLink(`https://tsp.app/m/${token}`);
    };
    const instagramUrl = "https://www.instagram.com/toyama.sticker?igsh=bW1xaTNkMmN5OWEx"; // ここにあなたのInstagramプロフィールのURLを入力してください
    
    const handleInstagramClick = () => {
      window.open(instagramUrl, '_blank');
    };

    const memoreisview = () => {
      if (!user) {
        alert("ログインが必要です。右上からログインしてください。");
        return;
      }else {
        location.replace("/memories3.html");
      }};
    const handleLoginLogout = async () => {
      if (!window.firebaseAPI || typeof window.firebaseAPI.signInWithGoogle !== "function") {
        alert("初期化中です。少し待ってからお試しください。");
        return;
      }
      try {
        if (user) {
          if (typeof window.firebaseAPI.signOut !== "function") {
            console.error("firebaseAPI.signOut が見つかりません");
            alert("ログアウト機能が初期化されていません。");
            return;
          }
          await window.firebaseAPI.signOut();
          location.replace("/login.html");
        } else {
          await window.firebaseAPI.signInWithGoogle();
        }
      } catch (e) {
        console.error(e);
        alert(user ? "ログアウトに失敗しました" : "Googleログインに失敗しました");
      }
    };

//   const saveMemory = async () => {
//   if (!user) {
//     alert("ログインが必要です。右上からログインしてください。");
//     return;
//   }
//   setSaving(true);

//   try {
//     const normalizedMedia = [];
//     const assetIds = [];

//     // 1) まず既存/外部メディアを反映（そのまま参照保存）
//     for (const m of media) {
//       // 既に assetId を持っている（以前にアップロード済み or 参照済み）
//       if (m.assetId) {
//         assetIds.push(m.assetId);
//         normalizedMedia.push({
//           assetId: m.assetId,
//           type: m.type || guessTypeFromContentType(m.contentType),
//           url: m.url || null,       // あれば使ってもOK、無ければ null
//           thumbUrl: m.thumbUrl || null,
//           caption: m.caption || "",
//           status: m.status || "processing",
//           width: m.width || null,
//           height: m.height || null,
//           durationSec: m.durationSec || null,
//         });
//         continue;
//       }

//       // 外部URL（直接貼った画像/動画など）
//       if (m.src?.startsWith?.("http")) {
//         normalizedMedia.push({
//           external: true,
//           type: m.type || "image",
//           url: m.src,
//           caption: m.caption || "",
//         });
//       }
//     }

//     // 2) 新規ファイル（fileMapRef.current）をアップロード
//     //    並列で走らせつつ、memories には “参照だけ” を追加
//     const uploads = [];
//     for (const m of media) {
//       if (!fileMapRef.current.has(m.id)) continue; // 新規だけ対象

//       const file = fileMapRef.current.get(m.id);
//       const assetId = crypto.randomUUID();
//       const type = m.type || guessTypeFromContentType(file.type);

//       // memories には先に参照だけ入れる（status=processing）
//       assetIds.push(assetId);
//       normalizedMedia.push({
//         assetId,
//         type,
//         url: null,          // 後で Functions が埋める
//         thumbUrl: null,
//         caption: m.caption || "",
//         status: "processing"
//       });

//     // 3) すべてのアップロード完了を待つ（※署名URLの有効期限に注意）
//     await Promise.all(uploads);

//     // 4) memories に“参照だけ”保存（URLや寸法は後で Functions が自動反映）
//     const payload = {
//       ownerUid: user.uid,
//       title: (title || "").trim(),
//       destination: (destination || "").trim(),
//       date: (date || "").trim(),
//       message,
//       tags: Array.from(new Set((tags || []).map(t => String(t).trim()).filter(Boolean))),
//       people,
//       mood: (mood || "").trim(),
//       weather: (weather || "").trim(),
//       entries: entries || [],
//       media: normalizedMedia,
//       assetIds,
//       note,
//     };

//     if (docId) {
//       await window.firebaseAPI.updateMemoryDoc(docId, payload);
//       alert("更新しました！");
//     } else {
//       const id = await window.firebaseAPI.saveMemoryDoc(payload);
//       setDocId(id);
//       alert("保存しました！ ID: " + id);
//     }

//     fileMapRef.current.clear?.();

//   } catch (e) {
//     console.error(e);
//     alert("保存に失敗しました。コンソールを確認してください。");
//   } finally {
//     setSaving(false);
//   }
// };

const saveMemory = async () => {
  if (!user) {
    alert("ログインが必要です。右上からログインしてください。");
    return;
  }
  setSaving(true);

  try {
    // media[] を Firestore に保存できる形へ正規化
    const normalizedMedia = [];
    const assetIds = [];

    for (const m of media) {
      if (m.assetId) {
        // すでにアップロード済み or 処理中
        assetIds.push(m.assetId);
        normalizedMedia.push({
          assetId: m.assetId,
          type: m.type || guessTypeFromContentType(m.contentType),
          url: m.url ?? null,
          thumbUrl: m.thumbUrl ?? null,
          caption: m.caption || "",
          status: m.status || "processing",
          width: m.width ?? null,
          height: m.height ?? null,
          durationSec: m.durationSec ?? null,
        });
        continue;
      }

      // 外部URL（貼り付け画像/動画など）
      if (m.src?.startsWith?.("http")) {
        normalizedMedia.push({
          external: true,
          type: m.type || "image",
          url: m.src,
          caption: m.caption || "",
        });
      }
    }

    // Firestore に保存する payload
    const payload = {
      ownerUid: user.uid,
      title: (title || "").trim(),
      destination: (destination || "").trim(),
      date: (date || "").trim(),
      message,
      tags: Array.from(
        new Set((tags || []).map(t => String(t).trim()).filter(Boolean))
      ),
      people,
      mood: (mood || "").trim(),
      weather: (weather || "").trim(),
      entries: entries || [],
      media: normalizedMedia,
      assetIds,
      note,
    };

    if (docId) {
      await window.firebaseAPI.updateMemoryDoc(docId, payload);
      alert("更新しました！");
    } else {
      const id = await window.firebaseAPI.saveMemoryDoc(payload);
      setDocId(id);
      alert("保存しました！ ID: " + id);
    }

    // 保存が終わったらアップロードキューをクリア
    fileMapRef.current.clear?.();

  } catch (e) {
    console.error(e);
    alert("保存に失敗しました。コンソールを確認してください。");
  } finally {
    setSaving(false);
  }
};


//   const saveMemory = async () => {
//   if (!user) {
//     alert("ログインが必要です。右上からログインしてください。");
//     return;
//   }
//   setSaving(true);
//   try {
//     const basePath = `memories/${user.uid}/${Date.now()}`;
//     const uploadedMedia = [];

//     // 画像/動画のみアップロード（新規追加分だけ：fileMapRef にあるもの）
//     for (const m of media) {
//       if (fileMapRef.current.has(m.id)) {
//         const f = fileMapRef.current.get(m.id);
//         const path = `${basePath}/${m.id}_${f.name}`;
//         const res = await window.firebaseAPI.uploadFile(path, f, f.type);
//         uploadedMedia.push({
//           id: m.id,
//           type: m.type,
//           url: res.url,
//           path: res.path,
//           contentType: res.contentType,
//           caption: m.caption || ""
//         });
//       } else if (m.src?.startsWith?.("http")) {
//         // 既存/外部メディアはそのまま
//         uploadedMedia.push({
//           id: m.id,
//           type: m.type,
//           url: m.src,
//           path: m.path ?? null,
//           contentType: m.contentType ?? null,
//           caption: m.caption || "",
//           external: true
//         });
//       }
//     }

//     const payload = {
//       ownerUid: user.uid,
//       title, destination, date, message,
//       tags, people, mood, weather, 
//       entries,
//       media: uploadedMedia,
//       note, // クイックノートを保存
//     };

//     if (docId) {
//       // 既存更新（差分だけでもOK。ここでは分かりやすく全体を更新）
//       await window.firebaseAPI.updateMemoryDoc(docId, payload);
//       alert("更新しました！");
//     } else {
//       // 新規作成
//       const id = await window.firebaseAPI.saveMemoryDoc(payload);
//       setDocId(id); // 次回以降は update に切替
//       alert("保存しました！ ID: " + id);
//     }

//     fileMapRef.current.clear(); // 一旦アップロードキューをクリア
//   } catch (e) {
//     console.error(e);
//     alert("保存に失敗しました。コンソールを確認してください。");
//   } finally {
//     setSaving(false);
//   }
// };

  // const handleUpload = (e) => {
  //   const all = Array.from(e.target.files ?? []);
  //   if (!all.length) return;

  //   const imgs = all.filter(f => f.type.startsWith("image/")).slice(0, remainingImg);
  //   const vids = all.filter(f => f.type.startsWith("video/")).slice(0, remainingVid);
  //   const allowed = [...imgs, ...vids].slice(0, remainingTotal);

  //   if (!allowed.length) {
  //     alert("保存上限に達しています。");
  //     e.target.value = "";
  //     return;
  //   }

  //   onUpload(allowed);      // ← File[] を渡す
  //   e.target.value = "";
  // };


  

  const acccentGradient =
    "bg-[radial-gradient(1200px_500px_at_20%_0%,#ffe7a4_0%,transparent_40%),radial-gradient(800px_400px_at_100%_10%,#c9eaff_0%,transparent_40%),radial-gradient(700px_400px_at_50%_100%,#ffd1dc_0%,transparent_40%)]";

  return (
    <div className={`min-h-screen ${acccentGradient} relative`}>
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(transparent,black)] opacity-50">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/50 bg-white/70 border-b border-white/60">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-3">
          {/* 左：タイトル */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon name="sparkles" className="w-5 h-5 shrink-0" />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base md:text-lg font-semibold bg-transparent outline-none w-full truncate"
              placeholder="思い出のタイトル"
              aria-label="タイトル"
            />
          </div>

          {/* 仕切り（md以上で表示） */}
          <div className="hidden md:block h-8 w-px bg-black/10" />

          {/* 右：アクション群 */}
          <div className="flex items-center gap-2">
            {/* ログイン済みならユーザー情報 */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 pr-2 mr-1 border-r border-black/10">
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-xs font-semibold">
                  {(user.displayName || user.email || "U").slice(0,1).toUpperCase()}
                </div>
                <div className="max-w-[160px] text-xs text-black/70 truncate">
                  {user.displayName || user.email || user.uid}
                </div>
              </div>
            )}

            {/* プライバシー切替（スイッチ風）
            <button
              onClick={() => setPrivacy(p => p === "private" ? "public" : "private")}
              disabled={saving}
              className={`group relative inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border transition ${
                privacy === "private"
                  ? "border-black/10 bg-black/5"
                  : "border-emerald-300/60 bg-emerald-50"
              } ${saving ? "opacity-60 cursor-not-allowed" : "hover:bg-black/5"}`}
              aria-pressed={privacy !== "private"}
              aria-label="プライバシー設定"
              title={privacy === "private" ? "現在: 非公開" : "現在: 公開"}
            >
              <span
                className={`w-8 h-5 rounded-full transition flex items-center ${
                  privacy === "private" ? "bg-black/20" : "bg-emerald-400/80"
                }`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    privacy === "private" ? "translate-x-0 ml-0.5" : "translate-x-3 ml-0.5"
                  }`}
                />
              </span>
              <span className="flex items-center gap-1 text-xs font-medium">
                {privacy === "private" ? (
                  <>
                    <Icon name="lock" className="w-4 h-4" />
                    非公開
                  </>
                ) : (
                  <>
                    <Icon name="unlock" className="w-4 h-4" />
                    公開
                  </>
                )}
              </span>
            </button> */}

            {/* 1. アイコンのみ - シンプル */}             
              <button
                onClick={handleInstagramClick}
                className="p-2 rounded-full border border-black/10 hover:bg-black/5 transition group"
                title="インスタグラムをフォロー"
              >
                <svg 
                  className="w-5 h-5 text-pink-600 group-hover:text-pink-700 transition" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </button>


            {/* マイメモリー */}
            <button
              onClick={memoreisview}
              className="px-3 py-1 rounded-full border border-black/10 hover:bg-black/5 transition text-sm"
            >
              {user ? "マイメモリー" : "ログインして保存"}
            </button>

            {/* ログイン / ログアウト */}
            <button
              onClick={handleLoginLogout}
              className="px-3 py-1 rounded-full border border-black/10 hover:bg-black/5 transition text-sm"
            >
              {user ? "ログアウト" : "Googleでログイン"}
            </button>

            {/* 保存（プライマリ） */}
            <button
              onClick={saveMemory}
              disabled={saving}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition shadow-sm
                ${saving
                  ? "bg-slate-300 text-white cursor-not-allowed"
                  : "bg-slate-800 text-white hover:bg-slate-900"
                }`}
            >
              <span className="inline-flex items-center gap-1">
                <Icon name="save" className="w-4 h-4" />
                {saving ? "保存中..." : "保存"}
              </span>
            </button>
          </div>
        </div>
      </div>


      {/* Cover + Quick actions */}
      <div className="mx-auto max-w-6xl px-4 mt-6">
        <div className="grid md:grid-cols-5 gap-4">
          {/* Cover */}
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

          {/* Quick actions */}
          <div className="md:col-span-2 grid grid-rows-2 gap-4">
            {/* メディア追加
            <div className="rounded-2xl p-4 bg-white/70 border border-white/70 shadow flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="image" className="w-5 h-5"/>
                <div className="font-semibold">写真 / 動画を追加</div>
              </div>
              <label className="cursor-pointer px-3 py-1 rounded-lg border border-black/10 hover:bg-black/5">
                <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={onUpload}/>
                <div className="flex items-center gap-2"><Icon name="upload" className="w-4 h-4"/>アップロード</div>
              </label>
            </div> */}

            {/* 置き換え：クイックノート */}
            <div className="rounded-2xl p-4 bg-white/70 border border-white/70 shadow">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <Icon name="sticky-note" className="w-5 h-5"/>クイックノート
              </div>
              <textarea
                rows={4}
                value={note}
                onChange={(e)=>setNote(e.target.value)}
                placeholder="思いついたことをすぐ書き留める…"
                className="w-full px-3 py-2 rounded-lg bg-white/60 outline-none"
              />
              <div className="text-xs text-black/50 mt-1">保存するとメモも一緒に記録されます。</div>
            </div>

            {/* タグ & 人 */}
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <Icon name="tag" className="h-5 w-5" />
                タグ & 一緒にいた人
              </div>

              {/* タグ */}
              <div className="space-y-2">
                <div className="text-xs text-black/60">タグ</div>
                <GlobalTagEditor
                  tags={tags}
                  setTags={setTags}
                  onPersist={
                    docId
                      ? (next) => window.firebaseAPI.updateMemoryDoc(docId, { tags: next })
                      : null
                  }
                />
              </div>

              {/* 区切り線 */}
              <div className="my-4 h-px w-full bg-black/10" />

              {/* 人 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="users" className="h-4 w-4" />
                  <span className="text-black/80">一緒にいた人</span>
                </div>
                <GlobalPeopleEditor
                  people={people}           // ← 正しい props 名
                  setPeople={setPeople}
                  onPersist={
                    docId
                      ? (next) => window.firebaseAPI.updateMemoryDoc(docId, { people: next })
                      : null
                  }
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Timeline + Media */}
      <div className="mx-auto max-w-6xl px-4 my-8 grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-1 rounded-2xl p-4 bg-white/70 border border-white/70 shadow">
          <div className="flex items-center gap-2 font-semibold mb-3"><Icon name="calendar" className="w-5 h-5"/>タイムライン</div>
          <div className="space-y-5">
            <button onClick={addEntry} className="w-full justify-center items-center gap-2 rounded-xl border border-dashed border-black/20 py-2 hover:bg-black/5 flex">
              <Icon name="plus" className="w-4 h-4"/> 新規メモ
            </button>
            <ul className="space-y-4">
              {entries.map(e => (
                <li key={e.id} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-emerald-400 shadow"/>
                  <div className="text-xs text-black/60">{e.time}</div>
                  <input
                    value={e.text}
                    onChange={(ev)=>{ const text = ev.target.value; setEntries(prev=>prev.map(x=>x.id===e.id?{...x, text}:x)) }}
                    className="w-full bg-white/60 rounded-lg px-2 py-1 mt-1 outline-none"
                  />
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <EntryTagEditor
                      entry={e}
                      setEntries={setEntries}
                      onPersist={docId
                        ? (nextEntries) => window.firebaseAPI.updateMemoryDoc(docId, { entries: nextEntries }).catch(console.error)
                        : null
                      }
                    />
                    <button onClick={()=>setEntries(prev=>prev.map(x=>x.id===e.id?{...x, people:[...x.people, "友人"]}:x))} className="px-2 py-0.5 rounded-full bg-black/5">+人</button>
                    <select
                      value={e.mood}
                      onChange={(ev)=>{ const v = ev.target.value; setEntries(prev=>prev.map(x=>x.id===e.id?{...x, mood:v}:x)) }}
                      className="px-2 py-0.5 rounded-full bg-black/5"
                    >
                      {moodOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>



          <MediaGrid
            media={media}
            onUpload={onUpload}  // ← イベントを受ける形のまま
            remaining={{
              total: MAX_MEDIA - media.length,
              img: MAX_IMG - media.filter(m => m.type === "image").length,
              vid: MAX_VID - media.filter(m => m.type === "video").length,
            }}
            uploads={uploads}
          />
      </div>

      {/* Location + Prompts */}
      <div className="mx-auto max-w-6xl px-4 mb-10 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl p-4 bg-white/70 border border-white/70 shadow min-h-[220px]">
          <div className="flex items-center gap-2 font-semibold mb-2"><Icon name="map-pin" className="w-5 h-5"/>場所の記録</div>
          <div className="text-sm mb-3">現在地やスポット名をメモしておくと、後で地図に落とし込めます。</div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="スポット名" className="px-3 py-2 rounded-lg bg-white/60 outline-none"/>
            <input placeholder="メモ (例: カフェ、神社など)" className="px-3 py-2 rounded-lg bg-white/60 outline-none"/>
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

      {/* Footer */}
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
      {/* {showOnboarding && (
        <OnboardingModal onFinish={async () => {
          await window.firebaseAPI.markOnboardingDone(user,window.firebaseAPI.db);
          setShowOnboarding(false);
        }}/>
      )} */}
      {/* <OnboardingModal
        onClose={async () => {
          try {
            await window.firebaseAPI.markOnboardingDone(user);
          } catch (e) {
            console.error("setOnboardingDone failed", e);
          }
          await window.firebaseAPI.markOnboardingDone(false);
        }}
      /> */}
      {showOnboarding && (
        <OnboardingModal
          onClose={async () => {
            try {
              await window.firebaseAPI.markOnboardingDone(user);
            } catch (e) {
              console.error("setOnboardingDone failed", e);
            }
            setShowOnboarding(false);
          }
        }
        />)}
          
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<MemoryApp />);
