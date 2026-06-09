import { internalQuery } from "./_generated/server";
import { defaultPortfolio } from "./defaultPortfolio";

const PORTFOLIO_KEY = "main";

type AnyRecord = Record<string, any>;

function readContent(value: unknown): AnyRecord {
  return value && typeof value === "object"
    ? (value as AnyRecord)
    : (defaultPortfolio as unknown as AnyRecord);
}

function linesForPortfolio(content: AnyRecord) {
  const lines: string[] = [];
  const profile = readContent(content.profile);
  lines.push(`Name: ${profile.name ?? ""}`);
  lines.push(`Title: ${profile.title ?? ""}`);
  lines.push(`Summary: ${profile.summary ?? ""}`);

  const contacts = Array.isArray(profile.contacts) ? profile.contacts : [];
  if (contacts.length > 0) {
    lines.push(`Public contact lines: ${contacts.join(" | ")}`);
  }

  const skills = Array.isArray(content.skills) ? content.skills : [];
  for (const group of skills) {
    const skillGroup = readContent(group);
    const items = Array.isArray(skillGroup.items) ? skillGroup.items : [];
    lines.push(`Skill group - ${skillGroup.label ?? "Skills"}: ${items.join(", ")}`);
  }

  const education = Array.isArray(content.education) ? content.education : [];
  for (const item of education) {
    const entry = readContent(item);
    lines.push(
      `Education - ${entry.degree ?? ""}: ${entry.school ?? ""}; ${entry.period ?? ""}; ${entry.detail ?? ""}`,
    );
  }

  const experiences = Array.isArray(content.experiences) ? content.experiences : [];
  for (const item of experiences) {
    const entry = readContent(item);
    lines.push(`Experience - ${entry.role ?? ""}: ${entry.period ?? ""}; ${entry.description ?? ""}`);
  }

  const projects = readContent(content.projects);
  for (const bucket of ["featured", "compact"]) {
    const rows = Array.isArray(projects[bucket]) ? projects[bucket] : [];
    for (const project of rows) {
      const entry = readContent(project);
      const links = Array.isArray(entry.links)
        ? entry.links
            .map((link: AnyRecord) => `${link.label ?? "Link"} ${link.url ?? ""}`.trim())
            .join(", ")
        : "";
      lines.push(
        `Project - ${entry.name ?? ""}: ${entry.period ?? ""}; stack ${entry.stack ?? ""}; ${entry.description ?? ""}; ${links}`,
      );
    }
  }

  const socials = Array.isArray(content.socials) ? content.socials : [];
  for (const social of socials) {
    const entry = readContent(social);
    lines.push(`Social - ${entry.name ?? ""}: ${entry.description ?? ""}; ${entry.url ?? entry.address ?? ""}`);
  }

  const game = readContent(content.game);
  const zones = Array.isArray(game.zones) ? game.zones : [];
  for (const zone of zones) {
    const entry = readContent(zone);
    const zoneProjects = Array.isArray(entry.projects)
      ? entry.projects.map((project: AnyRecord) => `${project.name ?? ""} (${project.stack ?? ""})`).join(", ")
      : "";
    lines.push(
      `Game zone - ${entry.year ?? ""} ${entry.role ?? ""}: ${entry.kiss ?? ""}; projects ${zoneProjects}`,
    );
  }

  return lines.filter((line) => line.replace(/[^A-Za-z0-9]/g, "").length > 0);
}

export const getPortfolioContextForAction = internalQuery({
  args: {},
  handler: async (ctx) => {
    const doc = await ctx.db
      .query("portfolio")
      .withIndex("by_key", (q) => q.eq("key", PORTFOLIO_KEY))
      .unique();
    const content = readContent(doc?.content);
    return linesForPortfolio(content).join("\n").slice(0, 16000);
  },
});
