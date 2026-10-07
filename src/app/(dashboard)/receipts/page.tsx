"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { formatNaira } from "@/lib/currency";
import { Search, Receipt as ReceiptIcon, FilePlus2 } from "lucide-react";

interface SaleRow {
  id: string;
  receipt_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  staff_name: string | null;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
}

export default function ReceiptsPage() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("newest");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    if (paymentMethod) params.set("paymentMethod", paymentMethod);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("pageSize", "10");

    fetch(`/api/sales?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows || []);
        setTotal(d.total || 0);
        setPageCount(d.pageCount || 1);
      })
      .finally(() => setLoading(false));
  }, [search, paymentStatus, paymentMethod, dateFrom, dateTo, sort, page]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, paymentStatus, paymentMethod, dateFrom, dateTo, sort]);

  const hasFilters = !!(search || paymentStatus || paymentMethod || dateFrom || dateTo);

  return (
    <>
      <Topbar title="Receipts" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto">
        <div className="flex items-center justify-between mb-4 gap-3">
          <p className="text-sm text-ink/55">{total} receipt{total === 1 ? "" : "s"}</p>
          <Link href="/receipts/new">
            <Button variant="secondary" size="sm">
              <FilePlus2 className="h-4 w-4" /> Create Receipt
            </Button>
          </Link>
        </div>

        <Card className="mb-4 p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
              <Input
                placeholder="Receipt no, customer, phone, amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="">All payment statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="">All methods</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="POS">POS</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-center justify-between mt-3">
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount_desc">Amount: High to low</option>
              <option value="amount_asc">Amount: Low to high</option>
            </Select>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setPaymentStatus("");
                  setPaymentMethod("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-xs text-gold-deep hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </Card>

        <Card>
          {loading ? (
            <div className="py-20 text-center text-sm text-ink/40">Loading receipts...</div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<ReceiptIcon className="h-5 w-5" />}
              title={hasFilters ? "No transactions match your filters." : "No receipts yet."}
              description={
                hasFilters
                  ? "Try adjusting your search or filters."
                  : "Create your first receipt to start tracking sales."
              }
              action={
                !hasFilters && (
                  <Link href="/receipts/new">
                    <Button variant="secondary" size="sm">
                      Create Receipt
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink/45 border-b border-line">
                      <th className="px-5 py-3 font-medium">Receipt No.</th>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Payment</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Staff</th>
                      <th className="px-5 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper-warm">
                        <td className="px-5 py-3.5 font-medium text-gold-deep">
                          {r.receipt_number}
                          {r.status === "CANCELLED" && (
                            <span className="ml-2 text-[10px] text-[var(--color-danger)]">(cancelled)</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <p>{r.customer_name || "—"}</p>
                          <p className="text-xs text-ink/40">{r.customer_phone}</p>
                        </td>
                        <td className="px-5 py-3.5">{formatNaira(r.total)}</td>
                        <td className="px-5 py-3.5">{r.payment_method.replace("_", " ")}</td>
                        <td className="px-5 py-3.5">
                          <PaymentStatusBadge status={r.payment_status} />
                        </td>
                        <td className="px-5 py-3.5 text-ink/55">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-ink/55">{r.staff_name || "—"}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/receipts/${r.id}`} className="text-xs text-gold-deep hover:underline">
                            View
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
                      <p className="text-xs text-ink/55 truncate">{r.customer_name || "—"}</p>
                      <p className="text-[11px] text-ink/40 mt-0.5">
                        {new Date(r.created_at).toLocaleDateString()} · {r.payment_method.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right flex-none">
                      <p className="text-sm font-medium">{formatNaira(r.total)}</p>
                      <PaymentStatusBadge status={r.payment_status} />
                    </div>
                  </Link>
                ))}
              </div>

              <Pagination page={page} pageCount={pageCount} onChange={setPage} total={total} pageSize={10} />
            </>
          )}
        </Card>
      </main>
    </>
  );
}
