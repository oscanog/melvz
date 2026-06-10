import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { usePortfolioContent } from "../content/PortfolioContentProvider";
import type { PortfolioContent } from "../content/portfolioTypes";
import { ProfileImage } from "./ProfileImage";
import { MysteryHotspot } from "./MysteryLore";
import { PdfDownloadButton } from "./PdfDownloadButton";

/* ------------------------------------------
   Main LandingPage component
------------------------------------------ */
export default function LandingPage(): React.ReactElement {
  const { content, loading } = usePortfolioContent();
  const showcases = useQuery(api.showcases.listActive) || [];

  return (
    <div className="lp-root">
      {/* -- Resume Paper -- */}
      <div className="lp-scroll">
        <div className="lp-paper" id="resume-paper">
          <PdfDownloadButton paperId="resume-paper" />
          <ResumeContent content={content} imageLoading={loading} showcases={showcases} />
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
  showcases,
}: {
  content: PortfolioContent;
  imageLoading: boolean;
  showcases: Array<{ name: string; slug: string }>;
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
              <MysteryHotspot key={skillGroup.label} lore={skillGroup.mysteryLore}>
                <li>
                  <strong>{skillGroup.label}:</strong>{" "}
                  {skillGroup.items.join(", ")}
                </li>
              </MysteryHotspot>
            ))}
          </ul>
        </section>

        <section className="rp-section">
          <h2 className="rp-sh">EDUCATION</h2>
          {content.education.map((item) => (
            <MysteryHotspot key={`${item.degree}-${item.period}`} lore={item.mysteryLore}>
              <div className="rp-job">
                <div className="rp-job__head">
                  <strong>{item.degree}</strong>
                  <span className="rp-date">{item.period}</span>
                </div>
                <p className="rp-body-sm">
                  {item.school}<br />{item.detail}
                </p>
              </div>
            </MysteryHotspot>
          ))}
        </section>
      </div>

      <section className="rp-section">
        <h2 className="rp-sh">EXPERIENCE</h2>
        {content.experiences.map((experience) => (
          <MysteryHotspot key={`${experience.role}-${experience.period}`} lore={experience.mysteryLore}>
            <div className="rp-job">
              <div className="rp-job__head">
                <strong>{experience.role}</strong>
                <span className="rp-date">{experience.period}</span>
              </div>
              <p className="rp-body-sm">{experience.description}</p>
            </div>
          </MysteryHotspot>
        ))}
      </section>

      <section className="rp-section">
        <h2 className="rp-sh">PROJECTS</h2>

        {content.projects.featured.map((project) => {
          const sc = showcases.find((s) => project.name.includes(s.name) || s.name.includes(project.name));
          return (
            <MysteryHotspot key={`${project.name}-${project.period}`} lore={sc ? undefined : project.mysteryLore}>
              <div className="rp-job">
                <div className="rp-job__head">
                  <strong>
                    {sc ? (
                      <a href={`#project/${sc.slug}`} className="rp-project-link">
                        {project.name}
                      </a>
                    ) : (
                      project.name
                    )}
                  </strong>
                  <span className="rp-date">{project.period}</span>
                </div>
                <p className="rp-job__stack">{project.stack}</p>
                <p className="rp-body-sm">{project.description}</p>
              </div>
            </MysteryHotspot>
          );
        })}

        <div className="rp-two-col-sm">
          {content.projects.compact.map((project) => {
            const sc = showcases.find((s) => project.name.includes(s.name) || s.name.includes(project.name));
            return (
              <MysteryHotspot key={`${project.name}-${project.period}`} lore={sc ? undefined : project.mysteryLore}>
                <div className="rp-job">
                  <div className="rp-job__head">
                    <strong>
                      {sc ? (
                        <a href={`#project/${sc.slug}`} className="rp-project-link">
                          {project.name}
                        </a>
                      ) : (
                        project.name
                      )}
                    </strong>
                    <span className="rp-date">{project.period}</span>
                  </div>
                  <p className="rp-body-sm">{project.description}</p>
                </div>
              </MysteryHotspot>
            );
          })}
        </div>
      </section>
    </>
  );
}
