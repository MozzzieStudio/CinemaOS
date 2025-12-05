import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello, I am the Showrunner. How can I help you with your script today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await invoke<string>("chat_with_agent", {
        agentName: "showrunner",
        message: input,
        context: null, // TODO: Pass script context
      });

      const assistantMsg: Message = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Failed to chat with agent:", error);
      const errorMsg: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error connecting to the Vault.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 h-full bg-[#111] border-l border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/10 bg-[#1a1a1a]">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          The Virtual Crew
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-400">Showrunner Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm ${
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-br-none"
                  : "bg-[#2a2a2a] text-gray-200 rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#2a2a2a] p-3 rounded-lg rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-[#1a1a1a]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask the Showrunner..."
            className="flex-1 bg-[#111] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-md disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
