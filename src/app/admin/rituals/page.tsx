"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import RichTextEditor from "@/components/RichTextEditor";
import type { RitualRecord } from "@/lib/types";

const buildForm = (item?: RitualRecord) => ({
  title: item?.title ?? "",
  content: item?.content ?? "",
  userName: item?.userName ?? "",
});

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function AdminRitualsPage() {
  const [rituals, setRituals] = useState<RitualRecord[]>([]);
  const [query, setQuery] = useState("");
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(buildForm());

  useEffect(() => {
    const loadRituals = async () => {
      try {
        const res = await fetch("/api/rituals");
        if (!res.ok) return;
        const data = (await res.json()) as RitualRecord[];
        setRituals(data);
      } catch {}
    };

    loadRituals();
  }, []);

  const filteredRituals = useMemo(() => {
    const term = query.toLowerCase();
    return rituals.filter((item) =>
      [item.title, item.preview, item.userName, item.userId]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [query, rituals]);

  const openModal = (item: RitualRecord) => {
    setEditingId(item.id);
    setForm(buildForm(item));
    setModalOpen(true);
    setPageStatus(null);
  };

  const closeModal = () => {
    setEditingId("");
    setForm(buildForm());
    setModalOpen(false);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await fetch(`/api/rituals/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setPageStatus({ tone: "error", message: "Unable to save changes." });
        return;
      }
      const updated = (await res.json()) as RitualRecord;
      setRituals((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      closeModal();
      setPageStatus({ tone: "success", message: "Ritual updated." });
    } catch {
      setPageStatus({ tone: "error", message: "Unable to save changes." });
    }
  };

  const handleDelete = async (item: RitualRecord) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      const res = await fetch(`/api/rituals/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        setPageStatus({ tone: "error", message: "Unable to delete ritual." });
        return;
      }
      setRituals((prev) => prev.filter((entry) => entry.id !== item.id));
      setPageStatus({ tone: "success", message: "Ritual deleted." });
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete ritual." });
    }
  };

  return (
    <AdminShell
      title="Rituals"
      subtitle="User-created ritual notes and checklists"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search by title, user, or note content",
      }}
    >
      {pageStatus && (
        <div className={`admin__status admin__status--${pageStatus.tone}`}>
          {pageStatus.message}
        </div>
      )}

      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Ritual notebook</h2>
            <p>{filteredRituals.length} saved rituals</p>
          </div>
        </div>
        <div className="admin__programs">
          {filteredRituals.map((item) => (
            <article key={item.id} className="admin__program-card">
              <div className="admin__library-main">
                <h3>{item.title}</h3>
                <p>{item.preview || "No preview available."}</p>
                <span>
                  {item.userName || "Unknown user"} · {item.userId} ·{" "}
                  {formatDate(item.updatedAt || item.createdAt)}
                </span>
              </div>
              <div className="admin__program-meta">
                <div className="admin__program-actions">
                  <button
                    className="admin__icon"
                    type="button"
                    onClick={() => openModal(item)}
                    aria-label="Edit ritual"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="admin__icon danger"
                    type="button"
                    onClick={() => handleDelete(item)}
                    aria-label="Delete ritual"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {modalOpen && (
        <div className="admin-modal">
          <div className="admin-modal__backdrop" onClick={closeModal} />
          <div className="admin-modal__content admin-modal__content--xl">
            <form className="admin-modal__form" onSubmit={handleSave}>
              <div className="admin-modal__header">
                <div>
                  <h2>Edit ritual</h2>
                  <p>Update the title or body while keeping the linked user record.</p>
                </div>
              </div>
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </label>
              <label>
                Linked user label
                <input
                  value={form.userName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, userName: event.target.value }))
                  }
                />
              </label>
              <label>
                Content
                <RichTextEditor
                  value={form.content}
                  onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
                  placeholder="Write ritual notes or checklist items..."
                />
              </label>
              <div className="admin-modal__actions">
                <button className="admin__button ghost" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="admin__button" type="submit">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
