"""
Content-Based Filtering Module using TF-IDF & Cosine Similarity
Optimized for multi-language (Vietnamese with/without diacritics + English),
thread-safe pre-fitted course corpus, and non-saturating normalized scoring.
"""
from typing import List, Dict, Any, Optional
import logging
import threading
import unicodedata
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger("purrfect.ai.content_based")

# Trọng số chuẩn hóa (Tổng chính xác = 1.00)
# Đảm bảo điểm số không bao giờ bị tràn > 1.00, giữ nguyên độ phân biệt xếp hạng
WEIGHT_BASE_SIM = 0.40      # Độ tương đồng văn bản ngữ nghĩa (TF-IDF Cosine)
WEIGHT_CATEGORY = 0.25      # Trùng khớp danh mục quan tâm
WEIGHT_SKILLS = 0.20        # Tỷ lệ kỹ năng mục tiêu trùng khớp
WEIGHT_LEVEL = 0.10         # Trùng khớp cấp độ học viên (Beginner/Intermediate/Advanced)
WEIGHT_RATING = 0.05        # Điểm chất lượng khóa học thực tế (nếu đã có đánh giá thật)


def remove_vietnamese_accents(text: str) -> str:
    """
    Chuyển đổi chuỗi tiếng Việt có dấu thành không dấu chuẩn xác.
    Xử lý riêng ký tự đ/Đ trước khi phân rã Unicode NFD.
    """
    if not text:
        return ""
    text = text.replace("đ", "d").replace("Đ", "D")
    nfd_form = unicodedata.normalize("NFD", text)
    return "".join(c for c in nfd_form if unicodedata.category(c) != "Mn")


def normalize_text_multilingual(text: str) -> str:
    """
    Chuẩn hóa văn bản song ngữ:
    - Chuyển chữ thường, cắt khoảng trắng thừa.
    - Sinh song song cả từ gốc có dấu và từ đã loại bỏ dấu để tìm kiếm
      không dấu (ví dụ: 'lap trinh') hay có dấu ('lập trình') đều khớp hoàn hảo.
    """
    if not text or not isinstance(text, str):
        return ""
    cleaned = text.lower().strip()
    unaccented = remove_vietnamese_accents(cleaned)
    if cleaned != unaccented:
        return f"{cleaned} {unaccented}"
    return cleaned


class ContentBasedRecommender:
    def __init__(self):
        self._lock = threading.Lock()
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            token_pattern=r"(?u)\b\w+\b",
            ngram_range=(1, 2),
            max_features=5000,
            sublinear_tf=True
        )
        self._cached_course_ids: List[str] = []
        self._cached_course_vectors = None
        self._cached_fingerprint: Optional[str] = None
        self._is_fitted: bool = False

    def _compute_courses_fingerprint(self, courses: List[Dict[str, Any]]) -> str:
        """
        Tạo mã định danh nhanh (fingerprint) cho tập danh sách khóa học.
        Chỉ khi danh sách khóa học thay đổi (thêm/xóa/đổi thứ tự), fingerprint mới đổi.
        """
        ids = [str(c.get("course_id") or "") for c in courses]
        return f"{len(courses)}:" + ",".join(ids)

    def build_course_corpus(self, courses: List[Dict[str, Any]]) -> List[str]:
        """
        Tạo văn bản đặc trưng cho từng khóa học (Việt + Anh + Danh mục + Kỹ năng + Cấp độ).
        LƯU Ý: Không lặp lại nhân đôi từ khóa nhân tạo ở đây.
        Để TF-IDF phản ánh đúng tần suất ngữ nghĩa tự nhiên của văn bản.
        Các ưu tiên về cấu trúc (Category, Skill, Level) sẽ được tính riêng ở phần Structured Bonus.
        """
        corpus: List[str] = []
        for c in courses:
            title = c.get("title") or ""
            title_en = c.get("title_en") or ""
            desc = c.get("short_description") or ""
            desc_en = c.get("short_description_en") or ""

            # Tách slug thành từ rời (ví dụ: 'lap-trinh-web' -> 'lap trinh web')
            cat_slug = (c.get("category_slug") or "").replace("-", " ")
            skill_slugs = " ".join(
                (s or "").replace("-", " ") for s in (c.get("skill_slugs") or []) if s
            )
            level = c.get("level") or ""

            # Gom các trường tự nhiên 1 lần
            raw_text = f"{title} {title_en} {desc} {desc_en} {cat_slug} {skill_slugs} {level}".strip()
            normalized = normalize_text_multilingual(raw_text)
            corpus.append(normalized if normalized else "course")
        return corpus

    def fit_courses(self, courses: List[Dict[str, Any]]) -> bool:
        """
        Huấn luyện TF-IDF một lần duy nhất trên toàn bộ khoá học (Document Collection).
        Không đưa văn bản của học viên vào bước fit để tránh làm ô nhiễm IDF
        và tránh xung đột trạng thái (race condition) giữa các request song song.
        """
        if not courses:
            return False

        corpus = self.build_course_corpus(courses)
        try:
            new_vectorizer = TfidfVectorizer(
                lowercase=True,
                token_pattern=r"(?u)\b\w+\b",
                ngram_range=(1, 2),
                max_features=5000,
                sublinear_tf=True
            )
            self._cached_course_vectors = new_vectorizer.fit_transform(corpus)
            self.vectorizer = new_vectorizer
            self._cached_course_ids = [str(c.get("course_id") or "") for c in courses]
            self._cached_fingerprint = self._compute_courses_fingerprint(courses)
            self._is_fitted = True

            logger.info(
                "Đã fit TF-IDF vectorizer trên %d khóa học (tổng %d đặc trưng)",
                len(courses),
                len(self.vectorizer.vocabulary_)
            )
            return True
        except Exception as e:
            logger.error("Lỗi khi huấn luyện TF-IDF trên danh sách khóa học: %s", e, exc_info=True)
            self._is_fitted = False
            return False

    def score_courses(
        self,
        courses: List[Dict[str, Any]],
        onboarding: Dict[str, Any],
        search_keywords: List[str]
    ) -> Dict[str, float]:
        """
        Tính điểm Content-Based Filtering cho từng khóa học:
        - Kiểm tra tín hiệu người dùng (Category, Skill, Goal, Search). Nếu không có -> Cold Start (0.0).
        - Sử dụng vectorizer đã fit sẵn để transform văn bản học viên (Thread-safe, chỉ đọc).
        - Kết hợp Cosine Similarity (0.40) + Structured Metadata Bonus (0.60) = Tổng điểm max 1.00.
        """
        if not courses:
            return {}

        course_ids = [str(c.get("course_id") or "") for c in courses]

        # 1. Đảm bảo Vectorizer và Course Vectors đã được fit sẵn (Cache & Thread-safe)
        current_fingerprint = self._compute_courses_fingerprint(courses)
        if not self._is_fitted or self._cached_fingerprint != current_fingerprint:
            with self._lock:
                if not self._is_fitted or self._cached_fingerprint != current_fingerprint:
                    success = self.fit_courses(courses)
                    if not success:
                        return {cid: 0.0 for cid in course_ids}

        # 2. Thu thập và kiểm tra tín hiệu thực tế của người dùng
        user_categories = [
            str(cat).strip().lower()
            for cat in (onboarding.get("category_slugs") or [])
            if cat
        ]
        user_skills = [
            str(sk).strip().lower()
            for sk in (onboarding.get("skill_slugs") or [])
            if sk
        ]
        user_goal = str(onboarding.get("primary_goal") or "").strip()
        user_searches = [
            str(kw).strip().lower()
            for kw in (search_keywords or [])
            if kw and str(kw).strip()
        ]

        # Kiểm tra chính xác trên các tín hiệu hành vi/sở thích thật
        # Không dùng user_level để quyết định vì user_level luôn có giá trị mặc định ("Beginner")
        has_real_signals = bool(user_categories or user_skills or user_goal or user_searches)

        if not has_real_signals:
            # Học viên hoàn toàn chưa có tín hiệu khảo sát hay tìm kiếm
            # Trả về 0.0 để hệ thống nhận diện đúng Cold-Start và dùng danh sách nổi bật
            return {cid: 0.0 for cid in course_ids}

        # 3. Xây dựng văn bản đại diện cho nhu cầu của học viên (không lặp từ)
        user_parts: List[str] = []
        if user_categories:
            user_parts.append(" ".join(cat.replace("-", " ") for cat in user_categories))
        if user_skills:
            user_parts.append(" ".join(sk.replace("-", " ") for sk in user_skills))
        if user_goal:
            user_parts.append(user_goal)
        if user_searches:
            user_parts.append(" ".join(user_searches))

        user_text_raw = " ".join(user_parts)
        user_text = normalize_text_multilingual(user_text_raw)

        # 4. Chỉ TRANSFORM văn bản học viên (Read-only, không fit lại, an toàn đa luồng)
        similarities: np.ndarray
        try:
            user_vector = self.vectorizer.transform([user_text])
            similarities = cosine_similarity(user_vector, self._cached_course_vectors)[0]
        except Exception as e:
            logger.error("Lỗi khi transform văn bản học viên: %s", e, exc_info=True)
            similarities = np.zeros(len(courses))

        # Ánh xạ chỉ số khóa học trong cache phòng trường hợp thứ tự truyền vào khác đi
        id_to_idx = {cid: idx for idx, cid in enumerate(self._cached_course_ids)}

        user_level = str(onboarding.get("skill_level") or "").strip().lower()
        user_cat_set = set(user_categories)
        user_skill_set = set(user_skills)

        scores: Dict[str, float] = {}

        for c in courses:
            cid = str(c.get("course_id") or "")
            sim_idx = id_to_idx.get(cid)
            base_sim = float(similarities[sim_idx]) if sim_idx is not None and sim_idx < len(similarities) else 0.0

            # --- Structured Bonus Components (Tổng tối đa = 0.60) ---
            # a. Khớp danh mục (+0.25)
            c_cat = str(c.get("category_slug") or "").strip().lower()
            cat_bonus = WEIGHT_CATEGORY if (c_cat and c_cat in user_cat_set) else 0.0

            # b. Khớp kỹ năng mục tiêu (+0.20)
            c_skills = [str(s).strip().lower() for s in (c.get("skill_slugs") or []) if s]
            if c_skills and user_skill_set:
                overlap = len(set(c_skills).intersection(user_skill_set))
                skill_bonus = WEIGHT_SKILLS * (overlap / len(c_skills))
            else:
                skill_bonus = 0.0

            # c. Khớp cấp độ khóa học (+0.10) - xử lý an toàn nếu level là None
            c_level = str(c.get("level") or "").strip().lower()
            level_bonus = WEIGHT_LEVEL if (c_level and user_level and c_level == user_level) else 0.0

            # d. Đánh giá chất lượng (+0.05) - xử lý an toàn khi average_rating là None
            raw_rating = c.get("average_rating")
            if raw_rating is not None:
                try:
                    rating_val = float(raw_rating)
                    if 0.0 < rating_val <= 5.0:
                        rating_bonus = WEIGHT_RATING * (rating_val / 5.0)
                    else:
                        rating_bonus = 0.0
                except (ValueError, TypeError):
                    rating_bonus = 0.0
            else:
                # Khóa mới chưa có đánh giá -> bonus = 0 để công bằng với khóa có đánh giá thật
                rating_bonus = 0.0

            # Tổng điểm Content-Based:
            # = 0.40 * base_sim + 0.25 (cat) + 0.20 (skill) + 0.10 (level) + 0.05 (rating)
            # Tổng tối đa đúng bằng 1.0000, không bị bão hòa, xếp hạng phân biệt rõ rệt
            final_cb_score = (
                WEIGHT_BASE_SIM * base_sim
                + cat_bonus
                + skill_bonus
                + level_bonus
                + rating_bonus
            )

            scores[cid] = round(final_cb_score, 4)

        return scores
