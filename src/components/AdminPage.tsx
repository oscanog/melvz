import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  History,
  GripVertical,
  KeyRound,
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
import { usePortfolioContent } from "../content/PortfolioContentProvider";
import { prepareProfileImageUpload } from "../utils/profileImageProcessing";
import { AdminGate } from "./AdminGate";
import { ProfileImage } from "./ProfileImage";
import { ResumeAiChat } from "./ai/ResumeAiChat";
import type {
  EducationItem,
  ExperienceItem,
  PortfolioContent,
  PortfolioProject,
  ResumeSkillGroup,
} from "../content/portfolioTypes";

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
  return (
    <AdminGate loginMessage="Login to edit the same bond-paper resume.">
      {({ sessionToken, logout }) => (
        <InlineAdmin sessionToken={sessionToken} logout={logout} />
      )}
    </AdminGate>
  );
}

function InlineAdmin({
  sessionToken,
  logout,
}: {
  sessionToken: string;
  logout: () => void;
}): ReactElement {
  const { content, source, loading } = usePortfolioContent();
  const updatePortfolio = useMutation(api.admin.updatePortfolio);
  const generateUploadUrl = useMutation(api.admin.generateProfileImageUploadUrl);
  const setProfileImage = useMutation(api.admin.setProfileImage);
  const aiSettings = useQuery(api.aiSettings.getAdminSettings, { sessionToken });
  const updateAiSettings = useMutation(api.aiSettings.updateSettings);
  const saveProviderKey = useAction(api.aiSecrets.saveProviderKey);

  const [draft, setDraft] = useState<PortfolioContent>(content);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Saved");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [uploadPreview, setUploadPreview] = useState("");
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

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

  const openSaveDialog = () => {
    if (errors.length > 0) {
      setSaveState("invalid");
      setStatus("Fix highlighted resume fields before saving");
      return;
    }
    setSaveMessage("");
    setSaveDialogOpen(true);
  };

  const save = async () => {
    const message = saveMessage.trim();
    if (!message) {
      setSaveState("invalid");
      setStatus("Save message is required");
      return;
    }
    setBusy(true);
    setSaveState("saving");
    setStatus("Saving...");
    try {
      await updatePortfolio({ sessionToken, content: draft, message });
      setDirty(false);
      setSaveDialogOpen(false);
      setSaveMessage("");
      setSaveState("saved");
      setStatus(`Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    } catch (error) {
      setSaveState("failed");
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const showHistory = () => {
    if (dirty && !window.confirm("Leave editor and discard unsaved edits?")) return;
    window.location.hash = "#admin/history";
  };

  const reset = () => {
    setDraft(content);
    setDirty(false);
    setSaveState("saved");
    setStatus("Loaded latest resume");
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
          <button className="admin-secondary-button" type="button" onClick={showHistory} disabled={busy}>
            <History size={18} />
            Show history
          </button>
          <button className="admin-secondary-button" type="button" onClick={() => setAiDialogOpen(true)} disabled={busy}>
            <Bot size={18} />
            AI settings
          </button>
          <button className="admin-secondary-button" type="button" onClick={reset} disabled={busy}>
            <RotateCcw size={18} />
            Reset
          </button>
          <button className="admin-primary-button" type="button" onClick={openSaveDialog} disabled={busy || !dirty || errors.length > 0}>
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
      {saveDialogOpen && (
        <SaveMessageDialog
          message={saveMessage}
          busy={busy}
          onMessageChange={setSaveMessage}
          onCancel={() => {
            if (busy) return;
            setSaveDialogOpen(false);
            setSaveMessage("");
          }}
          onSave={save}
        />
      )}
      <ResumeAiChat
        adminSessionToken={sessionToken}
        hasPendingSave={dirty}
        onApplyDraft={(patched, revisionHint) => {
          setDraft(patched);
          setDirty(true);
          setSaveState("dirty");
          setStatus("AI applied — review & save");
          setSaveMessage(revisionHint);
        }}
        onSaveDraft={async (message) => {
          if (errors.length > 0) {
            setSaveState("invalid");
            setStatus("Fix highlighted resume fields before saving");
            throw new Error("Validation failed");
          }
          setBusy(true);
          setSaveState("saving");
          setStatus("Saving...");
          try {
            await updatePortfolio({
              sessionToken,
              content: draft,
              message,
              createdBy: "ai-admin",
            });
            setDirty(false);
            setSaveMessage("");
            setSaveState("saved");
            setStatus(`Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
          } catch (err) {
            setSaveState("failed");
            setStatus(err instanceof Error ? err.message : "Save failed");
            throw err;
          } finally {
            setBusy(false);
          }
        }}
      />
      {aiDialogOpen && (
        <AiSettingsDialog
          sessionToken={sessionToken}
          settings={aiSettings}
          updateSettings={updateAiSettings}
          saveProviderKey={saveProviderKey}
          onClose={() => setAiDialogOpen(false)}
        />
      )}
    </main>
  );
}

type AdminAiSettings = {
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  defaultModel: string;
  temperature: number;
  maxOutputTokens: number;
  dailyAnonymousMessageLimit: number;
  dailyAdminMessageLimit: number;
  monthlyTokenLimit: number;
  enabledScopes: string[];
  enabledSkills: string[];
  isEnabled: boolean;
  showPublicChat: boolean;
};

type UpdateAiSettings = (args: {
  sessionToken: string;
  defaultModel: "deepseek-v4-flash" | "deepseek-v4-pro";
  temperature: number;
  maxOutputTokens: number;
  dailyAnonymousMessageLimit: number;
  dailyAdminMessageLimit: number;
  monthlyTokenLimit: number;
  enabledScopes: string[];
  enabledSkills: string[];
  isEnabled: boolean;
  showPublicChat: boolean;
}) => Promise<unknown>;

type SaveProviderKey = (args: {
  sessionToken: string;
  apiKey: string;
}) => Promise<{ apiKeyPreview: string }>;

function AiSettingsDialog({
  sessionToken,
  settings,
  updateSettings,
  saveProviderKey,
  onClose,
}: {
  sessionToken: string;
  settings: AdminAiSettings | undefined;
  updateSettings: UpdateAiSettings;
  saveProviderKey: SaveProviderKey;
  onClose: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState<"deepseek-v4-flash" | "deepseek-v4-pro">(
    settings?.defaultModel === "deepseek-v4-pro" ? "deepseek-v4-pro" : "deepseek-v4-flash"
  );
  const [temperature, setTemperature] = useState(settings?.temperature ?? 0.4);
  const [maxOutputTokens, setMaxOutputTokens] = useState(settings?.maxOutputTokens ?? 900);
  const [dailyAnonymousMessageLimit, setDailyAnonymousMessageLimit] = useState(settings?.dailyAnonymousMessageLimit ?? 30);
  const [dailyAdminMessageLimit, setDailyAdminMessageLimit] = useState(settings?.dailyAdminMessageLimit ?? 80);
  const [monthlyTokenLimit, setMonthlyTokenLimit] = useState(settings?.monthlyTokenLimit ?? 250000);
  const [isEnabled, setIsEnabled] = useState(settings?.isEnabled ?? true);
  const [showPublicChat, setShowPublicChat] = useState(settings?.showPublicChat ?? true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!settings) return;
    setDefaultModel(settings.defaultModel === "deepseek-v4-pro" ? "deepseek-v4-pro" : "deepseek-v4-flash");
    setTemperature(settings.temperature);
    setMaxOutputTokens(settings.maxOutputTokens);
    setDailyAnonymousMessageLimit(settings.dailyAnonymousMessageLimit);
    setDailyAdminMessageLimit(settings.dailyAdminMessageLimit);
    setMonthlyTokenLimit(settings.monthlyTokenLimit);
    setIsEnabled(settings.isEnabled);
    setShowPublicChat(settings.showPublicChat);
  }, [settings]);

  const saveConfig = async () => {
    setBusy(true);
    setStatus("Saving AI settings...");
    try {
      await updateSettings({
        sessionToken,
        defaultModel,
        temperature,
        maxOutputTokens,
        dailyAnonymousMessageLimit,
        dailyAdminMessageLimit,
        monthlyTokenLimit,
        enabledScopes: settings?.enabledScopes ?? ["resume", "projects", "skills", "experience", "contact", "game"],
        enabledSkills: settings?.enabledSkills ?? ["general_chat", "resume_lookup"],
        isEnabled,
        showPublicChat,
      });
      setStatus("AI settings saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AI settings save failed");
    } finally {
      setBusy(false);
    }
  };

  const rotateKey = async () => {
    const key = apiKey.trim();
    if (!key) return;
    setBusy(true);
    setStatus("Rotating provider key...");
    try {
      const result = await saveProviderKey({ sessionToken, apiKey: key });
      setApiKey("");
      setStatus(`Provider key saved ${result.apiKeyPreview}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Provider key save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <section className="admin-dialog admin-ai-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
        <div>
          <p className="admin-eyebrow">AI resume chat</p>
          <h2 id="ai-settings-title">AI settings</h2>
          <p>Provider key stays encrypted in Convex. Public chat reads portfolio context only.</p>
        </div>

        {!settings ? (
          <div className="admin-history-empty">Loading AI settings...</div>
        ) : (
          <>
            <div className="admin-ai-status-row">
              <span className={`admin-status-badge admin-status-badge--${settings.hasApiKey ? "saved" : "failed"}`}>
                <KeyRound size={16} />
                {settings.hasApiKey ? `Key ${settings.apiKeyPreview}` : "Key missing"}
              </span>
              <span className={`admin-status-badge admin-status-badge--${isEnabled && showPublicChat ? "saved" : "dirty"}`}>
                <Bot size={16} />
                {isEnabled && showPublicChat ? "Public chat on" : "Public chat off"}
              </span>
            </div>

            <label className="admin-field">
              <span>New provider key</span>
              <input
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                type="password"
                placeholder="Paste DeepSeek API key"
              />
            </label>

            <div className="admin-dialog-actions admin-ai-actions">
              <button className="admin-secondary-button" type="button" disabled={busy || !apiKey.trim()} onClick={rotateKey}>
                <KeyRound size={18} />
                Rotate key
              </button>
            </div>

            <div className="admin-ai-grid">
              <label className="admin-field">
                <span>Model</span>
                <select value={defaultModel} onChange={(event) => setDefaultModel(event.target.value as "deepseek-v4-flash" | "deepseek-v4-pro")}>
                  <option value="deepseek-v4-flash">deepseek-v4-flash</option>
                  <option value="deepseek-v4-pro">deepseek-v4-pro</option>
                </select>
              </label>
              <NumberField label="Temperature" value={temperature} min={0} max={2} step={0.1} onChange={setTemperature} />
              <NumberField label="Max output tokens" value={maxOutputTokens} min={200} max={4000} onChange={setMaxOutputTokens} />
              <NumberField label="Public daily limit" value={dailyAnonymousMessageLimit} min={1} max={500} onChange={setDailyAnonymousMessageLimit} />
              <NumberField label="Admin daily limit" value={dailyAdminMessageLimit} min={1} max={1000} onChange={setDailyAdminMessageLimit} />
              <NumberField label="Monthly tokens" value={monthlyTokenLimit} min={1000} max={5000000} onChange={setMonthlyTokenLimit} />
            </div>

            <label className="admin-ai-toggle">
              <input type="checkbox" checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} />
              AI enabled
            </label>
            <label className="admin-ai-toggle">
              <input type="checkbox" checked={showPublicChat} onChange={(event) => setShowPublicChat(event.target.checked)} />
              Show public chat badge
            </label>
          </>
        )}

        {status && <p className="admin-ai-status">{status}</p>}

        <div className="admin-dialog-actions">
          <button className="admin-secondary-button" type="button" disabled={busy} onClick={onClose}>
            Close
          </button>
          <button className="admin-primary-button" type="button" disabled={busy || !settings} onClick={saveConfig}>
            {busy ? <Loader2 size={18} /> : <Save size={18} />}
            Save AI settings
          </button>
        </div>
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SaveMessageDialog({
  message,
  busy,
  onMessageChange,
  onCancel,
  onSave,
}: {
  message: string;
  busy: boolean;
  onMessageChange: (message: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="save-message-title">
        <div>
          <p className="admin-eyebrow">Commit changes</p>
          <h2 id="save-message-title">Save message</h2>
          <p>Use a short title for this resume revision.</p>
        </div>
        <label className="admin-field">
          <span>Message</span>
          <input
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && message.trim()) onSave();
              if (event.key === "Escape") onCancel();
            }}
            autoFocus
            maxLength={120}
            placeholder="Update work experience"
          />
        </label>
        <div className="admin-dialog-actions">
          <button className="admin-secondary-button" type="button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button className="admin-primary-button" type="button" disabled={busy || !message.trim()} onClick={onSave}>
            {busy ? <Loader2 size={18} /> : <Save size={18} />}
            Save
          </button>
        </div>
      </section>
    </div>
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
