import React, { useState, useRef } from 'react';
import type {
  InstructorCourse,
  SectionItem,
  LectureItem,
  LectureType,
  QuizDataItem,
} from '../../types/instructorCourse';
import { AiQuizGenerator } from './AiQuizGenerator';
import type { Category } from '../../types/course';
import {
  createCourseDraft,
  updateInstructorCourse,
  uploadLectureMedia,
  uploadCourseThumbnail,
  submitCourseForApproval,
  updateLectureTranscript,
  transcribeLectureWithAI,
} from '../../services/instructorCourseApi';
import { parseSubtitleToTranscript } from '../../utils/subtitleParser';
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
  IconlySparkles,
} from '../Onboarding/IconlyIcons';
import { formatVND } from '../../utils/format';
import { toast } from '../../context/ToastContext';

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
  const [badge] = useState<string>(initialCourse?.badge || '');

  // Trạng thái xử lý & lỗi
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Quản lý xem & chỉnh sửa Transcript bài giảng
  const [activeTranscriptLoc, setActiveTranscriptLoc] = useState<{
    secIdx: number;
    lecIdx: number;
  } | null>(null);
  const [isEditingTranscript, setIsEditingTranscript] =
    useState<boolean>(false);
  const [transcriptDraft, setTranscriptDraft] = useState<string>('');
  const [transcriptNotice, setTranscriptNotice] = useState<string>('');
  const [transcribingLecKey, setTranscribingLecKey] = useState<string | null>(
    null,
  );

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

  // AI Quiz states
  const [editingQuizData, setEditingQuizData] = useState<QuizDataItem | null>(
    null,
  );
  const [activeQuizLoc, setActiveQuizLoc] = useState<{
    secIdx: number;
    lecIdx: number;
  } | null>(null);
  const [addingQuizSectionIdx, setAddingQuizSectionIdx] = useState<
    number | null
  >(null);
  const [quizPresetContext, setQuizPresetContext] = useState<{
    topic: string;
    content: string;
  } | null>(null);

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
    setAddingQuizSectionIdx(null);
    setNewLectureTitle('');
    setNewLectureType('VIDEO');
    setNewLectureDuration(15);
    setNewLectureIsPreview(false);
    setEditingQuizData(null);
    setErrorMsg('');
  };

  // Mở trình tạo Quiz bằng AI cho Chương học
  const handleOpenAiQuizForSection = (
    sectionIndex: number,
    specificLecture?: LectureItem,
  ) => {
    setAddingLectureSectionIdx(null);
    setAddingQuizSectionIdx(sectionIndex);
    if (specificLecture) {
      setQuizPresetContext({
        topic: `Kiểm tra: ${specificLecture.title}`,
        content: specificLecture.transcript || specificLecture.title,
      });
    } else {
      const sec = sections[sectionIndex];
      setQuizPresetContext({
        topic: `Kiểm tra: ${sec.title || `Chương ${sectionIndex + 1}`}`,
        content:
          sec.lectures?.map((l) => l.transcript || l.title).join('\n') || '',
      });
    }
    setErrorMsg('');
  };

  // Thêm bài giảng vào section
  const handleSaveNewLecture = async (sectionIndex: number) => {
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
      quizData:
        newLectureType === 'QUIZ' ? editingQuizData || undefined : undefined,
    };

    const updated = [...sections];
    updated[sectionIndex].lectures = [...currentSecLectures, newLec];
    setSections(updated);
    setAddingLectureSectionIdx(null);
    setEditingQuizData(null);

    if (currentCourse?._id) {
      try {
        await updateInstructorCourse(currentCourse._id, {
          sections: updated,
        });
        toast.success(
          `Đã thêm và lưu bài giảng "${newLec.title}" vào khóa học!`,
        );
      } catch (err) {
        console.warn('Lỗi tự động lưu bài giảng:', err);
      }
    }
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

  // Xử lý bật/tắt xem & chỉnh sửa Transcript cho 1 bài giảng
  const handleToggleTranscript = (
    secIdx: number,
    lecIdx: number,
    lecture: LectureItem,
  ) => {
    if (
      activeTranscriptLoc?.secIdx === secIdx &&
      activeTranscriptLoc?.lecIdx === lecIdx
    ) {
      setActiveTranscriptLoc(null);
      setIsEditingTranscript(false);
      setTranscriptNotice('');
    } else {
      setActiveTranscriptLoc({ secIdx, lecIdx });
      setTranscriptDraft(lecture.transcript || '');
      setIsEditingTranscript(!lecture.transcript);
      setTranscriptNotice('');
    }
  };

  // Lưu nội dung Transcript
  const handleSaveTranscript = async (secIdx: number, lecIdx: number) => {
    const trimmed = transcriptDraft.trim();
    const updated = [...sections];
    const targetLec = updated[secIdx]?.lectures?.[lecIdx];
    if (!targetLec) return;

    targetLec.transcript = trimmed;
    targetLec.transcriptStatus = trimmed ? 'COMPLETED' : 'PENDING';
    setSections(updated);
    setIsEditingTranscript(false);
    setTranscriptNotice('Đã lưu nội dung transcript thành công!');

    if (currentCourse?._id && targetLec._id) {
      try {
        await updateLectureTranscript(
          currentCourse._id,
          targetLec._id,
          trimmed,
        );
      } catch (err) {
        console.warn('Lưu transcript API nền:', err);
      }
    }

    setTimeout(() => {
      setTranscriptNotice('');
    }, 3500);
  };

  // Tải lên tệp phụ đề (.srt, .vtt, .txt) và trích xuất tự động vào Transcript
  const handleUploadSubtitleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const parsed = parseSubtitleToTranscript(content);
      if (parsed) {
        setTranscriptDraft(parsed);
        setIsEditingTranscript(true);
        setTranscriptNotice(
          `Đã nạp phụ đề từ tệp "${file.name}"! Nhấn "Lưu Transcript" để lưu thay đổi.`,
        );
      } else {
        setTranscriptNotice(
          `Tệp "${file.name}" không có nội dung văn bản hợp lệ.`,
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Trích xuất lại bằng AI (Gemini) cho bài giảng
  const handleAiTranscribe = async (
    secIdx: number,
    lecIdx: number,
    lecture: LectureItem,
  ) => {
    if (!currentCourse?._id || !lecture._id) {
      setTranscriptNotice(
        'Vui lòng "Lưu nháp" khóa học trước khi trích xuất bằng AI.',
      );
      return;
    }

    const key = `${secIdx}-${lecIdx}`;
    setTranscribingLecKey(key);
    setTranscriptNotice('Đang gửi video đến AI để trích xuất transcript...');

    try {
      const res = await transcribeLectureWithAI(currentCourse._id, lecture._id);
      if (res.data?.transcript) {
        const updated = [...sections];
        updated[secIdx].lectures[lecIdx].transcript = res.data.transcript;
        updated[secIdx].lectures[lecIdx].transcriptStatus = 'COMPLETED';
        setSections(updated);
        setTranscriptDraft(res.data.transcript);
        setIsEditingTranscript(false);
        setTranscriptNotice('Trích xuất transcript AI thành công!');
      } else {
        setTranscriptNotice(res.message || 'Không thể trích xuất transcript.');
      }
    } catch (err) {
      setTranscriptNotice(
        err instanceof Error
          ? err.message
          : 'Lỗi khi trích xuất transcript bằng AI.',
      );
    } finally {
      setTranscribingLecKey(null);
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

        {/* Nội dung Editor theo Tab */}
        <div
          className="editor-body"
          style={{
            borderRadius: '0 0 12px 12px',
            border: '1px solid #e2e8f0',
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
                              color: '#0f172a',
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
                  borderBottom: '1px solid #e2e8f0',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
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
                          onClick={() => {
                            setAddingQuizSectionIdx(null);
                            handleOpenAddLecture(secIdx);
                          }}
                        >
                          <IconlyPlus size={14} />
                          <span>Thêm bài giảng</span>
                        </button>

                        <button
                          type="button"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#7c3aed',
                            background: '#f5f3ff',
                            border: '1px solid #ddd6fe',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                          onClick={() => handleOpenAiQuizForSection(secIdx)}
                          title="Dùng AI tự động tạo bài kiểm tra trắc nghiệm và tự luận cho chương này"
                        >
                          <span>Soạn Quiz bằng AI</span>
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

                    {/* Bảng soạn Quiz bằng AI nhanh cho Chương */}
                    {addingQuizSectionIdx === secIdx && (
                      <div
                        style={{
                          margin: '12px 0',
                          border: '2px solid #ddd6fe',
                          borderRadius: '10px',
                          background: '#ffffff',
                          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.08)',
                        }}
                      >
                        <AiQuizGenerator
                          defaultTopic={
                            quizPresetContext?.topic ||
                            section.title ||
                            `Kiểm tra kiến thức Chương ${secIdx + 1}`
                          }
                          defaultContent={quizPresetContext?.content || ''}
                          onSaveQuiz={async (quizData) => {
                            const currentSecLectures =
                              sections[secIdx].lectures || [];
                            const newQuizLecture: LectureItem = {
                              title:
                                quizData.title ||
                                `Bài kiểm tra: ${section.title}`,
                              type: 'QUIZ',
                              durationMinutes: 15,
                              isPreview: false,
                              order: currentSecLectures.length + 1,
                              quizData,
                            };
                            const updated = [...sections];
                            updated[secIdx].lectures = [
                              ...currentSecLectures,
                              newQuizLecture,
                            ];
                            setSections(updated);
                            setAddingQuizSectionIdx(null);
                            setQuizPresetContext(null);

                            if (currentCourse?._id) {
                              try {
                                await updateInstructorCourse(
                                  currentCourse._id,
                                  {
                                    sections: updated,
                                  },
                                );
                                toast.ai(
                                  `Đã tạo và lưu thành công bài kiểm tra "${newQuizLecture.title}" (${quizData.questions.length} câu hỏi) vào khóa học!`,
                                  'Tạo Quiz AI thành công',
                                );
                                return;
                              } catch (err) {
                                console.warn('Lỗi lưu quiz tự động:', err);
                              }
                            }

                            toast.ai(
                              `Đã tạo thành công bài kiểm tra "${newQuizLecture.title}" (${quizData.questions.length} câu hỏi). Hãy bấm "Lưu thay đổi khóa học" bên dưới để hoàn tất!`,
                              'Tạo Quiz AI thành công',
                            );
                          }}
                          onCancel={() => {
                            setAddingQuizSectionIdx(null);
                            setQuizPresetContext(null);
                          }}
                        />
                      </div>
                    )}

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
                                      : lecture.type === 'QUIZ'
                                        ? 'type-quiz'
                                        : 'type-doc'
                                  }`}
                                  style={
                                    lecture.type === 'QUIZ'
                                      ? {
                                          background: '#f5f3ff',
                                          color: '#7c3aed',
                                          border: '1px solid #ddd6fe',
                                        }
                                      : undefined
                                  }
                                >
                                  {lecture.type === 'VIDEO'
                                    ? 'Video'
                                    : lecture.type === 'QUIZ'
                                      ? 'Bài kiểm tra AI'
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
                                    {lecture.type === 'QUIZ' && (
                                      <span
                                        style={{
                                          color: '#7c3aed',
                                          fontWeight: 600,
                                        }}
                                      >
                                        ✨{' '}
                                        {lecture.quizData?.questions?.length ||
                                          0}{' '}
                                        câu hỏi trắc nghiệm & tự luận
                                      </span>
                                    )}
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

                                {/* Nút Xem / Sửa đề thi AI nếu là bài QUIZ */}
                                {lecture.type === 'QUIZ' && (
                                  <button
                                    type="button"
                                    className="btn-action-secondary"
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '11.5px',
                                      color: '#7c3aed',
                                      borderColor: '#ddd6fe',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                    onClick={() => {
                                      if (
                                        activeQuizLoc?.secIdx === secIdx &&
                                        activeQuizLoc?.lecIdx === lecIdx
                                      ) {
                                        setActiveQuizLoc(null);
                                      } else {
                                        setActiveQuizLoc({ secIdx, lecIdx });
                                      }
                                    }}
                                  >
                                    <IconlySparkles size={13} color="#7c3aed" />
                                    <span>
                                      {activeQuizLoc?.secIdx === secIdx &&
                                      activeQuizLoc?.lecIdx === lecIdx
                                        ? 'Đóng Đề thi'
                                        : 'Xem / Sửa Đề thi AI'}
                                    </span>
                                  </button>
                                )}

                                {/* Xem & Chỉnh sửa transcript AI */}
                                {lecture.type !== 'QUIZ' && (
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
                                      handleToggleTranscript(
                                        secIdx,
                                        lecIdx,
                                        lecture,
                                      )
                                    }
                                  >
                                    <IconlyAiChip
                                      size={13}
                                      color={
                                        lecture.transcript
                                          ? '#c084fc'
                                          : '#94a3b8'
                                      }
                                    />
                                    <span>
                                      {activeTranscriptLoc?.secIdx === secIdx &&
                                      activeTranscriptLoc?.lecIdx === lecIdx
                                        ? 'Đóng Transcript'
                                        : lecture.transcript
                                          ? 'Xem / Sửa Transcript'
                                          : 'Thêm Transcript'}
                                    </span>
                                  </button>
                                )}

                                {/* Nút Tạo Quiz từ bài học này bằng AI */}
                                {lecture.type !== 'QUIZ' && (
                                  <button
                                    type="button"
                                    className="btn-action-secondary"
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '11.5px',
                                      color: '#7c3aed',
                                      borderColor: '#ddd6fe',
                                      background: '#f5f3ff',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                    onClick={() =>
                                      handleOpenAiQuizForSection(
                                        secIdx,
                                        lecture,
                                      )
                                    }
                                    title="Dùng AI đọc bài học này để soạn bài kiểm tra"
                                  >
                                    <IconlySparkles size={12} color="#7c3aed" />
                                    <span>Tạo Quiz</span>
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

                            {/* Transcript hiển thị inline bên dưới bài giảng */}
                            {activeTranscriptLoc?.secIdx === secIdx &&
                              activeTranscriptLoc?.lecIdx === lecIdx && (
                                <div
                                  style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '14px 16px',
                                    margin: '4px 0 8px 0',
                                  }}
                                >
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
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: '12.5px',
                                          fontWeight: 700,
                                          color: '#c084fc',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                        }}
                                      >
                                        <IconlyAiChip
                                          size={14}
                                          color="#c084fc"
                                        />
                                        <span>Transcript phụ đề (AI RAG):</span>
                                      </span>
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          background: lecture.transcript
                                            ? 'rgba(16, 185, 129, 0.15)'
                                            : 'rgba(234, 179, 8, 0.15)',
                                          color: lecture.transcript
                                            ? '#34d399'
                                            : '#facc15',
                                          border: `1px solid ${
                                            lecture.transcript
                                              ? 'rgba(16, 185, 129, 0.3)'
                                              : 'rgba(234, 179, 8, 0.3)'
                                          }`,
                                        }}
                                      >
                                        {lecture.transcript
                                          ? 'AI Sẵn sàng'
                                          : 'Chưa có transcript'}
                                      </span>
                                    </div>

                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        flexWrap: 'wrap',
                                      }}
                                    >
                                      {/* Tải tệp phụ đề .srt, .vtt, .txt */}
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
                                        <IconlyFolder
                                          size={12}
                                          color="#a78bfa"
                                        />
                                        <span>
                                          Tải file phụ đề (.srt, .vtt)
                                        </span>
                                        <input
                                          type="file"
                                          accept=".srt,.vtt,.txt"
                                          style={{ display: 'none' }}
                                          onChange={(e) =>
                                            handleUploadSubtitleFile(e)
                                          }
                                        />
                                      </label>

                                      {/* Trích xuất AI */}
                                      {currentCourse?._id && lecture._id && (
                                        <button
                                          type="button"
                                          style={{
                                            background: '#312e81',
                                            border: '1px solid #4338ca',
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                            fontSize: '11.5px',
                                            color: '#e0e7ff',
                                            cursor:
                                              transcribingLecKey ===
                                              `${secIdx}-${lecIdx}`
                                                ? 'not-allowed'
                                                : 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                          disabled={
                                            transcribingLecKey ===
                                            `${secIdx}-${lecIdx}`
                                          }
                                          onClick={() =>
                                            handleAiTranscribe(
                                              secIdx,
                                              lecIdx,
                                              lecture,
                                            )
                                          }
                                        >
                                          <IconlyAiChip
                                            size={12}
                                            color="#818cf8"
                                          />
                                          <span>
                                            {transcribingLecKey ===
                                            `${secIdx}-${lecIdx}`
                                              ? 'Đang trích xuất...'
                                              : 'Trích xuất lại AI'}
                                          </span>
                                        </button>
                                      )}
                                      {/* Chỉnh sửa / Lưu */}
                                      {isEditingTranscript ? (
                                        <button
                                          type="button"
                                          style={{
                                            background: '#10b981',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '4px 12px',
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                          onClick={() =>
                                            handleSaveTranscript(secIdx, lecIdx)
                                          }
                                        >
                                          <IconlyTick
                                            size={12}
                                            color="#ffffff"
                                          />
                                          <span>Lưu Transcript</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                            fontSize: '11.5px',
                                            color: '#334155',
                                            cursor: 'pointer',
                                          }}
                                          onClick={() => {
                                            setTranscriptDraft(
                                              lecture.transcript || '',
                                            );
                                            setIsEditingTranscript(true);
                                          }}
                                        >
                                          Chỉnh sửa
                                        </button>
                                      )}

                                      {/* Đóng */}
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
                                          padding: '4px 6px',
                                        }}
                                        onClick={() => {
                                          setActiveTranscriptLoc(null);
                                          setIsEditingTranscript(false);
                                        }}
                                      >
                                        <IconlyClose
                                          size={13}
                                          color="currentColor"
                                        />
                                        <span>Đóng</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Thông báo thao tác */}
                                  {transcriptNotice && (
                                    <div
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        border:
                                          '1px solid rgba(59, 130, 246, 0.25)',
                                        color: '#2563eb',
                                        fontSize: '12px',
                                        marginBottom: '10px',
                                      }}
                                    >
                                      {transcriptNotice}
                                    </div>
                                  )}

                                  {/* Nội dung: Soạn thảo hoặc Hiển thị */}
                                  {isEditingTranscript ? (
                                    <div>
                                      <textarea
                                        value={transcriptDraft}
                                        onChange={(e) =>
                                          setTranscriptDraft(e.target.value)
                                        }
                                        placeholder="Nhập hoặc dán lời nói bài giảng có kèm mốc thời gian:&#10;[00:00] Xin chào các bạn...&#10;[01:15] Nội dung bài học...&#10;&#10;Hoặc bấm 'Tải file phụ đề (.srt, .vtt)' ở trên để nạp tự động."
                                        rows={8}
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
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          marginTop: '8px',
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: '11px',
                                            color: '#64748b',
                                          }}
                                        >
                                          * Hỗ trợ mốc thời gian dạng [mm:ss] để
                                          AI RAG tra cứu chính xác.
                                        </span>
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '8px',
                                          }}
                                        >
                                          <button
                                            type="button"
                                            style={{
                                              background: '#ffffff',
                                              border: '1px solid #cbd5e1',
                                              borderRadius: '6px',
                                              padding: '4px 10px',
                                              fontSize: '11.5px',
                                              color: '#475569',
                                              cursor: 'pointer',
                                            }}
                                            onClick={() => {
                                              setTranscriptDraft(
                                                lecture.transcript || '',
                                              );
                                              setIsEditingTranscript(false);
                                            }}
                                          >
                                            Hủy
                                          </button>
                                          <button
                                            type="button"
                                            style={{
                                              background: '#10b981',
                                              border: 'none',
                                              borderRadius: '6px',
                                              padding: '4px 12px',
                                              fontSize: '11.5px',
                                              fontWeight: 600,
                                              color: '#ffffff',
                                              cursor: 'pointer',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                            }}
                                            onClick={() =>
                                              handleSaveTranscript(
                                                secIdx,
                                                lecIdx,
                                              )
                                            }
                                          >
                                            <IconlyTick
                                              size={12}
                                              color="#ffffff"
                                            />
                                            <span>Lưu thay đổi</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : lecture.transcript ? (
                                    <div>
                                      <div
                                        className="transcript-box"
                                        style={{ margin: 0 }}
                                      >
                                        {lecture.transcript}
                                      </div>
                                      <div
                                        style={{
                                          marginTop: '6px',
                                          fontSize: '11px',
                                          color: '#64748b',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                        }}
                                      >
                                        <span>
                                          Toàn bộ nội dung transcript này đã
                                          được nạp vào vector store cho Trợ lý
                                          AI Purrfect.
                                        </span>
                                        <button
                                          type="button"
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            textDecoration: 'underline',
                                            padding: 0,
                                          }}
                                          onClick={() => {
                                            setTranscriptDraft('');
                                            handleSaveTranscript(
                                              secIdx,
                                              lecIdx,
                                            );
                                          }}
                                        >
                                          Xóa transcript
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        textAlign: 'center',
                                        padding: '18px 12px',
                                        background: '#f8fafc',
                                        border: '1px dashed #cbd5e1',
                                        borderRadius: '6px',
                                      }}
                                    >
                                      <p
                                        style={{
                                          margin: '0 0 10px 0',
                                          fontSize: '12.5px',
                                          color: '#94a3b8',
                                        }}
                                      >
                                        Bài giảng này chưa có nội dung
                                        transcript phụ đề.
                                      </p>
                                      <div
                                        style={{
                                          display: 'flex',
                                          gap: '8px',
                                          justifyContent: 'center',
                                          flexWrap: 'wrap',
                                        }}
                                      >
                                        <label
                                          style={{
                                            cursor: 'pointer',
                                            background: '#0056d2',
                                            borderRadius: '6px',
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            color: '#ffffff',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                          }}
                                        >
                                          <IconlyFolder
                                            size={14}
                                            color="#ffffff"
                                          />
                                          <span>
                                            Tải file phụ đề (.srt, .vtt)
                                          </span>
                                          <input
                                            type="file"
                                            accept=".srt,.vtt,.txt"
                                            style={{ display: 'none' }}
                                            onChange={(e) =>
                                              handleUploadSubtitleFile(e)
                                            }
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            color: '#334155',
                                            cursor: 'pointer',
                                          }}
                                          onClick={() => {
                                            setTranscriptDraft('');
                                            setIsEditingTranscript(true);
                                          }}
                                        >
                                          Nhập nội dung thủ công
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Bảng soạn / sửa đề thi AI cho bài giảng đã có */}
                            {activeQuizLoc?.secIdx === secIdx &&
                              activeQuizLoc?.lecIdx === lecIdx && (
                                <div style={{ margin: '4px 0 10px 0' }}>
                                  <AiQuizGenerator
                                    defaultTopic={lecture.title}
                                    defaultContent={
                                      sections[secIdx]?.lectures
                                        ?.map((l) => l.transcript || l.title)
                                        .join('\n') || ''
                                    }
                                    initialQuizData={lecture.quizData}
                                    onSaveQuiz={async (updatedQuiz) => {
                                      const updated = [...sections];
                                      updated[secIdx].lectures[
                                        lecIdx
                                      ].quizData = updatedQuiz;
                                      setSections(updated);
                                      setActiveQuizLoc(null);

                                      if (currentCourse?._id) {
                                        try {
                                          await updateInstructorCourse(
                                            currentCourse._id,
                                            {
                                              sections: updated,
                                            },
                                          );
                                          toast.ai(
                                            `Đã cập nhật và lưu ${updatedQuiz.questions.length} câu hỏi bài kiểm tra vào khóa học!`,
                                            'Cập nhật đề thi AI',
                                          );
                                          return;
                                        } catch (err) {
                                          console.warn('Lỗi lưu quiz:', err);
                                        }
                                      }

                                      toast.ai(
                                        `Đã cập nhật ${updatedQuiz.questions.length} câu hỏi cho bài kiểm tra.`,
                                        'Cập nhật đề thi AI',
                                      );
                                    }}
                                    onCancel={() => setActiveQuizLoc(null)}
                                  />
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
                          background: '#f8fafc',
                          borderTop: '1px solid #e2e8f0',
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
                              Định dạng bài học
                            </label>
                            <div
                              style={{
                                display: 'flex',
                                gap: '6px',
                                flexWrap: 'wrap',
                                marginTop: '4px',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setNewLectureType('VIDEO')}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  border:
                                    newLectureType === 'VIDEO'
                                      ? '1.5px solid #0056d2'
                                      : '1px solid #cbd5e1',
                                  background:
                                    newLectureType === 'VIDEO'
                                      ? '#eff6ff'
                                      : '#ffffff',
                                  color:
                                    newLectureType === 'VIDEO'
                                      ? '#0056d2'
                                      : '#475569',
                                }}
                              >
                                🎥 Video
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewLectureType('DOCUMENT')}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  border:
                                    newLectureType === 'DOCUMENT'
                                      ? '1.5px solid #0056d2'
                                      : '1px solid #cbd5e1',
                                  background:
                                    newLectureType === 'DOCUMENT'
                                      ? '#eff6ff'
                                      : '#ffffff',
                                  color:
                                    newLectureType === 'DOCUMENT'
                                      ? '#0056d2'
                                      : '#475569',
                                }}
                              >
                                📄 Tài liệu
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewLectureType('QUIZ')}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border:
                                    newLectureType === 'QUIZ'
                                      ? '1.5px solid #7c3aed'
                                      : '1px solid #ddd6fe',
                                  background:
                                    newLectureType === 'QUIZ'
                                      ? '#f5f3ff'
                                      : '#ffffff',
                                  color: '#7c3aed',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <span>Quiz AI</span>
                              </button>
                            </div>
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

                        {newLectureType === 'QUIZ' ? (
                          <div style={{ marginTop: '6px' }}>
                            <AiQuizGenerator
                              defaultTopic={
                                newLectureTitle ||
                                `Bài kiểm tra Chương ${secIdx + 1}`
                              }
                              defaultContent={
                                sections[secIdx]?.lectures
                                  ?.map((l) => l.transcript || l.title)
                                  .join('\n') || ''
                              }
                              initialQuizData={editingQuizData || undefined}
                              onSaveQuiz={(quizData) => {
                                setEditingQuizData(quizData);
                                toast.success(
                                  `Đã lưu ${quizData.questions.length} câu hỏi. Hãy bấm "Lưu bài giảng" bên dưới để hoàn tất thêm bài kiểm tra vào chương!`,
                                  'Đã lưu câu hỏi Quiz',
                                );
                              }}
                              onCancel={() => {
                                setEditingQuizData(null);
                                setNewLectureType('VIDEO');
                              }}
                            />
                          </div>
                        ) : (
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
                                color: '#475569',
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
                        )}

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

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '12.5px',
                  color: '#475569',
                  lineHeight: '1.6',
                }}
              >
                <strong
                  style={{
                    color: '#0f172a',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Huy hiệu khóa học tự động (Smart Badge System):
                </strong>
                Hệ thống tự động phân loại và cấp huy hiệu theo hiệu suất thực
                tế:
                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                  <li>
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      NEW
                    </span>
                    : Dành cho khóa học mới ra mắt gần đây.
                  </li>
                  <li>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      HOT
                    </span>
                    : Dành cho khóa học mới ra có lượng truy cập và quan tâm
                    cao.
                  </li>
                  <li>
                    <span style={{ color: '#d97706', fontWeight: 600 }}>
                      BESTSELLER
                    </span>
                    : Dành cho khóa học có số lượng học viên ghi danh đông đảo
                    nhất.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Thanh công cụ dưới cùng (Bottom Action Bar) */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
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
            {currentCourse?.status === 'PUBLISHED' ? (
              <button
                type="button"
                className="btn-create-course"
                onClick={handleSaveDraft}
                disabled={submitting}
              >
                <IconlyTick size={16} />
                <span>
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi khóa học'}
                </span>
              </button>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
