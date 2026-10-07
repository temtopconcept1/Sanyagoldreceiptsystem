"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { formatNaira } from "@/lib/currency";
import { Wallet } from "lucide-react";

export default function PaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort: "newest", page: String(page), pageSize: "12" });
    if (status) params.set("paymentStatus", status);
    fetch(`/api/sales?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows || []);
        setTotal(d.total || 0);
        setPageCount(d.pageCount || 1);
      })
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setPage(1), [status]);

  return (
    <>
      <Topbar title="Payments" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto">
        <Card className="p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-ink/55">{total} transaction{total === 1 ? "" : "s"}</p>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
            <option value="">All payment statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </Card>

        <Card>
          {loading ? (
            <div className="py-20 text-center text-sm text-ink/40">Loading...</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={<Wallet className="h-5 w-5" />} title="No transactions match your filters." />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink/45 border-b border-line">
                      <th className="px-5 py-3 font-medium">Receipt No.</th>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Total</th>
                      <th className="px-5 py-3 font-medium">Paid</th>
                      <th className="px-5 py-3 font-medium">Balance</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper-warm">
                        <td className="px-5 py-3.5 font-medium text-gold-deep">{r.receipt_number}</td>
                        <td className="px-5 py-3.5">{r.customer_name || "—"}</td>
                        <td className="px-5 py-3.5">{formatNaira(r.total)}</td>
                        <td className="px-5 py-3.5">{formatNaira(r.amount_paid)}</td>
                        <td className="px-5 py-3.5">{formatNaira(r.balance)}</td>
                        <td className="px-5 py-3.5">
                          <PaymentStatusBadge status={r.payment_status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/receipts/${r.id}`} className="text-xs text-gold-deep hover:underline">
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-line">
                {rows.map((r) => (
                  <Link key={r.id} href={`/receipts/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gold-deep truncate">{r.receipt_number}</p>
                      <p className="text-xs text-ink/55 truncate">{r.customer_name}</p>
                      <p className="text-[11px] text-ink/40">Balance: {formatNaira(r.balance)}</p>
                    </div>
                    <PaymentStatusBadge status={r.payment_status} />
                  </Link>
                ))}
              </div>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} total={total} pageSize={12} />
            </>
          )}
        </Card>
      </main>
    </>
  );
}
