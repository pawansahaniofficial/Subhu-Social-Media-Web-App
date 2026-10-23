import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, User } from '../types/index.js';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';
import {
  X,
  Send,
  Phone,
  Video,
  Paperclip,
  Check,
  CheckCheck,
  Circle,
} from 'lucide-react';

interface ChatModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  initialRecipient?: User | null;
  onStartCall: (user: User, type: 'audio' | 'video') => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  initialRecipient,
  onStartCall,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const loadConversations = async () => {
      try {
        const res = await api.getConversations();
        setConversations(res.conversations);

        if (initialRecipient) {
          // Find or create
          const existing = res.conversations.find((c) =>
            c.memberIds.includes(initialRecipient.id)
          );
          if (existing) {
            setActiveConv(existing);
          } else {
            const created = await api.createConversation(initialRecipient.id);
            setActiveConv(created.conversation);
          }
        } else if (res.conversations.length > 0 && !activeConv) {
          setActiveConv(res.conversations[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadConversations();
  }, [isOpen, currentUser, initialRecipient]);

  // Load messages when activeConv changes
  useEffect(() => {
    if (!activeConv || !currentUser) return;

    const loadMessages = async () => {
      try {
        const res = await api.getMessages(activeConv.id);
        setMessages(res.messages);
      } catch (e) {
        console.error(e);
      }
    };

    loadMessages();
  }, [activeConv, currentUser]);

  // WebSocket message listener
  useEffect(() => {
    if (!isOpen) return;

    const unsubMsg = wsClient.on('new_message', (payload) => {
      if (activeConv && payload.conversationId === activeConv.id) {
        setMessages((prev) => [...prev, payload.message]);
      }
    });

    const unsubTyping = wsClient.on('typing_update', (payload) => {
      if (activeConv && payload.conversationId === activeConv.id) {
        setOtherUserTyping(payload.isTyping);
      }
    });

    return () => {
      unsubMsg();
      unsubTyping();
    };
  }, [isOpen, activeConv]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  if (!isOpen || !currentUser) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const content = inputText.trim();
    setInputText('');

    // Send via API or WebSocket
    try {
      wsClient.send({
        type: 'chat_message',
        conversationId: activeConv.id,
        content,
      });

      // Optimistic update
      const tempMsg: Message = {
        id: `msg_temp_${Date.now()}`,
        conversationId: activeConv.id,
        senderId: currentUser.id,
        sender: currentUser,
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMsg]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeConv) return;

    if (!isTyping) {
      setIsTyping(true);
      wsClient.send({
        type: 'typing_indicator',
        conversationId: activeConv.id,
        isTyping: true,
      });
      setTimeout(() => {
        setIsTyping(false);
        wsClient.send({
          type: 'typing_indicator',
          conversationId: activeConv.id,
          isTyping: false,
        });
      }, 2000);
    }
  };

  const otherMember = activeConv?.otherMember;

  return (
    <div className="fixed bottom-0 right-4 sm:right-8 w-full max-w-sm sm:max-w-md h-[520px] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
      {/* Chat Window Header */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {otherMember ? (
            <>
              <div className="relative shrink-0">
                <img
                  src={otherMember.avatar}
                  alt={otherMember.fullName}
                  className="w-9 h-9 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {otherMember.fullName}
                </h4>
                <span className="text-[10px] text-slate-400">
                  {otherUserTyping ? 'typing...' : 'Active on Subhu'}
                </span>
              </div>
            </>
          ) : (
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Messages</h4>
          )}
        </div>

        <div className="flex items-center gap-1">
          {otherMember && (
            <>
              <button
                onClick={() => onStartCall(otherMember, 'audio')}
                title="Voice Call"
                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStartCall(otherMember, 'video')}
                title="Video Call"
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-slate-50/50 dark:bg-slate-950/40">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs break-words leading-relaxed ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60 shadow-xs'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        {otherUserTyping && (
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] italic py-1">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce [animation-delay:0.2s]">●</span>
            <span className="animate-bounce [animation-delay:0.4s]">●</span>
            <span>{otherMember?.fullName.split(' ')[0]} is typing</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
