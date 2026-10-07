"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ShieldCheck } from "lucide-react";

export default function AuditLogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/audit-logs?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows || []);
        setTotal(d.total || 0);
        setPageCount(d.pageCount || 1);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Topbar title="Audit Logs" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto">
        <Card>
          {loading ? (
            <div className="py-20 text-center text-sm text-ink/40">Loading...</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title="No activity recorded yet." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink/45 border-b border-line">
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                      <th className="px-5 py-3 font-medium">Details</th>
                      <th className="px-5 py-3 font-medium">Date/Time</th>
                      <th className="px-5 py-3 font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r: any) => (
                      <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper-warm">
                        <td className="px-5 py-3.5">{r.user_name || "System"}</td>
                        <td className="px-5 py-3.5">
                          <Badge tone="gold">{r.action.replace(/_/g, " ")}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-ink/60 max-w-xs truncate">{r.details || "—"}</td>
                        <td className="px-5 py-3.5 text-ink/50">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-ink/40">{r.ip_address || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} total={total} pageSize={25} />
            </>
          )}
        </Card>
      </main>
    </>
  );
}
