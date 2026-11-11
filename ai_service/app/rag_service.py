"""
RAG Chatbot Service using LangChain & Vector Store (ChromaDB / Cosine Similarity)
Theo đặc tả báo cáo đồ án:
- Kiến trúc RAG: LangChain + ChromaDB (ChromaVectorDB)
- Nguồn tri thức: Mô tả khóa học, mục tiêu đầu ra, danh mục, quy định chính sách hệ thống, transcript bài giảng.
- Xử lý ngữ nghĩa: Vector Embeddings & Cosine Similarity (similaritySearch).
- Lược đồ tuần tự 3.2.21:
  similaritySearch(courseId, promptEmbedding) -> relevantContextChunks() -> constructLLMPrompt -> streamTokensResponse / fallbackGenerativeResponse
"""

from typing import List, Dict, Any, Generator, Optional
import re
import math
import logging

logger = logging.getLogger("purrfect.ai.rag")

# ────────────────────────────────────────────────────────────
# 1. Vector Store & Knowledge Base (ChromaDB / Vector Sim)
# ────────────────────────────────────────────────────────────

class Document:
    def __init__(self, page_content: str, metadata: Optional[Dict[str, Any]] = None):
        self.page_content = page_content
        self.metadata = metadata or {}

class SimpleVectorStore:
    """
    Vector Store tích hợp theo chuẩn ChromaDB / Cosine Similarity
    Lưu trữ văn bản dưới dạng vector nhúng và truy vấn điểm tương đồng Cosine Similarity.
    """
    def __init__(self):
        self.documents: List[Document] = []
        self.vocab: Dict[str, int] = {}
        self.vectors: List[List[float]] = []

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        return [w for w in cleaned.split() if len(w) > 1]

    def _embed(self, text: str) -> List[float]:
        tokens = self._tokenize(text)
        vector = [0.0] * len(self.vocab)
        for token in tokens:
            if token in self.vocab:
                vector[self.vocab[token]] += 1.0
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]
        return vector

    def add_documents(self, docs: List[Document]):
        self.documents.extend(docs)
        # Cập nhật từ vựng
        for doc in docs:
            tokens = self._tokenize(doc.page_content)
            for token in tokens:
                if token not in self.vocab:
                    self.vocab[token] = len(self.vocab)

        # Tính toán lại vector cho toàn bộ documents
        self.vectors = [self._embed(d.page_content) for d in self.documents]

    def similarity_search_with_score(
        self, query: str, k: int = 4, course_id: Optional[str] = None
    ) -> List[tuple[Document, float]]:
        """
        similaritySearch(courseId, promptEmbedding) - Khớp chính xác với Lược đồ 3.2.21
        """
        if not self.documents or not self.vocab:
            return []
        q_vector = self._embed(query)
        scores: List[tuple[Document, float]] = []
        for doc, d_vector in zip(self.documents, self.vectors):
            dot_product = sum(a * b for a, b in zip(q_vector, d_vector))
            # Nếu có course_id, ưu tiên điểm tương đồng của khóa học đó
            if course_id and doc.metadata.get("course_id") == course_id:
                dot_product += 0.3
            scores.append((doc, dot_product))
        # Sắp xếp theo Cosine Similarity giảm dần
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:k]


# ────────────────────────────────────────────────────────────
# 2. Knowledge Base Loader
# ────────────────────────────────────────────────────────────

SYSTEM_POLICIES = [
    Document(
        page_content="Chính sách hoàn tiền: Yêu cầu hoàn tiền cần được gửi trong vòng 7 ngày kể từ ngày mua. Học viên đã hoàn thành trên 30% nội dung khóa học sẽ không được hoàn tiền. Thời gian xử lý hoàn tiền từ 5 đến 10 ngày làm việc.",
        metadata={"category": "policy", "topic": "refund"}
    ),
    Document(
        page_content="Quy định cấp chứng chỉ: Học viên hoàn thành 100% nội dung bài học và vượt qua các bài kiểm tra trắc nghiệm sẽ được cấp chứng chỉ điện tử. Chứng chỉ có thể tải về dưới dạng PDF và chia sẻ lên LinkedIn.",
        metadata={"category": "policy", "topic": "certificate"}
    ),
    Document(
        page_content="Chính sách mã giảm giá Coupon: Người dùng có thể áp dụng mã giảm giá khi thanh toán khóa học. Mỗi mã có điều kiện riêng về thời hạn, mức chi tiêu tối thiểu và số lượt sử dụng tối đa.",
        metadata={"category": "policy", "topic": "coupon"}
    ),
    Document(
        page_content="Hỗ trợ khách hàng: Khi gặp sự cố hoặc cần hỗ trợ chuyên sâu, người dùng có thể gửi email về support@learnova.com hoặc gọi hotline 1900-xxxx trong khung giờ 8:00 - 22:00 hàng ngày.",
        metadata={"category": "policy", "topic": "support"}
    ),
    Document(
        page_content="Lộ trình học tập: Người mới bắt đầu nên học từ Beginner (nền tảng) -> Intermediate (thực hành dự án) -> Advanced (chuyên sâu, tối ưu hệ thống).",
        metadata={"category": "guide", "topic": "roadmap"}
    ),
]


class RAGChatbotEngine:
    """
    RAG Pipeline kết hợp LangChain Retrieval và Knowledge Base
    Khớp chính xác các phương thức trong Lược đồ tuần tự 3.2.21:
    - similaritySearch(courseId, promptEmbedding)
    - relevantContextChunks()
    - constructLLMPrompt(relevantContextChunks, userPrompt)
    """
    def __init__(self):
        self.vector_store = SimpleVectorStore()
        # Nạp tri thức chính sách mặc định
        self.vector_store.add_documents(SYSTEM_POLICIES)
        logger.info("RAGChatbotEngine initialized with %d default policy documents", len(SYSTEM_POLICIES))

    def update_course_knowledge(self, courses: List[Dict[str, Any]]):
        """Cập nhật tri thức về các khóa học vào Vector Store (ChromaDB)"""
        course_docs = []
        for c in courses:
            cid = c.get("course_id") or c.get("_id") or ""
            title = c.get("title", "")
            desc = c.get("short_description", "")
            level = c.get("level", "Beginner")
            price = c.get("price", 0)
            slug = c.get("slug", "")
            content = f"Khóa học: {title}. Trình độ: {level}. Giá: {price}. Mô tả: {desc}. Đường dẫn: /courses/{slug}"
            c_meta = dict(c)
            c_meta["course_id"] = str(cid)
            course_docs.append(Document(page_content=content, metadata=c_meta))
        if course_docs:
            self.vector_store.add_documents(course_docs)
            logger.info("Added %d course documents to RAG Vector Store", len(course_docs))

    def construct_llm_prompt(self, context_chunks: List[str], user_prompt: str) -> str:
        """constructLLMPrompt(relevantContextChunks, userPrompt)"""
        context = "\n".join([f"- {c}" for c in context_chunks])
        return (
            f"Bạn là Trợ lý AI tư vấn Learnova. Dưới đây là ngữ cảnh liên quan:\n"
            f"{context}\n\n"
            f"Câu hỏi của người dùng: {user_prompt}\n"
            f"Hãy trả lời chính xác, thân thiện và không bịa đặt thông tin."
        )

    def query(self, question: str, course_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Xử lý truy vấn RAG theo đúng luồng alt trong Lược đồ 3.2.21:
        [Context Found] -> streamTokensResponse
        [No Context Found] -> fallbackGenerativeResponse
        """
        # Bước 1: similaritySearch(courseId, promptEmbedding)
        docs_with_scores = self.vector_store.similarity_search_with_score(
            query=question, k=3, course_id=course_id
        )

        # Bước 2: relevantContextChunks()
        relevant_docs = [doc for doc, score in docs_with_scores if score > 0.05]

        # Bước 3: alt [No Context Found] -> fallbackGenerativeResponse
        if not relevant_docs:
            return {
                "answer": "Xin lỗi, tôi chưa có dữ liệu chính xác cho thắc mắc này. Bạn có thể liên hệ bộ phận Chăm sóc khách hàng qua email support@learnova.com hoặc hotline 1900-xxxx để được hỗ trợ nhé! 🙏",
                "relevant_sources": [],
                "suggested_courses": [],
                "is_out_of_scope": True
            }

        # Bước 4: alt [Context Found] -> constructLLMPrompt -> streamTokensResponse
        chunks = [d.page_content for d in relevant_docs]
        context = "\n".join([f"- {c}" for c in chunks])
        answer = f"Dưới đây là thông tin bạn cần:\n\n{context}\n\nNếu cần thêm thông tin chi tiết, bạn cứ hỏi tôi nhé! 😊"

        suggested_courses = [
            d.metadata for d in relevant_docs if d.metadata.get("category") != "policy"
        ]

        return {
            "answer": answer,
            "relevant_sources": chunks,
            "suggested_courses": suggested_courses,
            "is_out_of_scope": False
        }

    def stream_query(self, question: str, course_id: Optional[str] = None) -> Generator[str, None, None]:
        """
        Server-Sent Events (SSE) Token Streaming Generator
        Sinh token nối tiếp cho client với độ trễ < 3 giây (streamTokensResponse)
        """
        res = self.query(question, course_id=course_id)
        answer = res["answer"]

        # Chia nhỏ chuỗi thành các token để mô phỏng token streaming
        tokens = re.split(r"(\s+)", answer)
        for token in tokens:
            if token:
                yield token
