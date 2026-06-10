import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { ArrowLeft, Edit, Eye, EyeOff, Plus, Trash2, Save, X } from "lucide-react";
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
      {({ sessionToken }) => <ShowcaseManagerInner sessionToken={sessionToken} />}
    </AdminGate>
  );
}

function ShowcaseManagerInner({ sessionToken }: { sessionToken: string }) {
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
    <main className="admin-root">
      <header className="admin-history-header">
        <button
          className="admin-secondary-button"
          onClick={() => (window.location.hash = "#admin")}
        >
          <ArrowLeft size={18} /> Back to Editor
        </button>
        <div>
          <h1 className="admin-history-header__title">Project Showcases</h1>
          <p className="admin-history-header__subtitle">
            Manage live iframe demos for your portfolio.
          </p>
        </div>
        <button
          className="admin-primary-button"
          onClick={() => handleEdit()}
        >
          <Plus size={18} /> Add Showcase
        </button>
      </header>

      <section className="admin-history-content showcase-admin-content">
        {showcases === undefined ? (
          <p>Loading showcases...</p>
        ) : showcases.length === 0 ? (
          <p className="admin-history-empty">No showcases found. Create one!</p>
        ) : (
          <div className="showcase-list">
            {showcases.map((sc) => (
              <div key={sc._id} className={`showcase-item ${!sc.isActive ? "showcase-item--inactive" : ""}`}>
                <div className="showcase-item__info">
                  <strong>{sc.name}</strong>
                  <span className="showcase-item__slug">/{sc.slug}</span>
                  <a href={sc.url} target="_blank" rel="noreferrer" className="showcase-item__url">
                    {sc.url}
                  </a>
                </div>
                <div className="showcase-item__actions">
                  <button
                    className="icon-btn"
                    title={sc.isActive ? "Deactivate" : "Activate"}
                    onClick={() => toggleActive({ adminToken: sessionToken, id: sc._id })}
                  >
                    {sc.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button className="icon-btn" title="Edit" onClick={() => handleEdit(sc)}>
                    <Edit size={18} />
                  </button>
                  <button className="icon-btn icon-btn--danger" title="Delete" onClick={() => handleDelete(sc._id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
