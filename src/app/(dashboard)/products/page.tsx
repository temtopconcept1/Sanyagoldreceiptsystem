"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, ErrorText } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatNaira } from "@/lib/currency";
import { Search, PackagePlus, Package, Pencil, Archive } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  category_name?: string;
  description: string | null;
  price: number;
  stock: number;
  low_stock_at: number;
  status: "ACTIVE" | "ARCHIVED";
}

const emptyForm = { name: "", sku: "", categoryId: "", description: "", price: "", stock: "" };

export default function ProductsPage() {
  const toast = useToast();
  const sp = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(sp.get("new") === "1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setCategories(d.categories || []);
      })
      .finally(() => setLoading(false));
  }, [search, categoryId]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }
  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      categoryId: p.category_id || "",
      description: p.description || "",
      price: String(p.price),
      stock: String(p.stock),
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Please enter the product name.");
    if (!form.sku.trim()) return setError("Please enter a product code/SKU.");
    if (Number(form.price) < 0) return setError("Price cannot be negative.");

    setSubmitting(true);
    try {
      const res = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price) || 0, stock: Number(form.stock) || 0 }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.push("success", editingId ? "Product updated." : "Product added.");
      setModalOpen(false);
      router.replace("/products");
      load();
    } catch (err: any) {
      setError(err.message || "Unable to save product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive(id: string) {
    if (!confirm("Archive this product? It will no longer appear when creating receipts.")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.push("success", "Product archived.");
      load();
    } else {
      toast.push("error", "Unable to archive product.");
    }
  }

  return (
    <>
      <Topbar title="Products" />
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl w-full mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-1 gap-3 min-w-[260px] flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
              <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-auto">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="secondary" size="sm" onClick={openCreate}>
            <PackagePlus className="h-4 w-4" /> Add Product
          </Button>
        </div>

        <Card>
          {loading ? (
            <div className="py-20 text-center text-sm text-ink/40">Loading products...</div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Package className="h-5 w-5" />}
              title="No products available."
              description="Add your first product to start building receipts faster."
              action={
                <Button variant="secondary" size="sm" onClick={openCreate}>
                  Add Product
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line">
              {products.map((p) => (
                <div key={p.id} className="bg-paper p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge tone="gold">{p.category_name || "Other"}</Badge>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-ink/35 hover:text-ink" aria-label="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {p.status === "ACTIVE" && (
                        <button onClick={() => handleArchive(p.id)} className="p-1.5 text-ink/35 hover:text-[var(--color-danger)]" aria-label="Archive">
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-serif text-base mb-0.5">{p.name}</p>
                  <p className="text-[11px] text-ink/40 mb-2">SKU: {p.sku}</p>
                  {p.description && <p className="text-xs text-ink/55 mb-3 line-clamp-2">{p.description}</p>}
                  <div className="mt-auto flex items-center justify-between">
                    <p className="text-sm font-semibold text-gold-deep">{formatNaira(p.price)}</p>
                    <Badge tone={p.stock <= p.low_stock_at ? "danger" : "neutral"}>
                      {p.stock} in stock
                    </Badge>
                  </div>
                  {p.status === "ARCHIVED" && (
                    <p className="text-[10px] text-ink/35 mt-2 uppercase tracking-wide">Archived</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          router.replace("/products");
        }}
        title={editingId ? "Edit Product" : "Add Product"}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label required>Product Name</Label>
              <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <Label required>Product Code / SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.categoryId} onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Price (₦)</Label>
              <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} />
            </div>
            <div>
              <Label required>Stock Quantity</Label>
              <Input type="number" min={0} step="1" value={form.stock} onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))} />
            </div>
          </div>
          <div className="mb-5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" variant="secondary" fullWidth loading={submitting}>
            {editingId ? "Save Changes" : "Add Product"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
