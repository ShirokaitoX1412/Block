const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors()); 
app.use(bodyParser.json());

const DB_PATH = './db.json';
const RECAPTCHA_SECRET_KEY = "6Lc7L2AsAAAAAPUpWmUS40zwX5GrWbQ5ulwS1_j4"; 

// --- HÀM QUẢN LÝ DỮ LIỆU FILE ---
const readDB = () => {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { 
            users: [], 
            farmers: [], 
            cows: [], 
            feeds: [], 
            healthRecords: [], 
            milkLogs: [] 
        };
    }
};

const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// ==========================================
// 1. API XÁC THỰC & HỒ SƠ NÔNG DÂN
// ==========================================
app.post('/api/auth', async (req, res) => {
    const { email, password, captchaToken, isLogin } = req.body;
    const db = readDB();

    if (isLogin) {
        if (!captchaToken) return res.status(400).json({ success: false, message: "Vui lòng xác minh Captcha!" });
        try {
            const googleRes = await axios.post(
                `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
            );
            if (!googleRes.data.success) return res.status(400).json({ success: false, message: "Captcha không hợp lệ!" });
        } catch (err) { return res.status(500).json({ message: "Lỗi Google API" }); }

        if (!db.users) db.users = [];
        const user = db.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            if (!db.farmers) db.farmers = [];
            const profile = db.farmers.find(f => f.email === email);
            return res.json({ success: true, message: "Đăng nhập thành công!", profile });
        }
        return res.status(401).json({ success: false, message: "Tài khoản không chính xác!" });
    } else {
        if (!db.users) db.users = [];
        if (db.users.find(u => u.email === email)) return res.status(400).json({ success: false, message: "Email đã tồn tại!" });
        db.users.push({ email, password });
        writeDB(db);
        return res.json({ success: true, message: "Đăng ký thành công!" });
    }
});

app.get('/farmers', (req, res) => {
    res.json(readDB().farmers || []);
});

app.post('/farmers', (req, res) => {
    const db = readDB();
    if (!db.farmers) db.farmers = [];
    const newFarmer = { ...req.body, id: "FARMER-" + Date.now() };
    db.farmers.push(newFarmer);
    writeDB(db);
    res.status(201).json(newFarmer);
});

app.delete('/farmers/:id', (req, res) => {
    const db = readDB();
    if (!db.farmers) return res.json({ success: false });
    db.farmers = db.farmers.filter(f => f.id !== req.params.id);
    writeDB(db);
    res.json({ success: true, message: "Đã xóa nông dân" });
});

app.post('/api/farmer/profile', (req, res) => {
    const db = readDB();
    if (!db.farmers) db.farmers = [];
    const farmerData = req.body; 
    const index = db.farmers.findIndex(f => f.email === farmerData.email);
    if (index !== -1) db.farmers[index] = { ...db.farmers[index], ...farmerData };
    else db.farmers.push(farmerData);
    writeDB(db);
    res.json({ success: true, message: "Đã cập nhật hồ sơ trang trại!" });
});

// ==========================================
// 2. API QUẢN LÝ ĐÀN BÒ & THỨC ĂN
// ==========================================
app.get('/cows', (req, res) => res.json(readDB().cows || []));

app.post('/cows', (req, res) => {
    const db = readDB();
    if (!db.cows) db.cows = [];
    db.cows.push(req.body);
    writeDB(db);
    res.status(201).json(req.body);
});

// THÊM API XÓA BÒ (Phòng hờ bạn cũng cần nút xóa bên danh sách bò)
app.delete('/cows/:id', (req, res) => {
    const db = readDB();
    if (!db.cows) return res.json({ success: false });
    db.cows = db.cows.filter(c => c.id !== req.params.id && c.maBo !== req.params.id);
    writeDB(db);
    res.json({ success: true, message: "Đã xóa bò khỏi danh sách" });
});

app.get('/feeds', (req, res) => res.json(readDB().feeds || []));

app.post('/feeds', (req, res) => {
    const db = readDB();
    if (!db.feeds) db.feeds = [];
    db.feeds.push(req.body);
    writeDB(db);
    res.status(201).json(req.body);
});

// ĐÃ THÊM API XÓA THỨC ĂN Ở ĐÂY 
app.delete('/feeds/:id', (req, res) => {
    const db = readDB();
    if (!db.feeds) return res.json({ success: false, message: "Không có dữ liệu thức ăn" });
    
    // Lọc bỏ thức ăn dựa vào ID hoặc maThucAn
    db.feeds = db.feeds.filter(f => f.id !== req.params.id && f.maThucAn !== req.params.id);
    
    writeDB(db);
    res.json({ success: true, message: "Đã xóa thức ăn khỏi kho" });
});

// ==========================================
// 3. API NHẬT KÝ VẮT SỮA
// ==========================================
app.get('/milk-logs', (req, res) => {
    res.json(readDB().milkLogs || []);
});

app.post('/milk-logs', (req, res) => {
    const db = readDB();
    if (!db.milkLogs) db.milkLogs = [];
    const newBatch = {
        ...req.body,
        id: "BATCH-" + Date.now(), 
        createdAt: new Date().toISOString()
    };
    db.milkLogs.push(newBatch);
    writeDB(db);
    res.status(201).json(newBatch);
});

// API Đồng bộ hàng loạt lô sữa lên Blockchain
app.put('/milk-logs/sync', (req, res) => {
    const db = readDB();
    if (!db.milkLogs) return res.json({ success: false });

    // Lấy danh sách các mã lô cần đồng bộ từ giao diện gửi lên
    const { batchIds, txHash } = req.body; 

    // Tìm và cập nhật trạng thái của các lô này
    db.milkLogs.forEach(log => {
        if (batchIds.includes(log.batchId)) {
            log.syncStatus = 'Đã đồng bộ';
            log.txHash = txHash; // Lưu lại mã giao dịch tổng
        }
    });

    writeDB(db);
    res.json({ success: true, message: "Đã cập nhật trạng thái đồng bộ" });
});
// ==========================================
// 4. API QUẢN LÝ HỒ SƠ SỨC KHỎE
// ==========================================
app.get('/health-records', (req, res) => {
    res.json(readDB().healthRecords || []);
});

app.get('/health-records/:cowId', (req, res) => {
    const db = readDB();
    if (!db.healthRecords) return res.json([]);
    const records = db.healthRecords.filter(r => r.cowId === req.params.cowId);
    res.json(records);
});

app.post('/health-records', (req, res) => {
    const db = readDB();
    if (!db.healthRecords) db.healthRecords = [];
    const newRecord = {
        ...req.body,
        id: "HR-" + Date.now(),
        blockchainHash: "0x" + Math.random().toString(16).slice(2, 12),
        createdAt: new Date().toISOString()
    };
    db.healthRecords.push(newRecord);
    writeDB(db);
    res.status(201).json(newRecord);
});

app.delete('/health-records/:id', (req, res) => {
    const db = readDB();
    if (!db.healthRecords) return res.json({ success: false });
    db.healthRecords = db.healthRecords.filter(r => r.id !== req.params.id);
    writeDB(db);
    res.json({ success: true, message: "Đã xóa hồ sơ y tế" });
});

// ==========================================
// KHỞI CHẠY SERVER
// ==========================================
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==============================================`);
    console.log(`Hệ thống MilkTrace đang chạy tại Cổng ${PORT}`);
    console.log(`Kết nối dữ liệu: ${DB_PATH}`);
    console.log(`==============================================\n`);
});