"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { ProgramRecord } from "@/lib/types";
import { downloadCsv, parseCsv } from "../utils";
import RichTextEditor from "@/components/RichTextEditor";

const STATUS_FILTERS = ["All", "Open", "Filling", "Closed"] as const;
const DEFAULT_TAGS = ["Breathwork", "Meditation", "Yoga", "Sound", "Retreat"];

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [facilitatorFilter, setFacilitatorFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [exportScope, setExportScope] = useState("filtered");
  const [imageStatus, setImageStatus] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingSlug, setEditingSlug] = useState("");
  const [highlightsInput, setHighlightsInput] = useState("");
  const [form, setForm] = useState<ProgramRecord>({
    id: "",
    slug: "",
    title: "",
    date: "",
    day: "",
    time: "",
    duration: "",
    tag: "Meditation",
    location: "",
    venue: "",
    mapUrl: "",
    imageUrl: "",
    summary: "",
    description: "",
    highlights: [],
    facilitator: "",
    seats: 0,
    status: "Open",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const res = await fetch("/api/programs");
        if (!res.ok) return;
        const data = (await res.json()) as ProgramRecord[];
        setPrograms(data);
      } catch {}
    };

    loadPrograms();
  }, []);

  const facilitatorOptions = useMemo(() => {
    const options = new Set(programs.map((item) => item.facilitator));
    return ["All", ...Array.from(options)];
  }, [programs]);

  const tagOptions = useMemo(() => {
    const options = new Set(programs.map((item) => item.tag));
    return ["All", ...Array.from(options)];
  }, [programs]);

  const tagSuggestions = useMemo(() => {
    const options = new Set<string>(DEFAULT_TAGS);
    programs.forEach((item) => options.add(item.tag));
    return Array.from(options);
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    const term = query.toLowerCase();
    return programs.filter((item) => {
      const matchesSearch = [item.title, item.facilitator, item.location]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesFacilitator =
        facilitatorFilter === "All" || item.facilitator === facilitatorFilter;
      const matchesTag = tagFilter === "All" || item.tag === tagFilter;
      return matchesSearch && matchesStatus && matchesFacilitator && matchesTag;
    });
  }, [programs, query, statusFilter, facilitatorFilter, tagFilter]);

  const openModal = (nextMode: "add" | "edit", item?: ProgramRecord) => {
    setMode(nextMode);
    setEditingSlug(item?.slug || "");
    setImageStatus("");
    setHighlightsInput(item?.highlights?.join(", ") ?? "");
    setForm(
      item ?? {
        id: "",
        slug: "",
        title: "",
        date: "",
        day: "",
        time: "",
        duration: "",
        tag: "Meditation",
        location: "",
        venue: "",
        mapUrl: "",
        imageUrl: "",
        summary: "",
        description: "",
        highlights: [],
        facilitator: "",
        seats: 0,
        status: "Open",
      }
    );
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedHighlights = highlightsInput
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    const payload: ProgramRecord = {
      ...form,
      highlights: parsedHighlights,
    };
    try {
      if (mode === "add") {
        const res = await fetch("/api/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = (await res.json()) as ProgramRecord;
          setPrograms((prev) => [created, ...prev]);
          setModalOpen(false);
          setPageStatus({ tone: "success", message: "Program added." });
        } else {
          setPageStatus({ tone: "error", message: "Unable to add program." });
        }
      } else if (editingSlug) {
        const res = await fetch(`/api/programs/${editingSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = (await res.json()) as ProgramRecord;
          setPrograms((prev) =>
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

  const handleDelete = async (item: ProgramRecord) => {
    if (!confirm("Delete this program?")) return;
    try {
      const res = await fetch(`/api/programs/${item.slug}`, { method: "DELETE" });
      if (res.ok) {
        setPrograms((prev) => prev.filter((program) => program.id !== item.id));
        setPageStatus({ tone: "success", message: "Program deleted." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to delete program." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete program." });
    }
  };

  const handleExport = () => {
    const rows = exportScope === "all" ? programs : filteredPrograms;
    downloadCsv("programs.csv", rows, [
      "title",
      "date",
      "day",
      "time",
      "duration",
      "tag",
      "location",
      "venue",
      "mapUrl",
      "imageUrl",
      "summary",
      "description",
      "highlights",
      "facilitator",
      "seats",
      "status",
    ]);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    const mapped = rows.map((row) => ({
      title: row.title || row.name || "",
      date: row.date || row.startDate || "",
      day: row.day || "",
      time: row.time || "",
      duration: row.duration || "",
      tag: (row.tag as ProgramRecord["tag"]) || "Meditation",
      location: row.location || "",
      venue: row.venue || "",
      mapUrl: row.mapUrl || row.map || "",
      imageUrl: row.imageUrl || row.image || "",
      summary: row.summary || "",
      description: row.description || "",
      highlights: row.highlights
        ? row.highlights.split(/\s*\|\s*|\s*,\s*/).filter(Boolean)
        : [],
      facilitator: row.facilitator || "",
      seats: Number(row.seats) || 0,
      status: (row.status as ProgramRecord["status"]) || "Open",
    }));
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapped),
      });
      if (res.ok) {
        const created = (await res.json()) as ProgramRecord[];
        setPrograms((prev) => [...created, ...prev]);
        setPageStatus({ tone: "success", message: "Programs imported." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to import programs." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to import programs." });
    }
    event.target.value = "";
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    setImageStatus("");
    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "the-journey/programs" }),
      });

      if (!signRes.ok) {
        const data = await signRes.json().catch(() => ({ message: "" }));
        setImageStatus(data.message || "Upload unavailable.");
        return;
      }

      const data = (await signRes.json()) as {
        cloudName: string;
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
      };

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", data.apiKey);
      body.append("timestamp", String(data.timestamp));
      body.append("signature", data.signature);
      body.append("folder", data.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
        {
          method: "POST",
          body,
        }
      );

      if (!uploadRes.ok) {
        setImageStatus("Upload failed. Try again.");
        return;
      }

      const uploadData = (await uploadRes.json()) as {
        secure_url?: string;
        url?: string;
      };
      const imageUrl = uploadData.secure_url || uploadData.url || "";
      if (imageUrl) {
        setForm((prev) => ({ ...prev, imageUrl }));
        setImageStatus("Image uploaded.");
      } else {
        setImageStatus("Upload failed. Try again.");
      }
    } catch {
      setImageStatus("Upload failed. Try again.");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  return (
    <AdminShell
      title="Programs"
      subtitle="Plan and manage upcoming sessions"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search programs or facilitators",
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
            Facilitator
            <select
              value={facilitatorFilter}
              onChange={(event) => setFacilitatorFilter(event.target.value)}
            >
              {facilitatorOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="admin__field">
            Tag
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
            >
              {tagOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
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
            <Plus size={16} /> Add program
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
            <h2>Program schedule</h2>
            <p>{filteredPrograms.length} programs</p>
          </div>
        </div>
        <div className="admin__programs">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="admin__program-card">
              <div className="admin__program-main">
                {program.imageUrl ? (
                  <img
                    className="admin__program-thumb"
                    src={program.imageUrl}
                    alt={`${program.title} cover`}
                    loading="lazy"
                  />
                ) : (
                  <div className="admin__program-thumb admin__program-thumb--empty">
                    No image
                  </div>
                )}
                <div>
                  <h3>{program.title}</h3>
                  <p>
                    {program.day} · {program.date} · {program.time} · {program.duration}
                  </p>
                  <span>{program.facilitator}</span>
                </div>
              </div>
              <div className="admin__program-meta">
                <span>{program.seats} seats</span>
                <span className={`badge badge--${program.status.toLowerCase()}`}>
                  {program.status}
                </span>
                <div className="admin__program-actions">
                  <button
                    className="admin__icon"
                    onClick={() => openModal("edit", program)}
                    aria-label="Edit program"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="admin__icon danger"
                    onClick={() => handleDelete(program)}
                    aria-label="Delete program"
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
              <h3>{mode === "add" ? "Add program" : "Edit program"}</h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal__form">
              <label>
                Program name
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </label>
              <label>
                Date
                <input
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </label>
              <label>
                Day
                <input
                  value={form.day}
                  onChange={(event) => setForm({ ...form, day: event.target.value })}
                />
              </label>
              <label>
                Time
                <input
                  value={form.time}
                  onChange={(event) => setForm({ ...form, time: event.target.value })}
                />
              </label>
              <label>
                Duration
                <input
                  value={form.duration}
                  onChange={(event) =>
                    setForm({ ...form, duration: event.target.value })
                  }
                />
              </label>
              <label>
                Tag
                <input
                  list="program-tags"
                  value={form.tag}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      tag: event.target.value,
                    })
                  }
                  placeholder="Type or select a tag"
                />
                <datalist id="program-tags">
                  {tagSuggestions.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </label>
              <label>
                Venue
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm({ ...form, location: event.target.value })
                  }
                  placeholder="e.g. Main Hall, Zoom"
                />
              </label>
              <label>
                Map link (optional)
                <input
                  value={form.mapUrl ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, mapUrl: event.target.value })
                  }
                  placeholder="https://maps.google.com/..."
                />
              </label>
              <label>
                Program image
                <div className="admin__upload-row">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleImageUpload(event.target.files?.[0])
                    }
                  />
                  {isUploadingImage && <span className="admin__hint">Uploading...</span>}
                  {imageStatus && <span className="admin__hint">{imageStatus}</span>}
                </div>
                {form.imageUrl && (
                  <img
                    className="admin__image-preview"
                    src={form.imageUrl}
                    alt="Program preview"
                  />
                )}
              </label>
              <label>
                Summary
                <textarea
                  rows={3}
                  value={form.summary}
                  onChange={(event) =>
                    setForm({ ...form, summary: event.target.value })
                  }
                />
              </label>
              <label>
                Description
                <RichTextEditor
                  value={form.description}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, description: value }))
                  }
                  placeholder="Describe the program, include highlights and structure."
                />
              </label>
              <label>
                Highlights (comma separated)
                <input
                  value={highlightsInput}
                  onChange={(event) => setHighlightsInput(event.target.value)}
                  placeholder="e.g. Guided practice, Breath reset, Closing reflection"
                />
              </label>
              <label>
                Facilitator
                <input
                  value={form.facilitator}
                  onChange={(event) =>
                    setForm({ ...form, facilitator: event.target.value })
                  }
                />
              </label>
              <label>
                Seats
                <input
                  type="number"
                  value={form.seats}
                  onChange={(event) =>
                    setForm({ ...form, seats: Number(event.target.value) })
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
                      status: event.target.value as ProgramRecord["status"],
                    })
                  }
                >
                  <option value="Open">Open</option>
                  <option value="Filling">Filling</option>
                  <option value="Closed">Closed</option>
                </select>
              </label>
              <button className="admin__button" type="submit" disabled={isUploadingImage}>
                {mode === "add" ? "Add program" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
