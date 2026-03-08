"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { LibraryKind, LibraryRecord, LibraryTone } from "@/lib/types";
import RichTextEditor from "@/components/RichTextEditor";

const KIND_OPTIONS: LibraryKind[] = [
  "hero",
  "cta",
  "suggestion",
  "article",
  "quick",
];

const KIND_LABELS: Record<LibraryKind, string> = {
  hero: "Hero",
  cta: "CTA",
  suggestion: "Suggestion",
  article: "Article",
  quick: "Quick",
};

const TONE_OPTIONS: LibraryTone[] = ["sleep", "anxiety", "morning", "relief"];

const buildForm = (item?: LibraryRecord): LibraryRecord => ({
  id: item?.id ?? "",
  kind: item?.kind ?? "suggestion",
  title: item?.title ?? "",
  description: item?.description ?? "",
  eyebrow: item?.eyebrow ?? "",
  tag: item?.tag ?? "",
  time: item?.time ?? "",
  tone: item?.tone ?? "sleep",
  buttonLabel: item?.buttonLabel ?? "",
  order: Number.isFinite(item?.order) ? Number(item?.order) : 0,
});

const stripHtml = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export default function LibraryAdminPage() {
  const [items, setItems] = useState<LibraryRecord[]>([]);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<LibraryKind | "all">("all");
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<LibraryRecord>(buildForm());

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const res = await fetch("/api/library");
        if (!res.ok) return;
        const data = (await res.json()) as LibraryRecord[];
        setItems(data);
      } catch {}
    };
    loadLibrary();
  }, []);

  const filteredItems = useMemo(() => {
    const term = query.toLowerCase();
    return items.filter((item) => {
      const matchesKind = kindFilter === "all" || item.kind === kindFilter;
      const matchesSearch = [item.title, item.description, item.tag]
        .join(" ")
        .toLowerCase()
        .includes(term);
      return matchesKind && matchesSearch;
    });
  }, [items, query, kindFilter]);

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

  const openModal = (nextMode: "add" | "edit", item?: LibraryRecord) => {
    setMode(nextMode);
    setEditingId(item?.id ?? "");
    setForm(buildForm(item));
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
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
      } else if (editingId) {
        const res = await fetch(`/api/library/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = (await res.json()) as LibraryRecord;
          setItems((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          );
          setModalOpen(false);
          setPageStatus({ tone: "success", message: "Changes saved." });
        } else {
          setPageStatus({ tone: "error", message: "Unable to save changes." });
        }
      }
    } catch {
      setPageStatus({ tone: "error", message: "Something went wrong. Try again." });
    }
  };

  const handleDelete = async (item: LibraryRecord) => {
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

  const isHero = form.kind === "hero";
  const isCta = form.kind === "cta";
  const isSuggestion = form.kind === "suggestion";
  const isArticle = form.kind === "article";
  const isQuick = form.kind === "quick";

  return (
    <AdminShell
      title="Library"
      subtitle="Manage the content blocks shown on the Library page"
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
              onChange={(event) =>
                setKindFilter(event.target.value as LibraryKind | "all")
              }
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
          <button className="admin__button" onClick={() => openModal("add")}>
            <Plus size={16} /> Add item
          </button>
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
            <p>{filteredItems.length} items</p>
          </div>
        </div>
        <div className="admin__library-groups">
          {KIND_OPTIONS.map((kind) => {
            const list = groupedItems.get(kind) ?? [];
            if (list.length === 0) return null;
            return (
              <div key={kind} className="admin__library-group">
                <div className="admin__library-group-head">
                  <h3>{KIND_LABELS[kind]}</h3>
                  <span>{list.length} items</span>
                </div>
                <div className="admin__programs">
                  {list.map((item) => (
                    <div key={item.id} className="admin__program-card">
                      <div className="admin__library-main">
                        <h3>{item.title}</h3>
                        {item.description && <p>{stripHtml(item.description)}</p>}
                        <span className="admin__library-meta">
                          {item.tag ? `Tag: ${item.tag}` : "No tag"}
                          {item.time ? ` · ${item.time}` : ""}
                          {item.tone ? ` · Tone: ${item.tone}` : ""}
                          {Number.isFinite(item.order) ? ` · Order ${item.order}` : ""}
                        </span>
                      </div>
                      <div className="admin__program-meta">
                        <span className="badge badge--library">
                          {KIND_LABELS[item.kind]}
                        </span>
                        <div className="admin__program-actions">
                          <button
                            className="admin__icon"
                            onClick={() => openModal("edit", item)}
                            aria-label="Edit library item"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="admin__icon danger"
                            onClick={() => handleDelete(item)}
                            aria-label="Delete library item"
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
              <h3>{mode === "add" ? "Add library item" : "Edit library item"}</h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal__form">
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
              {!isQuick && (
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
              {!isCta && (
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
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
