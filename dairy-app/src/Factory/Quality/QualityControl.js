import React, { useState, useEffect } from 'react';
import axios from 'axios'; // BỔ SUNG AXIOS
import { FaVial, FaMicroscope, FaCheckCircle, FaTimesCircle, FaClipboardList } from 'react-icons/fa';

// Import cấu hình API
import { BASE_URL } from '../../config';
import './QualityControl.css';

const API_URL = `${BASE_URL}/factory_received`;

const QualityControl = () => {
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [qcData, setQcData] = useState({
    fatContent: '3.5', 
    antibiotics: 'Không', 
    bacteriaCount: '', 
    notes: ''
  });

  // ==============================================================
  // 1. LẤY DỮ LIỆU TỪ SERVER
  // ==============================================================
  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      // Sắp xếp chuyến mới nhất lên trên
      const sortedData = response.data.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
      setShipments(sortedData);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu từ server:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQcData({ ...qcData, [name]: value });
  };

  // ==============================================================
  // 2. GỬI KẾT QUẢ QC LÊN SERVER
  // ==============================================================
  const submitQCResult = async (status) => {
    if (!qcData.bacteriaCount) {
      alert("Vui lòng nhập chỉ số Tổng tạp khuẩn (Vi khuẩn)!");
      return;
    }

    if (status === 'Đạt chuẩn QC' && qcData.antibiotics === 'Có') {
      alert("⚠️ LỖI NGHIỆP VỤ: Sữa có tồn dư kháng sinh tuyệt đối không được đánh giá Đạt chuẩn!");
      return;
    }

    // Tạo object cập nhật
    const updatedShipmentData = {
      ...selectedShipment,
      status: status,
      qcDetails: {
        ...qcData,
        testedAt: new Date().toISOString(),
        tester: 'Phòng Lab Tự Động' 
      }
    };

    try {
      // Dùng lệnh PUT của axios để cập nhật đúng bản ghi (dựa vào id) trên db.json
      await axios.put(`${API_URL}/${selectedShipment.id}`, updatedShipmentData);
      
      alert(`✅ Đã lưu kết quả kiểm định: ${status.toUpperCase()} cho lô hàng ${selectedShipment.masterId}`);
      
      // Tải lại danh sách từ server
      fetchShipments();
      setSelectedShipment(null); 
      setQcData({ fatContent: '3.5', antibiotics: 'Không', bacteriaCount: '', notes: '' });

    } catch (error) {
      console.error("Lỗi cập nhật QC:", error);
      alert("Lỗi khi lưu kết quả! Hãy kiểm tra json-server.");
    }
  };

  const pendingQC = shipments.filter(s => s.status === 'Chờ kiểm định QC');
  // Tính luôn cả "Đã đóng gói" để lịch sử không bị mất khi chuyển qua khâu sau
  const completedQC = shipments.filter(s => s.status === 'Đạt chuẩn QC' || s.status === 'Hủy bỏ (Lỗi QC)' || s.status === 'Đã đóng gói');

  return (
    <div className="qc-container fade-in">
      <h2 className="qc-title">
        <FaMicroscope /> Phòng Lab Kiểm Định Chất Lượng
      </h2>

      <div className="qc-layout">
        
        {/* ================= CỘT TRÁI: DANH SÁCH ================= */}
        <div className="qc-col-list">
          
          <div className="qc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="qc-card-title orange">
                <FaVial /> Bồn chứa chờ kiểm định ({pendingQC.length})
              </h3>
              <button onClick={fetchShipments} style={{ padding: '5px 10px', fontSize: '0.8em', cursor: 'pointer', background: '#f39c12', color: 'white', border: 'none', borderRadius: '5px' }}>
                Làm mới
              </button>
            </div>
            
            {loading ? (
              <p className="qc-empty-text">Đang tải dữ liệu...</p>
            ) : pendingQC.length === 0 ? (
              <p className="qc-empty-text">Không có lô sữa thô nào đang chờ.</p>
            ) : (
              <div className="qc-list-container">
                {pendingQC.map((shipment) => (
                  <div 
                    key={shipment.id} 
                    onClick={() => setSelectedShipment(shipment)}
                    className={`qc-list-item ${selectedShipment?.id === shipment.id ? 'active' : ''}`}
                  >
                    <div className="qc-list-header">
                      <strong>{shipment.masterId.substring(0, 18)}...</strong>
                      <span className="qc-badge-pending">Chờ QC</span>
                    </div>
                    <div className="qc-list-meta">
                      🥛 Thể tích: <strong>{shipment.totalVolume}</strong> | 🐄 {shipment.breeds}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="qc-card">
            <h3 className="qc-card-title dark">
              <FaClipboardList /> Lịch sử kiểm định ({completedQC.length})
            </h3>
            <div className="qc-history-container">
              {loading ? (
                <p className="qc-empty-text">Đang tải dữ liệu...</p>
              ) : completedQC.length === 0 ? (
                <p className="qc-empty-text">Chưa có lịch sử.</p>
              ) : (
                completedQC.map((shipment) => (
                  <div key={shipment.id} className="qc-history-item">
                    <div className="qc-history-info">
                      <strong>{shipment.masterId.substring(0, 15)}...</strong>
                      <small>{new Date(shipment.qcDetails?.testedAt || shipment.receivedAt).toLocaleDateString('vi-VN')} - {new Date(shipment.qcDetails?.testedAt || shipment.receivedAt).toLocaleTimeString('vi-VN')}</small>
                    </div>
                    {shipment.status === 'Hủy bỏ (Lỗi QC)' ? (
                      <span className="qc-badge-error"><FaTimesCircle/> Hủy</span>
                    ) : (
                      <span className="qc-badge-success"><FaCheckCircle/> Đạt</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI: FORM NHẬP LAB ================= */}
        <div className="qc-col-form">
          {selectedShipment ? (
            <div className="qc-form-card fade-in">
              <h3 className="qc-form-title">Phiếu Kiểm Định Sinh Hóa</h3>
              
              <div className="qc-form-info">
                <div className="qc-form-info-row">
                  <strong>Đang kiểm tra bồn:</strong> 
                  <span className="val" style={{ wordBreak: 'break-all' }}>{selectedShipment.masterId}</span>
                </div>
                <div className="qc-form-info-row last">
                  <span>Gộp từ: {selectedShipment.totalBatches} lô</span>
                  <span>pH đầu vào: {selectedShipment.averagePh}</span>
                </div>
              </div>

              <div className="cow-form">
                <div className="qc-form-group-row">
                  <div className="qc-form-group">
                    <label>Tỷ lệ chất béo (%):</label>
                    <input 
                      type="number" name="fatContent" value={qcData.fatContent} 
                      onChange={handleInputChange} step="0.1" min="0" required 
                      className="qc-input" 
                    />
                    <small className="qc-input-hint">Chuẩn béo: 3.2% - 4.0%</small>
                  </div>
                  
                  <div className="qc-form-group">
                    <label>Tổng vi khuẩn (CFU/ml) <span style={{color:'red'}}>*</span>:</label>
                    <input 
                      type="number" name="bacteriaCount" value={qcData.bacteriaCount} 
                      onChange={handleInputChange} placeholder="VD: 50000" required 
                      className="qc-input" 
                    />
                    <small className="qc-input-hint">{'<'} 100,000 là an toàn</small>
                  </div>
                </div>

                <div className="qc-form-group">
                  <label>Phát hiện Dư lượng Kháng sinh?</label>
                  <select 
                    name="antibiotics" value={qcData.antibiotics} 
                    onChange={handleInputChange} 
                    className={`qc-input ${qcData.antibiotics === 'Có' ? 'qc-text-danger' : 'qc-text-success'}`}
                  >
                    <option value="Không">✅ Không phát hiện (An toàn)</option>
                    <option value="Có">⚠️ CÓ (Nguy hiểm - Phải hủy)</option>
                  </select>
                </div>

                <div className="qc-form-group" style={{ marginBottom: '20px' }}>
                  <label>Ghi chú thêm từ Lab:</label>
                  <input 
                    type="text" name="notes" value={qcData.notes} 
                    onChange={handleInputChange} placeholder="Nhập nhận xét về màu sắc, mùi vị..." 
                    className="qc-input" 
                  />
                </div>

                <div className="qc-btn-row">
                  <button onClick={() => submitQCResult('Đạt chuẩn QC')} className="qc-btn-approve">
                    <FaCheckCircle size={18} /> DUYỆT - TỚI KHÂU ĐÓNG GÓI
                  </button>
                  <button onClick={() => submitQCResult('Hủy bỏ (Lỗi QC)')} className="qc-btn-reject">
                    <FaTimesCircle /> HỦY LÔ
                  </button>
                </div>
                
                {qcData.antibiotics === 'Có' && (
                  <div className="qc-alert fade-in">
                    Sữa bị nhiễm kháng sinh!<br/>Hệ thống cấm Duyệt. Vui lòng bấm HỦY LÔ.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="qc-empty-state">
              <FaVial size={60} style={{ marginBottom: '20px', color: '#bdc3c7', opacity: 0.5 }} />
              <h3>Chưa chọn mẫu kiểm định</h3>
              <p>Vui lòng chọn một bồn sữa ở danh sách bên trái<br/>để nhập kết quả phân tích sinh hóa.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default QualityControl;