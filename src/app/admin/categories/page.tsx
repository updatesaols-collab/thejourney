"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { CategoryRecord, ProgramTag } from "@/lib/types";
import { CATEGORY_ICON_OPTIONS, CATEGORY_ICON_MAP } from "@/lib/categoryIcons";

const DEFAULT_TAGS: ProgramTag[] = [
  "Breathwork",
  "Meditation",
  "Yoga",
  "Sound",
  "Retreat",
];

const DEFAULT_ICON_BY_TAG: Record<string, string> = {
  Breathwork: "Wind",
  Meditation: "Sparkles",
  Yoga: "Heart",
  Sound: "Music",
  Retreat: "Leaf",
};

const buildForm = (item?: CategoryRecord): CategoryRecord => ({
  id: item?.id ?? "",
  title: item?.title ?? item?.tag ?? "",
  tag: item?.tag ?? "Meditation",
  imageUrl: item?.imageUrl ?? "",
  iconName: item?.iconName ?? DEFAULT_ICON_BY_TAG[item?.tag ?? "Meditation"],
  order: Number.isFinite(item?.order) ? Number(item?.order) : 0,
});

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [query, setQuery] = useState("");
  const [pageStatus, setPageStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<CategoryRecord>(buildForm());
  const [imageStatus, setImageStatus] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [visualType, setVisualType] = useState<"icon" | "image">("icon");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) return;
        const data = (await res.json()) as CategoryRecord[];
        setCategories(data);
      } catch {}
    };
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const term = query.toLowerCase();
    return categories.filter((item) =>
      [item.title, item.tag].join(" ").toLowerCase().includes(term)
    );
  }, [categories, query]);

  const openModal = (nextMode: "add" | "edit", item?: CategoryRecord) => {
    setMode(nextMode);
    setEditingId(item?.id ?? "");
    setImageStatus("");
    setForm(buildForm(item));
    setVisualType(item?.imageUrl ? "image" : "icon");
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: CategoryRecord = {
      ...form,
      title: form.tag,
      imageUrl: visualType === "image" ? form.imageUrl : "",
      iconName: visualType === "icon" ? form.iconName : "",
    };
    try {
      if (mode === "add") {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = (await res.json()) as CategoryRecord;
          setCategories((prev) => [created, ...prev]);
          setModalOpen(false);
          setPageStatus({ tone: "success", message: "Category added." });
        } else {
          setPageStatus({ tone: "error", message: "Unable to add category." });
        }
      } else if (editingId) {
        const res = await fetch(`/api/categories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = (await res.json()) as CategoryRecord;
          setCategories((prev) =>
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

  const handleDelete = async (item: CategoryRecord) => {
    if (!confirm("Delete this category?")) return;
    try {
      const res = await fetch(`/api/categories/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((entry) => entry.id !== item.id));
        setPageStatus({ tone: "success", message: "Category deleted." });
      } else {
        setPageStatus({ tone: "error", message: "Unable to delete category." });
      }
    } catch {
      setPageStatus({ tone: "error", message: "Unable to delete category." });
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
        body: JSON.stringify({ folder: "the-journey/categories" }),
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
      title="Categories"
      subtitle="Manage the program categories shown on Home"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search categories",
      }}
    >
      <section className="admin__toolbar">
        <div className="admin__filters" />
        <div className="admin__toolbar-actions">
          <button className="admin__button" onClick={() => openModal("add")}>
            <Plus size={16} /> Add category
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
            <h2>Program categories</h2>
            <p>{filteredCategories.length} categories</p>
          </div>
        </div>
        <div className="admin__programs">
          {filteredCategories.map((item) => (
            <div key={item.id} className="admin__program-card">
              <div className="admin__program-main">
                {item.imageUrl ? (
                  <img
                    className="admin__program-thumb"
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                  />
                ) : item.iconName && CATEGORY_ICON_MAP[item.iconName] ? (
                  <div className="admin__program-thumb admin__program-thumb--empty">
                    {(() => {
                      const Icon = CATEGORY_ICON_MAP[item.iconName!];
                      return <Icon size={20} />;
                    })()}
                  </div>
                ) : (
                  <div className="admin__program-thumb admin__program-thumb--empty">
                    No icon
                  </div>
                )}
                <div>
                  <h3>{item.tag}</h3>
                  <span>Order {item.order}</span>
                </div>
              </div>
              <div className="admin__program-meta">
                <div className="admin__program-actions">
                  <button
                    className="admin__icon"
                    onClick={() => openModal("edit", item)}
                    aria-label="Edit category"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="admin__icon danger"
                    onClick={() => handleDelete(item)}
                    aria-label="Delete category"
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
              <h3>{mode === "add" ? "Add category" : "Edit category"}</h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal__form">
              <label>
                Category (tag)
                <input
                  list="category-tags"
                  value={form.tag}
                  onChange={(event) => {
                    const nextTag = event.target.value;
                    setForm((prev) => ({
                      ...prev,
                      tag: nextTag,
                      title: nextTag,
                      iconName:
                        prev.iconName || DEFAULT_ICON_BY_TAG[nextTag] || prev.iconName,
                    }));
                  }}
                  placeholder="Type a category name"
                />
                <datalist id="category-tags">
                  {DEFAULT_TAGS.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </label>
              <label>
                Visual type
                <select
                  value={visualType}
                  onChange={(event) => {
                    const next = event.target.value as "icon" | "image";
                    setVisualType(next);
                    setForm((prev) => ({
                      ...prev,
                      imageUrl: next === "icon" ? "" : prev.imageUrl,
                      iconName: next === "image" ? "" : prev.iconName,
                    }));
                  }}
                >
                  <option value="icon">Icon</option>
                  <option value="image">Image</option>
                </select>
              </label>
              {visualType === "icon" && (
                <label>
                  Choose icon
                  <div className="icon-picker">
                    {CATEGORY_ICON_OPTIONS.map(({ name, label, Icon }) => {
                      const isActive = form.iconName === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          className={`icon-picker__item ${
                            isActive ? "active" : ""
                          }`}
                          onClick={() =>
                            setForm((prev) => ({ ...prev, iconName: name }))
                          }
                          aria-label={label}
                        >
                          <Icon size={18} />
                        </button>
                      );
                    })}
                  </div>
                  {form.iconName && (
                    <div className="icon-picker__selected">
                      Selected: {form.iconName}
                    </div>
                  )}
                </label>
              )}
              {visualType === "image" && (
                <label>
                  Category image
                  <div className="admin__upload-row">
                    <input
                      ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageUpload(event.target.files?.[0])}
                  />
                  {isUploadingImage && (
                    <span className="admin__hint">Uploading...</span>
                  )}
                  {imageStatus && <span className="admin__hint">{imageStatus}</span>}
                </div>
                  {form.imageUrl && (
                    <img
                      className="admin__image-preview"
                      src={form.imageUrl}
                      alt="Category preview"
                    />
                  )}
                </label>
              )}
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
              <button className="admin__button" type="submit" disabled={isUploadingImage}>
                {mode === "add" ? "Add category" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
