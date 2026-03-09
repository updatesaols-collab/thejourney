"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import ModalErrorBoundary from "@/components/ModalErrorBoundary";
import type { ProgramRecord } from "@/lib/types";

type Props = {
  program: ProgramRecord;
};

export default function ProgramRegistrationForm({ program }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    aolExperience: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFeedbackAction = () => {
    if (!feedback) return;
    if (feedback.tone === "success") {
      router.push("/");
      return;
    }
    setFeedback(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

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
      };

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({ message: "" }))) as {
        message?: string;
      };

      if (res.ok) {
        setFeedback({
          tone: "success",
          message: "Registration received. We'll be in touch soon.",
        });
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
        setFeedback({
          tone: "error",
          message: data.message || "Unable to submit. Please try again.",
        });
      }
    } catch {
      setFeedback({
        tone: "error",
        message: "Unable to submit. Please try again.",
      });
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

      {feedback && (
        <div className="modal modal--open" aria-hidden={false}>
          <button
            type="button"
            className="modal__backdrop"
            aria-label="Close status modal"
            onClick={handleFeedbackAction}
          />
          <ModalErrorBoundary
            title="Registration status unavailable"
            onClose={handleFeedbackAction}
            resetKey={feedback.tone}
          >
            <div className={`modal__content surface action-feedback action-feedback--${feedback.tone}`}>
              <div className="action-feedback__icon" aria-hidden="true">
                {feedback.tone === "success" ? (
                  <CheckCircle2 size={28} />
                ) : (
                  <AlertTriangle size={28} />
                )}
              </div>
              <h2>
                {feedback.tone === "success"
                  ? "Registration successful"
                  : "Unable to register"}
              </h2>
              <p>{feedback.message}</p>
              <button
                type="button"
                className="button button--secondary"
                onClick={handleFeedbackAction}
              >
                {feedback.tone === "success" ? "Go to home" : "Okay"}
              </button>
            </div>
          </ModalErrorBoundary>
        </div>
      )}
    </form>
  );
}
