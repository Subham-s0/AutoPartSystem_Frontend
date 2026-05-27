import React, { useEffect, useState } from "react";
import { apiRequest } from "@/services/api-client";
import { X, Plus, Search, FileText, Download, CheckCircle, Clock, ArrowLeft, Save } from "lucide-react";
import { PageSection } from "@/components/shared/page-section";

const api = {
  get: (path: string) => apiRequest(path).then(data => ({ data })),
  post: (path: string, payload?: any) => apiRequest(path, { method: 'POST', body: payload }),
  put: (path: string, payload?: any) => apiRequest(path, { method: 'PUT', body: payload }),
  delete: (path: string) => apiRequest(path)
};

type Invoice = {
  purchaseInvoiceId?: number;
  vendorName?: string;
  invoiceNo: string;
  purchaseDate: string;
  totalAmount: number;
  paymentStatus: number;
};

export function PurchaseInvoicesPage() {
  const emptyForm = {
    vendorId: "",
    invoiceNo: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    taxAmount: "",
    discountAmount: "",
    paymentStatus: "0",
    notes: "",
    partId: "",
    quantity: "",
    unitCost: "",
  };

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/api/PurchaseInvoices") as { data: Invoice[] };
      setInvoices(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const closeForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const saveInvoice = async () => {
    if (
      !form.vendorId ||
      !form.invoiceNo ||
      !form.purchaseDate ||
      !form.partId ||
      !form.quantity ||
      !form.unitCost
    ) {
      alert("Please fill required fields");
      return;
    }

    try {
      const payload = {
        vendorId: Number(form.vendorId),
        invoiceNo: form.invoiceNo,
        purchaseDate: form.purchaseDate,
        taxAmount: Number(form.taxAmount || 0),
        discountAmount: Number(form.discountAmount || 0),
        paymentStatus: Number(form.paymentStatus),
        notes: form.notes,
        items: [
          {
            partId: Number(form.partId),
            quantity: Number(form.quantity),
            unitCost: Number(form.unitCost),
          },
        ],
      };

      await api.post("/api/PurchaseInvoices", payload);
      await fetchInvoices();
      closeForm();
      alert("Purchase invoice added successfully");
    } catch (error: any) {
      console.log(error);
      alert(error?.response?.data || "Invoice save failed");
    }
  };

  const getStatusDisplay = (status: number) => {
    switch(status) {
      case 0:
        return <span className="badge bg">Paid</span>;
      case 1:
        return <span className="badge br">Unpaid</span>;
      case 2:
      default:
        return <span className="badge ba">Partial</span>;
    }
  };

  const filteredInvoices = invoices.filter(
    (i) =>
      i.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      i.vendorName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = filteredInvoices.slice((page - 1) * pageSize, page * pageSize);

  // Dedicated Full Page Form View
  if (showForm) {
    return (
      <PageSection
        title="Add Purchase Invoice"
        description="Record a new vendor purchase transaction to automatically update inventory stock."
        actions={
          <button 
            onClick={closeForm}
            className="flex items-center gap-1.5 px-4 py-2 border border-[var(--vs-border)] text-[var(--vs-text)] bg-white rounded-lg hover:bg-[var(--vs-soft-border)] font-medium transition-all text-sm shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to Invoices</span>
          </button>
        }
      >
        <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-6 max-w-4xl">
          <div className="flex flex-col gap-6">
            
            {/* Invoice Details */}
            <div>
              <h4 className="text-xs font-bold text-[var(--vs-green-900)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span> Invoice Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Vendor ID *</label>
                  <input className="form-input focus:border-[var(--primary)]" 
                    type="number" value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Invoice Number *</label>
                  <input className="form-input focus:border-[var(--primary)]" 
                    value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Purchase Date *</label>
                  <input className="form-input focus:border-[var(--primary)]" 
                    type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Payment Status *</label>
                  <select className="form-select focus:border-[var(--primary)]" 
                    value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                    <option value="0">Paid</option>
                    <option value="1">Unpaid</option>
                    <option value="2">Partial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financials & Notes */}
            <div>
              <h4 className="text-xs font-bold text-[var(--vs-green-900)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span> Financials & Notes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Tax Amount (Rs)</label>
                  <input className="form-input focus:border-[var(--primary)]" 
                    type="number" value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Discount Amount (Rs)</label>
                  <input className="form-input focus:border-[var(--primary)]" 
                    type="number" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea focus:border-[var(--primary)] resize-none" 
                    rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="text-xs font-bold text-[var(--vs-green-900)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span> Line Items
              </h4>
              <div className="bg-[var(--vs-green-100)] p-5 rounded-xl border border-[var(--vs-border)] grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label font-bold">Part ID *</label>
                  <input className="form-input bg-white focus:border-[var(--primary)]" 
                    type="number" value={form.partId} onChange={(e) => setForm({ ...form, partId: e.target.value })} />
                </div>
                <div>
                  <label className="form-label font-bold">Quantity *</label>
                  <input className="form-input bg-white focus:border-[var(--primary)]" 
                    type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="form-label font-bold">Unit Cost (Rs) *</label>
                  <input className="form-input bg-white focus:border-[var(--primary)]" 
                    type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-4 border-t border-[var(--vs-soft-border)] flex justify-end gap-3">
            <button 
              onClick={closeForm}
              className="px-5 py-2 text-sm text-[var(--vs-text)] bg-white border border-[var(--vs-border)] rounded-lg hover:bg-[var(--vs-soft-border)] font-semibold transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button 
              onClick={saveInvoice}
              className="px-5 py-2 text-sm text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--vs-green-700)] font-semibold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Download size={16} />
              <span>Save Invoice</span>
            </button>
          </div>
        </div>
      </PageSection>
    );
  }

  // Normal List View
  return (
    <PageSection
      title="Purchase Invoices"
      description="Create purchase invoices and automatically update inventory stock."
      actions={
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--vs-green-700)] text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 font-semibold transform hover:-translate-y-0.5 text-sm"
        >
          <Plus size={16} />
          <span>Add Invoice</span>
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
          placeholder="Search by invoice number or vendor..."
          className="form-input"
          style={{ paddingLeft: '36px' }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table Section (Cleanly mapped to system styles and tables) */}
      <div className="tbl-wrap border border-[var(--vs-border)]">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ paddingLeft: '16px' }}>Invoice No</th>
              <th>Vendor</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="tbl-empty py-10 text-center">
                  <div className="flex flex-col items-center justify-center text-[var(--vs-muted)]">
                    <FileText size={36} className="mb-2 text-[var(--vs-soft-border)]" />
                    <p className="text-base font-semibold">No invoices found</p>
                    <p className="text-[13px] mt-1">Add a new purchase invoice to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv) => (
                <tr key={inv.purchaseInvoiceId} className="hover:bg-blue-50/30 transition-colors">
                  <td style={{ paddingLeft: '16px' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-50 rounded-md text-[var(--primary)]">
                        <FileText size={14} />
                      </div>
                      <span className="text-[13px] font-bold text-[var(--vs-text)]">{inv.invoiceNo}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-[13px] font-semibold text-[var(--vs-text)]">{inv.vendorName || "N/A"}</div>
                  </td>
                  <td>
                    <div className="text-[13px] text-[var(--vs-muted)]">{new Date(inv.purchaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  </td>
                  <td>
                    <div className="text-[13px] font-bold text-[var(--primary)]">Rs. {inv.totalAmount?.toLocaleString()}</div>
                  </td>
                  <td>
                    {getStatusDisplay(inv.paymentStatus)}
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
          Showing <span className="font-medium">{Math.min(filteredInvoices.length, (page - 1) * pageSize + 1)}</span> to <span className="font-medium">{Math.min(filteredInvoices.length, page * pageSize)}</span> of <span className="font-medium">{filteredInvoices.length}</span> results
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
