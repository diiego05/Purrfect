import React, { useState, useEffect, useCallback, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '../../context/AuthContext';
import {
  getMyCertificates,
  buildPublicVerifyUrl,
  type Certificate,
} from '../../services/certificateApi';
import { toast } from '../../context/ToastContext';
import './MyCertificatesPage.css';

// ─── Icons nội tuyến ──────────────────────────────────────────────────────────
const IconCertificate = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 12l2 2 4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconDownload = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="7 10 12 15 17 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="12"
      y1="15"
      x2="12"
      y2="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCopy = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="9"
      y="9"
      width="13"
      height="13"
      rx="2"
      ry="2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconClose = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line
      x1="18"
      y1="6"
      x2="6"
      y2="18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="6"
      y1="6"
      x2="18"
      y2="18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconBooks = () => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback phía dưới
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
};

// ─── Component Preview Modal ──────────────────────────────────────────────────
interface CertificatePreviewProps {
  cert: Certificate;
  downloading: boolean;
  onDownload: (cert: Certificate) => void;
  onCopyLink: (cert: Certificate) => void;
  onClose: () => void;
  onOpenVerifyPage: (cert: Certificate) => void;
}

const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  cert,
  downloading,
  onDownload,
  onCopyLink,
  onClose,
  onOpenVerifyPage,
}) => {
  return (
    <div
      className="cert-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Xem trước chứng chỉ"
    >
      <div className="cert-modal-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="cert-modal-close"
          onClick={onClose}
          aria-label="Đóng"
        >
          <IconClose />
        </button>

        {/* Bản xem trước chứng chỉ */}
        <div className="cert-preview-card">
          <div className="cert-preview-inner">
            <div className="cert-preview-header">
              <span className="cert-preview-logo">🎓 PURRFECT</span>
              <span className="cert-preview-platform">
                Nền tảng học trực tuyến
              </span>
            </div>

            <div className="cert-preview-body">
              <h2 className="cert-preview-title">Chứng chỉ hoàn thành</h2>
              <p className="cert-preview-presents">Trân trọng chứng nhận</p>
              <p className="cert-preview-student">{cert.studentName}</p>
              <p className="cert-preview-desc">
                đã hoàn thành 100% nội dung khóa học
              </p>
              <p className="cert-preview-course">{cert.courseTitle}</p>
            </div>

            <div className="cert-preview-footer">
              <div className="cert-preview-meta">
                <div className="cert-preview-meta-col">
                  <span className="cert-meta-label">Giảng viên</span>
                  <span className="cert-meta-value">
                    {cert.instructorName || 'Giảng viên Purrfect'}
                  </span>
                  <span
                    className="cert-meta-label"
                    style={{ marginTop: '6px' }}
                  >
                    Ngày cấp
                  </span>
                  <span className="cert-meta-value">
                    {formatDate(cert.issueDate)}
                  </span>
                </div>

                <div className="cert-preview-seal">
                  <span>PURRFECT</span>
                  <span>✓ XÁC NHẬN</span>
                </div>

                <div className="cert-preview-meta-col">
                  <span className="cert-meta-label">Mã chứng chỉ</span>
                  <span className="cert-meta-value code">
                    {cert.certificateCode}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="cert-modal-actions">
          <button
            type="button"
            className="cert-btn cert-btn--primary"
            disabled={downloading}
            onClick={() => onDownload(cert)}
          >
            <IconDownload />
            {downloading ? 'Đang tạo PDF...' : 'Tải xuống PDF'}
          </button>
          <button
            type="button"
            className="cert-btn cert-btn--secondary"
            onClick={() => onCopyLink(cert)}
          >
            <IconCopy />
            Sao chép liên kết chia sẻ
          </button>
          <button
            type="button"
            className="cert-btn cert-btn--outline"
            onClick={() => onOpenVerifyPage(cert)}
          >
            Xem trang xác thực
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Component chính ──────────────────────────────────────────────────────────
export const MyCertificatesPage: React.FC = () => {
  const { isAuthenticated, isLoading, navigate } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [pdfTargetCert, setPdfTargetCert] = useState<Certificate | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const printTemplateRef = useRef<HTMLDivElement | null>(null);

  const loadCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyCertificates();
      setCertificates(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải danh sách chứng chỉ',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void loadCertificates();
    } else if (!isLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, loadCertificates]);

  const handleCopyLink = async (cert: Certificate) => {
    const publicUrl = buildPublicVerifyUrl(cert);
    const ok = await copyTextToClipboard(publicUrl);
    if (ok) {
      toast.success('Đã sao chép liên kết xác thực công khai vào Clipboard!');
    } else {
      toast.error(`Không thể tự sao chép. URL xác thực: ${publicUrl}`);
    }
  };

  const handleDownloadPDF = async (cert: Certificate) => {
    if (downloadingId) return;
    setDownloadingId(cert._id);
    setPdfTargetCert(cert);

    // Đợi React render offscreen template khổ chuẩn A4 Landscape
    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          const targetEl = printTemplateRef.current;
          if (!targetEl) {
            throw new Error('Không tìm thấy mẫu chứng chỉ để xuất PDF');
          }

          const canvas = await html2canvas(targetEl, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
          });

          pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
          pdf.save(`Purrfect-Certificate-${cert.certificateCode}.pdf`);
          toast.success('Đã tải xuống file PDF chứng chỉ thành công!');
        } catch (err) {
          console.error('[PDF Download]', err);
          toast.error('Không thể tạo file PDF. Vui lòng thử lại.');
        } finally {
          setDownloadingId(null);
          setPdfTargetCert(null);
        }
      }, 60);
    });
  };

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="certs-unauth">
        <div className="certs-unauth-card">
          <div className="certs-unauth-icon">🔒</div>
          <h2>Yêu cầu đăng nhập</h2>
          <p>Vui lòng đăng nhập để xem danh sách chứng chỉ của bạn.</p>
          <button
            type="button"
            className="cert-btn cert-btn--primary"
            onClick={() => navigate('/login')}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="certs-page-wrapper">
      {/* Header Banner */}
      <section className="certs-header-banner">
        <div className="certs-banner-container">
          <nav className="certs-breadcrumb" aria-label="Breadcrumb">
            <span
              className="certs-bread-link"
              onClick={() => navigate('/')}
              role="button"
              tabIndex={0}
            >
              Trang chủ
            </span>
            <span className="certs-bread-sep">/</span>
            <span
              className="certs-bread-link"
              onClick={() => navigate('/profile')}
              role="button"
              tabIndex={0}
            >
              Trang cá nhân
            </span>
            <span className="certs-bread-sep">/</span>
            <span className="certs-bread-current">Chứng chỉ của tôi</span>
          </nav>
          <div className="certs-hero-content">
            <h1 className="certs-hero-title">Chứng chỉ của tôi</h1>
            <p className="certs-hero-subtitle">
              Xem lại các chứng chỉ hoàn thành khóa học bạn đã đạt được, tải
              xuống file PDF hoặc sao chép liên kết xác minh công khai để chia
              sẻ.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="certs-main-container">
        {loading ? (
          <div className="certs-loading">
            <div className="certs-spinner" />
            <p>Đang tải danh sách chứng chỉ...</p>
          </div>
        ) : error ? (
          <div className="certs-error-box">
            <p>⚠️ {error}</p>
            <button
              type="button"
              className="cert-btn cert-btn--primary"
              onClick={loadCertificates}
            >
              Thử lại
            </button>
          </div>
        ) : certificates.length === 0 ? (
          // Exception Flow 1b: Học viên chưa hoàn thành khóa học nào
          <div className="certs-empty-state">
            <div className="certs-empty-icon">
              <IconBooks />
            </div>
            <h2 className="certs-empty-title">Bạn chưa có chứng chỉ nào</h2>
            <p className="certs-empty-desc">
              Bạn chưa có chứng chỉ nào. Hãy hoàn thành 100% khóa học để nhận
              chứng chỉ!
            </p>
            <button
              type="button"
              className="cert-btn cert-btn--primary"
              onClick={() => navigate('/my-courses')}
            >
              Tiếp tục học ngay
            </button>
          </div>
        ) : (
          <>
            <p className="certs-count-label">
              Bạn đã đạt được <strong>{certificates.length}</strong> chứng chỉ
            </p>
            <div className="certs-grid">
              {certificates.map((cert) => (
                <article
                  key={cert._id}
                  className="cert-card"
                  onClick={() => setSelectedCert(cert)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedCert(cert)}
                  aria-label={`Xem chứng chỉ: ${cert.courseTitle}`}
                >
                  <div className="cert-card-top">
                    <div className="cert-card-icon">
                      <IconCertificate />
                    </div>
                    <span className="cert-card-badge">✓ Đã xác nhận</span>
                  </div>

                  <div className="cert-card-body">
                    <h3 className="cert-card-title">{cert.courseTitle}</h3>
                    <p className="cert-card-date">
                      Ngày cấp: <strong>{formatDate(cert.issueDate)}</strong>
                    </p>
                    <p className="cert-card-code">
                      Mã chứng chỉ: <code>{cert.certificateCode}</code>
                    </p>
                  </div>

                  <div className="cert-card-actions">
                    <button
                      type="button"
                      className="cert-btn cert-btn--sm cert-btn--primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCert(cert);
                      }}
                    >
                      Xem trước
                    </button>
                    <button
                      type="button"
                      className="cert-btn cert-btn--sm cert-btn--outline"
                      disabled={downloadingId === cert._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDownloadPDF(cert);
                      }}
                    >
                      <IconDownload />
                      {downloadingId === cert._id ? 'Đang tạo...' : 'Tải PDF'}
                    </button>
                    <button
                      type="button"
                      className="cert-btn cert-btn--sm cert-btn--secondary"
                      title="Sao chép liên kết chia sẻ"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleCopyLink(cert);
                      }}
                    >
                      <IconCopy />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Preview Modal */}
      {selectedCert && (
        <CertificatePreview
          cert={selectedCert}
          downloading={downloadingId === selectedCert._id}
          onDownload={(c) => void handleDownloadPDF(c)}
          onCopyLink={(c) => void handleCopyLink(c)}
          onClose={() => setSelectedCert(null)}
          onOpenVerifyPage={(c) => {
            setSelectedCert(null);
            navigate(`/certificates/verify/${c.certificateCode}`);
          }}
        />
      )}

      {/* Offscreen A4 Landscape Certificate Template cho PDF Export */}
      {pdfTargetCert && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '1122px',
            height: '794px',
            background: '#ffffff',
            padding: '32px',
            boxSizing: 'border-box',
          }}
          ref={printTemplateRef}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '10px solid #0056d2',
              borderRadius: '14px',
              padding: '16px',
              boxSizing: 'border-box',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                border: '3px solid #c9a227',
                borderRadius: '8px',
                padding: '44px 56px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'center',
                fontFamily: 'Inter, Arial, sans-serif',
                background:
                  'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: '#0056d2',
                    letterSpacing: '3px',
                  }}
                >
                  🎓 PURRFECT
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    marginTop: '4px',
                  }}
                >
                  Nền tảng học trực tuyến
                </div>
              </div>

              <div>
                <h1
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '44px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 14px 0',
                  }}
                >
                  Chứng chỉ hoàn thành
                </h1>
                <div
                  style={{
                    fontSize: '15px',
                    letterSpacing: '2.5px',
                    textTransform: 'uppercase',
                    color: '#64748b',
                    marginBottom: '16px',
                  }}
                >
                  Trân trọng chứng nhận
                </div>
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '38px',
                    fontWeight: 700,
                    color: '#0056d2',
                    borderBottom: '3px solid #c9a227',
                    paddingBottom: '8px',
                    marginBottom: '18px',
                    display: 'inline-block',
                    minWidth: '380px',
                  }}
                >
                  {pdfTargetCert.studentName}
                </div>
                <div
                  style={{
                    fontSize: '17px',
                    color: '#475569',
                    marginBottom: '10px',
                  }}
                >
                  đã hoàn thành 100% nội dung khóa học
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#0f172a',
                    maxWidth: '780px',
                    lineHeight: 1.35,
                  }}
                >
                  {pdfTargetCert.courseTitle}
                </div>
              </div>

              <div style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '20px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                  }}
                >
                  <div style={{ textAlign: 'left', minWidth: '220px' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      Giảng viên
                    </div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginTop: '3px',
                      }}
                    >
                      {pdfTargetCert.instructorName || 'Giảng viên Purrfect'}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginTop: '8px',
                      }}
                    >
                      Ngày cấp: {formatDate(pdfTargetCert.issueDate)}
                    </div>
                  </div>

                  <div
                    style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      background: '#0056d2',
                      border: '4px double #facc15',
                      color: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      lineHeight: 1.3,
                    }}
                  >
                    <span>PURRFECT</span>
                    <span>✓ XÁC NHẬN</span>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '220px' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      Mã chứng chỉ
                    </div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#0056d2',
                        marginTop: '3px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {pdfTargetCert.certificateCode}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginTop: '12px',
                  }}
                >
                  Xác thực trực tuyến tại:{' '}
                  {buildPublicVerifyUrl(pdfTargetCert)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
