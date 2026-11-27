import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  verifyCertificate,
  buildPublicVerifyUrl,
  type VerifyCertificateData,
} from '../../services/certificateApi';
import './CertificateVerifyPage.css';

interface CertificateVerifyPageProps {
  code: string;
}

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const CertificateVerifyPage: React.FC<CertificateVerifyPageProps> = ({
  code,
}) => {
  const { navigate } = useAuth();
  const [certData, setCertData] = useState<VerifyCertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) {
      setError('Mã chứng chỉ không hợp lệ.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await verifyCertificate(code);
        setCertData(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Không tìm thấy chứng chỉ với mã này. Có thể mã không hợp lệ hoặc đã bị thu hồi.',
        );
      } finally {
        setLoading(false);
      }
    };

    void verify();
  }, [code]);

  if (loading) {
    return (
      <div className="cert-verify-wrapper">
        <div className="cert-verify-loading">
          <div className="cert-verify-spinner" />
          <p>Đang xác thực chứng chỉ...</p>
        </div>
      </div>
    );
  }

  if (error || !certData) {
    return (
      <div className="cert-verify-wrapper">
        <div className="cert-verify-invalid">
          <div className="cert-verify-invalid-icon">❌</div>
          <h1 className="cert-verify-invalid-title">Chứng chỉ không hợp lệ</h1>
          <p className="cert-verify-invalid-desc">
            {error || 'Không tìm thấy chứng chỉ với mã này.'}
          </p>
          <p className="cert-verify-invalid-code">
            Mã tra cứu: <code>{code}</code>
          </p>
          <button
            type="button"
            className="cert-verify-btn"
            onClick={() => navigate('/')}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const publicUrl = buildPublicVerifyUrl(certData);

  // Alternative Flow 6a: Trang xác thực chứng chỉ công khai
  return (
    <div className="cert-verify-wrapper">
      <div className="cert-verify-container">
        <div className="cert-verify-platform-header">
          <span className="cert-verify-logo">🎓 PURRFECT</span>
          <span className="cert-verify-platform-label">
            Nền tảng học trực tuyến
          </span>
        </div>

        <div className="cert-verify-valid-badge">
          <span className="cert-verify-checkmark">✓</span>
          <span>Chứng chỉ hợp lệ &amp; chính chủ</span>
        </div>

        <div className="cert-verify-card">
          <div className="cert-verify-card-inner">
            <h1 className="cert-verify-cert-title">Chứng chỉ hoàn thành</h1>
            <p className="cert-verify-cert-presents">Trân trọng chứng nhận</p>

            <p className="cert-verify-student-name">{certData.studentName}</p>
            <p className="cert-verify-cert-desc">
              đã hoàn thành 100% nội dung khóa học
            </p>
            <p className="cert-verify-course-name">{certData.courseTitle}</p>

            <div className="cert-verify-meta-row">
              <div className="cert-verify-meta-item">
                <span className="cert-verify-meta-label">Giảng viên</span>
                <span className="cert-verify-meta-value">
                  {certData.instructorName}
                </span>
              </div>
              <div className="cert-verify-seal" aria-label="Con dấu xác nhận Purrfect">
                <span>PURRFECT</span>
                <span>✓ XÁC NHẬN</span>
              </div>
              <div className="cert-verify-meta-item">
                <span className="cert-verify-meta-label">Ngày cấp</span>
                <span className="cert-verify-meta-value">
                  {formatDate(certData.issueDate)}
                </span>
              </div>
            </div>

            <div className="cert-verify-card-footer">
              <span className="cert-verify-meta-label">Mã chứng chỉ:</span>
              <code className="cert-verify-code">{certData.certificateCode}</code>
            </div>
          </div>
        </div>

        <div className="cert-verify-info-box">
          <h2 className="cert-verify-info-title">Thông tin xác thực công khai</h2>
          <p className="cert-verify-info-desc">
            Chứng chỉ này được phát hành chính thức bởi nền tảng{' '}
            <strong>Purrfect</strong>, xác nhận học viên{' '}
            <strong>{certData.studentName}</strong> đã hoàn thành đầy đủ toàn bộ
            bài giảng của khóa học{' '}
            <strong>&quot;{certData.courseTitle}&quot;</strong> do giảng viên{' '}
            <strong>{certData.instructorName}</strong> phụ trách.
          </p>
          <div className="cert-verify-url-row">
            <span className="cert-verify-meta-label">Đường dẫn xác thực:</span>
            <a
              href={publicUrl}
              className="cert-verify-url-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {publicUrl}
            </a>
          </div>
        </div>

        <div className="cert-verify-actions">
          <button
            type="button"
            className="cert-verify-btn"
            onClick={() => navigate('/')}
          >
            Khám phá khóa học trên Purrfect
          </button>
        </div>
      </div>
    </div>
  );
};
