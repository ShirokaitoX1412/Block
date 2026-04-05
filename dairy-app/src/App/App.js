import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import các giao diện
import Auth from '../Auth';
import FarmerDashboard from '../Farmer/Dashboard/FarmerDashboard.js';
import FactoryMain from '../Factory/Dashboard/FactoryMain.js';
import ProtectedRoute from '../ProtectedRoute';

// THÊM DÒNG IMPORT NÀY:
import ConsumerApp from '../ConsumerApp.js'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* =======================================================
            PHẦN 1: PUBLIC ROUTES (KHÔNG CẦN ĐĂNG NHẬP)
        ======================================================= */}
        
        {/* 1. Trang Đăng nhập (Dành cho nội bộ nhân viên) */}
        <Route path="/login" element={<Auth />} />

        {/* 2. TRANG CHO KHÁCH HÀNG (PUBLIC 100%) */}
        {/* Lưu ý: KHÔNG bọc nó trong <ProtectedRoute> */}
        <Route path="/scan" element={<ConsumerApp />} />


        {/* =======================================================
            PHẦN 2: PRIVATE ROUTES (BẮT BUỘC ĐĂNG NHẬP)
        ======================================================= */}
        
        {/* 3. Phân hệ Nông dân */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <FarmerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* 4. Phân hệ Nhà máy */}
        <Route 
          path="/factory" 
          element={
            <ProtectedRoute>
              <FactoryMain />
            </ProtectedRoute>
          } 
        />

        {/* =======================================================
            PHẦN 3: XỬ LÝ LỖI (FALLBACK)
        ======================================================= */}
        {/* Nếu khách gõ sai link, tự động đẩy về trang /scan hoặc /login */}
        <Route path="*" element={<Navigate to="/scan" />} />
      </Routes>
    </Router>
  );
}

export default App;