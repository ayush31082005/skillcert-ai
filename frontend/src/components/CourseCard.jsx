import Link from "next/link";

const covers = {
  javascript: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=900&q=85",
  react: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=900&q=85",
  python: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=900&q=85",
  design: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=900&q=85",
  fallback: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=85",
};

function getCover(course) {
  if (course.thumbnail) return course.thumbnail;
  const text = `${course.title || ""} ${course.category || ""}`.toLowerCase();
  if (text.includes("javascript")) return covers.javascript;
  if (text.includes("react")) return covers.react;
  if (text.includes("python") || text.includes("data")) return covers.python;
  if (text.includes("design") || text.includes("figma") || text.includes("ui/ux")) return covers.design;
  return covers.fallback;
}

export default function CourseCard({ course, progress = 0, featuredLabel = "" }) {
  return (
    <article className="course-card">
      <div className="course-cover course-cover-reference">
        <img src={getCover(course)} alt={`${course.title || "Course"} cover`} />
        {featuredLabel && (
          <span className={`course-ribbon course-ribbon-${featuredLabel.toLowerCase()}`}>
            {featuredLabel}
          </span>
        )}
      </div>
      <div className="course-body">
        <div className="course-level">{course.level || "beginner"} course</div>
        <small className="course-field-label">Course title</small>
        <h3>{course.title}</h3>
        <small className="course-field-label">Description</small>
        <p className="course-description">{course.description}</p>
        <div className="course-meta">
          <span>{course.numberOfQuestions || 5} question assessment</span>
          <span>{course.maximumAttempts || 2} attempts</span>
        </div>
        {progress > 0 && (
          <>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <small style={{ color: "var(--muted)" }}>{Math.round(progress)}% complete</small>
          </>
        )}
        <Link className="course-start-button" href={`/courses/${course._id}`}>
          {progress ? "Continue course" : "View course"} →
        </Link>
      </div>
    </article>
  );
}
