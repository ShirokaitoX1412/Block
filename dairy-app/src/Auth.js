import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import milkLogo from './Farmer/Dashboard/milk.jpg';
import './Auth.css';

// IMPORT BIẾN BASE_URL TỪ FILE CONFIG VÀO ĐÂY
import { BASE_URL } from '../src/config'; 

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // ==========================================
        // DÙNG BASE_URL CHO ĐĂNG NHẬP
        // ==========================================
        const response = await fetch(`${BASE_URL}/farmers?email=${email}&password=${password}`);
        const data = await response.json();

        if (data.length > 0) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', email);
          navigate('/dashboard'); 
        } else {
          alert("Sai Email hoặc Mật khẩu! Hoặc tài khoản chưa tồn tại.");
        }
      } else {
        // ==========================================
        // DÙNG BASE_URL CHO ĐĂNG KÝ
        // ==========================================
        const checkRes = await fetch(`${BASE_URL}/farmers?email=${email}`);
        const checkData = await checkRes.json();
        
        if (checkData.length > 0) {
          alert("Email này đã được sử dụng! Vui lòng dùng email khác.");
          setIsLoading(false);
          return;
        }

        const newFarmer = {
          id: `FARMER-${Date.now()}`,
          email: email,
          password: password,
          fullName: "Người dùng mới",
          farmName: "Chưa cập nhật",
          phone: "",
          address: ""
        };

        const response = await fetch(`${BASE_URL}/farmers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newFarmer)
        });

        if (response.ok) {
          alert("Đăng ký thành công! Hãy đăng nhập lại để vào hệ thống.");
          setIsLogin(true); 
          setEmail('');
          setPassword('');
        } else {
          alert("Lỗi khi đăng ký tài khoản!");
        }
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      alert("Không thể kết nối tới Server Backend! Hãy kiểm tra xem json-server đã chạy ở port 5000 chưa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img 
            src={milkLogo} 
            alt="MilkTrace Logo" 
            className="brand-image" 
          />
          <h2>MilkTrace</h2>
          <p>{isLogin ? "Chào mừng quay trở lại" : "Đăng ký thành viên mới"}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="nhap-email@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Mật khẩu</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label>Xác nhận mật khẩu</label>
              <input type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          )}

          <button type="submit" className="btn-auth" disabled={isLoading}>
            {isLoading ? <div className="spinner"></div> : (isLogin ? "Đăng Nhập" : "Đăng Ký")}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
            <span className="toggle-link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? " Đăng ký ngay" : " Đăng nhập"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;