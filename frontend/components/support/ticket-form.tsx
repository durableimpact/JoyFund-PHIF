"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket } from "@/actions/support";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TicketFormProps {
  basePath?: string;
}

const CATEGORIES = [
  { value: "GENERAL", label: "General Inquiry" },
  { value: "BUG_REPORT", label: "Bug Report" },
  { value: "FEATURE_REQUEST", label: "Feature Request" },
  { value: "ACCOUNT_ISSUE", label: "Account Issue" },
  { value: "PAYMENT_ISSUE", label: "Payment Issue" },
  { value: "VOUCHER_ISSUE", label: "Voucher Issue" },
  { value: "HOSPITAL_ISSUE", label: "Hospital Issue" },
  { value: "BENEFICIARY_ISSUE", label: "Beneficiary Issue" },
  { value: "OTHER", label: "Other" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function TicketForm({ basePath = "/dashboard" }: TicketFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("GENERAL");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: () =>
      createTicket(token, { subject, description, category, priority }),
    onSuccess: (ticket) => {
      toast.success("Ticket created successfully", {
        description: `Ticket ${ticket.ticket_number} has been created.`,
      });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      router.push(`${basePath}/support/${ticket.id}`);
    },
    onError: (error: Error) => {
      toast.error("Failed to create ticket", {
        description: error.message,
      });
    },
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (subject.length < 5)
      newErrors.subject = "Subject must be at least 5 characters";
    if (description.length < 10)
      newErrors.description = "Description must be at least 10 characters";
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
          Create Support Ticket
        </h2>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            Subject *
          </label>
          <input
            className="input-field w-full"
            placeholder="Brief description of your issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          {errors.subject && (
            <p className="text-xs text-red-500 mt-1">{errors.subject}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            A short summary of your issue or request.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            Description *
          </label>
          <textarea
            className="input-field w-full min-h-[120px]"
            placeholder="Please describe your issue in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Provide as much detail as possible to help us resolve your issue
            quickly.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Category
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
              Priority
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
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              "Create Ticket"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
