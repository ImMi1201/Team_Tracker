/*
 * data.js — kết nối trang web với Supabase (chỉ một mật khẩu).
 * - Không dùng Supabase Auth: đăng nhập, phiên đều do các hàm me_* trong cơ sở dữ liệu xử lý
 * - Bảng me_* bật RLS và không có policy, nên chỉ đọc/ghi được qua các hàm me_* kèm mã phiên hợp lệ
 */
window.TT = (function () {
  'use strict';

  var cfg = window.TEAM_TRACKER_CONFIG || {};
  var KEY = cfg.supabaseKey || cfg.supabaseAnonKey; // khoá publishable (sb_publishable_...)
  var TOKEN_KEY = 'personalTracker:session';
  var sb = null;
  var memoryToken = null;

  function client() {
    if (!cfg.supabaseUrl || !KEY) throw new Error('This site is not connected to Supabase yet. Check config.js.');
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
    else if (e.code === 'PGRST202' || /Could not find the function/i.test(msg)) e.message = 'The database is not set up yet (missing me_* functions).';
    return e;
  }

  async function call(p) {
    var r;
    try { r = await p; } catch (err) { throw friendly(err); }
    if (r && r.error) throw friendly(r.error);
    return r ? r.data : null;
  }

  function rpc(name, args) { return call(client().rpc(name, Object.assign({ p_token: getToken() }, args || {}))); }

  async function signIn(password) {
    var r = await call(client().rpc('me_login', { p_password: password }));
    if (!r || !r.ok) throw new Error((r && r.error) || 'Incorrect password.');
    setToken(r.token);
    return r;
  }
  async function signOut() {
    var t = getToken();
    setToken(null);
    if (t) { try { await call(client().rpc('me_logout', { p_token: t })); } catch (e) { /* vẫn đăng xuất trên máy này */ } }
  }

  return {
    hasSession: function () { return !!getToken(); },
    signIn: signIn,
    signOut: signOut,
    changePassword: function (current, next) { return rpc('me_change_password', { p_current: current, p_new: next }); },
    loadState: function () { return rpc('me_state', {}); },
    saveTask: function (task) { return rpc('me_task_save', { p_task: task }); },
    setStatus: function (id, status) { return rpc('me_task_status', { p_id: id, p_status: status }); },
    deleteTask: function (id) { return rpc('me_task_delete', { p_id: id }); },
    addUpdate: function (taskId, body) { return rpc('me_update_add', { p_task_id: taskId, p_body: body }); },
    deleteUpdate: function (id) { return rpc('me_update_delete', { p_id: id }); },
    // Link lịch riêng tư (ICS) để Google/Apple Calendar nhắc deadline
    calendarUrl: async function (reset) {
      var key = await rpc(reset ? 'me_calendar_reset' : 'me_calendar_info', {});
      return cfg.supabaseUrl.replace(/\/$/, '') + '/functions/v1/calendar?key=' + key;
    },
    // Thông báo đẩy: thiết bị đã đăng ký, đăng ký/huỷ, gửi thử
    pushStatus: function () { return rpc('me_push_status', {}); },
    pushSubscribe: function (sub, label) { return rpc('me_push_subscribe', { p_sub: sub, p_label: label }); },
    pushUnsubscribe: function (endpoint) { return rpc('me_push_unsubscribe', { p_endpoint: endpoint }); },
    pushTest: function () { return rpc('me_push_test', {}); },
    // Các bước trong task + nhập kế hoạch (từ chat)
    addStep: function (taskId, title) { return rpc('me_step_add', { p_task_id: taskId, p_title: title }); },
    setStep: function (id, done, title) { return rpc('me_step_set', { p_id: id, p_done: done, p_title: title || null }); },
    deleteStep: function (id) { return rpc('me_step_delete', { p_id: id }); },
    importTasks: function (tasks, space) { return rpc('me_import', { p_tasks: tasks, p_space: space || 'work' }); },
    // IELTS: cài đặt, nhật ký học, điểm test, từ vựng
    ieltsSettings: function (target, remind, time) { return rpc('me_ielts_settings', { p_target: target, p_remind: remind, p_remind_time: time }); },
    addStudy: function (day, skill, minutes, note) { return rpc('me_study_add', { p_day: day, p_skill: skill, p_minutes: minutes, p_note: note }); },
    deleteStudy: function (id) { return rpc('me_study_delete', { p_id: id }); },
    saveTest: function (test) { return rpc('me_test_save', { p_test: test }); },
    deleteTest: function (id) { return rpc('me_test_delete', { p_id: id }); },
    saveWord: function (word) { return rpc('me_vocab_save', { p_word: word }); },
    importWords: function (words) { return rpc('me_vocab_import', { p_words: words }); },
    deleteWord: function (id) { return rpc('me_vocab_delete', { p_id: id }); },
    reviewWord: function (id, grade) { return rpc('me_vocab_review', { p_id: id, p_grade: grade }); }
  };
})();
