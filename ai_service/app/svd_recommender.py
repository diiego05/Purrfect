"""
Collaborative Filtering Module using TruncatedSVD (Matrix Factorization)
"""
from typing import List, Dict, Any, Optional, Set
import logging
import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD

logger = logging.getLogger("purrfect.ai.svd")


class SVDCollaborativeRecommender:
    def __init__(
        self,
        n_factors: int = 10,
        min_interactions: int = 20,
        min_users: int = 5,
        min_courses: int = 5
    ):
        self.n_factors = n_factors
        self.min_interactions = min_interactions
        self.min_users = min_users
        self.min_courses = min_courses

        self.user_factors: Optional[np.ndarray] = None
        self.item_factors: Optional[np.ndarray] = None

        self.user_to_idx: Dict[str, int] = {}
        self.course_to_idx: Dict[str, int] = {}
        self.idx_to_course: Dict[int, str] = {}
        self.user_seen: Dict[str, Set[str]] = {}
        self.is_trained: bool = False

    def _reset(self) -> None:
        self.user_factors = None
        self.item_factors = None
        self.user_to_idx = {}
        self.course_to_idx = {}
        self.idx_to_course = {}
        self.user_seen = {}
        self.is_trained = False

    def train(self, interactions: List[Dict[str, Any]]) -> bool:
        if not interactions or len(interactions) < self.min_interactions:
            self._reset()
            return False

        try:
            df = pd.DataFrame(interactions)
            required_cols = {"userId", "courseId", "rating"}
            if not required_cols.issubset(df.columns):
                self._reset()
                return False

            df = df.dropna(subset=["userId", "courseId", "rating"])
            df["userId"] = df["userId"].astype(str)
            df["courseId"] = df["courseId"].astype(str)
            df["rating"] = pd.to_numeric(df["rating"], errors="coerce").fillna(1.0)

            n_unique_users = df["userId"].nunique()
            n_unique_courses = df["courseId"].nunique()

            if n_unique_users < self.min_users or n_unique_courses < self.min_courses:
                self._reset()
                return False

            pivot = df.pivot_table(index="userId", columns="courseId", values="rating", aggfunc="mean").fillna(0.0)

            local_user_list = list(pivot.index)
            local_course_list = list(pivot.columns)

            local_user_to_idx = {u: i for i, u in enumerate(local_user_list)}
            local_course_to_idx = {c: i for i, c in enumerate(local_course_list)}
            local_idx_to_course = {i: c for i, c in enumerate(local_course_list)}

            local_user_seen: Dict[str, Set[str]] = {}
            for u, group in df.groupby("userId"):
                local_user_seen[str(u)] = set(group["courseId"].astype(str).unique())

            R = pivot.values
            n_users, n_items = R.shape

            n_components = min(self.n_factors, n_users - 1, n_items - 1)
            if n_components < 1:
                n_components = 1

            svd = TruncatedSVD(n_components=n_components, random_state=42)
            U_sigma = svd.fit_transform(R)
            VT = svd.components_

            self.user_to_idx = local_user_to_idx
            self.course_to_idx = local_course_to_idx
            self.idx_to_course = local_idx_to_course
            self.user_factors = U_sigma
            self.item_factors = VT
            self.user_seen = local_user_seen
            self.is_trained = True

            return True

        except Exception as e:
            logger.error("svd train error: %s", e)
            self._reset()
            return False

    def score_all_courses(
        self,
        user_id: str,
        course_ids: List[str],
        exclude_seen: bool = False
    ) -> Dict[str, Optional[float]]:
        if not self.is_trained or self.user_factors is None or self.item_factors is None:
            return {cid: None for cid in course_ids}

        if user_id not in self.user_to_idx:
            return {cid: None for cid in course_ids}

        u_idx = self.user_to_idx[user_id]
        u_vector = self.user_factors[u_idx]
        raw_scores_all = np.dot(u_vector, self.item_factors)

        seen_set = self.user_seen.get(user_id, set()) if exclude_seen else set()

        valid_cids: List[str] = []
        valid_raws: List[float] = []

        for cid in course_ids:
            if exclude_seen and cid in seen_set:
                continue
            if cid in self.course_to_idx:
                c_idx = self.course_to_idx[cid]
                valid_cids.append(cid)
                valid_raws.append(float(raw_scores_all[c_idx]))

        scores: Dict[str, Optional[float]] = {cid: None for cid in course_ids}
        if not valid_raws:
            return scores

        min_val = min(valid_raws)
        max_val = max(valid_raws)
        range_val = max_val - min_val

        for cid, raw in zip(valid_cids, valid_raws):
            if range_val > 1e-6:
                norm_score = (raw - min_val) / range_val
            else:
                norm_score = 0.5

            scores[cid] = round(float(norm_score), 4)

        return scores

    def predict_score(
        self,
        user_id: str,
        course_id: str,
        exclude_seen: bool = False
    ) -> Optional[float]:
        scores = self.score_all_courses(user_id, [course_id], exclude_seen=exclude_seen)
        return scores.get(course_id)

    def evaluate(
        self,
        test_interactions: List[Dict[str, Any]],
        k: int = 5,
        rating_threshold: float = 3.0
    ) -> Dict[str, float]:
        if not self.is_trained or not test_interactions:
            return {"precision_at_k": 0.0, "recall_at_k": 0.0, "ndcg_at_k": 0.0, "evaluated_users": 0}

        df_test = pd.DataFrame(test_interactions)
        if "userId" not in df_test.columns or "courseId" not in df_test.columns or "rating" not in df_test.columns:
            return {"precision_at_k": 0.0, "recall_at_k": 0.0, "ndcg_at_k": 0.0, "evaluated_users": 0}

        df_relevant = df_test[df_test["rating"] >= rating_threshold]
        user_ground_truth: Dict[str, Set[str]] = {}
        for u, grp in df_relevant.groupby("userId"):
            user_ground_truth[str(u)] = set(grp["courseId"].astype(str).unique())

        all_courses = list(self.course_to_idx.keys())
        precisions: List[float] = []
        recalls: List[float] = []
        ndcgs: List[float] = []

        for u, actual_set in user_ground_truth.items():
            if u not in self.user_to_idx or not actual_set:
                continue

            pred_scores = self.score_all_courses(u, all_courses, exclude_seen=False)
            ranked = sorted(
                [(cid, score) for cid, score in pred_scores.items() if score is not None],
                key=lambda x: x[1],
                reverse=True
            )
            top_k_recs = [cid for cid, _ in ranked[:k]]

            if not top_k_recs:
                continue

            hits = len(set(top_k_recs).intersection(actual_set))
            precisions.append(hits / float(k))
            recalls.append(hits / float(len(actual_set)))

            dcg = 0.0
            for i, item in enumerate(top_k_recs):
                rel = 1.0 if item in actual_set else 0.0
                dcg += rel / np.log2(i + 2)

            idcg = sum(1.0 / np.log2(i + 2) for i in range(min(k, len(actual_set))))
            ndcg = (dcg / idcg) if idcg > 0 else 0.0
            ndcgs.append(ndcg)

        if not precisions:
            return {"precision_at_k": 0.0, "recall_at_k": 0.0, "ndcg_at_k": 0.0, "evaluated_users": 0}

        return {
            "precision_at_k": round(float(np.mean(precisions)), 4),
            "recall_at_k": round(float(np.mean(recalls)), 4),
            "ndcg_at_k": round(float(np.mean(ndcgs)), 4),
            "evaluated_users": len(precisions)
        }
