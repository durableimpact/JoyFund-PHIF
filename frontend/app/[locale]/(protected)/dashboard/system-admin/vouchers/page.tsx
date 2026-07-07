"use client";
import { useI18n } from '@/locales/client';
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useUrlSearchParams } from "@/hooks/use-url-search-params";
import Link from "next/link";

import { formatXAF, statusColor, formatDate } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listVouchers, createVouchersFromCampaigns } from "@/actions/vouchers";
import { listHealthIssues } from "@/actions/beneficiaries";
import { listHospitals } from "@/actions/hospital";
import { listCampaigns } from "@/actions/campaigns";
import Paginator from "@/components/shared/Paginator";

const STATUS_FILTERS = [
  "all",
  "AVAILABLE",
  "ACTIVE",
  "PENDING_CONFIRMATION",
  "USED",
  "EXPIRED",
];
const PAGE_SIZE = 10;

type AllocationMode = "amount" | "percentage";

interface SelectedAllocation {
  campaign_id: string;
  mode: AllocationMode;
  value: string;
}

export default function AdminVouchers() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken || session?.user?.accessToken;
  const queryClient = useQueryClient();

  const [params, setParams] = useUrlSearchParams({ search: "", filter: "all", page: 1 }, { page: Number });
  const search = (params.search as string) || "";
  const filter = (params.filter as string) || "all";
  const currentPage = Number(params.page) || 1;
  const setPage = (p: number) => setParams({ page: p });
  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(Math.max(1, currentPage - 1));

  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(1);

  const [healthIssueId, setHealthIssueId] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [selectedAllocations, setSelectedAllocations] = useState<
    SelectedAllocation[]
  >([]);
  const [createError, setCreateError] = useState("");

  const { data: vouchersData, isLoading } = useQuery({
    queryKey: ["vouchers", token, currentPage, search, filter],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
      };
      if (search) params.search = search;
      if (filter !== "all") params.status = filter;
      return await listVouchers(token!, params);
    },
    enabled: !!token,
  });

  const vouchers: VoucherList[] = vouchersData?.results || [];
  const totalCount = vouchersData?.count || 0;
  const hasNextPage = !!vouchersData?.next;
  const hasPreviousPage = !!vouchersData?.previous;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const { data: healthIssuesData } = useQuery({
    queryKey: ["healthIssues", token],
    queryFn: async () => await listHealthIssues(token!, { page_size: "1000" }),
    enabled: !!token,
  });

  const healthIssues: HealthIssue[] = healthIssuesData?.results || [];
  const validatedHealthIssues = healthIssues.filter(
    (h) => h.status === "VALIDATED",
  );

  const { data: hospitalsData } = useQuery({
    queryKey: ["hospitals", token],
    queryFn: async () => await listHospitals(token!, { page_size: "1000" }),
    enabled: !!token,
  });

  const hospitals: Hospital[] = hospitalsData?.results || [];

  const { data: campaignsData } = useQuery({
    queryKey: ["admin-campaigns-picker", token],
    queryFn: async () => await listCampaigns({ page_size: 1000 }),
    enabled: !!token,
  });

  const campaigns: CampaignList[] = campaignsData?.results || [];

  const createVoucherMutation = useMutation({
    mutationFn: () => {
      const total = Number(requestedAmount);
      const valid = selectedAllocations.filter(
        (a) => a.campaign_id && Number(a.value) > 0,
      );
      return createVouchersFromCampaigns(token!, {
        health_issue_id: healthIssueId,
        hospital_id: hospitalId,
        total_amount: total,
        campaign_allocations: valid.map((a) =>
          a.mode === "percentage"
            ? { campaign_id: a.campaign_id, percentage: Number(a.value) }
            : { campaign_id: a.campaign_id, amount: Number(a.value) }
        ),
      });
    },
    
    onSuccess: () => {
      setShowCreate(false);
      setCreateStep(1);
      setHealthIssueId("");
      setHospitalId("");
      setRequestedAmount("");
      setSelectedAllocations([]);
      setCreateError("");
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });

  const numericRequestedAmount = Number(requestedAmount) || 0;

  const getCampaign = (id: string) => campaigns.find((c) => c.id === id);
  const selectedCampaignIds = new Set(
    selectedAllocations.map((a) => a.campaign_id),
  );

  const totalAllocatedAmount = selectedAllocations.reduce((sum, allocation) => {
    const value = Number(allocation.value) || 0;
    if (allocation.mode === "percentage") {
      return sum + (numericRequestedAmount * value) / 100;
    }
    return sum + value;
  }, 0);

  const totalPercentage = selectedAllocations.reduce((sum, allocation) => {
    if (allocation.mode !== "percentage") return sum;
    return sum + (Number(allocation.value) || 0);
  }, 0);

  const canMoveToFundingStep =
    !!healthIssueId && !!hospitalId && numericRequestedAmount > 0;

  const toggleCampaignSelection = (campaignIdToToggle: string) => {
    setSelectedAllocations((prev) => {
      const exists = prev.some((a) => a.campaign_id === campaignIdToToggle);
      if (exists) {
        return prev.filter((a) => a.campaign_id !== campaignIdToToggle);
      }
      return [
        ...prev,
        { campaign_id: campaignIdToToggle, mode: "amount", value: "" },
      ];
    });
  };

  const updateAllocation = (
    campaignIdToUpdate: string,
    patch: Partial<SelectedAllocation>,
  ) => {
    setSelectedAllocations((prev) =>
      prev.map((a) =>
        a.campaign_id === campaignIdToUpdate ? { ...a, ...patch } : a,
      ),
    );
  };

  const handleOpenCreate = () => {
    setShowCreate(true);
    setCreateStep(1);
    setCreateError("");
  };

  const handleCreateVoucher = () => {
    setCreateError("");
    if (selectedAllocations.length === 0) {
      setCreateError(t('systemAdmin.vouchers.selectAtLeastOne'));
      return;
    }

    const hasInvalid = selectedAllocations.some((a) => Number(a.value) <= 0);
    if (hasInvalid) {
      setCreateError(
        t('systemAdmin.vouchers.enterAmount'),
      );
      return;
    }

    const usesPercentage = selectedAllocations.some(
      (a) => a.mode === "percentage",
    );
    const usesAmount = selectedAllocations.some((a) => a.mode === "amount");

    if (usesPercentage && totalPercentage > 100) {
      setCreateError("Total percentage allocation cannot exceed 100%.");
      return;
    }

    if (usesAmount && totalAllocatedAmount < numericRequestedAmount) {
      setCreateError(
        t('systemAdmin.vouchers.allocationExceeds'),
      );
      return;
    }

    createVoucherMutation.mutate();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {t('systemAdmin.vouchers.title')}
          </h1>
          <p className="text-gray-500 text-sm">{t('systemAdmin.vouchers.subtitle', { count: totalCount })}</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn-admin text-sm flex items-center gap-2"
          style={{ background: "#471DDB" }}
        >
          <Plus size={16} /> {t('systemAdmin.vouchers.create')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input-field pl-10"
            placeholder={t('systemAdmin.vouchers.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setParams({ search: e.target.value, page: 1 });
            }}
          />
        </div>
        <select
          className="input-field w-auto"
          value={filter}
          onChange={(e) => {
            setParams({ filter: e.target.value, page: 1 });
          }}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? t('systemAdmin.vouchers.allStatus') : s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  t('systemAdmin.vouchers.colCode'),
                  t('systemAdmin.vouchers.colBeneficiary'),
                  t('systemAdmin.vouchers.colHospital'),
                  t('systemAdmin.vouchers.colStatus'),
                  t('systemAdmin.vouchers.colExpiry'),
                  t('systemAdmin.vouchers.colCreated'),
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
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : vouchers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    {t('systemAdmin.vouchers.empty')}
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <Link
                        href={`/dashboard/system-admin/vouchers/${v.id}`}
                        className="font-mono text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline"
                      >
                        {v.voucher_code}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-700 text-xs">
                      {v.beneficiary_name || "—"}
                    </td>
                    <td className="p-4 text-gray-600 text-xs">
                      {v.hospital_name || "—"}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${statusColor(v.status)}`}>
                        {v.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {v.expiry_date ? formatDate(v.expiry_date) : "—"}
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {v.created_at ? formatDate(v.created_at) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > PAGE_SIZE && (
          <Paginator currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">
                {t('systemAdmin.vouchers.createVoucher')}
              </h2>
              <button onClick={() => setShowCreate(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { id: 1, label: t('systemAdmin.vouchers.step1Title') },
                { id: 2, label: t('systemAdmin.vouchers.step2Title') },
                { id: 3, label: t('systemAdmin.vouchers.step3Title') },
              ].map((step) => (
                <div
                  key={step.id}
                  className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold ${
                    createStep >= step.id
                      ? "text-white border-transparent"
                      : "text-gray-500 border-gray-200 bg-gray-50"
                  }`}
                  style={createStep >= step.id ? { background: "#471DDB" } : {}}
                >
                  {step.label}
                </div>
              ))}
            </div>

            {validatedHealthIssues.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
                No VALIDATED health issues found. Health issues must be verified
                before creating a voucher.
              </div>
            )}

            {createStep === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    {t('systemAdmin.vouchers.healthIssueLabel')}
                  </label>
                  <select
                    className="input-field"
                    value={healthIssueId}
                    onChange={(e) => setHealthIssueId(e.target.value)}
                  >
                    <option value="">{t('systemAdmin.vouchers.selectHealthIssue')}</option>
                    {validatedHealthIssues.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    {t('systemAdmin.vouchers.hospitalLabel')}
                  </label>
                  <select
                    className="input-field"
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                  >
                    <option value="">{t('systemAdmin.vouchers.selectHospital')}</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} · {h.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    {t('systemAdmin.vouchers.amountLabel')}
                  </label>
                  <input
                    className="input-field"
                    type="number"
                    min={1}
                    placeholder="e.g. 60000"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    className="btn-outline flex-1"
                    onClick={() => setShowCreate(false)}
                  >
                    {t('systemAdmin.vouchers.cancel')}
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                    style={{ background: "#471DDB" }}
                    disabled={!canMoveToFundingStep}
                    onClick={() => setCreateStep(2)}
                  >
                    {t('systemAdmin.vouchers.continue')}
                  </button>
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800">
                  {t('systemAdmin.vouchers.targetAmount')}{" "}
                  <span className="font-bold">
                    {formatXAF(numericRequestedAmount)}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-2">
                  {campaigns.length === 0 ? (
                    <div className="text-xs text-gray-500 p-3">
                      {t('systemAdmin.vouchers.noCampaignsFound')}
                    </div>
                  ) : (
                    campaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        type="button"
                        className={`w-full text-left border rounded-xl px-3 py-2 transition ${
                          selectedCampaignIds.has(campaign.id)
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => toggleCampaignSelection(campaign.id)}
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {campaign.title}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    className="btn-outline flex-1"
                    onClick={() => setCreateStep(1)}
                  >
                    {t('systemAdmin.vouchers.back')}
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                    style={{ background: "#471DDB" }}
                    disabled={selectedAllocations.length === 0}
                    onClick={() => setCreateStep(3)}
                  >
                    {t('systemAdmin.vouchers.continue')}
                  </button>
                </div>
              </div>
            )}

            {createStep === 3 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                  {t('systemAdmin.vouchers.allocateFrom')}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedAllocations.map((allocation) => {
                    const campaign = getCampaign(allocation.campaign_id);
                    return (
                      <div
                        key={allocation.campaign_id}
                        className="border border-gray-200 rounded-xl p-3"
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {campaign?.title}
                        </div>
                        <div className="flex gap-2">
                          <select
                            className="input-field w-40"
                            value={allocation.mode}
                            onChange={(e) =>
                              updateAllocation(allocation.campaign_id, {
                                mode: e.target.value as AllocationMode,
                                value: "",
                              })
                            }
                          >
                            <option value="amount">{t('systemAdmin.vouchers.amountInput')}</option>
                            <option value="percentage">{t('systemAdmin.vouchers.percentageInput')}</option>
                          </select>
                          <input
                            className="input-field flex-1"
                            type="number"
                            min={1}
                            max={
                              allocation.mode === "percentage" ? 100 : undefined
                            }
                            placeholder={
                              allocation.mode === "percentage"
                                ? "e.g. 35"
                                : "e.g. 20000"
                            }
                            value={allocation.value}
                            onChange={(e) =>
                              updateAllocation(allocation.campaign_id, {
                                value: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-gray-200 p-3 text-xs space-y-1">
                  <div>
                    {t('systemAdmin.vouchers.targetAmount')}{" "}
                    <span className="font-bold">
                      {formatXAF(numericRequestedAmount)}
                    </span>
                  </div>
                  <div>
                    {t('systemAdmin.vouchers.totalAllocated', { amount: formatXAF(Math.floor(totalAllocatedAmount)) })}
                  </div>
                  <div>
                    Total percentage:{" "}
                    <span className="font-bold">
                      {totalPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                    {createError}
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    className="btn-outline flex-1"
                    onClick={() => setCreateStep(2)}
                  >
                    {t('systemAdmin.vouchers.back')}
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                    style={{ background: "#471DDB" }}
                    onClick={handleCreateVoucher}
                    disabled={createVoucherMutation.isPending}
                  >
                    {createVoucherMutation.isPending
                      ? t('systemAdmin.vouchers.creating')
                      : t('systemAdmin.vouchers.createVoucher')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
