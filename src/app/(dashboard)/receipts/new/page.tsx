"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, ErrorText } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { formatNaira, round2 } from "@/lib/currency";
import { Plus, Trash2, UserPlus, Search } from "lucide-react";

interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}
interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  category_name?: string;
}
interface LineItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "POS", label: "POS" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
];

export default function CreateReceiptPage() {
  const router = useRouter();
  const toast = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({ fullName: "", phone: "", email: "", address: "" });

  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, discount: 0 },
  ]);

  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [customerMessage, setCustomerMessage] = useState(
    "Thank you for shopping with Sanya Gold Jewelry."
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []));
    fetch("/api/products?status=ACTIVE")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setTaxEnabled(!!d.business?.tax_enabled);
        setTaxRate(d.business?.tax_rate || 0);
        setCustomerMessage(d.business?.footer_message || customerMessage);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 8);
    const q = customerSearch.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          (c.phone || "").includes(q) ||
          (c.email || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [customers, customerSearch]);

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, discount: 0 }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }
  function selectProductForLine(idx: number, productId: string) {
    const p = products.find((p) => p.id === productId);
    if (!p) {
      updateItem(idx, { productId: undefined });
      return;
    }
    updateItem(idx, { productId: p.id, description: p.name, unitPrice: p.price });
  }

  const subtotal = round2(items.reduce((s, it) => s + it.quantity * it.unitPrice, 0));
  const discountTotal = round2(items.reduce((s, it) => s + (it.discount || 0), 0));
  const netAfterDiscount = round2(subtotal - discountTotal);
  const taxTotal = taxEnabled ? round2(netAfterDiscount * (taxRate / 100)) : 0;
  const total = round2(netAfterDiscount + taxTotal);
  const paidNum = Number(amountPaid) || 0;
  const balance = round2(total - paidNum);
  const previewStatus = paidNum <= 0 ? "PENDING" : paidNum >= total ? "PAID" : "PARTIALLY_PAID";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (customerMode === "existing" && !selectedCustomerId) {
      setError("Please select an existing customer or switch to creating a new one.");
      return;
    }
    if (customerMode === "new" && !newCustomer.fullName.trim()) {
      setError("Please enter the customer's name.");
      return;
    }
    const cleanItems = items.filter((it) => it.description.trim());
    if (cleanItems.length === 0) {
      setError("Please add at least one item to the receipt.");
      return;
    }
    for (const it of cleanItems) {
      if (it.quantity <= 0) {
        setError("Quantity must be greater than zero for every item.");
        return;
      }
    }
    if (paidNum > total) {
      setError("Payment amount cannot exceed the total amount.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        items: cleanItems,
        paymentMethod,
        amountPaid: paidNum,
        notes,
        customerMessage,
      };
      if (customerMode === "existing") {
        payload.customerId = selectedCustomerId;
      } else {
        payload.newCustomer = newCustomer;
      }
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to generate receipt. Please try again.");
      }
      toast.push("success", `Receipt ${data.sale.receipt_number} generated successfully.`);
      router.push(`/receipts/${data.sale.id}`);
    } catch (err: any) {
      setError(err.message || "Unable to generate receipt. Please try again.");
      toast.push("error", err.message || "Unable to generate receipt. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Topbar title="Create Receipt" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-5xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode("existing")}
                  className={`px-3 py-1.5 rounded-sm border ${
                    customerMode === "existing" ? "bg-ink text-white border-ink" : "border-line text-ink/60"
                  }`}
                >
                  Existing customer
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode("new")}
                  className={`px-3 py-1.5 rounded-sm border flex items-center gap-1 ${
                    customerMode === "new" ? "bg-ink text-white border-ink" : "border-line text-ink/60"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" /> New customer
                </button>
              </div>
            </CardHeader>
            <CardBody>
              {customerMode === "existing" ? (
                <div>
                  <div className="relative mb-3">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
                    <Input
                      placeholder="Search customers by name or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                    {filteredCustomers.length === 0 && (
                      <p className="text-sm text-ink/45 col-span-2 py-4 text-center">
                        No customers found. Switch to &quot;New customer&quot; to add one.
                      </p>
                    )}
                    {filteredCustomers.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`text-left px-3.5 py-2.5 rounded-sm border text-sm ${
                          selectedCustomerId === c.id
                            ? "border-gold-deep bg-gold-pale/40"
                            : "border-line hover:bg-paper-warm"
                        }`}
                      >
                        <p className="font-medium truncate">{c.full_name}</p>
                        <p className="text-xs text-ink/50 truncate">{c.phone || c.email || "—"}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label required>Full Name</Label>
                    <Input
                      value={newCustomer.fullName}
                      onChange={(e) => setNewCustomer((s) => ({ ...s, fullName: e.target.value }))}
                      placeholder="e.g. Chiamaka Okafor"
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer((s) => ({ ...s, phone: e.target.value }))}
                      placeholder="08031234567"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer((s) => ({ ...s, email: e.target.value }))}
                      placeholder="customer@email.com"
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer((s) => ({ ...s, address: e.target.value }))}
                      placeholder="Delivery / billing address"
                    />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="border border-line rounded-sm p-3.5 sm:p-4 relative">
                  <div className="grid sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <Label>Product (optional)</Label>
                      <Select
                        value={item.productId || ""}
                        onChange={(e) => selectProductForLine(idx, e.target.value)}
                      >
                        <option value="">Custom item / describe below</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {formatNaira(p.price)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="sm:col-span-7">
                      <Label required>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        placeholder="e.g. Elegant Italian Gold Chain"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Label required>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Label required>Unit Price (₦)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Label>Discount (₦)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(idx, { discount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-col">
                      <Label>Subtotal</Label>
                      <div className="min-h-[44px] flex items-center text-sm font-medium">
                        {formatNaira(round2(item.quantity * item.unitPrice - (item.discount || 0)))}
                      </div>
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      aria-label="Remove item"
                      className="absolute top-3 right-3 text-ink/30 hover:text-[var(--color-danger)] p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" /> Add another item
              </Button>
            </CardBody>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <Label required>Payment Method</Label>
                  <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Amount Paid (₦)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00 for pending payment"
                  />
                </div>
              </div>

              <div className="bg-paper-warm rounded-sm p-4 sm:p-5 space-y-2">
                <Row label="Subtotal" value={formatNaira(subtotal)} />
                <Row label="Discount" value={`-${formatNaira(discountTotal)}`} />
                {taxEnabled && <Row label={`Tax / Service (${taxRate}%)`} value={formatNaira(taxTotal)} />}
                <div className="border-t border-line my-2" />
                <Row label="Total" value={formatNaira(total)} bold />
                <Row label="Amount Paid" value={formatNaira(paidNum)} />
                <Row label="Balance" value={formatNaira(balance)} bold={balance > 0} />
                <div className="pt-2">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-sm text-[11px] font-semibold ${
                      previewStatus === "PAID"
                        ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                        : previewStatus === "PARTIALLY_PAID"
                        ? "bg-[var(--color-warning-bg)] text-[var(--color-warning)]"
                        : "bg-[var(--color-info-bg)] text-[var(--color-info)]"
                    }`}
                  >
                    Will be marked: {previewStatus.replace("_", " ")}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Additional info */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardBody className="grid gap-4">
              <div>
                <Label>Notes (internal)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes about this sale (not shown on the receipt)"
                />
              </div>
              <div>
                <Label>Customer Message (shown on receipt)</Label>
                <Textarea
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          <ErrorText>{error}</ErrorText>

          <div className="flex justify-end gap-3 pb-6">
            <Button type="submit" variant="secondary" size="lg" loading={submitting}>
              {submitting ? "Generating..." : "Generate Receipt"}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink/55">{label}</span>
      <span className={bold ? "font-semibold text-ink" : "text-ink/80"}>{value}</span>
    </div>
  );
}
