"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type {
  BlogRecord,
  BlogStatus,
  LibraryKind,
  LibraryRecord,
  LibraryTone,
} from "@/lib/types";
import RichTextEditor from "@/components/RichTextEditor";

const KIND_OPTIONS: LibraryKind[] = [
  "hero",
  "cta",
  "suggestion",
  "article",
  "quick",
  "intent",
];

const KIND_LABELS: Record<LibraryKind, string> = {
  hero: "Hero",
  cta: "CTA",
  suggestion: "Suggestion",
  article: "Article",
  quick: "Quick",
  intent: "I want to",
};

const TONE_OPTIONS: LibraryTone[] = ["sleep", "anxiety", "morning", "relief"];
const BLOG_STATUS_OPTIONS: BlogStatus[] = ["Published", "Draft"];

type BlogForm = {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tagsInput: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  status: BlogStatus;
  publishedAt: string;
};

/**
 * Converts ISO date to `datetime-local` input format.
 */
const toLocalInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => `${num}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const buildForm = (item?: LibraryRecord): LibraryRecord => ({
  id: item?.id ?? "",
  kind: item?.kind ?? "suggestion",
  title: item?.title ?? "",
  description: item?.description ?? "",
  imageUrl: item?.imageUrl ?? "",
  link: item?.link ?? "",
  eyebrow: item?.eyebrow ?? "",
  tag: item?.tag ?? "",
  time: item?.time ?? "",
  tone: item?.tone ?? "sleep",
  buttonLabel: item?.buttonLabel ?? "",
  order: Number.isFinite(item?.order) ? Number(item?.order) : 0,
});

const buildBlogForm = (item?: BlogRecord): BlogForm => ({
  title: item?.title ?? "",
  excerpt: item?.excerpt ?? "",
  content: item?.content ?? "",
  coverImage: item?.coverImage ?? "",
  author: item?.author ?? "Journey Editorial Team",
  tagsInput: (item?.tags ?? []).join(", "),
  seoTitle: item?.seoTitle ?? "",
  seoDescription: item?.seoDescription ?? "",
  featured: Boolean(item?.featured),
  status: item?.status ?? "Draft",
  publishedAt: toLocalInput(item?.publishedAt),
});

const stripHtml = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Single admin surface for two data sources:
 * 1) library blocks (`/api/library`)
 * 2) legacy SEO articles (`/api/blogs`) merged under Article section.
 */
export default function LibraryAdminPage() {
  const [items, setItems] = useState<LibraryRecord[]>([]);
  const [seoArticles, setSeoArticles] = useState<BlogRecord[]>([]);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<LibraryKind | "all">("all");
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editorType, setEditorType] = useState<"library" | "seo">("library");
  const [editingId, setEditingId] = useState("");
  const [editingSeoId, setEditingSeoId] = useState("");
  const [form, setForm] = useState<LibraryRecord>(buildForm());
  const [blogForm, setBlogForm] = useState<BlogForm>(buildBlogForm());

  // Initial load for both content stores used by this page.
  useEffect(() => {
    const loadData = async () => {
      try {
        const [libraryRes, blogsRes] = await Promise.all([
          fetch("/api/library"),
          fetch("/api/blogs"),
        ]);
        if (libraryRes.ok) {
          const data = (await libraryRes.json()) as LibraryRecord[];
          setItems(data);
        }
        if (blogsRes.ok) {
          const data = (await blogsRes.json()) as BlogRecord[];
          setSeoArticles(data);
        }
      } catch {}
    };
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const term = query.toLowerCase();
    return items.filter((item) => {
      const matchesKind = kindFilter === "all" || item.kind === kindFilter;
      const matchesSearch = [item.title, item.description, item.tag, item.link]
        .join(" ")
        .toLowerCase()
        .includes(term);
      return matchesKind && matchesSearch;
    });
  }, [items, query, kindFilter]);

  const filteredSeoArticles = useMemo(() => {
    if (kindFilter !== "all" && kindFilter !== "article") return [];
    const term = query.toLowerCase();
    return seoArticles.filter((item) =>
      [item.title, item.excerpt, item.author, item.tags.join(" "), item.seoTitle]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [seoArticles, query, kindFilter]);

  const groupedItems = useMemo(() => {
    const groups = new Map<LibraryKind, LibraryRecord[]>();
    KIND_OPTIONS.forEach((kind) => groups.set(kind, []));
    filteredItems.forEach((item) => {
      const current = groups.get(item.kind) ?? [];
      current.push(item);
      groups.set(item.kind, current);
    });
    groups.forEach((list, key) => {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      groups.set(key, list);
    });
    return groups;
  }, [filteredItems]);

  const visibleCount = filteredItems.length + filteredSeoArticles.length;

  // Opens library block editor modal.
  const openLibraryModal = (nextMode: "add" | "edit", item?: LibraryRecord) => {
    setEditorType("library");
    setMode(nextMode);
    setEditingId(item?.id ?? "");
    const nextForm = buildForm(item);
    if (!item && kindFilter !== "all") {
      nextForm.kind = kindFilter;
    }
    setForm(nextForm);
    setModalOpen(true);
  };

  const openSeoModal = (nextMode: "add" | "edit", item?: BlogRecord) => {
    setEditorType("seo");
    setMode(nextMode);
    setEditingSeoId(item?.id ?? "");
    setBlogForm(buildBlogForm(item));
    setModalOpen(true);
  };

  // Handles create/update for library blocks.
  const handleLibrarySubmit = async () => {
    if (mode === "add") {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = (await res.json()) as LibraryRecord;
        setItems((prev) => [created, ...prev]);
        setModalOpen(false);
        setPageStatus({ tone: "success", message: "Library item added." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to add item." });
      }
      return;
    }

    if (!editingId) return;

    const res = await fetch(`/api/library/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = (await res.json()) as LibraryRecord;
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setModalOpen(false);
      setPageStatus({ tone: "success", message: "Changes saved." });
    } else {
      setPageStatus({ tone: "error", message: "Unable to save changes." });
    }
  };

  // Handles create/update for merged SEO articles.
  const handleSeoSubmit = async () => {
    const parsedDate = blogForm.publishedAt ? new Date(blogForm.publishedAt) : null;
    const publishedAt =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : undefined;

    const payload = {
      title: blogForm.title.trim(),
      excerpt: blogForm.excerpt.trim(),
      content: blogForm.content,
      coverImage: blogForm.coverImage.trim(),
      author: blogForm.author.trim(),
      tags: blogForm.tagsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      seoTitle: blogForm.seoTitle.trim(),
      seoDescription: blogForm.seoDescription.trim(),
      featured: blogForm.featured,
      status: blogForm.status,
      publishedAt,
    };

    if (mode === "add") {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = (await res.json()) as BlogRecord;
        setSeoArticles((prev) => [created, ...prev]);
        setModalOpen(false);
        setPageStatus({ tone: "success", message: "SEO article added." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to add SEO article." });
      }
      return;
    }

    if (!editingSeoId) return;

    const res = await fetch(`/api/blogs/${editingSeoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updated = (await res.json()) as BlogRecord;
      setSeoArticles((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setModalOpen(false);
      setPageStatus({ tone: "success", message: "SEO article updated." });
    } else {
      setPageStatus({ tone: "error", message: "Unable to update SEO article." });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editorType === "seo") {
        await handleSeoSubmit();
      } else {
        await handleLibrarySubmit();
      }
    } catch {
      setPageStatus({ tone: "error", message: "Something went wrong. Try again." });
    }
  };

  // Removes a library block record.
  const handleDeleteLibrary = async (item: LibraryRecord) => {
    if (!confirm("Delete this library item?")) return;
    try {
      const res = await fetch(`/api/library/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((entry) => entry.id !== item.id));
        setPageStatus({ tone: "success", message: "Library item deleted." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to delete item." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete item." });
    }
  };

  // Removes a merged SEO article record.
  const handleDeleteSeo = async (item: BlogRecord) => {
    if (!confirm("Delete this SEO article?")) return;
    try {
      const res = await fetch(`/api/blogs/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setSeoArticles((prev) => prev.filter((entry) => entry.id !== item.id));
        setPageStatus({ tone: "success", message: "SEO article deleted." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to delete SEO article." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete SEO article." });
    }
  };

  const isHero = form.kind === "hero";
  const isCta = form.kind === "cta";
  const isSuggestion = form.kind === "suggestion";
  const isArticle = form.kind === "article";
  const isQuick = form.kind === "quick";
  const isIntent = form.kind === "intent";

  return (
    <AdminShell
      title="Library"
      subtitle="Manage library blocks and SEO articles in one place"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search library content",
      }}
    >
      <section className="admin__toolbar">
        <div className="admin__filters">
          <div className="admin__field">
            Type
            <select
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value as LibraryKind | "all")}
            >
              <option value="all">All</option>
              {KIND_OPTIONS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="admin__toolbar-actions">
          <button className="admin__button" onClick={() => openLibraryModal("add")}>
            <Plus size={16} /> Add item
          </button>
          {(kindFilter === "all" || kindFilter === "article") && (
            <button className="admin__button" onClick={() => openSeoModal("add")}>
              <Plus size={16} /> Add SEO article
            </button>
          )}
        </div>
      </section>
      {pageStatus && (
        <div className={`admin__status admin__status--${pageStatus.tone}`}>
          {pageStatus.message}
        </div>
      )}

      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Library content</h2>
            <p>{visibleCount} items</p>
          </div>
        </div>
        <div className="admin__library-groups">
          {KIND_OPTIONS.map((kind) => {
            const list = groupedItems.get(kind) ?? [];
            const seoList = kind === "article" ? filteredSeoArticles : [];
            if (list.length === 0 && seoList.length === 0) return null;

            return (
              <div key={kind} className="admin__library-group">
                <div className="admin__library-group-head">
                  <h3>{KIND_LABELS[kind]}</h3>
                  <span>{list.length + seoList.length} items</span>
                </div>
                <div className="admin__programs">
                  {list.map((item) => (
                    <div key={item.id} className="admin__program-card">
                      <div className="admin__library-main">
                        <h3>{item.title}</h3>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="admin__library-thumb"
                            loading="lazy"
                          />
                        )}
                        {item.description && <p>{stripHtml(item.description)}</p>}
                        <span className="admin__library-meta">
                          {item.tag ? `Tag: ${item.tag}` : "No tag"}
                          {item.time ? ` · ${item.time}` : ""}
                          {item.link ? ` · ${item.link}` : ""}
                          {item.tone ? ` · Tone: ${item.tone}` : ""}
                          {Number.isFinite(item.order) ? ` · Order ${item.order}` : ""}
                        </span>
                      </div>
                      <div className="admin__program-meta">
                        <span className="badge badge--library">{KIND_LABELS[item.kind]}</span>
                        <div className="admin__program-actions">
                          <button
                            className="admin__icon"
                            onClick={() => openLibraryModal("edit", item)}
                            aria-label="Edit library item"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="admin__icon danger"
                            onClick={() => handleDeleteLibrary(item)}
                            aria-label="Delete library item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {kind === "article" &&
                    seoList.map((item) => (
                      <div key={`seo-${item.id}`} className="admin__program-card">
                        <div className="admin__library-main">
                          <h3>{item.title}</h3>
                          {item.coverImage && (
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              className="admin__library-thumb"
                              loading="lazy"
                            />
                          )}
                          {item.excerpt && <p>{stripHtml(item.excerpt)}</p>}
                          <span className="admin__library-meta">
                            {item.tags?.length ? `Tags: ${item.tags.slice(0, 3).join(", ")}` : "No tags"}
                            {item.author ? ` · ${item.author}` : ""}
                            {item.publishedAt ? ` · ${formatDate(item.publishedAt)}` : ""}
                            {item.status ? ` · ${item.status}` : ""}
                          </span>
                        </div>
                        <div className="admin__program-meta">
                          <span className="badge badge--library">SEO Article</span>
                          <div className="admin__program-actions">
                            <button
                              className="admin__icon"
                              onClick={() => openSeoModal("edit", item)}
                              aria-label="Edit SEO article"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="admin__icon danger"
                              onClick={() => handleDeleteSeo(item)}
                              aria-label="Delete SEO article"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {modalOpen && (
        <div className="admin-modal">
          <div className="admin-modal__backdrop" onClick={() => setModalOpen(false)} />
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>
                {editorType === "seo"
                  ? mode === "add"
                    ? "Add SEO article"
                    : "Edit SEO article"
                  : mode === "add"
                    ? "Add library item"
                    : "Edit library item"}
              </h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal__form">
              {editorType === "seo" ? (
                <>
                  <label>
                    Title
                    <input
                      value={blogForm.title}
                      onChange={(event) =>
                        setBlogForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Excerpt
                    <textarea
                      rows={3}
                      value={blogForm.excerpt}
                      onChange={(event) =>
                        setBlogForm((prev) => ({ ...prev, excerpt: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Cover image URL
                    <input
                      value={blogForm.coverImage}
                      onChange={(event) =>
                        setBlogForm((prev) => ({ ...prev, coverImage: event.target.value }))
                      }
                      placeholder="https://..."
                    />
                    {blogForm.coverImage ? (
                      <img
                        src={blogForm.coverImage}
                        alt="SEO article preview"
                        className="admin__image-preview"
                      />
                    ) : null}
                  </label>
                  <label>
                    Author
                    <input
                      value={blogForm.author}
                      onChange={(event) =>
                        setBlogForm((prev) => ({ ...prev, author: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Tags (comma separated)
                    <input
                      value={blogForm.tagsInput}
                      onChange={(event) =>
                        setBlogForm((prev) => ({ ...prev, tagsInput: event.target.value }))
                      }
                      placeholder="meditation, sudarshan kriya, yoga"
                    />
                  </label>
                  <label>
                    SEO title
                    <input
                      value={blogForm.seoTitle}
                      onChange={(event) =>
                        setBlogForm((prev) => ({ ...prev, seoTitle: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    SEO description
                    <textarea
                      rows={2}
                      value={blogForm.seoDescription}
                      onChange={(event) =>
                        setBlogForm((prev) => ({ ...prev, seoDescription: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={blogForm.status}
                      onChange={(event) =>
                        setBlogForm((prev) => ({
                          ...prev,
                          status: event.target.value as BlogStatus,
                        }))
                      }
                    >
                      {BLOG_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Published at
                    <input
                      type="datetime-local"
                      value={blogForm.publishedAt}
                      onChange={(event) =>
                        setBlogForm((prev) => ({ ...prev, publishedAt: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={blogForm.featured}
                      onChange={(event) =>
                        setBlogForm((prev) => ({ ...prev, featured: event.target.checked }))
                      }
                    />{" "}
                    Featured article
                  </label>
                  <label>
                    Content
                    <RichTextEditor
                      value={blogForm.content}
                      onChange={(value) =>
                        setBlogForm((prev) => ({
                          ...prev,
                          content: value,
                        }))
                      }
                      placeholder="Write the complete SEO article content."
                    />
                  </label>
                  <button className="admin__button" type="submit">
                    {mode === "add" ? "Add SEO article" : "Save SEO article"}
                  </button>
                </>
              ) : (
                <>
                  <label>
                    Type
                    <select
                      value={form.kind}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          kind: event.target.value as LibraryKind,
                          tone: prev.tone ?? "sleep",
                        }))
                      }
                    >
                      {KIND_OPTIONS.map((kind) => (
                        <option key={kind} value={kind}>
                          {KIND_LABELS[kind]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Title
                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                    />
                  </label>
                  {!isQuick && !isIntent && (
                    <label>
                      Description
                      <RichTextEditor
                        value={form.description}
                        onChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            description: value,
                          }))
                        }
                        placeholder="Write the body text that appears on the library page."
                      />
                    </label>
                  )}
                  {isIntent && (
                    <label>
                      Article link
                      <input
                        value={form.link || ""}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, link: event.target.value }))
                        }
                        placeholder="/library or /library/{id}"
                      />
                    </label>
                  )}
                  {!isCta && !isIntent && (
                    <label>
                      Daily guidance label
                      <input
                        value={form.eyebrow}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, eyebrow: event.target.value }))
                        }
                      />
                    </label>
                  )}
                  {(isHero || isCta || isArticle || isQuick) && (
                    <label>
                      Action label
                      <input
                        value={form.buttonLabel}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            buttonLabel: event.target.value,
                          }))
                        }
                        placeholder={isQuick ? "Open" : "Read"}
                      />
                    </label>
                  )}
                  {isSuggestion && (
                    <label>
                      Tone
                      <select
                        value={form.tone}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            tone: event.target.value as LibraryTone,
                          }))
                        }
                      >
                        {TONE_OPTIONS.map((tone) => (
                          <option key={tone} value={tone}>
                            {tone}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {isArticle && (
                    <label>
                      Cover image URL
                      <input
                        value={form.imageUrl || ""}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                        }
                        placeholder="https://..."
                      />
                      {form.imageUrl ? (
                        <img
                          src={form.imageUrl}
                          alt="Article preview"
                          className="admin__image-preview"
                        />
                      ) : null}
                    </label>
                  )}
                  {isArticle && (
                    <label>
                      Tag
                      <input
                        value={form.tag}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, tag: event.target.value }))
                        }
                      />
                    </label>
                  )}
                  {(isArticle || isQuick) && (
                    <label>
                      Time
                      <input
                        value={form.time}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, time: event.target.value }))
                        }
                        placeholder={isQuick ? "3 min" : "6 min read"}
                      />
                    </label>
                  )}
                  <label>
                    Order
                    <input
                      type="number"
                      value={form.order}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          order: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <button className="admin__button" type="submit">
                    {mode === "add" ? "Add item" : "Save changes"}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
