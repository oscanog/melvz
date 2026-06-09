import { usePortfolioContent } from "../content/PortfolioContentProvider";
import type { PortfolioContent } from "../content/portfolioTypes";
import { ProfileImage } from "./ProfileImage";

/* ------------------------------------------
   Main LandingPage component
------------------------------------------ */
export default function LandingPage(): React.ReactElement {
  const { content, loading } = usePortfolioContent();

  return (
    <div className="lp-root">
      {/* -- Resume Paper -- */}
      <div className="lp-scroll">
        <div className="lp-paper">
          <ResumeContent content={content} imageLoading={loading} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------
   Resume Content
------------------------------------------ */
function ResumeContent({
  content,
  imageLoading,
}: {
  content: PortfolioContent;
  imageLoading: boolean;
}): React.ReactElement {
  return (
    <>
      <header className="rp-header">
        <div className="rp-photo">
          <ProfileImage
            src={content.profile.imageUrl}
            alt={content.profile.imageAlt}
            srcSet={content.profile.image2xUrl ? `${content.profile.imageUrl} 1x, ${content.profile.image2xUrl} 2x` : undefined}
            blurSrc={content.profile.imageBlurUrl}
            defer={imageLoading}
          />
        </div>
        <div className="rp-header__text">
          <h1 className="rp-name">{content.profile.name}</h1>
          <p className="rp-title">{content.profile.title}</p>
          <div className="rp-contacts">
            {content.profile.contacts.map((contact) => (
              <span key={contact}>{contact}</span>
            ))}
          </div>
        </div>
      </header>

      <hr className="rp-rule" />

      <section className="rp-section">
        <h2 className="rp-sh">PROFILE</h2>
        <p className="rp-body">{content.profile.summary}</p>
      </section>

      <div className="rp-two-col">
        <section className="rp-section">
          <h2 className="rp-sh">SKILLS</h2>
          <ul className="rp-ul">
            {content.skills.map((skillGroup) => (
              <li key={skillGroup.label}>
                <strong>{skillGroup.label}:</strong>{" "}
                {skillGroup.items.join(", ")}
              </li>
            ))}
          </ul>
        </section>

        <section className="rp-section">
          <h2 className="rp-sh">EDUCATION</h2>
          {content.education.map((item) => (
            <div className="rp-job" key={`${item.degree}-${item.period}`}>
              <div className="rp-job__head">
                <strong>{item.degree}</strong>
                <span className="rp-date">{item.period}</span>
              </div>
              <p className="rp-body-sm">
                {item.school}<br />{item.detail}
              </p>
            </div>
          ))}
        </section>
      </div>

      <section className="rp-section">
        <h2 className="rp-sh">EXPERIENCE</h2>
        {content.experiences.map((experience) => (
          <div className="rp-job" key={`${experience.role}-${experience.period}`}>
            <div className="rp-job__head">
              <strong>{experience.role}</strong>
              <span className="rp-date">{experience.period}</span>
            </div>
            <p className="rp-body-sm">{experience.description}</p>
          </div>
        ))}
      </section>

      <section className="rp-section">
        <h2 className="rp-sh">PROJECTS</h2>

        {content.projects.featured.map((project) => (
          <div className="rp-job" key={`${project.name}-${project.period}`}>
            <div className="rp-job__head">
              <strong>{project.name}</strong>
              <span className="rp-date">{project.period}</span>
            </div>
            <p className="rp-job__stack">{project.stack}</p>
            <p className="rp-body-sm">{project.description}</p>
          </div>
        ))}

        <div className="rp-two-col-sm">
          {content.projects.compact.map((project) => (
            <div className="rp-job" key={`${project.name}-${project.period}`}>
              <div className="rp-job__head">
                <strong>{project.name}</strong>
                <span className="rp-date">{project.period}</span>
              </div>
              <p className="rp-job__stack">{project.stack}</p>
              <p className="rp-body-sm">{project.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
