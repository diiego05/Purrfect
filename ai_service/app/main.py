"""
FastAPI Microservice for AI Course Recommendation (Content-Based + SVD Collaborative)
"""
from typing import List, Dict, Any, Optional
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.content_based import ContentBasedRecommender
from app.svd_recommender import SVDCollaborativeRecommender
from app.next_sequence import NextSequenceEngine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("purrfect.ai.main")

app = FastAPI(
    title="Purrfect AI Recommendation Engine",
    description="Microservice AI Gợi ý khóa học dùng Content-Based (TF-IDF) & Collaborative Filtering (SVD)",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo các module thuật toán
cb_engine = ContentBasedRecommender()
# Ngưỡng SVD production: 20 tương tác, 5 học viên, 5 khóa học
svd_engine = SVDCollaborativeRecommender(
    n_factors=10,
    min_interactions=20,
    min_users=5,
    min_courses=5
)
seq_engine = NextSequenceEngine()


# --- Pydantic Data Schemas ---

class CourseInput(BaseModel):
    course_id: str
    title: Optional[str] = ""
    title_en: Optional[str] = ""
    short_description: Optional[str] = ""
    short_description_en: Optional[str] = ""
    category_slug: Optional[str] = ""
    skill_slugs: List[str] = []
    level: Optional[str] = "Beginner"
    average_rating: Optional[float] = None
    total_students: Optional[int] = 0


class EnrolledCourseInput(BaseModel):
    course_id: str
    category_slug: Optional[str] = ""
    skill_slugs: List[str] = []
    level: Optional[str] = "Beginner"
    progress_percent: Optional[float] = 0.0


class OnboardingInput(BaseModel):
    primary_goal: Optional[str] = ""
    category_slugs: List[str] = []
    skill_slugs: List[str] = []
    skill_level: Optional[str] = "Beginner"


class InteractionInput(BaseModel):
    userId: str
    courseId: str
    rating: float


class RecommendationRequest(BaseModel):
    user_id: Optional[str] = None
    onboarding: Optional[OnboardingInput] = None
    search_keywords: List[str] = []
    enrolled_courses: List[EnrolledCourseInput] = []
    all_courses: List[CourseInput]
    interactions: List[InteractionInput] = []
    limit: int = 8


class RecommendationResponse(BaseModel):
    success: bool
    recommended_course_ids: List[str]
    next_sequence_course_ids: List[str]
    course_scores: Dict[str, float]
    strategy_used: str


# --- Endpoints ---

@app.get("/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "Purrfect AI Recommendation Engine",
        "svd_trained": svd_engine.is_trained
    }


@app.post("/api/v1/train-svd")
def train_svd(interactions: List[InteractionInput]):
    """
    Huấn luyện ma trận SVD định kỳ từ dữ liệu tương tác
    """
    data = [i.model_dump() for i in interactions]
    success = svd_engine.train(data)
    return {
        "success": success,
        "message": (
            "Huấn luyện SVD thành công"
            if success
            else f"Chưa đủ dữ liệu (yêu cầu tối thiểu {svd_engine.min_interactions} tương tác, "
                 f"{svd_engine.min_users} học viên, {svd_engine.min_courses} khóa học)"
        )
    }


@app.post("/api/v1/evaluate-svd")
def evaluate_svd(interactions: List[InteractionInput], k: int = 5):
    """
    Đánh giá mô hình SVD với các chỉ số xếp hạng: Precision@K, Recall@K, NDCG@K
    """
    data = [i.model_dump() for i in interactions]
    metrics = svd_engine.evaluate(data, k=k)
    return {
        "success": True,
        "k": k,
        "metrics": metrics
    }


@app.post("/api/v1/recommend", response_model=RecommendationResponse)
def get_recommendations(req: RecommendationRequest):
    """
    API chính: Kết hợp Content-Based (TF-IDF) + Collaborative (SVD) + Lộ trình nối tiếp
    """
    course_dicts = [c.model_dump() for c in req.all_courses]
    enrolled_dicts = [c.model_dump() for c in req.enrolled_courses]
    onboarding_dict = req.onboarding.model_dump() if req.onboarding else {}
    enrolled_ids = {str(c.get("course_id") or "") for c in enrolled_dicts}

    # 1. Huấn luyện SVD realtime nếu có tương tác gửi kèm và chưa train
    if req.interactions and not svd_engine.is_trained:
        svd_engine.train([i.model_dump() for i in req.interactions])

    # 2. Tính điểm Content-Based từ Onboarding + Search (TF-IDF + Cosine)
    cb_scores = cb_engine.score_courses(
        courses=course_dicts,
        onboarding=onboarding_dict,
        search_keywords=req.search_keywords
    )

    # 3. Tính điểm Collaborative Filtering từ SVD (trả về Dict[str, Optional[float]])
    user_id = req.user_id or ""
    all_course_ids = [str(c.get("course_id") or "") for c in course_dicts]
    svd_scores = svd_engine.score_all_courses(user_id, all_course_ids, exclude_seen=False)

    # 4. Xác định danh sách khóa học nối tiếp (Next-in-Sequence)
    next_sequence_ids = set(seq_engine.find_next_courses(enrolled_dicts, course_dicts))

    # 5. Hybrid Scoring
    # Nếu SVD chưa train hoặc user này không có dữ liệu SVD (toàn None) -> Cold Start
    has_svd_for_user = any(s is not None for s in svd_scores.values())
    is_cold_start = not svd_engine.is_trained or not has_svd_for_user
    alpha = 1.0 if is_cold_start else 0.6  # 60% Content-based, 40% SVD

    final_scores: Dict[str, float] = {}

    for c in course_dicts:
        cid = str(c.get("course_id") or "")
        # Loại trừ các khóa học viên đã ghi danh
        if cid in enrolled_ids:
            continue

        c_score = cb_scores.get(cid, 0.0)
        s_score = svd_scores.get(cid)  # float hoặc None

        # Nếu khóa này có điểm SVD -> Kết hợp Hybrid
        # Nếu khóa này là unrated/mới (s_score is None) -> Dùng 100% Content-based, không phạt về 0
        if s_score is not None and not is_cold_start:
            combined = alpha * c_score + (1.0 - alpha) * s_score
        else:
            combined = c_score

        # Nếu là khóa học nối tiếp -> cộng thêm điểm thưởng +0.25 để ưu tiên hiển thị đầu
        if cid in next_sequence_ids:
            combined += 0.25

        final_scores[cid] = round(combined, 4)

    # 6. Sắp xếp giảm dần và lấy top K (chỉ gợi ý các khóa có điểm > 0 nếu là gợi ý cá nhân hóa)
    sorted_candidates = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
    recommended_ids = [cid for cid, score in sorted_candidates[:req.limit] if score > 0.0]

    # Nếu tất cả điểm đều bằng 0 (user cold start hoàn toàn), lấy top theo danh sách mặc định
    if not recommended_ids and sorted_candidates:
        recommended_ids = [cid for cid, _ in sorted_candidates[:req.limit]]

    strategy = "Content-Based (Cold-Start)" if is_cold_start else "Hybrid (Content-Based + SVD)"

    return RecommendationResponse(
        success=True,
        recommended_course_ids=recommended_ids,
        next_sequence_course_ids=list(next_sequence_ids),
        course_scores=final_scores,
        strategy_used=strategy
    )
