"use client";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle,
  XCircle,
  UserCheck,
  Search,
  Phone,
  MessageSquare,
  ExternalLink,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  UserPlus,
} from "lucide-react";
import {
  listPendingVerifications,
  assignReviewer,
  verifyBeneficiary,
  rejectVerification,
} from "@/actions/campaigns";
import { listBeneficiaries, createBeneficiary } from "@/actions/beneficiaries";
import { listSocialWorkers } from "@/actions/accounts";
import { useI18n } from "@/locales/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

type FilterMode = "all" | "mine" | "unassigned";

const GENDERS = ["FEMALE", "MALE", "OTHER"] as const;

const CATEGORIES = ["MATERNAL", "ELDERLY", "OTHER"] as const;

const RELATIONSHIPS = [
  "SPOUSE",
  "PARENT",
  "SIBLING",
  "FRIEND",
  "NEIGHBOR",
  "OTHER",
] as const;

const beneficiarySchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Gender is required" }),
  category: z.enum(["MATERNAL", "ELDERLY", "OTHER"], {
    message: "Category is required",
  }),
  phone: z.string().min(6, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  national_id_number: z.string().min(1, "National ID is required"),
  region: z.string().min(1, "Region is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  emergency_contact_name: z.string().min(1, "Emergency contact name is required"),
  emergency_contact_phone: z
    .string()
    .min(6, "Emergency contact phone is required"),
  emergency_contact_relationship: z
    .string()
    .min(1, "Relationship is required"),
});

type BeneficiaryForm = z.infer<typeof beneficiarySchema>;

const CREATE_STEPS = [
  {
    key: "personal",
    num: 1,
    fields: [
      "full_name",
      "date_of_birth",
      "gender",
      "category",
      "phone",
      "email",
      "national_id_number",
    ] as const,
  },
  {
    key: "location",
    num: 2,
    fields: ["region", "city", "address"] as const,
  },
  {
    key: "emergency",
    num: 3,
    fields: [
      "emergency_contact_name",
      "emergency_contact_phone",
      "emergency_contact_relationship",
    ] as const,
  },
] as const;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function CampaignReviewsPage() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken || session?.user?.accessToken;
  const userRole = (session?.user as any)?.role as string | undefined;
  const isSystemAdmin = userRole === "SYSTEM_ADMIN";
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<FilterMode>("all");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignStaffReview | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // System admin: assign dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignCampaign, setAssignCampaign] =
    useState<CampaignStaffReview | null>(null);
  const [selectedSWId, setSelectedSWId] = useState("");

  // Social worker: verify mode (existing vs create)
  const [verifyMode, setVerifyMode] = useState<"existing" | "create">(
    "existing",
  );
  const [createStep, setCreateStep] = useState(0);

  // List pending verifications
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["sw-campaign-reviews", filter, token],
    queryFn: () =>
      listPendingVerifications(token!, {
        mine: filter === "mine",
        unassigned: filter === "unassigned",
        page_size: 100,
      }),
    enabled: !!token,
  });

  // List existing beneficiaries for linking
  const { data: beneficiariesData } = useQuery({
    queryKey: ["sw-beneficiaries-list", token],
    queryFn: async () => {
      const res = await listBeneficiaries(token!, { page_size: "1000" });
      const d = (res as any)?.json || res;
      return d || { results: [] };
    },
    enabled: !!token && verifyDialogOpen,
  });

  // List social workers for system admin assign
  const { data: swData } = useQuery({
    queryKey: ["sw-list-for-assign", token],
    queryFn: async () => {
      const res = await listSocialWorkers(token!, { page_size: "1000" });
      return (res as any)?.json || res || { results: [] };
    },
    enabled: !!token && assignDialogOpen,
  });

  const beneficiaries: Beneficiary[] = beneficiariesData?.results || [];
  const socialWorkers: SocialWorker[] = swData?.results || [];
  const reviews: CampaignStaffReview[] = reviewsData?.results || [];
  const totalCount = reviewsData?.count || 0;

  // Filter by search
  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.beneficiary_name?.toLowerCase().includes(q) ||
      r.donor?.user?.first_name?.toLowerCase().includes(q) ||
      r.donor?.user?.last_name?.toLowerCase().includes(q)
    );
  });

  // Assign reviewer mutation (works for both self-assign and admin-assign)
  const assignMutation = useMutation({
    mutationFn: ({
      campaignId,
      swId,
    }: {
      campaignId: string;
      swId?: string;
    }) => assignReviewer(campaignId, token!, swId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sw-campaign-reviews"] });
      setAssignDialogOpen(false);
      setAssignCampaign(null);
      setSelectedSWId("");
    },
  });

  // Beneficiary creation form
  const createForm = useForm<BeneficiaryForm>({
    resolver: zodResolver(beneficiarySchema),
    mode: "onChange",
    defaultValues: {
      full_name: "",
      date_of_birth: "",
      gender: undefined,
      category: undefined,
      phone: "",
      email: "",
      national_id_number: "",
      region: "",
      city: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
    },
  });

  const {
    watch,
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors },
  } = createForm;

  // Verify mutation
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState("");
  const verifyMutation = useMutation({
    mutationFn: () =>
      verifyBeneficiary(
        selectedCampaign!.id,
        selectedBeneficiaryId,
        token!,
      ),
    onSuccess: () => {
      resetVerifyDialog();
      queryClient.invalidateQueries({ queryKey: ["sw-campaign-reviews"] });
    },
  });

  // Create + Verify mutation (social worker only)
  const createAndVerifyMutation = useMutation({
    mutationFn: async (data: BeneficiaryForm) => {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== "") {
          formData.append(k, String(v));
        }
      });
      const created = await createBeneficiary(token!, formData);
      return verifyBeneficiary(
        selectedCampaign!.id,
        (created as any).id,
        token!,
      );
    },
    onSuccess: () => {
      resetVerifyDialog();
      queryClient.invalidateQueries({ queryKey: ["sw-campaign-reviews"] });
    },
  });

  // Reject verification mutation
  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectVerification(selectedCampaign!.id, rejectReason, token!),
    onSuccess: () => {
      setRejectDialogOpen(false);
      setSelectedCampaign(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["sw-campaign-reviews"] });
    },
  });

  // System admin: assign to social worker mutation
  const adminAssignMutation = useMutation({
    mutationFn: () =>
      assignReviewer(assignCampaign!.id, token!, selectedSWId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sw-campaign-reviews"] });
      setAssignDialogOpen(false);
      setAssignCampaign(null);
      setSelectedSWId("");
    },
  });

  function resetVerifyDialog() {
    setVerifyDialogOpen(false);
    setSelectedCampaign(null);
    setSelectedBeneficiaryId("");
    setVerifyMode("existing");
    setCreateStep(0);
    createForm.reset({
      full_name: "",
      date_of_birth: "",
      gender: undefined,
      category: undefined,
      phone: "",
      email: "",
      national_id_number: "",
      region: "",
      city: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
    });
  }

  // Pre-fill form when campaign selected for creation
  function openCreateMode(campaign: CampaignStaffReview) {
    setVerifyMode("create");
    setCreateStep(0);
    createForm.reset({
      full_name: campaign.beneficiary_name || "",
      date_of_birth: "",
      gender: undefined,
      category: undefined,
      phone: campaign.beneficiary_contact || "",
      email: "",
      national_id_number: "",
      region: "",
      city: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
    });
  }

  const currentCreateStep = CREATE_STEPS[createStep];

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldNames = currentCreateStep.fields as readonly (keyof BeneficiaryForm)[];
    if (fieldNames.length === 0) return true;
    return trigger(fieldNames as any);
  };

  const nextCreateStep = async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    setCreateStep((prev) => Math.min(prev + 1, CREATE_STEPS.length - 1));
  };

  const prevCreateStep = () =>
    setCreateStep((prev) => Math.max(prev - 1, 0));

  const onCreateSubmit = handleSubmit((data) => {
    createAndVerifyMutation.mutate(data);
  });

  const filters: { key: FilterMode; label: string; count?: number }[] = [
    {
      key: "all",
      label: t("socialWorker.reviews.filterAll"),
      count: totalCount,
    },
    ...(!isSystemAdmin
      ? [{ key: "mine" as FilterMode, label: t("socialWorker.reviews.filterMine") }]
      : []),
    { key: "unassigned", label: t("socialWorker.reviews.filterUnassigned") },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">
          {t("socialWorker.reviews.title")}
        </h1>
        <p className="text-gray-500 text-sm">
          {t("socialWorker.reviews.subtitle")}
        </p>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === f.key
                  ? "text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={filter === f.key ? { background: "#0D9488" } : undefined}
            >
              {f.label}
              {f.count !== undefined && (
                <span className="ml-1 opacity-70">({f.count})</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input-field pl-8 text-sm"
            placeholder={t("socialWorker.reviews.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle size={40} className="mx-auto text-emerald-300 mb-3" />
          <h3 className="font-bold text-gray-900 mb-1">
            {t("socialWorker.reviews.emptyTitle")}
          </h3>
          <p className="text-sm text-gray-500">
            {t("socialWorker.reviews.emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-[#1A1A2E] truncate">
                      {review.title}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      {review.verification_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        {t("socialWorker.reviews.donor")}
                      </span>
                      <p className="text-gray-700">
                        {review.donor?.user?.first_name}{" "}
                        {review.donor?.user?.last_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        {t("socialWorker.reviews.beneficiaryName")}
                      </span>
                      <p className="text-gray-700">
                        {review.beneficiary_name || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                        <Phone size={10} />{" "}
                        {t("socialWorker.reviews.contact")}
                      </span>
                      <p className="text-gray-700 font-mono text-xs">
                        {review.beneficiary_contact || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        {t("socialWorker.reviews.created")}
                      </span>
                      <p className="text-gray-700">
                        {new Date(review.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  {review.beneficiary_situation && (
                    <div className="mt-3">
                      <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                        <MessageSquare size={10} />{" "}
                        {t("socialWorker.reviews.situation")}
                      </span>
                      <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg p-3 leading-relaxed">
                        {review.beneficiary_situation}
                      </p>
                    </div>
                  )}

                  {review.assigned_social_worker_name && (
                    <p className="text-[10px] text-gray-400 mt-2">
                      {t("socialWorker.reviews.assignedTo")}:{" "}
                      <span className="font-medium text-gray-600">
                        {review.assigned_social_worker_name}
                      </span>
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {!review.assigned_social_worker_name &&
                    (isSystemAdmin ? (
                      <button
                        onClick={() => {
                          setAssignCampaign(review);
                          setSelectedSWId("");
                          setAssignDialogOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                        style={{ background: "#0D9488" }}
                      >
                        <UserCheck size={12} />
                        {t("socialWorker.reviews.assignToSW")}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          assignMutation.mutate({
                            campaignId: review.id,
                          })
                        }
                        disabled={assignMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                        style={{ background: "#0D9488" }}
                      >
                        <UserCheck size={12} />
                        {t("socialWorker.reviews.assignToMe")}
                      </button>
                    ))}
                  <button
                    onClick={() => {
                      setSelectedCampaign(review);
                      setVerifyMode("existing");
                      setCreateStep(0);
                      setVerifyDialogOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle size={12} />
                    {t("socialWorker.reviews.verify")}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCampaign(review);
                      setRejectDialogOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={12} />
                    {t("socialWorker.reviews.reject")}
                  </button>
                  <a
                    href={`/campaign/${review.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <ExternalLink size={12} />
                    {t("socialWorker.reviews.viewCampaign")}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign to Social Worker Dialog (System Admin) */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("socialWorker.reviews.assignToSW")}</DialogTitle>
            <DialogDescription>
              {t("socialWorker.reviews.assignSWDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Command>
              <CommandInput
                placeholder={t("socialWorker.reviews.searchSW")}
              />
              <CommandList>
                <CommandEmpty>
                  {t("socialWorker.reviews.noSWFound")}
                </CommandEmpty>
                {socialWorkers.map((sw) => {
                  const name = [sw.user?.first_name, sw.user?.last_name]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <CommandItem
                      key={sw.id}
                      value={`${name} ${sw.user?.email || ""}`}
                      onSelect={() => setSelectedSWId(sw.id)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {name || sw.user?.email}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {sw.user?.email}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandList>
            </Command>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setAssignCampaign(null);
                setSelectedSWId("");
              }}
            >
              {t("general.cancel")}
            </Button>
            <Button
              style={{ background: "#0D9488" }}
              onClick={() => adminAssignMutation.mutate()}
              disabled={!selectedSWId || adminAssignMutation.isPending}
            >
              {adminAssignMutation.isPending && (
                <Loader2 size={14} className="animate-spin mr-1" />
              )}
              {t("socialWorker.reviews.confirmAssign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent
          className={
            verifyMode === "create" && !isSystemAdmin
              ? "sm:max-w-lg"
              : "sm:max-w-md"
          }
        >
          <DialogHeader>
            <DialogTitle>{t("socialWorker.reviews.verifyTitle")}</DialogTitle>
            <DialogDescription>
              {t("socialWorker.reviews.verifyDesc", {
                name: selectedCampaign?.beneficiary_name || "",
              })}
            </DialogDescription>
          </DialogHeader>

          {/* Mode toggle (social worker only) */}
          {!isSystemAdmin && (
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setVerifyMode("existing")}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  verifyMode === "existing"
                    ? "text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={
                  verifyMode === "existing" ? { background: "#0D9488" } : undefined
                }
              >
                {t("socialWorker.reviews.selectExisting")}
              </button>
              <button
                onClick={() => {
                  if (selectedCampaign) openCreateMode(selectedCampaign);
                }}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  verifyMode === "create"
                    ? "text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={
                  verifyMode === "create" ? { background: "#0D9488" } : undefined
                }
              >
                <UserPlus size={12} className="inline mr-1" />
                {t("socialWorker.reviews.createNew")}
              </button>
            </div>
          )}

          {/* Existing beneficiary select */}
          {verifyMode === "existing" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                  {t("socialWorker.reviews.selectBeneficiary")}
                </label>
                <select
                  className="input-field text-sm"
                  value={selectedBeneficiaryId}
                  onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
                >
                  <option value="">
                    {t("socialWorker.reviews.chooseBeneficiary")}
                  </option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.full_name} ({b.digital_health_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Multi-step create form */}
          {verifyMode === "create" && !isSystemAdmin && (
            <div>
              {/* Step indicator */}
              <div className="flex items-center gap-1 mb-4">
                {CREATE_STEPS.map((s, i) => {
                  const done = i < createStep;
                  const active = i === createStep;
                  return (
                    <div key={s.key} className="flex items-center gap-1 flex-1">
                      <button
                        type="button"
                        onClick={() => setCreateStep(i)}
                        className={`flex items-center justify-center gap-1.5 flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                          done
                            ? "bg-teal-100 text-teal-700"
                            : active
                              ? "text-white"
                              : "bg-gray-100 text-gray-400"
                        }`}
                        style={active ? { background: "#0D9488" } : {}}
                      >
                        {done ? (
                          <Check size={10} />
                        ) : (
                          <span className="text-[9px] font-black">{s.num}</span>
                        )}
                        <span className="hidden sm:inline capitalize">
                          {s.key}
                        </span>
                      </button>
                      {i < CREATE_STEPS.length - 1 && (
                        <div
                          className={`w-3 h-px shrink-0 ${
                            i < createStep ? "bg-teal-300" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <form
                id="create-beneficiary-form"
                onSubmit={onCreateSubmit}
                className="space-y-3"
              >
                {createStep === 0 && (
                  <section className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label={t("socialWorker.createBeneficiary.fullNameRequired")}
                        error={errors.full_name?.message}
                      >
                        <input
                          className="input-field text-sm"
                          {...createForm.register("full_name")}
                          placeholder={t("socialWorker.createBeneficiary.fullNamePlaceholder")}
                        />
                      </Field>
                      <Field
                        label={t("socialWorker.createBeneficiary.dateOfBirthRequired")}
                        error={errors.date_of_birth?.message}
                      >
                        <input
                          type="date"
                          className="input-field text-sm"
                          {...createForm.register("date_of_birth")}
                        />
                      </Field>
                      <Field
                        label={t("socialWorker.createBeneficiary.genderRequired")}
                        error={errors.gender?.message}
                      >
                        <Controller
                          name="gender"
                          control={control}
                          render={({ field }) => (
                            <select
                              className="input-field text-sm"
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || undefined)
                              }
                            >
                              <option value="">
                                {t("socialWorker.createBeneficiary.selectPlaceholder")}
                              </option>
                              {GENDERS.map((g) => (
                                <option key={g} value={g}>
                                  {t(`socialWorker.createBeneficiary.${g.toLowerCase()}`)}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </Field>
                      <Field
                        label={t("socialWorker.createBeneficiary.categoryRequired")}
                        error={errors.category?.message}
                      >
                        <Controller
                          name="category"
                          control={control}
                          render={({ field }) => (
                            <select
                              className="input-field text-sm"
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || undefined)
                              }
                            >
                              <option value="">
                                {t("socialWorker.createBeneficiary.selectPlaceholder")}
                              </option>
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {t(`socialWorker.createBeneficiary.category${c}`)}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </Field>
                      <Field
                        label={t("socialWorker.createBeneficiary.phoneRequired")}
                        error={errors.phone?.message}
                      >
                        <input
                          type="tel"
                          className="input-field text-sm"
                          {...createForm.register("phone")}
                          placeholder={t("socialWorker.createBeneficiary.phonePlaceholder")}
                        />
                      </Field>
                      <Field
                        label={t("socialWorker.createBeneficiary.email")}
                        error={errors.email?.message}
                      >
                        <input
                          type="email"
                          className="input-field text-sm"
                          {...createForm.register("email")}
                          placeholder={t("socialWorker.createBeneficiary.emailPlaceholder")}
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field
                          label={t("socialWorker.createBeneficiary.nationalIdRequired")}
                          error={errors.national_id_number?.message}
                        >
                          <input
                            className="input-field text-sm"
                            {...createForm.register("national_id_number")}
                            placeholder={t("socialWorker.createBeneficiary.nationalIdPlaceholder")}
                          />
                        </Field>
                      </div>
                    </div>
                  </section>
                )}

                {createStep === 1 && (
                  <section className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label={t("socialWorker.createBeneficiary.regionRequired")}
                        error={errors.region?.message}
                      >
                        <input
                          className="input-field text-sm"
                          {...createForm.register("region")}
                          placeholder={t("socialWorker.createBeneficiary.regionPlaceholder")}
                        />
                      </Field>
                      <Field
                        label={t("socialWorker.createBeneficiary.cityRequired")}
                        error={errors.city?.message}
                      >
                        <input
                          className="input-field text-sm"
                          {...createForm.register("city")}
                          placeholder={t("socialWorker.createBeneficiary.cityPlaceholder")}
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field
                          label={t("socialWorker.createBeneficiary.addressRequired")}
                          error={errors.address?.message}
                        >
                          <input
                            className="input-field text-sm"
                            {...createForm.register("address")}
                            placeholder={t("socialWorker.createBeneficiary.addressPlaceholder")}
                          />
                        </Field>
                      </div>
                    </div>
                  </section>
                )}

                {createStep === 2 && (
                  <section className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field
                        label={t("socialWorker.createBeneficiary.ecNameRequired")}
                        error={errors.emergency_contact_name?.message}
                      >
                        <input
                          className="input-field text-sm"
                          {...createForm.register("emergency_contact_name")}
                          placeholder={t("socialWorker.createBeneficiary.ecNamePlaceholder")}
                        />
                      </Field>
                      <Field
                        label={t("socialWorker.createBeneficiary.ecPhoneRequired")}
                        error={errors.emergency_contact_phone?.message}
                      >
                        <input
                          type="tel"
                          className="input-field text-sm"
                          {...createForm.register("emergency_contact_phone")}
                          placeholder={t("socialWorker.createBeneficiary.ecPhonePlaceholder")}
                        />
                      </Field>
                      <Field
                        label={t("socialWorker.createBeneficiary.ecRelationshipRequired")}
                        error={errors.emergency_contact_relationship?.message}
                      >
                        <Controller
                          name="emergency_contact_relationship"
                          control={control}
                          render={({ field }) => (
                            <select
                              className="input-field text-sm"
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || undefined)
                              }
                            >
                              <option value="">
                                {t("socialWorker.createBeneficiary.selectPlaceholder")}
                              </option>
                              {RELATIONSHIPS.map((r) => (
                                <option key={r} value={r}>
                                  {t(`socialWorker.createBeneficiary.relationship${r}`)}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </Field>
                    </div>
                  </section>
                )}
              </form>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetVerifyDialog}
            >
              {t("general.cancel")}
            </Button>

            {verifyMode === "existing" && (
              <Button
                style={{ background: "#0D9488" }}
                onClick={() => verifyMutation.mutate()}
                disabled={!selectedBeneficiaryId || verifyMutation.isPending}
              >
                {verifyMutation.isPending && (
                  <Loader2 size={14} className="animate-spin mr-1" />
                )}
                {t("socialWorker.reviews.confirmVerify")}
              </Button>
            )}

            {verifyMode === "create" && !isSystemAdmin && (
              <>
                {createStep > 0 && (
                  <Button variant="outline" onClick={prevCreateStep}>
                    <ChevronLeft size={14} className="mr-1" />
                    {t("socialWorker.createBeneficiary.back")}
                  </Button>
                )}
                {createStep < CREATE_STEPS.length - 1 ? (
                  <Button
                    type="button"
                    style={{ background: "#0D9488" }}
                    onClick={nextCreateStep}
                  >
                    {t("socialWorker.createBeneficiary.continue")}
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    form="create-beneficiary-form"
                    style={{ background: "#0D9488" }}
                    disabled={createAndVerifyMutation.isPending}
                  >
                    {createAndVerifyMutation.isPending && (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    )}
                    {t("socialWorker.reviews.createAndVerify")}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("socialWorker.reviews.rejectTitle")}</DialogTitle>
            <DialogDescription>
              {t("socialWorker.reviews.rejectDesc")}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
              {t("socialWorker.reviews.reason")}
            </label>
            <textarea
              className="input-field min-h-24 resize-none text-sm"
              placeholder={t("socialWorker.reviews.reasonPlaceholder")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedCampaign(null);
                setRejectReason("");
              }}
            >
              {t("general.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending && (
                <Loader2 size={14} className="animate-spin mr-1" />
              )}
              {t("socialWorker.reviews.confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
