import { useState, type FC } from 'react';
import type { Course } from '../../types/course';
import { formatVND } from '../../utils/format';

interface CourseCardProps {
  course: Course;
  onClick?: (course: Course) => void;
}

export const CourseCard: FC<CourseCardProps> = ({ course, onClick }) => {
  const {
    title,
    shortDescription,
    thumbnailUrl,
    badge,
    price,
    durationText,
    durationHours,
    averageRating,
  } = course;

  const [imgSrc, setImgSrc] = useState(
    thumbnailUrl || '/assets/advanced_digital_skills.jpg',
  );

  const displayPrice = formatVND(price);

  // Format duration (e.g. "20h")
  const displayDuration =
    durationText || (durationHours ? `${durationHours}h` : '15h');

  // Format rating (e.g. "4.8")
  const displayRating = averageRating
    ? Number(averageRating).toFixed(1)
    : '4.8';

  return (
    <article
      className="course-card"
      onClick={() => onClick?.(course)}
      tabIndex={0}
      role="button"
      aria-label={`Khóa học ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(course);
        }
      }}
    >
      {/* Thumbnail image */}
      <div className="course-card-thumb-wrapper">
        <img
          src={imgSrc}
          alt={title}
          className="course-card-thumb-img"
          loading="lazy"
          onError={() => {
            setImgSrc('/assets/advanced_digital_skills.jpg');
          }}
        />
      </div>

      {/* Card Body */}
      <div className="course-card-body">
        {/* Top Meta: Badge on left, Price on right */}
        <div className="course-card-header-row">
          {badge ? (
            <span className={`course-card-badge badge-${badge.toLowerCase()}`}>
              {badge}
            </span>
          ) : (
            <span className="course-card-badge-placeholder" />
          )}
          <div className="course-card-price">{displayPrice}</div>
        </div>

        {/* Title */}
        <h3 className="course-card-title" title={title}>
          {title}
        </h3>

        {/* Short Description */}
        <p className="course-card-desc" title={shortDescription}>
          {shortDescription ||
            'Master cutting-edge techniques in this comprehensive course.'}
        </p>

        {/* Bottom Meta: Duration & Rating */}
        <div className="course-card-footer">
          <div className="course-meta-duration">
            <svg
              className="course-meta-icon clock-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{displayDuration}</span>
          </div>

          <div className="course-meta-rating">
            <svg
              className="course-meta-icon star-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="#f59e0b"
              stroke="#f59e0b"
              strokeWidth="1"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="rating-value">{displayRating}</span>
          </div>
        </div>
      </div>
    </article>
  );
};
