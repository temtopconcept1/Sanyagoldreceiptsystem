"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell, CheckCheck } from "lucide-react";

const typeTone: Record<string, string> = {
  RECEIPT_CREATED: "text-[var(--color-success)]",
  RECEIPT_CANCELLED: "text-[var(--color-danger)]",
  PAYMENT_RECEIVED: "text-[var(--color-success)]",
  OUTSTANDING_BALANCE: "text-[var(--color-warning)]",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setItems(d.notifications || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    load();
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    load();
  }

  return (
    <>
      <Topbar title="Notifications" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-3xl w-full mx-auto">
        <div className="flex justify-end mb-3">
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        </div>
        <Card>
          {loading ? (
            <div className="py-20 text-center text-sm text-ink/40">Loading...</div>
          ) : items.length === 0 ? (
            <EmptyState icon={<Bell className="h-5 w-5" />} title="No notifications yet." />
          ) : (
            <div className="divide-y divide-line">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-3 px-5 py-4 ${!n.read ? "bg-paper-warm/60" : ""}`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Bell className={`h-4 w-4 mt-0.5 flex-none ${typeTone[n.type] || "text-ink/40"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-sm text-ink/55">{n.message}</p>
                      <p className="text-[11px] text-ink/35 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      {n.link && (
                        <Link href={n.link} className="text-xs text-gold-deep hover:underline">
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-[11px] text-ink/40 hover:text-ink flex-none"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
