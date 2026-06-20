# BÀI THUYẾT TRÌNH — MUSIC STREAMING

**Đề tài:** Ứng dụng nghe nhạc trực tuyến (Music Streaming)
**Công nghệ mới trình bày:** WebSocket (Socket.io) — Phòng nghe nhạc chung Realtime
**Sinh viên:** _(điền tên)_

---

## SLIDE 1 — Mở đầu

**Nói:**
> "Em xin trình bày đồ án 'Ứng dụng nghe nhạc trực tuyến'. Sản phẩm gồm 2 phần: demo các tính năng chính, và đi sâu vào công nghệ mới em áp dụng là **WebSocket** để làm tính năng **nghe nhạc chung theo thời gian thực**."

---

## SLIDE 2 — Tổng quan dự án

**Kiến trúc:**
- **Frontend:** React (Vite)
- **Backend:** Node.js + Express (REST API)
- **Database:** MongoDB (Mongoose)
- **Lưu media:** Cloudinary (file nhạc, ảnh)
- **Realtime:** Socket.io (WebSocket)

**Tính năng chính:**
- Nghe nhạc, quản lý queue, shuffle/repeat
- Gợi ý nhạc cá nhân hóa
- Hệ thống khiếu nại bản quyền (DMCA-style)
- Trang quản trị (admin)
- **Phòng nghe nhạc chung realtime ← điểm nhấn**

**Nói:**
> "Hệ thống theo mô hình client–server: React giao tiếp với Express qua REST API, dữ liệu lưu MongoDB, file nhạc đẩy lên Cloudinary. Riêng tính năng nghe chung dùng WebSocket vì REST không đáp ứng được realtime."

---

## SLIDE 3 — DEMO SẢN PHẨM (kịch bản)

> Demo theo thứ tự, mỗi bước nói 1 câu ngắn.

1. **Trang chủ** — "Đây là trang chủ với nhạc trending, album nổi bật, và mục *Gợi ý cho bạn hôm nay* được cá nhân hóa."
2. **Phát nhạc** — Bấm 1 bài → "Trình phát dùng 1 audio chung toàn app, có queue, shuffle, repeat. Khi hết queue hệ thống tự gợi ý bài tiếp theo."
3. **Cá nhân hóa** — "Gợi ý dựa trên lịch sử nghe, bài yêu thích, nghệ sĩ theo dõi — có cả yếu tố thời gian (nghe gần đây được ưu tiên)."
4. **Khiếu nại bản quyền** — "Người dùng có thể tố cáo bản quyền 1 bài; admin duyệt thì bài tự động bị ẩn khỏi nền tảng."
5. **Admin** — Lướt nhanh trang quản lý bài hát/album/khiếu nại + báo cáo tiền bản quyền.
6. **→ Chuyển sang phần công nghệ mới (Music Room).**

---

## SLIDE 4 — Công nghệ mới: Vì sao cần WebSocket?

**Bài toán:** Nhiều người ở các nơi khác nhau muốn **cùng nghe một bài, cùng một thời điểm** — host bấm play thì mọi người play, bấm pause thì mọi người pause.

**REST API KHÔNG làm được:**
- REST là **request – response**: client hỏi, server mới trả. Server **không tự đẩy** được dữ liệu xuống client.
- Muốn realtime với REST phải **polling** (hỏi liên tục mỗi giây) → tốn tài nguyên, vẫn trễ.

**WebSocket giải quyết:**
- **Kết nối 2 chiều, mở liên tục** giữa client và server.
- Server có thể **chủ động `emit`** sự kiện xuống mọi client tức thì.

| | REST | WebSocket |
|---|---|---|
| Chiều giao tiếp | 1 chiều (client hỏi) | 2 chiều |
| Server chủ động đẩy | Không | Có |
| Phù hợp | CRUD thông thường | Realtime (chat, nghe chung) |

---

## SLIDE 5 — Kiến trúc Music Room

**Socket.io** (thư viện WebSocket) tổ chức theo **room (phòng)**.

**Trạng thái mỗi phòng lưu trong bộ nhớ server (Map):**
```
roomId → {
  hostId,          // ai là chủ phòng (được điều khiển)
  members,         // danh sách thành viên
  song,            // bài đang phát
  isPlaying,       // đang phát / tạm dừng
  position,        // đang ở giây thứ mấy
  updatedAt,       // mốc thời gian cập nhật vị trí
  queue            // hàng chờ chung (ai cũng thêm được)
}
```

**Vì sao không lưu MongoDB?** Dữ liệu tạm thời, đổi liên tục từng giây, mất khi đóng phòng cũng không sao → lưu RAM cho nhanh.

**Các sự kiện chính:**
- `room:create`, `room:join` — tạo/vào phòng
- `host:play`, `host:pause`, `host:seek`, `host:song` — host điều khiển
- `queue:add`, `queue:remove`, `host:next` — hàng chờ chung
- `chat:message` — chat trong phòng
- `disconnect` — tự xử lý khi rời/mất mạng

---

## SLIDE 6 — ĐIỂM SÁNG: Đồng bộ vị trí phát theo thời gian

**Vấn đề:** Người vào phòng giữa chừng phải nghe **đúng đoạn** mọi người đang nghe, không phát lại từ đầu.

**Giải pháp thông minh** — không gửi vị trí liên tục, mà lưu **vị trí + mốc thời gian**, rồi **suy ra**:

```js
vị_trí_thật = position + (hiện_tại - updatedAt) / 1000   // nếu đang phát
```

**Ví dụ:**
- 10:00:00 — host play đầu bài → `position=0`, `updatedAt=10:00:00`
- 10:00:30 — có người vào → server tính `0 + 30s = giây 30`
- → Người mới nhảy thẳng tới giây 30, **dù server không cập nhật suốt 30s đó**.

**Lợi ích:** Tiết kiệm (không spam tin nhắn mỗi giây), chính xác, đồng bộ mượt.

> Đây là kỹ thuật kinh điển để đồng bộ trạng thái theo thời gian.

---

## SLIDE 7 — Xử lý các tình huống

- **Phân quyền host:** Chỉ host được điều khiển play/pause/seek (kiểm tra `hostId === socket.id`). Hàng chờ thì **mọi người** thêm/xóa được.
- **Host rời phòng:** Tự **chuyển quyền** cho thành viên còn lại đầu tiên.
- **Phòng trống:** Tự **xóa** khỏi bộ nhớ.
- **Mất mạng:** Sự kiện `disconnect` xử lý y như rời phòng chủ động.
- **`io.to()` vs `socket.to()`:** gửi cho cả phòng / gửi cho mọi người trừ người gửi.

---

## SLIDE 8 — DEMO MUSIC ROOM (kịch bản)

> Nên mở **2 trình duyệt** (hoặc 2 tab ẩn danh) để giả lập 2 người.

1. Tab A: **Tạo phòng** → hiện mã phòng 6 ký tự.
2. Tab B: **Vào phòng** bằng mã → thấy nhau trong danh sách thành viên.
3. Tab A (host): **chọn bài, play** → Tab B **tự phát đồng bộ**.
4. Tab A: **pause / tua** → Tab B đồng bộ ngay.
5. Tab B: **thêm bài vào hàng chờ** → cả 2 thấy; host bấm **next**.
6. **Chat** qua lại giữa 2 tab.
7. Tab A (host) **thoát** → quyền host chuyển sang Tab B.

---

## SLIDE 9 — Điểm mạnh & Hạn chế

**Điểm mạnh:**
- Realtime mượt, đồng bộ vị trí chính xác.
- Kiến trúc rõ ràng, tách biệt phần realtime với REST.
- **Xác thực socket bằng JWT** — chỉ user đăng nhập mới vào phòng.
- **Reload không mất phòng**: định danh thành viên theo `userId` + **grace period 20s** (server giữ chỗ khi mất kết nối) + client tự vào lại.

**Hạn chế (chủ động nêu):**
- Trạng thái ở RAM → **server restart là mất phòng**; **chưa scale nhiều server** (cần Redis adapter).
- Đồng bộ chưa bù **độ trễ mạng** (lệch vài chục ms, nghe nhạc không nhận ra).

**Hướng phát triển:**
- Redis adapter để vừa scale nhiều server vừa giữ phòng qua restart; phòng riêng tư có mật khẩu.

---

## SLIDE 10 — Kết luận

- Đồ án xây dựng được ứng dụng nghe nhạc hoàn chỉnh: nghe nhạc, cá nhân hóa, bản quyền, quản trị.
- **Công nghệ mới — WebSocket (Socket.io)** giúp hiện thực hóa tính năng nghe nhạc chung realtime mà REST không làm được.
- Em đã hiểu và làm chủ được luồng giao tiếp 2 chiều, đồng bộ trạng thái theo thời gian.

> "Em xin cảm ơn thầy/cô đã lắng nghe. Em sẵn sàng trả lời câu hỏi."

---

## PHỤ LỤC — Câu hỏi có thể gặp (chuẩn bị nhanh)

- *WebSocket khác REST chỗ nào?* → 2 chiều, server chủ động đẩy.
- *Sao đồng bộ được giây phát?* → lưu position + updatedAt, suy ra vị trí thật.
- *Sao không lưu phòng vào DB?* → dữ liệu tạm, đổi liên tục, lưu RAM nhanh hơn.
- *Nhiều người điều khiển loạn không?* → chỉ host điều khiển phát.
- *Hạn chế lớn nhất?* → state ở RAM, chưa scale, chưa auth socket.
