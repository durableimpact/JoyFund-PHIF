"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import { Search, Plus } from "lucide-react";

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
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_USER">Waiting</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            className="input-field w-auto"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="GENERAL">General</option>
            <option value="BUG_REPORT">Bug Report</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
            <option value="ACCOUNT_ISSUE">Account Issue</option>
            <option value="PAYMENT_ISSUE">Payment Issue</option>
            <option value="VOUCHER_ISSUE">Voucher Issue</option>
            <option value="HOSPITAL_ISSUE">Hospital Issue</option>
            <option value="BENEFICIARY_ISSUE">Beneficiary Issue</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        {showCreateButton && (
          <Link href={`${basePath}/support/new`}>
            <button className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              New Ticket
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
                  "Ticket #",
                  "Subject",
                  "Category",
                  "Priority",
                  "Status",
                  ...(showCreatedBy ? ["Created By"] : []),
                  "Assigned To",
                  "Created",
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
                    No tickets found.
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
                        <span className="text-gray-400">Unassigned</span>
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
