"use client";

import { useEffect, useState, useCallback } from "react";
import { Smartphone, Monitor, Tablet, ShieldCheck, ShieldX, Trash2, RefreshCw, Loader2, Laptop, AlertTriangle } from "lucide-react";
import { getDevices, blockDevice, unblockDevice, trustDevice, removeDevice, type Device } from "@/actions/devices";
import { toast } from "sonner";

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Desktop: <Monitor size={18} />,
  Mobile: <Smartphone size={18} />,
  Tablet: <Tablet size={18} />,
};

function DeviceIcon({ type }: { type: string }) {
  return DEVICE_ICONS[type] || <Laptop size={18} />;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function DevicesSection() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDevices();
      setDevices(data);
    } catch {
      toast.error("Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleBlock = async (device: Device) => {
    setActionId(device.id);
    try {
      const updated = await blockDevice(device.id);
      setDevices((prev) => prev.map((d) => (d.id === device.id ? updated : d)));
      toast.success("Device blocked");
    } catch {
      toast.error("Failed to block device");
    } finally {
      setActionId(null);
    }
  };

  const handleUnblock = async (device: Device) => {
    setActionId(device.id);
    try {
      const updated = await unblockDevice(device.id);
      setDevices((prev) => prev.map((d) => (d.id === device.id ? updated : d)));
      toast.success("Device unblocked");
    } catch {
      toast.error("Failed to unblock device");
    } finally {
      setActionId(null);
    }
  };

  const handleTrust = async (device: Device) => {
    setActionId(device.id);
    try {
      const updated = await trustDevice(device.id);
      setDevices((prev) => prev.map((d) => (d.id === device.id ? updated : d)));
      toast.success("Device trusted");
    } catch {
      toast.error("Failed to trust device");
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (deviceId: string) => {
    setActionId(deviceId);
    try {
      await removeDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      toast.success("Device removed");
      setConfirmRemoveId(null);
    } catch {
      toast.error("Failed to remove device");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Security & Devices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage devices that have access to your account</p>
        </div>
        <button
          onClick={fetchDevices}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin text-gray-300" />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Smartphone size={36} className="mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-sm">No devices found</p>
          <p className="text-xs mt-1">Devices will appear here after you log in.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`bg-white rounded-xl border p-4 transition-all ${
                device.is_current
                  ? "border-blue-200 ring-1 ring-blue-100"
                  : device.is_blocked
                    ? "border-red-200 bg-red-50/30"
                    : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    device.is_current
                      ? "bg-blue-100 text-blue-600"
                      : device.is_blocked
                        ? "bg-red-100 text-red-500"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <DeviceIcon type={device.device_type} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">
                      {device.device_name || "Unknown device"}
                    </span>
                    {device.is_current && (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                    {device.is_blocked && (
                      <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                        Blocked
                      </span>
                    )}
                    {device.is_trusted && !device.is_blocked && (
                      <span className="text-[10px] font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                        Trusted
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {device.os} &middot; {device.browser}
                    {device.ip_address && <> &middot; <span className="font-mono">{device.ip_address}</span></>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last active: {timeAgo(device.last_active)}
                    {device.created_at && <> &middot; First seen: {new Date(device.created_at).toLocaleDateString()}</>}
                  </p>
                </div>

                {/* Actions */}
                {!device.is_current && (
                  <div className="flex items-center gap-1 shrink-0">
                    {device.is_blocked ? (
                      <button
                        onClick={() => handleUnblock(device)}
                        disabled={actionId === device.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition disabled:opacity-50"
                        title="Unblock device"
                      >
                        {actionId === device.id ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlock(device)}
                        disabled={actionId === device.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        title="Block device"
                      >
                        {actionId === device.id ? <Loader2 size={15} className="animate-spin" /> : <ShieldX size={15} />}
                      </button>
                    )}
                    {!device.is_blocked && (
                      <button
                        onClick={() => handleTrust(device)}
                        disabled={actionId === device.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition disabled:opacity-50"
                        title="Trust device"
                      >
                        <ShieldCheck size={15} />
                      </button>
                    )}
                    {confirmRemoveId === device.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemove(device.id)}
                          disabled={actionId === device.id}
                          className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition disabled:opacity-50"
                        >
                          {actionId === device.id ? <Loader2 size={13} className="animate-spin" /> : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(device.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Remove device"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 text-xs">Why manage devices?</p>
          <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
            If you notice a device you don&apos;t recognize, block it immediately. This will prevent
            that device from accessing your account. Blocked devices are signed out automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
