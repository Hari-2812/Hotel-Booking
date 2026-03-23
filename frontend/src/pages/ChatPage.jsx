import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";

export default function ChatPage() {
  const conversationId = "support";
  const [messages, setMessages] = useState([]);
  const [limit] = useState(50);
  const [page] = useState(1);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function fetchMessages() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/chat/messages", {
        params: { conversationId, page, limit },
      });
      setMessages(res.data.messages || []);
    } catch (e) {
      setError(e.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    if (!text.trim()) return;
    const payload = { conversationId, message: text.trim() };
    setText("");
    try {
      await api.post("/api/chat/messages", payload);
      toast.success("Message sent");
      await fetchMessages();
    } catch (e) {
      toast.error(e.message || "Send failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h1 className="text-xl font-bold text-indigo-700">Support Chat</h1>
        <div className="mt-1 text-sm text-gray-600">Basic chat support with stored messages.</div>
      </div>

      {error && <div className="card p-4 text-sm text-red-700">{error}</div>}

      <div className="card p-4">
        {loading ? (
          <div className="text-sm text-gray-600">Loading messages...</div>
        ) : (
          <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto">
            {messages.map((m) => (
              <div key={m._id} className={`rounded-lg border p-3 text-sm ${m.fromRole === "admin" ? "bg-indigo-50" : "bg-white"}`}>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="font-semibold">{m.fromRole === "admin" ? "Admin" : m.fromUserId?.email}</div>
                  <div>{new Date(m.createdAt).toLocaleTimeString()}</div>
                </div>
                <div className="mt-2 text-gray-800">{m.message}</div>
              </div>
            ))}
            {messages.length === 0 && <div className="text-sm text-gray-600">No messages yet.</div>}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input flex-1"
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            onClick={send}
            className="btn-primary px-4 py-2"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

