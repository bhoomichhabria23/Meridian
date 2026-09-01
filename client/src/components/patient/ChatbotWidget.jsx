import React, {
  useState,
  useRef,
  useEffect,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Send,
  MessageCircle,
  X,
} from "lucide-react";

const ChatbotWidget = ({
  patientId,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] =
    useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] =
    useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const fetchChatHistory =
    async () => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );
        const response =
          await axios.get(
            `/api/assistant/history?patientId=${patientId || ""}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        if (
          response.data.data &&
          response.data.data.messages
        ) {
          setMessages(
            response.data.data.messages
          );
        }
      } catch (error) {
        console.error(
          "Error fetching history:",
          error
        );
      }
    };

  const handleSendMessage =
    async (messageText = input) => {
      if (!messageText.trim()) {
        return;
      }

      const userMessage = {
        role: "user",
        content: messageText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [
        ...prev,
        userMessage,
      ]);
      setInput("");
      setLoading(true);

      try {
        const token =
          localStorage.getItem("token");
        const response =
          await axios.post(
            "/api/assistant/chat",
            {
              message: messageText,
              patientId:
                patientId || null,
              useContext: true,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        if (response.data.success) {
          const aiMessage = {
            role: "assistant",
            content:
              response.data.data.message,
            category: response.data.data.category,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [
            ...prev,
            aiMessage,
          ]);
        }
      } catch (error) {
        console.error(
          "Error sending message:",
          error
        );
        toast.error(
          error.response?.data?.message ||
            "Failed to send message"
        );
      } finally {
        setLoading(false);
      }
    };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MessageCircle size={20} />
          <h3 className="font-bold">
            Medical Assistant
          </h3>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 p-1 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <MessageCircle size={28} className="mx-auto mb-3 text-indigo-500" />
            <p className="font-medium">Ask anything about your care or workflow.</p>
            <p className="mt-2 text-sm text-gray-500">Your answer is based on the information available to your role.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm">
                  {msg.content}
                </p>
                {msg.role === "assistant" && msg.category && (
                  <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    {msg.category.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <p className="text-sm animate-pulse">
                Thinking...
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyPress={(e) => {
              if (
                e.key === "Enter" &&
                !loading
              ) {
                handleSendMessage();
              }
            }}
            placeholder="Ask me anything..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() =>
              handleSendMessage()
            }
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition flex items-center space-x-2"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotWidget;
