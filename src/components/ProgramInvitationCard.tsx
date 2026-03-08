"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

type Props = {
  programSlug: string;
  programTitle: string;
};

type InvitationForm = {
  inviterName: string;
  recipientFullName: string;
  recipientEmail: string;
};

const EMPTY_FORM: InvitationForm = {
  inviterName: "",
  recipientFullName: "",
  recipientEmail: "",
};

export default function ProgramInvitationCard({ programSlug, programTitle }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<InvitationForm>(EMPTY_FORM);
  const [lastRecipient, setLastRecipient] = useState("");

  const updateField = (key: keyof InvitationForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeForm = () => {
    if (isSending) return;
    setIsFormOpen(false);
    setStatus("");
  };

  const closeSuccess = () => {
    setIsSuccessOpen(false);
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    setIsSending(true);
    setStatus("");

    try {
      const res = await fetch("/api/program-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviterName: form.inviterName,
          recipientFullName: form.recipientFullName,
          recipientEmail: form.recipientEmail,
          programSlug,
        }),
      });

      const data = (await res.json().catch(() => ({ message: "" }))) as {
        message?: string;
      };

      if (!res.ok) {
        setStatus(data.message || "Unable to send invitation.");
        return;
      }

      setLastRecipient(form.recipientFullName || form.recipientEmail);
      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      setIsSuccessOpen(true);
    } catch {
      setStatus("Unable to send invitation right now.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <section className="cta-panel surface">
        <div>
          <h2>Invite a friend</h2>
          <p>Share the calm. Bring someone with you to this session.</p>
        </div>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setIsFormOpen(true)}
        >
          Invite friends
        </button>
      </section>

      <div className={`modal ${isFormOpen ? "modal--open" : ""}`} aria-hidden={!isFormOpen}>
        <button
          type="button"
          className="modal__backdrop"
          aria-label="Close invitation form"
          onClick={closeForm}
        />
        <div className="modal__content surface">
          <div className="modal__header">
            <div>
              <p className="eyebrow">Invite friends</p>
              <h2>Send invitation</h2>
            </div>
            <button
              type="button"
              className="modal__close modal__close-button"
              onClick={closeForm}
            >
              Close
            </button>
          </div>

          <form className="modal__form" onSubmit={handleSend}>
            <label>
              Your name
              <input
                className="text-input"
                type="text"
                required
                value={form.inviterName}
                onChange={(event) => updateField("inviterName", event.target.value)}
              />
            </label>
            <label>
              Recipient full name
              <input
                className="text-input"
                type="text"
                required
                value={form.recipientFullName}
                onChange={(event) => updateField("recipientFullName", event.target.value)}
              />
            </label>
            <label>
              Recipient email
              <input
                className="text-input"
                type="email"
                required
                value={form.recipientEmail}
                onChange={(event) => updateField("recipientEmail", event.target.value)}
              />
            </label>

            <button type="submit" className="button button--secondary" disabled={isSending}>
              {isSending ? "Sending..." : "Send invitation"}
            </button>
            {status && (
              <p className="list-meta" aria-live="polite">
                {status}
              </p>
            )}
          </form>
        </div>
      </div>

      <div
        className={`modal ${isSuccessOpen ? "modal--open" : ""}`}
        aria-hidden={!isSuccessOpen}
      >
        <button
          type="button"
          className="modal__backdrop"
          aria-label="Close success dialog"
          onClick={closeSuccess}
        />
        <div className="modal__content surface invite-success">
          <div className="invite-success__icon" aria-hidden="true">
            <CheckCircle2 size={28} />
          </div>
          <h2>Invitation sent</h2>
          <p>
            {lastRecipient ? `${lastRecipient} has received your invitation.` : "Invitation sent."}
            {" "}They can register for <strong>{programTitle}</strong> using the email button.
          </p>
          <button type="button" className="button button--secondary" onClick={closeSuccess}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}
