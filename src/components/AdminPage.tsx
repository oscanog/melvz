import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation } from "convex/react";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Code2,
  Eye,
  FileText,
  GraduationCap,
  Home,
  Image as ImageIcon,
  Link as LinkIcon,
  ListPlus,
  Loader2,
  LogOut,
  Save,
  Sparkles,
  Trash2,
  Upload,
  User,
  Wrench,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { isConvexConfigured } from "../convex/OptionalConvexProvider";
import { usePortfolioContent } from "../content/PortfolioContentProvider";
import type {
  EducationItem,
  ExperienceItem,
  GameZone,
  GameZoneProject,
  PortfolioContent,
  PortfolioProject,
  ResumeSkillGroup,
  SkyPhase,
  SocialLink,
} from "../content/portfolioTypes";

const SESSION_KEY = "melvz-admin-session";

type AdminSection =
  | "dashboard"
  | "profile"
  | "image"
  | "contacts"
  | "skills"
  | "education"
  | "experience"
  | "projects"
  | "game"
  | "preview"
  | "advanced";

type SaveState = "saved" | "dirty" | "saving" | "failed" | "invalid";
type ProjectBucket = "featured" | "compact";

const navItems: {
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "profile", label: "Profile", icon: User },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "contacts", label: "Contacts", icon: LinkIcon },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "experience", label: "Experience", icon: FileText },
  { id: "projects", label: "Projects", icon: ListPlus },
  { id: "game", label: "Game Zones", icon: Wrench },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "advanced", label: "Advanced", icon: Code2 },
];

const skyPhases: SkyPhase[] = ["dawn", "noon", "golden", "night"];

export default function AdminPage(): React.ReactElement {
  if (!isConvexConfigured) return <AdminUnavailable />;
  return <ConvexAdminPage />;
}

function AdminUnavailable(): React.ReactElement {
  return (
    <main className="admin-root admin-root--center">
      <section className="admin-login-card">
        <div className="admin-brand">
          <span className="admin-brand__mark">M</span>
          <div>
            <h1>Portfolio Admin</h1>
            <p>Convex is not configured. Add `VITE_CONVEX_URL` and restart Vite.</p>
          </div>
        </div>
        <a href="/" className="admin-link">
          Return to portfolio
        </a>
      </section>
    </main>
  );
}

function ConvexAdminPage(): React.ReactElement {
  const { content, source, loading } = usePortfolioContent();
  const createSession = useMutation(api.admin.createSession);
  const updatePortfolio = useMutation(api.admin.updatePortfolio);
  const generateUploadUrl = useMutation(api.admin.generateProfileImageUploadUrl);
  const setProfileImage = useMutation(api.admin.setProfileImage);

  const [passcode, setPasscode] = useState("");
  const [sessionToken, setSessionToken] = useState(
    () => sessionStorage.getItem(SESSION_KEY) ?? ""
  );
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [draft, setDraft] = useState<PortfolioContent>(content);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [status, setStatus] = useState("Saved");
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(content, null, 2));
  const [jsonError, setJsonError] = useState("");
  const [uploadPreview, setUploadPreview] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (dirty) return;
    setDraft(content);
    setJsonDraft(JSON.stringify(content, null, 2));
  }, [content, dirty]);

  const validationErrors = useMemo(() => validatePortfolio(draft), [draft]);
  const hasErrors = validationErrors.length > 0;

  useEffect(() => {
    if (!dirty && saveState !== "saving") {
      setSaveState("saved");
      setStatus("Saved");
      return;
    }
    if (dirty && hasErrors) {
      setSaveState("invalid");
      setStatus("Validation needed");
      return;
    }
    if (dirty && saveState !== "saving" && saveState !== "failed") {
      setSaveState("dirty");
      setStatus("Unsaved changes");
    }
  }, [dirty, hasErrors, saveState]);

  const updateDraft = (updater: (current: PortfolioContent) => PortfolioContent) => {
    setDraft((current) => updater(current));
    setDirty(true);
    setJsonError("");
    if (saveState !== "saving") setSaveState("dirty");
  };

  const openSection = (section: AdminSection) => {
    if (section === "advanced") {
      setJsonDraft(JSON.stringify(draft, null, 2));
      setJsonError("");
    }
    setActiveSection(section);
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const result = await createSession({ passcode });
      sessionStorage.setItem(SESSION_KEY, result.token);
      setSessionToken(result.token);
      setPasscode("");
      setStatus("Admin session active");
      setSaveState(dirty ? "dirty" : "saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
      setSaveState("failed");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (hasErrors) {
      setStatus("Fix validation issues before saving");
      setSaveState("invalid");
      return;
    }
    setBusy(true);
    setSaveState("saving");
    setStatus("Saving...");
    try {
      await updatePortfolio({ sessionToken, content: draft });
      setDirty(false);
      setSaveState("saved");
      setStatus(`Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    } catch (error) {
      setSaveState("failed");
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSessionToken("");
    setPasscode("");
  };

  const syncFromLive = () => {
    setDraft(content);
    setJsonDraft(JSON.stringify(content, null, 2));
    setDirty(false);
    setJsonError("");
    setStatus("Loaded latest content");
    setSaveState("saved");
  };

  const applyJson = () => {
    try {
      const next = JSON.parse(jsonDraft) as PortfolioContent;
      setDraft(next);
      setDirty(true);
      setJsonError("");
      setActiveSection("dashboard");
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStatus("Use JPG, PNG, or WebP");
      setSaveState("failed");
      event.target.value = "";
      return;
    }
    const localPreview = URL.createObjectURL(file);
    setUploadPreview(localPreview);
    setBusy(true);
    setStatus("Uploading image...");
    setSaveState("saving");
    try {
      const uploadUrl = await generateUploadUrl({ sessionToken });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Image upload failed");
      const { storageId } = (await result.json()) as { storageId: string };
      await setProfileImage({ sessionToken, storageId: storageId as Id<"_storage"> });
      setStatus("Image uploaded");
      setSaveState(dirty ? "dirty" : "saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Image upload failed");
      setSaveState("failed");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  if (!sessionToken) {
    return (
      <main className="admin-root admin-root--center">
        <section className="admin-login-card">
          <div className="admin-brand">
            <span className="admin-brand__mark">M</span>
            <div>
              <h1>Portfolio Admin</h1>
              <p>Sign in to edit live portfolio content.</p>
            </div>
          </div>
          <form className="admin-login" onSubmit={login}>
            <label className="admin-field">
              <span>Admin passcode</span>
              <input
                value={passcode}
                type="password"
                onChange={(event) => setPasscode(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter passcode"
              />
            </label>
            <button className="admin-primary-button" type="submit" disabled={busy || !passcode}>
              {busy ? <Loader2 size={18} /> : <ArrowLeft size={18} />}
              Login
            </button>
          </form>
          <p className="admin-help">Set `ADMIN_PASSCODE` in Convex before logging in.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-root">
      <div className="admin-shell">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">Portfolio CMS</p>
            <h1>{sectionTitle(activeSection)}</h1>
          </div>
          <div className="admin-topbar__actions">
            <StatusBadge state={saveState} label={status} />
            <a href="/" className="admin-link">
              Portfolio
            </a>
          </div>
        </header>

        <nav className="admin-mobile-nav" aria-label="Admin sections">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id ? "is-active" : ""}
              onClick={() => openSection(item.id)}
              type="button"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <aside className="admin-sidebar" aria-label="Admin sections">
          <div className="admin-sidebar__brand">
            <span className="admin-brand__mark">M</span>
            <div>
              <strong>Melvz Admin</strong>
              <span>{source === "convex" ? "Connected to Convex" : "Using fallback"}</span>
            </div>
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id ? "is-active" : ""}
              onClick={() => openSection(item.id)}
              type="button"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
          <button className="admin-sidebar__logout" onClick={logout} type="button">
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        <section className="admin-main">
          {activeSection === "dashboard" && (
            <Dashboard
              draft={draft}
              source={source}
              loading={loading}
              errors={validationErrors}
              onOpen={openSection}
            />
          )}
          {activeSection === "profile" && <ProfileEditor draft={draft} updateDraft={updateDraft} />}
          {activeSection === "image" && (
            <ImageEditor
              draft={draft}
              updateDraft={updateDraft}
              uploadPreview={uploadPreview}
              onUpload={uploadImage}
              busy={busy}
            />
          )}
          {activeSection === "contacts" && <ContactsEditor draft={draft} updateDraft={updateDraft} />}
          {activeSection === "skills" && <SkillsEditor draft={draft} updateDraft={updateDraft} />}
          {activeSection === "education" && <EducationEditor draft={draft} updateDraft={updateDraft} />}
          {activeSection === "experience" && <ExperienceEditor draft={draft} updateDraft={updateDraft} />}
          {activeSection === "projects" && <ProjectsEditor draft={draft} updateDraft={updateDraft} />}
          {activeSection === "game" && <GameEditor draft={draft} updateDraft={updateDraft} />}
          {activeSection === "preview" && <PreviewPanel draft={draft} />}
          {activeSection === "advanced" && (
            <AdvancedEditor
              jsonDraft={jsonDraft}
              jsonError={jsonError}
              onChange={setJsonDraft}
              onApply={applyJson}
              onReset={syncFromLive}
            />
          )}
        </section>

        <aside className="admin-rail">
          <StatusCard
            source={source}
            loading={loading}
            dirty={dirty}
            errors={validationErrors}
            saveState={saveState}
            status={status}
            onOpenAdvanced={() => openSection("advanced")}
          />
          <MiniPreview draft={draft} />
        </aside>
      </div>

      <div className="admin-savebar">
        <div>
          <StatusBadge state={saveState} label={status} />
          {validationErrors[0] && <span className="admin-savebar__error">{validationErrors[0]}</span>}
        </div>
        <div className="admin-savebar__actions">
          <button className="admin-secondary-button" onClick={syncFromLive} disabled={busy} type="button">
            Reset
          </button>
          <button
            className="admin-primary-button"
            onClick={save}
            disabled={busy || !dirty || hasErrors}
            type="button"
          >
            {saveState === "saving" ? <Loader2 size={18} /> : <Save size={18} />}
            Save
          </button>
        </div>
      </div>
    </main>
  );
}

function Dashboard({
  draft,
  source,
  loading,
  errors,
  onOpen,
}: {
  draft: PortfolioContent;
  source: string;
  loading: boolean;
  errors: string[];
  onOpen: (section: AdminSection) => void;
}) {
  const stats = [
    { label: "Skills", value: draft.skills.reduce((total, group) => total + group.items.length, 0) },
    { label: "Projects", value: draft.projects.featured.length + draft.projects.compact.length },
    { label: "Game zones", value: draft.game.zones.length },
    { label: "Issues", value: errors.length },
  ];

  return (
    <div className="admin-stack">
      <SectionHeader
        title="Update portfolio content"
        detail="Structured editor for the resume, project list, profile image, and game zones."
      />
      <div className="admin-stat-grid">
        {stats.map((stat) => (
          <article className="admin-stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>
      <div className="admin-card admin-dashboard-card">
        <div>
          <h2>Source</h2>
          <p>{loading ? "Loading Convex content..." : source === "convex" ? "Connected to Convex" : "Using fallback content"}</p>
        </div>
        <button className="admin-secondary-button" onClick={() => onOpen("profile")} type="button">
          <User size={18} />
          Edit profile
        </button>
      </div>
      <div className="admin-quick-grid">
        {navItems
          .filter((item) => !["dashboard", "advanced"].includes(item.id))
          .map((item) => (
            <button key={item.id} onClick={() => onOpen(item.id)} type="button">
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
      </div>
    </div>
  );
}

function ProfileEditor({
  draft,
  updateDraft,
}: {
  draft: PortfolioContent;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  return (
    <div className="admin-stack">
      <SectionHeader title="Profile" detail="Main resume identity and summary." />
      <div className="admin-card admin-form-grid">
        <Field
          label="Name"
          value={draft.profile.name}
          onChange={(value) => updateDraft((current) => ({ ...current, profile: { ...current.profile, name: value } }))}
        />
        <Field
          label="Headline"
          value={draft.profile.title}
          onChange={(value) => updateDraft((current) => ({ ...current, profile: { ...current.profile, title: value } }))}
        />
        <TextArea
          label="Summary"
          value={draft.profile.summary}
          rows={7}
          className="admin-field--wide"
          onChange={(value) =>
            updateDraft((current) => ({ ...current, profile: { ...current.profile, summary: value } }))
          }
        />
      </div>
    </div>
  );
}

function ImageEditor({
  draft,
  updateDraft,
  uploadPreview,
  onUpload,
  busy,
}: {
  draft: PortfolioContent;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
  uploadPreview: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  busy: boolean;
}) {
  return (
    <div className="admin-stack">
      <SectionHeader title="Profile image" detail="Upload JPG, PNG, or WebP and keep alt text readable." />
      <div className="admin-card admin-image-editor">
        <img src={uploadPreview || draft.profile.imageUrl} alt={draft.profile.imageAlt} />
        <div className="admin-stack">
          <label className="admin-upload">
            <Upload size={22} />
            <strong>Upload image</strong>
            <span>JPG, PNG, or WebP. The preview updates immediately.</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} disabled={busy} />
          </label>
          <Field
            label="Image URL fallback"
            value={draft.profile.imageUrl}
            onChange={(value) =>
              updateDraft((current) => ({ ...current, profile: { ...current.profile, imageUrl: value } }))
            }
          />
          <Field
            label="Alt text"
            value={draft.profile.imageAlt}
            onChange={(value) =>
              updateDraft((current) => ({ ...current, profile: { ...current.profile, imageAlt: value } }))
            }
          />
        </div>
      </div>
    </div>
  );
}

function ContactsEditor({
  draft,
  updateDraft,
}: {
  draft: PortfolioContent;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  return (
    <div className="admin-stack">
      <SectionHeader title="Contacts" detail="Resume contact lines and social cards." />
      <EditableStringList
        title="Resume contact lines"
        items={draft.profile.contacts}
        addLabel="Add contact line"
        onChange={(items) => updateDraft((current) => ({ ...current, profile: { ...current.profile, contacts: items } }))}
      />
      <div className="admin-card">
        <CardHeader title="Social links" onAdd={() => updateDraft((current) => ({ ...current, socials: [...current.socials, emptySocial()] }))} />
        {draft.socials.map((social, index) => (
          <article className="admin-item-card" key={`${social.name}-${index}`}>
            <ItemToolbar
              title={social.name || `Social ${index + 1}`}
              onMoveUp={() => updateDraft((current) => ({ ...current, socials: moveItem(current.socials, index, -1) }))}
              onMoveDown={() => updateDraft((current) => ({ ...current, socials: moveItem(current.socials, index, 1) }))}
              onDelete={() => updateDraft((current) => ({ ...current, socials: removeItem(current.socials, index) }))}
            />
            <div className="admin-form-grid">
              <Field label="Name" value={social.name} onChange={(value) => updateSocial(updateDraft, index, { name: value })} />
              <Field label="Description" value={social.description} onChange={(value) => updateSocial(updateDraft, index, { description: value })} />
              <Field label="URL" value={social.url ?? ""} onChange={(value) => updateSocial(updateDraft, index, { url: value })} />
              <Field label="Address" value={social.address ?? ""} onChange={(value) => updateSocial(updateDraft, index, { address: value })} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SkillsEditor({
  draft,
  updateDraft,
}: {
  draft: PortfolioContent;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  return (
    <div className="admin-stack">
      <SectionHeader title="Skills" detail="Groups and individual skill tags." />
      <div className="admin-card">
        <CardHeader
          title="Skill groups"
          onAdd={() => updateDraft((current) => ({ ...current, skills: [...current.skills, emptySkillGroup()] }))}
        />
        {draft.skills.map((group, groupIndex) => (
          <article className="admin-item-card" key={`${group.label}-${groupIndex}`}>
            <ItemToolbar
              title={group.label || `Group ${groupIndex + 1}`}
              onMoveUp={() => updateDraft((current) => ({ ...current, skills: moveItem(current.skills, groupIndex, -1) }))}
              onMoveDown={() => updateDraft((current) => ({ ...current, skills: moveItem(current.skills, groupIndex, 1) }))}
              onDelete={() => updateDraft((current) => ({ ...current, skills: removeItem(current.skills, groupIndex) }))}
            />
            <Field
              label="Group label"
              value={group.label}
              onChange={(value) =>
                updateDraft((current) => ({
                  ...current,
                  skills: updateItem(current.skills, groupIndex, { label: value }),
                }))
              }
            />
            <EditableStringList
              title="Skills"
              items={group.items}
              addLabel="Add skill"
              onChange={(items) =>
                updateDraft((current) => ({
                  ...current,
                  skills: updateItem(current.skills, groupIndex, { items }),
                }))
              }
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function EducationEditor({
  draft,
  updateDraft,
}: {
  draft: PortfolioContent;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  return (
    <ListEditor
      title="Education"
      detail="Schools, degrees, dates, and short notes."
      items={draft.education}
      addLabel="Add education"
      emptyItem={emptyEducation}
      updateDraft={updateDraft}
      getItems={(content) => content.education}
      setItems={(content, items) => ({ ...content, education: items })}
      renderItem={(item, index) => (
        <div className="admin-form-grid">
          <Field label="Degree" value={item.degree} onChange={(value) => updateEducation(updateDraft, index, { degree: value })} />
          <Field label="School" value={item.school} onChange={(value) => updateEducation(updateDraft, index, { school: value })} />
          <Field label="Period" value={item.period} onChange={(value) => updateEducation(updateDraft, index, { period: value })} />
          <TextArea label="Detail" value={item.detail} onChange={(value) => updateEducation(updateDraft, index, { detail: value })} />
        </div>
      )}
      itemTitle={(item, index) => item.school || `Education ${index + 1}`}
    />
  );
}

function ExperienceEditor({
  draft,
  updateDraft,
}: {
  draft: PortfolioContent;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  return (
    <ListEditor
      title="Experience"
      detail="Career roles that appear on the resume."
      items={draft.experiences}
      addLabel="Add experience"
      emptyItem={emptyExperience}
      updateDraft={updateDraft}
      getItems={(content) => content.experiences}
      setItems={(content, items) => ({ ...content, experiences: items })}
      renderItem={(item, index) => (
        <div className="admin-form-grid">
          <Field label="Role" value={item.role} onChange={(value) => updateExperience(updateDraft, index, { role: value })} />
          <Field label="Period" value={item.period} onChange={(value) => updateExperience(updateDraft, index, { period: value })} />
          <TextArea
            label="Description"
            value={item.description}
            className="admin-field--wide"
            onChange={(value) => updateExperience(updateDraft, index, { description: value })}
          />
        </div>
      )}
      itemTitle={(item, index) => item.role || `Experience ${index + 1}`}
    />
  );
}

function ProjectsEditor({
  draft,
  updateDraft,
}: {
  draft: PortfolioContent;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  return (
    <div className="admin-stack">
      <SectionHeader title="Projects" detail="Featured and compact portfolio projects." />
      {(["featured", "compact"] as ProjectBucket[]).map((bucket) => (
        <ProjectBucketEditor key={bucket} bucket={bucket} projects={draft.projects[bucket]} updateDraft={updateDraft} />
      ))}
    </div>
  );
}

function ProjectBucketEditor({
  bucket,
  projects,
  updateDraft,
}: {
  bucket: ProjectBucket;
  projects: PortfolioProject[];
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  const title = bucket === "featured" ? "Featured projects" : "Compact projects";
  return (
    <div className="admin-card">
      <CardHeader
        title={title}
        onAdd={() =>
          updateDraft((current) => ({
            ...current,
            projects: { ...current.projects, [bucket]: [...current.projects[bucket], emptyProject()] },
          }))
        }
      />
      {projects.map((project, index) => (
        <article className="admin-item-card" key={`${project.name}-${index}`}>
          <ItemToolbar
            title={project.name || `Project ${index + 1}`}
            onMoveUp={() =>
              updateDraft((current) => ({
                ...current,
                projects: { ...current.projects, [bucket]: moveItem(current.projects[bucket], index, -1) },
              }))
            }
            onMoveDown={() =>
              updateDraft((current) => ({
                ...current,
                projects: { ...current.projects, [bucket]: moveItem(current.projects[bucket], index, 1) },
              }))
            }
            onDelete={() =>
              updateDraft((current) => ({
                ...current,
                projects: { ...current.projects, [bucket]: removeItem(current.projects[bucket], index) },
              }))
            }
          />
          <div className="admin-form-grid">
            <Field label="Name" value={project.name} onChange={(value) => updateProject(updateDraft, bucket, index, { name: value })} />
            <Field label="Period" value={project.period} onChange={(value) => updateProject(updateDraft, bucket, index, { period: value })} />
            <Field label="Stack" value={project.stack} onChange={(value) => updateProject(updateDraft, bucket, index, { stack: value })} />
            <TextArea
              label="Description"
              value={project.description}
              className="admin-field--wide"
              onChange={(value) => updateProject(updateDraft, bucket, index, { description: value })}
            />
          </div>
          <EditableProjectLinks project={project} bucket={bucket} projectIndex={index} updateDraft={updateDraft} />
        </article>
      ))}
    </div>
  );
}

function GameEditor({
  draft,
  updateDraft,
}: {
  draft: PortfolioContent;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  return (
    <div className="admin-stack">
      <SectionHeader title="Game zones" detail="Career-game map content and project cards." />
      <div className="admin-card">
        <CardHeader
          title="Zones"
          onAdd={() =>
            updateDraft((current) => ({
              ...current,
              game: { zones: [...current.game.zones, emptyGameZone(current.game.zones.length)] },
            }))
          }
        />
        {draft.game.zones.map((zone, index) => (
          <article className="admin-item-card" key={`${zone.id}-${index}`}>
            <ItemToolbar
              title={zone.role || `Zone ${index + 1}`}
              onMoveUp={() => updateDraft((current) => ({ ...current, game: { zones: moveItem(current.game.zones, index, -1) } }))}
              onMoveDown={() => updateDraft((current) => ({ ...current, game: { zones: moveItem(current.game.zones, index, 1) } }))}
              onDelete={() => updateDraft((current) => ({ ...current, game: { zones: removeItem(current.game.zones, index) } }))}
            />
            <div className="admin-form-grid">
              <Field label="ID" value={zone.id} onChange={(value) => updateZone(updateDraft, index, { id: value })} />
              <Field label="Year" value={zone.year} onChange={(value) => updateZone(updateDraft, index, { year: value })} />
              <Field label="Role" value={zone.role} onChange={(value) => updateZone(updateDraft, index, { role: value })} />
              <Field label="Building label" value={zone.buildingLabel} onChange={(value) => updateZone(updateDraft, index, { buildingLabel: value })} />
              <SelectField
                label="Work level"
                value={String(zone.workLevel)}
                options={["1", "2", "3", "4"]}
                onChange={(value) => updateZone(updateDraft, index, { workLevel: Number(value) as GameZone["workLevel"] })}
              />
              <SelectField
                label="Sky phase"
                value={zone.skyPhase}
                options={skyPhases}
                onChange={(value) => updateZone(updateDraft, index, { skyPhase: value as SkyPhase })}
              />
              <Field label="Left zone ID" value={zone.left ?? ""} onChange={(value) => updateZone(updateDraft, index, { left: value || undefined })} />
              <Field label="Right zone ID" value={zone.right ?? ""} onChange={(value) => updateZone(updateDraft, index, { right: value || undefined })} />
              <TextArea label="Kiss line" value={zone.kiss} className="admin-field--wide" onChange={(value) => updateZone(updateDraft, index, { kiss: value })} />
            </div>
            <GameZoneProjects zone={zone} zoneIndex={index} updateDraft={updateDraft} />
          </article>
        ))}
      </div>
    </div>
  );
}

function PreviewPanel({ draft }: { draft: PortfolioContent }) {
  return (
    <div className="admin-stack">
      <SectionHeader title="Preview" detail="Quick content review before saving." />
      <MiniPreview draft={draft} expanded />
    </div>
  );
}

function AdvancedEditor({
  jsonDraft,
  jsonError,
  onChange,
  onApply,
  onReset,
}: {
  jsonDraft: string;
  jsonError: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <div className="admin-stack">
      <SectionHeader title="Advanced JSON" detail="Use only for import/export or emergency edits." />
      <div className="admin-warning">
        <AlertCircle size={18} />
        Advanced editing can break portfolio content. Prefer structured sections for normal updates.
      </div>
      <label className="admin-field admin-json-field">
        <span>Portfolio JSON</span>
        <textarea value={jsonDraft} onChange={(event) => onChange(event.target.value)} spellCheck={false} />
      </label>
      {jsonError && <p className="admin-error">{jsonError}</p>}
      <div className="admin-actions-row">
        <button className="admin-primary-button" onClick={onApply} type="button">
          <Code2 size={18} />
          Apply JSON
        </button>
        <button className="admin-secondary-button" onClick={() => navigator.clipboard?.writeText(jsonDraft)} type="button">
          Copy JSON
        </button>
        <button className="admin-secondary-button" onClick={onReset} type="button">
          Reset from live
        </button>
      </div>
    </div>
  );
}

function StatusCard({
  source,
  loading,
  dirty,
  errors,
  saveState,
  status,
  onOpenAdvanced,
}: {
  source: string;
  loading: boolean;
  dirty: boolean;
  errors: string[];
  saveState: SaveState;
  status: string;
  onOpenAdvanced: () => void;
}) {
  return (
    <div className="admin-card admin-status-card">
      <h2>Status</h2>
      <StatusBadge state={saveState} label={status} />
      <p>{loading ? "Loading content" : source === "convex" ? "Connected to Convex" : "Using fallback content"}</p>
      <p>{dirty ? "Draft has local edits" : "Draft matches live content"}</p>
      {errors.length > 0 && (
        <div className="admin-validation-list">
          <strong>Validation</strong>
          {errors.slice(0, 5).map((error) => (
            <span key={error}>{error}</span>
          ))}
        </div>
      )}
      <button className="admin-secondary-button" onClick={onOpenAdvanced} type="button">
        <Code2 size={18} />
        Advanced JSON
      </button>
    </div>
  );
}

function MiniPreview({ draft, expanded = false }: { draft: PortfolioContent; expanded?: boolean }) {
  return (
    <div className={`admin-card admin-preview-card${expanded ? " admin-preview-card--expanded" : ""}`}>
      <div className="admin-preview-card__header">
        <img src={draft.profile.imageUrl} alt={draft.profile.imageAlt} />
        <div>
          <h2>{draft.profile.name || "Unnamed profile"}</h2>
          <p>{draft.profile.title || "No headline"}</p>
        </div>
      </div>
      <p>{draft.profile.summary || "No summary yet."}</p>
      <div className="admin-preview-tags">
        {draft.skills.flatMap((group) => group.items).slice(0, expanded ? 16 : 8).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      {expanded && (
        <div className="admin-preview-list">
          <h3>Featured projects</h3>
          {draft.projects.featured.map((project) => (
            <article key={project.name}>
              <strong>{project.name}</strong>
              <span>{project.stack}</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function EditableStringList({
  title,
  items,
  addLabel,
  onChange,
}: {
  title: string;
  items: string[];
  addLabel: string;
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="admin-sublist">
      <CardHeader title={title} onAdd={() => onChange([...items, ""])} addLabel={addLabel} small />
      {items.map((item, index) => (
        <div className="admin-inline-row" key={`${item}-${index}`}>
          <input value={item} onChange={(event) => onChange(updatePrimitive(items, index, event.target.value))} />
          <IconButton label="Move up" onClick={() => onChange(moveItem(items, index, -1))}>
            <ArrowUp size={17} />
          </IconButton>
          <IconButton label="Move down" onClick={() => onChange(moveItem(items, index, 1))}>
            <ArrowDown size={17} />
          </IconButton>
          <IconButton label="Delete" tone="danger" onClick={() => onChange(removeItem(items, index))}>
            <Trash2 size={17} />
          </IconButton>
        </div>
      ))}
    </div>
  );
}

function EditableProjectLinks({
  project,
  bucket,
  projectIndex,
  updateDraft,
}: {
  project: PortfolioProject;
  bucket: ProjectBucket;
  projectIndex: number;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  const links = project.links ?? [];
  const setLinks = (nextLinks: { label: string; url: string }[]) =>
    updateProject(updateDraft, bucket, projectIndex, { links: nextLinks });
  return (
    <div className="admin-sublist">
      <CardHeader title="Links" small addLabel="Add link" onAdd={() => setLinks([...links, { label: "", url: "" }])} />
      {links.map((link, index) => (
        <div className="admin-inline-row admin-inline-row--links" key={`${link.label}-${index}`}>
          <input
            value={link.label}
            placeholder="Label"
            onChange={(event) => setLinks(updateItem(links, index, { label: event.target.value }))}
          />
          <input
            value={link.url}
            placeholder="URL"
            onChange={(event) => setLinks(updateItem(links, index, { url: event.target.value }))}
          />
          <IconButton label="Move up" onClick={() => setLinks(moveItem(links, index, -1))}>
            <ArrowUp size={17} />
          </IconButton>
          <IconButton label="Move down" onClick={() => setLinks(moveItem(links, index, 1))}>
            <ArrowDown size={17} />
          </IconButton>
          <IconButton label="Delete" tone="danger" onClick={() => setLinks(removeItem(links, index))}>
            <Trash2 size={17} />
          </IconButton>
        </div>
      ))}
    </div>
  );
}

function GameZoneProjects({
  zone,
  zoneIndex,
  updateDraft,
}: {
  zone: GameZone;
  zoneIndex: number;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  const setProjects = (projects: GameZoneProject[]) => updateZone(updateDraft, zoneIndex, { projects });
  return (
    <div className="admin-sublist">
      <CardHeader title="Zone projects" small addLabel="Add project" onAdd={() => setProjects([...zone.projects, emptyGameZoneProject()])} />
      {zone.projects.map((project, index) => (
        <div className="admin-zone-project" key={`${project.name}-${index}`}>
          <div className="admin-form-grid">
            <Field
              label="Name"
              value={project.name}
              onChange={(value) => setProjects(updateItem(zone.projects, index, { name: value }))}
            />
            <Field
              label="Stack"
              value={project.stack}
              onChange={(value) => setProjects(updateItem(zone.projects, index, { stack: value }))}
            />
            <Field
              label="Color RGB"
              value={project.color.join(", ")}
              onChange={(value) => setProjects(updateItem(zone.projects, index, { color: parseRgb(value) }))}
            />
          </div>
          <div className="admin-actions-row admin-actions-row--compact">
            <IconButton label="Move up" onClick={() => setProjects(moveItem(zone.projects, index, -1))}>
              <ArrowUp size={17} />
            </IconButton>
            <IconButton label="Move down" onClick={() => setProjects(moveItem(zone.projects, index, 1))}>
              <ArrowDown size={17} />
            </IconButton>
            <IconButton label="Delete" tone="danger" onClick={() => setProjects(removeItem(zone.projects, index))}>
              <Trash2 size={17} />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListEditor<T>({
  title,
  detail,
  items,
  addLabel,
  emptyItem,
  updateDraft,
  getItems,
  setItems,
  renderItem,
  itemTitle,
}: {
  title: string;
  detail: string;
  items: T[];
  addLabel: string;
  emptyItem: () => T;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
  getItems: (content: PortfolioContent) => T[];
  setItems: (content: PortfolioContent, items: T[]) => PortfolioContent;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemTitle: (item: T, index: number) => string;
}) {
  return (
    <div className="admin-stack">
      <SectionHeader title={title} detail={detail} />
      <div className="admin-card">
        <CardHeader title={title} addLabel={addLabel} onAdd={() => updateDraft((current) => setItems(current, [...getItems(current), emptyItem()]))} />
        {items.map((item, index) => (
          <article className="admin-item-card" key={`${itemTitle(item, index)}-${index}`}>
            <ItemToolbar
              title={itemTitle(item, index)}
              onMoveUp={() => updateDraft((current) => setItems(current, moveItem(getItems(current), index, -1)))}
              onMoveDown={() => updateDraft((current) => setItems(current, moveItem(getItems(current), index, 1)))}
              onDelete={() => updateDraft((current) => setItems(current, removeItem(getItems(current), index)))}
            />
            {renderItem(item, index)}
          </article>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="admin-section-header">
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  );
}

function CardHeader({
  title,
  onAdd,
  addLabel = "Add",
  small = false,
}: {
  title: string;
  onAdd: () => void;
  addLabel?: string;
  small?: boolean;
}) {
  return (
    <div className={`admin-card-header${small ? " admin-card-header--small" : ""}`}>
      <h3>{title}</h3>
      <button className="admin-secondary-button" onClick={onAdd} type="button">
        <ListPlus size={18} />
        {addLabel}
      </button>
    </div>
  );
}

function ItemToolbar({
  title,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  title: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="admin-item-toolbar">
      <strong>{title}</strong>
      <div>
        <IconButton label="Move up" onClick={onMoveUp}>
          <ArrowUp size={17} />
        </IconButton>
        <IconButton label="Move down" onClick={onMoveDown}>
          <ArrowDown size={17} />
        </IconButton>
        <IconButton label="Delete" tone="danger" onClick={onDelete}>
          <Trash2 size={17} />
        </IconButton>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`admin-field ${className}`}>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`admin-field ${className}`}>
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function IconButton({
  label,
  onClick,
  children,
  tone = "neutral",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <button className={`admin-icon-button admin-icon-button--${tone}`} aria-label={label} title={label} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function StatusBadge({ state, label }: { state: SaveState; label: string }) {
  const icon = state === "saving" ? <Loader2 size={16} /> : state === "saved" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />;
  return (
    <span className={`admin-status-badge admin-status-badge--${state}`}>
      {icon}
      {label}
    </span>
  );
}

function sectionTitle(section: AdminSection) {
  return navItems.find((item) => item.id === section)?.label ?? "Admin";
}

function updateItem<T>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

function updatePrimitive<T>(items: T[], index: number, value: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function removeItem<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

function updateSocial(
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void,
  index: number,
  patch: Partial<SocialLink>
) {
  updateDraft((current) => ({ ...current, socials: updateItem(current.socials, index, patch) }));
}

function updateEducation(
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void,
  index: number,
  patch: Partial<EducationItem>
) {
  updateDraft((current) => ({ ...current, education: updateItem(current.education, index, patch) }));
}

function updateExperience(
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void,
  index: number,
  patch: Partial<ExperienceItem>
) {
  updateDraft((current) => ({ ...current, experiences: updateItem(current.experiences, index, patch) }));
}

function updateProject(
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void,
  bucket: ProjectBucket,
  index: number,
  patch: Partial<PortfolioProject>
) {
  updateDraft((current) => ({
    ...current,
    projects: {
      ...current.projects,
      [bucket]: updateItem(current.projects[bucket], index, patch),
    },
  }));
}

function updateZone(
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void,
  index: number,
  patch: Partial<GameZone>
) {
  updateDraft((current) => ({
    ...current,
    game: { zones: updateItem(current.game.zones, index, patch) },
  }));
}

function parseRgb(value: string): [number, number, number] {
  const parts = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part))
    .slice(0, 3);
  while (parts.length < 3) parts.push(0);
  return parts.map((part) => Math.max(0, Math.min(255, part))) as [number, number, number];
}

function validatePortfolio(content: PortfolioContent) {
  const errors: string[] = [];
  if (!content.profile.name.trim()) errors.push("Profile name is required");
  if (!content.profile.title.trim()) errors.push("Profile headline is required");
  if (!content.profile.summary.trim()) errors.push("Profile summary is required");
  if (!content.profile.imageAlt.trim()) errors.push("Image alt text is required");
  if (content.profile.contacts.some((contact) => !contact.trim())) errors.push("Contact lines cannot be blank");
  content.skills.forEach((group, index) => {
    if (!group.label.trim()) errors.push(`Skill group ${index + 1} needs a label`);
    if (group.items.some((item) => !item.trim())) errors.push(`Skill group ${index + 1} has a blank skill`);
  });
  content.education.forEach((item, index) => {
    if (!item.school.trim() || !item.degree.trim()) errors.push(`Education ${index + 1} needs school and degree`);
  });
  content.experiences.forEach((item, index) => {
    if (!item.role.trim() || !item.description.trim()) errors.push(`Experience ${index + 1} needs role and description`);
  });
  [...content.projects.featured, ...content.projects.compact].forEach((item, index) => {
    if (!item.name.trim() || !item.description.trim()) errors.push(`Project ${index + 1} needs name and description`);
  });
  content.game.zones.forEach((zone, index) => {
    if (!zone.id.trim() || !zone.role.trim() || !zone.year.trim()) errors.push(`Game zone ${index + 1} needs id, role, and year`);
    if (zone.projects.some((project) => !project.name.trim() || !project.stack.trim())) {
      errors.push(`Game zone ${index + 1} has an incomplete project`);
    }
  });
  return errors;
}

function emptySkillGroup(): ResumeSkillGroup {
  return { label: "New group", items: ["New skill"] };
}

function emptyEducation(): EducationItem {
  return { degree: "", school: "", period: "", detail: "" };
}

function emptyExperience(): ExperienceItem {
  return { role: "", period: "", description: "" };
}

function emptyProject(): PortfolioProject {
  return { name: "", period: "", stack: "", description: "", links: [] };
}

function emptySocial(): SocialLink {
  return { name: "", description: "", url: "", address: "" };
}

function emptyGameZone(index: number): GameZone {
  return {
    id: `zone${index + 1}`,
    index,
    year: "",
    role: "",
    kiss: "",
    workLevel: 1,
    skyPhase: "noon",
    buildingLabel: "",
    projects: [emptyGameZoneProject()],
  };
}

function emptyGameZoneProject(): GameZoneProject {
  return { name: "", stack: "", color: [80, 160, 220] };
}
