"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket } from "@/actions/support";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/locales/client";

interface TicketFormProps {
  basePath?: string;
}

export function TicketForm({ basePath = "/dashboard" }: TicketFormProps) {
  const t = useI18n();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const queryClient = useQueryClient();

  const CATEGORIES = [
    { value: "GENERAL", label: t('support.general') },
    { value: "BUG_REPORT", label: t('support.bugReport') },
    { value: "FEATURE_REQUEST", label: t('support.featureRequest') },
    { value: "ACCOUNT_ISSUE", label: t('support.accountIssue') },
    { value: "PAYMENT_ISSUE", label: t('support.paymentIssue') },
    { value: "VOUCHER_ISSUE", label: t('support.voucherIssue') },
    { value: "HOSPITAL_ISSUE", label: t('support.hospitalIssue') },
    { value: "BENEFICIARY_ISSUE", label: t('support.beneficiaryIssue') },
    { value: "OTHER", label: t('support.other') },
  ];

  const PRIORITIES = [
    { value: "LOW", label: t('support.low') },
    { value: "MEDIUM", label: t('support.medium') },
    { value: "HIGH", label: t('support.high') },
    { value: "URGENT", label: t('support.urgent') },
  ];

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("GENERAL");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: () =>
      createTicket(token, { subject, description, category, priority }),
    onSuccess: (ticket) => {
      toast.success(t('support.ticketCreated'), {
        description: t('support.ticketCreatedDesc', { number: ticket.ticket_number }),
      });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      router.push(`${basePath}/support/${ticket.id}`);
    },
    onError: (error: Error) => {
      toast.error(t('support.failedCreate'), {
        description: error.message,
      });
    },
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (subject.length < 5)
      newErrors.subject = t('support.subjectMinLength');
    if (description.length < 10)
      newErrors.description = t('support.descriptionMinLength');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate();
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-black text-gray-900">
          {t('support.createTicket')}
        </h2>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            {t('support.subjectLabel')}
          </label>
          <input
            className="input-field w-full"
            placeholder={t('support.subjectPlaceholder')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          {errors.subject && (
            <p className="text-xs text-red-500 mt-1">{errors.subject}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {t('support.subjectHint')}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            {t('support.descriptionLabel')}
          </label>
          <textarea
            className="input-field w-full min-h-[120px]"
            placeholder={t('support.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {t('support.descriptionHint')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              {t('support.categoryLabel')}
            </label>
            <select
              className="input-field w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              {t('support.priorityLabel')}
            </label>
            <select
              className="input-field w-full"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="btn-outline"
            onClick={() => router.back()}
          >
            {t('support.cancel')}
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('support.creating')}
              </>
            ) : (
              t('support.createTicket')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
