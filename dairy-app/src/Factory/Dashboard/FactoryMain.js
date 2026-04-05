import React, { useState, useEffect } from 'react';
import { FaChartBar, FaTruck, FaMicroscope, FaIndustry, FaVial, FaTimesCircle, FaBox, FaListAlt, FaCheckCircle, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Import CSS
import './FactoryMain.css';

// Import các trang nghiệp vụ
import ReceiveMilk from '../Receive/ReceiveMilk';
import QualityControl from '../Quality/QualityControl';
import Production from '../Product/Production';

// =====================================================================
// COMPONENT: NỘI DUNG TRANG TỔNG QUAN (DASHBOARD)
// =====================================================================

const StatCard = ({ title, value, icon, color, bgColor }) => (
  <div className="fm-stat-card" style={{ borderBottom: `4px solid ${color}` }}>
    <div className="fm-stat-icon-wrapper" style={{ background: bgColor, color: color }}>
      {icon}
    </div>
    <div className="fm-stat-info">
      <h4>{title}</h4>
      <h2>{value}</h2>
    </div>
  </div>
);

const DashboardContent = () => {
  const [stats, setStats] = useState({
    totalShipments: 0, totalVolume: 0, pendingQC: 0, rejected: 0, produced: 0, recentActivities: []
  });

  useEffect(() => {
    const loadDashboardData = () => {
      const shipments = JSON.parse(localStorage.getItem('factory_received')) || [];
      let totalVol = 0, pending = 0, rejectedCount = 0, producedCount = 0;

      shipments.forEach(s => {
        const vol = parseFloat(s.totalVolume.replace(' Lít', ''));
        if (!isNaN(vol)) totalVol += vol;

        if (s.status === 'Đã nhập kho' || s.status === 'Chờ kiểm định QC') pending += 1;
        else if (s.status === 'Hủy bỏ (Lỗi QC)') rejectedCount += 1;
        else if (s.status === 'Đã sản xuất') producedCount += 1;
      });

      const recent = [...shipments].sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)).slice(0, 5);

      setStats({
        totalShipments: shipments.length, totalVolume: totalVol, pendingQC: pending,
        rejected: rejectedCount, produced: producedCount, recentActivities: recent
      });
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const getStatusClass = (status) => {
    if (status === 'Đã nhập kho' || status === 'Chờ kiểm định QC') return 'fm-status-pending';
    if (status === 'Đạt chuẩn QC') return 'fm-status-qc';
    if (status === 'Đã sản xuất') return 'fm-status-success';
    return 'fm-status-error';
  };

  return (
    <div className="fm-dashboard-wrapper fade-in">
      <h2 className="fm-dashboard-title">
        <FaChartBar /> Tổng Quan Nhà Máy
      </h2>

      <div className="fm-stat-cards-container">
        <StatCard title="Tổng Nguyên Liệu (Lít)" value={stats.totalVolume.toLocaleString('vi-VN')} icon={<FaTruck />} color="#3498db" bgColor="#ebf5fb" />
        <StatCard title="Chờ Kiểm Định (Bồn)" value={stats.pendingQC} icon={<FaVial />} color="#f39c12" bgColor="#fef5e7" />
        <StatCard title="Bị Hủy Bỏ (Lỗi QC)" value={stats.rejected} icon={<FaTimesCircle />} color="#e74c3c" bgColor="#fdedec" />
        <StatCard title="Đã Đóng Hộp (Lô)" value={stats.produced} icon={<FaBox />} color="#27ae60" bgColor="#e9f7ef" />
      </div>

      <div className="fm-recent-activity-card">
        <h3 className="fm-recent-activity-title"><FaListAlt /> Hoạt động nhập kho gần đây</h3>
        {stats.recentActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: '#bdc3c7' }}><FaListAlt size={50} style={{ marginBottom: '15px' }} /><p>Chưa có dữ liệu hoạt động.</p></div>
        ) : (
          <div className="fm-table-container">
            <table className="fm-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Mã Chuyến Xe (Master QR)</th>
                  <th>Nguồn nguyên liệu</th>
                  <th>Trạng thái hiện tại</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivities.map((act, idx) => (
                  <tr key={idx}>
                    <td style={{ color: '#7f8c8d' }}>{new Date(act.receivedAt).toLocaleString('vi-VN')}</td>
                    <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      {act.masterId}
                      <div style={{ fontSize: '0.85em', color: '#95a5a6', marginTop: '4px', fontWeight: 'normal' }}>
                        Thể tích: <span style={{color:'#27ae60', fontWeight:'bold'}}>{act.totalVolume}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#d35400', fontWeight: 'bold' }}>{act.breeds}</span><br/>
                      <small style={{ color: '#7f8c8d' }}>Gộp từ {act.totalBatches} lô lẻ</small>
                    </td>
                    <td>
                      <span className={`fm-status-badge ${getStatusClass(act.status)}`}>
                        {act.status === 'Đã sản xuất' && <FaCheckCircle />}
                        {act.status === 'Hủy bỏ (Lỗi QC)' && <FaTimesCircle />}
                        {(act.status === 'Đã nhập kho' || act.status === 'Chờ kiểm định QC') && <FaVial />}
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================================
// COMPONENT CHÍNH: KHUNG LAYOUT MENU NHÀ MÁY
// =====================================================================

const FactoryMain = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      navigate('/login');
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return <DashboardContent />;
      case 'receive': return <ReceiveMilk />;
      case 'qc': return <QualityControl />;
      case 'production': return <Production />;
      default: return <DashboardContent />;
    }
  };

  // ==========================================================
  // GIAO DIỆN MOBILE
  // ==========================================================
  if (isMobile) {
    const mobileMenuBtn = (menuName, icon, label) => (
      <div 
        onClick={() => setActiveMenu(menuName)}
        className={`fm-nav-item-mobile ${activeMenu === menuName ? 'active' : ''}`}
      >
        <div style={{ fontSize: '1.4em' }}>{icon}</div>
        <span style={{ fontSize: '0.7em' }}>{label}</span>
      </div>
    );

    return (
      <div className="fm-layout fm-layout-mobile">
        <div className="fm-mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaIndustry size={24} color="#3498db" />
            <h3 style={{ margin: 0, fontSize: '1.1em' }}>NHÀ MÁY SỮA</h3>
          </div>
          <button onClick={handleLogout} className="fm-btn-logout-mobile">
            <FaSignOutAlt/> Thoát
          </button>
        </div>

        <div className="fm-content-area">
          {renderContent()}
        </div>

        <div className="fm-bottom-nav">
          {mobileMenuBtn('dashboard', <FaChartBar />, 'Tổng Quan')}
          {mobileMenuBtn('receive', <FaTruck />, 'Tiếp Nhận')}
          {mobileMenuBtn('qc', <FaMicroscope />, 'Lab QC')}
          {mobileMenuBtn('production', <FaBox />, 'Đóng Gói')}
        </div>
      </div>
    );
  }

  // ==========================================================
  // GIAO DIỆN PC
  // ==========================================================
  const pcMenuBtn = (menuName, icon, label) => (
    <div 
      onClick={() => setActiveMenu(menuName)} 
      className={`fm-nav-item-pc ${activeMenu === menuName ? 'active' : ''}`}
    >
      {icon} {label}
    </div>
  );

  return (
    <div className="fm-layout">
      <div className="fm-sidebar">
        <div className="fm-sidebar-header">
          <FaIndustry size={40} color="#3498db" />
          <h3 style={{ margin: '10px 0 0 0', color: '#ecf0f1' }}>NHÀ MÁY SỮA</h3>
        </div>
        
        {pcMenuBtn('dashboard', <FaChartBar />, 'Tổng Quan')}
        {pcMenuBtn('receive', <FaTruck />, 'Tiếp Nhận Sữa Thô')}
        {pcMenuBtn('qc', <FaMicroscope />, 'Phòng Lab (QC)')}
        {pcMenuBtn('production', <FaIndustry />, 'Xưởng Đóng Gói')}

        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button onClick={handleLogout} className="fm-btn-logout-pc">
            <FaSignOutAlt /> ĐĂNG XUẤT
          </button>
        </div>
      </div>

      <div className="fm-content-area">
        {renderContent()}
      </div>
    </div>
  );
};

export default FactoryMain;