// app-guard.js
// Require auth: if not signed in, redirect to /login.html
(function () {
  // すでにFirebase初期化済み（index.htmlの<head>で）である前提
  if (typeof firebase === "undefined") return;

  const LOGIN_URL = "/login.html";

  firebase.auth().onAuthStateChanged(function(user) {
    // login.html ではガードしない
    const onLoginPage = location.pathname.endsWith("/login.html");
    if (!user && !onLoginPage) {
      // 未ログインならログインページへ
      location.replace(LOGIN_URL + "?next=" + encodeURIComponent(location.pathname + location.search + location.hash));
    }
    // ログイン済みなら何もしない（アプリを続行）
  });
})();
