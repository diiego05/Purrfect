"""
Learning Progression / Next-in-Sequence Engine
"""
from typing import List, Dict, Any


class NextSequenceEngine:
    LEVEL_PROGRESSION = {
        "beginner": "Intermediate",
        "intermediate": "Advanced",
        "advanced": "Advanced",
    }

    def find_next_courses(
        self,
        enrolled_courses: List[Dict[str, Any]],
        all_courses: List[Dict[str, Any]],
        progress_threshold: float = 70.0
    ) -> List[str]:
        """
        Tìm danh sách ID các khóa học nối tiếp khi học viên học đạt >= progress_threshold %
        """
        completed_or_near: List[Dict[str, Any]] = []
        for c in enrolled_courses:
            raw_progress = c.get("progress_percent")
            try:
                progress_val = float(raw_progress) if raw_progress is not None else 0.0
            except (ValueError, TypeError):
                progress_val = 0.0

            if progress_val >= progress_threshold:
                completed_or_near.append(c)

        if not completed_or_near:
            return []

        enrolled_ids = {str(c.get("course_id") or "") for c in enrolled_courses}
        next_course_ids: List[str] = []

        for finished in completed_or_near:
            current_level = str(finished.get("level") or "Beginner").strip().lower()
            target_level = self.LEVEL_PROGRESSION.get(current_level, "Intermediate").lower()
            finished_cat = str(finished.get("category_slug") or "").strip().lower()
            finished_skills = {
                str(s).strip().lower()
                for s in (finished.get("skill_slugs") or [])
                if s
            }

            # Tìm ứng viên: chưa học, cùng category hoặc có chung kỹ năng, và đúng target level
            for candidate in all_courses:
                cid = str(candidate.get("course_id") or "")
                if not cid or cid in enrolled_ids:
                    continue

                c_level = str(candidate.get("level") or "").strip().lower()
                c_cat = str(candidate.get("category_slug") or "").strip().lower()
                c_skills = {
                    str(s).strip().lower()
                    for s in (candidate.get("skill_slugs") or [])
                    if s
                }

                is_same_category = (c_cat == finished_cat and finished_cat != "")
                has_skill_overlap = len(c_skills.intersection(finished_skills)) > 0
                is_target_level = (c_level == target_level)

                if (is_same_category or has_skill_overlap) and is_target_level:
                    if cid not in next_course_ids:
                        next_course_ids.append(cid)

        return next_course_ids
