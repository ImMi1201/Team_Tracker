/*
 * data.js — kết nối trang web với Supabase (đăng nhập bằng tên + mật khẩu).
 * - Không dùng Supabase Auth/email: đăng nhập, phiên, quyền đều do các hàm tt_* trong cơ sở dữ liệu xử lý
 * - Mỗi thao tác gửi kèm mã phiên; máy chủ kiểm tra đăng nhập và quyền
 * - Tự cập nhật khi người khác sửa (Realtime, kèm kiểm tra định kỳ)
 * - File Excel theo năm và bản sao lưu lưu trong cơ sở dữ liệu (chỉ Manager)
 */
window.TT = (function () {
  'use strict';

  var cfg = window.TEAM_TRACKER_CONFIG || {};
  var KEY = cfg.supabaseKey || cfg.supabaseAnonKey; // khoá publishable (sb_publishable_...) hoặc khoá anon cũ
  var TOKEN_KEY = 'teamTracker:session';
  var sb = null;
  var memoryToken = null;

  function configured() {
    return !!(cfg.supabaseUrl && KEY && !/YOUR-PROJECT|YOUR-KEY|YOUR-ANON-KEY/.test(cfg.supabaseUrl + KEY));
  }
  function client() {
    if (!configured()) throw new Error('This site is not connected to Supabase yet. Open config.js and paste your Project URL and publishable key (see the guide).');
    if (/^sb_secret_/.test(KEY)) throw new Error('config.js contains a SECRET key. Replace it with the publishable key (sb_publishable_...) right away.');
    if (!sb) sb = window.supabase.createClient(cfg.supabaseUrl, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    return sb;
  }

  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || memoryToken; } catch (e) { return memoryToken; } }
  function setToken(t) { memoryToken = t; try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (e) { /* bỏ qua */ } }

  function friendly(error) {
    var msg = (error && (error.message || error.msg)) || String(error || 'Something went wrong.');
    var e = new Error(msg);
    e.code = error && error.code;
    if (/Failed to fetch|NetworkError|Load failed|fetch failed/i.test(msg)) { e.message = 'Cannot reach the server. Please check your internet connection and try again.'; e.offline = true; }
    else if (e.code === '28000' || /Please sign in/.test(msg)) { e.message = 'Your session has ended. Please sign in again.'; e.auth = true; }
    else if (e.code === 'PGRST202' || /Could not find the function/i.test(msg)) e.message = 'The database is not set up (or is an older version). Run team-tracker-setup.sql in Supabase again (see the guide).';
    return e;
  }

  async function call(p) {
    var r;
    try { r = await p; } catch (err) { throw friendly(err); }
    if (r && r.error) throw friendly(r.error);
    return r ? r.data : null;
  }

  // Thao tác có kiểm tra quyền: tự gửi kèm mã phiên
  function rpc(name, args) { return call(client().rpc(name, Object.assign({ p_token: getToken() }, args || {}))); }

  // ---------- Đăng nhập ----------
  async function signIn(username, password) {
    var r = await call(client().rpc('tt_login', { p_username: String(username || '').trim(), p_password: password }));
    if (!r || !r.ok) throw new Error((r && r.error) || 'Incorrect username or password.');
    setToken(r.token);
    return r.me;
  }
  async function signOut() {
    var t = getToken();
    setToken(null);
    if (t) { try { await call(client().rpc('tt_logout', { p_token: t })); } catch (e) { /* vẫn đăng xuất trên máy này */ } }
  }
  function hasSession() { return !!getToken(); }
  function changePassword(current, next) { return rpc('tt_change_password', { p_current: current, p_new: next }); }

  // ---------- Dữ liệu ----------
  async function loadState() {
    var s = await rpc('tt_state', {});
    s.version = Number(s.version);
    return s;
  }
  async function version() { return Number(await rpc('tt_version', {})); }

  // ---------- Tự cập nhật ----------
  var channel = null, poll = null;
  function live(onChange, onStatus) {
    stopLive();
    try {
      channel = client().channel('tt-meta')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tt_meta' }, function (p) { onChange(p && p.new && Number(p.new.version)); })
        .subscribe(function (status) { if (onStatus) onStatus(status); });
    } catch (e) { channel = null; }
    poll = setInterval(function () {
      if (document.hidden) return;
      version().then(function (v) { onChange(v); }, function (e) { if (onStatus) onStatus(e.auth ? 'AUTH' : 'OFFLINE'); });
    }, 45000);
  }
  function stopLive() {
    if (channel) { try { client().removeChannel(channel); } catch (e) { /* bỏ qua */ } channel = null; }
    if (poll) { clearInterval(poll); poll = null; }
  }

  // ---------- File (chỉ Manager) ----------
  async function blobToBase64(blob) {
    var bytes = new Uint8Array(await blob.arrayBuffer());
    var out = '';
    for (var i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(out);
  }
  async function listFiles(folder) { return (await rpc('tt_file_list', { p_prefix: folder })) || []; }
  async function upload(path, blob, type) { return rpc('tt_file_put', { p_name: path, p_type: type || blob.type, p_base64: await blobToBase64(blob) }); }
  async function download(path) {
    var f = await rpc('tt_file_get', { p_name: path });
    var bin = atob(f.base64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: f.type });
  }
  function removeFiles(paths) { return paths.length ? rpc('tt_file_delete', { p_names: paths }) : Promise.resolve(); }

  return {
    configured: configured, hasSession: hasSession, signIn: signIn, signOut: signOut, changePassword: changePassword,
    loadState: loadState, version: version, rpc: rpc, live: live, stopLive: stopLive,
    listFiles: listFiles, upload: upload, download: download, removeFiles: removeFiles
  };
})();
