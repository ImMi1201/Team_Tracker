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

## Hai khu vực: 💼 Work và 📚 IELTS

Nút gạt ở đầu trang chuyển giữa **Work** (công việc ở công ty) và **IELTS** (tự học). Task hai bên tách riêng hoàn toàn; trang nhớ bạn đang ở khu vực nào.

**📚 IELTS** có các tab:

| Tab | Dùng để |
|---|---|
| **Overview** | Ghi nhanh một buổi học; biểu đồ 14 ngày; phút học theo kỹ năng trong tuần; task học đang làm / sắp đến hạn; cài đặt band mục tiêu và giờ nhắc |
| **Study plan** | Task học (theo kỹ năng), có bước, deadline, giờ nhắc, **Import plan** từ chat giống phần Work |
| **Calendar** | Task học theo ngày |
| **Study log** | Nhật ký các buổi học theo tháng, tổng giờ theo kỹ năng |
| **Test scores** | Ghi điểm L/R/W/S mỗi lần làm đề; Overall tự tính theo cách làm tròn của IELTS; biểu đồ tiến bộ so với band mục tiêu |
| **Vocabulary** | Sổ từ vựng; **Review** ôn thẻ theo lịch ôn lặp (Again / Hard / Good / Easy, phím tắt Space rồi 1–4); **Import words** từ chat (`word \| meaning \| example \| topic`) |

Các ô trên cùng: chuỗi ngày học liên tiếp 🔥, số giờ học tuần này, số từ cần ôn, điểm Overall gần nhất, band mục tiêu.

**Nhắc học buổi tối**: nếu đến giờ đã đặt (mặc định 20:00) mà hôm đó chưa ghi buổi học nào, bạn nhận thông báo kèm chuỗi ngày học, số từ cần ôn và bước học tiếp theo. Bật/tắt và đổi giờ ở *Overview → Settings*. Bản tổng hợp 8:00 sáng chỉ tính task Work.

## Các bước trong task và nhập kế hoạch từ chat

- Mở một task để thấy danh sách **Steps**: tick khi xong, nhấp đúp để đổi tên, ✕ để xoá, gõ vào *Add a step…* để thêm. Tick bước đầu tiên sẽ tự chuyển task sang *In progress*. Thanh tiến độ và số ☑ 2/5 hiện ở danh sách task.
- **📋 Import plan**: lập kế hoạch bằng ChatGPT/Claude rồi dán vào đây.
  1. Bấm **Copy instructions for the chat**, dán vào cuộc chat cùng với kế hoạch của bạn.
  2. Chép câu trả lời của chat, dán vào ô *Plan*, xem trước, rồi bấm **Import**.
- Task **trùng tên** (không phân biệt hoa thường) sẽ được **cập nhật**: trạng thái, deadline, bước nào đã xong. Bước mới được thêm vào cuối. Muốn cập nhật tiến độ, nhờ chat viết lại kế hoạch với cùng tên task rồi import lại.
- Định dạng (chat sẽ tự viết theo hướng dẫn đã copy):

```
## Tên task
topic: Dự án
status: in progress        (not started | in progress | pending | done)
due: 2026-10-10            (hoặc 10/10/2026)
priority: high             (low | normal | high)
remind: 2026-10-01 20:00   (giờ gửi thông báo, tuỳ chọn)
notes: Một dòng ghi chú
- [x] Bước đã xong
- [ ] Bước tiếp theo
```

## Thông báo nhắc việc (web tự nhắc)

Bấm **🔔 Reminders → Turn on notifications** trên từng thiết bị muốn nhận thông báo (điện thoại, máy tính). Thông báo hiện cả khi đã đóng trang:

- **8:00 sáng mỗi ngày**: tổng hợp task quá hạn, đến hạn hôm nay, đang làm.
- **Nhắc làm tiếp**: task *In progress* không có cập nhật nào (kể cả tick bước) từ 3 ngày trở lên; thông báo ghi luôn bước tiếp theo cần làm.
- **Giờ nhắc riêng**: sửa task (✎) và điền **Remind me at**.

Bấm **Send a test** để thử. Bấm vào thông báo sẽ mở trang.

**iPhone/iPad** (iOS 16.4 trở lên): thông báo chỉ chạy khi mở từ Màn hình chính. Mở trang bằng Safari → **Chia sẻ → Thêm vào MH chính**, mở **My Tracker** từ biểu tượng mới, đăng nhập, rồi bật thông báo.
**Android / máy tính**: dùng Chrome, Edge hoặc Firefox, bật thông báo là xong.

Muốn tắt: **Turn off here** trên thiết bị đó.

## Nhắc nhở qua lịch (Google / Apple Calendar)

Bấm **🔔 Reminders** để lấy link lịch riêng tư, rồi đăng ký link đó trong app lịch:

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
- Thông báo: pg_cron chạy `me_push_tick()` mỗi phút; khi có việc cần nhắc, hàm này gọi Edge Function `push` (mã trong `supabase/functions/push/index.ts`) để gửi Web Push. Khoá VAPID bí mật chỉ nằm trong bảng `me_push_config`, không có trong repo. Service worker: `sw.js`.
- Link lịch: Edge Function `calendar` (mã trong `supabase/functions/calendar/index.ts`), tạo file ICS từ hàm `me_calendar_feed`, chỉ trả dữ liệu khi đúng mã lịch.
- IELTS: bảng `me_study` (buổi học), `me_tests` (điểm), `me_vocab` (từ vựng, ôn lặp kiểu Leitner: 1, 2, 4, 7, 15, 30, 60, 120 ngày); task có cột `space` (`work` / `ielts`).
- Dữ liệu của Team Tracker cũ (bảng `tasks`, `members`, …) vẫn còn nguyên trên Supabase, trang mới không dùng tới.
- **Không** đưa file `.sql`, file sao lưu hay mật khẩu lên repo, vì repo đang công khai. `config.js` chỉ chứa khoá **publishable**.
- Lịch *Keep Supabase awake* trong tab Actions chạy mỗi sáng để Supabase (gói Free) không bị tạm dừng.
