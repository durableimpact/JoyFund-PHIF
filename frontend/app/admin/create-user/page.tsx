"use client";
import { useState, useEffect } from "react";
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
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [nationalId, setNationalId] = useState("");
  const [organization, setOrganization] = useState("");
  const [regionAssigned, setRegionAssigned] = useState("");
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
  const [backIdFile, setBackIdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Basic client-side validation
      if (!firstName || !lastName) throw new Error('First and last name are required.');
      if (!email) throw new Error('Email is required.');
      if (!password || password.length < 8) throw new Error('Password is required (min 8 characters).');

      // If creating a hospital_admin, social_worker, or receptionist, send multipart/form-data with ID images
      if (role === 'hospital_admin' || role === 'social_worker' || role === 'receptionist') {
        if (!nationalId) throw new Error('National ID number is required for hospital_admins, social workers, and receptionists.');
        if (!frontIdFile) throw new Error('Front image of national ID is required.');
        if (!backIdFile) throw new Error('Back image of national ID is required.');
        if (role === 'social_worker') {
          if (!organization) throw new Error('Organization is required for social workers.');
          if (!regionAssigned) throw new Error('Region assigned is required for social workers.');
        }

        const form = new FormData();
        form.append('role', role);
        form.append('first_name', firstName);
        form.append('last_name', lastName);
        form.append('email', email);
        form.append('password', password);
        if (phone) form.append('phone_number', phone);
        if (hospitalId) form.append('hospital', hospitalId);
        form.append('national_id_number', nationalId);
        form.append('front_national_id_image', frontIdFile as File);
        form.append('back_national_id_image', backIdFile as File);
        if (role === 'social_worker') {
          form.append('organization', organization);
          form.append('region_assigned', regionAssigned);
        }

        const res = await fetch(`/api/admin/create-user?role=${encodeURIComponent(role)}`, {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          // Surface full error JSON for easier debugging
          const errMsg = err?.detail || err?.message || JSON.stringify(err) || `Create user failed: ${res.status}`;
          throw new Error(errMsg);
        }
      } else {
        const payload: any = {
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          phone_number: phone || undefined,
        };

        if (hospitalId) payload.hospital = hospitalId;

        // Use server-side proxy to avoid CORS preflight and rely on httpOnly cookie
        const res = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, payload }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const errMsg = err?.detail || err?.message || JSON.stringify(err) || `Create user failed: ${res.status}`;
          throw new Error(errMsg);
        }
      }

      showToast("User created successfully", "success");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setHospitalId("");
      setNationalId("");
      setOrganization("");
      setRegionAssigned("");
      setFrontIdFile(null);
      setBackIdFile(null);
    } catch (err: any) {
      showToast(err?.message || "Failed to create user", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/hospitals');
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data) ? data : data?.results || [];
        if (!mounted) return;
        setHospitals(list);
        const seed = list.find((h: any) => h.email === 'info@generalhospital.com' || (h.name || '').toLowerCase().includes('general'));
        if (seed) setHospitalId(seed.id);
      } catch (e) {
        // ignore — leave hospitalId editable
      }
    })();
    return () => { mounted = false; };
  }, []);

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
                    placeholder="First name (e.g. John)"
                    className="mt-1 block w-full rounded-md border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Last name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name (e.g. Doe)"
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
                  placeholder="user@example.com"
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
                  placeholder="At least 8 characters"
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
                  placeholder="+237 6XXXXXXXX"
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                />
              </div>

              {role === 'social_worker' && (
                <>
                  <div>
                    <label className="block text-sm font-medium">
                      Organization
                    </label>
                    <input
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Organization name"
                      className="mt-1 block w-full rounded-md border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Region assigned
                    </label>
                    <input
                      value={regionAssigned}
                      onChange={(e) => setRegionAssigned(e.target.value)}
                      placeholder="Region, district or area"
                      className="mt-1 block w-full rounded-md border px-3 py-2"
                    />
                  </div>
                </>
              )}

              {(role === "hospital_admin" ||
                role === "receptionist" ||
                role === "nurse") && (
                <div>
                  <label className="block text-sm font-medium">
                    Hospital
                  </label>
                  {hospitals.length > 0 ? (
                    <select
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      className="mt-1 block w-full rounded-md border px-3 py-2"
                    >
                      <option value="">-- Select hospital (name — id) --</option>
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} — {h.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      placeholder="Hospital UUID (e.g. 123e4567-e89b-12d3-a456-426614174000)"
                      className="mt-1 block w-full rounded-md border px-3 py-2"
                    />
                  )}
                </div>
              )}

              {(role === 'social_worker' || role === 'receptionist') && (
                <>
                  <div>
                    <label className="block text-sm font-medium">
                      National ID number
                    </label>
                    <input
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="National ID (e.g. NID-12345)"
                      className="mt-1 block w-full rounded-md border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Front of national ID (image)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFrontIdFile(e.target.files?.[0] ?? null)}
                      className="mt-1 block w-full"
                      title="Upload front image of national ID (jpg/png, max 5MB)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Back of national ID (image)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBackIdFile(e.target.files?.[0] ?? null)}
                      className="mt-1 block w-full"
                      title="Upload back image of national ID (jpg/png, max 5MB)"
                    />
                  </div>
                </>
              )}

              {role === 'hospital_admin' && (
                <>
                  <div>
                    <label className="block text-sm font-medium">National ID number</label>
                    <input
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="National ID (e.g. NID-12345)"
                      className="mt-1 block w-full rounded-md border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Front of national ID (image)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFrontIdFile(e.target.files?.[0] ?? null)}
                      className="mt-1 block w-full"
                      title="Upload front image of national ID (jpg/png, max 5MB)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Back of national ID (image)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBackIdFile(e.target.files?.[0] ?? null)}
                      className="mt-1 block w-full"
                      title="Upload back image of national ID (jpg/png, max 5MB)"
                    />
                  </div>
                </>
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