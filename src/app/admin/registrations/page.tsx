"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Mail, Pencil, Plus, Trash2, Upload } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { RegistrationRecord } from "@/lib/types";
import { downloadCsv, parseAdminDate, parseCsv } from "../utils";
import RichTextEditor from "@/components/RichTextEditor";

const STATUS_FILTERS = ["All", "Pending", "Confirmed", "Waitlist"] as const;
const EMAIL_TARGETS = [
  { value: "selected", label: "Selected people" },
  { value: "filtered", label: "Filtered results" },
  { value: "all", label: "All registrations" },
] as const;

type EmailTarget = (typeof EMAIL_TARGETS)[number]["value"];
type EmailRecipient = {
  email: string;
  name: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const isValidEmail = (value: string) => EMAIL_REGEX.test(normalizeEmail(value));
const stripHtml = (value: string) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [programFilter, setProgramFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportScope, setExportScope] = useState("filtered");
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<RegistrationRecord>({
    id: "",
    fullName: "",
    email: "",
    phone: "",
    programTitle: "",
    status: "Pending",
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<EmailTarget>("selected");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadRegistrations = async () => {
      try {
        const res = await fetch("/api/registrations");
        if (!res.ok) return;
        const data = (await res.json()) as RegistrationRecord[];
        setRegistrations(data);
      } catch {}
    };

    loadRegistrations();
  }, []);

  const programOptions = useMemo(() => {
    const options = new Set(
      registrations
        .map((item) => item.programTitle || "")
        .filter((value) => value.trim().length > 0)
    );
    return ["All", ...Array.from(options)];
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    const term = query.toLowerCase();
    const fromValue = dateFrom ? Date.parse(dateFrom) : null;
    const toValue = dateTo ? Date.parse(dateTo) : null;

    return registrations.filter((item) => {
      const matchesSearch = [item.fullName, item.email, item.programTitle]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesProgram =
        programFilter === "All" || item.programTitle === programFilter;
      const dateValue = parseAdminDate(item.createdAt || "");
      const matchesFrom = fromValue ? dateValue !== null && dateValue >= fromValue : true;
      const matchesTo = toValue ? dateValue !== null && dateValue <= toValue : true;

      return matchesSearch && matchesStatus && matchesProgram && matchesFrom && matchesTo;
    });
  }, [query, registrations, statusFilter, programFilter, dateFrom, dateTo]);

  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => registrations.some((item) => item.id === id))
    );
  }, [registrations]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedRegistrations = useMemo(
    () => registrations.filter((item) => selectedSet.has(item.id)),
    [registrations, selectedSet]
  );

  const filteredIds = useMemo(
    () => filteredRegistrations.map((item) => item.id),
    [filteredRegistrations]
  );

  const selectedFilteredCount = useMemo(
    () => filteredIds.filter((id) => selectedSet.has(id)).length,
    [filteredIds, selectedSet]
  );

  const allFilteredSelected =
    filteredIds.length > 0 && selectedFilteredCount === filteredIds.length;

  const emailRecipients = useMemo(() => {
    const source =
      emailTarget === "selected"
        ? selectedRegistrations
        : emailTarget === "filtered"
          ? filteredRegistrations
          : registrations;

    const deduped = new Map<string, EmailRecipient>();
    source.forEach((item) => {
      const email = normalizeEmail(item.email || "");
      if (!isValidEmail(email)) return;
      if (!deduped.has(email)) {
        deduped.set(email, {
          email,
          name: item.fullName?.trim() || "",
        });
      }
    });

    return Array.from(deduped.values());
  }, [emailTarget, filteredRegistrations, registrations, selectedRegistrations]);

  const openModal = (nextMode: "add" | "edit", item?: RegistrationRecord) => {
    setMode(nextMode);
    setPageStatus(null);
    setForm(
      item ?? {
        id: "",
        fullName: "",
        email: "",
        phone: "",
        programTitle: "",
        status: "Pending",
      }
    );
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "add") {
        const res = await fetch("/api/registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const created = (await res.json()) as RegistrationRecord;
          setRegistrations((prev) => [created, ...prev]);
          setModalOpen(false);
          setPageStatus({ tone: "success", message: "Registration added." });
        } else {
          const data = await res.json().catch(() => ({ message: "" }));
          setPageStatus({
            tone: "error",
            message: data.message || "Unable to add registration.",
          });
        }
      } else {
        const res = await fetch("/api/registrations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = (await res.json()) as RegistrationRecord;
          setRegistrations((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          );
          setModalOpen(false);
          setPageStatus({ tone: "success", message: "Changes saved." });
        } else {
          const data = await res.json().catch(() => ({ message: "" }));
          setPageStatus({
            tone: "error",
            message: data.message || "Unable to save changes.",
          });
        }
      }
    } catch {
      setPageStatus({ tone: "error", message: "Something went wrong. Try again." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this registration?")) return;
    try {
      const res = await fetch("/api/registrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setRegistrations((prev) => prev.filter((item) => item.id !== id));
        setPageStatus({ tone: "success", message: "Registration deleted." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to delete registration." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete registration." });
    }
  };

  const handleExport = () => {
    const rows = exportScope === "all" ? registrations : filteredRegistrations;
    downloadCsv("registrations.csv", rows, [
      "fullName",
      "email",
      "phone",
      "programTitle",
      "createdAt",
      "status",
    ]);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    const mapped = rows.map((row) => ({
      fullName: row.fullName || row.name || "",
      email: row.email || "",
      phone: row.phone || "",
      programTitle: row.programTitle || row.program || "",
      status: (row.status as RegistrationRecord["status"]) || "Pending",
    }));
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapped),
      });
      if (res.ok) {
        const created = (await res.json()) as RegistrationRecord[];
        setRegistrations((prev) => [...created, ...prev]);
        setPageStatus({ tone: "success", message: "Registrations imported." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to import registrations." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to import registrations." });
    }
    event.target.value = "";
  };

  const toggleSelectAllFiltered = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredIds.forEach((id) => {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return Array.from(next);
    });
  };

  const toggleRowSelection = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return Array.from(next);
    });
  };

  const openEmailModal = () => {
    setPageStatus(null);
    setEmailTarget(selectedIds.length > 0 ? "selected" : "filtered");
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!emailSubject.trim()) {
      setPageStatus({ tone: "error", message: "Email subject is required." });
      return;
    }
    if (!stripHtml(emailMessage)) {
      setPageStatus({ tone: "error", message: "Email message is required." });
      return;
    }
    if (emailRecipients.length === 0) {
      setPageStatus({ tone: "error", message: "No valid recipient emails found." });
      return;
    }

    setIsSendingEmail(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch("/api/admin/registrations/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          subject: emailSubject.trim(),
          messageHtml: emailMessage,
          recipients: emailRecipients,
        }),
      });
      clearTimeout(timeout);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPageStatus({
          tone: "error",
          message: data.message || "Unable to send emails.",
        });
        return;
      }

      const sent = Number(data.sent) || 0;
      const failed = Number(data.failed) || 0;
      setPageStatus({
        tone: "success",
        message:
          failed > 0
            ? `Email sent to ${sent} people. ${failed} failed.`
            : `Email sent to ${sent} people.`,
      });
      setEmailModalOpen(false);
      setEmailSubject("");
      setEmailMessage("");
      if (emailTarget === "selected") {
        setSelectedIds([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setPageStatus({
          tone: "error",
          message: "Email request timed out. Please try again.",
        });
      } else {
        setPageStatus({ tone: "error", message: "Unable to send emails." });
      }
    } finally {
      clearTimeout(timeout);
      setIsSendingEmail(false);
    }
  };

  return (
    <AdminShell
      title="Registrations"
      subtitle="Capture and manage participant sign-ups"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search by name, email, program",
      }}
    >
      <section className="admin__toolbar">
        <div className="admin__filters">
          <div className="admin__field">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
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
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="admin__field">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
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
          <button className="admin__button ghost" onClick={openEmailModal}>
            <Mail size={16} /> Send email
          </button>
          <button className="admin__button" onClick={() => openModal("add")}>
            <Plus size={16} /> Add registration
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
            <h2>Registration list</h2>
            <p>
              {filteredRegistrations.length} results · {selectedIds.length} selected
            </p>
          </div>
        </div>
        <table className="admin__table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select all filtered registrations"
                  checked={allFilteredSelected}
                  onChange={(event) => toggleSelectAllFiltered(event.target.checked)}
                  disabled={filteredIds.length === 0}
                />
              </th>
              <th>Name</th>
              <th>Program</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.fullName || item.email || "registration"}`}
                    checked={selectedSet.has(item.id)}
                    onChange={(event) =>
                      toggleRowSelection(item.id, event.target.checked)
                    }
                  />
                </td>
                <td>
                  <strong>{item.fullName}</strong>
                  <span>{item.email}</span>
                </td>
                <td>{item.programTitle}</td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</td>
                <td>
                  <span className={`badge badge--${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td className="admin__table-actions">
                  <button
                    className="admin__icon"
                    onClick={() => openModal("edit", item)}
                    aria-label="Edit registration"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="admin__icon danger"
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete registration"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {emailModalOpen && (
        <div className="admin-modal">
          <div
            className="admin-modal__backdrop"
            onClick={() => setEmailModalOpen(false)}
          />
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>Send email</h3>
              <button className="admin__icon" onClick={() => setEmailModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="admin-modal__form">
              <label>
                Recipients
                <select
                  value={emailTarget}
                  onChange={(event) => setEmailTarget(event.target.value as EmailTarget)}
                >
                  {EMAIL_TARGETS.map((target) => (
                    <option key={target.value} value={target.value}>
                      {target.label}
                    </option>
                  ))}
                </select>
              </label>
              <span className="admin__hint">
                {emailRecipients.length} valid email recipient
                {emailRecipients.length === 1 ? "" : "s"} will receive this message.
              </span>
              <label>
                Subject
                <input
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                  placeholder="Enter email subject"
                />
              </label>
              <label>
                Message
                <RichTextEditor
                  value={emailMessage}
                  onChange={setEmailMessage}
                  placeholder="Write your email message..."
                />
              </label>
              <button
                className="admin__button"
                type="submit"
                disabled={isSendingEmail || emailRecipients.length === 0}
              >
                {isSendingEmail ? "Sending..." : `Send email (${emailRecipients.length})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="admin-modal">
          <div
            className="admin-modal__backdrop"
            onClick={() => setModalOpen(false)}
          />
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>{mode === "add" ? "Add registration" : "Edit registration"}</h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal__form">
              <label>
                Full name
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    setForm({ ...form, fullName: event.target.value })
                  }
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </label>
              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                />
              </label>
              <label>
                Program
                <input
                  value={form.programTitle || ""}
                  onChange={(event) =>
                    setForm({ ...form, programTitle: event.target.value })
                  }
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as RegistrationRecord["status"],
                    })
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Waitlist">Waitlist</option>
                </select>
              </label>
              <button className="admin__button" type="submit">
                {mode === "add" ? "Add registration" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
