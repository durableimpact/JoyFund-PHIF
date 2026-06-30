"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import { TicketConversation } from "./ticket-conversation";
import { assignTicket, changeTicketStatus, closeTicket, listSystemAdmins } from "@/actions/support";
import { toast } from "sonner";
import { Loader2, UserPlus, XCircle, CheckCircle, X } from "lucide-react";

interface TicketDetailProps {
  ticket: SupportTicket;
  isSystemAdmin?: boolean;
  basePath?: string;
}

export function TicketDetail({
  ticket,
  isSystemAdmin = false,
  basePath = "/dashboard",
}: TicketDetailProps) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const queryClient = useQueryClient();

  const [currentTicket, setCurrentTicket] = useState(ticket);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: admins = [] } = useQuery({
    queryKey: ["system-admins", token],
    queryFn: () => listSystemAdmins(token),
    enabled: !!token && showAssignDialog,
  });

  const assignMutation = useMutation({
    mutationFn: () => assignTicket(currentTicket.id, token, { assigned_to: selectedAdmin }),
    onSuccess: (updatedTicket) => {
      setCurrentTicket(updatedTicket);
      setShowAssignDialog(false);
      setSelectedAdmin("");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket assigned successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to assign ticket", { description: error.message });
    },
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      changeTicketStatus(currentTicket.id, token, {
        status: newStatus,
        resolution_notes: resolutionNotes,
      }),
    onSuccess: (updatedTicket) => {
      setCurrentTicket(updatedTicket);
      setShowStatusDialog(false);
      setResolutionNotes("");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-ticket", currentTicket.id] });
      toast.success("Status updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update status", { description: error.message });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      closeTicket(currentTicket.id, token, { resolution_notes: resolutionNotes }),
    onSuccess: (updatedTicket) => {
      setCurrentTicket(updatedTicket);
      setShowCloseDialog(false);
      setResolutionNotes("");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-ticket", currentTicket.id] });
      toast.success("Ticket closed successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to close ticket", { description: error.message });
    },
  });

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TicketConversation
            ticket={currentTicket}
            isSystemAdmin={isSystemAdmin}
            basePath={basePath}
          />
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900">Ticket Details</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Ticket Number
                </p>
                <p className="font-mono text-sm">
                  {currentTicket.ticket_number}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Subject
                </p>
                <p className="text-sm">{currentTicket.subject}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Description
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {currentTicket.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Status
                  </p>
                  <div className="mt-1">
                    <TicketStatusBadge status={currentTicket.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Priority
                  </p>
                  <div className="mt-1">
                    <TicketPriorityBadge priority={currentTicket.priority} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Category
                </p>
                <p className="text-sm">{currentTicket.category}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Created By
                </p>
                <p className="text-sm">
                  {currentTicket.created_by_full_name}
                </p>
                <p className="text-xs text-gray-400">
                  {currentTicket.created_by_email}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Assigned To
                </p>
                <p className="text-sm">
                  {currentTicket.assigned_to_full_name || (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Created
                </p>
                <p className="text-sm">
                  {format(new Date(currentTicket.created_at), "PPpp")}
                </p>
              </div>
              {currentTicket.resolved_at && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Resolved
                  </p>
                  <p className="text-sm">
                    {format(new Date(currentTicket.resolved_at), "PPpp")}
                  </p>
                </div>
              )}
              {currentTicket.closed_at && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Closed
                  </p>
                  <p className="text-sm">
                    {format(new Date(currentTicket.closed_at), "PPpp")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {isSystemAdmin && currentTicket.status !== "CLOSED" && (
            <div className="card">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-black text-gray-900">Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <button
                  onClick={() => setShowAssignDialog(true)}
                  className="btn-outline w-full justify-start flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  Assign Ticket
                </button>
                <button
                  onClick={() => setShowStatusDialog(true)}
                  className="btn-outline w-full justify-start flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Change Status
                </button>
                <button
                  onClick={() => setShowCloseDialog(true)}
                  className="btn-outline w-full justify-start flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle size={16} />
                  Close Ticket
                </button>
              </div>
            </div>
          )}

          {currentTicket.resolution_notes && (
            <div className="card">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-black text-gray-900">Resolution Notes</h3>
              </div>
              <div className="p-4">
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {currentTicket.resolution_notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Dialog */}
      {showAssignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">
                Assign Ticket
              </h2>
              <button onClick={() => setShowAssignDialog(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Assign to Admin *
                </label>
                <select
                  className="input-field w-full"
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                >
                  <option value="">— Select admin —</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.first_name && admin.last_name
                        ? `${admin.first_name} ${admin.last_name}`
                        : admin.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAssignDialog(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => assignMutation.mutate()}
                  disabled={assignMutation.isPending || !selectedAdmin}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {assignMutation.isPending && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Dialog */}
      {showStatusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">
                Change Status
              </h2>
              <button onClick={() => setShowStatusDialog(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  New Status
                </label>
                <select
                  className="input-field w-full"
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as TicketStatus)
                  }
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_FOR_USER">Waiting for User</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Resolution Notes
                </label>
                <textarea
                  className="input-field w-full min-h-[80px]"
                  placeholder="Optional notes..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowStatusDialog(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => statusMutation.mutate()}
                  disabled={statusMutation.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {statusMutation.isPending && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">
                Close Ticket
              </h2>
              <button onClick={() => setShowCloseDialog(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to close this ticket? This action cannot
                be undone.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Resolution Notes
                </label>
                <textarea
                  className="input-field w-full min-h-[80px]"
                  placeholder="Optional resolution notes..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCloseDialog(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => closeMutation.mutate()}
                  disabled={closeMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  {closeMutation.isPending && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Close Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
