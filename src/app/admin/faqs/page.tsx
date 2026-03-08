"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { FaqRecord, FaqStatus } from "@/lib/types";

const STATUS_FILTERS: Array<FaqStatus | "All"> = ["All", "Published", "Draft"];

const buildForm = (item?: FaqRecord): FaqRecord => ({
  id: item?.id ?? "",
  question: item?.question ?? "",
  answer: item?.answer ?? "",
  category: item?.category ?? "General",
  order: Number.isFinite(item?.order) ? Number(item?.order) : 0,
  status: item?.status ?? "Published",
});

const toCategoryKey = (value: string) => value.trim().toLowerCase();

export default function FaqAdminPage() {
  const [faqs, setFaqs] = useState<FaqRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FaqStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<FaqRecord>(buildForm());

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const res = await fetch("/api/faqs");
        if (!res.ok) return;
        const data = (await res.json()) as FaqRecord[];
        setFaqs(data);
      } catch {}
    };
    loadFaqs();
  }, []);

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    faqs.forEach((item) => {
      const raw = item.category?.trim();
      if (!raw) return;
      const key = toCategoryKey(raw);
      if (!map.has(key)) map.set(key, raw);
    });
    return ["All", ...Array.from(map.values()).sort((a, b) => a.localeCompare(b))];
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    const term = query.toLowerCase();
    return faqs.filter((item) => {
      const matchesSearch = [item.question, item.answer, item.category]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesCategory =
        categoryFilter === "All" ||
        toCategoryKey(item.category) === toCategoryKey(categoryFilter);
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [faqs, query, statusFilter, categoryFilter]);

  const openModal = (nextMode: "add" | "edit", item?: FaqRecord) => {
    setMode(nextMode);
    setEditingId(item?.id ?? "");
    setForm(buildForm(item));
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "add") {
        const res = await fetch("/api/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const created = (await res.json()) as FaqRecord;
          setFaqs((prev) => [created, ...prev]);
          setModalOpen(false);
          setPageStatus({ tone: "success", message: "FAQ added." });
        } else {
          setPageStatus({ tone: "error", message: "Unable to add FAQ." });
        }
      } else if (editingId) {
        const res = await fetch(`/api/faqs/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = (await res.json()) as FaqRecord;
          setFaqs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
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

  const handleDelete = async (item: FaqRecord) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      const res = await fetch(`/api/faqs/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setFaqs((prev) => prev.filter((entry) => entry.id !== item.id));
        setPageStatus({ tone: "success", message: "FAQ deleted." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to delete FAQ." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete FAQ." });
    }
  };

  return (
    <AdminShell
      title="FAQs"
      subtitle="Manage frequently asked questions shown on homepage"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search FAQs",
      }}
    >
      <section className="admin__toolbar">
        <div className="admin__filters">
          <div className="admin__field">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as FaqStatus | "All")}
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="admin__field">
            Category
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="admin__toolbar-actions">
          <button className="admin__button" onClick={() => openModal("add")}>
            <Plus size={16} /> Add FAQ
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
            <h2>FAQ list</h2>
            <p>{filteredFaqs.length} items</p>
          </div>
        </div>
        <div className="admin__programs">
          {filteredFaqs.map((item) => (
            <div key={item.id} className="admin__program-card">
              <div className="admin__library-main">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
                <span className="admin__library-meta">
                  {item.category || "General"}
                  {Number.isFinite(item.order) ? ` · Order ${item.order}` : ""}
                </span>
              </div>
              <div className="admin__program-meta">
                <span className="badge badge--library">{item.status}</span>
                <div className="admin__program-actions">
                  <button
                    className="admin__icon"
                    onClick={() => openModal("edit", item)}
                    aria-label="Edit FAQ"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="admin__icon danger"
                    onClick={() => handleDelete(item)}
                    aria-label="Delete FAQ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {modalOpen && (
        <div className="admin-modal">
          <div className="admin-modal__backdrop" onClick={() => setModalOpen(false)} />
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>{mode === "add" ? "Add FAQ" : "Edit FAQ"}</h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form className="admin-modal__form" onSubmit={handleSubmit}>
              <label>
                Question
                <input
                  value={form.question}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, question: event.target.value }))
                  }
                />
              </label>
              <label>
                Answer
                <textarea
                  rows={5}
                  value={form.answer}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, answer: event.target.value }))
                  }
                />
              </label>
              <label>
                Category
                <input
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                  placeholder="General, Programs, Registration..."
                />
              </label>
              <label>
                Order
                <input
                  type="number"
                  value={form.order}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, order: Number(event.target.value) || 0 }))
                  }
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as FaqStatus,
                    }))
                  }
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </label>
              <button className="admin__button" type="submit">
                {mode === "add" ? "Add FAQ" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
