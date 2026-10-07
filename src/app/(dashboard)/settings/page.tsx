"use client";
import React, { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, HelpText } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

const TABS = ["Business Profile", "Receipt Settings", "Appearance"] as const;

export default function SettingsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Business Profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setForm(d.business))
      .finally(() => setLoading(false));
  }, []);

  function set(key: string, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          tagline: form.tagline,
          logoUrl: form.logo_url,
          address: form.address,
          phone: form.phone,
          whatsapp: form.whatsapp,
          email: form.email,
          website: form.website,
          instagram: form.instagram,
          facebook: form.facebook,
          receiptPrefix: form.receipt_prefix,
          footerMessage: form.footer_message,
          termsNote: form.terms_note,
          showQr: !!form.show_qr,
          primaryColor: form.primary_color,
          secondaryColor: form.secondary_color,
          taxEnabled: !!form.tax_enabled,
          taxRate: Number(form.tax_rate) || 0,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.push("success", "Settings saved.");
      setForm(d.business);
    } catch (err: any) {
      toast.push("error", err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <>
        <Topbar title="Settings" />
        <main className="flex-1 py-24 text-center text-sm text-ink/40">Loading settings...</main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Settings" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-3xl w-full mx-auto">
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-xs sm:text-sm rounded-sm border whitespace-nowrap",
                tab === t ? "bg-ink text-white border-ink" : "border-line text-ink/60"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <Card>
          <CardBody>
            {tab === "Business Profile" && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div>
                    <Label>Tagline</Label>
                    <Input value={form.tagline || ""} onChange={(e) => set("tagline", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input value={form.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
                  <HelpText>Paste a hosted image URL. File upload can be added later (see README).</HelpText>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div>
                    <Label>WhatsApp Number</Label>
                    <Input value={form.whatsapp || ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="2348012345678" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input value={form.website || ""} onChange={(e) => set("website", e.target.value)} />
                  </div>
                  <div>
                    <Label>Instagram</Label>
                    <Input value={form.instagram || ""} onChange={(e) => set("instagram", e.target.value)} />
                  </div>
                  <div>
                    <Label>Facebook</Label>
                    <Input value={form.facebook || ""} onChange={(e) => set("facebook", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {tab === "Receipt Settings" && (
              <div className="space-y-4">
                <div>
                  <Label>Receipt Prefix</Label>
                  <Input value={form.receipt_prefix || ""} onChange={(e) => set("receipt_prefix", e.target.value)} />
                  <HelpText>Receipts are numbered automatically, e.g. {form.receipt_prefix || "SGJ"}-2026-000001.</HelpText>
                </div>
                <div>
                  <Label>Footer Message</Label>
                  <Textarea value={form.footer_message || ""} onChange={(e) => set("footer_message", e.target.value)} />
                </div>
                <div>
                  <Label>Terms / Notes</Label>
                  <Textarea value={form.terms_note || ""} onChange={(e) => set("terms_note", e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.show_qr}
                    onChange={(e) => set("show_qr", e.target.checked)}
                    className="h-4 w-4 accent-[#8B6B1F]"
                  />
                  Show QR verification code on receipts
                </label>
                <div className="border-t border-line pt-4">
                  <label className="flex items-center gap-2 text-sm mb-3">
                    <input
                      type="checkbox"
                      checked={!!form.tax_enabled}
                      onChange={(e) => set("tax_enabled", e.target.checked)}
                      className="h-4 w-4 accent-[#8B6B1F]"
                    />
                    Enable tax / service charge
                  </label>
                  {form.tax_enabled && (
                    <div className="max-w-xs">
                      <Label>Tax Rate (%)</Label>
                      <Input type="number" min={0} max={100} value={form.tax_rate} onChange={(e) => set("tax_rate", e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "Appearance" && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.primary_color}
                        onChange={(e) => set("primary_color", e.target.value)}
                        className="h-10 w-12 border border-line rounded-sm"
                      />
                      <Input value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.secondary_color}
                        onChange={(e) => set("secondary_color", e.target.value)}
                        className="h-10 w-12 border border-line rounded-sm"
                      />
                      <Input value={form.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} />
                    </div>
                  </div>
                </div>
                <HelpText>
                  The default Sanya Gold Jewelry theme (gold + white) is recommended. Colors saved here are stored for
                  future white-label use.
                </HelpText>
              </div>
            )}

            <div className="flex justify-end mt-6 pt-5 border-t border-line">
              <Button variant="secondary" onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
            </div>
          </CardBody>
        </Card>
      </main>
    </>
  );
}
