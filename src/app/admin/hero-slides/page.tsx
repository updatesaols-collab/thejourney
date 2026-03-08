"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { HeroSlideRecord, HeroSlideStatus } from "@/lib/types";

const STATUS_OPTIONS: HeroSlideStatus[] = ["Active", "Archived"];

const buildForm = (item?: HeroSlideRecord): HeroSlideRecord => ({
  id: item?.id ?? "",
  imageUrl: item?.imageUrl ?? "",
  link: item?.link ?? "",
  order: Number.isFinite(item?.order) ? Number(item?.order) : 0,
  status: item?.status ?? "Active",
});

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlideRecord[]>([]);
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<HeroSlideRecord>(buildForm());
  const [imageStatus, setImageStatus] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const res = await fetch("/api/hero-slides");
        if (!res.ok) return;
        const data = (await res.json()) as HeroSlideRecord[];
        setSlides(data);
      } catch {}
    };
    loadSlides();
  }, []);

  const openModal = (nextMode: "add" | "edit", item?: HeroSlideRecord) => {
    setMode(nextMode);
    setEditingId(item?.id ?? "");
    setImageStatus("");
    setForm(buildForm(item));
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (mode === "add") {
        const res = await fetch("/api/hero-slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const created = (await res.json()) as HeroSlideRecord;
          setSlides((prev) => [created, ...prev]);
          setModalOpen(false);
          setPageStatus({ tone: "success", message: "Slide added." });
        } else {
          setPageStatus({ tone: "error", message: "Unable to add slide." });
        }
      } else if (editingId) {
        const res = await fetch(`/api/hero-slides/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = (await res.json()) as HeroSlideRecord;
          setSlides((prev) =>
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

  const handleDelete = async (item: HeroSlideRecord) => {
    if (!confirm("Delete this slide?")) return;
    try {
      const res = await fetch(`/api/hero-slides/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setSlides((prev) => prev.filter((entry) => entry.id !== item.id));
        setPageStatus({ tone: "success", message: "Slide deleted." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to delete slide." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete slide." });
    }
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    setImageStatus("");
    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "the-journey/hero" }),
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
        { method: "POST", body }
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
      title="Hero Slides"
      subtitle="Add homepage image slides shown in the top slider"
    >
      <section className="admin__toolbar">
        <div className="admin__filters" />
        <div className="admin__toolbar-actions">
          <button className="admin__button" onClick={() => openModal("add")}>
            <Plus size={16} /> Add slide
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
            <h2>Slides</h2>
            <p>{slides.length} slides</p>
          </div>
        </div>
        <div className="admin__programs">
          {slides.map((item) => (
            <div key={item.id} className="admin__program-card">
              <div className="admin__program-main">
                {item.imageUrl ? (
                  <img
                    className="admin__program-thumb"
                    src={item.imageUrl}
                    alt="Hero slide"
                    loading="lazy"
                  />
                ) : (
                  <div className="admin__program-thumb admin__program-thumb--empty">
                    No image
                  </div>
                )}
                <div>
                  <h3>Slide {item.order + 1}</h3>
                  <p>{item.status}</p>
                  {item.link && <p>{item.link}</p>}
                  <span>Order {item.order}</span>
                </div>
              </div>
              <div className="admin__program-meta">
                <div className="admin__program-actions">
                  <button
                    className="admin__icon"
                    onClick={() => openModal("edit", item)}
                    aria-label="Edit slide"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="admin__icon danger"
                    onClick={() => handleDelete(item)}
                    aria-label="Delete slide"
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
              <h3>{mode === "add" ? "Add slide" : "Edit slide"}</h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal__form">
              <label>
                Slide image
                <div className="admin__upload-row">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageUpload(event.target.files?.[0])}
                  />
                  <span className="admin__hint">
                    Recommended size: 1200 × 900 (4:3)
                  </span>
                  {isUploadingImage && <span className="admin__hint">Uploading...</span>}
                  {imageStatus && <span className="admin__hint">{imageStatus}</span>}
                </div>
                {form.imageUrl && (
                  <img className="admin__image-preview" src={form.imageUrl} alt="Preview" />
                )}
              </label>
              <label>
                Slide link (optional)
                <input
                  type="text"
                  placeholder="/programs/sahaj-samadhi or https://example.com"
                  value={form.link ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, link: event.target.value }))
                  }
                />
              </label>
              <label>
                Order
                <input
                  type="number"
                  value={form.order}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, order: Number(event.target.value) }))
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
                      status: event.target.value as HeroSlideStatus,
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <button className="admin__button" type="submit" disabled={isUploadingImage}>
                {mode === "add" ? "Add slide" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
