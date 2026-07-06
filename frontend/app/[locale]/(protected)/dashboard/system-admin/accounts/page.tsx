"use client";
import { useI18n } from '@/locales/client';
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Banknote, Loader2 } from "lucide-react";
import { formatXAF, formatDate } from "@/lib/utils";
import { getEscrowAccount, getFeeAccount, listAccounts } from "@/actions/payments";

export default function AccountsPage() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data: escrow, isLoading: eLoading } = useQuery({
    queryKey: ["escrow-account", token],
    queryFn: async () => await getEscrowAccount(token),
    enabled: !!token,
  });
  const { data: fee, isLoading: fLoading } = useQuery({
    queryKey: ["fee-account", token],
    queryFn: async () => await getFeeAccount(token),
    enabled: !!token,
  });
  const { data: allAccounts, isLoading: aLoading } = useQuery({
    queryKey: ["all-accounts", token],
    queryFn: async () => await listAccounts(token),
    enabled: !!token,
  });

  const loading = eLoading || fLoading || aLoading;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('systemAdmin.accounts.title')}</h1>
          <p className="text-gray-500 text-sm">{t('systemAdmin.accounts.description')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Escrow Account */}
        <div className="card p-6 border-t-4" style={{ borderTopColor: '#1DB1DB' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#1DB1DB]/10 flex items-center justify-center">
              <Wallet size={20} className="text-[#1DB1DB]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{t('systemAdmin.accounts.escrowAccount')}</h3>
              <p className="text-xs text-gray-400">{t('systemAdmin.accounts.escrowDescription')}</p>
            </div>
          </div>
          {eLoading ? (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <>
              <div className="text-3xl font-black text-[#1DB1DB]">{formatXAF(escrow?.balance ?? 0)}</div>
              <div className="mt-3 text-xs text-gray-400">{t('systemAdmin.accounts.updated')} {formatDate(escrow?.updated_at ?? null)}</div>
            </>
          )}
        </div>

        {/* Fee Account */}
        <div className="card p-6 border-t-4" style={{ borderTopColor: '#471DDB' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#471DDB]/10 flex items-center justify-center">
              <Banknote size={20} className="text-[#471DDB]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{t('systemAdmin.accounts.feeAccount')}</h3>
              <p className="text-xs text-gray-400">{t('systemAdmin.accounts.feeDescription')}</p>
            </div>
          </div>
          {fLoading ? (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <>
              <div className="text-3xl font-black text-[#471DDB]">{formatXAF(fee?.balance ?? 0)}</div>
              <div className="mt-3 text-xs text-gray-400">{t('systemAdmin.accounts.updated')} {formatDate(fee?.updated_at ?? null)}</div>
            </>
          )}
        </div>
      </div>

      {/* All Accounts */}
      <div className="card p-4 md:p-6">
        <h3 className="font-bold text-gray-900 mb-4">{t('systemAdmin.accounts.allAccounts')}</h3>
        {aLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-[#471DDB] animate-spin" /></div>
        ) : !allAccounts?.results?.length ? (
          <p className="text-gray-400 text-sm text-center py-8">{t('systemAdmin.accounts.noAccounts')}</p>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="md:hidden space-y-3">
              {allAccounts.results.map((a: Account) => (
                <div key={a.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">{t('systemAdmin.accounts.name')}</span><span className="font-semibold text-gray-900">{a.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">{t('systemAdmin.accounts.balance')}</span><span className="font-bold" style={{ color: '#471DDB' }}>{formatXAF(a.balance)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">{t('systemAdmin.accounts.created')}</span><span className="text-gray-400 text-xs">{formatDate(a.created_at)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">{t('systemAdmin.accounts.updated')}</span><span className="text-gray-400 text-xs">{formatDate(a.updated_at)}</span></div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[t('systemAdmin.accounts.name'), t('systemAdmin.accounts.balance'), t('systemAdmin.accounts.created'), t('systemAdmin.accounts.updated')].map(h => (
                      <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allAccounts.results.map((a: Account) => (
                    <tr key={a.id} className="border-b border-gray-50">
                      <td className="py-3 font-semibold text-gray-900">{a.name}</td>
                      <td className="py-3 font-bold" style={{ color: '#471DDB' }}>{formatXAF(a.balance)}</td>
                      <td className="py-3 text-gray-400 text-xs">{formatDate(a.created_at)}</td>
                      <td className="py-3 text-gray-400 text-xs">{formatDate(a.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
