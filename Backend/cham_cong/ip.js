const axios = require('axios');
const config = require('../sql');
const { networkInterfaces } = require('os');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mssql = require('mssql');

const ensureFileExists = async (filePath) => {
    try {
        await fs.access(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, '[]', 'utf-8');
        } else {
            throw error;
        }
    }
};

const readJsonFile = async (filePath) => {
    await ensureFileExists(filePath);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file from disk: ${error}`);
        throw error;
    }
};

const writeJsonFile = async (filePath, data) => {
    await ensureFileExists(filePath);
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing file to disk: ${error}`);
        throw error;
    }
};

exports.getIP = async (req, res) => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        const wanIP = response.data.ip;
        const lanIPs = Object.values(networkInterfaces())
            .flat()
            .filter(({ family, internal }) => family === 'IPv4' && !internal)
            .map(({ address }) => address);
        const clientIP = req.ip || req.connection.remoteAddress;

        res.json({
            wanIP: wanIP,
            lanIPs: lanIPs,
            clientIP: clientIP
        });
    } catch (error) {
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy thông tin IP' });
    }
};

exports.getAllTimekeeping = async (req, res) => {
    try {
        const dataDir = path.join(__dirname, '../../src/data/chamcong');
        const files = await fs.readdir(dataDir);
        let allData = [];

        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(dataDir, file);
                const fileData = await readJsonFile(filePath);
                allData = allData.concat(fileData);
            }
        }

        res.json({ success: true, data: allData });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy dữ liệu chấm công' });
    }
};

exports.postIP = async (req, res) => {
    try {
        const { id, IPWan, Thoigianvao, Thoigianra, trangthai, Vitri, keysJSON, lydovao, lydora, ghichu, chinhanh, tre, NgayCham, som, IPWanServer, MaNhanVien, calamviec } = req.body;
        const timekeepingData = {
            id,
            IPWan,
            IPWanServer,
            Thoigianvao,
            Thoigianra,
            trangthai,
            Vitri,
            keysJSON,
            lydovao,
            lydora,
            NgayCham,
            ghichu,
            chinhanh,
            tre,
            calamviec,
            som,
            MaNhanVien
        };

        const keysJsonPath = path.join(__dirname, `../../src/data/chamcong/${keysJSON}.json`);

        let existingData = await readJsonFile(keysJsonPath);
        existingData.push(timekeepingData);
        await writeJsonFile(keysJsonPath, existingData);

        res.json({ success: true, message: 'Chấm thành công', data: timekeepingData });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi thực hiện chấm công' });
    }
};

exports.getAllRestaurants = async (req, res) => {
    try {
        const restaurantsPath = path.join(__dirname, '../../src/data/restaurants.json');
        const restaurants = await readJsonFile(restaurantsPath);
        res.json(restaurants);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy danh sách nhà hàng' });
    }
};

exports.updateTimekeeping = async (req, res) => {
    try {
      const { id } = req.params;
      const { Thoigianra, som } = req.body;
  
      const keysJsonPath = path.join(__dirname, `../../src/data/chamcong/${req.body.keysJSON}.json`);
      let existingData = await readJsonFile(keysJsonPath);
  
      const index = existingData.findIndex(item => item.id === id);
      if (index !== -1) {
        existingData[index] = { ...existingData[index], Thoigianra, som };
        await writeJsonFile(keysJsonPath, existingData);
        res.json({ success: true, message: 'Cập nhật thành công', data: existingData[index] });
      } else {
        res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Đã xảy ra lỗi khi cập nhật chấm công' });
    }
  };
//SQLSERVER

exports.postToSQL = async (req, res) => {
    try {
        const pool = new mssql.ConnectionPool(config);
        await pool.connect();
        const result = await pool.request()
            .input('IPWan', mssql.NVarChar, req.body.IPWan)
            .input('Thoigianvao', mssql.NVarChar, req.body.Thoigianvao)
            .input('HoTen', mssql.NVarChar, req.body.HoTen)
            .input('Vitri', mssql.NVarChar, req.body.Vitri)
            .input('keys', mssql.NVarChar, req.body.keys)
            .input('chinhanh', mssql.NVarChar, req.body.chinhanh)
            .input('MaNhanVien', mssql.NVarChar, req.body.MaNhanVien)
            .query(`INSERT INTO databaseChamcong (IPWan, HoTen, Thoigianvao, Vitri, chinhanh, MaNhanVien, keys) 
                    VALUES (@IPWan, @HoTen, @Thoigianvao, @Vitri, @chinhanh, @MaNhanVien, @keys)`);

        res.json({ success: true, message: 'Đã thêm vào SQL Server thành công' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi thêm vào SQL Server' });
    } finally {
        mssql.close();
    }
};

exports.updateToSQL = async (req, res) => {
    try {
        const keys = req.params.keys; 
        if (!keys) {
            return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
        }

        const pool = new mssql.ConnectionPool(config);
        await pool.connect();
        const result = await pool.request()
            .input('keys', mssql.NVarChar, keys) 
            .input('Thoigianra', mssql.NVarChar, req.body.Thoigianra)
            .input('IPWan', mssql.NVarChar, req.body.IPWan)
            .input('HoTen', mssql.NVarChar, req.body.HoTen)
            .input('Vitri', mssql.NVarChar, req.body.Vitri)
            .input('chinhanh', mssql.NVarChar, req.body.chinhanh)
            .input('MaNhanVien', mssql.NVarChar, req.body.MaNhanVien)
            .query(`UPDATE databaseChamcong 
                    SET Thoigianra = @Thoigianra, 
                        IPWan = @IPWan, 
                        Vitri = @Vitri, 
                        HoTen = @HoTen, 
                        chinhanh = @chinhanh, 
                        MaNhanVien = @MaNhanVien
                    WHERE keys = @keys`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy bản ghi để cập nhật' });
        }

        res.json({ success: true, message: 'Đã cập nhật SQL Server thành công' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Đã xảy ra lỗi khi cập nhật SQL Server: ' + error.message });
    } finally {
        mssql.close();
    }
};
exports.getFromSQL = async (req, res) => {
    try {
        const pool = new mssql.ConnectionPool(config);
        await pool.connect();
        const result = await pool.request()
            .query('SELECT * FROM databaseChamcong');

        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy dữ liệu từ SQL Server' });
    } finally {
        mssql.close();
    }
};