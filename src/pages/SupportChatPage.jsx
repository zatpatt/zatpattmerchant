import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Send,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import {
  getSupportChatList,
  sendSupportMessage,
} from "../services/supportchat";

export default function SupportChatPage() {
  const navigate = useNavigate();

  const [messages, setMessages] =
    useState([]);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const bottomRef = useRef(null);

  const fetchChats = async () => {
    try {
      setLoading(true);

      const res =
        await getSupportChatList();

      if (res?.status) {
        setMessages(
          res?.data || []
        );
      }
    } catch (error) {
      console.log(error);

      toast.error(
        "Failed to load chat"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
  const interval =
    setInterval(() => {
      fetchChats();
    }, 90000);

  return () =>
    clearInterval(interval);
}, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      setSending(true);

      const res =
        await sendSupportMessage({
          chat_room_id: 1,
          message: message.trim(),
        });

      if (res?.status) {
        setMessage("");

        await fetchChats();
      } else {
        toast.error(
          res?.message ||
            "Failed to send message"
        );
      }
    } catch (error) {
      console.log(error);

      toast.error(
        "Unable to send message"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}

      <div
        className="
          bg-white
          shadow
          px-4
          py-4
          flex
          items-center
          gap-3
        "
      >
        <button
          onClick={() =>
            navigate(-1)
          }
        >
          <ArrowLeft size={22} />
        </button>

        <h1 className="font-semibold text-lg">
          Support Chat
        </h1>
      </div>

      {/* Messages */}

      <div
        className="
          flex-1
          overflow-y-auto
          p-4
          space-y-3
        "
      >
        {loading ? (
          <div className="text-center text-gray-500">
            Loading...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">
            No messages yet
          </div>
        ) : (
          messages.map(
            (msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.identity ===
                  "self"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`
                    max-w-[80%]
                    px-4
                    py-2
                    rounded-2xl
                    break-words
                    ${
                      msg.identity ===
                      "self"
                        ? "bg-orange-500 text-white"
                        : "bg-white border"
                    }
                  `}
                >
                  {msg.message}
                </div>
              </div>
            )
          )
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}

      <div
        className="
          bg-white
          border-t
          p-3
          flex
          gap-2
        "
      >
        <input
          type="text"
          value={message}
          onChange={(e) =>
            setMessage(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter"
            ) {
              handleSend();
            }
          }}
          placeholder="Type message..."
          className="
            flex-1
            border
            rounded-xl
            px-4
            py-2
            outline-none
          "
        />

        <button
          onClick={handleSend}
          disabled={sending}
          className="
            bg-orange-500
            text-white
            px-4
            rounded-xl
            flex
            items-center
            justify-center
          "
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}