import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { useMutation } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  GripVertical,
  Loader2,
  LogOut,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { isConvexConfigured } from "../convex/OptionalConvexProvider";
import { usePortfolioContent } from "../content/PortfolioContentProvider";
import { prepareProfileImageUpload } from "../utils/profileImageProcessing";
import { ProfileImage } from "./ProfileImage";
import type {
  EducationItem,
  ExperienceItem,
  PortfolioContent,
  PortfolioProject,
  ResumeSkillGroup,
} from "../content/portfolioTypes";

const SESSION_KEY = "melvz-admin-session";
const SUPPORTED_PROFILE_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "avif",
  "heic",
  "heif",
  "3fr",
  "arw",
  "cr2",
  "cr3",
  "dcr",
  "dng",
  "erf",
  "k25",
  "kdc",
  "mrw",
  "nef",
  "nrw",
  "orf",
  "pef",
  "raf",
  "raw",
  "rw2",
  "sr2",
  "srf",
  "x3f",
]);

type SaveState = "saved" | "dirty" | "saving" | "failed" | "invalid";
type ProjectBucket = "featured" | "compact";

export default function AdminPage(): ReactElement {
  if (!isConvexConfigured) return <AdminUnavailable />;
  return <InlineAdmin />;
}

function AdminUnavailable(): ReactElement {
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
        <a href="/" className="admin-link">Return to portfolio</a>
      </section>
    </main>
  );
}

function InlineAdmin(): ReactElement {
  const { content, source, loading } = usePortfolioContent();
  const createSession = useMutation(api.admin.createSession);
  const updatePortfolio = useMutation(api.admin.updatePortfolio);
  const generateUploadUrl = useMutation(api.admin.generateProfileImageUploadUrl);
  const setProfileImage = useMutation(api.admin.setProfileImage);

  const [passcode, setPasscode] = useState("");
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem(SESSION_KEY) ?? "");
  const [draft, setDraft] = useState<PortfolioContent>(content);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Saved");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [uploadPreview, setUploadPreview] = useState("");
  const [dragKey, setDragKey] = useState<string | null>(null);

  useEffect(() => {
    if (dirty) return;
    setDraft(content);
  }, [content, dirty]);

  useEffect(() => {
    return () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    };
  }, [uploadPreview]);

  const errors = validatePortfolio(draft);

  const updateDraft = (updater: (current: PortfolioContent) => PortfolioContent) => {
    setDraft((current) => updater(current));
    setDirty(true);
    setSaveState("dirty");
    setStatus("Unsaved changes");
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await createSession({ passcode });
      sessionStorage.setItem(SESSION_KEY, result.token);
      setSessionToken(result.token);
      setPasscode("");
      setStatus("Admin session active");
      setSaveState("saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
      setSaveState("failed");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (errors.length > 0) {
      setSaveState("invalid");
      setStatus("Fix highlighted resume fields before saving");
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

  const reset = () => {
    setDraft(content);
    setDirty(false);
    setSaveState("saved");
    setStatus("Loaded latest resume");
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSessionToken("");
    setPasscode("");
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isSupportedProfileImageFile(file)) {
      setSaveState("failed");
      setStatus("Use JPG, PNG, WebP, HEIC, AVIF, GIF, BMP, or common RAW photo files");
      event.target.value = "";
      return;
    }

    setBusy(true);
    setSaveState("saving");
    setStatus("Converting image to WebP...");
    let previewUrl = "";
    try {
      const prepared = await prepareProfileImageUpload(file);
      previewUrl = prepared.previewUrl;
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
      setUploadPreview(previewUrl);

      setStatus("Uploading optimized image...");
      const uploadUrls = await generateUploadUrl({ sessionToken });
      const displayStorageId = await uploadBlob(uploadUrls.displayUploadUrl, prepared.displayBlob);
      const display2xStorageId = await uploadBlob(uploadUrls.display2xUploadUrl, prepared.display2xBlob);
      const blurStorageId = await uploadBlob(uploadUrls.blurUploadUrl, prepared.blurBlob);
      const archiveStorageId = await uploadBlob(uploadUrls.archiveUploadUrl, prepared.archiveBlob);
      const imageResult = await setProfileImage({
        sessionToken,
        storageId: displayStorageId,
        blurStorageId,
        display2xStorageId,
        archiveStorageId,
      });
      if (typeof imageResult.profileImageUrl === "string") {
        const profileImageUrl = imageResult.profileImageUrl;
        const profileImage2xUrl =
          typeof imageResult.profileImage2xUrl === "string"
            ? imageResult.profileImage2xUrl
            : undefined;
        const profileImageBlurUrl =
          typeof imageResult.profileImageBlurUrl === "string"
            ? imageResult.profileImageBlurUrl
            : undefined;
        updateDraft((current) => ({
          ...current,
          profile: {
            ...current.profile,
            imageUrl: profileImageUrl,
            ...(profileImage2xUrl ? { image2xUrl: profileImage2xUrl } : {}),
            ...(profileImageBlurUrl ? { imageBlurUrl: profileImageBlurUrl } : {}),
          },
        }));
        URL.revokeObjectURL(previewUrl);
        previewUrl = "";
        setUploadPreview("");
      }
      setStatus("Image optimized and uploaded");
      setSaveState("dirty");
    } catch (error) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setUploadPreview("");
      setSaveState("failed");
      setStatus(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const uploadBlob = async (uploadUrl: string, blob: Blob) => {
    const upload = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type || "image/webp" },
      body: blob,
    });
    if (!upload.ok) throw new Error("Image upload failed");
    const { storageId } = (await upload.json()) as { storageId: string };
    return storageId as Id<"_storage">;
  };

  if (!sessionToken) {
    return (
      <main className="admin-root admin-root--center">
        <section className="admin-login-card">
          <div className="admin-brand">
            <span className="admin-brand__mark">M</span>
            <div>
              <h1>Portfolio Admin</h1>
              <p>Login to edit the same bond-paper resume.</p>
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
              {busy ? <Loader2 size={18} /> : <CheckCircle2 size={18} />}
              Login
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="inline-admin-root">
      <header className="inline-admin-bar">
        <div>
          <p className="admin-eyebrow">Inline Resume Editor</p>
          <h1>{draft.profile.name || "Portfolio Resume"}</h1>
          <p>{loading ? "Loading Convex content" : source === "convex" ? "Connected to Convex" : "Using fallback content"}</p>
        </div>
        <div className="inline-admin-actions">
          <StatusBadge state={saveState} label={status} />
          {errors[0] && <span className="inline-admin-error">{errors[0]}</span>}
          <button className="admin-secondary-button" type="button" onClick={reset} disabled={busy}>
            <RotateCcw size={18} />
            Reset
          </button>
          <button className="admin-primary-button" type="button" onClick={save} disabled={busy || !dirty || errors.length > 0}>
            {saveState === "saving" ? <Loader2 size={18} /> : <Save size={18} />}
            Save
          </button>
          <button className="admin-secondary-button" type="button" onClick={logout} disabled={busy}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <div className="lp-scroll inline-admin-scroll">
        <article className="lp-paper inline-resume-paper">
          <header className="rp-header">
            <label className="rp-photo inline-photo-edit" title="Upload profile image">
              <ProfileImage
                src={uploadPreview || draft.profile.imageUrl}
                alt={draft.profile.imageAlt}
                srcSet={draft.profile.image2xUrl ? `${draft.profile.imageUrl} 1x, ${draft.profile.image2xUrl} 2x` : undefined}
                blurSrc={draft.profile.imageBlurUrl}
                defer={loading && !uploadPreview}
              />
              <span className="inline-photo-edit__upload"><Upload size={14} /></span>
              <input
                type="file"
                accept="image/*,.heic,.heif,.3fr,.arw,.cr2,.cr3,.dcr,.dng,.erf,.k25,.kdc,.mrw,.nef,.nrw,.orf,.pef,.raf,.raw,.rw2,.sr2,.srf,.x3f"
                onChange={uploadImage}
              />
            </label>
            <div className="rp-header__text">
              <EditableText
                className="rp-name"
                value={draft.profile.name}
                onCommit={(value) => updateDraft((current) => ({ ...current, profile: { ...current.profile, name: value } }))}
              />
              <EditableText
                className="rp-title"
                value={draft.profile.title}
                onCommit={(value) => updateDraft((current) => ({ ...current, profile: { ...current.profile, title: value } }))}
              />
              <div className="rp-contacts inline-reorder-list">
                {draft.profile.contacts.map((contact, index) => (
                  <EditableItem
                    key={`contact-${index}`}
                    dragKey={`contact-${index}`}
                    activeDragKey={dragKey}
                    setDragKey={setDragKey}
                    onDrop={() =>
                      updateDraft((current) => ({
                        ...current,
                        profile: { ...current.profile, contacts: moveDragged(current.profile.contacts, dragKey, `contact-${index}`) },
                      }))
                    }
                    onDelete={() =>
                      updateDraft((current) => ({
                        ...current,
                        profile: { ...current.profile, contacts: removeItem(current.profile.contacts, index) },
                      }))
                    }
                  >
                    <EditableText
                      value={contact}
                      onCommit={(value) =>
                        updateDraft((current) => ({
                          ...current,
                          profile: { ...current.profile, contacts: updatePrimitive(current.profile.contacts, index, value) },
                        }))
                      }
                    />
                  </EditableItem>
                ))}
                <AddInlineButton
                  label="Add contact"
                  onClick={() =>
                    updateDraft((current) => ({
                      ...current,
                      profile: { ...current.profile, contacts: [...current.profile.contacts, "New contact"] },
                    }))
                  }
                />
              </div>
            </div>
          </header>

          <hr className="rp-rule" />

          <section className="rp-section">
            <h2 className="rp-sh">PROFILE</h2>
            <EditableText
              multiline
              className="rp-body"
              value={draft.profile.summary}
              onCommit={(value) => updateDraft((current) => ({ ...current, profile: { ...current.profile, summary: value } }))}
            />
          </section>

          <div className="rp-two-col">
            <section className="rp-section">
              <InlineSectionTitle
                label="SKILLS"
                addLabel="Add group"
                onAdd={() => updateDraft((current) => ({ ...current, skills: [...current.skills, emptySkillGroup()] }))}
              />
              <ul className="rp-ul">
                {draft.skills.map((group, groupIndex) => (
                  <li className="inline-reorder-row" key={`skill-group-${groupIndex}`}>
                    <DragHandle
                      dragKey={`skill-${groupIndex}`}
                      activeDragKey={dragKey}
                      setDragKey={setDragKey}
                      onDrop={() => updateDraft((current) => ({ ...current, skills: moveDragged(current.skills, dragKey, `skill-${groupIndex}`) }))}
                    />
                    <button
                      className="inline-delete-button"
                      type="button"
                      aria-label="Delete skill group"
                      onClick={() => updateDraft((current) => ({ ...current, skills: removeItem(current.skills, groupIndex) }))}
                    >
                      <Trash2 size={12} />
                    </button>
                    <strong>
                      <EditableText
                        value={group.label}
                        onCommit={(value) =>
                          updateDraft((current) => ({
                            ...current,
                            skills: updateItem(current.skills, groupIndex, { label: value }),
                          }))
                        }
                      />
                      :
                    </strong>{" "}
                    {group.items.map((skill, skillIndex) => (
                      <span key={`skill-${groupIndex}-${skillIndex}`}>
                        <EditableText
                          value={skill}
                          onCommit={(value) =>
                            updateDraft((current) => ({
                              ...current,
                              skills: updateItem(current.skills, groupIndex, {
                                items: updatePrimitive(current.skills[groupIndex].items, skillIndex, value),
                              }),
                            }))
                          }
                        />
                        {skillIndex < group.items.length - 1 ? ", " : ""}
                      </span>
                    ))}
                    <AddInlineButton
                      label="Add skill"
                      compact
                      onClick={() =>
                        updateDraft((current) => ({
                          ...current,
                          skills: updateItem(current.skills, groupIndex, {
                            items: [...current.skills[groupIndex].items, "New skill"],
                          }),
                        }))
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>

            <section className="rp-section">
              <InlineSectionTitle
                label="EDUCATION"
                addLabel="Add education"
                onAdd={() => updateDraft((current) => ({ ...current, education: [...current.education, emptyEducation()] }))}
              />
              {draft.education.map((item, index) => (
                <EducationEditor
                  key={`education-${index}`}
                  item={item}
                  index={index}
                  dragKey={dragKey}
                  setDragKey={setDragKey}
                  updateDraft={updateDraft}
                />
              ))}
            </section>
          </div>

          <section className="rp-section">
            <InlineSectionTitle
              label="EXPERIENCE"
              addLabel="Add experience"
              onAdd={() => updateDraft((current) => ({ ...current, experiences: [...current.experiences, emptyExperience()] }))}
            />
            {draft.experiences.map((item, index) => (
              <ExperienceEditor
                key={`experience-${index}`}
                item={item}
                index={index}
                dragKey={dragKey}
                setDragKey={setDragKey}
                updateDraft={updateDraft}
              />
            ))}
          </section>

          <section className="rp-section">
            <InlineSectionTitle
              label="PROJECTS"
              addLabel="Add featured"
              onAdd={() =>
                updateDraft((current) => ({
                  ...current,
                  projects: { ...current.projects, featured: [...current.projects.featured, emptyProject()] },
                }))
              }
            />
            {draft.projects.featured.map((item, index) => (
              <ProjectEditor
                key={`featured-${index}`}
                item={item}
                bucket="featured"
                index={index}
                dragKey={dragKey}
                setDragKey={setDragKey}
                updateDraft={updateDraft}
              />
            ))}

            <div className="rp-two-col-sm">
              {draft.projects.compact.map((item, index) => (
                <ProjectEditor
                  key={`compact-${index}`}
                  item={item}
                  bucket="compact"
                  index={index}
                  dragKey={dragKey}
                  setDragKey={setDragKey}
                  updateDraft={updateDraft}
                />
              ))}
            </div>
            <AddInlineButton
              label="Add compact project"
              onClick={() =>
                updateDraft((current) => ({
                  ...current,
                  projects: { ...current.projects, compact: [...current.projects.compact, emptyProject()] },
                }))
              }
            />
          </section>
        </article>
      </div>
    </main>
  );
}

function isSupportedProfileImageFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return file.type.startsWith("image/") || SUPPORTED_PROFILE_IMAGE_EXTENSIONS.has(extension);
}

function EducationEditor({
  item,
  index,
  dragKey,
  setDragKey,
  updateDraft,
}: {
  item: EducationItem;
  index: number;
  dragKey: string | null;
  setDragKey: (key: string | null) => void;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  return (
    <EditableItem
      className="rp-job"
      dragKey={`education-${index}`}
      activeDragKey={dragKey}
      setDragKey={setDragKey}
      onDrop={() => updateDraft((current) => ({ ...current, education: moveDragged(current.education, dragKey, `education-${index}`) }))}
      onDelete={() => updateDraft((current) => ({ ...current, education: removeItem(current.education, index) }))}
    >
      <div className="rp-job__head">
        <strong>
          <EditableText
            value={item.degree}
            onCommit={(value) => updateDraft((current) => ({ ...current, education: updateItem(current.education, index, { degree: value }) }))}
          />
        </strong>
        <span className="rp-date">
          <EditableText
            value={item.period}
            onCommit={(value) => updateDraft((current) => ({ ...current, education: updateItem(current.education, index, { period: value }) }))}
          />
        </span>
      </div>
      <p className="rp-body-sm">
        <EditableText
          multiline
          value={`${item.school}\n${item.detail}`}
          onCommit={(value) => {
            const [school, ...detail] = value.split("\n");
            updateDraft((current) => ({ ...current, education: updateItem(current.education, index, { school, detail: detail.join("\n") }) }));
          }}
        />
      </p>
    </EditableItem>
  );
}

function ExperienceEditor({
  item,
  index,
  dragKey,
  setDragKey,
  updateDraft,
}: {
  item: ExperienceItem;
  index: number;
  dragKey: string | null;
  setDragKey: (key: string | null) => void;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  return (
    <EditableItem
      className="rp-job"
      dragKey={`experience-${index}`}
      activeDragKey={dragKey}
      setDragKey={setDragKey}
      onDrop={() => updateDraft((current) => ({ ...current, experiences: moveDragged(current.experiences, dragKey, `experience-${index}`) }))}
      onDelete={() => updateDraft((current) => ({ ...current, experiences: removeItem(current.experiences, index) }))}
    >
      <div className="rp-job__head">
        <strong>
          <EditableText
            value={item.role}
            onCommit={(value) => updateDraft((current) => ({ ...current, experiences: updateItem(current.experiences, index, { role: value }) }))}
          />
        </strong>
        <span className="rp-date">
          <EditableText
            value={item.period}
            onCommit={(value) => updateDraft((current) => ({ ...current, experiences: updateItem(current.experiences, index, { period: value }) }))}
          />
        </span>
      </div>
      <p className="rp-body-sm">
        <EditableText
          multiline
          value={item.description}
          onCommit={(value) => updateDraft((current) => ({ ...current, experiences: updateItem(current.experiences, index, { description: value }) }))}
        />
      </p>
    </EditableItem>
  );
}

function ProjectEditor({
  item,
  bucket,
  index,
  dragKey,
  setDragKey,
  updateDraft,
}: {
  item: PortfolioProject;
  bucket: ProjectBucket;
  index: number;
  dragKey: string | null;
  setDragKey: (key: string | null) => void;
  updateDraft: (updater: (current: PortfolioContent) => PortfolioContent) => void;
}) {
  return (
    <EditableItem
      className="rp-job"
      dragKey={`${bucket}-${index}`}
      activeDragKey={dragKey}
      setDragKey={setDragKey}
      onDrop={() =>
        updateDraft((current) => ({
          ...current,
          projects: { ...current.projects, [bucket]: moveDragged(current.projects[bucket], dragKey, `${bucket}-${index}`) },
        }))
      }
      onDelete={() =>
        updateDraft((current) => ({
          ...current,
          projects: { ...current.projects, [bucket]: removeItem(current.projects[bucket], index) },
        }))
      }
    >
      <div className="rp-job__head">
        <strong>
          <EditableText value={item.name} onCommit={(value) => updateProject(updateDraft, bucket, index, { name: value })} />
        </strong>
        <span className="rp-date">
          <EditableText value={item.period} onCommit={(value) => updateProject(updateDraft, bucket, index, { period: value })} />
        </span>
      </div>
      <p className="rp-job__stack">
        <EditableText value={item.stack} onCommit={(value) => updateProject(updateDraft, bucket, index, { stack: value })} />
      </p>
      <p className="rp-body-sm">
        <EditableText multiline value={item.description} onCommit={(value) => updateProject(updateDraft, bucket, index, { description: value })} />
      </p>
    </EditableItem>
  );
}

function EditableText({
  value,
  onCommit,
  multiline = false,
  className = "",
}: {
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key === "Enter" && (!multiline || !event.shiftKey)) {
      event.preventDefault();
      commit();
    }
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          className={`inline-edit-field ${className}`}
          value={draft}
          rows={Math.max(2, draft.split("\n").length)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
      );
    }
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        className={`inline-edit-field ${className}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
    );
  }

  return (
    <span className={`inline-edit-display ${className}`} onDoubleClick={() => setEditing(true)} title="Double-click to edit">
      {value.split("\n").map((line, index) => (
        <span key={`${line}-${index}`}>
          {line}
          {index < value.split("\n").length - 1 && <br />}
        </span>
      ))}
    </span>
  );
}

function EditableItem({
  children,
  dragKey,
  activeDragKey,
  setDragKey,
  onDrop,
  onDelete,
  className = "",
}: {
  children: ReactNode;
  dragKey: string;
  activeDragKey: string | null;
  setDragKey: (key: string | null) => void;
  onDrop: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <span
      className={`inline-edit-item ${className}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => {
        if (activeDragKey && activeDragKey !== dragKey) onDrop();
        setDragKey(null);
      }}
    >
      <DragHandle dragKey={dragKey} activeDragKey={activeDragKey} setDragKey={setDragKey} onDrop={onDrop} />
      <button className="inline-delete-button" type="button" aria-label="Delete item" onClick={onDelete}>
        <Trash2 size={12} />
      </button>
      {children}
    </span>
  );
}

function DragHandle({
  dragKey,
  activeDragKey,
  setDragKey,
  onDrop,
}: {
  dragKey: string;
  activeDragKey: string | null;
  setDragKey: (key: string | null) => void;
  onDrop: () => void;
}) {
  return (
    <button
      className="inline-drag-handle"
      type="button"
      aria-label="Drag to reorder"
      draggable
      onDragStart={() => setDragKey(dragKey)}
      onDragEnd={() => setDragKey(null)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => {
        if (activeDragKey && activeDragKey !== dragKey) onDrop();
        setDragKey(null);
      }}
    >
      <GripVertical size={13} />
    </button>
  );
}

function InlineSectionTitle({
  label,
  addLabel,
  onAdd,
}: {
  label: string;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="inline-section-title">
      <h2 className="rp-sh">{label}</h2>
      <AddInlineButton label={addLabel} onClick={onAdd} compact />
    </div>
  );
}

function AddInlineButton({ label, onClick, compact = false }: { label: string; onClick: () => void; compact?: boolean }) {
  return (
    <button className={`inline-add-button${compact ? " inline-add-button--compact" : ""}`} type="button" onClick={onClick}>
      <Plus size={compact ? 11 : 13} />
      {label}
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

function parseDragIndex(key: string | null) {
  if (!key) return -1;
  const parts = key.split("-");
  return Number(parts[parts.length - 1]);
}

function moveDragged<T>(items: T[], fromKey: string | null, toKey: string) {
  const from = parseDragIndex(fromKey);
  const to = parseDragIndex(toKey);
  if (from < 0 || to < 0 || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
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

function validatePortfolio(content: PortfolioContent) {
  const errors: string[] = [];
  if (!content.profile.name.trim()) errors.push("Profile name is required");
  if (!content.profile.title.trim()) errors.push("Profile title is required");
  if (!content.profile.summary.trim()) errors.push("Profile summary is required");
  if (content.profile.contacts.some((contact) => !contact.trim())) errors.push("Contact lines cannot be blank");
  if (content.skills.some((group) => !group.label.trim() || group.items.some((item) => !item.trim()))) {
    errors.push("Skills need labels and non-empty items");
  }
  if (content.education.some((item) => !item.degree.trim() || !item.school.trim())) {
    errors.push("Education entries need degree and school");
  }
  if (content.experiences.some((item) => !item.role.trim() || !item.description.trim())) {
    errors.push("Experience entries need role and description");
  }
  if ([...content.projects.featured, ...content.projects.compact].some((item) => !item.name.trim() || !item.description.trim())) {
    errors.push("Projects need name and description");
  }
  return errors;
}

function emptySkillGroup(): ResumeSkillGroup {
  return { label: "New group", items: ["New skill"] };
}

function emptyEducation(): EducationItem {
  return { degree: "New degree", school: "School name", period: "", detail: "" };
}

function emptyExperience(): ExperienceItem {
  return { role: "New role", period: "", description: "Describe this role." };
}

function emptyProject(): PortfolioProject {
  return { name: "New project", period: "", stack: "", description: "Describe this project.", links: [] };
}
