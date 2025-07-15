'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createMessage, getChannelMessages, subscribeToServerMessages, updateMessage, deleteMessage } from '../../lib/server-service';
import { createClient } from '@/src/lib/supabase/client';
import type { ServerChannel, ServerMessage, ServerWithDetails } from '../../types/server';
import { PaperAirplaneIcon, PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';

interface Props {
  server: ServerWithDetails;
  channel: ServerChannel;
}

export default function ServerChatFeed({ server, channel }: Props) {
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, mounted } = useDarkMode();

  useEffect(() => {
    loadMessages();
    const unsub = subscribeToServerMessages(
      channel.id,
      (msg) => {
        // If message exists, update it; else append
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === msg.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = msg;
            return updated;
          }
          return [...prev, msg];
        });
        scrollToBottom();
      },
      (deletedId) => {
        setMessages((prev) => prev.filter((m) => m.id !== deletedId));
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  // Fetch current user id once
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await getChannelMessages(channel.id, 100);
      setMessages(msgs.reverse());
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const created = await createMessage({
      server_id: server.id,
      channel_id: channel.id,
      content: newMessage.trim(),
    });
    if (created) {
      setNewMessage('');
      setMessages(prev=>[...prev,created]);
    }
  };

  const handleEditStart = (msg: ServerMessage) => {
    setEditingId(msg.id);
    setEditingContent(msg.content);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const handleEditSave = async () => {
    if (!editingContent.trim() || !editingId) return;
    const updated = await updateMessage(editingId, editingContent.trim());
    if (updated) {
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      handleEditCancel();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    const ok = await deleteMessage(id);
    if (ok) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : (
          messages.map((m) => {
            const isOwn = m.author_id === userId;
            const isEditing = editingId === m.id;
            return (
              <div key={m.id} className="group flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                  {m.author?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground flex items-center gap-2">
                    <span className="font-medium mr-2 truncate">{m.author?.username || 'User'}</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(m.created_at)}{' '}
                      {m.updated_at && m.updated_at !== m.created_at && <em className="opacity-60">(edited)</em>}
                    </span>
                  </div>
                  {isEditing ? (
                    <div className="mt-1">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={2}
                        className={`w-full bg-transparent border rounded-md p-2 text-sm text-foreground ${
                isDarkMode ? 'border-slate-700/40' : 'border-border/40'
              }`}
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={handleEditSave}
                          className="p-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/80"
                          title="Save"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="p-1 bg-muted text-foreground rounded-md hover:bg-muted/80"
                          title="Cancel"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words text-foreground text-sm">
                      {m.content}
                    </div>
                  )}
                </div>
                {isOwn && !isEditing && (
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditStart(m)}
                      className="p-1 hover:bg-accent/40 rounded-md"
                      title="Edit message"
                    >
                      <PencilSquareIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1 hover:bg-accent/40 rounded-md"
                      title="Delete message"
                    >
                      <TrashIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* input */}
      <div className={`p-3 border-t flex items-center gap-3 ${
        isDarkMode ? 'border-slate-700/30' : 'border-border/30'
      }`}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Send a message to #${channel.name}`}
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition">
          <PaperAirplaneIcon className="w-5 h-5 rotate-90" />
        </button>
      </div>
    </div>
  );
} 