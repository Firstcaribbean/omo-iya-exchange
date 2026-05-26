"use client";

import { FormEvent, useState } from "react";
import { apiConfigured, apiRequest } from "../lib/api";
import { currentUser, loadState, saveState } from "../lib/store";

const emptyForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus("");

    if (apiConfigured()) {
      const response = await apiRequest("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: form.subject,
          description: `${form.message}\n\nContact: ${form.name} <${form.email}>`,
        }),
      });

      if (response.ok) {
        setStatus("Message sent. Support will reply from your dashboard.");
        setForm(emptyForm);
        setSending(false);
        return;
      }
    }

    const state = loadState();
    const user = currentUser(state);
    state.tickets.unshift({
      id: `CHAT-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user?.id || `guest-${form.email.toLowerCase() || "visitor"}`,
      subject: form.subject,
      message: `${form.message}\n\nContact: ${form.name} <${form.email}>`,
      status: "OPEN",
    });
    saveState(state);
    setStatus("Message saved. We will follow up through the contact details provided.");
    setForm(emptyForm);
    setSending(false);
  }

  return (
    <div className="chatWidget" data-open={open}>
      {open ? (
        <section className="chatPanel" aria-label="Live support chat">
          <div className="chatHeader">
            <div>
              <strong>Live Chat</strong>
              <span>Ask about regions, inventory, or custom services.</span>
            </div>
            <button aria-label="Close chat" onClick={() => setOpen(false)} type="button">
              ×
            </button>
          </div>
          <form className="chatForm" onSubmit={submit}>
            <label>
              Name
              <input required value={form.name} onChange={(event) => update("name", event.target.value)} />
            </label>
            <label>
              Email
              <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
            </label>
            <label>
              Subject
              <input required value={form.subject} onChange={(event) => update("subject", event.target.value)} />
            </label>
            <label>
              Message
              <textarea required value={form.message} onChange={(event) => update("message", event.target.value)} />
            </label>
            <button disabled={sending} type="submit">
              {sending ? "Sending..." : "Send message"}
            </button>
            {status ? <p>{status}</p> : null}
          </form>
        </section>
      ) : null}
      <button className="chatLauncher" onClick={() => setOpen((current) => !current)} type="button">
        Live Chat
      </button>
    </div>
  );
}
