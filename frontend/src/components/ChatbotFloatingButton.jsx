import { Link } from 'react-router-dom';

export default function ChatbotFloatingButton() {
  return (
    <Link
      to="/chat"
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-5 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(37,99,235,0.35)] transition hover:scale-105"
    >
      <span className="text-lg">🤖</span>
      AI Concierge
    </Link>
  );
}
