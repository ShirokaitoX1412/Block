import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode'; 
import jsQR from 'jsqr'; // IMPORT SIÊU TRINH SÁT QUÉT ẢNH TĨNH
import { FaShieldAlt, FaBox, FaIndustry, FaTruck, FaCheckCircle, FaCamera, FaTimes, FaMapMarkerAlt, FaThermometerHalf, FaFlask, FaSearch, FaImage } from 'react-icons/fa';

import './ConsumerApp.css';

const ConsumerApp = () => {
  const [searchParams] = useSearchParams();
  const urlProductId = searchParams.get('id'); 

  const [showCamera, setShowCamera] = useState(false);
  const [productData, setProductData] = useState(null);
  const [farmData, setFarmData] = useState(null);
  const [manualCode, setManualCode] = useState('');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (urlProductId) {
      processProductLookup(urlProductId);
    }
  }, [urlProductId]);

  const processProductLookup = (productId) => {
    try {
      const existingProducts = JSON.parse(localStorage.getItem('factory_products')) || [];
      const foundProduct = existingProducts.find(p => p.productBatch === productId);

      if (foundProduct) {
        setProductData(foundProduct);
        setShowCamera(false);
        setManualCode(''); 
        
        const savedShipments = JSON.parse(localStorage.getItem('factory_received')) || [];
        const sourceFarm = savedShipments.find(s => s.masterId === foundProduct.rawMaterialSource);
        if (sourceFarm) {
          setFarmData(sourceFarm);
        }
      } else {
        alert(`Rất tiếc! Không tìm thấy thông tin lô hàng [ ${productId} ] trong hệ thống.`);
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm dữ liệu:", err);
    }
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) {
      alert("Vui lòng nhập mã lô sản phẩm (Ví dụ: PRD-12345)!");
      return;
    }
    processProductLookup(manualCode.trim());
  };

  // ==========================================================
  // XỬ LÝ QUÉT ẢNH BẰNG jsQR (CHẤP MỌI LOẠI ẢNH CHỤP MÀN HÌNH)
  // ==========================================================
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        // Tự động thu nhỏ ảnh nếu độ phân giải quá lớn (giúp quét nhanh và không bị crash)
        const MAX_WIDTH = 1000;
        let width = image.width;
        let height = image.height;

        if (width > MAX_WIDTH) {
          height = Math.floor((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        // Vẽ ảnh ra Canvas ẩn để trích xuất điểm ảnh
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        // Bắt đầu dùng jsQR dò tìm mã
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          // TÌM THẤY MÃ
          let scannedId = code.data;
          if (scannedId.includes('/scan?id=')) {
            const url = new URL(scannedId);
            scannedId = url.searchParams.get('id');
          }
          
          if (scannedId) {
            processProductLookup(scannedId);
            const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
            audio.play().catch(e => console.log("Audio block"));
          } else {
            alert("Mã QR không hợp lệ!");
          }
        } else {
          // KHÔNG THẤY MÃ
          alert("⚠️ Không tìm thấy mã QR! Nếu ảnh chụp màn hình quá nhiều chữ, hãy thử Cắt (Crop) lại ảnh cho sát với phần mã QR rồi thử lại.");
        }
      };
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Reset lại ô chọn file để có thể chọn đi chọn lại cùng 1 bức ảnh
    event.target.value = null; 
  };

  // Logic Camera Trực tiếp (Giữ nguyên)
  useEffect(() => {
    let scanner = null;
    if (showCamera) {
      scanner = new Html5QrcodeScanner(
        "consumer-qr-reader", 
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, showTorchButtonIfSupported: true },
        false 
      );
      scanner.render(
        (decodedText) => {
          try {
            let scannedId = decodedText;
            if (decodedText.includes('/scan?id=')) {
              const url = new URL(decodedText);
              scannedId = url.searchParams.get('id');
            }
            if (scannedId) {
              processProductLookup(scannedId); 
              const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
              audio.play().catch(e => console.log("Audio block"));
            } else {
              alert("Mã QR không hợp lệ!");
            }
          } catch (err) {
            console.error("Lỗi phân tích mã QR:", err);
          }
        },
        (errorMessage) => {}
      );
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Lỗi tắt camera:", error));
      }
    };
  }, [showCamera]); 

  return (
    <div className="csm-container fade-in">
      
      <style>{`
        #consumer-qr-reader { border: none !important; }
        #consumer-qr-reader img { display: none !important; }
        #consumer-qr-reader button {
          background-color: #2980b9; color: white; border: none;
          padding: 8px 15px; border-radius: 8px; font-weight: bold;
          cursor: pointer; margin: 5px; transition: 0.3s;
        }
        #consumer-qr-reader button:hover { background-color: #34495e; }
        #consumer-qr-reader select { padding: 8px; border-radius: 5px; margin-bottom: 10px; max-width: 100%; border: 1px solid #ccc; }
      `}</style>

      <div className="csm-header">
        <FaShieldAlt size={45} style={{ marginBottom: '10px' }} />
        <h2>MilkTrace Cổng Tra Cứu</h2>
        <p>Minh Lê Dairy • Xác thực bằng Blockchain</p>
      </div>

      <div className="csm-content-wrapper">
        
        {!productData ? (
          <div className="csm-scan-card fade-in">
            <img src="https://cdn-icons-png.flaticon.com/512/7450/7450927.png" alt="Scan QR" />
            <h3>Kiểm tra nguồn gốc</h3>
            <p>
              {isMobile 
                ? "Sử dụng camera để quét mã, tải ảnh QR có sẵn, hoặc nhập mã trực tiếp." 
                : "Tải lên hình ảnh chứa mã QR hoặc nhập trực tiếp mã lô sản phẩm để tra cứu."}
            </p>
            
            {/* 1. NÚT QUÉT CAMERA (CHỈ HIỆN TRÊN ĐIỆN THOẠI) */}
            {isMobile && !showCamera && (
              <button onClick={() => setShowCamera(true)} className="csm-btn-scan">
                <FaCamera size={20} /> QUÉT MÃ BẰNG CAMERA
              </button>
            )}

            {/* KHUNG HIỂN THỊ CAMERA CỦA ĐIỆN THOẠI */}
            {showCamera && (
              <div className="fade-in">
                <div className="csm-camera-box">
                  <div id="consumer-qr-reader" style={{ width: '100%' }}></div>
                </div>
                <button onClick={() => setShowCamera(false)} className="csm-btn-cancel">
                  <FaTimes /> Hủy quét
                </button>
              </div>
            )}

            {/* Input file ẩn cho việc tải ảnh */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />

            {/* 2. NÚT TẢI ẢNH LÊN (HIỆN TRÊN CẢ PC LẪN MOBILE) */}
            {!showCamera && (
              <button onClick={() => fileInputRef.current.click()} className="csm-btn-upload">
                <FaImage size={20} /> TẢI ẢNH MÃ QR LÊN
              </button>
            )}

            {!showCamera && (
              <div className="csm-divider">HOẶC NHẬP TAY</div>
            )}

            {/* 3. Ô NHẬP LIỆU BẰNG TAY */}
            {!showCamera && (
              <div className="csm-manual-group fade-in">
                <input 
                  type="text" 
                  className="csm-manual-input" 
                  placeholder="Nhập mã lô (VD: PRD-12345)..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={(e) => { if(e.key === 'Enter') handleManualSearch(); }}
                />
                <button className="csm-btn-search" onClick={handleManualSearch}>
                  <FaSearch /> Tìm
                </button>
              </div>
            )}

          </div>
        ) : (
          
          /* MÀN HÌNH KẾT QUẢ TRUY XUẤT (GIỮ NGUYÊN) */
          <div className="fade-in">
            <div className="csm-product-card">
              <div className="csm-product-header">
                <div>
                  <h3 className="csm-product-title">{productData.name}</h3>
                  <p className="csm-product-batch">Lô: {productData.productBatch}</p>
                </div>
                <FaCheckCircle color="#27ae60" size={35} />
              </div>
              <div className="csm-dates-container">
                <div className="csm-date-box">
                  <span className="csm-date-label">Ngày sản xuất</span>
                  <span className="csm-date-val">{new Date(productData.mfd).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="csm-date-box divider">
                  <span className="csm-date-label">Hạn sử dụng</span>
                  <span className="csm-date-val exp">{new Date(productData.exp).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>

            <h3 className="csm-timeline-heading">Hành Trình Chuỗi Cung Ứng</h3>

            <div className="csm-timeline">
              <div className="csm-timeline-line"></div>

              <div className="csm-timeline-item">
                <div className="csm-timeline-icon step-4-icon"><FaBox size={18} /></div>
                <div className="csm-timeline-content step-4-content">
                  <h4 className="csm-timeline-title step-4-title">4. Phân phối & Bán lẻ</h4>
                  <p className="csm-step-success"><FaCheckCircle /> Xác thực an toàn lúc: {new Date().toLocaleTimeString('vi-VN')}</p>
                </div>
              </div>

              <div className="csm-timeline-item">
                <div className="csm-timeline-icon step-3-icon"><FaIndustry size={18} /></div>
                <div className="csm-timeline-content step-3-content">
                  <h4 className="csm-timeline-title step-3-title">3. Sản xuất tại Nhà máy</h4>
                  <p className="csm-step-desc">Chế biến ly tâm, tiệt trùng UHT và đóng gói.</p>
                  <p className="csm-step-meta" style={{color: '#8e44ad'}}><strong>QC Checked:</strong> {productData.qualityTestedBy}</p>
                </div>
              </div>

              <div className="csm-timeline-item">
                <div className="csm-timeline-icon step-2-icon"><FaTruck size={18} /></div>
                <div className="csm-timeline-content step-2-content">
                  <h4 className="csm-timeline-title step-2-title">2. Vận chuyển Lạnh</h4>
                  <p className="csm-step-meta">Mã vận đơn: {productData.rawMaterialSource}</p>
                </div>
              </div>

              <div className="csm-timeline-item last">
                <div className="csm-timeline-icon step-1-icon"><FaMapMarkerAlt size={18} /></div>
                <div className="csm-timeline-content step-1-content">
                  <h4 className="csm-timeline-title step-1-title">1. Thu hoạch Sữa thô</h4>
                  {farmData ? (
                    <div className="csm-farm-box">
                      <p>🐄 <strong>Giống bò:</strong> {farmData.breeds}</p>
                      <p>🥛 <strong>Gộp từ:</strong> {farmData.totalBatches} cá thể bò</p>
                      <p><FaFlask color="#8e44ad"/> <strong>Độ pH:</strong> {farmData.averagePh}</p>
                    </div>
                  ) : (
                    <div className="csm-farm-box" style={{background: '#ecf0f1', fontStyle: 'italic', color: '#7f8c8d'}}>
                      Đang đồng bộ dữ liệu...
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <button onClick={() => setProductData(null)} className="csm-btn-reset">
              Tra Cứu Sản Phẩm Khác
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerApp;