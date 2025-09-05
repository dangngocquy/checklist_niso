const config = {
  user: 'sa',
  password: '',
  server: 'DESKTOP-5C9IQJK',  // Try using 'localhost' instead of hostname
  database: 'SQL_NISO',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    trustServerCertificate: true,
    charset: 'UTF-8',
    encrypt: false,
  }
};

module.exports = config;
// const config = {
//   user: 'sa',
//   password: '',
//   server: '127.0.0.1',
//   port: 8433,
//   database: 'CHECKLISTNISO',
//   driver: 'msnodesqlv8',
//   options: {
//     trustedConnection: true,
//     enableArithAbort: true,
//     trustServerCertificate: true, //tắt xác nhận chứng chỉ
//     charset: 'UTF-8',
//     encrypt: false,
//   }
// };

// module.exports = config;
