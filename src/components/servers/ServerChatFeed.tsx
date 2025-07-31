'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createMessage, getChannelMessages, subscribeToServerMessages, updateMessage, deleteMessage, replyToMessage, likeMessage, unlikeMessage } from '../../lib/server-service';
import { createClient } from '@/src/lib/supabase/client';
import type { ServerChannel, ServerMessage, ServerWithDetails } from '../../types/server';
import { PaperAirplaneIcon, PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import ChatMessage from '../chat/ChatMessage';
import ChatReplyInput from '../chat/ChatReplyInput';
import Avatar from '../ui/Avatar';

interface Props {
  server: ServerWithDetails;
  channel: ServerChannel;
}

export default function ServerChatFeed({ server, channel }: Props) {
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [replyingTo, setReplyingTo] = useState<ServerMessage | null>(null);
  const [messageReplies, setMessageReplies] = useState<Record<string, ServerMessage[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, mounted } = useDarkMode();

  useEffect(() => {
    loadMessages();
    const unsub = subscribeToServerMessages(
      channel.id,
      (msg) => {
        // If message exists, update it; else append and sort
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === msg.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = msg;
            return updated;
          }
          // Add new message and sort chronologically
          const newMessages = [...prev, msg];
          return newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
        // Auto-scroll to bottom when new message arrives
        setTimeout(() => scrollToBottom(), 50);
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

      // Sort messages chronologically (oldest first, newest last)
      const sortedMsgs = msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(sortedMsgs);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleJumpToParent = (parentId: string) => {
    const parentElement = document.getElementById(`message-${parentId}`);
    if (parentElement) {
      parentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Add a brief highlight effect
      parentElement.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
      setTimeout(() => {
        parentElement.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
      }, 2000);
    }
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
      // Add message immediately for instant feedback
      setMessages((prev) => {
        const newMessages = [...prev, created];
        return newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });
      // Auto-scroll when user sends a message
      scrollToBottom();
    }
  };



  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setReplyingTo(message);
    }
  };

  const handleSendReply = async (content: string, parentId: string) => {
    try {
      const reply = await replyToMessage(channel.id, parentId, content);
      setReplyingTo(null);
      
      if (reply) {
        // Add reply immediately for instant feedback
        setMessages((prev) => {
          const newMessages = [...prev, reply];
          return newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  const handleLike = async (messageId: string) => {
    try {
      await likeMessage(messageId);
      // Update local state immediately for better UX
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, like_count: (msg.like_count || 0) + 1, is_liked: true }
          : msg
      ));
    } catch (error) {
      console.error('Failed to like message:', error);
    }
  };

  const handleUnlike = async (messageId: string) => {
    try {
      await unlikeMessage(messageId);
      // Update local state immediately for better UX
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, like_count: Math.max((msg.like_count || 0) - 1, 0), is_liked: false }
          : msg
      ));
    } catch (error) {
      console.error('Failed to unlike message:', error);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const updated = await updateMessage(messageId, newContent);
      if (updated) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? updated : msg
        ));
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const success = await deleteMessage(messageId);
      if (success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
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
          const parentMessage = m.parent_id ? messages.find(msg => msg.id === m.parent_id) : null;
          const replyCount = messages.filter(reply => reply.parent_id === m.id).length;
          
          return (
            <ChatMessage
              key={m.id}
              message={{
                id: m.id,
                content: m.content,
                author: {
                  username: m.author?.username || 'User',
                  avatar_url: m.author?.avatar_url
                },
                created_at: m.created_at,
                updated_at: m.updated_at,
                parent_id: m.parent_id,
                like_count: m.like_count || 0,
                reply_count: replyCount,
                is_liked: m.is_liked || false
              }}
              onReply={handleReply}
              onLike={handleLike}
              onUnlike={handleUnlike}
              onJumpToParent={handleJumpToParent}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              currentUserId={userId || undefined}
              isReply={!!m.parent_id}
              parentMessage={parentMessage ? {
                id: parentMessage.id,
                content: parentMessage.content,
                author: {
                  username: parentMessage.author?.username || 'User'
                }
              } : undefined}
            />
          );
        })
        )}
      </div>

      {/* Reply Input */}
      <ChatReplyInput
        replyingTo={replyingTo ? {
          id: replyingTo.id,
          content: replyingTo.content,
          author: {
            username: replyingTo.author?.username || 'User'
          }
        } : null}
        onSendReply={handleSendReply}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className={`flex-1 p-2 text-sm rounded-md border bg-transparent text-foreground placeholder:text-muted-foreground ${
              isDarkMode ? 'border-slate-700/40' : 'border-border/40'
            }`}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 