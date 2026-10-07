import React from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SalesChart } from "@/components/charts/SalesChart";
import { getCurrentUser } from "@/lib/session";
import { dashboardStats } from "@/lib/repositories/sales";
import { formatNaira } from "@/lib/currency";
import {
  TrendingUp,
  Wallet,
  Receipt,
  Users,
  Clock,
  CheckCircle2,
  FilePlus2,
  UserPlus,
  PackagePlus,
  ListChecks,
  Receipt as ReceiptIcon,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const stats = dashboardStats(user!.businessId);

  const cards = [
    {
      label: "Today's Sales",
      value: formatNaira(stats.todaySalesTotal),
      sub: `${stats.todaySalesCount} receipt${stats.todaySalesCount === 1 ? "" : "s"} today`,
      icon: TrendingUp,
    },
    {
      label: "Total Revenue",
      value: formatNaira(stats.totalRevenue),
      sub: "Amount actually collected",
      icon: Wallet,
    },
    {
      label: "Receipts Generated",
      value: stats.receiptsGenerated.toLocaleString(),
      sub: "All time",
      icon: Receipt,
    },
    {
      label: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      sub: "In your customer book",
      icon: Users,
    },
    {
      label: "Pending Payments",
      value: formatNaira(stats.pendingPaymentsTotal),
      sub: `${stats.pendingPaymentsCount} outstanding`,
      icon: Clock,
    },
    {
      label: "Completed Payments",
      value: stats.completedPaymentsCount.toLocaleString(),
      sub: "Fully paid receipts",
      icon: CheckCircle2,
    },
  ];

  const quickActions = [
    { href: "/receipts/new", label: "Create Receipt", icon: FilePlus2 },
    { href: "/customers?new=1", label: "Add Customer", icon: UserPlus },
    { href: "/products?new=1", label: "Add Product", icon: PackagePlus },
    { href: "/receipts", label: "View Receipts", icon: ListChecks },
  ];

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {cards.map((c) => (
            <Card key={c.label} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-ink/50 truncate">{c.label}</p>
                  <p className="font-serif text-lg sm:text-2xl text-ink mt-1 truncate">{c.value}</p>
                  <p className="text-[10.5px] sm:text-xs text-ink/40 mt-1 truncate">{c.sub}</p>
                </div>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gold-pale text-gold-deep flex items-center justify-center flex-none">
                  <c.icon className="h-4 w-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <span className="text-xs text-ink/45">Last 14 days</span>
            </CardHeader>
            <CardBody>
              <SalesChart data={stats.chart.map((d) => ({ day: d.day, total: d.total }))} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-3">
              {quickActions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex flex-col items-center justify-center gap-2 border border-line rounded-sm px-3 py-5 text-center hover:border-gold-deep hover:bg-paper-warm transition-colors min-h-[96px]"
                >
                  <a.icon className="h-5 w-5 text-gold-deep" />
                  <span className="text-xs font-medium text-ink/80">{a.label}</span>
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <Link href="/receipts">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          {stats.recent.length === 0 ? (
            <EmptyState
              icon={<ReceiptIcon className="h-5 w-5" />}
              title="No receipts yet."
              description="Create your first receipt to start tracking sales."
              action={
                <Link href="/receipts/new">
                  <Button variant="secondary" size="sm">
                    Create Receipt
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink/45 border-b border-line">
                      <th className="px-5 py-3 font-medium">Receipt No.</th>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Method</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((r: any) => (
                      <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper-warm">
                        <td className="px-5 py-3.5 font-medium text-gold-deep">{r.receipt_number}</td>
                        <td className="px-5 py-3.5">{r.customer_name || "—"}</td>
                        <td className="px-5 py-3.5">{formatNaira(r.total)}</td>
                        <td className="px-5 py-3.5">{r.payment_method.replace("_", " ")}</td>
                        <td className="px-5 py-3.5">
                          <PaymentStatusBadge status={r.payment_status} />
                        </td>
                        <td className="px-5 py-3.5 text-ink/55">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
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

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-line">
                {stats.recent.map((r: any) => (
                  <Link
                    key={r.id}
                    href={`/receipts/${r.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gold-deep truncate">{r.receipt_number}</p>
                      <p className="text-xs text-ink/55 truncate">{r.customer_name || "—"}</p>
                      <p className="text-[11px] text-ink/40 mt-0.5">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex-none">
                      <p className="text-sm font-medium">{formatNaira(r.total)}</p>
                      <PaymentStatusBadge status={r.payment_status} />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Card>
      </main>
    </>
  );
}
