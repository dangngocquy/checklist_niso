// server.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const forge = require('node-forge');
const { Server } = require('socket.io');

// Đọc và phân tích chứng chỉ SSL
const pfxFile = fs.readFileSync(path.resolve(__dirname, '../SSL/certificate.pfx'));
const p12Asn1 = forge.asn1.fromDer(pfxFile.toString('binary'), false);
const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, 's2hD3gcF');
let cert, key;
for (const safeContents of p12.safeContents) {
  for (const safeBag of safeContents.safeBags) {
    if (safeBag.cert) {
      cert = forge.pki.certificateToPem(safeBag.cert);
    } else if (safeBag.key) {
      key = forge.pki.privateKeyToPem(safeBag.key);
    }
  }
}

const app = express();
const port = 3003;

// Áp dụng middleware chung
app.use(cors());
app.use(express.json({ limit: '1000mb' }));
app.use(bodyParser.json({ limit: '1000mb', extended: true }));

// Middleware basicAuth
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const createHtmlResponse = (title, message) => `
    ${title}
    ${message}
    NISO CORPORATION
  `;
  if (!authHeader) {
    return res.status(401).send(createHtmlResponse(
      'Bạn tính hack hay gì ? ! 😈',
      'Mọi hành vi cố gắng xâm nhập bất hợp pháp là hành vi phạm luật an ninh mạng, xin dừng lại Please! 😢.'
    ));
  }
  const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const username = auth[0];
  const password = auth[1];
  if (username === 'Niso' && password === 'Niso@Niso123') {
    next();
  } else {
    res.status(401).send(createHtmlResponse(
      'Thông tin đăng nhập không chính xác',
      'Vui lòng thử lại với thông tin đúng.'
    ));
  }
});

// Tạo HTTPS server
const server = https.createServer({ key, cert }, app);
server.setMaxListeners(0);

// Tạo server Socket.IO riêng
const socketServer = https.createServer({ key, cert });
const socketPort = 4003;

// Khởi tạo Socket.IO
const io = new Server(socketServer, {
  cors: {
    origin: '*', // Cấu hình CORS cho phép client kết nối
    methods: ['GET', 'POST'],
  },
});

// server.js
io.on('connection', (socket) => {
  console.log(`Người dùng đã kết nối: ${socket.id}`);

  socket.on('joinRoom', ({ quizId, clientId }) => {
    if (!clientId) {
      console.error('ClientId không được cung cấp khi tham gia phòng');
      return;
    }
    socket.join(quizId);
    console.log(`Người dùng ${clientId} đã tham gia phòng ${quizId}`);
  });

  socket.on('answerSelected', ({ quizId, clientId, questionId, selectedAnswers }) => {
    console.log(`Người dùng ${clientId} đã chọn đáp án cho câu hỏi ${questionId}`);
    // Gửi thông tin đáp án đã chọn đến tất cả người dùng trong phòng
    io.to(quizId).emit('answerSelected', {
      quizId,
      clientId,
      questionId,
      selectedAnswers
    });
  });

  socket.on('startQuiz', ({ quizId, quizData, countdown }) => {
    console.log(`Quiz ${quizId} đã bắt đầu`);
    io.to(quizId).emit('startQuiz', { quizId, quizData, countdown });
  });

  socket.on('nextQuestion', ({ quizId, questionIndex }) => {
    console.log(`Chuyển sang câu hỏi ${questionIndex} trong phòng ${quizId}`);
    io.to(quizId).emit('updateQuestion', { questionIndex });
  });

  socket.on('updateCountdown', ({ quizId, countdown }) => {
    io.to(quizId).emit('updateCountdown', { quizId, countdown });
  });

  socket.on('updateQuestionTime', ({ quizId, questionIndex, timeLeft }) => {
    io.to(quizId).emit('updateQuestionTime', { quizId, questionIndex, timeLeft });
  });

  socket.on('disconnect', () => {
    console.log(`Người dùng đã rời phòng: ${socket.id}`);
  });
});

// Import các module
const loginUser = require('./loginUser');
const usersAccount = require('./usersAccount');
const changePassword = require('./changePassword');
const docs = require('./docs');
const Department = require('./Department');
const repDocs = require('./chinhanh');
const content = require('./content');
const Report = require('./report');
const Cautraloi = require('./cautraloi');
const Cauhoi = require('./cauhoi');
const Historylogin = require('./historylogin');
const Thongbao = require('./Thongbao');
const Giaoviec = require('./giaoviec');
const TAOCONG = require('./cham_cong/taocong');
const Phanquyen = require('./phanquyenchung');
const Share = require('./share');
const Baomat = require('./baomat');
const SLIDER = require('./Slider');
const assetRoutes = require('./asset');
const ADMINTICKTHR = require('./TicketHR/admin');
const USERTICKTHR = require('./TicketHR/user');
const LichHoc = require('./lichhoc');
const QUIZ = require('./quiz');

// Truyền io vào module QUIZ để sử dụng
QUIZ.setIo(io);

// Định nghĩa các route
const routes = [
  { method: 'get', path: '/permissions/:type/:id', handler: Phanquyen.getPermissions },
  { method: 'put', path: '/permissions/:type/:id', handler: Phanquyen.updatePermissions },
  { method: 'get', path: '/modules/all', handler: Phanquyen.getModules },
  { method: 'post', path: '/modules/add', handler: Phanquyen.addModule },
  { method: 'put', path: '/modules/update/:id', handler: Phanquyen.updateModule },
  { method: 'post', path: '/modules/permissions', handler: Phanquyen.getEntityPermissions },
  { method: 'delete', path: '/modules/delete/:id', handler: Phanquyen.deleteModule },
  { method: 'put', path: '/permissions/batch', handler: Phanquyen.updateBatchPermissions },
  { method: 'post', path: '/login/dashboard', handler: loginUser.postLoginUser },
  { method: 'post', path: '/login/generate-qr', handler: loginUser.generateQRCode },
  { method: 'post', path: '/login/verify-qr', handler: loginUser.verifyQRCode },
  { method: 'put', path: '/slider/:id', handler: SLIDER.putSlider },
  { method: 'get', path: '/slider/all', handler: SLIDER.getSlider },
  { method: 'post', path: '/slider', handler: SLIDER.postSlider },
  { method: 'delete', path: '/slider/delete/:id', handler: SLIDER.deleteSlider },
  { method: 'get', path: '/users/all', handler: usersAccount.getusersAccount },
  { method: 'get', path: '/users/get/:keys', handler: usersAccount.getusersAccountID },
  { method: 'post', path: '/users/add', handler: usersAccount.postusersAccount },
  { method: 'put', path: '/users/update/:keys', handler: usersAccount.putusersAccount },
  { method: 'put', path: '/users/update-face-id/:keys', handler: usersAccount.updateFaceID },
  { method: 'delete', path: '/users/delete/:keys', handler: usersAccount.deleteusersAccount },
  { method: 'put', path: '/users/upload/:keys', handler: usersAccount.putImage },
  { method: 'put', path: '/users/upload-background/:keys', handler: usersAccount.putBackgroundImage },
  { method: 'get', path: '/users/changepassword/:keys', handler: changePassword.getchangePassword },
  { method: 'put', path: '/users/changepassword/:keys', handler: changePassword.putchangePassword },
  { method: 'post', path: '/users/delete-multiple', handler: usersAccount.deleteMultipleUsers },
  { method: 'get', path: '/tablea/all', handler: Department.getTableAData },
  { method: 'put', path: '/tablea/update/:keys', handler: Department.editTableAData },
  { method: 'delete', path: '/tablea/delete/:keys', handler: Department.deleteTableAData },
  { method: 'post', path: '/tablea/add', handler: Department.addDepartment },
  { method: 'post', path: '/tablea/upload', handler: Department.uploadDepartments },
  { method: 'put', path: '/edit/phanquyen/:keys', handler: Department.editphanquyenData },
  { method: 'delete', path: '/tablea/deleteall', handler: Department.deletePhongbanAll },
  { method: 'get', path: '/tablea/search', handler: Department.searchDepartment },
  { method: 'post', path: '/chinhanh/add', handler: repDocs.PostrepDocs },
  { method: 'post', path: '/chinhanh/transfer', handler: repDocs.transferChinhanh },
  { method: 'get', path: '/chinhanh/all', handler: repDocs.getrepDocs },
  { method: 'put', path: '/chinhanh/edit/update/:id', handler: repDocs.PutrepDocs },
  { method: 'get', path: '/chinhanh/search', handler: repDocs.searchChinhanh },
  { method: 'delete', path: '/chinhanh/delete/:id', handler: repDocs.DeleterepDocs },
  { method: 'delete', path: '/chinhanh/deleteall', handler: repDocs.deleteChinhanhAll },
  { method: 'put', path: '/chinhanh/notifications/mark-all-read', handler: Thongbao.markAllNotificationsAsRead },
  { method: 'get', path: '/chinhanh/notifications/all', handler: Thongbao.getNotifications },
  { method: 'put', path: '/chinhanh/notifications/mark-read/:id', handler: Thongbao.markNotificationAsRead },
  { method: 'get', path: '/checklist/custom/all', handler: docs.GetAllChecklistsCustom },
  { method: 'get', path: '/api/all', handler: TAOCONG.getAllTimekeeping },
  { method: 'get', path: '/api/user-timekeeping-history', handler: TAOCONG.getUserTimekeepingHistory },
  { method: 'post', path: '/api/timekeeping', handler: TAOCONG.postTimekeeping },
  { method: 'post', path: '/api/timekeeping/create', handler: TAOCONG.postCreateTimekeeping },
  { method: 'put', path: '/api/timekeeping/:id', handler: TAOCONG.updateTimekeeping },
  { method: 'get', path: '/api/user-timekeeping', handler: TAOCONG.getUserTimekeeping },
  { method: 'delete', path: '/api/timekeeping/:id', handler: TAOCONG.deleteTimekeeping },
  { method: 'put', path: '/api/timekeeping/approve/:id', handler: TAOCONG.approveTimekeeping },
  { method: 'post', path: '/content/add', handler: content.postContent },
  { method: 'get', path: '/content/all-grouped', handler: content.getContentAll },
  { method: 'delete', path: '/content/delete/:keys', handler: content.deleteContent },
  { method: 'post', path: '/content/delete-all', handler: content.deleteAllContent },
  { method: 'get', path: '/checklist/all', handler: docs.GetAllDocs },
  { method: 'post', path: '/checklist/add', handler: docs.PostDocs },
  { method: 'delete', path: '/checklist/delete/:id', handler: docs.DeleteDoc },
  { method: 'post', path: '/checklist/create', handler: docs.CreateDoc },
  { method: 'get', path: '/checklist/check-title', handler: docs.CheckTitleExists },
  { method: 'get', path: '/checklist/all/:id', handler: docs.GetDocById },
  { method: 'get', path: '/checklist/by-checklist/:checklistId', handler: Cauhoi.GetQuestionsByChecklistId },
  { method: 'put', path: '/checklist/update-point-config/:checklistId', handler: Cauhoi.UpdatePointConfig },
  { method: 'get', path: '/checklist/titles', handler: Cautraloi.GetChecklistTitles },
  { method: 'get', path: '/traloi/assigned', handler: Cautraloi.GetAssignedResponses },
  { method: 'get', path: '/checklist/save', handler: docs.GetChecklistSave },
  { method: 'get', path: '/checklist/matching', handler: docs.GetMatchingChecklists },
  { method: 'post', path: '/checklist/sync', handler: docs.SyncChecklist },
  { method: 'put', path: '/checklist/update/:id', handler: docs.UpdateDoc },
  { method: 'post', path: '/checklist/delete-multiple', handler: docs.DeleteMultipleDocs },
  { method: 'get', path: '/report/all', handler: Report.getReport },
  { method: 'post', path: '/report/add', handler: Report.postReport },
  { method: 'put', path: '/report/update/:keys', handler: Report.putReport },
  { method: 'get', path: '/report/get/:keys', handler: Report.getReportById },
  { method: 'delete', path: '/report/delete/:keys', handler: Report.deleteReport },
  { method: 'post', path: '/report/delete-multiple', handler: Report.deleteMultipleReports },
  { method: 'get', path: '/share/all', handler: Share.getShare },
  { method: 'post', path: '/share/add', handler: Share.postShare },
  { method: 'put', path: '/share/update/:id', handler: Share.putShare },
  { method: 'get', path: '/traloi/all', handler: Cautraloi.Getallcautraloi },
  { method: 'get', path: '/traloi/toiuu', handler: Cautraloi.GetallToiUu },
  { method: 'get', path: '/traloi/archive', handler: Cautraloi.GetArchiveResponses },
  { method: 'get', path: '/traloi/response-all-user', handler: USERTICKTHR.GetAllYeuCau },
  { method: 'get', path: '/traloi/by-checklist/:checklistId', handler: Cautraloi.GetResponsesByChecklistId },
  { method: 'post', path: '/traloi/add', handler: Cautraloi.PostCautraloi },
  { method: 'get', path: '/traloi/get/:id', handler: Cautraloi.GetCautraloi },
  { method: 'get', path: '/traloi/comment/:id', handler: Cautraloi.GetComment },
  { method: 'get', path: '/traloi/response-all', handler: ADMINTICKTHR.GetAllYeuCau },
  { method: 'get', path: '/traloi/response-counts-and-data', handler: ADMINTICKTHR.GetResponseCountsAndData },
  { method: 'delete', path: '/traloi/delete/:id', handler: Cautraloi.DeleteCautraloi },
  { method: 'post', path: '/traloi/deleteBatch', handler: Cautraloi.BatchDeleteCautraloi },
  { method: 'put', path: '/traloi/update/:id', handler: Cautraloi.UpdateDoc },
  { method: 'post', path: '/traloi/phanhoi/:id', handler: Cautraloi.UpdatePhanhoi },
  { method: 'put', path: '/traloi/update/:id', handler: Cautraloi.UpdateResponse },
  { method: 'post', path: '/traloi/sync', handler: Cautraloi.SyncCautraloi },
  { method: 'post', path: '/traloi/phanhoi/nested/:id', handler: Cautraloi.UpdatePhanhoiNested },
  { method: 'put', path: '/traloi/xulynhiemvu/:documentId/:questionId', handler: Cautraloi.UpdateXuLyNhiemVu },
  { method: 'put', path: '/traloi/phanhoi/pin', handler: Cautraloi.PinReply },
  { method: 'put', path: '/traloi/phanhoi/nested/pin', handler: Cautraloi.PinNestedReply },
  { method: 'get', path: '/history/login', handler: Historylogin.getHistorylogin },
  { method: 'post', path: '/history/login/add', handler: Historylogin.postHistorylogin },
  { method: 'put', path: '/history/login/update', handler: Historylogin.putHistorylogin },
  { method: 'post', path: '/giaoviec/add', handler: Giaoviec.postGiaoviec },
  { method: 'get', path: '/giaoviec/all', handler: Giaoviec.getGiaoviec },
  { method: 'post', path: '/baomat/check', handler: Baomat.postBaomat },
  { method: 'get', path: '/baomat/all', handler: Baomat.getBaomat },
  { method: 'get', path: '/api/users/department-related', handler: usersAccount.getDepartmentRelatedUsers },
  { method: 'get', path: '/checklist/user', handler: docs.GetUserChecklists },
  { method: 'get', path: '/checklist/saved-by-user', handler: docs.GetSavedChecklistsByUserKeys },
  { method: 'get', path: '/users/search', handler: usersAccount.searchUsers },
  { method: 'get', path: '/users/shortcuts', handler: usersAccount.getUserShortcuts },
  { method: 'post', path: '/users/shortcuts/save', handler: usersAccount.saveUserShortcuts },
  { method: 'get', path: '/api/assets', handler: assetRoutes.getAssets },
  { method: 'post', path: '/api/assets', handler: assetRoutes.addAsset },
  { method: 'put', path: '/api/assets/:id', handler: assetRoutes.updateAsset },
  { method: 'delete', path: '/api/assets/:id', handler: assetRoutes.deleteAsset },
  { method: 'get', path: '/api/assets/:id', handler: assetRoutes.getAssetById },
  { method: 'get', path: '/api/inventory-checks', handler: assetRoutes.getInventoryChecks },
  { method: 'post', path: '/api/inventory-checks', handler: assetRoutes.addInventoryCheck },
  { method: 'put', path: '/api/inventory-checks/:checkId/check-asset/:assetId', handler: assetRoutes.updateInventoryCheckAsset },
  { method: 'delete', path: '/api/inventory-checks/:id', handler: assetRoutes.deleteInventoryCheck },
  { method: 'put', path: '/api/inventory-checks/:id', handler: assetRoutes.updateInventoryCheck },
  { method: 'get', path: '/api/asset-categories', handler: assetRoutes.getAssetCategories },
  { method: 'get', path: '/api/assets/search', handler: assetRoutes.searchAssets },
  { method: 'get', path: '/api/warranties', handler: assetRoutes.getWarranties },
  { method: 'post', path: '/api/warranties', handler: assetRoutes.addWarranty },
  { method: 'delete', path: '/api/warranties/delete/:id', handler: assetRoutes.deleteWarranty },
  { method: 'put', path: '/api/warranties/:id', handler: assetRoutes.updateWarranty },
  { method: 'get', path: '/api/retired-assets', handler: assetRoutes.getRetiredAssets },
  { method: 'post', path: '/api/retired-assets', handler: assetRoutes.addRetiredAsset },
  { method: 'delete', path: '/api/retired-assets/:id', handler: assetRoutes.deleteRetiredAsset },
  { method: 'put', path: '/api/retired-assets/:id/approve', handler: assetRoutes.approveRetiredAsset },
  { method: 'put', path: '/api/retired-assets/:id', handler: assetRoutes.updateRetiredAsset },
  { method: 'post', path: '/api/reports', handler: assetRoutes.generateReport },
  { method: 'get', path: '/api/lichhoc', handler: LichHoc.getAllLichHoc },
  { method: 'get', path: '/api/lichhoc/:id', handler: LichHoc.getLichHocById },
  { method: 'post', path: '/api/lichhoc', handler: LichHoc.createLichHoc },
  { method: 'put', path: '/api/lichhoc/:id', handler: LichHoc.updateLichHoc },
  { method: 'delete', path: '/api/lichhoc/:id', handler: LichHoc.deleteLichHoc },
  { method: 'post', path: '/api/quizzes/save', handler: QUIZ.saveQuiz },
  { method: 'get', path: '/api/quizzes', handler: QUIZ.getAllQuizzes },
  { method: 'delete', path: '/api/quizzes/:quizId', handler: QUIZ.deleteQuiz },
  { method: 'post', path: '/api/quizzes/background', handler: QUIZ.saveQuizBackground },
  { method: 'post', path: '/api/quizzes/update-pin', handler: QUIZ.updateQuizPin },
  { method: 'post', path: '/api/quizzes/validate-pin', handler: QUIZ.validatePin },
  { method: 'get', path: '/api/quizzes/custom-backgrounds', handler: QUIZ.getCustomBackgrounds },
  { method: 'get', path: '/api/quizzes/id/:quizId', handler: QUIZ.getQuizById },
];

// Đăng ký route
const registerRoutes = (routes) => {
  routes.forEach(route => {
    app[route.method](route.path, route.handler);
  });
};

registerRoutes(routes);

server.removeAllListeners('close');

const logListenerCount = () => {
  console.log(`Số lượng listener 'close' hiện tại: ${server.listenerCount('close')}`);
};

server.on('close', () => {
  console.log('Máy chủ đang đóng');
  logListenerCount();
});

// Khởi động server
server.listen(port, () => {
  console.log(`https://localhost:${port} Backend Checklist đang chạy`);
  logListenerCount();
});

// Khởi động server Socket.IO
socketServer.listen(socketPort, () => {
  console.log(`Socket.IO server đang chạy trên port ${socketPort}`);
});

// Xử lý tín hiệu dừng
const gracefulShutdown = () => {
  console.log('Đã nhận tín hiệu tắt. Đang đóng máy chủ...');
  server.close(() => {
    console.log('Máy chủ đã đóng thành công');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});