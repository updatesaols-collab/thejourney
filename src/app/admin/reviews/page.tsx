"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { ReviewRecord, ReviewStatus } from "@/lib/types";

const STATUS_FILTERS: Array<ReviewStatus | "All"> = [
  "All",
  "Published",
  "Hidden",
];

const RATING_FILTERS = ["All", "5", "4", "3", "2", "1"] as const;
const FEATURE_FILTERS = ["All", "Featured", "Regular"] as const;

const buildForm = (item?: ReviewRecord): ReviewRecord => ({
  id: item?.id ?? "",
  name: item?.name ?? "",
  role: item?.role ?? "",
  location: item?.location ?? "",
  rating: Number.isFinite(item?.rating) ? Number(item?.rating) : 5,
  message: item?.message ?? "",
  program: item?.program ?? "",
  featured: Boolean(item?.featured),
  order: Number.isFinite(item?.order) ? Number(item?.order) : 0,
  status: item?.status ?? "Published",
});

const renderStars = (rating: number) => "★".repeat(Math.max(1, Math.min(5, rating)));

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "All">("All");
  const [ratingFilter, setRatingFilter] = useState<(typeof RATING_FILTERS)[number]>("All");
  const [featureFilter, setFeatureFilter] =
    useState<(typeof FEATURE_FILTERS)[number]>("All");
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<ReviewRecord>(buildForm());

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await fetch("/api/reviews");
        if (!res.ok) return;
        const data = (await res.json()) as ReviewRecord[];
        setReviews(data);
      } catch {}
    };
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const term = query.trim().toLowerCase();
    return reviews.filter((item) => {
      const matchesSearch = [item.name, item.role, item.location, item.message, item.program]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesRating =
        ratingFilter === "All" || item.rating === Number(ratingFilter);
      const matchesFeatured =
        featureFilter === "All" ||
        (featureFilter === "Featured" ? item.featured : !item.featured);
      return matchesSearch && matchesStatus && matchesRating && matchesFeatured;
    });
  }, [reviews, query, statusFilter, ratingFilter, featureFilter]);

  const openModal = (nextMode: "add" | "edit", item?: ReviewRecord) => {
    setMode(nextMode);
    setEditingId(item?.id ?? "");
    setForm(buildForm(item));
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "add") {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const created = (await res.json()) as ReviewRecord;
          setReviews((prev) => [created, ...prev]);
          setModalOpen(false);
          setPageStatus({ tone: "success", message: "Review added." });
        } else {
          setPageStatus({ tone: "error", message: "Unable to add review." });
        }
      } else if (editingId) {
        const res = await fetch(`/api/reviews/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = (await res.json()) as ReviewRecord;
          setReviews((prev) =>
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

  const handleDelete = async (item: ReviewRecord) => {
    if (!confirm("Delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((entry) => entry.id !== item.id));
        setPageStatus({ tone: "success", message: "Review deleted." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to delete review." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete review." });
    }
  };

  return (
    <AdminShell
      title="Reviews"
      subtitle="Manage homepage testimonials and slider entries"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search reviews",
      }}
    >
      <section className="admin__toolbar">
        <div className="admin__filters">
          <div className="admin__field">
            Status
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ReviewStatus | "All")
              }
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="admin__field">
            Rating
            <select
              value={ratingFilter}
              onChange={(event) =>
                setRatingFilter(event.target.value as (typeof RATING_FILTERS)[number])
              }
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
              value={featureFilter}
              onChange={(event) =>
                setFeatureFilter(event.target.value as (typeof FEATURE_FILTERS)[number])
              }
            >
              {FEATURE_FILTERS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="admin__toolbar-actions">
          <button className="admin__button" onClick={() => openModal("add")}>
            <Plus size={16} /> Add review
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
            <h2>Reviews list</h2>
            <p>{filteredReviews.length} reviews</p>
          </div>
        </div>
        <div className="admin__programs">
          {filteredReviews.map((item) => (
            <div key={item.id} className="admin__program-card">
              <div className="admin__library-main">
                <h3>{item.name}</h3>
                <p>{item.message}</p>
                <span className="admin__library-meta">
                  {renderStars(item.rating)}
                  {item.role ? ` · ${item.role}` : ""}
                  {item.location ? ` · ${item.location}` : ""}
                  {item.program ? ` · ${item.program}` : ""}
                  {item.featured ? " · Featured" : ""}
                  {Number.isFinite(item.order) ? ` · Order ${item.order}` : ""}
                </span>
              </div>
              <div className="admin__program-meta">
                <span className="badge badge--library">{item.status}</span>
                <div className="admin__program-actions">
                  <button
                    className="admin__icon"
                    onClick={() => openModal("edit", item)}
                    aria-label="Edit review"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="admin__icon danger"
                    onClick={() => handleDelete(item)}
                    aria-label="Delete review"
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
              <h3>{mode === "add" ? "Add review" : "Edit review"}</h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form className="admin-modal__form" onSubmit={handleSubmit}>
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </label>
              <label>
                Role
                <input
                  value={form.role}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, role: event.target.value }))
                  }
                />
              </label>
              <label>
                Location
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, location: event.target.value }))
                  }
                />
              </label>
              <label>
                Program (optional)
                <input
                  value={form.program}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, program: event.target.value }))
                  }
                />
              </label>
              <label>
                Rating
                <select
                  value={form.rating}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      rating: Number(event.target.value),
                    }))
                  }
                >
                  <option value={5}>5 stars</option>
                  <option value={4}>4 stars</option>
                  <option value={3}>3 stars</option>
                  <option value={2}>2 stars</option>
                  <option value={1}>1 star</option>
                </select>
              </label>
              <label>
                Message
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, message: event.target.value }))
                  }
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
                      status: event.target.value as ReviewStatus,
                    }))
                  }
                >
                  <option value="Published">Published</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </label>
              <label className="admin__toggle">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, featured: event.target.checked }))
                  }
                />
                Mark as featured
              </label>
              <button className="admin__button" type="submit">
                {mode === "add" ? "Add review" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
