import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserTie, FaPlus, FaSearch, FaEdit, FaTrashAlt, FaUsers, FaPhoneAlt } from 'react-icons/fa';

// Import CSS đã tách
import './FarmerProfile.css'; 
import { BASE_URL } from '../../config'; 

// Tự động nối chuỗi bằng dấu backtick (`)
const API_URL = `${BASE_URL}/farmers`;


const FarmerManager = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const initialFormState = {
    id: '', fullName: '', farmName: '', phone: '', address: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => { fetchFarmers(); }, []);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setFarmers(res.data);
    } catch (error) { console.error("Lỗi:", error); }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const generateNextId = () => {
    if (farmers.length === 0) return 'ND-01';
    const maxId = farmers.reduce((max, farmer) => {
      const parts = farmer.id.split('-'); 
      if (parts.length < 2) return max; 
      const num = parseInt(parts[1]); 
      return num > max ? num : max;
    }, 0);
    const nextNum = maxId + 1;
    return `ND-${nextNum.toString().padStart(2, '0')}`;
  };

  const checkDuplicatePhone = (phoneNumber, currentId) => {
    return farmers.find(f => f.phone === phoneNumber && f.id !== currentId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; 

    if (!formData.fullName || !formData.phone) {
      alert("Vui lòng nhập Tên và Số điện thoại!");
      return;
    }

    const duplicateFarmer = checkDuplicatePhone(formData.phone, formData.id);
    if (duplicateFarmer) {
      alert(`⛔ Lỗi: Số điện thoại ${formData.phone} đã được dùng!`);
      return;
    }

    setIsSubmitting(true); 

    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${formData.id}`, formData);
        alert(`✅ Đã cập nhật: ${formData.fullName}`);
      } else {
        const newId = generateNextId();
        if (farmers.some(f => f.id === newId)) {
             alert("Hệ thống đang bận, vui lòng thử lại!");
             setIsSubmitting(false);
             return;
        }

        const newFarmer = { ...formData, id: newId };
        await axios.post(API_URL, newFarmer);
        alert(`✅ Đã thêm mới thành công! Mã: ${newId}`);
      }
      
      await fetchFarmers(); 
      resetForm();
      
    } catch (error) { 
      console.error(error);
      alert("Lỗi hệ thống! Kiểm tra Console."); 
    } finally {
      setIsSubmitting(false); 
    }
  };

  const handleEditClick = (item) => {
    setFormData(item);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Xóa nông dân ${id}?`)) {
      try { await axios.delete(`${API_URL}/${id}`); fetchFarmers(); } 
      catch (error) { alert("Xóa thất bại!"); }
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
  };

  const filteredFarmers = farmers.filter(f => 
    f.id.toLowerCase().includes(keyword.toLowerCase()) || 
    f.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
    f.farmName.toLowerCase().includes(keyword.toLowerCase()) ||
    f.phone.includes(keyword)
  );

  return (
    <div className="frm-container fade-in">
      <h2 className="frm-title">
        <FaUserTie /> Quản lý Nông Dân / Trang Trại
      </h2>
      
      <div className="frm-layout">
        
        {/* ================= CỘT TRÁI: FORM THÊM MỚI ================= */}
        <div className="frm-col-form">
          <div className="frm-card">
            <div className="frm-card-header" style={{backgroundColor: isEditing ? '#f39c12' : '#27ae60'}}>
              <h3><FaPlus /> {isEditing ? `Đang sửa: ${formData.id}` : "Thêm Nông dân Mới"}</h3>
            </div>
            
            <div className="frm-card-body">
              <form onSubmit={handleSubmit}>
                
                <div className="frm-form-group">
                  <label>Mã Nông dân (Tự động):</label>
                  <input 
                    name="id" value={formData.id} disabled 
                    placeholder={isEditing ? formData.id : "--- Tự động tạo ---"} 
                    className="frm-input frm-input-disabled" 
                  />
                </div>

                <div className="frm-form-group">
                  <label>Họ và Tên <span style={{color:'red'}}>*</span>:</label>
                  <input 
                    name="fullName" value={formData.fullName} 
                    onChange={handleInputChange} 
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="frm-input"
                  />
                </div>

                <div className="frm-form-group">
                  <label>Số điện thoại <span style={{color:'red'}}>*</span> (Duy nhất):</label>
                  <input 
                    name="phone" value={formData.phone} 
                    onChange={handleInputChange} 
                    placeholder="09xxxx" type="number" 
                    className="frm-input"
                  />
                  {checkDuplicatePhone(formData.phone, formData.id) && (
                     <small className="frm-error-text">⚠️ Số này đã được sử dụng!</small>
                  )}
                </div>

                <div className="frm-form-group">
                  <label>Tên Trại / Hợp tác xã:</label>
                  <input 
                    name="farmName" value={formData.farmName} 
                    onChange={handleInputChange} 
                    placeholder="Trại Bò Sữa..."
                    className="frm-input"
                  />
                </div>

                <div className="frm-form-group">
                  <label>Địa chỉ:</label>
                  <input 
                    name="address" value={formData.address} 
                    onChange={handleInputChange} 
                    placeholder="Thôn, Xã, Huyện..."
                    className="frm-input"
                  />
                </div>

                <button 
                  type="submit" 
                  className="frm-btn-submit" 
                  style={{ backgroundColor: isEditing ? (isSubmitting ? '#95a5a6' : '#f39c12') : (isSubmitting ? '#95a5a6' : '#27ae60') }}
                  disabled={!!checkDuplicatePhone(formData.phone, formData.id) || isSubmitting} 
                >
                  {isSubmitting ? "⏳ Đang xử lý..." : (isEditing ? "💾 Cập nhật thông tin" : "➕ Lưu & Cấp Mã Số")}
                </button>
                  
                {isEditing && !isSubmitting && (
                  <button type="button" className="frm-btn-cancel" onClick={resetForm}>
                    Hủy bỏ
                  </button>
                )}

              </form>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI: LỌC & DANH SÁCH ================= */}
        <div className="frm-col-list">
          
          <div className="frm-card" style={{ padding: '20px' }}>
            <div className="frm-search-bar">
              <FaSearch color="#95a5a6" />
              <input 
                type="text" 
                placeholder="Tìm theo Mã, Tên, Trại hoặc SĐT..." 
                value={keyword} onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="frm-card">
            <div className="frm-card-header" style={{backgroundColor: '#2c3e50'}}>
              <h3><FaUsers /> Danh sách Nông hộ ({filteredFarmers.length})</h3>
            </div>
            
            <div className="frm-card-body" style={{ padding: 0 }}>
              {loading ? (
                <p style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>Đang tải...</p>
              ) : (
                <div className="frm-table-wrapper">
                  <table className="frm-table">
                    <thead>
                      <tr>
                        <th>Mã số</th>
                        <th>Họ Tên & Trại</th>
                        <th>Liên hệ & Địa chỉ</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFarmers.length > 0 ? filteredFarmers.map(item => (
                        <tr key={item.id}>
                          <td><span className="frm-id-text">{item.id}</span></td>
                          <td>
                            <span className="frm-name-text">{item.fullName}</span>
                            <span className="frm-sub-text">{item.farmName}</span>
                          </td>
                          <td>
                            <span className="frm-phone-text"><FaPhoneAlt size={12}/> {item.phone}</span>
                            <span className="frm-sub-text">{item.address}</span>
                          </td>
                          <td>
                            <div className="frm-action-group">
                              <button className="frm-btn-icon edit" onClick={() => handleEditClick(item)} title="Sửa"><FaEdit /></button>
                              <button className="frm-btn-icon delete" onClick={() => handleDelete(item.id)} title="Xóa"><FaTrashAlt /></button>
                            </div>
                          </td>
                        </tr>
                      )) : <tr><td colSpan="4" align="center" style={{ padding: '20px', color: '#95a5a6' }}>Chưa có dữ liệu</td></tr>}
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

export default FarmerManager;