"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { SalesChart } from "@/components/charts/SalesChart";
import { formatNaira } from "@/lib/currency";
import { Download } from "lucide-react";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: "Today", from: todayIso(), to: todayIso() },
  { label: "This Week", from: daysAgoIso(7), to: todayIso() },
  { label: "This Month", from: daysAgoIso(30), to: todayIso() },
  { label: "This Year", from: daysAgoIso(365), to: todayIso() },
];

export default function ReportsPage() {
  const [from, setFrom] = useState(daysAgoIso(30));
  const [to, setTo] = useState(todayIso());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then(setReport)
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  function exportCsv() {
    if (!report) return;
    const lines = [
      ["Date", "Transactions", "Total Sales"],
      ...report.byDay.map((d: any) => [d.day, d.count, d.total.toFixed(2)]),
    ];
    const csv = lines.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sanya-gold-sales-report-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totals = report?.totals;

  return (
    <>
      <Topbar title="Reports" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto">
        <Card className="p-4 mb-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setFrom(p.from);
                    setTo(p.to);
                  }}
                  className="px-3 py-1.5 text-xs rounded-sm border border-line hover:border-gold-deep text-ink/60"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2 ml-auto">
              <div>
                <label className="block text-[10px] text-ink/45 mb-1">From</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
              </div>
              <div>
                <label className="block text-[10px] text-ink/45 mb-1">To</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
              </div>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={!report}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {loading || !totals ? (
          <div className="py-20 text-center text-sm text-ink/40">Loading report...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
              <Card className="p-4">
                <p className="text-xs text-ink/50">Total Sales</p>
                <p className="font-serif text-xl mt-1">{formatNaira(totals.totalSales)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-ink/50">Transactions</p>
                <p className="font-serif text-xl mt-1">{totals.txCount}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-ink/50">Average Transaction</p>
                <p className="font-serif text-xl mt-1">{formatNaira(totals.avgTx || 0)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-ink/50">Outstanding Balance</p>
                <p className="font-serif text-xl mt-1">{formatNaira(totals.outstanding)}</p>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Sales Trend</CardTitle>
                </CardHeader>
                <CardBody>
                  <SalesChart data={report.byDay} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>By Payment Method</CardTitle>
                </CardHeader>
                <CardBody className="space-y-3">
                  {report.byMethod.length === 0 && (
                    <p className="text-sm text-ink/40">No transactions in this range.</p>
                  )}
                  {report.byMethod.map((m: any) => (
                    <div key={m.payment_method} className="flex justify-between text-sm">
                      <span className="text-ink/60">{m.payment_method.replace("_", " ")}</span>
                      <span className="font-medium">{formatNaira(m.total)}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5">
              <Card className="p-4">
                <p className="text-xs text-ink/50">Paid Transactions</p>
                <p className="font-serif text-lg mt-1 text-[var(--color-success)]">{totals.paidCount}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-ink/50">Pending Transactions</p>
                <p className="font-serif text-lg mt-1 text-[var(--color-warning)]">{totals.pendingCount}</p>
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
}
