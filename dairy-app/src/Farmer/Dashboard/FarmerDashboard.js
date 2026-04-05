import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { FaPaw, FaPlus, FaStethoscope, FaChevronDown, FaChevronRight, FaWarehouse, FaListAlt, FaUserTie, FaSignOutAlt, FaTractor } from 'react-icons/fa';

// Import CSS
import './FarmerDashboard.css'; 

// Import các Views
import CowManager from '../CowManager/CowManager';
import HealthRecords from '../Health/HealthRecords'; 
import FeedManager from '../FeedManager/FeedManager'; 
import MilkingLog from '../MilkingLog/MilkingLog'; 
import FarmerManager from '../Profile/FarmerProfile';

const FarmerDashboard = () => {
  const [activeTab, setActiveTab] = useState('cows');
  const [isCattleMenuOpen, setIsCattleMenuOpen] = useState(true); 
  const navigate = useNavigate();

  // Phát hiện thiết bị Mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (confirmLogout) {
      localStorage.removeItem('userRole'); 
      localStorage.removeItem('isLoggedIn');
      navigate('/login');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'cows': return <CowManager />;
      case 'health': return <HealthRecords />; 
      case 'feeds': return <FeedManager />;
      case 'milking': return <MilkingLog />;
      case 'profile': return <FarmerManager />;
      default: return <CowManager />;
    }
  };

  // ==========================================================
  // GIAO DIỆN MOBILE (Thanh Bottom Navigation 5 món)
  // ==========================================================
  if (isMobile) {
    const mobileMenuBtn = (menuName, icon, label) => (
      <div 
        onClick={() => setActiveTab(menuName)}
        className={`fdb-nav-item-mobile ${activeTab === menuName ? 'active' : ''}`}
      >
        <div style={{ fontSize: '1.4em' }}>{icon}</div>
        <span style={{ fontSize: '0.7em' }}>{label}</span>
      </div>
    );

    return (
      <div className="fdb-layout fdb-layout-mobile">
        {/* HEADER MOBILE */}
        <div className="fdb-mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaTractor size={22} />
            <h3 style={{ margin: 0, fontSize: '1.1em' }}>Trại Ba Vì</h3>
          </div>
          <button onClick={handleLogout} className="fdb-btn-logout-mobile">
            <FaSignOutAlt/> Thoát
          </button>
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div className="fdb-content-body" style={{ paddingBottom: '70px' }}>
          {renderContent()}
        </div>

        {/* THANH ĐIỀU HƯỚNG ĐÁY */}
        <div className="fdb-bottom-nav">
          {mobileMenuBtn('cows', <FaPaw />, 'Đàn Bò')}
          {mobileMenuBtn('health', <FaStethoscope />, 'Y Tế')}
          {mobileMenuBtn('feeds', <FaWarehouse />, 'Thức ăn')}
          {mobileMenuBtn('milking', <FaListAlt />, 'Vắt Sữa')}
          {mobileMenuBtn('profile', <FaUserTie />, 'Hồ Sơ')}
        </div>
      </div>
    );
  }

  // ==========================================================
  // GIAO DIỆN PC (Sidebar truyền thống)
  // ==========================================================
  return (
    <div className="fdb-layout">
      {/* SIDEBAR */}
      <div className="fdb-sidebar">
        <div className="fdb-sidebar-header">
          <div className="fdb-logo-section">
            <FaTractor size={28} />
            <h3>MilkTrace</h3>
          </div>
          <p className="fdb-user-info">Nông dân: Ba Vì Farm</p>
        </div>
        
        <ul className="fdb-menu-list">
          {/* MỤC CHA: QUẢN LÝ ĐÀN BÒ */}
          <li 
            className={`fdb-menu-item parent ${(activeTab === 'cows' || activeTab === 'health') ? 'active' : ''}`}
            onClick={() => setIsCattleMenuOpen(!isCattleMenuOpen)}
          >
            <div><FaPaw /> Quản lý Đàn bò</div>
            {isCattleMenuOpen ? <FaChevronDown size={12}/> : <FaChevronRight size={12}/>}
          </li>

          {/* CÁC MỤC CON CỦA QUẢN LÝ ĐÀN BÒ */}
          {isCattleMenuOpen && (
            <div className="fdb-sub-menu-container">
              <li 
                className={`fdb-sub-menu-item ${activeTab === 'cows' ? 'active-sub' : ''}`}
                onClick={(e) => { e.stopPropagation(); setActiveTab('cows'); }}
              >
                <FaPlus size={12} style={{marginRight: '10px'}}/> Thêm bò mới
              </li>
              <li 
                className={`fdb-sub-menu-item ${activeTab === 'health' ? 'active-sub' : ''}`}
                onClick={(e) => { e.stopPropagation(); setActiveTab('health'); }}
              >
                <FaStethoscope size={12} style={{marginRight: '10px'}}/> Hồ sơ sức khỏe
              </li>
            </div>
          )}

          {/* CÁC MỤC ĐƠN LẺ */}
          <li 
            className={`fdb-menu-item ${activeTab === 'feeds' ? 'active' : ''}`}
            onClick={() => setActiveTab('feeds')}
          >
            <FaWarehouse /> Kho Thức ăn
          </li>
          <li 
            className={`fdb-menu-item ${activeTab === 'milking' ? 'active' : ''}`}
            onClick={() => setActiveTab('milking')}
          >
            <FaListAlt /> Nhật ký Vắt sữa
          </li>
          <li 
            className={`fdb-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUserTie /> Quản lý Nông dân
          </li>
        </ul>

        <div className="fdb-sidebar-footer">
          <button className="fdb-btn-logout-pc" onClick={handleLogout}>
            <FaSignOutAlt /> Đăng xuất
          </button>
        </div>
      </div>

      {/* NỘI DUNG BÊN PHẢI (PC) */}
      <div className="fdb-main-content">
        <header className="fdb-top-bar">
          <h2>Hệ thống Truy xuất Nguồn gốc Sữa</h2>
          <div className="fdb-wallet-status">
            🟢 Ví: 0x123...ABC
          </div>
        </header>

        <div className="fdb-content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;