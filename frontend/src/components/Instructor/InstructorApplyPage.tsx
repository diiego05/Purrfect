import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../Header';
import { Footer } from '../Footer';
import {
  IconlyWork,
  IconlyTick,
  IconlyTimeCircle,
  IconlyClose,
  IconlyDocument,
  IconlyShield,
} from '../Onboarding/IconlyIcons';
import { instructorApplicationApi } from '../../services/instructorApplicationApi';
import type { InstructorApplicationItem } from '../../types/instructorApplication';
import './InstructorApplyPage.css';

export const InstructorApplyPage: React.FC = () => {
  const { user, isAuthenticated, isLoading, navigate } = useAuth();
  const [existingApp, setExistingApp] = useState<InstructorApplicationItem | null>(null);
  const [loading, setLoading] = useState(() => Boolean(user && user.role === 'STUDENT'));

  // Form fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [expertise, setExpertise] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(2);
  const [bio, setBio] = useState('');
  const [teachingTopics, setTeachingTopics] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [cvUrl, setCvUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let isMounted = true;

    // Chỉ truy vấn đơn đăng ký nếu người dùng đã đăng nhập và có role là STUDENT
    if (isAuthenticated && user?.role === 'STUDENT') {
      instructorApplicationApi
        .getMyApplication()
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            setExistingApp(res.data);
            setFullName(res.data.fullName);
            setPhoneNumber(res.data.phoneNumber);
            setExpertise(res.data.expertise);
            setExperienceYears(res.data.experienceYears || 2);
            setBio(res.data.bio || '');
            setTeachingTopics(res.data.teachingTopics || '');
            setPortfolioUrl(res.data.portfolioUrl || '');
            setCvUrl(res.data.cvUrl || '');
          }
          setLoading(false);
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim() || !phoneNumber.trim() || !expertise.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await instructorApplicationApi.submitApplication({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        expertise: expertise.trim(),
        experienceYears,
        bio: bio.trim(),
        teachingTopics: teachingTopics.trim(),
        portfolioUrl: portfolioUrl.trim(),
        cvUrl: cvUrl.trim(),
      });

      if (res.success && res.data) {
        setExistingApp(res.data);
        setSuccessMsg(
          'Đơn đăng ký của bạn đã được gửi thành công đến Quản trị viên. Chúng tôi sẽ xét duyệt và phản hồi trong thời gian sớm nhất!',
        );
      } else {
        setErrorMsg(res.message || 'Không thể gửi đơn đăng ký. Vui lòng thử lại.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const isInstructor = isAuthenticated && user?.role === 'INSTRUCTOR';
  const isStudent = isAuthenticated && user?.role === 'STUDENT';

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content instructor-apply-main">
        <div className="instructor-apply-container">
          {/* Header Card */}
          <div className="instructor-apply-hero">
            <div className="instructor-apply-badge">
              <IconlyWork size={18} color="#6366f1" />
              <span>Chương trình Giảng viên Đối tác</span>
            </div>
            <h1>Trở thành Giảng viên trên Learnova</h1>
            <p>
              Lan tỏa tri thức, xây dựng thương hiệu cá nhân và tạo nguồn thu nhập hấp dẫn từ các khóa học trực tuyến chất lượng cao cùng hàng ngàn học viên.
            </p>
          </div>

          {isLoading || loading ? (
            <div className="instructor-apply-loading">
              <div className="apply-spinner" />
              <span>Đang tải thông tin...</span>
            </div>
          ) : !isAuthenticated || !user ? (
            /* Khách chưa đăng nhập */
            <div className="instructor-apply-status-card unauth">
              <div className="status-icon unauth">
                <IconlyShield size={32} color="#4f46e5" />
              </div>
              <h2>Yêu cầu đăng nhập Học viên</h2>
              <p>
                Để nộp hồ sơ tham gia Chương trình Giảng viên Đối tác trên Learnova, vui lòng đăng nhập vào tài khoản Học viên của bạn.
              </p>
              <button
                type="button"
                className="btn-apply-primary"
                onClick={() => navigate('/login')}
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : isAdmin ? (
            /* Quản trị viên (Admin) không được nộp đơn, chuyển hướng duyệt đơn */
            <div className="instructor-apply-status-card admin-restricted">
              <div className="status-icon admin">
                <IconlyShield size={32} color="#dc2626" />
              </div>
              <h2>Tài khoản Quản trị viên (Admin)</h2>
              <p>
                Bạn đang đăng nhập bằng tài khoản Quản trị viên hệ thống. Quản trị viên không thể nộp đơn đăng ký làm Giảng viên. Nếu bạn muốn kiểm tra và xét duyệt các đơn đăng ký của giảng viên đối tác, vui lòng truy cập trang Quản lý duyệt đơn.
              </p>
              <div className="apply-action-group">
                <button
                  type="button"
                  className="btn-apply-primary btn-apply-admin"
                  onClick={() => navigate('/admin/instructor-applications')}
                >
                  Đi đến Duyệt đơn Giảng viên
                </button>
                <button
                  type="button"
                  className="btn-apply-secondary"
                  onClick={() => navigate('/admin')}
                >
                  Về Bảng điều khiển Quản trị
                </button>
              </div>
            </div>
          ) : isInstructor ? (
            /* Đã là Giảng viên chính thức */
            <div className="instructor-apply-status-card approved">
              <div className="status-icon approved">
                <IconlyTick size={32} color="#10b981" />
              </div>
              <h2>Bạn đã là Giảng viên chính thức!</h2>
              <p>
                Tài khoản của bạn đã có đầy đủ quyền Giảng viên trên nền tảng Learnova. Bạn không cần nộp thêm đơn đăng ký. Hãy truy cập Bảng điều khiển Giảng viên để quản lý và tạo các khóa học mới.
              </p>
              <div className="apply-action-group">
                <button
                  type="button"
                  className="btn-apply-primary"
                  onClick={() => navigate('/instructor/courses')}
                >
                  Vào Bảng điều khiển Giảng viên
                </button>
                <button
                  type="button"
                  className="btn-apply-secondary"
                  onClick={() => navigate('/')}
                >
                  Về Trang chủ
                </button>
              </div>
            </div>
          ) : isStudent ? (
            <>
              {/* Status Banner nếu đã có đơn */}
              {existingApp && existingApp.status === 'PENDING' && (
                <div className="instructor-apply-status-card pending">
                  <div className="status-icon pending">
                    <IconlyTimeCircle size={32} color="#f59e0b" />
                  </div>
                  <h2>Đơn đăng ký của bạn đang chờ xét duyệt</h2>
                  <p>
                    Ban quản trị Learnova đã nhận được hồ sơ của bạn vào lúc{' '}
                    <strong>
                      {new Date(existingApp.createdAt).toLocaleDateString('vi-VN')}
                    </strong>
                    . Chúng tôi sẽ xem xét thông tin và phản hồi sớm nhất. Bạn có thể cập nhật lại thông tin bên dưới nếu cần bổ sung.
                  </p>
                </div>
              )}

              {existingApp && existingApp.status === 'REJECTED' && (
                <div className="instructor-apply-status-card rejected">
                  <div className="status-icon rejected">
                    <IconlyClose size={32} color="#ef4444" />
                  </div>
                  <h2>Đơn đăng ký trước đó chưa được duyệt</h2>
                  <p>
                    <strong>Lý do từ chối:</strong>{' '}
                    {existingApp.rejectionReason || 'Hồ sơ chưa đạt tiêu chuẩn chuyên môn.'}
                  </p>
                  <span className="rejected-hint">
                    Bạn có thể cập nhật lại thông tin hồ sơ bên dưới và nộp lại đơn xét duyệt mới.
                  </span>
                </div>
              )}

              {successMsg && (
                <div className="apply-alert-success">
                  <IconlyTick size={18} color="#059669" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="apply-alert-error">
                  <IconlyClose size={18} color="#dc2626" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form nộp đơn */}
              <div className="instructor-apply-card">
                <div className="apply-card-title">
                  <IconlyDocument size={20} color="#4f46e5" />
                  <h3>Hồ sơ thông tin Giảng viên</h3>
                </div>

                <form className="instructor-apply-form" onSubmit={handleSubmit}>
                  {/* Row 1: Họ tên + Email */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="fullName">Họ và tên đầy đủ *</label>
                      <input
                        id="fullName"
                        type="text"
                        required
                        placeholder="Ví dụ: Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email tài khoản</label>
                      <input
                        id="email"
                        type="email"
                        readOnly
                        value={email}
                        className="input-readonly"
                      />
                    </div>
                  </div>

                  {/* Row 2: Số điện thoại + Số năm kinh nghiệm */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Số điện thoại liên hệ *</label>
                      <input
                        id="phoneNumber"
                        type="tel"
                        required
                        placeholder="Ví dụ: 0912345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="experienceYears">Số năm kinh nghiệm làm việc</label>
                      <input
                        id="experienceYears"
                        type="number"
                        min="0"
                        max="50"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                  </div>

                  {/* Row 3: Lĩnh vực chuyên môn chính */}
                  <div className="form-group">
                    <label htmlFor="expertise">Lĩnh vực chuyên môn chính *</label>
                    <input
                      id="expertise"
                      type="text"
                      required
                      placeholder="Ví dụ: Lập trình Web Fullstack, Trí tuệ nhân tạo (AI), Thiết kế UI/UX..."
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                    />
                  </div>

                  {/* Row 4: Giới thiệu bản thân & kinh nghiệm */}
                  <div className="form-group">
                    <label htmlFor="bio">Tóm tắt tiểu sử & Kinh nghiệm chuyên môn</label>
                    <textarea
                      id="bio"
                      rows={4}
                      placeholder="Mô tả quá trình học tập, các dự án thực tế, các chứng chỉ hoặc kinh nghiệm giảng dạy bạn đã có..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={2000}
                    />
                  </div>

                  {/* Row 5: Chủ đề khóa học dự kiến giảng dạy */}
                  <div className="form-group">
                    <label htmlFor="teachingTopics">Chủ đề khóa học dự kiến giảng dạy</label>
                    <input
                      id="teachingTopics"
                      type="text"
                      placeholder="Ví dụ: React 19 từ cơ bản đến nâng cao, Xây dựng AI Chatbot với Node.js..."
                      value={teachingTopics}
                      onChange={(e) => setTeachingTopics(e.target.value)}
                    />
                  </div>

                  {/* Row 6: Link Portfolio / LinkedIn / CV */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="portfolioUrl">Link Portfolio / LinkedIn / Website</label>
                      <input
                        id="portfolioUrl"
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cvUrl">Link CV / Hồ sơ năng lực (Google Drive)</label>
                      <input
                        id="cvUrl"
                        type="url"
                        placeholder="https://drive.google.com/file/..."
                        value={cvUrl}
                        onChange={(e) => setCvUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="apply-form-footer">
                    <button
                      type="submit"
                      className="btn-apply-submit"
                      disabled={submitting}
                    >
                      {submitting
                        ? 'Đang gửi hồ sơ...'
                        : existingApp
                          ? 'Cập nhật đơn đăng ký'
                          : 'Gửi đơn đăng ký xét duyệt'}
                    </button>
                    <span className="apply-hint">
                      Bằng việc gửi đơn, bạn đồng ý với Tiêu chuẩn chất lượng nội dung và Quy chế hoạt động giảng viên của Learnova.
                    </span>
                  </div>
                </form>
              </div>
            </>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};
