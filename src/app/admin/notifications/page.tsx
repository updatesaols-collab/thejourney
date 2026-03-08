"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { NotificationRecord, NotificationStatus } from "@/lib/types";

const STATUS_FILTERS: Array<NotificationStatus | "All"> = [
  "All",
  "Active",
  "Archived",
];

const buildForm = (item?: NotificationRecord): NotificationRecord => ({
  id: item?.id ?? "",
  title: item?.title ?? "",
  message: item?.message ?? "",
  link: item?.link ?? "",
  status: item?.status ?? "Active",
});

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | "All">(
    "All"
  );
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<NotificationRecord>(buildForm());

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = (await res.json()) as NotificationRecord[];
        setNotifications(data);
      } catch {}
    };
    loadNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    const term = query.toLowerCase();
    return notifications.filter((item) => {
      const matchesSearch = [item.title, item.message]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [notifications, query, statusFilter]);

  const openModal = (nextMode: "add" | "edit", item?: NotificationRecord) => {
    setMode(nextMode);
    setEditingId(item?.id ?? "");
    setForm(buildForm(item));
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "add") {
        const res = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const created = (await res.json()) as NotificationRecord;
          setNotifications((prev) => [created, ...prev]);
          setModalOpen(false);
          setPageStatus({ tone: "success", message: "Notification added." });
        } else {
          setPageStatus({ tone: "error", message: "Unable to add notification." });
        }
      } else if (editingId) {
        const res = await fetch(`/api/notifications/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = (await res.json()) as NotificationRecord;
          setNotifications((prev) =>
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

  const handleDelete = async (item: NotificationRecord) => {
    if (!confirm("Delete this notification?")) return;
    try {
      const res = await fetch(`/api/notifications/${item.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((entry) => entry.id !== item.id));
        setPageStatus({ tone: "success", message: "Notification deleted." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to delete notification." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete notification." });
    }
  };

  return (
    <AdminShell
      title="Notifications"
      subtitle="Push updates to users across the app"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search notifications",
      }}
    >
      <section className="admin__toolbar">
        <div className="admin__filters">
          <div className="admin__field">
            Status
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as NotificationStatus | "All")
              }
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="admin__toolbar-actions">
          <button className="admin__button" onClick={() => openModal("add")}>
            <Plus size={16} /> Add notification
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
            <h2>Active messages</h2>
            <p>{filteredNotifications.length} notifications</p>
          </div>
        </div>
        <div className="admin__programs">
          {filteredNotifications.map((item) => (
            <div key={item.id} className="admin__program-card">
              <div className="admin__library-main">
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                <span className="admin__library-meta">
                  {item.link ? `Link: ${item.link}` : "No link"}
                  {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ""}
                </span>
              </div>
              <div className="admin__program-meta">
                <span className="badge badge--library">{item.status}</span>
                <div className="admin__program-actions">
                  <button
                    className="admin__icon"
                    onClick={() => openModal("edit", item)}
                    aria-label="Edit notification"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="admin__icon danger"
                    onClick={() => handleDelete(item)}
                    aria-label="Delete notification"
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
              <h3>{mode === "add" ? "Add notification" : "Edit notification"}</h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal__form">
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
                Message
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                />
              </label>
              <label>
                Link (optional)
                <input
                  value={form.link}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, link: event.target.value }))
                  }
                  placeholder="/explore or https://"
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as NotificationStatus,
                    }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>
              <button className="admin__button" type="submit">
                {mode === "add" ? "Add notification" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
