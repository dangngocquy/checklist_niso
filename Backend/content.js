const mssql = require('mssql');
const config = require('./sql');
const pool = new mssql.ConnectionPool(config);
const poolConnect = pool.connect();
const moment = require('moment');

exports.postContent = async (req, res) => {
  try {
    await poolConnect;
    const {
      ten_phieu,
      noi_dung_phieu,
      chi_nhanh,
      nguoidang,
      nguoi_tra_loi,
      ngay_phan_hoi,
      pairs,
      bo_phan,
      ngay_tao_phieu,
      cua_hang,
      chuc_vu,
      keys
    } = req.body;

    for (const pair of pairs) {
      const cauTraLoi = pair.cau_tra_loi ? pair.cau_tra_loi.toString() : '';
      const continueAgain = pair.Continue_Again ? pair.Continue_Again.toString() : '1';

      await pool.request()
        .input('keys', mssql.NVarChar, keys)
        .input('ten_phieu', mssql.NVarChar, ten_phieu)
        .input('noi_dung_phieu', mssql.NVarChar, noi_dung_phieu)
        .input('chi_nhanh', mssql.NVarChar, chi_nhanh || 'Khách vãng lai')
        .input('nguoidang', mssql.NVarChar, nguoidang)
        .input('nguoi_tra_loi', mssql.NVarChar, nguoi_tra_loi)
        .input('ngay_phan_hoi', mssql.NVarChar, ngay_phan_hoi)
        .input('noidungphu', mssql.NVarChar, pair.noidungphu || null)
        .input('tieudephu', mssql.NVarChar, pair.tieudephu || null)
        .input('cau_hoi', mssql.NVarChar, pair.cau_hoi)
        .input('cau_tra_loi', mssql.NVarChar, cauTraLoi || null)
        .input('bo_phan', mssql.NVarChar, bo_phan)
        .input('ngay_tao_phieu', mssql.NVarChar, ngay_tao_phieu)
        .input('Point', mssql.Decimal(18, 2), pair.Point || null)
        .input('yeu_cau', mssql.NVarChar, pair.yeu_cau || null)
        .input('Continue_Again', mssql.NVarChar, continueAgain)
        .input('cua_hang', mssql.NVarChar, cua_hang)
        .input('chuc_vu', mssql.NVarChar, chuc_vu)
        .input('dap_an_chinh_xac', mssql.NVarChar, pair.dap_an_chinh_xac || null)
        .input('TrangThai', mssql.NVarChar, pair.TrangThai || null)
        .query(`
          INSERT INTO databaseQuestions (keys, ten_phieu, noi_dung_phieu, chi_nhanh, nguoidang, nguoi_tra_loi, ngay_phan_hoi, noidungphu, tieudephu, cau_hoi, cau_tra_loi, bo_phan, ngay_tao_phieu, Point, yeu_cau, Continue_Again, dap_an_chinh_xac, cua_hang, chuc_vu, TrangThai)
          VALUES (@keys, @ten_phieu, @noi_dung_phieu, @chi_nhanh, @nguoidang, @nguoi_tra_loi, @ngay_phan_hoi, @noidungphu, @tieudephu, @cau_hoi, @cau_tra_loi, @bo_phan, @ngay_tao_phieu, @Point, @yeu_cau, @Continue_Again, @dap_an_chinh_xac, @cua_hang, @chuc_vu, @TrangThai)
        `);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Có lỗi xảy ra khi thêm dữ liệu:', error);
    res.status(500).json({ success: false, message: 'Lỗi kết nối tới server, vui lòng thử lại sau.' });
  }
};

exports.getContentAll = async (req, res) => {
  let poolConnection;
  try {
    // Increase request timeout to 60 seconds (adjust as needed)
    const requestTimeout = 60000; // 60 seconds
    
    poolConnection = await pool.connect();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    
    // Handle search and filter parameters
    const search = req.query.search && typeof req.query.search === 'string'
      ? `%${req.query.search}%`
      : null;
    const nguoidang = req.query.nguoidang && typeof req.query.nguoidang === 'string'
      ? `%${req.query.nguoidang}%`
      : null;
    const nguoi_tra_loi = req.query.nguoi_tra_loi && typeof req.query.nguoi_tra_loi === 'string'
      ? `%${req.query.nguoi_tra_loi}%`
      : null;

    // Validate and format dates
    const ngay_phan_hoi_start = req.query.ngay_phan_hoi_start &&
      moment(req.query.ngay_phan_hoi_start, 'DD-MM-YYYY', true).isValid()
      ? moment(req.query.ngay_phan_hoi_start, 'DD-MM-YYYY').format('DD-MM-YYYY')
      : null;
    const ngay_phan_hoi_end = req.query.ngay_phan_hoi_end &&
      moment(req.query.ngay_phan_hoi_end, 'DD-MM-YYYY', true).isValid()
      ? moment(req.query.ngay_phan_hoi_end, 'DD-MM-YYYY').format('DD-MM-YYYY')
      : null;
    const ngay_tao_phieu_start = req.query.ngay_tao_phieu_start &&
      moment(req.query.ngay_tao_phieu_start, 'DD-MM-YYYY', true).isValid()
      ? moment(req.query.ngay_tao_phieu_start, 'DD-MM-YYYY').format('DD-MM-YYYY')
      : null;
    const ngay_tao_phieu_end = req.query.ngay_tao_phieu_end &&
      moment(req.query.ngay_tao_phieu_end, 'DD-MM-YYYY', true).isValid()
      ? moment(req.query.ngay_tao_phieu_end, 'DD-MM-YYYY').format('DD-MM-YYYY')
      : null;

    // Validate sort parameters
    const allowedSortColumns = [
      'keys', 'ten_phieu', 'noi_dung_phieu', 'chi_nhanh', 'nguoidang', 
      'nguoi_tra_loi', 'ngay_phan_hoi', 'bo_phan', 'ngay_tao_phieu', 
      'Point', 'cua_hang', 'chuc_vu', 'TrangThai'
    ];
    const sortBy = allowedSortColumns.includes(req.query.sortBy) ? req.query.sortBy : 'ngay_phan_hoi';
    const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Build where clause
    let whereClause = '';
    const conditions = [];
    if (search) conditions.push("(ten_phieu LIKE @search OR noi_dung_phieu LIKE @search)");
    if (nguoidang) conditions.push("nguoidang LIKE @nguoidang");
    if (nguoi_tra_loi) conditions.push("nguoi_tra_loi LIKE @nguoi_tra_loi");
    if (ngay_phan_hoi_start) conditions.push("CONVERT(varchar, ngay_phan_hoi, 105) >= @ngay_phan_hoi_start");
    if (ngay_phan_hoi_end) conditions.push("CONVERT(varchar, ngay_phan_hoi, 105) <= @ngay_phan_hoi_end");
    if (ngay_tao_phieu_start) conditions.push("CONVERT(varchar, ngay_tao_phieu, 105) >= @ngay_tao_phieu_start");
    if (ngay_tao_phieu_end) conditions.push("CONVERT(varchar, ngay_tao_phieu, 105) <= @ngay_tao_phieu_end");

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Count total records - with timeout setting
    const countQuery = `
      SELECT COUNT(*) as total
      FROM databaseQuestions
      ${whereClause}
    `;

    const countRequest = poolConnection.request();
    // Set timeout for count request
    countRequest.timeout = requestTimeout;
    
    if (search) countRequest.input('search', mssql.NVarChar, search);
    if (nguoidang) countRequest.input('nguoidang', mssql.NVarChar, nguoidang);
    if (nguoi_tra_loi) countRequest.input('nguoi_tra_loi', mssql.NVarChar, nguoi_tra_loi);
    if (ngay_phan_hoi_start) countRequest.input('ngay_phan_hoi_start', mssql.NVarChar, ngay_phan_hoi_start);
    if (ngay_phan_hoi_end) countRequest.input('ngay_phan_hoi_end', mssql.NVarChar, ngay_phan_hoi_end);
    if (ngay_tao_phieu_start) countRequest.input('ngay_tao_phieu_start', mssql.NVarChar, ngay_tao_phieu_start);
    if (ngay_tao_phieu_end) countRequest.input('ngay_tao_phieu_end', mssql.NVarChar, ngay_tao_phieu_end);

    const countResult = await countRequest.query(countQuery);
    const totalRecords = countResult.recordset[0]?.total || 0;

    if (totalRecords === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          current: page,
          pageSize,
          total: 0
        }
      });
    }

    // Optimize the pagination query for better performance
    // Using TOP with subquery for efficient pagination (SQL Server 2008 compatible)
    const startRow = (page - 1) * pageSize + 1;
    const endRow = page * pageSize;
    
    const dataQuery = `
      SELECT * FROM (
        SELECT *,
          ngay_phan_hoi AS ngay_phan_hoi_formatted,
          ngay_tao_phieu AS ngay_tao_phieu_formatted,
          ROW_NUMBER() OVER (ORDER BY ${sortBy} ${sortOrder}) AS RowNum
        FROM databaseQuestions
        ${whereClause}
      ) AS PaginatedData
      WHERE RowNum BETWEEN @startRow AND @endRow
    `;

    const request = poolConnection.request();
    // Set timeout for data request
    request.timeout = requestTimeout;
    
    request.input('startRow', mssql.Int, startRow)
           .input('endRow', mssql.Int, endRow);
      
    if (search) request.input('search', mssql.NVarChar, search);
    if (nguoidang) request.input('nguoidang', mssql.NVarChar, nguoidang);
    if (nguoi_tra_loi) request.input('nguoi_tra_loi', mssql.NVarChar, nguoi_tra_loi);
    if (ngay_phan_hoi_start) request.input('ngay_phan_hoi_start', mssql.NVarChar, ngay_phan_hoi_start);
    if (ngay_phan_hoi_end) request.input('ngay_phan_hoi_end', mssql.NVarChar, ngay_phan_hoi_end);
    if (ngay_tao_phieu_start) request.input('ngay_tao_phieu_start', mssql.NVarChar, ngay_tao_phieu_start);
    if (ngay_tao_phieu_end) request.input('ngay_tao_phieu_end', mssql.NVarChar, ngay_tao_phieu_end);

    const result = await request.query(dataQuery);

    // Format the response data
    const formattedData = result.recordset.map(row => ({
      keys: row.keys,
      ten_phieu: row.ten_phieu,
      noi_dung_phieu: row.noi_dung_phieu,
      chi_nhanh: row.chi_nhanh,
      nguoidang: row.nguoidang,
      nguoi_tra_loi: row.nguoi_tra_loi,
      ngay_phan_hoi: row.ngay_phan_hoi_formatted,
      noidungphu: row.noidungphu,
      tieudephu: row.tieudephu,
      cau_hoi: row.cau_hoi,
      cau_tra_loi: row.cau_tra_loi,
      bo_phan: row.bo_phan,
      ngay_tao_phieu: row.ngay_tao_phieu_formatted,
      Point: row.Point,
      yeu_cau: row.yeu_cau,
      Continue_Again: row.Continue_Again,
      cua_hang: row.cua_hang,
      chuc_vu: row.chuc_vu,
      dap_an_chinh_xac: row.dap_an_chinh_xac,
      TrangThai: row.TrangThai
    }));

    res.json({
      success: true,
      data: formattedData,
      pagination: { current: page, pageSize, total: totalRecords }
    });

  } catch (error) {
    console.error('Lỗi:', error);
    
    // More detailed error handling for timeout
    if (error.code === 'ETIMEOUT') {
      return res.status(504).json({ 
        success: false, 
        message: 'Truy vấn mất quá nhiều thời gian, vui lòng thử lại với ít dữ liệu hơn hoặc thêm điều kiện lọc.' 
      });
    }
    
    res.status(500).json({ success: false, message: 'Lỗi server!' });
  } finally {
    if (poolConnection) {
      poolConnection.release();
    }
  }
};

// Các hàm khác giữ nguyên
exports.deleteContent = async (req, res) => {
  try {
    await poolConnect;
    const { keys } = req.params;

    await pool.request()
      .input('keys', mssql.NVarChar, keys)
      .query(`
        DELETE FROM databaseQuestions 
        WHERE keys = @keys
      `);

    res.json({ 
      success: true, 
      message: 'Đã xóa nội dung thành công' 
    });
  } catch (error) {
    console.error('Lỗi khi xóa nội dung:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi kết nối tới server, vui lòng thử lại sau.' 
    });
  }
};

exports.deleteAllContent = async (req, res) => {
  try {
    await poolConnect;
    const { keys } = req.body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp danh sách keys hợp lệ' 
      });
    }

    await pool.request()
      .input('keys', mssql.NVarChar, keys.join("','"))
      .query(`
        DELETE FROM databaseQuestions 
        WHERE keys IN ('${keys.join("','")}')
      `);

    res.json({ 
      success: true, 
      message: 'Đã xóa các nội dung được chọn thành công' 
    });
  } catch (error) {
    console.error('Lỗi khi xóa nhiều nội dung:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi kết nối tới server, vui lòng thử lại sau.' 
    });
  }
};

