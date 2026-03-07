"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { FeedbackRecord } from "@/lib/types";
import { downloadCsv, parseCsv } from "../utils";

const RATING_FILTERS = ["All", "5", "4", "3", "2", "1"] as const;

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [query, setQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [exportScope, setExportScope] = useState("filtered");
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<FeedbackRecord>({
    id: "",
    type: "journal",
    name: "",
    program: "",
    rating: 5,
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const res = await fetch("/api/feedback");
        if (!res.ok) return;
        const data = (await res.json()) as FeedbackRecord[];
        setFeedbacks(data);
      } catch {}
    };

    loadFeedback();
  }, []);

  const programOptions = useMemo(() => {
    const options = new Set(
      feedbacks
        .map((item) => item.program || "")
        .filter((value) => value.trim().length > 0)
    );
    return ["All", ...Array.from(options)];
  }, [feedbacks]);

  const filteredFeedback = useMemo(() => {
    const term = query.toLowerCase();
    return feedbacks.filter((item) => {
      const matchesSearch = [item.name, item.program, item.message]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesProgram =
        programFilter === "All" || item.program === programFilter;
      const matchesRating =
        ratingFilter === "All" || item.rating === Number(ratingFilter);
      const matchesType = typeFilter === "All" || item.type === typeFilter;
      return matchesSearch && matchesProgram && matchesRating && matchesType;
    });
  }, [feedbacks, query, programFilter, ratingFilter, typeFilter]);

  const openModal = (nextMode: "add" | "edit", item?: FeedbackRecord) => {
    setMode(nextMode);
    setPageStatus(null);
    setForm(
      item ?? {
        id: "",
        type: "journal",
        name: "",
        program: "",
        rating: 5,
        message: "",
      }
    );
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "add") {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const created = (await res.json()) as FeedbackRecord;
          setFeedbacks((prev) => [created, ...prev]);
          setModalOpen(false);
          setPageStatus({ tone: "success", message: "Feedback added." });
        } else {
          setPageStatus({ tone: "error", message: "Unable to add feedback." });
        }
      } else {
        const res = await fetch("/api/feedback", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = (await res.json()) as FeedbackRecord;
          setFeedbacks((prev) =>
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    try {
      const res = await fetch("/api/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setFeedbacks((prev) => prev.filter((item) => item.id !== id));
        setPageStatus({ tone: "success", message: "Feedback deleted." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to delete feedback." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete feedback." });
    }
  };

  const handleExport = () => {
    const rows = exportScope === "all" ? feedbacks : filteredFeedback;
    downloadCsv("feedback.csv", rows, [
      "type",
      "name",
      "program",
      "rating",
      "message",
      "createdAt",
    ]);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    const mapped = rows.map((row) => ({
      type: (row.type as FeedbackRecord["type"]) || "journal",
      name: row.name || "",
      program: row.program || "",
      rating: Number(row.rating) || 5,
      message: row.message || "",
    }));
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapped),
      });
      if (res.ok) {
        const created = (await res.json()) as FeedbackRecord[];
        setFeedbacks((prev) => [...created, ...prev]);
        setPageStatus({ tone: "success", message: "Feedback imported." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to import feedback." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to import feedback." });
    }
    event.target.value = "";
  };

  return (
    <AdminShell
      title="Feedback"
      subtitle="Capture participant reflections and ratings"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search by name, program, keyword",
      }}
    >
      <section className="admin__toolbar">
        <div className="admin__filters">
          <div className="admin__field">
            Program
            <select
              value={programFilter}
              onChange={(event) => setProgramFilter(event.target.value)}
            >
              {programOptions.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </div>
          <div className="admin__field">
            Rating
            <select
              value={ratingFilter}
              onChange={(event) => setRatingFilter(event.target.value)}
            >
              {RATING_FILTERS.map((rating) => (
                <option key={rating} value={rating}>
                  {rating === "All" ? "All" : `${rating} stars`}
                </option>
              ))}
            </select>
          </div>
          <div className="admin__field">
            Type
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="All">All</option>
              <option value="journal">Daily reflection</option>
              <option value="experience">Program feedback</option>
            </select>
          </div>
        </div>
        <div className="admin__toolbar-actions">
          <select
            className="admin__select"
            value={exportScope}
            onChange={(event) => setExportScope(event.target.value)}
          >
            <option value="filtered">Export filtered</option>
            <option value="all">Export all</option>
          </select>
          <input
            ref={fileInputRef}
            className="admin__file-input"
            type="file"
            accept=".csv"
            onChange={handleImport}
          />
          <button
            className="admin__button outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} /> Import
          </button>
          <button className="admin__button light" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
          <button className="admin__button" onClick={() => openModal("add")}>
            <Plus size={16} /> Add feedback
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
            <h2>Feedback entries</h2>
            <p>{filteredFeedback.length} entries</p>
          </div>
        </div>
        <div className="admin__feedback">
          {filteredFeedback.map((item) => (
            <div key={item.id} className="admin__feedback-card">
              <div>
                <h4>{item.name}</h4>
                <p>{item.program}</p>
                <span>{item.message}</span>
              </div>
              <div className="admin__feedback-meta">
                <span>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : ""}
                </span>
                <span className="badge badge--confirmed">
                  {typeof item.rating === "number" ? `${item.rating}/5` : "—"}
                </span>
                <div className="admin__program-actions">
                  <button
                    className="admin__icon"
                    onClick={() => openModal("edit", item)}
                    aria-label="Edit feedback"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="admin__icon danger"
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete feedback"
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
          <div
            className="admin-modal__backdrop"
            onClick={() => setModalOpen(false)}
          />
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>{mode === "add" ? "Add feedback" : "Edit feedback"}</h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal__form">
              <label>
                Type
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value as FeedbackRecord["type"] })
                  }
                >
                  <option value="journal">Daily reflection</option>
                  <option value="experience">Program feedback</option>
                </select>
              </label>
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </label>
              <label>
                Program
                <input
                  value={form.program}
                  onChange={(event) => setForm({ ...form, program: event.target.value })}
                />
              </label>
              <label>
                Rating
                <select
                  value={form.rating}
                  onChange={(event) =>
                    setForm({ ...form, rating: Number(event.target.value) })
                  }
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Needs work</option>
                </select>
              </label>
              <label>
                Message
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                />
              </label>
              <button className="admin__button" type="submit">
                {mode === "add" ? "Add feedback" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
