import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchOnboardingData,
  saveOnboardingSurvey,
} from '../../services/onboardingApi';
import {
  IconlySearch,
  IconlyCode,
  IconlyAiChip,
  IconlyPalette,
  IconlyGraph,
  IconlyDigital,
  IconlyDocument,
  IconlyDiscovery,
  IconlyWork,
  IconlyAward,
  IconlyTick,
  IconlySwap,
  IconlyChat,
  IconlyWallet,
  IconlyHeart,
} from './IconlyIcons';
import type {
  OnboardingCategory,
  OnboardingSkill,
} from '../../types/onboarding';
import './OnboardingFlow.css';

// 4 Mục tiêu học tập sử dụng icon Iconly
interface SeasonGoal {
  id: string;
  iconType: 'work' | 'swap' | 'graph' | 'discovery';
  title: string;
  subtitle: string;
  staggerClass: 'stagger-low' | 'stagger-high';
}

const SEASON_GOALS: SeasonGoal[] = [
  {
    id: 'career-start',
    iconType: 'work',
    title: 'Bắt đầu sự nghiệp mới',
    subtitle: 'Khởi đầu vững vàng với nền tảng mới',
    staggerClass: 'stagger-low',
  },
  {
    id: 'career-change',
    iconType: 'swap',
    title: 'Thay đổi định hướng nghề nghiệp',
    subtitle: 'Bứt phá chuyển mình sang lĩnh vực tiềm năng',
    staggerClass: 'stagger-high',
  },
  {
    id: 'career-grow',
    iconType: 'graph',
    title: 'Phát triển vị trí hiện tại',
    subtitle: 'Nâng cao kỹ năng chuyên sâu để thăng tiến',
    staggerClass: 'stagger-low',
  },
  {
    id: 'career-explore',
    iconType: 'discovery',
    title: 'Khám phá',
    subtitle: 'Mở rộng góc nhìn và tìm kiếm cảm hứng mới',
    staggerClass: 'stagger-high',
  },
];

// Iconly Goal Icons (Bước 1)
const renderGoalIcon = (iconType: string) => {
  const iconSize = 54;
  const iconColor = '#ffffff';
  switch (iconType) {
    case 'work':
      return <IconlyWork size={iconSize} color={iconColor} />;
    case 'swap':
      return <IconlySwap size={iconSize} color={iconColor} />;
    case 'graph':
      return <IconlyGraph size={iconSize} color={iconColor} />;
    case 'discovery':
      return <IconlyDiscovery size={iconSize} color={iconColor} />;
    default:
      return <IconlyDiscovery size={iconSize} color={iconColor} />;
  }
};

// Danh sách cấp độ trình độ (Bước 4)
const SKILL_LEVELS = [
  {
    id: 'Beginner',
    name: 'Mới bắt đầu (Beginner)',
    desc: 'Chưa có nhiều kiến thức hoặc mới bắt đầu làm quen với lĩnh vực này.',
  },
  {
    id: 'Intermediate',
    name: 'Trung cấp (Intermediate)',
    desc: 'Đã nắm vững kiến thức nền tảng và đã có kinh nghiệm thực hành thực tế.',
  },
  {
    id: 'Advanced',
    name: 'Nâng cao (Advanced)',
    desc: 'Muốn đào sâu kỹ thuật chuyên sâu, làm chủ kiến trúc và nâng tầm sự nghiệp.',
  },
];

// Iconly Category Icons (Bước 2)
const renderCategoryIcon = (slug: string, isSelected: boolean) => {
  const color = isSelected ? '#ffffff' : '#2563eb';
  switch (slug) {
    case 'development':
      return <IconlyCode size={24} color={color} />;
    case 'ai-data':
      return <IconlyAiChip size={24} color={color} />;
    case 'design':
      return <IconlyPalette size={24} color={color} />;
    case 'business':
      return <IconlyGraph size={24} color={color} />;
    case 'digital-skills':
      return <IconlyDigital size={24} color={color} />;
    case 'languages':
      return <IconlyChat size={24} color={color} />;
    case 'finance':
      return <IconlyWallet size={24} color={color} />;
    case 'health-wellness':
      return <IconlyHeart size={24} color={color} />;
    default:
      return <IconlyDocument size={24} color={color} />;
  }
};

// Iconly Level Icons (Bước 4)
const renderLevelIcon = (id: string, isSelected: boolean) => {
  const color = isSelected ? '#ffffff' : '#2563eb';
  switch (id) {
    case 'Beginner':
      return <IconlyDiscovery size={30} color={color} />;
    case 'Intermediate':
      return <IconlyWork size={30} color={color} />;
    case 'Advanced':
      return <IconlyAward size={30} color={color} />;
    default:
      return <IconlyDiscovery size={30} color={color} />;
  }
};

export const OnboardingFlow: React.FC = () => {
  const { navigate, updateUser, refreshUser } = useAuth();

  // Dữ liệu từ API
  const [categories, setCategories] = useState<OnboardingCategory[]>([]);
  const [skills, setSkills] = useState<OnboardingSkill[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Trạng thái khảo sát 4 bước
  const [step, setStep] = useState<number>(1);
  const [selectedGoal, setSelectedGoal] = useState<string>('career-start'); // Bước 1
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]); // Bước 2
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]); // Bước 3
  const [selectedLevel, setSelectedLevel] = useState<string>('Beginner'); // Bước 4

  // Trạng thái tìm kiếm
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [skillSearch, setSkillSearch] = useState<string>('');
  const [skillTabCatId, setSkillTabCatId] = useState<string>('ALL');

  // Trạng thái submit & hoàn thành
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Tải danh mục và kỹ năng từ database
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchOnboardingData();
        if (res.success) {
          setCategories(res.categories || []);
          setSkills(res.skills || []);

          // Mặc định chọn 2 category đầu tiên nếu chưa chọn
          if (res.categories && res.categories.length > 0) {
            setSelectedCategoryIds([res.categories[0].id]);
          }
        }
      } catch (err) {
        console.error('Error fetching onboarding data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Lọc danh mục theo tìm kiếm
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const term = categorySearch.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term)),
    );
  }, [categories, categorySearch]);

  // Lọc kỹ năng theo danh mục và tìm kiếm
  const filteredSkills = useMemo(() => {
    let result = skills;
    // Nếu chọn 1 tab cụ thể
    if (skillTabCatId !== 'ALL') {
      result = result.filter((s) => s.categoryId === skillTabCatId);
    } else if (selectedCategoryIds.length > 0) {
      // Ưu tiên hiển thị các skill thuộc các category đã chọn ở bước 2
      result = result.filter((s) => selectedCategoryIds.includes(s.categoryId));
      // Nếu không có skill nào thuộc category đã chọn, hiển thị tất cả
      if (result.length === 0) result = skills;
    }

    if (skillSearch.trim()) {
      const term = skillSearch.toLowerCase().trim();
      result = result.filter((s) => s.name.toLowerCase().includes(term));
    }
    return result;
  }, [skills, skillTabCatId, selectedCategoryIds, skillSearch]);

  // Xử lý chọn/bỏ chọn Category (Multi-select)
  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Xử lý chọn/bỏ chọn Skill (Multi-select)
  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Điều hướng các bước
  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Hoàn tất khảo sát
  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const goalObj = SEASON_GOALS.find((g) => g.id === selectedGoal);
      await saveOnboardingSurvey({
        primaryGoal: goalObj ? goalObj.title : 'Khám phá',
        interestedCategoryIds: selectedCategoryIds,
        interestedSkillIds: selectedSkillIds,
        skillLevel: selectedLevel,
      });
      updateUser({ onboardingCompleted: true });
      try {
        await refreshUser();
      } catch {
        // Ignored
      }
      setIsCompleted(true);
    } catch (err) {
      console.error('Lỗi khi lưu khảo sát:', err);
      // Vẫn cho hoàn tất để không chặn người dùng
      setIsCompleted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  // Tính phần trăm tiến trình
  const progressPercent = (step / 4) * 100;

  // Kiểm tra điều kiện nút Next
  const isNextDisabled = () => {
    if (step === 1) return !selectedGoal;
    if (step === 2) return selectedCategoryIds.length === 0;
    if (step === 3) return false; // Kỹ năng không bắt buộc ép cứng
    if (step === 4) return !selectedLevel;
    return false;
  };

  if (isCompleted) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-bg-blob onboarding-blob-1" />
        <div className="onboarding-bg-blob onboarding-blob-2" />

        <div className="onboarding-top-nav">
          <div className="onboarding-top-container">
            <div className="onboarding-brand">
              <img
                src="/logo.svg"
                alt="Purrfect"
                className="onboarding-logo-img"
              />
            </div>
          </div>
        </div>

        <main
          className="onboarding-main-container"
          style={{ justifyContent: 'center' }}
        >
          <div className="onboarding-success-screen">
            <div className="success-icon-badge">
              <IconlyAward size={46} color="#16a34a" />
            </div>
            <h1 className="success-screen-title">
              Lộ trình học tập đã sẵn sàng!
            </h1>
            <p className="success-screen-desc">
              Cảm ơn bạn đã chia sẻ định hướng. Purrfect đã tùy chỉnh danh sách
              khóa học và bài giảng phù hợp nhất với mục tiêu của bạn.
            </p>
            <button
              type="button"
              className="onboarding-next-btn"
              style={{
                margin: '0 auto',
                padding: '14px 40px',
                fontSize: '16px',
              }}
              onClick={() => navigate('/')}
            >
              Bắt đầu khám phá ngay
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      {/* Decorative ambient blobs matching platform */}
      <div className="onboarding-bg-blob onboarding-blob-1" />
      <div className="onboarding-bg-blob onboarding-blob-2" />

      {/* Top Header & Progress Bar */}
      <header className="onboarding-top-nav">
        <div className="onboarding-top-container">
          <div className="onboarding-brand">
            <img
              src="/logo.svg"
              alt="Purrfect"
              className="onboarding-logo-img"
            />
          </div>

          <div className="onboarding-progress-wrapper">
            <div className="onboarding-step-text-row">
              <span>
                Bước <span className="onboarding-step-highlight">{step}</span> /
                4
              </span>
              <span>
                {step === 1 && 'Mục tiêu học tập'}
                {step === 2 && 'Lĩnh vực quan tâm'}
                {step === 3 && 'Kỹ năng mục tiêu'}
                {step === 4 && 'Trình độ hiện tại'}
              </span>
            </div>
            <div className="onboarding-progress-track">
              <div
                className="onboarding-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            className="onboarding-skip-btn"
            onClick={handleSkip}
          >
            Bỏ qua
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="onboarding-main-container">
        {/* =========================================================================
            BƯỚC 1: 4 Ô VUÔNG MÀU ĐỎ (4 MÙA) CHÍNH XÁC THEO ẢNH MẪU
            ========================================================================= */}
        {step === 1 && (
          <div>
            <div className="onboarding-header-group">
              <span className="onboarding-step-pill">
                Bước 1 / 4 • Định hướng
              </span>
              <h1 className="onboarding-title">
                Mục tiêu học tập chính của bạn là gì?
              </h1>
              <p className="onboarding-subtitle">
                Hãy chọn mục tiêu phù hợp nhất với giai đoạn hiện tại để
                Purrfect đồng hành và xây dựng lộ trình chuẩn xác cho bạn.
              </p>
            </div>

            <div className="season-cards-container">
              {SEASON_GOALS.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    className={`season-card-wrapper ${goal.staggerClass} ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedGoal(goal.id)}
                    aria-pressed={isSelected}
                  >
                    {/* Ô VUÔNG MÀU ĐỎ ĐẬM BO GÓC CHUẨN MẪU */}
                    <div className="season-red-box">
                      {/* Icon Iconly chính giữa */}
                      {renderGoalIcon(goal.iconType)}
                    </div>

                    {/* Tiêu đề mục tiêu bên dưới */}
                    <span className="season-card-label">{goal.title}</span>
                    <span className="season-card-sublabel">
                      {goal.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            BƯỚC 2: LIỆT KÊ TẤT CẢ CATEGORY + THANH TÌM KIẾM
            ========================================================================= */}
        {step === 2 && (
          <div className="category-step-wrapper">
            <div className="onboarding-header-group">
              <span className="onboarding-step-pill">
                Bước 2 / 4 • Danh mục
              </span>
              <h1 className="onboarding-title">
                Bạn muốn học tập trong những lĩnh vực nào?
              </h1>
              <p className="onboarding-subtitle">
                Chọn một hoặc nhiều lĩnh vực bạn quan tâm có trên sàn Purrfect.
              </p>
            </div>

            {/* Thanh tìm kiếm danh mục */}
            <div className="search-box-row">
              <span className="search-icon-inside">
                <IconlySearch size={19} color="#94a3b8" />
              </span>
              <input
                type="text"
                className="onboarding-search-input"
                placeholder="Tìm kiếm lĩnh vực (ví dụ: Lập trình, AI, Thiết kế...)"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            </div>

            {/* Danh sách categories từ Database */}
            {loadingData ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#64748b',
                }}
              >
                Đang tải danh mục từ cơ sở dữ liệu...
              </div>
            ) : (
              <div className="category-selection-grid">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className={`category-select-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleCategory(cat.id)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                    >
                      <div className="category-card-icon-wrap">
                        {renderCategoryIcon(cat.slug, isSelected)}
                      </div>
                      <div className="category-card-content">
                        <div className="category-card-name">{cat.name}</div>
                        <div className="category-card-desc">
                          {cat.description ||
                            'Khám phá các khóa học chất lượng cao'}
                        </div>
                      </div>
                      <div className="category-checkbox-indicator">
                        {isSelected && <IconlyTick size={14} color="#ffffff" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            BƯỚC 3: KỸ NĂNG CỤ THỂ CỦA SÀN (SKILLS)
            ========================================================================= */}
        {step === 3 && (
          <div className="skills-step-wrapper">
            <div className="onboarding-header-group">
              <span className="onboarding-step-pill">Bước 3 / 4 • Kỹ năng</span>
              <h1 className="onboarding-title">
                Kỹ năng cụ thể nào bạn muốn phát triển?
              </h1>
              <p className="onboarding-subtitle">
                Hệ thống tổng hợp các kỹ năng cốt lõi trên sàn. Nhấp để chọn kỹ
                năng bạn muốn ưu tiên đào sâu.
              </p>
            </div>

            {/* Tab lọc nhanh theo các category đã chọn */}
            <div className="category-tab-filter">
              <button
                type="button"
                className={`cat-tab-btn ${skillTabCatId === 'ALL' ? 'active' : ''}`}
                onClick={() => setSkillTabCatId('ALL')}
              >
                Tất cả lĩnh vực đã chọn
              </button>
              {categories
                .filter((c) => selectedCategoryIds.includes(c.id))
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`cat-tab-btn ${
                      skillTabCatId === c.id ? 'active' : ''
                    }`}
                    onClick={() => setSkillTabCatId(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
            </div>

            {/* Ô tìm kiếm kỹ năng */}
            <div className="search-box-row">
              <span className="search-icon-inside">
                <IconlySearch size={19} color="#94a3b8" />
              </span>
              <input
                type="text"
                className="onboarding-search-input"
                placeholder="Tìm nhanh kỹ năng (ví dụ: React, Figma, Python, Excel...)"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
              />
            </div>

            {/* Lưới các skill dạng pill chips */}
            <div className="skills-pills-grid">
              {filteredSkills.map((sk) => {
                const isSelected = selectedSkillIds.includes(sk.id);
                return (
                  <button
                    key={sk.id}
                    type="button"
                    className={`skill-pill-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSkill(sk.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="skill-pill-plus">
                      {isSelected ? (
                        <IconlyTick size={13} color="#2563eb" />
                      ) : (
                        '+'
                      )}
                    </span>
                    <span>{sk.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            BƯỚC 4: TRÌNH ĐỘ HIỆN TẠI (SINGLE-SELECT CARDS)
            ========================================================================= */}
        {step === 4 && (
          <div>
            <div className="onboarding-header-group">
              <span className="onboarding-step-pill">
                Bước 4 / 4 • Trình độ
              </span>
              <h1 className="onboarding-title">
                Trình độ hiện tại của bạn ở các kỹ năng này thế nào?
              </h1>
              <p className="onboarding-subtitle">
                Chọn cấp độ tự đánh giá hiện tại để nhận các bài giảng và khóa
                học đúng với năng lực.
              </p>
            </div>

            <div className="level-cards-container">
              {SKILL_LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                return (
                  <div
                    key={lvl.id}
                    className={`level-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedLevel(lvl.id)}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                  >
                    <div className="level-radio-dot" />
                    <div className="level-icon-badge">
                      {renderLevelIcon(lvl.id, isSelected)}
                    </div>
                    <div className="level-card-title">{lvl.name}</div>
                    <div className="level-card-desc">{lvl.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="onboarding-bottom-bar">
          <div>
            {step === 2 && (
              <span className="onboarding-counter-badge">
                Đã chọn: <strong>{selectedCategoryIds.length}</strong> lĩnh vực
              </span>
            )}
            {step === 3 && (
              <span className="onboarding-counter-badge">
                Đã chọn: <strong>{selectedSkillIds.length}</strong> kỹ năng
              </span>
            )}
          </div>

          <div className="onboarding-btn-group">
            {step > 1 && (
              <button
                type="button"
                className="onboarding-back-btn"
                onClick={handleBack}
              >
                Quay lại
              </button>
            )}

            <button
              type="button"
              className="onboarding-next-btn"
              onClick={handleNext}
              disabled={isNextDisabled() || isSubmitting}
            >
              {isSubmitting ? (
                'Đang lưu...'
              ) : step === 4 ? (
                'Hoàn tất & Khám phá'
              ) : (
                <>
                  Tiếp tục <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
