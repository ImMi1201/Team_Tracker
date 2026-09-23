/*
 * Kết nối với Supabase. Lấy 2 giá trị này trong Supabase:
 *   - Project URL:      nút "Connect" ở đầu trang project, hoặc Project Settings → Data API
 *   - Publishable key:  Project Settings → API Keys → khoá bắt đầu bằng "sb_publishable_..."
 * Khoá publishable được phép công khai: mọi quyền đều do cơ sở dữ liệu kiểm tra.
 * TUYỆT ĐỐI KHÔNG dán khoá "secret" (sb_secret_...) hay "service_role" vào đây.
 */
window.TEAM_TRACKER_CONFIG = {
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseKey: 'sb_publishable_XhntomCkbHZMYTbEKh3nDg_0jpeOnRv'
};
