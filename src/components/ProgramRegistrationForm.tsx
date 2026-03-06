"use client";

import { useState } from "react";
import type { ProgramRecord } from "@/lib/types";
import { getOrCreateUserId } from "@/lib/clientUser";

type Props = {
  program: ProgramRecord;
};

export default function ProgramRegistrationForm({ program }: Props) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    aolExperience: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStatus("");

    try {
      const payload = {
        ...form,
        programSlug: program.slug,
        programTitle: program.title,
        programDate: program.date,
        programDay: program.day,
        programTime: program.time,
        programDuration: program.duration,
        programTag: program.tag,
        userId: getOrCreateUserId(),
      };

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus("Registration received. We'll be in touch soon.");
        setForm({
          fullName: "",
          email: "",
          phone: "",
          address: "",
          dob: "",
          aolExperience: "",
          message: "",
        });
      } else {
        setStatus("Unable to submit. Please try again.");
      }
    } catch {
      setStatus("Unable to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="modal__form" onSubmit={handleSubmit}>
      <label>
        Full name
        <input
          className="text-input"
          type="text"
          value={form.fullName}
          onChange={(event) => handleChange("fullName", event.target.value)}
        />
      </label>
      <label>
        Email
        <input
          className="text-input"
          type="email"
          value={form.email}
          onChange={(event) => handleChange("email", event.target.value)}
        />
      </label>
      <label>
        Phone
        <input
          className="text-input"
          type="tel"
          value={form.phone}
          onChange={(event) => handleChange("phone", event.target.value)}
        />
      </label>
      <label>
        Address
        <input
          className="text-input"
          type="text"
          value={form.address}
          onChange={(event) => handleChange("address", event.target.value)}
        />
      </label>
      <label>
        Date of birth
        <input
          className="text-input"
          type="date"
          value={form.dob}
          onChange={(event) => handleChange("dob", event.target.value)}
        />
      </label>
      <label>
        Have you done any Art of Living programs before?
        <select
          className="text-input"
          value={form.aolExperience}
          onChange={(event) => handleChange("aolExperience", event.target.value)}
        >
          <option value="">Select one</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
      <label>
        Message
        <textarea
          className="text-input"
          rows={3}
          value={form.message}
          onChange={(event) => handleChange("message", event.target.value)}
        />
      </label>
      <button type="submit" className="button button--primary" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit registration"}
      </button>
      {status && (
        <p className="list-meta" aria-live="polite">
          {status}
        </p>
      )}
    </form>
  );
}
