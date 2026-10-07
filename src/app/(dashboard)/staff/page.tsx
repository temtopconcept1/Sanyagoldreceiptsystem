"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, ErrorText } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { UserPlus, ShieldAlert } from "lucide-react";

export default function StaffPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  function load() {
    setLoading(true);
    fetch("/api/staff")
      .then((r) => r.json())
      .then((d) => setStaff(d.staff || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isSuperAdmin) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.push("success", "Staff account created.");
      setModalOpen(false);
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(id: string, status: string) {
    const next = status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const res = await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const d = await res.json();
    if (!res.ok) {
      toast.push("error", d.error);
      return;
    }
    load();
  }

  if (!isSuperAdmin) {
    return (
      <>
        <Topbar title="Staff / Users" />
        <main className="flex-1 flex items-center justify-center py-24 px-6">
          <div className="text-center max-w-sm">
            <ShieldAlert className="h-8 w-8 text-ink/30 mx-auto mb-3" />
            <p className="font-serif text-lg mb-1">Super Admin access required</p>
            <p className="text-sm text-ink/50">
              Staff account management is limited to Super Admin users.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Staff / Users" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-4xl w-full mx-auto">
        <div className="flex justify-end mb-4">
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Staff
          </Button>
        </div>

        <Card>
          {loading ? (
            <div className="py-20 text-center text-sm text-ink/40">Loading...</div>
          ) : (
            <div className="divide-y divide-line">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-4 flex-wrap">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-ink/50">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={s.role === "SUPER_ADMIN" ? "gold" : "neutral"}>
                      {s.role === "SUPER_ADMIN" ? "Super Admin" : "Staff"}
                    </Badge>
                    <Badge tone={s.status === "ACTIVE" ? "success" : "danger"}>{s.status}</Badge>
                    <button
                      onClick={() => toggleStatus(s.id, s.status)}
                      className="text-xs text-gold-deep hover:underline"
                    >
                      {s.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Account" size="sm">
        <form onSubmit={handleCreate}>
          <div className="mb-4">
            <Label required>Full Name</Label>
            <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div className="mb-4">
            <Label required>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          </div>
          <div className="mb-4">
            <Label required>Temporary Password</Label>
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              placeholder="At least 6 characters"
            />
          </div>
          <div className="mb-5">
            <Label required>Role</Label>
            <Select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
              <option value="STAFF">Staff</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </Select>
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" variant="secondary" fullWidth loading={submitting}>
            Create Account
          </Button>
        </form>
      </Modal>
    </>
  );
}
