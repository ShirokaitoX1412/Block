import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { QRCodeCanvas } from 'qrcode.react'; 
import { FaPaw, FaSearch, FaEdit, FaQrcode, FaTimes, FaListAlt } from 'react-icons/fa';
import './CowManager.css'; 
import { BASE_URL } from '../../config'; 

const API_URL = `${BASE_URL}/cows`;

const CowManager = () => {
  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState({ keyword: '', breed: '' });

  const initialFormState = {
    id: '', 
    breed: 'Holstein Friesian', 
    dob: '', 
    origin: 'Trại Ba Vì', 
    distinguishingMarks: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => { fetchCows(); }, []);

  const fetchCows = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setCows(response.data);
    } catch (error) { 
      console.error("Lỗi kết nối Backend"); 
    }
    setLoading(false);
  };

  const generateNextCowId = () => {
    if (cows.length === 0) return 'C-1001';
    const maxId = cows.reduce((max, cow) => {
      const parts = cow.id.split('-'); 
      const num = parts.length > 1 ? parseInt(parts[1]) : 1000;
      return (!isNaN(num) && num > max) ? num : max;
    }, 1000);
    return `C-${maxId + 1}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isEditing) {
        // Cập nhật backend
        await axios.put(`${API_URL}/${formData.id}`, formData);
        alert("✅ Đã cập nhật hồ sơ!");
      } else {
        // Thêm mới backend (Off-chain)
        const newId = generateNextCowId();
        await axios.post(API_URL, { ...formData, id: newId });
        alert(`✅ Khai sinh thành công mã bò: ${newId}`);
      }

      fetchCows();
      setFormData(initialFormState);
      setIsEditing(false);
    } catch (error) { 
      alert("Lỗi hệ thống! Hãy kiểm tra kết nối Server Backend.");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const filteredCows = cows.filter(cow => 
    cow.id.toLowerCase().includes(filters.keyword.toLowerCase()) ||
    cow.breed.toLowerCase().includes(filters.keyword.toLowerCase()) ||
    cow.origin.toLowerCase().includes(filters.keyword.toLowerCase())
  );

  return (
    <div className="cm-container fade-in">
      <h2 className="cm-title">
        <FaPaw /> Quản lý & Thêm mới đàn bò
      </h2>
      
      <div className="cm-layout">
        
        {/* ================= CỘT TRÁI: FORM KHAI BÁO ================= */}
        <div className="cm-col-form">
          <div className="cm-card">
            <div className="cm-card-header" style={{backgroundColor: isEditing ? '#f39c12' : '#3498db'}}>
              <h3>{isEditing ? "✏️ Chỉnh sửa hồ sơ" : "➕ Khai sinh Bò Mới"}</h3>
            </div>
            
            <div className="cm-card-body">
              <form onSubmit={handleSubmit}>
                <div className="cm-form-group">
                  <label>Mã bò (Tự động):</label>
                  <input 
                    value={isEditing ? formData.id : "Hệ thống tự cấp mã"} 
                    disabled 
                    className="cm-input" 
                  />
                </div>
                
                <div className="cm-form-group">
                  <label>Giống bò:</label>
                  <select 
                    name="breed" value={formData.breed} 
                    onChange={(e) => setFormData({...formData, breed: e.target.value})}
                    className="cm-select"
                  >
                    <option>Holstein Friesian</option>
                    <option>Jersey</option>
                    <option>Lai Sind</option>
                  </select>
                </div>
                
                <div className="cm-form-group">
                  <label>Ngày sinh:</label>
                  <input 
                    type="date" value={formData.dob} 
                    onChange={(e) => setFormData({...formData, dob: e.target.value})} 
                    required 
                    className="cm-input" 
                  />
                </div>
                
                <div className="cm-form-group">
                  <label>Nguồn gốc:</label>
                  <input 
                    value={formData.origin} 
                    onChange={(e) => setFormData({...formData, origin: e.target.value})} 
                    className="cm-input" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={`cm-btn-submit ${isEditing ? 'edit' : 'add'}`} 
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? "Đang xử lý..." 
                    : (isEditing ? "Lưu hồ sơ" : "Tạo mã QR & Lưu dữ liệu")}
                </button>

                {isEditing && (
                  <button 
                    type="button" 
                    onClick={() => { setIsEditing(false); setFormData(initialFormState); }}
                    style={{width: '100%', marginTop: '10px', padding: '10px', background: 'transparent', border: 'none', color: '#7f8c8d', cursor: 'pointer', fontWeight: 'bold'}}
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI: DANH SÁCH ================= */}
        <div className="cm-col-list">
          <div className="cm-card">
            
            <div className="cm-card-header" style={{backgroundColor: '#2c3e50'}}>
              <h3><FaListAlt /> Danh sách đàn bò ({filteredCows.length})</h3>
            </div>
            
            <div className="cm-card-body" style={{ padding: '20px 0' }}>
              
              <div style={{ padding: '0 20px' }}>
                <div className="cm-search-bar">
                  <FaSearch color="#95a5a6" />
                  <input 
                    type="text" 
                    placeholder="Nhập mã bò, giống, hoặc nguồn gốc để tìm..." 
                    value={filters.keyword}
                    onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                  />
                </div>
              </div>

              {loading ? (
                <p style={{textAlign: 'center', color: '#7f8c8d', padding: '20px'}}>Đang tải dữ liệu...</p>
              ) : (
                <div className="cm-table-wrapper" style={{ padding: '0 20px' }}>
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>Mã Bò</th>
                        <th>Giống</th>
                        <th>Nguồn gốc</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCows.length > 0 ? filteredCows.map(cow => (
                        <tr key={cow.id}>
                          <td><strong style={{color: '#2980b9'}}>{cow.id}</strong></td>
                          <td>{cow.breed}</td>
                          <td style={{color: '#7f8c8d', fontSize: '0.9em'}}>{cow.origin}</td>
                          <td>
                            <div className="cm-action-group">
                              <button className="cm-btn-icon qr" onClick={() => setShowQR(cow)} title="Xem mã QR">
                                <FaQrcode />
                              </button>
                              <button className="cm-btn-icon edit" onClick={() => {setFormData(cow); setIsEditing(true);}} title="Sửa hồ sơ">
                                <FaEdit />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#95a5a6'}}>Không tìm thấy kết quả nào.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL HIỂN THỊ MÃ QR ================= */}
      {showQR && (
        <div className="cm-modal-overlay" onClick={() => setShowQR(null)}>
          <div className="cm-modal-content" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3>Mã QR: <span style={{color: '#2980b9'}}>{showQR.id}</span></h3>
              <button className="cm-btn-close" onClick={() => setShowQR(null)}><FaTimes /></button>
            </div>
            <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '15px', border: '1px solid #ecf0f1' }}>
              <QRCodeCanvas value={showQR.id} size={220} level={"H"} style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
            <p style={{marginTop: '15px', fontSize: '0.9em', color: '#7f8c8d'}}>
              Dùng máy quét của Nông trại để đọc mã thẻ tai này.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CowManager;