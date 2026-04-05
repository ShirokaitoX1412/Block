import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaWarehouse, FaPlus, FaSearch, FaLeaf, FaBoxOpen, FaEdit, FaTrashAlt, FaCalendarAlt } from 'react-icons/fa';

// Import CSS đã tách
import './FeedManager.css'; 

import { BASE_URL } from '../../config'; 

// Tự động nối chuỗi bằng dấu backtick (`)
const API_URL = `${BASE_URL}/feeds`;

const FeedManager = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({ keyword: '', type: '', source: '' });

  const initialFormState = {
    id: '', 
    name: '', 
    type: 'Thức ăn thô', 
    source: 'Tự trồng', 
    importDate: new Date().toISOString().split('T')[0], 
    mfgDate: '', 
    expDate: '', 
    supplier: '', 
    note: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => { fetchFeeds(); }, []);

  const fetchFeeds = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setFeeds(res.data);
    } catch (error) { console.error("Lỗi:", error); }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const generateNextId = () => {
    if (feeds.length === 0) return 'TA-01';
    const maxId = feeds.reduce((max, item) => {
      const parts = item.id.split('-');
      const num = parts.length >= 2 ? parseInt(parts[1]) : 0;
      return (!isNaN(num) && num > max) ? num : max;
    }, 0);
    return `TA-${(maxId + 1).toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name) return alert("Vui lòng nhập Tên thức ăn!");
    if (!formData.mfgDate || !formData.expDate) {
      return alert("Vui lòng nhập đầy đủ Ngày sản xuất và Hạn sử dụng!");
    }

    const mfg = new Date(formData.mfgDate);
    const exp = new Date(formData.expDate);

    if (exp <= mfg) {
      return alert("❌ Lỗi: Hạn sử dụng phải lớn hơn Ngày sản xuất!");
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${formData.id}`, formData);
        alert(`✅ Đã cập nhật: ${formData.id}`);
      } else {
        const newId = generateNextId();
        const newItem = { ...formData, id: newId };
        await axios.post(API_URL, newItem);
        alert(`✅ Đã nhập kho thành công: ${newId}`);
      }
      await fetchFeeds();
      resetForm();
    } catch (error) { 
      alert("Lỗi hệ thống!"); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredFeeds = feeds.filter((item) => {
    const matchKeyword = item.id.toLowerCase().includes(filters.keyword.toLowerCase()) || 
                         item.name.toLowerCase().includes(filters.keyword.toLowerCase());
    const matchType = filters.type ? item.type === filters.type : true;
    const matchSource = filters.source ? item.source === filters.source : true;
    return matchKeyword && matchType && matchSource;
  });

  const handleEditClick = (item) => {
    setFormData(item);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Xóa mã ${id} khỏi danh mục?`)) {
      try { await axios.delete(`${API_URL}/${id}`); fetchFeeds(); } 
      catch (error) { alert("Xóa thất bại!"); }
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
  };

  return (
    <div className="fdm-container fade-in">
      <h2 className="fdm-title">
        <FaWarehouse /> Quản lý Kho Thức ăn
      </h2>
      
      <div className="fdm-layout">
        {/* ================= CỘT TRÁI: FORM KHAI BÁO ================= */}
        <div className="fdm-col-form">
          <div className="fdm-card">
            <div className="fdm-card-header" style={{backgroundColor: isEditing ? '#f39c12' : '#e67e22'}}>
              <h3><FaPlus /> {isEditing ? `Sửa: ${formData.id}` : "Khai báo nhập kho"}</h3>
            </div>
            <div className="fdm-card-body">
              <form onSubmit={handleSubmit}>
                <div className="fdm-form-group">
                  <label>Mã Thức ăn (Tự động):</label>
                  <input value={formData.id} disabled className="fdm-input" placeholder="TA-xx" />
                </div>
                
                <div className="fdm-form-group">
                  <label>Tên Thức ăn <span style={{color:'red'}}>*</span>:</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} required className="fdm-input" />
                </div>

                <div className="fdm-form-group">
                  <label><FaCalendarAlt color="#7f8c8d"/> Ngày nhập kho:</label>
                  <input type="date" name="importDate" value={formData.importDate} onChange={handleInputChange} className="fdm-input" />
                </div>
                
                <div className="fdm-form-group">
                  <label><FaCalendarAlt color="#7f8c8d"/> Ngày sản xuất (NSX):</label>
                  <input type="date" name="mfgDate" value={formData.mfgDate} onChange={handleInputChange} className="fdm-input" />
                </div>
                
                <div className="fdm-form-group">
                  <label><FaCalendarAlt color="#7f8c8d"/> Hạn sử dụng (HSD):</label>
                  <input type="date" name="expDate" value={formData.expDate} onChange={handleInputChange} className="fdm-input" />
                </div>

                <div className="fdm-form-group">
                  <label>Phân loại:</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="fdm-select">
                    <option value="Thức ăn thô">🌿 Thức ăn thô</option>
                    <option value="Thức ăn tinh">🌽 Thức ăn tinh</option>
                    <option value="Thức ăn bổ sung">💊 Thức ăn bổ sung</option>
                  </select>
                </div>
                
                <div className="fdm-form-group">
                  <label>Nguồn gốc:</label>
                  <select name="source" value={formData.source} onChange={handleInputChange} className="fdm-select">
                    <option value="Tự trồng">🏡 Tự trồng</option>
                    <option value="Mua ngoài">🚛 Mua ngoài</option>
                    <option value="Nhập khẩu">✈️ Nhập khẩu</option>
                  </select>
                </div>
                
                <button type="submit" className="fdm-btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "⏳ Đang lưu..." : (isEditing ? "Lưu thay đổi" : "📥 Nhập vào kho")}
                </button>

                {isEditing && (
                  <button type="button" onClick={resetForm} className="fdm-btn-cancel">
                    Hủy chỉnh sửa
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI: DANH SÁCH & TÌM KIẾM ================= */}
        <div className="fdm-col-list">
          
          <div className="fdm-card" style={{ padding: '20px' }}>
            {/* Thanh Tìm Kiếm */}
            <div className="fdm-search-bar">
              <FaSearch color="#95a5a6" />
              <input 
                type="text" name="keyword" 
                placeholder="Tìm tên hoặc mã thức ăn..." 
                value={filters.keyword} onChange={handleFilterChange} 
              />
            </div>
          </div>

          <div className="fdm-card">
            <div className="fdm-card-header" style={{backgroundColor: '#2c3e50'}}>
              <h3><FaWarehouse /> Danh mục Kho ({filteredFeeds.length})</h3>
            </div>
            
            <div className="fdm-card-body" style={{ padding: 0 }}>
              {loading ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>Đang tải...</p>
              ) : (
                <div className="fdm-table-wrapper">
                  <table className="fdm-table">
                    <thead>
                      <tr>
                        <th>Mã/Tên</th>
                        <th>Thời hạn (NSX - HSD)</th>
                        <th>Ngày Nhập</th>
                        <th>Loại/Nguồn</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFeeds.length > 0 ? filteredFeeds.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong style={{ color: '#2980b9' }}>{item.id}</strong><br/>
                            <span style={{ fontSize: '0.9em' }}>{item.name}</span>
                          </td>
                          <td>
                            <small>NSX: {item.mfgDate || '---'}</small><br/>
                            <small style={{ color: '#e74c3c', fontWeight: 'bold' }}>HSD: {item.expDate || '---'}</small>
                          </td>
                          <td>{new Date(item.importDate).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`fdm-tag ${item.type === 'Thức ăn thô' ? 'fdm-tag-leaf' : 'fdm-tag-box'}`}>
                               {item.type === 'Thức ăn thô' ? <FaLeaf /> : <FaBoxOpen />} {item.type}
                            </span><br/>
                            <span className={`fdm-badge ${item.source === 'Tự trồng' ? 'fdm-badge-green' : 'fdm-badge-blue'}`}>
                              {item.source}
                            </span>
                          </td>
                          <td>
                            <div className="fdm-action-group">
                              <button className="fdm-btn-icon edit" onClick={() => handleEditClick(item)} title="Sửa"><FaEdit /></button>
                              <button className="fdm-btn-icon delete" onClick={() => handleDelete(item.id)} title="Xóa"><FaTrashAlt /></button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" align="center" style={{ padding: '20px', color: '#95a5a6' }}>Không có dữ liệu trong kho</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default FeedManager;