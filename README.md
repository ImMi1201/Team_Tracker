# My Tracker: theo dõi task cá nhân

Trang web riêng để theo dõi task, deadline và ghi chú công việc hằng ngày của bản thân.
Chỉ vào được khi có **mật khẩu**; dữ liệu nằm trên Supabase và không ai đọc được nếu không đăng nhập.

**Link:** https://immi1201.github.io/Team_Tracker/

---

## Đăng nhập

- Mở link, nhập mật khẩu, bấm **Unlock**.
- Lần đầu dùng mật khẩu tạm, trang sẽ bắt đổi sang mật khẩu riêng (ít nhất 8 ký tự).
- Đổi mật khẩu về sau: nút **Change password**. Đổi xong, các thiết bị khác đang đăng nhập sẽ bị đăng xuất.
- Nhập sai 5 lần sẽ bị khoá 10 phút.
- Phiên đăng nhập giữ 30 ngày trên mỗi thiết bị. Dùng máy lạ thì nhớ bấm **Log out**.

## Các tab

| Tab | Xem gì |
|---|---|
| **Today** | Task quá hạn, task đến hạn trong 7 ngày, task đang làm, Pending, task xong hôm nay |
| **All tasks** | Toàn bộ task theo topic, có tìm kiếm, lọc, sắp xếp, xuất CSV |
| **Calendar** | Task theo ngày deadline (nhấp đúp vào một ngày để thêm task có deadline đó) |
| **Log** | Nhật ký: ghi chú chung hoặc gắn với task, xem theo tháng |

Bấm vào tên task để xem chi tiết và ghi cập nhật; bấm ✎ để sửa hoặc xoá.

## Nhắc nhở qua lịch (Google / Apple Calendar)

Bấm **🔔 Calendar reminders** để lấy link lịch riêng tư, rồi đăng ký link đó trong app lịch:

- **Google Calendar** (trên máy tính): *Add calendar → From URL*, dán link. Sau đó vào *Settings → My Tracker* và đặt **All-day event notifications** (ví dụ 1 ngày trước lúc 9:00, và 8:00 sáng ngày deadline).
- **iPhone**: *Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar*, dán link. Nhắc nhở có sẵn: 9:00 hôm trước và 8:00 ngày deadline.

Trong lịch sẽ có:
- Mỗi task **chưa xong có deadline** là một sự kiện cả ngày vào ngày deadline.
- Task **quá hạn** hiện thêm vào **hôm nay** (⚠ Overdue) để nhắc làm tiếp.
- Task xong sẽ biến mất ở lần làm mới tiếp theo.

Lưu ý:
- Google tự làm mới lịch đăng ký theo lịch riêng của họ (vài giờ đến 1 ngày). Việc gấp thì mở task, bấm **📅 Add to Google Calendar** để thêm ngay.
- Ai có link đều xem được tên và deadline các task. Nếu lộ link, bấm **New link**: link cũ ngừng hoạt động, rồi đăng ký lại bằng link mới.

## Quên mật khẩu

Vào Supabase → **SQL Editor**, chạy (thay `mat-khau-tam` bằng mật khẩu tạm bạn muốn):

```sql
update public.me_auth
set password_hash = extensions.crypt('mat-khau-tam', extensions.gen_salt('bf', 10)),
    must_change = true, failed = 0, locked_until = null
where id = 1;
```

Rồi đăng nhập bằng mật khẩu tạm đó và đổi lại mật khẩu riêng.

## Kỹ thuật

- Mã nguồn web: `index.html`, `config.js`, `lib/data.js`. Dữ liệu: các bảng `me_*` trên Supabase.
  - Bảng bật RLS và không có policy; trang chỉ đọc/ghi qua các hàm `me_*` kèm mã phiên hợp lệ.
  - Mật khẩu lưu dạng bcrypt, không bao giờ nằm trong repo.
- Link lịch: Edge Function `calendar` (mã trong `supabase/functions/calendar/index.ts`), tạo file ICS từ hàm `me_calendar_feed`, chỉ trả dữ liệu khi đúng mã lịch.
- Dữ liệu của Team Tracker cũ (bảng `tasks`, `members`, …) vẫn còn nguyên trên Supabase, trang mới không dùng tới.
- **Không** đưa file `.sql`, file sao lưu hay mật khẩu lên repo, vì repo đang công khai. `config.js` chỉ chứa khoá **publishable**.
- Lịch *Keep Supabase awake* trong tab Actions chạy mỗi sáng để Supabase (gói Free) không bị tạm dừng.
