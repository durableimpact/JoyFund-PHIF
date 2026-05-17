"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api";
import { useStore } from "@/store/useStore";
import Navbar from "@/components/shared/Navbar";

const ROLE_ENDPOINT: Record<string, string> = {
  hospital_admin: "/api/accounts/hospital-admins/",
  social_worker: "/api/accounts/social-workers/",
  receptionist: "/api/accounts/receptionists/",
  donor: "/api/accounts/donors/register/",
};

export default function AdminCreateUserPage() {
  const router = useRouter();
  const { showToast } = useStore();

  const [role, setRole] = useState<string>("hospital_admin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = ROLE_ENDPOINT[role];
      if (!endpoint) throw new Error("Unsupported role");

      const payload: any = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone_number: phone || undefined,
      };

      if (hospitalId) payload.hospital = hospitalId;

      await authenticatedFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      showToast("User created successfully", "success");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setHospitalId("");
    } catch (err: any) {
      showToast(err?.message || "Failed to create user", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto mt-20 p-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden -mt-6">
          <div className="px-6 py-6 border-b">
            <h1 className="text-2xl font-extrabold">Create User</h1>
            <p className="text-sm text-gray-500 mt-1">
              Quickly create platform accounts for hospitals, social workers,
              receptionists, and donors.
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                >
                  <option value="hospital_admin">Hospital Admin</option>
                  <option value="social_worker">Social Worker</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="donor">Donor</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    First name
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full rounded-md border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Last name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full rounded-md border px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Phone (optional)
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>

              {(role === "hospital_admin" ||
                role === "receptionist" ||
                role === "nurse") && (
                <div>
                  <label className="block text-sm font-medium">
                    Hospital ID (UUID)
                  </label>
                  <input
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="mt-1 block w-full rounded-md border px-3 py-2"
                  />
                </div>
              )}

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-admin px-4 py-2"
                >
                  {loading ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
