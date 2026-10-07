"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, ErrorText } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatNaira } from "@/lib/currency";
import { Search, UserPlus, Users } from "lucide-react";

interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  total_spent: number;
  purchase_count: number;
  created_at: string;
}

export default function CustomersPage() {
  const toast = useToast();
  const sp = useSearchParams();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(sp.get("new") === "1");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/customers?${params}`)
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.fullName.trim()) {
      setError("Please enter the customer's name.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.push("success", "Customer added.");
      setModalOpen(false);
      setForm({ fullName: "", phone: "", email: "", address: "" });
      router.replace("/customers");
      load();
    } catch (err: any) {
      setError(err.message || "Unable to add customer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar title="Customers" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Customer
          </Button>
        </div>

        <Card>
          {loading ? (
            <div className="py-20 text-center text-sm text-ink/40">Loading customers...</div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title={search ? "No customers found." : "No customers yet."}
              description={search ? "Try a different search." : "Add your first customer to get started."}
              action={
                !search && (
                  <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
                    Add Customer
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink/45 border-b border-line">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Phone</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Total Spent</th>
                      <th className="px-5 py-3 font-medium">Purchases</th>
                      <th className="px-5 py-3 font-medium">Added</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-b border-line last:border-0 hover:bg-paper-warm">
                        <td className="px-5 py-3.5 font-medium">{c.full_name}</td>
                        <td className="px-5 py-3.5 text-ink/60">{c.phone || "—"}</td>
                        <td className="px-5 py-3.5 text-ink/60">{c.email || "—"}</td>
                        <td className="px-5 py-3.5">{formatNaira(c.total_spent)}</td>
                        <td className="px-5 py-3.5">{c.purchase_count}</td>
                        <td className="px-5 py-3.5 text-ink/50">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/customers/${c.id}`} className="text-xs text-gold-deep hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-line">
                {customers.map((c) => (
                  <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.full_name}</p>
                      <p className="text-xs text-ink/50 truncate">{c.phone || c.email || "—"}</p>
                    </div>
                    <div className="text-right flex-none">
                      <p className="text-sm font-medium">{formatNaira(c.total_spent)}</p>
                      <p className="text-xs text-ink/40">{c.purchase_count} purchase{c.purchase_count === 1 ? "" : "s"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Card>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          router.replace("/customers");
        }}
        title="Add Customer"
        size="sm"
      >
        <form onSubmit={handleCreate}>
          <div className="mb-4">
            <Label required>Full Name</Label>
            <Input value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} />
          </div>
          <div className="mb-4">
            <Label>Phone Number</Label>
            <Input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
          </div>
          <div className="mb-4">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          </div>
          <div className="mb-5">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" variant="secondary" fullWidth loading={submitting}>
            Add Customer
          </Button>
        </form>
      </Modal>
    </>
  );
}
