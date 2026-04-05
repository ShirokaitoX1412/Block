import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStethoscope, FaHistory, FaSearch, FaFileMedical } from 'react-icons/fa';

// Import CSS đã bóc tách
import './HealthRecord.css'; 

import { BASE_URL } from '../../config'; 

// Tự động nối chuỗi bằng dấu backtick (`)
const API_URL = `${BASE_URL}`;

const formatDisplayDateTime = (dateString) => {
  if (!dateString) return '';
  const dateObj = new Date(dateString);
  return dateObj.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const HealthRecords = () => {
  const [cows, setCows] = useState([]); 
  const [records, setRecords] = useState([]); 
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    searchTerm: '',
    startDate: '',
    endDate: ''
  });

  const [formData, setFormData] = useState({
    cowId: '',
    tinhTrang: 'Khỏe mạnh', 
    chiTietBenh: 'Sức khỏe tốt', 
    weight: '', 
    doctor: '',
    notes: ''
  });

  useEffect(() => {
    fetchCows();
    fetchAllRecords();
  }, []);

  const fetchCows = async () => {
    try {
      const res = await axios.get(`${API_URL}/cows`);
      setCows(res.data);
    } catch (e) { console.error("Lỗi tải danh sách bò"); }
  };

  const fetchAllRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/health-records`);
      const sortedData = res.data.sort((a, b) => new Date(b.vaccineDate) - new Date(a.vaccineDate));
      setRecords(sortedData);
    } catch (e) { console.error("Lỗi tải hồ sơ sức khỏe"); }
    setLoading(false);
  };

  const handleStatusChange = (e) => {
    const status = e.target.value;
    setFormData({
      ...formData,
      tinhTrang: status,
      chiTietBenh: status === 'Khỏe mạnh' ? 'Sức khỏe tốt' : '' 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const blockchainHash = "0x" + Math.random().toString(16).slice(2, 15);
      const currentTime = new Date().toISOString(); 

      const newRecord = { ...formData, vaccineDate: currentTime, blockchainHash };
      
      await axios.post(`${API_URL}/health-records`, newRecord);
      alert("✅ Đã ghi nhận hồ sơ y tế!");
      fetchAllRecords();
      
      setFormData({ 
        cowId: '',
        weight: '', 
        tinhTrang: 'Khỏe mạnh', 
        chiTietBenh: 'Sức khỏe tốt', 
        doctor: '',
        notes: '' 
      });
    } catch (e) { alert("Lỗi hệ thống khi lưu hồ sơ!"); }
  };

  const filteredRecords = records.filter(record => {
    const searchLower = filters.searchTerm.toLowerCase();
    const matchSearch = 
      (record.cowId && record.cowId.toLowerCase().includes(searchLower)) ||
      (record.tinhTrang && record.tinhTrang.toLowerCase().includes(searchLower)) ||
      (record.chiTietBenh && record.chiTietBenh.toLowerCase().includes(searchLower)) ||
      (record.doctor && record.doctor.toLowerCase().includes(searchLower));

    const recordDate = new Date(record.vaccineDate);
    recordDate.setHours(0, 0, 0, 0);

    let matchDate = true;
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      if (recordDate < start) matchDate = false;
    }
    
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      if (recordDate > end) matchDate = false;
    }
    
    return matchSearch && matchDate;
  });

  return (
    <div className="hr-container fade-in">
      <h2 className="hr-title">
        <FaStethoscope /> Quản lý Sức khỏe & Cân nặng
      </h2>
      
      <div className="hr-layout">
        
        {/* ================= CỘT TRÁI: FORM KHAI BÁO ================= */}
        <div className="hr-col-form">
          <div className="hr-card">
            <div className="hr-card-header" style={{backgroundColor: '#27ae60'}}>
              <h3><FaFileMedical /> Khai báo Y tế</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="hr-card-body">
              <div className="hr-form-group">
                <label>Chọn Bò tham chiếu:</label>
                <select 
                  value={formData.cowId} 
                  onChange={e => setFormData({...formData, cowId: e.target.value})}
                  required
                  className="hr-select"
                >
                  <option value="">-- Chọn mã số bò --</option>
                  {cows.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                </select>
              </div>

              <div className="hr-form-group">
                <label>Cân nặng (kg):</label>
                <input 
                  type="number" 
                  value={formData.weight} 
                  onChange={e => setFormData({...formData, weight: e.target.value})}
                  placeholder="Nhập cân nặng..."
                  required
                  className="hr-input"
                />
              </div>

              <div className="hr-form-group">
                <label>Tình trạng hiện tại:</label>
                <select 
                  value={formData.tinhTrang} 
                  onChange={handleStatusChange}
                  className="hr-select"
                  style={{ fontWeight: 'bold', color: formData.tinhTrang === 'Bệnh' ? '#e74c3c' : '#27ae60' }}
                  required
                >
                  <option value="Khỏe mạnh">✅ Khỏe mạnh</option>
                  <option value="Bệnh">⚠️ Bệnh / Đang điều trị</option>
                </select>
              </div>

              {formData.tinhTrang === 'Bệnh' && (
                <div className="hr-form-group fade-in">
                  <label>Chi tiết tình trạng bệnh <span style={{color:'red'}}>*</span>:</label>
                  <input 
                    type="text" 
                    value={formData.chiTietBenh} 
                    onChange={e => setFormData({...formData, chiTietBenh: e.target.value})}
                    placeholder="VD: Viêm móng, chán ăn..."
                    required
                    className="hr-input"
                  />
                </div>
              )}

              {formData.tinhTrang === 'Khỏe mạnh' && (
                <div className="hr-form-group fade-in">
                  <p className="hr-info-box">
                    Súc vật phát triển bình thường, sức khỏe tốt. Thời gian sẽ tự động ghi nhận khi lưu.
                  </p>
                </div>
              )}

              <div className="hr-form-group">
                <label>Bác sĩ phụ trách:</label>
                <input 
                  type="text" 
                  value={formData.doctor} 
                  onChange={e => setFormData({...formData, doctor: e.target.value})}
                  placeholder="Tên bác sĩ khám..."
                  className="hr-input"
                />
              </div>

              <button type="submit" className="hr-btn-submit">
                Lưu vào Sổ y tế
              </button>
            </form>
          </div>
        </div>

        {/* ================= CỘT PHẢI: LỌC & DANH SÁCH ================= */}
        <div className="hr-col-list">
          
          <div className="hr-card" style={{padding: '20px'}}>
            <div className="hr-filter-container">
              <div className="hr-filter-item">
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8f9fa', borderRadius: '8px', padding: '0 15px', border: '1px solid #bdc3c7' }}>
                  <FaSearch color="#95a5a6" />
                  <input 
                    type="text" 
                    placeholder="Tìm Mã Bò, Bác sĩ, Bệnh..."
                    value={filters.searchTerm}
                    onChange={e => setFilters({...filters, searchTerm: e.target.value})}
                    className="hr-input"
                    style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
                  />
                </div>
              </div>

              <div className="hr-filter-item" style={{ flex: '1 1 120px' }}>
                <input 
                  type="date" 
                  title="Từ ngày"
                  onChange={e => setFilters({...filters, startDate: e.target.value})}
                  className="hr-input"
                />
              </div>

              <div className="hr-filter-item" style={{ flex: '1 1 120px' }}>
                <input 
                  type="date" 
                  title="Đến ngày"
                  onChange={e => setFilters({...filters, endDate: e.target.value})}
                  className="hr-input"
                />
              </div>
            </div>
          </div>

          <div className="hr-card">
            <div className="hr-card-header" style={{backgroundColor: '#2c3e50'}}>
              <h3><FaHistory /> Nhật ký điều trị & Cân nặng ({filteredRecords.length})</h3>
            </div>
            
            <div className="hr-card-body" style={{padding: 0}}>
              <div className="hr-table-wrapper">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Mã Bò</th>
                      <th>Cân nặng</th>
                      <th>Tình trạng Y tế</th>
                      <th>Thời gian ghi nhận</th>
                      <th>Blockchain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? filteredRecords.map((r, i) => (
                      <tr key={i}>
                        <td><strong style={{color: '#2980b9'}}>{r.cowId}</strong></td>
                        <td><span className="hr-badge-weight">{r.weight} kg</span></td>
                        <td>
                          <strong className={r.tinhTrang === 'Bệnh' ? 'hr-status-sick' : 'hr-status-healthy'}>
                            {r.tinhTrang}
                          </strong>
                          <br/>
                          <span style={{ fontSize: '0.85em', color: '#7f8c8d' }}>{r.chiTietBenh}</span>
                          <br/>
                          <small style={{ color: '#95a5a6' }}>BS: {r.doctor}</small>
                        </td>
                        <td>
                          {formatDisplayDateTime(r.vaccineDate)}
                        </td>
                        <td><code className="hr-hash-code">{r.blockchainHash?.slice(0, 8)}...</code></td>
                      </tr>
                    )) : <tr><td colSpan="5" align="center" style={{padding: '20px', color: '#95a5a6'}}>Không tìm thấy dữ liệu phù hợp</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HealthRecords;