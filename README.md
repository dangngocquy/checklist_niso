# NISO CHECKLIST

Ứng dụng Checklist nội bộ cho hệ thống NISO, gồm Frontend (React + Ant Design) và Backend (Express + MongoDB + Socket.IO) chạy HTTPS nội bộ, có phân quyền, chấm công, quản lý tài sản, thông báo, báo cáo, quiz... Hệ thống hỗ trợ i18n (vi, en, it, jp, kh) và proxy giữa FE/BE.

## Tính năng chính
- Quản lý Checklist: tạo/sửa/xem, lưu nháp, đồng bộ, cấu hình điểm, phân quyền theo người dùng/đơn vị
- Phản hồi & xử lý: bình luận, pin, xử lý nhiệm vụ, thống kê archive
- Phân quyền & Module: cấp quyền trên tài khoản, phòng ban, cửa hàng, module động
- Chấm công: tạo công, phê duyệt, lịch sử chấm công
- Tài sản: danh sách, kiểm kê, bảo hành, thanh lý, báo cáo
- Thông báo: tạo, xem, đánh dấu đã đọc
- Quiz/Minigame: tạo, tham gia, realtime Socket.IO
- Đăng nhập: username/password, QR code; có tích hợp Face ID (face-api.js) tuỳ chọn

## Giải pháp & Kết quả
- Chuẩn hoá quy trình checklist đa chi nhánh: biểu mẫu thống nhất, giảm sai lệch thực thi.
- Tăng tốc xử lý phản hồi: phân công nhiệm vụ, theo dõi trạng thái; rút ngắn thời gian phản hồi và hoàn tất.
- Minh bạch phân quyền: quyền theo tài khoản/phòng ban/cửa hàng/module; giảm rủi ro truy cập sai.
- Nâng hiệu quả chấm công và quản trị tài sản: ghi nhận/phê duyệt/kiểm kê/thanh lý; giảm sai sót nhập liệu.
- Báo cáo thời gian thực: số liệu tổng hợp theo người/đơn vị/kỳ; hỗ trợ quyết định nhanh và chính xác.
- Trải nghiệm an toàn: HTTPS nội bộ, BasicAuth, HSTS, COOP/COEP, XSS/Clickjacking headers, rate-limit.
- Khả năng mở rộng: API tách lớp, Socket.IO riêng, proxy cấu hình, i18n đa ngôn ngữ, lazy-load FE.

- Chỉ số gợi ý theo dõi hiệu quả (KPIs):
  - Tỷ lệ hoàn thành checklist theo kỳ (ngày/tuần/tháng)
  - Thời gian trung bình phản hồi/hoàn tất yêu cầu
  - SLA tuân thủ xử lý phản hồi theo mức ưu tiên
  - Tỷ lệ lệch kiểm kê tài sản, vòng đời và chi phí bảo hành
  - Tỷ lệ báo cáo nộp đúng hạn, độ chính xác dữ liệu
  - Số lần đăng nhập thất bại/vi phạm quyền (bảo mật)

## Kiến trúc & Công nghệ
- Frontend: React 18, React Router 6, Ant Design 5, Redux Toolkit, i18next, SASS
- Backend: Express 4, HTTPS, Socket.IO, MongoDB (native driver + mongoose), MSSQL (tuỳ module), Multer, JWT, Rate-limit, CORS
- Realtime: Socket.IO (cổng 4003)
- Ngôn ngữ: i18n (vi, en, it, jp, kh)

## Cấu trúc thư mục rút gọn
```
CHECKLISTNISO/
  app.js                 # FE HTTPS static server + reverse proxy tới BE
  Backend/
    server.js            # BE HTTPS + API + Socket.IO
    MongoDB/database.js  # Kết nối MongoDB (singleton)
    ...                  # Nhiều module: users, checklist, report, asset, quiz, ...
  src/                   # React app (routes, features, components)
  public/                # index.html, manifest, favicon, models cho face-api
  SSL/                   # certificate.pfx (cần tự cung cấp)
  package.json           # Scripts FE, dependencies chung
```

## Cấu trúc thư mục chi tiết
```
CHECKLISTNISO/
  app.js                           # Server HTTPS phục vụ build FE + reverse proxy tới BE :3003
  config-overrides.js              # Tùy biến CRA qua react-app-rewired
  package.json                     # Scripts và dependencies
  firebase.json                    # (nếu dùng deploy Firebase Hosting)
  database.json                    # (dữ liệu mẫu/backup nếu có)

  SSL/
    certificate.pfx                # Chứng chỉ PFX dùng cho HTTPS nội bộ (tự cung cấp)

  public/
    index.html                     # HTML template gốc
    manifest.json                  # PWA manifest
    favicon.ico / favicon.png      # Icon ứng dụng
    logo192.png / logo512.png      # Icon PWA
    locales/                       # File ngôn ngữ i18n
      vi/translation.json
      en/translation.json
      it/translation.json
      jp/translation.json
      kh/translation.json
    models/                        # Mô hình cho face-api.js
      face_landmark_68/*
      face_recognition/*
      mtcnn/*
      ssd_mobilenetv1/*

  src/
    index.js                       # Entry React, mount App, inject i18n
    App.js                         # Routes, bảo vệ route, lazy load, i18n, theme Antd
    App.scss / index.css           # Styles
    i18n.js                        # Cấu hình i18next
    setupProxy.js                  # Proxy dev tới BE :3003
    config.js                      # Cấu hình frontend (nếu có)

    assets/                        # Ảnh, icon, fonts, APK
      APP_APK/base.apk
      language/*.svg
      QuizBackground/*
      ...

    components/                    # Các module UI chính theo nghiệp vụ
      Login.jsx                    # Màn hình đăng nhập (hỗ trợ QR)
      NotFoundPage.jsx             # 404
      Container.jsx                # Layout chính sau đăng nhập
      home/                        # Dashboard & trang chủ
      phanquyen/                   # Phân quyền (Account/Department/Restaurant/Module)
      chamcong/                    # Chấm công (danh sách, tạo công, lịch sử)
      assetList/                   # Tài sản (danh sách, kiểm kê, bảo hành, thanh lý, báo cáo)
      lamphieu/                    # Tạo & xem phiếu checklist
      xemphieu/                    # Xử lý chi tiết phiếu
      danhsachsave/                # Danh sách đã lưu (draft)
      thongtincanhan/              # Hồ sơ, lịch sử đăng nhập
      loading/                     # Loading, báo cáo
      manageList/                  # Quản lý checklist/chi nhánh/phòng ban
      NisoQuiz/                    # Tạo/Tham gia quiz, minigame realtime
      Study/                       # Học tập / Lịch học
      header/                      # Thông báo, tuỳ chọn, tạo thông báo
      Edit/                        # Sửa biểu mẫu/checklist
      ...

    config/                        # Tiện ích cấu hình UI/logic
      BacktoTop.jsx
      Darkmode.jsx
      DeleteHTML.jsx
      FormatDate.jsx
      PhieuChecklist/*             # Cấu hình render phiếu
      design/*                      # Thành phần thiết kế giao diện

    hook/                          # Hooks tiện ích (thiết bị, vị trí, quyền, ...)
      useDeviceInfo.js
      useLocationInfo.js
      usePermission.js
      ...

    notificationContext.js         # Context thông báo client

  Backend/
    server.js                      # Server HTTPS Express, BasicAuth, đăng ký tất cả routes, Socket.IO
    routes.js                      # (không dùng trực tiếp — logic routes tập trung trong server.js)

    MongoDB/
      database.js                  # Kết nối MongoDB (singleton, graceful shutdown)

    sql.js                         # Kết nối/tiện ích MSSQL (nếu dùng)
    cors.js                        # Cấu hình CORS (nếu tách riêng)
    minigameSocket.js              # Socket cụ thể (nếu tách)

    # Nhóm nghiệp vụ chính (được import trong server.js)
    loginUser.js                   # Đăng nhập, QR login
    usersAccount.js                # Quản lý tài khoản người dùng, upload ảnh, search, shortcuts
    changePassword.js              # Đổi mật khẩu
    Department.js                  # Phòng ban (tablea)
    chinhanh.js                    # Chi nhánh (repDocs) + notifications
    content.js                     # Nội dung chia sẻ
    docs.js                        # Checklist: CRUD, sync, get/save/titles...
    cauhoi.js                      # Câu hỏi của checklist + cấu hình điểm
    cautraloi.js                   # Trả lời/Phản hồi: CRUD, comment, pin, archive, batch
    historylogin.js                # Lịch sử đăng nhập
    Thongbao.js                    # Thông báo: CRUD, đánh dấu đã đọc
    giaoviec.js                    # Giao việc
    baomat.js                      # Bảo mật (kiểm tra...)
    Slider.js                      # Slider trang chủ
    report.js                      # Báo cáo
    share.js                       # Chia sẻ nội dung
    quiz.js                        # Quiz: lưu, list, delete, background, pin, validate, by id

    cham_cong/
      taocong.js                   # API chấm công: CRUD, approve, lịch sử
      ip.js                        # (nếu dùng IP whitelist/logic liên quan)

    TicketHR/
      admin.js                     # API thống kê/duyệt (admin)
      user.js                      # API danh sách yêu cầu của user
```

Ghi chú:
- Các thư mục `Phiên bản/`, các file `*.rar` là bản lưu trữ/theo dõi phiên bản nội bộ, không ảnh hưởng runtime.
- `public/models/*` dùng cho Face Recognition/Detection via `face-api.js` (TensorFlow.js) khi bật tính năng khuôn mặt.
- `routes.js` trong Backend hiện không centralize routes; thay vào đó `server.js` tự đăng ký từ danh sách routes.

## Yêu cầu hệ thống
- Node.js 18+
- MongoDB đang chạy cục bộ (mặc định `mongodb://localhost:27017`, DB `admin`)
- Chứng chỉ HTTPS PFX tại `SSL/certificate.pfx`

## Cấu hình
Mặc định mã nguồn có giá trị cứng cho chứng chỉ và basic auth. Khuyến nghị chuyển sang biến môi trường khi triển khai thực tế.

Gợi ý biến môi trường (đề xuất):
- BACKEND_PORT=3003
- SOCKET_PORT=4003
- MONGO_URI=mongodb://localhost:27017
- MONGO_DB=admin
- BASIC_AUTH_USER=Niso
- BASIC_AUTH_PASS=Niso@Niso123
- PFX_PATH=SSL/certificate.pfx
- PFX_PASSWORD=... (khác nhau giữa FE/BE hiện tại trong code)

Lưu ý hiện tại trong code:
- FE `app.js` giải PFX bằng mật khẩu "123456"
- BE `Backend/server.js` giải PFX bằng mật khẩu "s2hD3gcF"
Nên đồng nhất và đưa về biến môi trường để dễ quản trị.

## Cài đặt
```bash
npm install
```

## Chạy dự án
Có 2 cách phổ biến:

1) Chạy dev FE (CRA) với proxy tới BE
- Đảm bảo BE chạy tại `https://localhost:3003` (mặc định)
- Chạy Backend:
```bash
node Backend/server.js
```
- Chạy Frontend dev server (port 3002):
```bash
npm start
```
- Proxy cấu hình tại `src/setupProxy.js` (các route `/api`, `/checklist`, `/users`, ... sẽ được proxy).

2) Build FE rồi phục vụ qua `app.js`
- Build FE:
```bash
npm run build
```
- Chạy Backend:
```bash
node Backend/server.js
```
- Chạy FE HTTPS server + reverse proxy (port 3002):
```bash
node app.js
```
- `app.js` sẽ phục vụ thư mục `./build` và reverse proxy các route backend.

## Đăng nhập Backend (Basic Auth)
Backend yêu cầu Basic Auth ở mọi request:
- Username: `Niso`
- Password: `Niso@Niso123`
Hãy đổi trên môi trường thật và không commit credentials.

## Một số route tiêu biểu
- Phân quyền/Module: `/permissions/*`, `/modules/*`
- Tài khoản: `/users/*`, upload ảnh, đổi mật khẩu, tìm kiếm, shortcuts
- Phòng ban: `/tablea/*`
- Chi nhánh: `/chinhanh/*`, notifications
- Checklist: `/checklist/*`, câu hỏi `/checklist/by-checklist/:checklistId`
- Trả lời/Phản hồi: `/traloi/*` (add, update, comment, pin, archive, batch delete...)
- Chấm công: `/api/*` (timekeeping CRUD, approve, history)
- Nội dung/Chia sẻ: `/content/*`, `/share/*`
- Thông báo: `/thongbao/*`
- Báo cáo: `/report/*`
- Tài sản: `/api/assets*`, `/api/inventory-checks*`, `/api/warranties*`, `/api/retired-assets*`, `/api/reports`
- Lịch học/Học tập: `/api/lichhoc*`
- Quiz: `/api/quizzes*` (save, list, delete, backgrounds, pin, validate, by id)
- Socket.IO: chạy riêng trên cổng 4003

## Quốc tế hoá (i18n)
- File ngôn ngữ: `public/locales/{vi,en,it,jp,kh}/translation.json`
- Tích hợp `react-i18next`

## Ghi chú bảo mật
- Không để lộ mật khẩu PFX, Basic Auth, chuỗi kết nối DB trong mã nguồn.
- Đã bật HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection trong `app.js`.
- Cân nhắc rate-limit chặt hơn và logging sản xuất.

## Build & Triển khai
```bash
npm run build
node app.js
```
- Đảm bảo `SSL/certificate.pfx` hợp lệ và mật khẩu tương ứng.

## License
Nội bộ NISO. Không phân phối công khai.
