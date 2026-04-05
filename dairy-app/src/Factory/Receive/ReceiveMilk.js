import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; 
import { Html5QrcodeScanner } from 'html5-qrcode'; // Dùng thư viện mới
import { FaQrcode, FaTruck, FaCheckCircle, FaBoxOpen, FaThermometerHalf, FaFlask, FaCamera, FaHistory, FaTimes } from 'react-icons/fa';

import './ReceiveMilk.css';

// KẾT NỐI VỚI LINK API CỦA BẠN
import { BASE_URL } from '../../config'; 
const API_URL = `${BASE_URL}/factory_received`;

const ReceiveMilk = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [receivedShipments, setReceivedShipments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Ref này giúp camera lấy được dữ liệu danh sách mới nhất để kiểm tra trùng lặp
  const shipmentsRef = useRef(receivedShipments);
  useEffect(() => {
    shipmentsRef.current = receivedShipments;
  }, [receivedShipments]);

  // ==============================================================
  // 1. LẤY DỮ LIỆU TỪ SERVER KHI MỞ TRANG
  // ==============================================================
  useEffect(() => {
    fetchReceivedShipments();
  }, []);

  const fetchReceivedShipments = async () => {
    try {
      const response = await axios.get(API_URL);
      const sortedData = response.data.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
      setReceivedShipments(sortedData);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu từ server:", error);
    }
  };

  // ==============================================================
  // 2. LOGIC QUÉT CAMERA (THƯ VIỆN MỚI CHỐNG ĐEN MÀN HÌNH)
  // ==============================================================
  useEffect(() => {
    let scanner = null;

    if (showCamera) {
      scanner = new Html5QrcodeScanner(
        "receive-qr-reader", // ID thẻ div chứa camera
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true 
        },
        false 
      );

      scanner.render(
        (decodedText) => {
          try {
            const parsedData = JSON.parse(decodedText);
            
            if (parsedData.masterId && parsedData.totalVolume) {
              // Kiểm tra xe bồn đã nhập kho chưa
              const isAlreadyReceived = shipmentsRef.current.some(s => s.masterId === parsedData.masterId);
              if (isAlreadyReceived) {
                alert(`⚠️ Chuyến xe ${parsedData.masterId} này ĐÃ ĐƯỢC NHẬP KHO trước đó!`);
                setShowCamera(false);
                return;
              }

              // Xử lý thành công
              setScannedData(parsedData);
              setShowCamera(false); 
              
              const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
              audio.play().catch(e => console.log("Audio play blocked"));
            } else {
              alert("❌ Mã QR không hợp lệ! Vui lòng quét đúng mã Vận đơn của Nông trại.");
            }
          } catch (err) {
            console.error("Lỗi parse QR:", err);
          }
        },
        (errorMessage) => {
          // Bỏ qua lỗi nhảy liên tục khi chưa quét trúng mã
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Lỗi tắt camera:", error));
      }
    };
  }, [showCamera]);

  // ==============================================================
  // 3. ĐẨY DỮ LIỆU LÊN SERVER KHI BẤM XÁC NHẬN
  // ==============================================================
  const handleConfirmReceipt = async () => {
    if (!scannedData) return;
    setLoading(true);
    try {
      const newReceipt = {
        id: `REC-${Date.now()}`, 
        ...scannedData,
        receivedAt: new Date().toISOString(),
        status: 'Chờ kiểm định QC' 
      };

      await axios.post(API_URL, newReceipt);
      
      alert(`✅ Đã tiếp nhận thành công chuyến xe: ${scannedData.masterId}`);
      
      fetchReceivedShipments();
      setScannedData(null); 
    } catch (error) {
      alert("Lỗi khi xác nhận nhập kho! Hãy kiểm tra json-server.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rm-container fade-in">
      
      {/* CSS fix cho thư viện Camera mới */}
      <style>{`
        #receive-qr-reader { border: none !important; }
        #receive-qr-reader img { display: none !important; }
        #receive-qr-reader button {
          background-color: #2980b9; color: white; border: none;
          padding: 8px 15px; border-radius: 8px; font-weight: bold;
          cursor: pointer; margin: 5px; transition: 0.3s;
        }
        #receive-qr-reader button:hover { background-color: #34495e; }
        #receive-qr-reader select { padding: 8px; border-radius: 5px; margin-bottom: 10px; max-width: 100%; border: 1px solid #ccc; }
      `}</style>

      <h2 className="rm-title"><FaTruck /> Tiếp Nhận Sữa Thô</h2>

      <div className="rm-layout">
        <div className="rm-card-left">
          <div className="rm-card-header">
            <h3><FaQrcode /> Quét Mã Xe Bồn</h3>
            <button 
              onClick={() => { setShowCamera(!showCamera); setScannedData(null); }}
              className={`rm-btn-camera ${showCamera ? 'on' : 'off'}`}
            >
              {showCamera ? <><FaTimes /> Tắt Camera</> : <><FaCamera /> Bật Camera</>}
            </button>
          </div>

          {showCamera && (
            <div className="rm-camera-box fade-in" style={{ border: '3px solid #3498db', borderRadius: '12px', padding: '10px', background: '#f8f9fa', marginTop: '15px' }}>
              {/* Nơi thư viện sẽ render cái Camera */}
              <div id="receive-qr-reader" style={{ width: '100%' }}></div>
            </div>
          )}

          {scannedData ? (
            <div className="rm-scanned-container fade-in" style={{ marginTop: showCamera ? '20px' : '0' }}>
              <div className="rm-scanned-success"><FaCheckCircle size={40} /><h3>Mã hợp lệ!</h3></div>
              
              <div className="rm-info-box">
                <p className="rm-info-row"><span>Mã Chuyến Xe:</span><strong style={{ color: '#2980b9', wordBreak: 'break-all', textAlign: 'right' }}>{scannedData.masterId}</strong></p>
                <p className="rm-info-row"><span>Số lô gộp:</span><strong>{scannedData.totalBatches} lô</strong></p>
                <p className="rm-info-row"><span>Tổng Sản Lượng:</span><strong style={{ color: '#27ae60', fontSize: '1.1em' }}>{scannedData.totalVolume}</strong></p>
                <hr className="rm-divider"/>
                <p className="rm-info-row"><span><FaFlask color="#8e44ad"/> Độ pH:</span><strong>{scannedData.averagePh}</strong></p>
                <p className="rm-info-row"><span><FaThermometerHalf color="#c0392b"/> Nhiệt độ:</span><strong>{scannedData.averageTemp}</strong></p>
                <p className="rm-info-row" style={{ margin: 0 }}><span>Giống bò:</span><strong style={{ color: '#d35400' }}>{scannedData.breeds}</strong></p>
              </div>

              <button onClick={handleConfirmReceipt} disabled={loading} className="rm-btn-confirm">
                {loading ? 'ĐANG TẢI LÊN SERVER...' : '✅ NHẬP KHO'}
              </button>
              <button onClick={() => setScannedData(null)} className="rm-btn-cancel">Hủy / Quét lại</button>
            </div>
          ) : (!showCamera && (
              <div className="rm-empty-state"><FaBoxOpen size={50} style={{ marginBottom: '10px', opacity: 0.5 }} /><p style={{ margin: 0 }}>Vui lòng bật camera để quét<br/>Mã Master QR.</p></div>
          ))}
        </div>

        <div className="rm-card-right">
          <h3 className="rm-history-title"><FaHistory /> Xe bồn đã tiếp nhận hôm nay</h3>
          {receivedShipments.length === 0 ? (
            <p style={{ color: '#7f8c8d', fontStyle: 'italic', textAlign: 'center', marginTop: '30px' }}>Chưa có chuyến xe nào được nhập kho.</p>
          ) : (
            <div className="rm-table-wrapper">
              <table className="rm-table">
                <thead><tr><th>Thời gian</th><th>Mã Xe (Master ID)</th><th>Thể tích</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {receivedShipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <td style={{ color: '#7f8c8d' }}>{new Date(shipment.receivedAt).toLocaleTimeString('vi-VN')}</td>
                      <td style={{ fontWeight: 'bold', color: '#2980b9' }}>{shipment.masterId.substring(0, 15)}...<br/><small style={{ color: '#d35400', fontWeight: 'normal' }}>{shipment.breeds}</small></td>
                      <td style={{ fontWeight: 'bold', color: '#27ae60' }}>{shipment.totalVolume}</td>
                      <td><span className="rm-badge-warning">{shipment.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiveMilk;