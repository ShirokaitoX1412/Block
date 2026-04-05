import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { FaDatabase, FaHistory, FaQrcode, FaCheckCircle, FaFlask, FaThermometerHalf, FaCloudUploadAlt, FaSync, FaTruck, FaCheckSquare } from 'react-icons/fa';

// Import cấu hình API và CSS
import { BASE_URL } from '../../config'; 
import './MilkingLog.css'; 

const MilkingLog = () => {
  const [cows, setCows] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [farmers, setFarmers] = useState([]); 

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false); 
  const [showQR, setShowQR] = useState(null);
  
  const [activeTab, setActiveTab] = useState('nhap_lieu'); 

  const [filters, setFilters] = useState({ searchTerm: '', startDate: '', endDate: '' });
  const initialFormState = {
    batchId: '', cowId: '', feedId: '', farmerId: '', quantity: '', 
    ph: '6.6', temperature: '37', quality: 'Đạt chuẩn', syncStatus: 'Chưa đồng bộ'
  };
  const [formData, setFormData] = useState(initialFormState);

  const [selectedBatches, setSelectedBatches] = useState([]);
  const [masterQR, setMasterQR] = useState(null);

  const formatDisplayDateTime = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    return dateObj.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // CÁCH VIẾT MỚI: Bọc lỗi cho từng API. 1 cái lỗi thì các cái khác vẫn chạy!
        const [cowsRes, feedsRes, logsRes, farmersRes, healthRes] = await Promise.all([
          axios.get(`${BASE_URL}/cows`).catch(() => ({ data: [] })), 
          axios.get(`${BASE_URL}/feeds`).catch(() => ({ data: [] })),
          axios.get(`${BASE_URL}/milk-logs`).catch(() => ({ data: [] })), 
          axios.get(`${BASE_URL}/farmers`).catch(() => ({ data: [] })),
          axios.get(`${BASE_URL}/healthRecords`).catch(() => ({ data: [] })) // SỬA TÊN API CHUẨN Ở ĐÂY
        ]);
        
        const allCows = cowsRes.data;
        const allHealthRecords = healthRes.data;

        const enrichedCows = allCows.map(cow => {
          const cowRecords = allHealthRecords.filter(r => r.cowId === cow.id);
          if (cowRecords.length === 0) return { ...cow, isSick: false };
          cowRecords.sort((a, b) => (b.createdAt ? new Date(b.createdAt) : new Date(b.vaccineDate)) - (a.createdAt ? new Date(a.createdAt) : new Date(a.vaccineDate)));
          return { ...cow, isSick: cowRecords[0].tinhTrang === "Bệnh" };
        });

        setCows(enrichedCows); 
        setFeeds(feedsRes.data);
        setLogs(logsRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setFarmers(farmersRes.data);
      } catch (error) { 
        console.error("Lỗi tải dữ liệu:", error); 
      } 
      finally { setLoading(false); }
    };
    
    fetchData();

    // Khôi phục mã QR Vận đơn nếu có
    const savedMasterQR = localStorage.getItem('last_master_qr');
    if (savedMasterQR) {
      setMasterQR(JSON.parse(savedMasterQR));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (value === '') { setFormData({ ...formData, [name]: value }); return; }
    const numValue = parseFloat(value);
    if (name === 'quantity' && (numValue < 0 || numValue > 40)) return;
    if (name === 'ph' && (numValue < 0 || numValue > 14)) return;
    if (name === 'temperature' && (numValue < 0 || numValue > 50)) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cowId || !formData.feedId || !formData.quantity || !formData.farmerId) {
      alert("Vui lòng tham chiếu đầy đủ ID Nông dân, Bò và Thức ăn!"); return;
    }
    
    const uniqueId = `BATCH-${Date.now()}`;
    const newLog = { 
      id: uniqueId,       
      batchId: uniqueId,  
      ...formData, 
      date: new Date().toISOString(), 
      syncStatus: 'Chưa đồng bộ' 
    };
    
    try {
      const res = await axios.post(`${BASE_URL}/milk-logs`, newLog); 
      alert(`💾 Đã lưu tạm thời lô: ${newLog.batchId} (Chờ đồng bộ)`);
      
      // Load lại dữ liệu mới nhất ngay lập tức để đồng bộ State
      const refreshRes = await axios.get(`${BASE_URL}/milk-logs`);
      setLogs(refreshRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      
      setFormData(initialFormState);
    } catch (error) { 
      console.error(error);
      alert("Lỗi hệ thống! Kiểm tra kết nối đến Server Backend."); 
    }
  };

  const handleSyncToBlockchain = async () => {
    setSyncing(true);
    try {
      const freshDataRes = await axios.get(`${BASE_URL}/milk-logs`);
      const freshLogs = freshDataRes.data;

      const realPendingLogs = freshLogs.filter(log => log.syncStatus === 'Chưa đồng bộ' || !log.syncStatus);

      if (realPendingLogs.length === 0) { 
        alert("Không có lô sữa nào cần đồng bộ! (Hoặc dữ liệu đã bị xóa ở Server). Hãy F5 lại trang."); 
        setSyncing(false);
        return; 
      }

      if (!window.confirm(`Gửi ${realPendingLogs.length} lô sữa lên Blockchain?`)) {
        setSyncing(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      const fakeTxHash = "0x" + Math.random().toString(16).slice(2, 15);
      
      for (const log of realPendingLogs) {
        if (!log.id) continue;
        await axios.patch(`${BASE_URL}/milk-logs/${log.id}`, { 
          syncStatus: 'Đã đồng bộ', 
          txHash: fakeTxHash 
        });
      }

      const finalRes = await axios.get(`${BASE_URL}/milk-logs`);
      setLogs(finalRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      
      alert(`✅ Đã đồng bộ thành công ${realPendingLogs.length} lô sữa!`);
    } catch (error) { 
      console.error("Lỗi cập nhật DB:", error);
      alert(`⚠️ Lỗi kết nối: Dữ liệu đang hiển thị không khớp với Server. Vui lòng ấn F5 để tải lại trang!`); 
    } 
    finally { setSyncing(false); }
  };

  const handleToggleSelect = (batchId) => {
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(selectedBatches.filter(id => id !== batchId));
    } else {
      setSelectedBatches([...selectedBatches, batchId]);
    }
  };

  const handleCreateMasterBatch = async () => {
    if (selectedBatches.length === 0) {
      alert("Vui lòng chọn ít nhất 1 lô sữa để đưa lên xe bồn!"); return;
    }

    const selectedData = logs.filter(log => selectedBatches.includes(log.batchId));
    const breedsInvolved = selectedData.map(log => {
      const foundCow = cows.find(c => c.id === log.cowId);
      return foundCow ? foundCow.breed : 'Không xác định';
    });

    const uniqueBreeds = [...new Set(breedsInvolved)];

    if (uniqueBreeds.length > 1) {
      if (!window.confirm(`💡 LƯU Ý NGHIỆP VỤ:\n\nLô này đang trộn giống bò: [ ${uniqueBreeds.join(' / ')} ].\nBạn vẫn muốn gộp?`)) return; 
    }

    const totalVolume = selectedData.reduce((sum, log) => sum + parseFloat(log.quantity), 0);
    const avgPh = (selectedData.reduce((sum, log) => sum + parseFloat(log.ph), 0) / selectedData.length).toFixed(2);
    const avgTemp = (selectedData.reduce((sum, log) => sum + parseFloat(log.temperature), 0) / selectedData.length).toFixed(1);

    const masterBatchId = `SHIPMENT-${Date.now()}`;
    const newMasterQR = {
      masterId: masterBatchId,
      totalBatches: selectedData.length,
      totalVolume: `${totalVolume} Lít`,
      averagePh: avgPh,
      averageTemp: `${avgTemp}°C`,
      breeds: uniqueBreeds.join(', '),
      timestamp: new Date().toISOString()
    };

    try {
      for (const log of selectedData) {
        if(!log.id) continue;
        await axios.patch(`${BASE_URL}/milk-logs/${log.id}`, { syncStatus: 'Đã xuất kho' });
      }

      localStorage.setItem('last_master_qr', JSON.stringify(newMasterQR));
      setMasterQR(newMasterQR);

      alert(`✅ Đã tạo thành công Mã Vận Đơn: ${masterBatchId}`);
      
      const logsRes = await axios.get(`${BASE_URL}/milk-logs`);
      setLogs(logsRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      
      setSelectedBatches([]);

    } catch (error) {
      console.error("Lỗi cập nhật lô sữa:", error);
      alert(`⚠️ Lỗi khi gộp lô: ${error.message}`);
    }
  };

  const getQRData = (logItem) => JSON.stringify({
    farmer: farmers.find(f => f.id === logItem.farmerId)?.name || logItem.farmerId,
    cow: logItem.cowId, quantity: `${logItem.quantity}L`, ph: logItem.ph, temp: `${logItem.temperature}°C`, batch: logItem.batchId, verified: true
  });

  const filteredLogs = logs.filter(log => {
    const matchSearch = (log.batchId && log.batchId.toLowerCase().includes(filters.searchTerm.toLowerCase())) || (log.cowId && log.cowId.toLowerCase().includes(filters.searchTerm.toLowerCase()));
    const logDateObj = new Date(log.date); logDateObj.setHours(0, 0, 0, 0); 
    let matchDate = true;
    if (filters.startDate && logDateObj < new Date(filters.startDate).setHours(0,0,0,0)) matchDate = false;
    if (filters.endDate && logDateObj > new Date(filters.endDate).setHours(23,59,59,999)) matchDate = false;
    return matchSearch && matchDate;
  });

  const pendingCount = logs.filter(l => l.syncStatus === 'Chưa đồng bộ' || !l.syncStatus).length;
  const onChainLogs = logs.filter(log => log.syncStatus === 'Đã đồng bộ');

  return (
    <div className="ml-container fade-in">
      <div className="ml-tabs-container">
        <button 
          onClick={() => setActiveTab('nhap_lieu')}
          className={`ml-tab-btn ${activeTab === 'nhap_lieu' ? 'active-blue' : 'inactive'}`}
        >
          📝 Ghi nhận & Đồng bộ Lô sữa lẻ
        </button>
        <button 
          onClick={() => setActiveTab('xuat_kho')}
          className={`ml-tab-btn ${activeTab === 'xuat_kho' ? 'active-orange' : 'inactive'}`}
        >
          🚛 Gom lô Xuất Xe Bồn
        </button>
      </div>

      {activeTab === 'nhap_lieu' && (
        <div className="ml-layout fade-in">
          <div className="ml-col-left">
            <div className="ml-card">
              <div className="ml-card-header" style={{backgroundColor: '#34495e'}}>
                <h3><FaDatabase /> Nhập liệu Lô sữa</h3>
              </div>
              <div className="ml-card-body">
                <form onSubmit={handleSubmit}>
                  <div className="ml-form-group">
                    <label>Nông dân thực hiện:</label>
                    <select name="farmerId" value={formData.farmerId} onChange={handleInputChange} required className="ml-select">
                      <option value="">-- Chọn nông dân --</option>
                      {farmers.map(f => <option key={f.id} value={f.id}>{f.id} - {f.name}</option>)}
                    </select>
                  </div>
                  <div className="ml-form-group">
                    <label>Mã số Bò:</label>
                    <select name="cowId" value={formData.cowId} onChange={handleInputChange} required className="ml-select">
                      <option value="">-- Chọn bò vắt sữa --</option>
                      {cows.map(c => (
                        <option key={c.id} value={c.id} disabled={c.isSick} style={{ color: c.isSick ? 'red' : 'inherit' }}>
                          {c.id} ({c.breed}) {c.isSick ? " - ⚠️ Đang bệnh" : " - ✅ Khỏe mạnh"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ml-form-group">
                    <label>Thức ăn đã dùng:</label>
                    <select name="feedId" value={formData.feedId} onChange={handleInputChange} required className="ml-select">
                      <option value="">-- Chọn lô thức ăn --</option>
                      {feeds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="ml-form-group">
                    <label>Sản lượng (Lít):</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="0.0" step="0.1" required className="ml-input"/>
                  </div>
                  <div className="ml-date-row">
                    <div className="ml-date-col ml-form-group">
                      <label><FaFlask /> Độ pH:</label>
                      <input type="number" name="ph" value={formData.ph} onChange={handleInputChange} step="0.1" required className="ml-input"/>
                      {formData.ph && (parseFloat(formData.ph) < 6.5 || parseFloat(formData.ph) > 6.8) && (
                        <span className="ml-warning-text">⚠️ Lỗi: Sữa bất thường (Chuẩn: 6.5-6.8)</span>
                      )}
                    </div>
                    <div className="ml-date-col ml-form-group">
                      <label><FaThermometerHalf /> Nhiệt độ (°C):</label>
                      <input type="number" name="temperature" value={formData.temperature} onChange={handleInputChange} step="0.1" required className="ml-input"/>
                      {formData.temperature && (parseFloat(formData.temperature) < 36 || parseFloat(formData.temperature) > 39) && (
                        <span className="ml-warning-text">⚠️ Lỗi: Nhiệt độ bất thường (Chuẩn: 37-38.5)</span>
                      )}
                    </div>
                  </div>
                  <button type="submit" className="ml-btn-submit">💾 Lưu tạm thời</button>
                </form>
              </div>
            </div>
          </div>

          <div className="ml-col-right">
            <div className="ml-card" style={{padding: '15px'}}>
              <div className="ml-search-bar">
                <input type="text" className="ml-search-input" placeholder="🔍 Tìm Mã Lô, Mã Bò..." value={filters.searchTerm} onChange={e => setFilters({...filters, searchTerm: e.target.value})} />
                <input type="date" className="ml-search-input" style={{flex: '1 1 120px'}} onChange={e => setFilters({...filters, startDate: e.target.value})}/>
                <input type="date" className="ml-search-input" style={{flex: '1 1 120px'}} onChange={e => setFilters({...filters, endDate: e.target.value})}/>
              </div>
            </div>

            <div className="ml-card">
              <div className="ml-card-header" style={{backgroundColor: '#2c3e50'}}>
                <h3><FaHistory /> Nhật ký vắt sữa ({filteredLogs.length})</h3>
                <button onClick={handleSyncToBlockchain} disabled={pendingCount === 0 || syncing} className="ml-btn-sync">
                  {syncing ? <FaSync className="fa-spin" /> : <FaCloudUploadAlt />}
                  {syncing ? "Đang đẩy mạng..." : `Đồng bộ Blockchain (${pendingCount})`}
                </button>
              </div>
              <div className="ml-card-body" style={{padding: 0}}>
                {loading ? <p style={{padding: '20px', textAlign: 'center'}}>Đang tải dữ liệu...</p> : (
                  <div className="ml-table-wrapper">
                    <table className="ml-table">
                      <thead><tr><th>Lô Sữa</th><th>Chỉ số</th><th>Trạng thái</th><th>QR Truy xuất</th></tr></thead>
                      <tbody>
                        {filteredLogs.map((log, idx) => (
                          <tr key={log.id || idx}>
                            <td>
                              <strong>{log.batchId}</strong><br/>
                              <small style={{ color: '#e67e22', fontWeight: 'bold' }}>Bò: {log.cowId}</small><br/>
                              <small style={{color: '#7f8c8d'}}>{formatDisplayDateTime(log.date)}</small>
                            </td>
                            <td>
                              <span className="ml-badge-ph">pH: {log.ph}</span><br/>
                              <span className="ml-badge-temp">Temp: {log.temperature}°C</span><br/>
                              <small>SL: {log.quantity}L</small>
                            </td>
                            <td>
                              {log.syncStatus === 'Đã đồng bộ' ? <span style={{color: '#27ae60', fontWeight: 'bold'}}><FaCheckCircle /> Đã đồng bộ</span> 
                              : log.syncStatus === 'Đã xuất kho' ? <span style={{color: '#8e44ad', fontWeight: 'bold'}}><FaTruck /> Đã lên xe bồn</span> 
                              : <span style={{color: '#e67e22', fontWeight: 'bold'}}>⏳ Chờ đồng bộ</span>}
                            </td>
                            <td>
                              {log.syncStatus === 'Đã đồng bộ' || log.syncStatus === 'Đã xuất kho' ? <button className="ml-btn-qr" onClick={() => setShowQR(log)}><FaQrcode /></button> : <span style={{fontSize: '0.8em', color: '#7f8c8d'}}>Chưa có mã</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'xuat_kho' && (
        <div className="ml-xuatkho-layout fade-in">
          <div className="ml-xuatkho-left">
            <h4 style={{marginTop: 0, color: '#2c3e50'}}>Chọn các lô sữa ĐÃ ĐỒNG BỘ để gộp lên xe bồn:</h4>
            
            {onChainLogs.length === 0 ? (
              <p className="ml-alert-box">
                ⚠️ Hiện không có lô sữa nào sẵn sàng. Vui lòng ghi nhận và đồng bộ thêm sữa!
              </p>
            ) : (
              <div className="ml-table-wrapper">
                <table className="ml-table" style={{ marginTop: '15px' }}>
                  <thead style={{ background: '#34495e', color: 'white' }}>
                    <tr>
                      <th><FaCheckSquare /></th>
                      <th>Mã Lô Sữa</th>
                      <th>Giống Bò</th>
                      <th>Sản lượng</th>
                      <th>Chỉ số (pH/Temp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onChainLogs.map(log => {
                      const cow = cows.find(c => c.id === log.cowId);
                      const breed = cow ? cow.breed : 'N/A';
                      return (
                        <tr key={log.batchId}>
                          <td><input type="checkbox" checked={selectedBatches.includes(log.batchId)} onChange={() => handleToggleSelect(log.batchId)} style={{ width: '18px', height: '18px' }}/></td>
                          <td><strong>{log.batchId}</strong></td>
                          <td style={{ color: breed === 'Jersey' ? '#d35400' : '#2980b9', fontWeight: 'bold' }}>{breed}</td>
                          <td style={{ color: '#27ae60', fontWeight: 'bold' }}>{log.quantity} Lít</td>
                          <td>pH: {log.ph} | {log.temperature}°C</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <button onClick={handleCreateMasterBatch} disabled={onChainLogs.length === 0} className="ml-btn-gomlo">
              <FaTruck /> GỘP LÔ & TẠO MÃ XE BỒN
            </button>
          </div>

          <div className="ml-xuatkho-right">
            {masterQR ? (
              <div className="ml-master-qr-card fade-in">
                <h3 className="ml-master-qr-title">MÃ VẬN ĐƠN NHÀ MÁY</h3>
                <p style={{ fontSize: '0.9em', color: '#7f8c8d', margin: 0 }}>Đưa mã này cho tài xế xe bồn</p>
                
                <div className="ml-master-qr-canvas">
                  <QRCodeCanvas value={JSON.stringify(masterQR)} size={200} level={"H"} />
                </div>

                <div className="ml-master-qr-info">
                  <p><strong>🚛 Mã xe:</strong> <span style={{color:'#e67e22', fontWeight:'bold'}}>{masterQR.masterId}</span></p>
                  <p><strong>📦 Đã gộp:</strong> {masterQR.totalBatches} lô sữa lẻ</p>
                  <p><strong>💧 Sản lượng:</strong> <span style={{color: '#27ae60', fontWeight: 'bold'}}>{masterQR.totalVolume}</span></p>
                  <p><strong>🧪 TB pH:</strong> {masterQR.averagePh}</p>
                  <p><strong>🌡️ Nhiệt độ:</strong> {masterQR.averageTemp}</p>
                  <p><strong>🐄 Giống bò:</strong> <span style={{color: '#c0392b'}}>{masterQR.breeds}</span></p>
                </div>
              </div>
            ) : (
              <div className="ml-empty-qr-state">
                <FaQrcode size={60} style={{ marginBottom: '15px', opacity: 0.3 }} />
                <p style={{ margin: 0 }}>Tick chọn các lô sữa bên trái và bấm Gộp lô để tạo mã QR Vận đơn xuất kho.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showQR && (
        <div className="cm-modal-overlay" onClick={() => setShowQR(null)}>
          <div className="cm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3>Mã Truy Xuất <span style={{color: '#27ae60'}}>On-Chain</span></h3>
            </div>
            <div style={{ margin: '15px 0' }}>
              <QRCodeCanvas value={getQRData(showQR)} size={200} level={"H"} includeMargin={true} />
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.9em' }}>
              <p style={{margin: '0 0 5px 0'}}><FaCheckCircle color="#27ae60" /> <strong>Blockchain Verified</strong></p>
              <p style={{margin: '0 0 5px 0'}}>Lô: {showQR.batchId}</p>
              <p style={{margin: 0, color: '#7f8c8d'}}>Tx: {showQR.txHash?.slice(0, 15)}...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilkingLog;