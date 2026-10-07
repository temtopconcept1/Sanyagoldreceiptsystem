"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { formatNaira } from "@/lib/currency";
import {
  Download,
  Printer,
  Share2,
  MessageCircle,
  Mail,
  Link2,
  ShieldCheck,
  Ban,
  Wallet,
  Loader2,
} from "lucide-react";

export default function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [paySubmitting, setPaySubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/sales/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <>
        <Topbar title="Receipt" />
        <main className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-ink/40" />
        </main>
      </>
    );
  }

  if (data.error) {
    return (
      <>
        <Topbar title="Receipt" />
        <main className="flex-1 px-6 py-16 text-center text-ink/50">{data.error}</main>
      </>
    );
  }

  const { sale, items, customer, staff, business, payments } = data;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const verifyUrl = `${origin}/verify/${encodeURIComponent(sale.receipt_number)}`;

  const waMessage = encodeURIComponent(
    `Hello ${customer.full_name}, here is your receipt from ${business.name}.\n\n` +
      `Receipt: ${sale.receipt_number}\nTotal: ${formatNaira(sale.total)}\nStatus: ${sale.payment_status.replace("_", " ")}\n\n` +
      `Verify this receipt: ${verifyUrl}\n\n${business.footer_message}`
  );
  const waPhone = customer.phone ? customer.phone.replace(/\D/g, "") : business.whatsapp;
  const waHref = `https://wa.me/${waPhone?.startsWith("0") ? "234" + waPhone.slice(1) : waPhone}?text=${waMessage}`;

  const mailHref = `mailto:${customer.email || ""}?subject=${encodeURIComponent(
    `Your receipt from ${business.name} — ${sale.receipt_number}`
  )}&body=${encodeURIComponent(
    `Hello ${customer.full_name},\n\nThank you for your purchase. Your receipt ${sale.receipt_number} totalling ${formatNaira(
      sale.total
    )} is attached/linked below.\n\nVerify: ${verifyUrl}\n\n${business.footer_message}`
  )}`;

  async function handleShare() {
    const shareData = {
      title: `Receipt ${sale.receipt_number}`,
      text: `Receipt ${sale.receipt_number} — ${formatNaira(sale.total)}`,
      url: verifyUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(verifyUrl);
      toast.push("success", "Verification link copied to clipboard.");
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(verifyUrl);
    toast.push("success", "Link copied to clipboard.");
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/sales/${id}/cancel`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Unable to cancel receipt.");
      toast.push("success", "Receipt cancelled.");
      setCancelOpen(false);
      load();
    } catch (err: any) {
      toast.push("error", err.message);
    } finally {
      setCancelling(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setPaySubmitting(true);
    try {
      const res = await fetch(`/api/sales/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(payAmount), method: payMethod }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Unable to record payment.");
      toast.push("success", "Payment recorded.");
      setPayOpen(false);
      setPayAmount("");
      load();
    } catch (err: any) {
      toast.push("error", err.message);
    } finally {
      setPaySubmitting(false);
    }
  }

  return (
    <>
      <Topbar title={`Receipt ${sale.receipt_number}`} />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-4xl w-full mx-auto">
        {/* Action bar */}
        <div className="no-print flex flex-wrap gap-2 mb-5">
          <a href={`/api/sales/${id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </a>
          <a href={mailHref}>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4" /> Email
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Link2 className="h-4 w-4" /> Copy Link
          </Button>
          <Link href={`/verify/${encodeURIComponent(sale.receipt_number)}`} target="_blank">
            <Button variant="outline" size="sm">
              <ShieldCheck className="h-4 w-4" /> Verify
            </Button>
          </Link>
          {sale.status === "ACTIVE" && sale.payment_status !== "PAID" && (
            <Button variant="secondary" size="sm" onClick={() => setPayOpen(true)}>
              <Wallet className="h-4 w-4" /> Record Payment
            </Button>
          )}
          {sale.status === "ACTIVE" && (
            <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>
              <Ban className="h-4 w-4" /> Cancel
            </Button>
          )}
        </div>

        {/* Receipt */}
        <Card id="printable-receipt" className="p-6 sm:p-10">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b-2 border-gold pb-5 mb-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-ink">{business.name}</h2>
              <p className="text-xs tracking-widest text-gold-deep uppercase mt-1">{business.tagline}</p>
              <p className="text-xs text-ink/55 mt-3 leading-relaxed">
                {business.address}
                <br />
                {business.phone && `Phone: ${business.phone}`} {business.email && ` · ${business.email}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-widest text-ink/40 uppercase">Receipt Number</p>
              <p className="font-serif text-xl text-gold-deep">{sale.receipt_number}</p>
              <p className="text-xs text-ink/50 mt-1">
                {new Date(sale.created_at).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <div className="mt-2">
                <PaymentStatusBadge status={sale.status === "CANCELLED" ? "CANCELLED" : sale.payment_status} />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-[10px] tracking-widest text-ink/40 uppercase mb-1.5">Billed To</p>
              <p className="text-sm font-medium">{customer.full_name}</p>
              {customer.phone && <p className="text-sm text-ink/60">{customer.phone}</p>}
              {customer.email && <p className="text-sm text-ink/60">{customer.email}</p>}
              {customer.address && <p className="text-sm text-ink/60">{customer.address}</p>}
            </div>
            <div>
              <p className="text-[10px] tracking-widest text-ink/40 uppercase mb-1.5">Served By</p>
              <p className="text-sm font-medium">{staff.name}</p>
              <p className="text-[10px] tracking-widest text-ink/40 uppercase mt-3 mb-1.5">Payment Method</p>
              <p className="text-sm">{sale.payment_method.replace("_", " ")}</p>
            </div>
          </div>

          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10.5px] tracking-wide text-ink/40 uppercase bg-paper-warm">
                  <th className="px-3 py-2.5 font-medium">Description</th>
                  <th className="px-3 py-2.5 font-medium text-center">Qty</th>
                  <th className="px-3 py-2.5 font-medium text-right">Unit Price</th>
                  <th className="px-3 py-2.5 font-medium text-right">Discount</th>
                  <th className="px-3 py-2.5 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it: any) => (
                  <tr key={it.id} className="border-b border-line">
                    <td className="px-3 py-2.5">{it.description}</td>
                    <td className="px-3 py-2.5 text-center">{it.quantity}</td>
                    <td className="px-3 py-2.5 text-right">{formatNaira(it.unit_price)}</td>
                    <td className="px-3 py-2.5 text-right">{it.discount ? formatNaira(it.discount) : "—"}</td>
                    <td className="px-3 py-2.5 text-right">{formatNaira(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-6">
            <div className="w-full sm:w-72 space-y-1.5 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>Subtotal</span>
                <span>{formatNaira(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Discount</span>
                <span>-{formatNaira(sale.discount_total)}</span>
              </div>
              {sale.tax_total > 0 && (
                <div className="flex justify-between text-ink/60">
                  <span>Tax / Service Charge</span>
                  <span>{formatNaira(sale.tax_total)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base border-t border-gold pt-2 mt-2">
                <span>Total</span>
                <span className="text-gold-deep">{formatNaira(sale.total)}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Amount Paid</span>
                <span>{formatNaira(sale.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Balance</span>
                <span>{formatNaira(sale.balance)}</span>
              </div>
            </div>
          </div>

          {sale.notes && (
            <div className="mb-6">
              <p className="text-[10px] tracking-widest text-ink/40 uppercase mb-1">Notes</p>
              <p className="text-sm text-ink/70">{sale.notes}</p>
            </div>
          )}

          {payments.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] tracking-widest text-ink/40 uppercase mb-2">Payment History</p>
              <div className="space-y-1.5">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-xs text-ink/55">
                    <span>
                      {new Date(p.created_at).toLocaleDateString()} · {p.method.replace("_", " ")}
                    </span>
                    <span>{formatNaira(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-line pt-5 flex items-end justify-between flex-wrap gap-4">
            <div className="max-w-sm">
              <p className="text-sm italic text-ink/70">{sale.customer_message || business.footer_message}</p>
              <p className="text-[10.5px] text-ink/40 mt-2 leading-relaxed">{business.terms_note}</p>
            </div>
            <div className="text-center flex-none">
              <div className="h-20 w-20 bg-paper-warm border border-line flex items-center justify-center text-[9px] text-ink/40">
                QR in PDF
              </div>
              <p className="text-[9px] text-ink/40 mt-1">{sale.verification_token.slice(0, 10)}</p>
            </div>
          </div>
        </Card>
      </main>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this receipt?" size="sm">
        <p className="text-sm text-ink/60 mb-5">
          This marks <strong>{sale.receipt_number}</strong> as cancelled. This cannot be undone from here.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCancelOpen(false)}>
            Keep receipt
          </Button>
          <Button variant="danger" size="sm" loading={cancelling} onClick={handleCancel}>
            Cancel receipt
          </Button>
        </div>
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record a payment" size="sm">
        <form onSubmit={handleRecordPayment}>
          <div className="mb-4">
            <Label required>Amount (₦)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
            />
            <p className="text-xs text-ink/45 mt-1">Outstanding balance: {formatNaira(sale.balance)}</p>
          </div>
          <div className="mb-5">
            <Label required>Payment Method</Label>
            <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="POS">POS</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <Button type="submit" variant="secondary" fullWidth loading={paySubmitting}>
            Record Payment
          </Button>
        </form>
      </Modal>
    </>
  );
}
