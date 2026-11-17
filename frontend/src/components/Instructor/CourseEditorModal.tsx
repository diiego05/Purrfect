import React, { useState } from 'react';
import type {
  InstructorCourse,
  SectionItem,
  LectureItem,
  LectureType,
} from '../../types/instructorCourse';
import type { Category } from '../../types/course';
import {
  updateInstructorCourse,
  uploadLectureMedia,
  submitCourseForApproval,
  updateLectureTranscript,
} from '../../services/instructorCourseApi';
import { parseSubtitleToTranscript } from '../../utils/subtitleParser';
import {
  IconlyFolder,
  IconlyPlus,
  IconlyDelete,
  IconlyClose,
  IconlyTick,
  IconlyAiChip,
  IconlyDanger,
} from '../Onboarding/IconlyIcons';
import { formatVND } from '../../utils/format';

interface CourseEditorModalProps {
  course: InstructorCourse;
  categories: Category[];
  onClose: () => void;
  onSuccess: (updatedCourse: InstructorCourse, message: string) => void;
}

export const CourseEditorModal: React.FC<CourseEditorModalProps> = ({
  course,
  categories,
  onClose,
  onSuccess,
}) => {
  // Tabs: 'general' | 'curriculum' | 'pricing' (Basic flow step 2)
  const [activeTab, setActiveTab] = useState<
    'general' | 'curriculum' | 'pricing'
  >('general');

  // Form State: Tab 1 - Thông tin chung
  const [title, setTitle] = useState<string>(course.title || '');
  const [shortDescription, setShortDescription] = useState<string>(
    course.shortDescription || '',
  );
  const [description, setDescription] = useState<string>(
    course.description || '',
  );
  const [categoryId, setCategoryId] = useState<string>(
    typeof course.categoryId === 'object' && course.categoryId?._id
      ? course.categoryId._id
      : (course.categoryId as string) || '',
  );
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    course.level || 'Beginner',
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    course.thumbnailUrl ||
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
  );

  // Form State: Tab 2 - Đề cương bài giảng (Sections & Lectures)
  const [sections, setSections] = useState<SectionItem[]>(() => {
    if (course.sections && course.sections.length > 0) {
      return course.sections;
    }
    // Khởi tạo mặc định 1 section rỗng để giảng viên bắt đầu dễ dàng
    return [
      {
        title: 'Chương 1: Tổng quan và chuẩn bị môi trường',
        order: 1,
        lectures: [],
      },
    ];
  });

  // Form State: Tab 3 - Cài đặt học phí
  const [price, setPrice] = useState<number>(course.price || 0);
  const [discountPrice, setDiscountPrice] = useState<number>(
    course.discountPrice || 0,
  );
  const [badge, setBadge] = useState<string>(course.badge || '');

  // Trạng thái xử lý & lỗi
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeTranscriptLec, setActiveTranscriptLec] =
    useState<LectureItem | null>(null);
  const [activeTranscriptModalLoc, setActiveTranscriptModalLoc] = useState<{
    secIdx: number;
    lecIdx: number;
  } | null>(null);
  const [isEditingModalTranscript, setIsEditingModalTranscript] =
    useState<boolean>(false);
  const [modalTranscriptDraft, setModalTranscriptDraft] = useState<string>('');
  const [modalTranscriptNotice, setModalTranscriptNotice] =
    useState<string>('');

  // Modal thêm bài giảng vào chương
  const [addingLectureSectionIdx, setAddingLectureSectionIdx] = useState<
    number | null
  >(null);
  const [newLectureTitle, setNewLectureTitle] = useState<string>('');
  const [newLectureType, setNewLectureType] = useState<LectureType>('VIDEO');
  const [newLectureDuration, setNewLectureDuration] = useState<number>(15);
  const [newLectureIsPreview, setNewLectureIsPreview] =
    useState<boolean>(false);
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);

  // Tính tổng số bài giảng hiện có
  const totalLecturesCount = sections.reduce(
    (acc, sec) => acc + (sec.lectures?.length || 0),
    0,
  );

  // Xử lý thêm Chương học mới
  const handleAddSection = () => {
    const nextOrder = sections.length + 1;
    setSections([
      ...sections,
      {
        title: `Chương ${nextOrder}: Nội dung kiến thức mới`,
        order: nextOrder,
        lectures: [],
      },
    ]);
  };

  // Xóa Chương học
  const handleRemoveSection = (secIdx: number) => {
    setSections(sections.filter((_, idx) => idx !== secIdx));
  };

  // Cập nhật tiêu đề chương
  const handleUpdateSectionTitle = (secIdx: number, newTitle: string) => {
    setSections(
      sections.map((sec, idx) =>
        idx === secIdx ? { ...sec, title: newTitle } : sec,
      ),
    );
  };

  // Mở modal thêm bài giảng vào section
  const handleOpenAddLecture = (secIdx: number) => {
    setAddingLectureSectionIdx(secIdx);
    setNewLectureTitle('');
    setNewLectureType('VIDEO');
    setNewLectureDuration(15);
    setNewLectureIsPreview(false);
    setErrorMsg('');
  };

  // Xử lý tải file bài giảng lên (BR06.2, BR06.5)
  const handleSimulateFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // BR06.2: Dung lượng tối đa cho mỗi tệp tải lên là 2GB
    const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > MAX_SIZE_BYTES) {
      // Exception 5b & 5b1:
      setErrorMsg('Định dạng file không hỗ trợ hoặc dung lượng vượt quá 2GB');
      return;
    }

    if (!newLectureTitle.trim()) {
      setNewLectureTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    setUploadingMedia(true);
    setErrorMsg('');

    try {
      const res = await uploadLectureMedia(course._id, {
        lectureTitle: newLectureTitle.trim() || file.name,
        type: newLectureType,
        fileName: file.name,
        fileSize: file.size,
        durationMinutes: newLectureDuration,
        isPreview: newLectureIsPreview,
      });

      // Thêm bài giảng đã xử lý nén & trích xuất transcript vào Section
      if (addingLectureSectionIdx !== null) {
        const targetSection = sections[addingLectureSectionIdx];
        const updatedLectures = [
          ...targetSection.lectures,
          {
            ...res.data,
            order: targetSection.lectures.length + 1,
          },
        ];

        setSections(
          sections.map((sec, idx) =>
            idx === addingLectureSectionIdx
              ? { ...sec, lectures: updatedLectures }
              : sec,
          ),
        );

        setAddingLectureSectionIdx(null);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Lỗi khi tải file bài giảng lên hệ thống',
      );
    } finally {
      setUploadingMedia(false);
    }
  };

  // Mở modal quản lý Transcript
  const handleOpenTranscriptModal = (
    secIdx: number,
    lecIdx: number,
    lecture: LectureItem,
  ) => {
    setActiveTranscriptLec(lecture);
    setActiveTranscriptModalLoc({ secIdx, lecIdx });
    setModalTranscriptDraft(lecture.transcript || '');
    setIsEditingModalTranscript(!lecture.transcript);
    setModalTranscriptNotice('');
  };

  // Lưu transcript trong modal
  const handleSaveModalTranscript = async () => {
    if (!activeTranscriptModalLoc) return;
    const { secIdx, lecIdx } = activeTranscriptModalLoc;
    const trimmed = modalTranscriptDraft.trim();

    const updated = [...sections];
    const targetLec = updated[secIdx]?.lectures?.[lecIdx];
    if (!targetLec) return;

    targetLec.transcript = trimmed;
    targetLec.transcriptStatus = trimmed ? 'COMPLETED' : 'PENDING';
    setSections(updated);
    setActiveTranscriptLec({ ...targetLec });
    setIsEditingModalTranscript(false);
    setModalTranscriptNotice('Đã lưu transcript thành công!');

    if (course._id && targetLec._id) {
      try {
        await updateLectureTranscript(course._id, targetLec._id, trimmed);
      } catch (err) {
        console.warn('Lưu transcript API nền:', err);
      }
    }

    setTimeout(() => {
      setModalTranscriptNotice('');
    }, 3500);
  };

  // Nạp file phụ đề trong modal
  const handleUploadModalSubtitle = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const parsed = parseSubtitleToTranscript(content);
      if (parsed) {
        setModalTranscriptDraft(parsed);
        setIsEditingModalTranscript(true);
        setModalTranscriptNotice(
          `Đã nạp phụ đề từ tệp "${file.name}"! Bấm "Lưu Transcript" để xác nhận.`,
        );
      } else {
        setModalTranscriptNotice(
          `Tệp "${file.name}" không có nội dung văn bản hợp lệ.`,
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Thêm bài giảng không cần file đính kèm (hoặc dùng tài nguyên mặc định)
  const handleAddLectureQuick = async () => {
    if (!newLectureTitle.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề bài giảng');
      return;
    }

    if (addingLectureSectionIdx === null) return;

    setUploadingMedia(true);
    setErrorMsg('');
    try {
      const res = await uploadLectureMedia(course._id, {
        lectureTitle: newLectureTitle.trim(),
        type: newLectureType,
        fileName:
          newLectureType === 'VIDEO' ? 'bai_giang_video.mp4' : 'tai_lieu.pdf',
        fileSize: 45 * 1024 * 1024,
        durationMinutes: Number(newLectureDuration) || 12,
        isPreview: newLectureIsPreview,
      });

      const targetSection = sections[addingLectureSectionIdx];
      const updatedLectures = [
        ...targetSection.lectures,
        {
          ...res.data,
          title: newLectureTitle.trim(),
          order: targetSection.lectures.length + 1,
        },
      ];

      setSections(
        sections.map((sec, idx) =>
          idx === addingLectureSectionIdx
            ? { ...sec, lectures: updatedLectures }
            : sec,
        ),
      );

      setAddingLectureSectionIdx(null);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Lỗi khi khởi tạo bài giảng',
      );
    } finally {
      setUploadingMedia(false);
    }
  };

  // Xóa bài giảng khỏi chương
  const handleRemoveLecture = (secIdx: number, lecIdx: number) => {
    setSections(
      sections.map((sec, sIdx) => {
        if (sIdx !== secIdx) return sec;
        return {
          ...sec,
          lectures: sec.lectures.filter((_, lIdx) => lIdx !== lecIdx),
        };
      }),
    );
  };

  // Bật/tắt xem thử miễn phí cho bài giảng (Basic flow step 6)
  const handleTogglePreview = (secIdx: number, lecIdx: number) => {
    setSections(
      sections.map((sec, sIdx) => {
        if (sIdx !== secIdx) return sec;
        return {
          ...sec,
          lectures: sec.lectures.map((lec, lIdx) =>
            lIdx === lecIdx ? { ...lec, isPreview: !lec.isPreview } : lec,
          ),
        };
      }),
    );
  };

  // Gom dữ liệu cập nhật
  const buildPayload = () => {
    return {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      categoryId: categoryId || undefined,
      level,
      thumbnailUrl,
      price: Number(price) || 0,
      discountPrice: Number(discountPrice) || 0,
      badge: badge.trim(),
      sections,
    };
  };

  // Lưu nháp (Alternative Flow 7a, 7a1)
  const handleSaveDraft = async () => {
    // BR06.3: Nếu có giá khuyến mãi, phải nhỏ hơn giá gốc
    const p = Number(price) || 0;
    const dp = Number(discountPrice) || 0;
    if (dp > 0 && dp >= p) {
      setErrorMsg('Giá khuyến mãi phải nhỏ hơn giá gốc của khóa học');
      setActiveTab('pricing');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await updateInstructorCourse(course._id, {
        ...buildPayload(),
        status: 'DRAFT',
      });
      onSuccess(
        res.data,
        'Đã lưu toàn bộ tiến trình chỉnh sửa ở trạng thái DRAFT (Lưu nháp)!',
      );
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Lỗi khi lưu nháp khóa học',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Gửi phê duyệt lên Admin (Basic Flow Step 7, 8; BR06.1; Exception 8a)
  const handleSubmitApproval = async () => {
    // 1. Kiểm tra thông tin cơ bản bắt buộc (BR06.1)
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập Tiêu đề khóa học');
      setActiveTab('general');
      return;
    }
    if (!shortDescription.trim() || !description.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Mô tả ngắn và Mô tả chi tiết khóa học');
      setActiveTab('general');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Vui lòng chọn Danh mục ngành học');
      setActiveTab('general');
      return;
    }

    // 2. BR06.3: Kiểm tra giá khuyến mãi
    const p = Number(price) || 0;
    const dp = Number(discountPrice) || 0;
    if (dp > 0 && dp >= p) {
      setErrorMsg('Giá khuyến mãi phải nhỏ hơn giá gốc của khóa học');
      setActiveTab('pricing');
      return;
    }

    // 3. BR06.1 & Exception 8a: Có ít nhất 1 chương và 3 bài giảng có nội dung
    if (sections.length < 1) {
      setErrorMsg(
        'Khóa học phải có tối thiểu 1 chương và 3 bài giảng có nội dung trước khi gửi duyệt',
      );
      setActiveTab('curriculum');
      return;
    }

    if (totalLecturesCount < 3) {
      // Exception 8a1:
      setErrorMsg(
        'Khóa học phải có tối thiểu 1 chương và 3 bài giảng có nội dung trước khi gửi duyệt',
      );
      setActiveTab('curriculum');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      // Trước tiên lưu nội dung mới nhất
      await updateInstructorCourse(course._id, buildPayload());

      // Gửi yêu cầu phê duyệt
      const res = await submitCourseForApproval(course._id);
      onSuccess(
        res.data,
        'Gửi phê duyệt thành công! Khóa học đã chuyển sang trạng thái Chờ duyệt (PENDING_APPROVAL).',
      );
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Lỗi khi gửi yêu cầu phê duyệt',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="editor-modal-backdrop" onClick={onClose}>
      <div
        className="editor-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="editor-header">
          <div>
            <h2 className="editor-title">
              {course.title
                ? `Soạn thảo: ${course.title}`
                : 'Soạn thảo khóa học mới'}
            </h2>
            <p className="editor-subtitle">
              Tổ chức đề cương, tải video/tài liệu bài giảng, trích xuất
              transcript AI và cấu hình học phí
            </p>
          </div>
          <button
            type="button"
            className="playlist-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng"
          >
            <IconlyClose size={20} />
          </button>
        </div>

        {/* 3 Tabs Điều Hướng (Basic flow step 2) */}
        <div className="editor-tabs-nav">
          <button
            type="button"
            className={`editor-tab-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <span>Thông tin chung</span>
          </button>
          <button
            type="button"
            className={`editor-tab-item ${activeTab === 'curriculum' ? 'active' : ''}`}
            onClick={() => setActiveTab('curriculum')}
          >
            <span>Đề cương bài giảng</span>
            <span
              style={{
                fontSize: '11px',
                background: '#f1f5f9',
                color: '#475569',
                padding: '2px 6px',
                borderRadius: '10px',
              }}
            >
              {sections.length} chương • {totalLecturesCount} bài
            </span>
          </button>
          <button
            type="button"
            className={`editor-tab-item ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <span>Cài đặt học phí</span>
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div
            className="playlist-alert playlist-alert-error"
            style={{ margin: '16px 24px 0', fontSize: '13.5px' }}
          >
            <strong>Cảnh báo:</strong> {errorMsg}
          </div>
        )}

        {/* Thân Soạn Thảo */}
        <div className="editor-body">
          {/* ===================================================================
              TAB 1: THÔNG TIN CHUNG
             =================================================================== */}
          {activeTab === 'general' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
            >
              <div className="playlist-form-group">
                <label className="playlist-form-label">
                  Tiêu đề khóa học <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="playlist-input"
                  placeholder="Ví dụ: Lập trình Fullstack Next.js 15 & AI Agent chuyên sâu..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  required
                />
              </div>

              <div className="playlist-form-group">
                <label className="playlist-form-label">
                  Mô tả ngắn gọn (Hiển thị thẻ bài học){' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="playlist-textarea"
                  rows={2}
                  placeholder="Tóm tắt ngắn gọn 1-2 câu về mục tiêu đầu ra và đối tượng người học..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  maxLength={250}
                />
              </div>

              <div className="playlist-form-group">
                <label className="playlist-form-label">
                  Mô tả chi tiết khóa học{' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="playlist-textarea"
                  rows={4}
                  placeholder="Chi tiết nội dung giảng dạy, dự án thực tế, điều kiện tiên quyết..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
              >
                <div className="playlist-form-group">
                  <label className="playlist-form-label">
                    Danh mục ngành học{' '}
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="playlist-input"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">-- Chọn danh mục phù hợp --</option>
                    {categories.map((cat) => (
                      <option key={cat._id || cat.slug} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="playlist-form-group">
                  <label className="playlist-form-label">Cấp độ học viên</label>
                  <select
                    className="playlist-input"
                    value={level}
                    onChange={(e) =>
                      setLevel(
                        e.target.value as
                          'Beginner' | 'Intermediate' | 'Advanced',
                      )
                    }
                  >
                    <option value="Beginner">
                      Người mới bắt đầu (Beginner)
                    </option>
                    <option value="Intermediate">
                      Trung cấp (Intermediate)
                    </option>
                    <option value="Advanced">Nâng cao (Advanced)</option>
                  </select>
                </div>
              </div>

              <div className="playlist-form-group">
                <label className="playlist-form-label">
                  Ảnh đại diện khóa học (Thumbnail URL)
                </label>
                <div
                  style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                >
                  <input
                    type="text"
                    className="playlist-input"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  {thumbnailUrl && (
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail Preview"
                      style={{
                        width: '70px',
                        height: '42px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 2: ĐỀ CƯƠNG BÀI GIẢNG (SECTIONS & LECTURES)
             =================================================================== */}
          {activeTab === 'curriculum' && (
            <div className="curriculum-builder">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
                    Cấu trúc chương trình học (Curriculum)
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn-action-edit"
                  onClick={handleAddSection}
                >
                  <IconlyPlus size={15} color="#ffffff" />
                  <span>Thêm chương học mới</span>
                </button>
              </div>

              {sections.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#64748b',
                  }}
                >
                  <IconlyFolder size={40} color="#94a3b8" />
                  <p style={{ marginTop: '8px' }}>
                    Chưa có chương học nào. Hãy nhấn "+ Thêm chương học mới".
                  </p>
                </div>
              ) : (
                sections.map((section, secIdx) => (
                  <div key={secIdx} className="section-block">
                    {/* Header của Section */}
                    <div className="section-block-header">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flex: 1,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#34d399',
                          }}
                        >
                          Chương {secIdx + 1}:
                        </span>
                        <input
                          type="text"
                          className="section-title-input"
                          value={section.title}
                          onChange={(e) =>
                            handleUpdateSectionTitle(secIdx, e.target.value)
                          }
                          placeholder="Nhập tên chương học..."
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <button
                          type="button"
                          className="btn-action-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => handleOpenAddLecture(secIdx)}
                        >
                          <IconlyPlus size={14} />
                          <span>Thêm bài giảng</span>
                        </button>
                        <button
                          type="button"
                          className="btn-action-danger"
                          style={{ padding: '6px 8px' }}
                          title="Xóa chương này"
                          onClick={() => handleRemoveSection(secIdx)}
                        >
                          <IconlyDelete size={14} color="#dc2626" />
                        </button>
                      </div>
                    </div>

                    {/* Danh sách bài giảng trong Section */}
                    <div className="lectures-list">
                      {!section.lectures || section.lectures.length === 0 ? (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#94a3b8',
                            fontStyle: 'italic',
                          }}
                        >
                          Chưa có bài giảng nào trong chương này. Nhấn "Thêm bài
                          giảng" để tải video hoặc tài liệu.
                        </p>
                      ) : (
                        section.lectures.map((lecture, lecIdx) => (
                          <div key={lecIdx} className="lecture-card">
                            <div className="lecture-card-left">
                              <span
                                className={`lecture-badge-type ${
                                  lecture.type === 'VIDEO'
                                    ? 'type-video'
                                    : 'type-doc'
                                }`}
                              >
                                {lecture.type === 'VIDEO'
                                  ? 'Video'
                                  : 'Tài liệu'}
                              </span>

                              <div>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    fontSize: '13.5px',
                                    color: '#0f172a',
                                  }}
                                >
                                  {secIdx + 1}.{lecIdx + 1} {lecture.title}
                                </span>
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    display: 'flex',
                                    gap: '10px',
                                    marginTop: '3px',
                                  }}
                                >
                                  <span>
                                    {lecture.durationMinutes || 10} phút
                                  </span>
                                  {lecture.fileName && (
                                    <span>Tệp: {lecture.fileName}</span>
                                  )}
                                  {lecture.isPreview && (
                                    <span
                                      className="lecture-preview-tag"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <IconlyTick
                                        size={12}
                                        color="currentColor"
                                      />
                                      <span>Cho phép xem thử</span>
                                    </span>
                                  )}
                                  {lecture.transcript && (
                                    <span
                                      className="lecture-ai-ready-badge"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <IconlyAiChip
                                        size={13}
                                        color="currentColor"
                                      />
                                      <span>AI Transcript sẵn sàng</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="lecture-actions">
                              {/* Xem thử toggle */}
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '12px',
                                  color: '#cbd5e1',
                                  cursor: 'pointer',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(lecture.isPreview)}
                                  onChange={() =>
                                    handleTogglePreview(secIdx, lecIdx)
                                  }
                                />
                                <span>Xem thử (Preview)</span>
                              </label>

                              {/* Xem & Sửa transcript AI */}
                              <button
                                type="button"
                                className="btn-action-secondary"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11.5px',
                                  color: lecture.transcript
                                    ? '#c084fc'
                                    : '#94a3b8',
                                  borderColor: lecture.transcript
                                    ? 'rgba(192, 132, 252, 0.4)'
                                    : undefined,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                onClick={() =>
                                  handleOpenTranscriptModal(
                                    secIdx,
                                    lecIdx,
                                    lecture,
                                  )
                                }
                              >
                                <IconlyAiChip
                                  size={13}
                                  color={
                                    lecture.transcript ? '#c084fc' : '#94a3b8'
                                  }
                                />
                                <span>
                                  {lecture.transcript
                                    ? 'Xem / Sửa Transcript'
                                    : 'Thêm Transcript'}
                                </span>
                              </button>

                              <button
                                type="button"
                                className="btn-action-danger"
                                style={{ padding: '6px' }}
                                onClick={() =>
                                  handleRemoveLecture(secIdx, lecIdx)
                                }
                                title="Xóa bài học"
                              >
                                <IconlyDelete size={13} color="#dc2626" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Form thêm bài giảng (Drawer / Sub-card khi click Thêm bài giảng) */}
              {addingLectureSectionIdx !== null && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px dashed #0056d2',
                    borderRadius: '12px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <strong style={{ fontSize: '14px', color: '#60a5fa' }}>
                      Thêm bài giảng vào Chương {addingLectureSectionIdx + 1}
                    </strong>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                      onClick={() => setAddingLectureSectionIdx(null)}
                    >
                      <IconlyClose size={16} color="currentColor" />
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <label className="playlist-form-label">
                        Tên bài giảng
                      </label>
                      <input
                        type="text"
                        className="playlist-input"
                        placeholder="Ví dụ: Thiết lập dự án và chuẩn bị công cụ..."
                        value={newLectureTitle}
                        onChange={(e) => setNewLectureTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="playlist-form-label">Định dạng</label>
                      <select
                        className="playlist-input"
                        value={newLectureType}
                        onChange={(e) =>
                          setNewLectureType(e.target.value as LectureType)
                        }
                      >
                        <option value="VIDEO">Video bài giảng</option>
                        <option value="DOCUMENT">Tài liệu PDF / Bài đọc</option>
                      </select>
                    </div>
                    <div>
                      <label className="playlist-form-label">
                        Thời lượng (phút)
                      </label>
                      <input
                        type="number"
                        className="playlist-input"
                        value={newLectureDuration}
                        onChange={(e) =>
                          setNewLectureDuration(Number(e.target.value))
                        }
                        min={1}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newLectureIsPreview}
                        onChange={(e) =>
                          setNewLectureIsPreview(e.target.checked)
                        }
                      />
                      <span>
                        Đánh dấu cho phép học viên{' '}
                        <strong>Xem thử miễn phí (Preview)</strong>
                      </span>
                    </label>

                    {/* Nút Upload tệp thực tế */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <label
                        className="btn-action-edit"
                        style={{
                          cursor: uploadingMedia ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <span>
                          {uploadingMedia
                            ? 'Đang nén & trích xuất AI...'
                            : 'Tải file Video/PDF (< 2GB)'}
                        </span>
                        <input
                          type="file"
                          accept={
                            newLectureType === 'VIDEO'
                              ? 'video/mp4,video/mkv,video/webm'
                              : 'application/pdf'
                          }
                          style={{ display: 'none' }}
                          disabled={uploadingMedia}
                          onChange={handleSimulateFileUpload}
                        />
                      </label>

                      <button
                        type="button"
                        className="btn-action-secondary"
                        onClick={handleAddLectureQuick}
                        disabled={uploadingMedia || !newLectureTitle.trim()}
                      >
                        Tạo nhanh bài giảng
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              TAB 3: CÀI ĐẶT HỌC PHÍ (PRICING & BADGES)
             =================================================================== */}
          {activeTab === 'pricing' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxWidth: '600px',
              }}
            >
              <div className="playlist-form-group">
                <label className="playlist-form-label">
                  Giá gốc khóa học (VNĐ){' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  className="playlist-input"
                  value={price}
                  onChange={(e) =>
                    setPrice(Math.max(0, Number(e.target.value)))
                  }
                  placeholder="0 (Miễn phí) hoặc ví dụ: 1200000"
                  step={10000}
                />
                <span
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: 'block',
                    marginTop: '4px',
                  }}
                >
                  Hiển thị:{' '}
                  <strong>{price <= 0 ? 'Miễn phí' : formatVND(price)}</strong>
                </span>
              </div>

              <div className="playlist-form-group">
                <label className="playlist-form-label">
                  Giá khuyến mãi (VNĐ - Tùy chọn)
                </label>
                <input
                  type="number"
                  className="playlist-input"
                  value={discountPrice}
                  onChange={(e) =>
                    setDiscountPrice(Math.max(0, Number(e.target.value)))
                  }
                  placeholder="Ví dụ: 890000"
                  step={10000}
                />
                {Number(discountPrice) > 0 &&
                  Number(discountPrice) >= (Number(price) || 0) && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12.5px',
                        color: '#f87171',
                        marginTop: '6px',
                        fontWeight: 500,
                      }}
                    >
                      <IconlyDanger size={14} color="#f87171" />
                      <span>
                        Giá khuyến mãi phải nhỏ hơn giá gốc ban đầu của khóa
                        học.
                      </span>
                    </div>
                  )}
              </div>

              <div className="playlist-form-group">
                <label className="playlist-form-label">
                  Huy hiệu nổi bật (Badge)
                </label>
                <select
                  className="playlist-input"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                >
                  <option value="">-- Không sử dụng huy hiệu --</option>
                  <option value="NEW">MỚI (NEW)</option>
                  <option value="HOT">HOT</option>
                  <option value="BESTSELLER">BÁN CHẠY (BESTSELLER)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Modal Xem & Chỉnh sửa Transcript AI của bài giảng */}
        {activeTranscriptLec && (
          <div
            className="editor-modal-backdrop"
            style={{ zIndex: 1200 }}
            onClick={() => {
              setActiveTranscriptLec(null);
              setIsEditingModalTranscript(false);
            }}
          >
            <div
              className="playlist-modal-dialog"
              style={{ maxWidth: '680px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="playlist-modal-header">
                <div>
                  <h3
                    className="playlist-modal-title"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <IconlyAiChip size={18} color="#c084fc" />
                    <span>Transcript phụ đề (AI RAG)</span>
                  </h3>
                  <p className="playlist-modal-subtitle">
                    Bài giảng: <strong>{activeTranscriptLec.title}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="playlist-modal-close-btn"
                  onClick={() => {
                    setActiveTranscriptLec(null);
                    setIsEditingModalTranscript(false);
                  }}
                >
                  <IconlyClose size={18} />
                </button>
              </div>
              <div className="playlist-modal-body">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                    Nội dung transcript được nạp vào ChromaDB vector store để
                    Trợ lý AI tra cứu và giải đáp bài học.
                  </span>
                  <label
                    style={{
                      cursor: 'pointer',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      color: '#334155',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      userSelect: 'none',
                    }}
                    title="Tải lên tệp phụ đề .srt, .vtt hoặc .txt từ máy tính"
                  >
                    <IconlyFolder size={12} color="#a78bfa" />
                    <span>Tải tệp phụ đề (.srt, .vtt)</span>
                    <input
                      type="file"
                      accept=".srt,.vtt,.txt"
                      style={{ display: 'none' }}
                      onChange={handleUploadModalSubtitle}
                    />
                  </label>
                </div>

                {modalTranscriptNotice && (
                  <div
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      color: '#93c5fd',
                      fontSize: '12px',
                      marginBottom: '10px',
                    }}
                  >
                    {modalTranscriptNotice}
                  </div>
                )}

                {isEditingModalTranscript ? (
                  <div>
                    <textarea
                      value={modalTranscriptDraft}
                      onChange={(e) => setModalTranscriptDraft(e.target.value)}
                      placeholder="Nhập hoặc dán lời nói bài giảng có kèm mốc thời gian:&#10;[00:00] Xin chào các bạn...&#10;[01:15] Nội dung bài học..."
                      rows={10}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #0056d2',
                        borderRadius: '6px',
                        color: '#0f172a',
                        fontFamily: 'monospace',
                        fontSize: '12.5px',
                        lineHeight: '1.6',
                        padding: '10px 12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        color: '#64748b',
                      }}
                    >
                      * Hỗ trợ mốc thời gian dạng [mm:ss] để AI RAG đối chiếu
                      chính xác theo video.
                    </div>
                  </div>
                ) : activeTranscriptLec.transcript ? (
                  <div
                    className="transcript-box"
                    style={{ margin: 0, maxHeight: '280px' }}
                  >
                    {activeTranscriptLec.transcript}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '24px 12px',
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '6px',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 10px 0',
                        fontSize: '13px',
                        color: '#64748b',
                      }}
                    >
                      Bài giảng này chưa có nội dung phụ đề transcript.
                    </p>
                    <button
                      type="button"
                      style={{
                        background: '#0056d2',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        color: '#ffffff',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setModalTranscriptDraft('');
                        setIsEditingModalTranscript(true);
                      }}
                    >
                      Nhập nội dung transcript thủ công
                    </button>
                  </div>
                )}
              </div>
              <div
                className="playlist-modal-footer"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  {activeTranscriptLec.transcript &&
                    !isEditingModalTranscript && (
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                        onClick={() => {
                          setModalTranscriptDraft('');
                          handleSaveModalTranscript();
                        }}
                      >
                        Xóa transcript
                      </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isEditingModalTranscript ? (
                    <>
                      <button
                        type="button"
                        className="btn-action-secondary"
                        onClick={() => {
                          setModalTranscriptDraft(
                            activeTranscriptLec.transcript || '',
                          );
                          setIsEditingModalTranscript(false);
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="playlist-btn-primary"
                        style={{
                          background: '#10b981',
                          borderColor: '#10b981',
                        }}
                        onClick={handleSaveModalTranscript}
                      >
                        Lưu Transcript
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-action-secondary"
                        onClick={() => {
                          setModalTranscriptDraft(
                            activeTranscriptLec.transcript || '',
                          );
                          setIsEditingModalTranscript(true);
                        }}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        className="playlist-btn-primary"
                        onClick={() => {
                          setActiveTranscriptLec(null);
                          setIsEditingModalTranscript(false);
                        }}
                      >
                        Đóng
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="editor-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Trạng thái: <strong>{course.status}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn-action-secondary"
              onClick={handleSaveDraft}
              disabled={submitting}
            >
              {submitting ? 'Đang lưu...' : 'Lưu nháp (DRAFT)'}
            </button>

            <button
              type="button"
              className="btn-action-submit"
              onClick={handleSubmitApproval}
              disabled={submitting}
            >
              {submitting ? 'Đang gửi duyệt...' : 'Gửi phê duyệt lên Admin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
