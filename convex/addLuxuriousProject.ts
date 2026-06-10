import { mutation } from "./_generated/server";

export default mutation({
  args: {},
  handler: async (ctx) => {
    const portfolio = await ctx.db.query("portfolio").first();
    if (!portfolio) throw new Error("No portfolio found.");

    const p = portfolio.content;

    // Remove any existing Luxurious project to prevent duplicates
    p.projects.featured = (p.projects.featured || []).filter(
      (proj: any) => !proj.name.includes("Luxurious")
    );

    // Add Luxurious project
    p.projects.featured.push({
      name: "Luxurious (Luxurious Workspace Portal)",
      period: "2026",
      stack: "React 19, Vite 8, Convex, Tailwind CSS 4, @xyflow/react, Leaflet",
      description:
        "Real-time organization workspace companion featuring an interactive canvas-based org chart, dense data dashboards, and role-gated admin management toolsets built with strict visual and state parity to its mobile counterpart.",
      demoSlug: "luxurious",
      mysteryLore: "Built out of a need to control the matrix from a 4K monitor instead of a tiny glass rectangle.",
    });

    await ctx.db.patch(portfolio._id, { content: p });
    return "Luxurious project added successfully!";
  },
});
