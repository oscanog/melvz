import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { ArrowLeft, Edit, Eye, EyeOff, Plus, Trash2, Save, X, LogOut, Layout, Loader2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AdminGate } from "./AdminGate";

type ShowcaseDoc = {
  _id: Id<"projectShowcases">;
  slug: string;
  name: string;
  url: string;
  description: string;
  stack: string;
  thumbnailUrl?: string;
  sortOrder: number;
  isActive: boolean;
};

export function ShowcaseManager() {
  return (
    <AdminGate loginMessage="Login to manage project showcases.">
      {({ sessionToken, logout }) => <ShowcaseManagerInner sessionToken={sessionToken} logout={logout} />}
    </AdminGate>
  );
}

function ShowcaseManagerInner({ sessionToken, logout }: { sessionToken: string; logout: () => void }) {
  const showcases = useQuery(api.showcases.listAll, { adminToken: sessionToken });
  const upsert = useMutation(api.showcases.upsert);
  const remove = useMutation(api.showcases.remove);
  const toggleActive = useMutation(api.showcases.toggleActive);

  const [editingId, setEditingId] = useState<Id<"projectShowcases"> | "new" | null>(null);
  const [formData, setFormData] = useState<Partial<ShowcaseDoc>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleEdit = (showcase?: ShowcaseDoc) => {
    if (showcase) {
      setEditingId(showcase._id);
      setFormData(showcase);
    } else {
      setEditingId("new");
      setFormData({
        slug: "",
        name: "",
        url: "https://",
        description: "",
        stack: "",
        sortOrder: (showcases?.length || 0) + 1,
        isActive: true,
      });
    }
    setError("");
  };

  const handleSave = async () => {
    try {
      setBusy(true);
      setError("");
      if (!formData.slug || !formData.name || !formData.url) {
        throw new Error("Slug, Name, and URL are required.");
      }
      
      await upsert({
        adminToken: sessionToken,
        id: editingId === "new" ? undefined : (editingId as Id<"projectShowcases">),
        slug: formData.slug!,
        name: formData.name!,
        url: formData.url!,
        description: formData.description || "",
        stack: formData.stack || "",
        thumbnailUrl: formData.thumbnailUrl,
        sortOrder: formData.sortOrder || 0,
        isActive: formData.isActive ?? true,
      });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save showcase");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: Id<"projectShowcases">) => {
    if (!window.confirm("Are you sure you want to permanently delete this showcase?")) return;
    try {
      setBusy(true);
      await remove({ adminToken: sessionToken, id });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="inline-admin-root admin-history-root">
      <header className="inline-admin-bar admin-history-topbar">
        <div>
          <p className="admin-eyebrow">Portfolio Admin</p>
          <h1>Project Showcases</h1>
        </div>
        <div className="inline-admin-actions">
          <button className="admin-primary-button" onClick={() => handleEdit()}>
            <Plus size={18} /> Add Showcase
          </button>
          <a className="admin-secondary-button" href="/#admin">
            Editor
          </a>
          <button className="admin-secondary-button" type="button" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <div className="admin-history-scroll">
        <section className="admin-history-page">
          <div className="admin-history-heading">
            <div>
              <p className="admin-eyebrow">Live Demos</p>
              <h2>Manage Showcases</h2>
            </div>
            <span className="admin-history-branch">
              <Layout size={16} />
              portfolio
            </span>
          </div>

          {showcases === undefined ? (
            <div className="admin-history-empty">
              <Loader2 size={18} /> Loading showcases...
            </div>
          ) : showcases.length === 0 ? (
            <div className="admin-history-empty">No showcases found. Create one!</div>
          ) : (
            <section className="admin-history-group">
              <div className="admin-history-date">
                <span className="admin-history-node" />
                <span>Active and Inactive Projects</span>
              </div>
              <div className="admin-history-card">
                {showcases.map((sc) => (
                  <article className="admin-history-row" key={sc._id} style={{ opacity: sc.isActive ? 1 : 0.6 }}>
                    <div className="admin-history-main">
                      <h3>
                        <button
                          className="admin-history-title-button"
                          type="button"
                          onClick={() => handleEdit(sc)}
                        >
                          {sc.name}
                        </button>
                      </h3>
                      <p>
                        <span className="admin-history-avatar">S</span>
                        /{sc.slug}
                        <span className={`admin-history-kind admin-history-kind--${sc.isActive ? "save" : "rollback"}`}>
                          {sc.isActive ? "active" : "inactive"}
                        </span>
                      </p>
                    </div>
                    <div className="admin-history-actions">
                      <a
                        href={sc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-history-hash"
                        title="Open Demo URL"
                      >
                        Visit
                      </a>
                      <button
                        className="admin-icon-button"
                        type="button"
                        title={sc.isActive ? "Deactivate" : "Activate"}
                        onClick={() => toggleActive({ adminToken: sessionToken, id: sc._id })}
                      >
                        {sc.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        className="admin-icon-button"
                        type="button"
                        title="Edit"
                        onClick={() => handleEdit(sc)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="admin-icon-button admin-icon-button--danger"
                        type="button"
                        title="Delete"
                        onClick={() => handleDelete(sc._id)}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>

      {editingId && (
        <div className="showcase-modal-overlay">
          <div className="showcase-modal">
            <h2>{editingId === "new" ? "New Showcase" : "Edit Showcase"}</h2>
            
            <div className="admin-field">
              <span>Name</span>
              <input
                value={formData.name || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    name: val,
                    // Auto-slugify if it's new and user hasn't edited slug manually yet (simplified)
                    slug: editingId === "new" ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : prev.slug,
                  }));
                }}
                placeholder="e.g. Luxurious Workspace Portal"
              />
            </div>
            
            <div className="admin-field">
              <span>Slug (URL path)</span>
              <input
                value={formData.slug || ""}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. luxurious"
              />
            </div>

            <div className="admin-field">
              <span>Target URL (HTTPS)</span>
              <input
                value={formData.url || ""}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://luxurious.vercel.app"
              />
            </div>

            <div className="admin-field">
              <span>Description</span>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description above the iframe..."
                rows={2}
              />
            </div>

            <div className="admin-field">
              <span>Tech Stack</span>
              <input
                value={formData.stack || ""}
                onChange={(e) => setFormData({ ...formData, stack: e.target.value })}
                placeholder="e.g. React 19, Vite 8, Convex"
              />
            </div>

            <div className="admin-field">
              <span>Sort Order</span>
              <input
                type="number"
                value={formData.sortOrder || 0}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            {error && <div className="admin-error-text">{error}</div>}

            <div className="showcase-modal__actions">
              <button className="admin-secondary-button" onClick={() => setEditingId(null)} disabled={busy}>
                <X size={18} /> Cancel
              </button>
              <button className="admin-primary-button" onClick={handleSave} disabled={busy}>
                <Save size={18} /> Save Showcase
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
