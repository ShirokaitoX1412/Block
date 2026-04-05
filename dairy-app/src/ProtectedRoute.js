import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // 1. Lấy trạng thái đăng nhập từ localStorage
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const location = useLocation();

  if (!isLoggedIn) {
    // 2. Thông báo cho người dùng biết họ không có quyền truy cập
    alert("Cảnh báo bảo mật: Bạn cần đăng nhập để truy cập vào hệ thống MilkTrace!");

    // 3. Điều hướng về trang login và lưu lại vị trí họ định truy cập (để sau khi login có thể quay lại đúng chỗ đó)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Nếu hợp lệ, cho phép hiển thị nội dung Dashboard
  return children;
};

export default ProtectedRoute;