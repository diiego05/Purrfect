import type { FC } from 'react';
import type { Course } from '../../types/course';
import { CourseCard } from './CourseCard';

interface CourseSectionProps {
  title: string;
  subtitle?: string;
  courses: Course[];
  viewAllLink?: string;
  onCourseClick?: (course: Course) => void;
  sectionId?: string;
}

export const CourseSection: FC<CourseSectionProps> = ({
  title,
  subtitle,
  courses,
  viewAllLink = '#',
  onCourseClick,
  sectionId,
}) => {
  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <section className="course-section" id={sectionId}>
      <div className="course-section-header">
        <div className="course-section-title-wrap">
          <h2 className="course-section-title">{title}</h2>
          {subtitle && <p className="course-section-subtitle">{subtitle}</p>}
        </div>
        <a href={viewAllLink} className="course-section-view-all">
          <span>Xem tất cả</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </div>

      <div className="course-grid">
        {courses.map((course) => (
          <CourseCard
            key={course._id || course.slug}
            course={course}
            onClick={onCourseClick}
          />
        ))}
      </div>
    </section>
  );
};
