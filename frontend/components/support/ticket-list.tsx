"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import { Search, Plus } from "lucide-react";
import { useI18n } from "@/locales/client";

interface TicketListProps {
  tickets: SupportTicket[];
  showCreateButton?: boolean;
  basePath?: string;
  showCreatedBy?: boolean;
}

export function TicketList({
  tickets,
  showCreateButton = false,
  basePath = "/dashboard",
  showCreatedBy = true,
}: TicketListProps) {
  const t = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder={t('support.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('support.allStatus')}</option>
            <option value="OPEN">{t('support.open')}</option>
            <option value="IN_PROGRESS">{t('support.inProgress')}</option>
            <option value="WAITING_FOR_USER">{t('support.waiting')}</option>
            <option value="RESOLVED">{t('support.resolved')}</option>
            <option value="CLOSED">{t('support.closed')}</option>
          </select>
          <select
            className="input-field w-auto"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">{t('support.allCategories')}</option>
            <option value="GENERAL">{t('support.general')}</option>
            <option value="BUG_REPORT">{t('support.bugReport')}</option>
            <option value="FEATURE_REQUEST">{t('support.featureRequest')}</option>
            <option value="ACCOUNT_ISSUE">{t('support.accountIssue')}</option>
            <option value="PAYMENT_ISSUE">{t('support.paymentIssue')}</option>
            <option value="VOUCHER_ISSUE">{t('support.voucherIssue')}</option>
            <option value="HOSPITAL_ISSUE">{t('support.hospitalIssue')}</option>
            <option value="BENEFICIARY_ISSUE">{t('support.beneficiaryIssue')}</option>
            <option value="OTHER">{t('support.other')}</option>
          </select>
        </div>
        {showCreateButton && (
          <Link href={`${basePath}/support/new`}>
            <button className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              {t('support.newTicket')}
            </button>
          </Link>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  t('support.ticketNumber'),
                  t('support.subject'),
                  t('support.category'),
                  t('support.priority'),
                  t('support.status'),
                  ...(showCreatedBy ? [t('support.createdBy')] : []),
                  t('support.assignedTo'),
                  t('support.created'),
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={showCreatedBy ? 8 : 7}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    {t('support.noTicketsFound')}
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <Link
                        href={`${basePath}/support/${ticket.id}`}
                        className="font-mono text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {ticket.ticket_number}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-900 max-w-[300px] truncate">
                      {ticket.subject}
                    </td>
                    <td className="p-4 text-xs font-medium text-gray-700">
                      {ticket.category}
                    </td>
                    <td className="p-4">
                      <TicketPriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="p-4">
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    {showCreatedBy && (
                      <td className="p-4 text-gray-700">
                        {ticket.created_by_full_name}
                      </td>
                    )}
                    <td className="p-4 text-gray-700">
                      {ticket.assigned_to_full_name || (
                        <span className="text-gray-400">{t('support.unassigned')}</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
