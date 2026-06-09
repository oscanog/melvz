import { mutation } from "./_generated/server";


// Random fun facts by category
const SKILL_LORE = [
  "I once re-wrote an entire backend module at 3 AM because the previous logic offended my sense of order.",
  "Tailwind is my paint, TypeScript is my canvas, and Coffee is the brush.",
  "My first PostgreSQL query accidentally locked a test table for 2 hours.",
  "I treat my components like my room: everything has a specific place and a specific name.",
];

const EDU_LORE = [
  "Graduated with honors and an unhealthy addiction to energy drinks.",
  "My capstone project was 90% completed during the weekend before the deadline.",
  "I skipped a party to finish a data structures assignment. No regrets.",
];

const EXP_LORE = [
  "Once debugged a production issue that turned out to be a single missing comma.",
  "I hold the team record for most consecutive flawless deployments.",
  "Spent 3 days optimizing a query that no one ended up using.",
  "Mastered QA & Ops during a 48-hour hackathon fueled entirely by cold brew.",
];

const PROJ_LORE = [
  "This project holds a special place in my heart... mostly because it actually compiled on the first try.",
  "We went through 4 different UI redesigns before settling on this one.",
  "The hardest part wasn't the code, it was agreeing on the color palette.",
];

function getRandomFact(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export default mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Get current portfolio
    const portfolio = await ctx.db.query("portfolio").first();
    if (!portfolio) throw new Error("No portfolio found.");

    const p = portfolio.content;

    // 2. Add mysteryLore
    p.skills = (p.skills || []).map((s: any) => ({
      ...s,
      mysteryLore: getRandomFact(SKILL_LORE),
    }));

    p.education = (p.education || []).map((e: any) => ({
      ...e,
      mysteryLore: getRandomFact(EDU_LORE),
    }));

    p.experiences = (p.experiences || []).map((e: any) => ({
      ...e,
      mysteryLore: getRandomFact(EXP_LORE),
    }));

    if (p.projects) {
      p.projects.featured = (p.projects.featured || []).map((proj: any) => ({
        ...proj,
        mysteryLore: getRandomFact(PROJ_LORE),
      }));

      p.projects.compact = (p.projects.compact || []).map((proj: any) => ({
        ...proj,
        mysteryLore: getRandomFact(PROJ_LORE),
      }));
    }

    // 3. Save
    await ctx.db.patch(portfolio._id, { content: p });
    return "Successfully seeded mystery lore to all sections!";
  },
});
