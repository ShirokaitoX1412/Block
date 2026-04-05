import React, { useState, useEffect } from 'react';
import axios from 'axios'; // BỔ SUNG AXIOS
import { QRCodeCanvas } from 'qrcode.react';
import { FaIndustry, FaBox, FaBarcode, FaClipboardCheck, FaCalendarAlt } from 'react-icons/fa';

// Import cấu hình API
import { BASE_URL } from '../../config';
import './Production.css';

// KHAI BÁO 2 ĐƯỜNG DẪN API (Lấy nguồn sữa và Lưu sản phẩm mới)
const RECEIVED_API_URL = `${BASE_URL}/factory_received`;
const PRODUCTS_API_URL = `${BASE_URL}/factory_products`;

const Production = () => {
  const [approvedShipments, setApprovedShipments] = useState([]);
  const [selectedRawBatch, setSelectedRawBatch] = useState('');
  
  const [productData, setProductData] = useState({
    productName: 'Sữa tươi tiệt trùng 180ml (Có đường)',
    quantityProduced: '',
    mfdDate: new Date().toISOString().split('T')[0],
    expDate: '',
  });

  const [finalProductQR, setFinalProductQR] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApprovedShipments();
    const today = new Date();
    today.setMonth(today.getMonth() + 6);
    setProductData(prev => ({ ...prev, expDate: today.toISOString().split('T')[0] }));
  }, []);

  // LẤY DANH SÁCH BỒN SỮA TỪ SERVER (Thay vì LocalStorage)
  const loadApprovedShipments = async () => {
    try {
      const response = await axios.get(RECEIVED_API_URL);
      const readyForProduction = response.data.filter(s => s.status === 'Đạt chuẩn QC');
      setApprovedShipments(readyForProduction);
    } catch (error) {
      console.error("Lỗi tải bồn sữa đã duyệt:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData({ ...productData, [name]: value });
  };

  // ĐÓNG GÓI & LƯU LÊN SERVER
  const handleProduce = async (e) => {
    e.preventDefault();
    if (!selectedRawBatch) {
      alert("Vui lòng chọn một bồn nguyên liệu đã đạt chuẩn QC!");
      return;
    }

    setLoading(true);
    try {
      const rawMaterial = approvedShipments.find(s => s.masterId === selectedRawBatch);
      const productBatchId = `PRD-${Date.now()}`;

      const finalQRData = {
        id: productBatchId, // Thêm id cho json-server
        productBatch: productBatchId,
        name: productData.productName,
        mfd: productData.mfdDate,
        exp: productData.expDate,
        boxes: productData.quantityProduced,
        rawMaterialSource: rawMaterial.masterId, 
        qualityTestedBy: rawMaterial.qcDetails?.tester,
        verified: true
      };

      // 1. Lưu sản phẩm mới vào bảng factory_products
      await axios.post(PRODUCTS_API_URL, finalQRData);

      // 2. Cập nhật trạng thái của bồn sữa thô thành "Đã đóng gói" (hoặc "Đã sản xuất")
      const updatedRawMaterial = { ...rawMaterial, status: 'Đã đóng gói' };
      await axios.put(`${RECEIVED_API_URL}/${rawMaterial.id}`, updatedRawMaterial);

      // Cập nhật UI
      setFinalProductQR(finalQRData);
      // Link URL sẽ tự động trỏ về trang web hiện tại của khách hàng
      const link = `${window.location.origin}/scan?id=${productBatchId}`;
      setQrUrl(link);

      alert(`✅ Đã đóng gói thành công lô hàng: ${productBatchId}`);
      
      // Tải lại danh sách bồn sữa để xóa bồn vừa dùng ra khỏi thẻ Select
      loadApprovedShipments(); 
      setSelectedRawBatch('');
      setProductData({ ...productData, quantityProduced: '' }); 

    } catch (error) {
      console.error("Lỗi đóng gói:", error);
      alert("Lỗi khi kết nối với máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pd-container fade-in">
      
      <h2 className="pd-title">
        <FaIndustry /> Phân Xưởng Đóng Gói Thành Phẩm
      </h2>

      <div className="pd-layout">
        
        {/* ================= CỘT TRÁI: FORM LỆNH SẢN XUẤT ================= */}
        <div className="pd-col-form">
          <h3 className="pd-card-title">
            <FaClipboardCheck /> Lệnh Sản Xuất
          </h3>
          
          <form onSubmit={handleProduce} className="cow-form">
            <div className="pd-form-group-highlight">
              <label className="pd-label-highlight">1. Nguồn Sữa Thô (Đã duyệt QC):</label>
              <select 
                value={selectedRawBatch} 
                onChange={(e) => setSelectedRawBatch(e.target.value)} 
                required 
                className="pd-select-highlight"
              >
                <option value="">-- Chọn bồn nguyên liệu --</option>
                {approvedShipments.map(shipment => (
                  <option key={shipment.id} value={shipment.masterId}>
                    {shipment.masterId} (Thể tích: {shipment.totalVolume})
                  </option>
                ))}
              </select>
            </div>

            <div className="pd-form-group">
              <label className="pd-label">2. Loại Sản Phẩm Đầu Ra:</label>
              <select 
                name="productName" 
                value={productData.productName} 
                onChange={handleInputChange} 
                required 
                className="pd-select"
              >
                <option value="Sữa tươi tiệt trùng 180ml (Có đường)">Sữa tươi tiệt trùng 180ml (Có đường)</option>
                <option value="Sữa chua uống lên men 150ml">Sữa chua uống lên men 150ml</option>
              </select>
            </div>

            <div className="pd-form-group">
              <label className="pd-label">3. Số lượng xuất xưởng (Hộp):</label>
              <input 
                type="number" 
                name="quantityProduced" 
                value={productData.quantityProduced} 
                onChange={handleInputChange} 
                min="1" 
                required 
                className="pd-input" 
              />
            </div>

            <div className="pd-form-row">
              <div className="pd-form-col">
                <label className="pd-label"><FaCalendarAlt /> NSX:</label>
                <input 
                  type="date" 
                  name="mfdDate" 
                  value={productData.mfdDate} 
                  onChange={handleInputChange} 
                  required 
                  className="pd-input" 
                />
              </div>
              <div className="pd-form-col">
                <label className="pd-label"><FaCalendarAlt /> HSD:</label>
                <input 
                  type="date" 
                  name="expDate" 
                  value={productData.expDate} 
                  onChange={handleInputChange} 
                  required 
                  className="pd-input" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={approvedShipments.length === 0 || loading} 
              className="pd-btn-submit"
            >
              {loading ? "ĐANG XỬ LÝ..." : <><FaBox /> ĐÓNG GÓI & TẠO QR</>}
            </button>
          </form>
        </div>

        {/* ================= CỘT PHẢI: KẾT QUẢ QR ================= */}
        <div className="pd-col-qr">
          {finalProductQR ? (
            <div className="pd-qr-result-box fade-in">
              <h2 className="pd-qr-title">
                <FaBarcode /> TEM TRUY XUẤT
              </h2>
              <p className="pd-qr-subtitle">Mã QR này chứa Link Web. Hãy dùng Zalo để quét!</p>
              
              <div className="pd-qr-canvas-wrapper">
                <QRCodeCanvas value={qrUrl} size={180} level={"H"} style={{ maxWidth: '100%', height: 'auto' }} />
              </div>

              <div className="pd-qr-info-box">
                <p className="pd-qr-info-link">🔗 <strong>Link:</strong> <span style={{ fontSize: '0.9em' }}>{qrUrl}</span></p>
                <p><strong>🏷️ Lô Sản Phẩm:</strong> <span style={{color: '#2980b9', fontWeight: 'bold'}}>{finalProductQR.productBatch}</span></p>
                <p><strong>🥛 Tên SP:</strong> {finalProductQR.name}</p>
              </div>
            </div>
          ) : (
            <div className="pd-empty-state">
              <FaBarcode size={70} style={{ margin: '0 auto 15px auto', opacity: 0.5 }} />
              <h3>Chưa có dữ liệu đóng gói</h3>
              <p>Vui lòng thực hiện Lệnh sản xuất<br/>để xuất mã QR thành phẩm.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Production;