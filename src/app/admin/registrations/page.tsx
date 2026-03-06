"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { RegistrationRecord } from "@/lib/types";
import { downloadCsv, parseAdminDate, parseCsv } from "../utils";

const STATUS_FILTERS = ["All", "Pending", "Confirmed", "Waitlist"] as const;

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [programFilter, setProgramFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportScope, setExportScope] = useState("filtered");

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

  const openModal = (nextMode: "add" | "edit", item?: RegistrationRecord) => {
    setMode(nextMode);
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
        }
      }
    } catch {}
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
      }
    } catch {}
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
      }
    } catch {}
    event.target.value = "";
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
          <button className="admin__button" onClick={() => openModal("add")}>
            <Plus size={16} /> Add registration
          </button>
        </div>
      </section>

      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Registration list</h2>
            <p>{filteredRegistrations.length} results</p>
          </div>
        </div>
        <table className="admin__table">
          <thead>
            <tr>
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
