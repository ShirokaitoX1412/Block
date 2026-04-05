import React, { useState } from 'react';
import { 
  FaPaw, FaPlus, FaStethoscope, FaChevronDown, 
  FaWarehouse, FaClipboardList, FaUserFriends 
} from 'react-icons/fa';
import '../../App/App.css'; 

const Sidebar = ({ setCurrentView, currentView }) => {
  const [isCattleMenuOpen, setIsCattleMenuOpen] = useState(true);

  return (
    <aside className="sidebar-container">
      <div className="sidebar-brand">
        <div className="brand-icon">🐄</div>
        <div className="brand-info">
          <h2 className="brand-name">MilkTrace</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* NHÓM QUẢN LÝ ĐÀN BÒ */}
        <div className="nav-group">
          <div 
            className={`nav-item parent ${isCattleMenuOpen ? 'expanded' : ''}`} 
            onClick={() => setIsCattleMenuOpen(!isCattleMenuOpen)}
          >
            <div className="nav-item-left">
              <FaPaw className="nav-icon" /> 
              <span>Quản lý Đàn bò</span>
            </div>
            <FaChevronDown className={`arrow-icon ${isCattleMenuOpen ? 'rotate' : ''}`} />
          </div>

          {/* CÁC NÚT BẤM CON (SUB-BUTTONS) */}
          <div className={`sub-menu-container ${isCattleMenuOpen ? 'show' : ''}`}>
            <button 
              className={`sub-nav-button ${currentView === 'add-cow' ? 'active' : ''}`} 
              onClick={() => setCurrentView('add-cow')}
            >
              <FaPlus className="sub-icon" /> Thêm bò mới
            </button>
            <button 
              className={`sub-nav-button ${currentView === 'health-records' ? 'active' : ''}`} 
              onClick={() => setCurrentView('health-records')}
            >
              <FaStethoscope className="sub-icon" /> Hồ sơ sức khỏe
            </button>
          </div>
        </div>

        <div className="nav-divider">Chức năng khác</div>

        <div className={`nav-item ${currentView === 'feeds' ? 'active' : ''}`} onClick={() => setCurrentView('feeds')}>
           <div className="nav-item-left"><FaWarehouse className="nav-icon" /> <span>Kho Thức ăn</span></div>
        </div>

        <div className={`nav-item ${currentView === 'milking' ? 'active' : ''}`} onClick={() => setCurrentView('milking')}>
           <div className="nav-item-left"><FaClipboardList className="nav-icon" /> <span>Nhật ký Vắt sữa</span></div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;