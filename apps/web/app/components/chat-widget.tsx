"use client";

import { FormEvent, useMemo, useState } from "react";
import { generateAiReply, shouldEscalateToAgent } from "../lib/ai-chat";
import { apiConfigured, apiRequest } from "../lib/api";
import { currentUser, loadState, saveState, type TicketMessage } from "../lib/store";

type ChatMessage = Pick<TicketMessage, "sender" | "text" | "createdAt">;

const firstMessage: ChatMessage = {
  sender: "AI",
  text: "Hi. I can help with service availability, region support, pricing, OTP handoff, and fulfillment. Ask me anything or request a real agent.",
  createdAt: new Date().toISOString(),
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([firstMessage]);
  const [input, setInput] = useState("");
  const [contact, setContact] = useState({ name: "", email: "" });
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const needsContact = useMemo(() => {
    const state = typeof window === "undefined" ? null : loadState();
    return !state || !currentUser(state);
  }, [open, messages.length]);

  function updateContact(field: keyof typeof contact, value: string) {
    setContact((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    setSending(true);
    setStatus("");

    const customerMessage: ChatMessage = {
      sender: "CUSTOMER",
      text,
      createdAt: new Date().toISOString(),
    };
    const aiMessage: ChatMessage = {
      sender: "AI",
      text: generateAiReply(text),
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, customerMessage, aiMessage];
    setMessages(nextMessages);
    setInput("");

    if (shouldEscalateToAgent(text)) {
      await escalate(nextMessages, "Customer requested a real agent");
    }

    setSending(false);
  }

  async function escalate(thread: ChatMessage[] = messages, subject = "Live chat support request") {
    const state = loadState();
    const user = currentUser(state);
    const contactName = user ? `${user.firstName} ${user.lastName}` : contact.name;
    const contactEmail = user?.email || contact.email;

    if (!contactEmail) {
      setStatus("Add your email so an agent can reply.");
      return;
    }

    const transcript = thread.map((message) => `${message.sender}: ${message.text}`).join("\n");

    if (apiConfigured()) {
      await apiRequest("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject,
          description: `${transcript}\n\nContact: ${contactName} <${contactEmail}>`,
        }),
      });
    }

    state.tickets.unshift({
      id: `CHAT-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user?.id || `guest-${contactEmail.toLowerCase()}`,
      subject,
      message: transcript,
      status: "OPEN",
      channel: "CHAT",
      assignedToAgent: true,
      contactName,
      contactEmail,
      messages: thread.map((message, index) => ({
        id: `MSG-${Date.now()}-${index}`,
        sender: message.sender,
        text: message.text,
        createdAt: message.createdAt,
      })),
    });
    saveState(state);
    setStatus("Agent requested. Admin support can now reply from the admin page.");
  }

  return (
    <div className="chatWidget" data-open={open}>
      {open ? (
        <section className="chatPanel" aria-label="Live AI support chat">
          <div className="chatHeader">
            <div>
              <strong>AI Live Chat</strong>
              <span>Instant replies. Ask for an agent when needed.</span>
            </div>
            <button aria-label="Close chat" onClick={() => setOpen(false)} type="button">
              x
            </button>
          </div>

          <div className="chatMessages">
            {messages.map((message, index) => (
              <div className="chatBubble" data-sender={message.sender} key={`${message.createdAt}-${index}`}>
                <span>{message.sender === "AI" ? "AI Assistant" : "You"}</span>
                <p>{message.text}</p>
              </div>
            ))}
          </div>

          <form className="chatForm" onSubmit={submit}>
            {needsContact ? (
              <div className="chatContactGrid">
                <label>
                  Name
                  <input value={contact.name} onChange={(event) => updateContact("name", event.target.value)} />
                </label>
                <label>
                  Email
                  <input type="email" value={contact.email} onChange={(event) => updateContact("email", event.target.value)} />
                </label>
              </div>
            ) : null}
            <label>
              Message
              <textarea required value={input} onChange={(event) => setInput(event.target.value)} />
            </label>
            <div className="chatActions">
              <button disabled={sending} type="submit">
                {sending ? "Sending..." : "Send"}
              </button>
              <button className="chatSecondary" onClick={() => escalate()} type="button">
                Talk to agent
              </button>
            </div>
            {status ? <p>{status}</p> : null}
          </form>
        </section>
      ) : null}
      <button className="chatLauncher" onClick={() => setOpen((current) => !current)} type="button">
        AI Live Chat
      </button>
    </div>
  );
}
