import React, { useState, useRef } from 'react';
import type {
  InstructorCourse,
  SectionItem,
  LectureItem,
  LectureType,
} from '../../types/instructorCourse';
import type { Category } from '../../types/course';
import {
  createCourseDraft,
  updateInstructorCourse,
  uploadLectureMedia,
  uploadCourseThumbnail,
  submitCourseForApproval,
} from '../../services/instructorCourseApi';
import {
  IconlyFolder,
  IconlyPlus,
  IconlyDelete,
  IconlyArrowLeft,
  IconlyTick,
  IconlyDanger,
  IconlyImage,
  IconlyTimeCircle,
  IconlyAiChip,
  IconlyClose,
} from '../Onboarding/IconlyIcons';
import { formatVND } from '../../utils/format';

interface CourseEditorViewProps {
  course: InstructorCourse | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: (course: InstructorCourse, message: string) => void;
}

export const CourseEditorView: React.FC<CourseEditorViewProps> = ({
  course: initialCourse,
  categories,
  onClose,
  onSuccess,
}) => {
  // Trạng thái khóa học hiện tại (có thể null nếu đang tạo mới tinh)
  const [currentCourse, setCurrentCourse] = useState<InstructorCourse | null>(
    initialCourse,
  );

  // Tabs: 'general' | 'curriculum' | 'pricing' (Basic flow step 2)
  const [activeTab, setActiveTab] = useState<
    'general' | 'curriculum' | 'pricing'
  >('general');

  // Form State: Tab 1 - Thông tin chung
  const [title, setTitle] = useState<string>(initialCourse?.title || '');
  const [shortDescription, setShortDescription] = useState<string>(
    initialCourse?.shortDescription || '',
  );
  const [description, setDescription] = useState<string>(
    initialCourse?.description || '',
  );
  const [categoryId, setCategoryId] = useState<string>(() => {
    if (!initialCourse) return categories[0]?._id || '';
    return typeof initialCourse.categoryId === 'object' &&
      initialCourse.categoryId?._id
      ? initialCourse.categoryId._id
      : (initialCourse.categoryId as string) || '';
  });
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(
    initialCourse?.level || 'Beginner',
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    initialCourse?.thumbnailUrl ||
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
  );

  // Form State: Tab 2 - Đề cương bài giảng (Sections & Lectures)
  const [sections, setSections] = useState<SectionItem[]>(() => {
    if (initialCourse?.sections && initialCourse.sections.length > 0) {
      return initialCourse.sections;
    }
    return [
      {
        title: 'Chương 1: Tổng quan và chuẩn bị môi trường',
        order: 1,
        lectures: [],
      },
    ];
  });

  // Form State: Tab 3 - Cài đặt học phí
  const [price, setPrice] = useState<number>(initialCourse?.price || 0);
  const [discountPrice, setDiscountPrice] = useState<number>(
    initialCourse?.discountPrice || 0,
  );
  const [badge, setBadge] = useState<string>(initialCourse?.badge || '');

  // Trạng thái xử lý & lỗi
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeTranscriptLec, setActiveTranscriptLec] =
    useState<LectureItem | null>(null);

  // Thêm bài giảng vào chương (drawer nội bộ, không popup modal)
  const [addingLectureSectionIdx, setAddingLectureSectionIdx] = useState<
    number | null
  >(null);
  const [newLectureTitle, setNewLectureTitle] = useState<string>('');
  const [newLectureType, setNewLectureType] = useState<LectureType>('VIDEO');
  const [newLectureDuration, setNewLectureDuration] = useState<number>(15);
  const [newLectureIsPreview, setNewLectureIsPreview] =
    useState<boolean>(false);
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);

  // Upload Ảnh Thumbnail lên Cloudinary
  const [uploadingThumbnail, setUploadingThumbnail] = useState<boolean>(false);
  const [thumbnailUploadSuccess, setThumbnailUploadSuccess] =
    useState<boolean>(false);
  const thumbnailFileInputRef = useRef<HTMLInputElement | null>(null);

  // Xử lý chọn ảnh từ máy tính & tải lên Cloudinary
  const handleThumbnailFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(
        'Vui lòng chọn tệp ảnh hợp lệ (.jpg, .jpeg, .png, .webp, .gif)',
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh tải lên không được vượt quá 10MB');
      return;
    }

    setUploadingThumbnail(true);
    setErrorMsg('');
    try {
      const res = await uploadCourseThumbnail(file, currentCourse?._id);
      setThumbnailUrl(res.url || res.thumbnailUrl);
      setThumbnailUploadSuccess(true);
      setTimeout(() => setThumbnailUploadSuccess(false), 4500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi tải ảnh lên');
    } finally {
      setUploadingThumbnail(false);
      if (thumbnailFileInputRef.current) {
        thumbnailFileInputRef.current.value = '';
      }
    }
  };

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

  // Cập nhật tiêu đề chương
  const handleUpdateSectionTitle = (index: number, newTitle: string) => {
    const updated = [...sections];
    updated[index].title = newTitle;
    setSections(updated);
  };

  // Xóa chương
  const handleRemoveSection = (index: number) => {
    if (sections.length <= 1) {
      setErrorMsg('Khóa học phải duy trì tối thiểu 1 chương học');
      return;
    }
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
  };

  // Mở drawer thêm bài giảng cho Section
  const handleOpenAddLecture = (sectionIndex: number) => {
    setAddingLectureSectionIdx(sectionIndex);
    setNewLectureTitle('');
    setNewLectureType('VIDEO');
    setNewLectureDuration(15);
    setNewLectureIsPreview(false);
    setErrorMsg('');
  };

  // Thêm bài giảng vào section
  const handleSaveNewLecture = (sectionIndex: number) => {
    if (!newLectureTitle.trim()) {
      setErrorMsg('Vui lòng nhập tên bài giảng');
      return;
    }

    const currentSecLectures = sections[sectionIndex].lectures || [];
    const newLec: LectureItem = {
      title: newLectureTitle.trim(),
      type: newLectureType,
      durationMinutes: Number(newLectureDuration) || 10,
      isPreview: newLectureIsPreview,
      order: currentSecLectures.length + 1,
    };

    const updated = [...sections];
    updated[sectionIndex].lectures = [...currentSecLectures, newLec];
    setSections(updated);
    setAddingLectureSectionIdx(null);
  };

  // Bật/Tắt xem thử miễn phí (Preview) - Basic flow step 6
  const handleTogglePreview = (sectionIndex: number, lectureIndex: number) => {
    const updated = [...sections];
    const lec = updated[sectionIndex].lectures[lectureIndex];
    lec.isPreview = !lec.isPreview;
    setSections(updated);
  };

  // Xóa bài giảng
  const handleRemoveLecture = (sectionIndex: number, lectureIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].lectures = updated[sectionIndex].lectures.filter(
      (_, i) => i !== lectureIndex,
    );
    setSections(updated);
  };

  // Tải file bài giảng (Kiểm tra dung lượng <= 2GB theo BR06.2 & Exception 5b)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionIndex: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra dung lượng 2GB (2 * 1024 * 1024 * 1024 bytes) - BR06.2 & Exception 5b
    const maxSizeBytes = 2 * 1024 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg('Định dạng file không hỗ trợ hoặc dung lượng vượt quá 2GB');
      return;
    }

    if (!newLectureTitle.trim()) {
      setNewLectureTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    setUploadingMedia(true);
    setErrorMsg('');
    try {
      const res = await uploadLectureMedia(currentCourse?._id, {
        lectureTitle: newLectureTitle.trim() || file.name,
        type: file.type.includes('pdf') ? 'DOCUMENT' : 'VIDEO',
        fileName: file.name,
        fileSize: file.size,
        durationMinutes: Number(newLectureDuration) || 15,
        isPreview: newLectureIsPreview,
        file,
      });
      const uploadedData = res.data;

      const currentSecLectures = sections[sectionIndex].lectures || [];
      const newLec: LectureItem = {
        title: uploadedData.title || newLectureTitle.trim() || file.name,
        type:
          uploadedData.type ||
          (file.type.includes('pdf') ? 'DOCUMENT' : 'VIDEO'),
        durationMinutes: uploadedData.durationMinutes || 15,
        contentUrl: uploadedData.contentUrl,
        fileName: uploadedData.fileName,
        fileSize: uploadedData.fileSize,
        isPreview: newLectureIsPreview,
        transcript: uploadedData.transcript,
        order: currentSecLectures.length + 1,
      };

      const updated = [...sections];
      updated[sectionIndex].lectures = [...currentSecLectures, newLec];
      setSections(updated);
      setAddingLectureSectionIdx(null);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Lỗi khi tải file bài giảng. Vui lòng kiểm tra định dạng hoặc dung lượng < 2GB',
      );
    } finally {
      setUploadingMedia(false);
    }
  };

  // Chuẩn bị payload
  const buildPayload = () => {
    const payload: Partial<InstructorCourse> = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      categoryId: categoryId || undefined,
      level,
      thumbnailUrl: thumbnailUrl.trim(),
      sections,
      price: Number(price) || 0,
      discountPrice: Number(discountPrice) || 0,
      badge: badge || undefined,
    };
    return payload;
  };

  // Alternative Flow 7a: Lưu nháp (DRAFT)
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề khóa học');
      setActiveTab('general');
      return;
    }

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
      let savedCourse: InstructorCourse;
      if (currentCourse?._id) {
        const res = await updateInstructorCourse(
          currentCourse._id,
          buildPayload(),
        );
        savedCourse = res.data;
      } else {
        const res = await createCourseDraft(buildPayload());
        savedCourse = res.data;
        setCurrentCourse(savedCourse);
      }
      onSuccess(savedCourse, 'Lưu bản nháp thành công! (DRAFT)');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu khóa học');
    } finally {
      setSubmitting(false);
    }
  };

  // Basic Flow Step 7 & 8: Gửi phê duyệt (BR06.1, Exception 8a1)
  const handleSubmitApproval = async () => {
    // 1. Kiểm tra thông tin chung
    if (!title.trim() || !shortDescription.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Tiêu đề và Mô tả ngắn cho khóa học');
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
    if (sections.length < 1 || totalLecturesCount < 3) {
      setErrorMsg(
        'Khóa học phải có tối thiểu 1 chương và 3 bài giảng có nội dung trước khi gửi duyệt',
      );
      setActiveTab('curriculum');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      let targetCourseId = currentCourse?._id;
      if (!targetCourseId) {
        const createRes = await createCourseDraft(buildPayload());
        targetCourseId = createRes.data._id;
        setCurrentCourse(createRes.data);
      } else {
        await updateInstructorCourse(targetCourseId, buildPayload());
      }

      if (!targetCourseId) {
        throw new Error('Không thể khởi tạo mã khóa học');
      }

      // Gửi yêu cầu phê duyệt
      const res = await submitCourseForApproval(targetCourseId);
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

  const currentStatus = currentCourse?.status || 'DRAFT';

  return (
    <div className="course-editor-page">
      <div className="course-editor-container">
        {/* Topbar điều hướng quay lại */}
        <div className="course-editor-topbar">
          <button type="button" className="editor-back-btn" onClick={onClose}>
            <IconlyArrowLeft size={16} />
            <span>Quay lại danh sách khóa học</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              className={`course-status-badge badge-${currentStatus.toLowerCase()}`}
              style={{ position: 'static' }}
            >
              {currentStatus}
            </span>
          </div>
        </div>

        {/* Tiêu đề trang soạn thảo */}
        <div className="course-editor-header">
          <h1 className="course-editor-title">
            {currentCourse?.title
              ? `Soạn thảo: ${currentCourse.title}`
              : 'Khởi tạo khóa học mới'}
          </h1>
          <p className="course-editor-subtitle">
            Tổ chức đề cương bài giảng, tải video/tài liệu bài giảng, trích xuất
            transcript AI và cấu hình học phí
          </p>
        </div>

        {/* Thanh cảnh báo lỗi (nếu có) */}
        {errorMsg && (
          <div className="editor-alert-error" style={{ marginBottom: '20px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <IconlyDanger size={16} color="#fca5a5" />
              <span>{errorMsg}</span>
            </span>
          </div>
        )}

        {/* 3 Tabs Điều Hướng (Basic flow step 2) */}
        <div
          className="editor-tabs-nav"
          style={{ borderRadius: '12px 12px 0 0' }}
        >
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
                background: '#1e293b',
                color: '#cbd5e1',
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

        {/* Nội dung Editor theo Tab */}
        <div
          className="editor-body"
          style={{
            borderRadius: '0 0 12px 12px',
            border: '1px solid #1f2937',
            borderTop: 'none',
            marginBottom: '24px',
          }}
        >
          {/* ===================================================================
              TAB 1: THÔNG TIN CHUNG (Tiêu đề, mô tả, danh mục, cấp độ, ảnh)
             =================================================================== */}
          {activeTab === 'general' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                maxWidth: '850px',
              }}
            >
              <div className="editor-form-group">
                <label className="editor-form-label">
                  Tiêu đề khóa học <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="editor-form-input"
                  placeholder="Ví dụ: Lập trình fullstack với React và Node.js..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={160}
                />
              </div>

              <div className="editor-form-group">
                <label className="editor-form-label">
                  Mô tả ngắn gọn (Hiển thị thẻ bài học){' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="editor-form-input"
                  placeholder="Tóm tắt ngắn gọn giá trị cốt lõi của khóa học trong 1-2 câu..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  maxLength={250}
                />
              </div>

              <div className="editor-form-group">
                <label className="editor-form-label">
                  Mô tả chi tiết khóa học{' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="editor-form-textarea"
                  style={{ minHeight: '140px' }}
                  placeholder="Mô tả lộ trình học tập, đối tượng phù hợp, yêu cầu đầu vào..."
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
                <div className="editor-form-group">
                  <label className="editor-form-label">
                    Danh mục ngành học{' '}
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="editor-form-input"
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

                <div className="editor-form-group">
                  <label className="editor-form-label">Cấp độ học viên</label>
                  <select
                    className="editor-form-input"
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

              <div className="editor-form-group">
                <label className="editor-form-label">
                  Ảnh đại diện khóa học{' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#94a3b8',
                    margin: '0 0 12px 0',
                  }}
                >
                  Tải ảnh từ máy tính để hiển thị trên danh mục khóa học, trang
                  chi tiết và thẻ bài học.
                </p>

                {/* Input chọn file ẩn */}
                <input
                  type="file"
                  ref={thumbnailFileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleThumbnailFileChange}
                  disabled={uploadingThumbnail}
                />

                <div className="thumbnail-upload-box">
                  {thumbnailUrl ? (
                    <div className="thumbnail-card-active">
                      <div className="thumbnail-img-holder">
                        <img
                          src={thumbnailUrl}
                          alt="Course Thumbnail"
                          className="thumbnail-active-img"
                        />
                      </div>

                      <div className="thumbnail-actions-holder">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                            marginBottom: '12px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '13.5px',
                              fontWeight: 700,
                              color: '#f8fafc',
                            }}
                          >
                            Ảnh đại diện khóa học
                          </span>
                          {thumbnailUploadSuccess && (
                            <span
                              style={{
                                fontSize: '12px',
                                color: '#34d399',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <IconlyTick size={14} color="#34d399" /> Tải lên
                              thành công!
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            type="button"
                            className="btn-upload-thumbnail"
                            onClick={() =>
                              thumbnailFileInputRef.current?.click()
                            }
                            disabled={uploadingThumbnail}
                          >
                            {uploadingThumbnail ? (
                              <>
                                <IconlyTimeCircle size={15} color="#ffffff" />
                                <span>Đang tải ảnh lên...</span>
                              </>
                            ) : (
                              <>
                                <IconlyFolder size={15} color="#ffffff" />
                                <span>Chọn ảnh khác từ máy tính</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn-remove-thumbnail"
                            onClick={() => setThumbnailUrl('')}
                            disabled={uploadingThumbnail}
                          >
                            Xóa ảnh
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="thumbnail-empty-dropzone"
                      onClick={() =>
                        !uploadingThumbnail &&
                        thumbnailFileInputRef.current?.click()
                      }
                    >
                      <div className="dropzone-cloud-icon">
                        {uploadingThumbnail ? (
                          <IconlyTimeCircle size={36} color="#34d399" />
                        ) : (
                          <IconlyImage size={36} color="#34d399" />
                        )}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            color: '#34d399',
                            fontSize: '14.5px',
                            fontWeight: 700,
                          }}
                        >
                          {uploadingThumbnail
                            ? 'Đang tải ảnh lên...'
                            : 'Nhấn để chọn ảnh từ máy tính của bạn'}
                        </div>
                        <div
                          style={{
                            fontSize: '12.5px',
                            color: '#94a3b8',
                            marginTop: '4px',
                          }}
                        >
                          Hỗ trợ định dạng JPG, PNG, WEBP, GIF (Tối đa 10MB)
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-upload-thumbnail"
                        style={{ marginTop: '6px' }}
                        disabled={uploadingThumbnail}
                      >
                        {uploadingThumbnail
                          ? 'Đang xử lý...'
                          : 'Chọn từ máy tính'}
                      </button>
                    </div>
                  )}

                  {/* Nhập link trực tiếp nếu muốn */}
                  <details
                    style={{
                      marginTop: '12px',
                      fontSize: '12.5px',
                      color: '#94a3b8',
                    }}
                  >
                    <summary
                      style={{
                        cursor: 'pointer',
                        outline: 'none',
                        userSelect: 'none',
                        color: '#64748b',
                      }}
                    >
                      Hoặc nhập liên kết URL ảnh thủ công
                    </summary>
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        className="editor-form-input"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </details>
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
                  borderBottom: '1px solid #1f2937',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>
                    Cấu trúc chương trình học (Curriculum)
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn-create-course"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
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
                          <div
                            key={lecIdx}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div className="lecture-card">
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
                                      color: '#f8fafc',
                                    }}
                                  >
                                    {secIdx + 1}.{lecIdx + 1} {lecture.title}
                                  </span>
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: '#94a3b8',
                                      display: 'flex',
                                      gap: '10px',
                                      marginTop: '3px',
                                      flexWrap: 'wrap',
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

                                {/* Xem transcript AI - Mở trực tiếp inline */}
                                {lecture.transcript && (
                                  <button
                                    type="button"
                                    className="btn-action-secondary"
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '11.5px',
                                    }}
                                    onClick={() =>
                                      setActiveTranscriptLec(
                                        activeTranscriptLec?.title ===
                                          lecture.title
                                          ? null
                                          : lecture,
                                      )
                                    }
                                  >
                                    {activeTranscriptLec?.title ===
                                    lecture.title
                                      ? 'Đóng Transcript'
                                      : 'Xem Transcript AI'}
                                  </button>
                                )}

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

                            {/* Transcript hiển thị inline bên dưới bài giảng (Không modal popup) */}
                            {activeTranscriptLec?.title === lecture.title &&
                              lecture.transcript && (
                                <div
                                  style={{
                                    background: '#080c14',
                                    border: '1px solid #1f2937',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    margin: '2px 0 6px 0',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      marginBottom: '8px',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#a78bfa',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <IconlyAiChip size={14} color="#a78bfa" />
                                      <span>
                                        Transcript phụ đề trích xuất tự động cho
                                        AI RAG:
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                      onClick={() =>
                                        setActiveTranscriptLec(null)
                                      }
                                    >
                                      <IconlyClose
                                        size={13}
                                        color="currentColor"
                                      />
                                      <span>Đóng</span>
                                    </button>
                                  </div>
                                  <div
                                    className="transcript-box"
                                    style={{ margin: 0 }}
                                  >
                                    {lecture.transcript}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Form thêm bài giảng (Inline Builder cho Section) */}
                    {addingLectureSectionIdx === secIdx && (
                      <div
                        style={{
                          background: '#0d131f',
                          borderTop: '1px solid #1f2937',
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
                          <strong
                            style={{ fontSize: '14px', color: '#60a5fa' }}
                          >
                            Thêm bài giảng vào Chương {secIdx + 1}
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
                            <label className="editor-form-label">
                              Tên bài giảng
                            </label>
                            <input
                              type="text"
                              className="editor-form-input"
                              placeholder="Ví dụ: Thiết lập dự án và chuẩn bị công cụ..."
                              value={newLectureTitle}
                              onChange={(e) =>
                                setNewLectureTitle(e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="editor-form-label">
                              Định dạng
                            </label>
                            <select
                              className="editor-form-input"
                              value={newLectureType}
                              onChange={(e) =>
                                setNewLectureType(e.target.value as LectureType)
                              }
                            >
                              <option value="VIDEO">Video bài giảng</option>
                              <option value="DOCUMENT">Tài liệu / PDF</option>
                            </select>
                          </div>
                          <div>
                            <label className="editor-form-label">
                              Thời lượng (phút)
                            </label>
                            <input
                              type="number"
                              className="editor-form-input"
                              value={newLectureDuration}
                              onChange={(e) =>
                                setNewLectureDuration(
                                  Math.max(1, Number(e.target.value)),
                                )
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
                              color: '#cbd5e1',
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
                              Cho phép học viên xem thử miễn phí (Preview)
                            </span>
                          </label>

                          {/* Upload Media Button */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                          >
                            <label
                              className="btn-action-secondary"
                              style={{
                                cursor: uploadingMedia
                                  ? 'not-allowed'
                                  : 'pointer',
                              }}
                            >
                              {uploadingMedia ? (
                                <>
                                  <IconlyTimeCircle
                                    size={14}
                                    color="currentColor"
                                  />
                                  <span>
                                    Đang nén & trích xuất transcript AI...
                                  </span>
                                </>
                              ) : (
                                <span>Tải video / PDF bài học (Max 2GB)</span>
                              )}
                              <input
                                type="file"
                                accept="video/*,application/pdf"
                                style={{ display: 'none' }}
                                disabled={uploadingMedia}
                                onChange={(e) => handleFileUpload(e, secIdx)}
                              />
                            </label>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '6px',
                          }}
                        >
                          <button
                            type="button"
                            className="btn-action-secondary"
                            onClick={() => setAddingLectureSectionIdx(null)}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            className="btn-create-course"
                            style={{ padding: '6px 16px', fontSize: '13px' }}
                            onClick={() => handleSaveNewLecture(secIdx)}
                          >
                            Lưu bài giảng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================================================================
              TAB 3: CÀI ĐẶT HỌC PHÍ (Pricing & Badge)
             =================================================================== */}
          {activeTab === 'pricing' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxWidth: '650px',
              }}
            >
              <div className="editor-form-group">
                <label className="editor-form-label">
                  Giá gốc khóa học (VNĐ){' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  className="editor-form-input"
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
                    color: '#94a3b8',
                    display: 'block',
                    marginTop: '4px',
                  }}
                >
                  Hiển thị:{' '}
                  <strong style={{ color: '#34d399' }}>
                    {price <= 0 ? 'Miễn phí' : formatVND(price)}
                  </strong>
                </span>
              </div>

              <div className="editor-form-group">
                <label className="editor-form-label">
                  Giá khuyến mãi (VNĐ - Tùy chọn)
                </label>
                <input
                  type="number"
                  className="editor-form-input"
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

              <div className="editor-form-group">
                <label className="editor-form-label">
                  Huy hiệu nổi bật (Badge)
                </label>
                <select
                  className="editor-form-input"
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

        {/* Thanh công cụ dưới cùng (Bottom Action Bar) */}
        <div
          style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="btn-action-secondary"
            onClick={onClose}
          >
            <IconlyArrowLeft size={14} color="currentColor" />
            <span>Hủy & Quay lại</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn-action-secondary"
              onClick={handleSaveDraft}
              disabled={submitting}
            >
              {submitting ? 'Đang lưu...' : 'Lưu bản nháp (Draft)'}
            </button>
            <button
              type="button"
              className="btn-create-course"
              onClick={handleSubmitApproval}
              disabled={submitting}
            >
              <IconlyTick size={16} />
              <span>
                {submitting
                  ? 'Đang gửi...'
                  : 'Gửi phê duyệt (Pending Approval)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
