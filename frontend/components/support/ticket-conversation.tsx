"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { sendTicketMessage } from "@/actions/support";
import { toast } from "sonner";
import { Loader2, Send, Lock } from "lucide-react";
import { useI18n } from "@/locales/client";

interface TicketConversationProps {
  ticket: SupportTicket;
  isSystemAdmin?: boolean;
  basePath?: string;
}

export function TicketConversation({
  ticket,
  isSystemAdmin = false,
  basePath = "/dashboard",
}: TicketConversationProps) {
  const t = useI18n();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<TicketMessage[]>(
    ticket.messages || []
  );
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: () =>
      sendTicketMessage(ticket.id, token, {
        message: newMessage,
        is_internal: isSystemAdmin && isInternal,
      }),
    onSuccess: (message) => {
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      setIsInternal(false);
      queryClient.invalidateQueries({ queryKey: ["support-ticket", ticket.id] });
      toast.success(t('support.messageSent'));
    },
    onError: (error: Error) => {
      toast.error(t('support.failedSendMessage'), {
        description: error.message,
      });
    },
  });

  function handleSendMessage() {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate();
  }

  function getInitials(email: string) {
    return email.slice(0, 2).toUpperCase();
  }

  return (
    <div className="card">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-black text-gray-900">{t('support.conversation')}</h3>
      </div>
      <div className="p-0">
        <div ref={scrollRef} className="h-[400px] overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-gray-400">
                {t('support.noMessages')}
              </p>
            ) : (
              messages.map((message) => {
                const isCurrentUser =
                  message.sender_email === ticket.created_by_email;
                const isAdmin =
                  message.sender_email !== ticket.created_by_email;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      isCurrentUser ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                        isAdmin ? "bg-indigo-600" : "bg-gray-400"
                      }`}
                    >
                      {getInitials(message.sender_email)}
                    </div>
                    <div
                      className={`max-w-[70%] ${
                        isCurrentUser ? "text-right" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {message.sender_full_name}
                        </span>
                        {message.is_internal && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Lock className="h-3 w-3" />
                            {t('support.internalNote')}
                          </span>
                        )}
                      </div>
                      <div
                        className={`mt-1 rounded-lg p-3 text-sm ${
                          message.is_internal
                            ? "border border-yellow-200 bg-yellow-50"
                            : isCurrentUser
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {message.message}
                      </div>
                      <span className="mt-1 text-xs text-gray-400">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {ticket.status !== "CLOSED" ? (
          <div className="border-t border-gray-100 p-4">
            {isSystemAdmin && (
              <div className="mb-2 flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Lock className="h-4 w-4" />
                  {t('support.internalNoteLabel')}
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                className="input-field flex-1 min-h-[60px] resize-none"
                placeholder={
                  isInternal
                    ? t('support.writeInternalNote')
                    : t('support.typeMessage')
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
                className="btn-primary h-10 w-10 p-0 flex items-center justify-center"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-100 p-4 text-center text-sm text-gray-400">
            {t('support.ticketClosed')}
          </div>
        )}
      </div>
    </div>
  );
}
