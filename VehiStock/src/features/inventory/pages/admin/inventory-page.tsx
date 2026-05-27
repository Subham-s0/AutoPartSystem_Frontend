import React, { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/services/api-client";
import { X, ImagePlus, Plus, Search, Edit2, Trash2, Package, ArrowLeft, Save } from "lucide-react";
import { APP_CONFIG } from "@/constants/app-config";
import { PageSection } from "@/components/shared/page-section";

const api = {
  get: (path: string) => apiRequest(path).then(data => ({ data })),
  post: (path: string, payload?: any) => apiRequest(path, { method: 'POST', body: payload }),
  put: (path: string, payload?: any) => apiRequest(path, { method: 'PUT', body: payload }),
  delete: (path: string) => apiRequest(path, { method: 'DELETE' })
};

function getPartImageSrc(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${APP_CONFIG.apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

type Part = {
  partId?: number;
  partCode: string;
  partName: string;
  brand: string;
  unitCost: string;
  unitPrice: string;
  stockQty: string;
  minimumStock: string;
  isActive: boolean;
  partPhotoUrl?: string;
};

type PartFormState = {
  partCode: string;
  partName: string;
  brand: string;
  unitCost: string;
  unitPrice: string;
  stockQty: string;
  minimumStock: string;
  isActive: boolean;
  partPhoto: File | null;
  removePartPhoto: boolean;
};

export function InventoryPage() {
  const emptyForm: PartFormState = {
    partCode: "",
    partName: "",
    brand: "",
    unitCost: "",
    unitPrice: "",
    stockQty: "",
    minimumStock: "",
    isActive: true,
    partPhoto: null,
    removePartPhoto: false,
  };

  const [parts, setParts] = useState<Part[]>([]);
  const [form, setForm] = useState<PartFormState>(emptyForm);
  const [editPartId, setEditPartId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 8;

  const fetchParts = async () => {
    try {
      const res = await api.get("/api/parts") as { data: { items: Part[] } | Part[] };
      if (res.data && 'items' in res.data) {
        setParts(res.data.items);
      } else if (Array.isArray(res.data)) {
        setParts(res.data);
      } else {
        setParts([]);
      }
    } catch (e) {
      console.error("Failed to load parts", e);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    return () => {
      if (previewSrc && previewSrc.startsWith("blob:")) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const filteredParts = parts.filter(
    (p) =>
      p.partName?.toLowerCase().includes(search.toLowerCase()) ||
      p.partCode?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredParts.length / pageSize) || 1;
  const paginatedParts = filteredParts.slice((page - 1) * pageSize, page * pageSize);

  const openAddForm = () => {
    setForm(emptyForm);
    setEditPartId(null);
    setPreviewSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(true);
  };

  const handleEdit = (part: Part) => {
    setEditPartId(part.partId ?? null);
    setForm({
      partCode: part.partCode ?? "",
      partName: part.partName ?? "",
      brand: part.brand ?? "",
      unitCost: String(part.unitCost ?? ""),
      unitPrice: String(part.unitPrice ?? ""),
      stockQty: String(part.stockQty ?? ""),
      minimumStock: String(part.minimumStock ?? ""),
      isActive: part.isActive ?? true,
      partPhoto: null,
      removePartPhoto: false,
    });
    setPreviewSrc(getPartImageSrc(part.partPhotoUrl) || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(true);
  };

  const clearForm = () => {
    setForm(emptyForm);
    setEditPartId(null);
    setPreviewSrc(null);
    setShowForm(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (previewSrc && previewSrc.startsWith("blob:")) {
      URL.revokeObjectURL(previewSrc);
    }
    setForm((current) => ({ ...current, partPhoto: file, removePartPhoto: false }));
    setPreviewSrc(file ? URL.createObjectURL(file) : null);
  };

  const handleClearImage = () => {
    if (previewSrc && previewSrc.startsWith("blob:")) {
      URL.revokeObjectURL(previewSrc);
    }
    setPreviewSrc(null);
    setForm((current) => ({ ...current, partPhoto: null, removePartPhoto: true }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSavePart = async () => {
    if (!form.partCode || !form.partName || !form.brand || !form.unitCost || !form.unitPrice || !form.stockQty || !form.minimumStock) {
      alert("Please fill all required text fields");
      return;
    }

    const formData = new FormData();
    formData.append("partCode", form.partCode);
    formData.append("partName", form.partName);
    formData.append("brand", form.brand);
    formData.append("unitCost", form.unitCost);
    formData.append("unitPrice", form.unitPrice);
    formData.append("stockQty", form.stockQty);
    formData.append("minimumStock", form.minimumStock);
    formData.append("isActive", String(form.isActive));

    if (editPartId !== null) {
      formData.append("partId", String(editPartId));
      formData.append("removePartPhoto", String(form.removePartPhoto));
    }

    if (form.partPhoto) {
      formData.append("partPhoto", form.partPhoto);
    }

    try {
      if (editPartId === null) {
        await api.post("/api/parts", formData);
        alert("Part added successfully");
      } else {
        await api.put("/api/parts", formData);
        alert("Part updated successfully");
      }
      await fetchParts();
      clearForm();
    } catch (error) {
      console.error("Error saving part", error);
      alert("Failed to save part");
    }
  };

  const handleDelete = async (partId?: number) => {
    if (!partId) return;
    if (!confirm("Delete this part?")) return;

    try {
      await api.delete(`/api/parts/${partId}`);
      await fetchParts();
    } catch (error) {
      console.error(error);
      alert("Failed to delete part");
    }
  };

  // Dedicated Form View (Acts as a separate page, styled 100% per system tokens)
  if (showForm) {
    return (
      <PageSection
        title={editPartId === null ? "Add New Part" : "Edit Part Details"}
        description={editPartId === null ? "Add a new part to your inventory." : "Modify existing spare part records."}
        actions={
          <button 
            onClick={clearForm}
            className="flex items-center gap-1.5 px-4 py-2 border border-[var(--vs-border)] text-[var(--vs-text)] bg-white rounded-lg hover:bg-[var(--vs-soft-border)] font-semibold transition-all text-sm shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to Inventory</span>
          </button>
        }
      >
        <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image Upload Area */}
            <div className="md:col-span-1 flex flex-col justify-start">
              <label className="form-label font-bold mb-2">Part Image</label>
              <div className="relative border border-dashed border-[var(--vs-border)] rounded-lg overflow-hidden bg-[var(--vs-bg)] h-56 flex items-center justify-center group hover:bg-gray-100 transition-colors shadow-inner">
                <input
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {previewSrc ? (
                  <>
                    <img 
                      src={previewSrc} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-white text-gray-700 rounded hover:bg-blue-50 hover:text-blue-600 shadow transition-colors"
                        title="Replace Image"
                      >
                        <ImagePlus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="p-2 bg-white text-red-500 rounded hover:bg-red-50 shadow transition-colors"
                        title="Remove Image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 text-[var(--vs-muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    <ImagePlus size={32} />
                    <span className="text-sm font-semibold">Upload Image</span>
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="md:col-span-2 flex flex-col gap-5">
              <div>
                <h4 className="text-xs font-bold text-[var(--vs-green-900)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span> Part Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Part Code *</label>
                    <input className="form-input focus:border-[var(--primary)]" 
                      value={form.partCode} onChange={(e) => setForm({ ...form, partCode: e.target.value })} />
                  </div>

                  <div>
                    <label className="form-label">Part Name *</label>
                    <input className="form-input focus:border-[var(--primary)]" 
                      value={form.partName} onChange={(e) => setForm({ ...form, partName: e.target.value })} />
                  </div>

                  <div>
                    <label className="form-label">Brand *</label>
                    <input className="form-input focus:border-[var(--primary)]" 
                      value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                  </div>
                  
                  <div>
                    <label className="form-label">Status</label>
                    <select className="form-select focus:border-[var(--primary)]" 
                      value={form.isActive ? "true" : "false"} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--vs-green-900)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span> Pricing & Inventory
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--vs-green-100)] p-4 rounded-xl border border-[var(--vs-border)]">
                  <div>
                    <label className="form-label font-bold">Unit Cost (Rs) *</label>
                    <input className="form-input bg-white focus:border-[var(--primary)]" 
                      type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
                  </div>

                  <div>
                    <label className="form-label font-bold">Unit Price (Rs) *</label>
                    <input className="form-input bg-white focus:border-[var(--primary)]" 
                      type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
                  </div>

                  <div>
                    <label className="form-label font-bold">Stock Quantity *</label>
                    <input className="form-input bg-white focus:border-[var(--primary)]" 
                      type="number" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
                  </div>

                  <div>
                    <label className="form-label font-bold">Minimum Stock *</label>
                    <input className="form-input bg-white focus:border-[var(--primary)]" 
                      type="number" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[var(--vs-soft-border)] flex justify-end gap-3">
            <button 
              onClick={clearForm}
              className="px-5 py-2 text-sm text-[var(--vs-text)] bg-white border border-[var(--vs-border)] rounded-lg hover:bg-[var(--vs-soft-border)] font-semibold transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleSavePart}
              className="px-5 py-2 text-sm text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--vs-green-700)] font-semibold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Save size={16} />
              <span>{editPartId === null ? "Save Part" : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </PageSection>
    );
  }

  // Normal List View (Cleanly mapped to system styles and tables)
  return (
    <PageSection
      title="Parts Inventory"
      description="Manage vehicle spare parts, stock quantity, pricing details, and images."
      actions={
        <button 
          onClick={openAddForm}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--vs-green-700)] text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 font-semibold transform hover:-translate-y-0.5 text-sm"
        >
          <Plus size={16} />
          <span>Add New Part</span>
        </button>
      }
    >
      {/* Search Bar */}
      <div className="mb-5 relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[var(--vs-muted)]" />
        </div>
        <input
          type="text"
          placeholder="Search parts by name, code or brand..."
          className="form-input"
          style={{ paddingLeft: '36px' }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table Section */}
      <div className="tbl-wrap border border-[var(--vs-border)]">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ paddingLeft: '16px' }}>Item</th>
              <th>Code / Brand</th>
              <th>Cost / Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedParts.length === 0 ? (
              <tr>
                <td colSpan={6} className="tbl-empty py-10">
                  <div className="flex flex-col items-center justify-center text-[var(--vs-muted)]">
                    <Package size={36} className="mb-2 text-[var(--vs-soft-border)]" />
                    <p className="text-base font-semibold">No parts found</p>
                    <p className="text-[13px] mt-1">Try adjusting your search or add a new part.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedParts.map((p) => (
                <tr key={p.partId} className="group">
                  <td style={{ paddingLeft: '16px' }}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden bg-[var(--vs-bg)] border border-[var(--vs-border)] flex items-center justify-center shadow-sm">
                        {p.partPhotoUrl ? (
                          <img src={getPartImageSrc(p.partPhotoUrl)} alt={p.partName} className="h-full w-full object-cover" />
                        ) : (
                          <ImagePlus className="h-4 w-4 text-[var(--vs-muted)]" />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-[13px] font-bold text-[var(--vs-text)]">{p.partName}</div>
                        <div className="text-[11px] text-[var(--vs-muted)] mt-0.5">ID: {p.partId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-[13px] font-semibold text-[var(--vs-text)]">{p.partCode}</div>
                    <div className="text-[12px] text-[var(--vs-muted)]">{p.brand}</div>
                  </td>
                  <td>
                    <div className="text-[12px] text-[var(--vs-text)]">Cost: <span className="font-medium">Rs. {p.unitCost}</span></div>
                    <div className="text-[12px] text-[var(--primary)] mt-0.5">Price: <span className="font-bold">Rs. {p.unitPrice}</span></div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[13px] font-bold ${Number(p.stockQty) <= Number(p.minimumStock) ? 'text-[var(--vs-red)]' : 'text-[var(--vs-text)]'}`}>
                        {p.stockQty}
                      </span>
                      <span className="text-[11px] text-[var(--vs-muted)]">/ min {p.minimumStock}</span>
                    </div>
                    {Number(p.stockQty) <= Number(p.minimumStock) && (
                      <span className="badge br mt-1">Low Stock</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${p.isActive ? 'bg' : 'br'}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Part"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.partId)}
                        className="p-1.5 text-[var(--vs-red)] hover:bg-red-50 rounded transition-colors"
                        title="Delete Part"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="px-5 py-3 border-t border-[var(--vs-soft-border)] bg-gray-50 flex items-center justify-between">
        <p className="text-[13px] text-[var(--vs-muted)]">
          Showing <span className="font-medium">{Math.min(filteredParts.length, (page - 1) * pageSize + 1)}</span> to <span className="font-medium">{Math.min(filteredParts.length, page * pageSize)}</span> of <span className="font-medium">{filteredParts.length}</span> results
        </p>
        <div className="flex gap-1.5">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-2.5 py-1 border border-[var(--vs-border)] text-[13px] font-medium rounded-md text-[var(--vs-text)] bg-white hover:bg-[var(--vs-soft-border)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            Previous
          </button>
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="px-2.5 py-1 border border-[var(--vs-border)] text-[13px] font-medium rounded-md text-[var(--vs-text)] bg-white hover:bg-[var(--vs-soft-border)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </PageSection>
  );
}
