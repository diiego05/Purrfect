"""
FastAPI Microservice for AI Course Recommendation (Content-Based + SVD Collaborative)
and RAG Chatbot Service (LangChain + ChromaDB Architecture)
Khớp chính xác với Lược đồ tuần tự 3.2.21:
AiChatController -> FastApiRAGService: POST /ai/v1/rag/query (courseId, userPrompt)
"""
from typing import List, Dict, Optional, Any
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.content_based import ContentBasedRecommender
from app.svd_recommender import SVDCollaborativeRecommender
from app.next_sequence import NextSequenceEngine
from app.rag_service import RAGChatbotEngine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("purrfect.ai.main")

app = FastAPI(
    title="Purrfect AI Recommendation & RAG Engine",
    version="1.3.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cb_engine = ContentBasedRecommender()
svd_engine = SVDCollaborativeRecommender(
    n_factors=10,
    min_interactions=20,
    min_users=5,
    min_courses=5
)
seq_engine = NextSequenceEngine()
rag_engine = RAGChatbotEngine()


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


# Chatbot RAG Schemas
class ChatMessageRequest(BaseModel):
    message: Optional[str] = None
    userPrompt: Optional[str] = None
    courseId: Optional[str] = None
    courses: Optional[List[Dict[str, Any]]] = []


class ChatMessageResponse(BaseModel):
    success: bool
    answer: str
    suggested_courses: List[Dict[str, Any]]
    is_out_of_scope: bool
    relevant_context_chunks: Optional[List[str]] = []


# Schema chuẩn theo Lược đồ tuần tự 3.2.21
class RAGQueryRequest(BaseModel):
    courseId: Optional[str] = None
    course_id: Optional[str] = None
    userPrompt: Optional[str] = None
    message: Optional[str] = None


@app.get("/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "Purrfect AI Recommendation & RAG Engine",
        "svd_trained": svd_engine.is_trained
    }


@app.post("/api/v1/train-svd")
def train_svd(interactions: List[InteractionInput]):
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
    data = [i.model_dump() for i in interactions]
    metrics = svd_engine.evaluate(data, k=k)
    return {
        "success": True,
        "k": k,
        "metrics": metrics
    }


@app.post("/api/v1/recommend", response_model=RecommendationResponse)
def get_recommendations(req: RecommendationRequest):
    course_dicts = [c.model_dump() for c in req.all_courses]
    enrolled_dicts = [c.model_dump() for c in req.enrolled_courses]
    onboarding_dict = req.onboarding.model_dump() if req.onboarding else {}
    enrolled_ids = {str(c.get("course_id") or "") for c in enrolled_dicts}

    if req.interactions and not svd_engine.is_trained:
        svd_engine.train([i.model_dump() for i in req.interactions])

    cb_scores = cb_engine.score_courses(
        courses=course_dicts,
        onboarding=onboarding_dict,
        search_keywords=req.search_keywords
    )

    user_id = req.user_id or ""
    all_course_ids = [str(c.get("course_id") or "") for c in course_dicts]
    svd_scores = svd_engine.score_all_courses(user_id, all_course_ids, exclude_seen=False)
    next_sequence_ids = set(seq_engine.find_next_courses(enrolled_dicts, course_dicts))

    has_svd_for_user = any(s is not None for s in svd_scores.values())
    is_cold_start = not svd_engine.is_trained or not has_svd_for_user
    alpha = 1.0 if is_cold_start else 0.6

    final_scores: Dict[str, float] = {}
    for c in course_dicts:
        cid = str(c.get("course_id") or "")
        if cid in enrolled_ids:
            continue

        c_score = cb_scores.get(cid, 0.0)
        s_score = svd_scores.get(cid)

        if s_score is not None and not is_cold_start:
            combined = alpha * c_score + (1.0 - alpha) * s_score
        else:
            combined = c_score

        if cid in next_sequence_ids:
            combined += 0.25

        final_scores[cid] = round(combined, 4)

    sorted_candidates = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
    recommended_ids = [cid for cid, score in sorted_candidates[:req.limit] if score > 0.0]

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


# ────────────────────────────────────────────────────────────
# RAG Chatbot AI Endpoints (LangChain + ChromaDB Vector Store)
# Khớp Lược đồ tuần tự 3.2.21
# ────────────────────────────────────────────────────────────

@app.post("/ai/v1/rag/query", response_model=ChatMessageResponse)
def rag_query_endpoint(req: RAGQueryRequest):
    """
    Điểm cuối chuẩn theo Lược đồ tuần tự 3.2.21:
    POST /ai/v1/rag/query (courseId, userPrompt)
    """
    prompt = req.userPrompt or req.message or ""
    cid = req.courseId or req.course_id
    result = rag_engine.query(prompt, course_id=cid)
    return ChatMessageResponse(
        success=True,
        answer=result["answer"],
        suggested_courses=result.get("suggested_courses", []),
        is_out_of_scope=result.get("is_out_of_scope", False),
        relevant_context_chunks=result.get("relevant_sources", [])
    )


@app.post("/api/v1/chat", response_model=ChatMessageResponse)
def chat_endpoint(req: ChatMessageRequest):
    """
    Điểm cuối RAG Chatbot: Truy vấn dữ liệu mô tả khóa học và chính sách hệ thống.
    """
    if req.courses:
        rag_engine.update_course_knowledge(req.courses)

    prompt = req.userPrompt or req.message or ""
    result = rag_engine.query(prompt, course_id=req.courseId)
    return ChatMessageResponse(
        success=True,
        answer=result["answer"],
        suggested_courses=result.get("suggested_courses", []),
        is_out_of_scope=result.get("is_out_of_scope", False),
        relevant_context_chunks=result.get("relevant_sources", [])
    )


@app.post("/api/v1/chat/stream")
def chat_stream_endpoint(req: ChatMessageRequest):
    """
    Điểm cuối Server-Sent Events (SSE) Token Streaming:
    Phản hồi token chuỗi ký tự nối tiếp cho giao diện chat (< 3s).
    """
    if req.courses:
        rag_engine.update_course_knowledge(req.courses)

    prompt = req.userPrompt or req.message or ""

    def event_generator():
        for token in rag_engine.stream_query(prompt, course_id=req.courseId):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
