"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, ErrorText } from "@/components/ui/Field";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatNaira } from "@/lib/currency";
import { Pencil, Receipt as ReceiptIcon, Loader2 } from "lucide-react";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.customer) {
          setForm({
            fullName: d.customer.full_name,
            phone: d.customer.phone || "",
            email: d.customer.email || "",
            address: d.customer.address || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.fullName.trim()) {
      setError("Please enter the customer's name.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.push("success", "Customer updated.");
      setEditing(false);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) {
    return (
      <>
        <Topbar title="Customer" />
        <main className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-ink/40" />
        </main>
      </>
    );
  }

  if (data.error) {
    return (
      <>
        <Topbar title="Customer" />
        <main className="flex-1 px-6 py-16 text-center text-ink/50">{data.error}</main>
      </>
    );
  }

  const { customer, receipts } = data;

  return (
    <>
      <Topbar title={customer.full_name} />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-5xl w-full mx-auto">
        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <button onClick={() => setEditing((e) => !e)} className="text-ink/40 hover:text-ink">
                <Pencil className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardBody>
              {editing ? (
                <form onSubmit={handleSave}>
                  <div className="mb-3">
                    <Label required>Full Name</Label>
                    <Input value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <Label>Email</Label>
                    <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
                  </div>
                  <div className="mb-4">
                    <Label>Address</Label>
                    <Input value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
                  </div>
                  <ErrorText>{error}</ErrorText>
                  <div className="flex gap-2">
                    <Button type="submit" variant="secondary" size="sm" loading={saving}>
                      Save
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-ink/40">Phone</dt>
                    <dd>{customer.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink/40">Email</dt>
                    <dd>{customer.email || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink/40">Address</dt>
                    <dd>{customer.address || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink/40">Customer since</dt>
                    <dd>{new Date(customer.created_at).toLocaleDateString()}</dd>
                  </div>
                </dl>
              )}
            </CardBody>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <Card className="p-5">
              <p className="text-xs text-ink/50">Total Spent</p>
              <p className="font-serif text-2xl mt-1">{formatNaira(customer.total_spent)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-ink/50">Number of Purchases</p>
              <p className="font-serif text-2xl mt-1">{customer.purchase_count}</p>
            </Card>
            <Card className="p-5 col-span-2">
              <Link href={`/receipts/new`}>
                <Button variant="secondary" size="sm">
                  Create Receipt for {customer.full_name.split(" ")[0]}
                </Button>
              </Link>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Receipts</CardTitle>
          </CardHeader>
          {receipts.length === 0 ? (
            <EmptyState
              icon={<ReceiptIcon className="h-5 w-5" />}
              title="No receipts yet."
              description="This customer doesn't have any receipts yet."
            />
          ) : (
            <div className="divide-y divide-line">
              {receipts.map((r: any) => (
                <Link
                  key={r.id}
                  href={`/receipts/${r.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-paper-warm"
                >
                  <div>
                    <p className="text-sm font-medium text-gold-deep">{r.receipt_number}</p>
                    <p className="text-xs text-ink/45">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatNaira(r.total)}</p>
                    <PaymentStatusBadge status={r.status === "CANCELLED" ? "CANCELLED" : r.payment_status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
