"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ModalErrorBoundary from "@/components/ModalErrorBoundary";
import RichTextEditor from "@/components/RichTextEditor";
import TopBar from "@/components/TopBar";
import { useStoredAuthSession } from "@/lib/clientAuth";
import type { RitualRecord } from "@/lib/types";

const buildForm = (item?: RitualRecord) => ({
  title: item?.title ?? "",
  content: item?.content ?? "",
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

export default function RitualsPage() {
  const authSession = useStoredAuthSession();
  const [rituals, setRituals] = useState<RitualRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageStatus, setPageStatus] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(buildForm());

  const isLoggedIn = Boolean(authSession?.email);

  useEffect(() => {
    if (!authSession?.email) return;
    const loadRituals = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/rituals");
        if (!res.ok) return;
        const data = (await res.json()) as RitualRecord[];
        setRituals(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    loadRituals();
  }, [authSession?.email]);

  const filteredRituals = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rituals;
    return rituals.filter((item) =>
      [item.title, item.preview].join(" ").toLowerCase().includes(term)
    );
  }, [query, rituals]);

  const openModal = (nextMode: "add" | "edit", item?: RitualRecord) => {
    setMode(nextMode);
    setEditingId(item?.id ?? "");
    setForm(buildForm(item));
    setPageStatus("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId("");
    setForm(buildForm());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setPageStatus("Title and content are required. Click into the editor to type.");
      return;
    }

    try {
      const res = await fetch(mode === "add" ? "/api/rituals" : `/api/rituals/${editingId}`, {
        method: mode === "add" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "" }));
        if (res.status === 401) {
          setPageStatus("Please log in again to save your ritual.");
          return;
        }
        setPageStatus(data.message || "Unable to save ritual right now.");
        return;
      }

      const saved = (await res.json()) as RitualRecord;
      setRituals((prev) =>
        mode === "add"
          ? [saved, ...prev]
          : prev.map((item) => (item.id === saved.id ? saved : item))
      );
      closeModal();
    } catch {
      setPageStatus("Unable to save ritual right now.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ritual note?")) return;
    try {
      const res = await fetch(`/api/rituals/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setPageStatus("Unable to delete ritual.");
        return;
      }
      setRituals((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setPageStatus("Unable to delete ritual.");
    }
  };

  return (
    <div className="page">
      <main className="phone">
        <div className="content">
          <TopBar title="Rituals" showBack />

          {!isLoggedIn ? (
            <section className="section">
              <div className="surface profile-card">
                <p className="list-title">Log in required</p>
                <p className="list-meta">Please log in to create and manage ritual notes.</p>
                <Link className="button button--primary" href="/profile">
                  Go to Profile
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section className="rituals-shell surface">
                <div className="rituals-shell__top">
                  <div>
                    <p className="list-title">Your ritual notebook</p>
                    <p className="list-meta">
                      Write notes, build checklists, and revisit each ritual on its own page.
                    </p>
                  </div>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => openModal("add")}
                  >
                    <Plus size={16} />
                    New ritual
                  </button>
                </div>
                <label className="rituals-search">
                  <span className="rituals-search__label">Search rituals</span>
                  <input
                    className="text-input"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a note or checklist"
                  />
                </label>
                {pageStatus ? <p className="list-meta">{pageStatus}</p> : null}
              </section>

              <section className="section">
                <div className="ritual-list">
                  {loading ? (
                    <div className="empty surface">
                      <p>Loading rituals...</p>
                    </div>
                  ) : filteredRituals.length === 0 ? (
                    <div className="empty surface">
                      <p>No ritual notes yet.</p>
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={() => openModal("add")}
                      >
                        Create your first ritual
                      </button>
                    </div>
                  ) : (
                    filteredRituals.map((item) => (
                      <article key={item.id} className="ritual-card surface">
                        <Link className="ritual-card__body" href={`/rituals/${item.id}`}>
                          <div className="ritual-card__meta">
                            <span>{formatDate(item.updatedAt || item.createdAt)}</span>
                          </div>
                          <h2>{item.title}</h2>
                          <p>{item.preview || "Open this ritual to view the full note."}</p>
                        </Link>
                        <div className="ritual-card__actions">
                          <button
                            className="icon-button icon-button--soft"
                            type="button"
                            onClick={() => openModal("edit", item)}
                            aria-label="Edit ritual"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-button icon-button--soft"
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            aria-label="Delete ritual"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
        <BottomNav active="rituals" />
      </main>

      {modalOpen && (
        <div className="modal modal--open">
          <button className="modal__backdrop" type="button" onClick={closeModal} />
          <ModalErrorBoundary
            title="Ritual editor unavailable"
            onClose={closeModal}
            resetKey={`${mode}-${editingId || "new"}-${modalOpen ? "open" : "closed"}`}
          >
            <div className="modal__content surface ritual-modal">
              <div className="modal__header">
                <div>
                  <h2>{mode === "add" ? "New ritual" : "Edit ritual"}</h2>
                  <p className="list-meta">
                    Use headings, notes, bullet points, or checklist items.
                  </p>
                </div>
                <button className="modal__close-button" type="button" onClick={closeModal}>
                  Close
                </button>
              </div>
              <form className="modal__form ritual-form" onSubmit={handleSubmit}>
                <label>
                  Title
                  <input
                    className="text-input"
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="Morning breathing ritual"
                  />
                </label>
                <div className="ritual-form__field">
                  <span>Content</span>
                  <RichTextEditor
                    key={editingId || "new-ritual"}
                    value={form.content}
                    onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
                    placeholder="Write steps, notes, or create a checklist..."
                    autoFocus
                  />
                </div>
                {pageStatus ? <p className="list-meta">{pageStatus}</p> : null}
                <button className="button button--primary ritual-form__submit" type="submit">
                  {mode === "add" ? "Save ritual" : "Update ritual"}
                </button>
              </form>
            </div>
          </ModalErrorBoundary>
        </div>
      )}
    </div>
  );
}
