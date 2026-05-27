import React, { useEffect, useState } from "react";
import { apiRequest } from "@/services/api-client";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { TrendingUp, Package, Users, ShoppingCart, AlertTriangle, Activity } from "lucide-react";
import { PageSection } from "@/components/shared/page-section";

const api = {
  get: (path: string) => apiRequest(path).then(data => ({ data })),
};

type Part = { partId?: number; partName: string; brand: string; stockQty: number; minimumStock: number };
type Invoice = { purchaseInvoiceId?: number; invoiceNo: string; vendorName?: string; totalAmount: number; purchaseDate: string };
type Vendor = { vendorId?: number; vendorName: string };

const COLORS = ["#1e7a46", "#2ea05e", "#97c459", "#ef9f27", "#e24b4a", "#0c447c", "#9dab9d"];

export function AdminAnalyticsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [v, p, i] = await Promise.all([
          api.get("/api/admin/vendors") as Promise<{ data: any }>,
          api.get("/api/parts") as Promise<{ data: any }>,
          api.get("/api/PurchaseInvoices") as Promise<{ data: any }>,
        ]);
        
        const vendorsList = v.data?.items || (Array.isArray(v.data) ? v.data : []);
        const partsList = p.data?.items || (Array.isArray(p.data) ? p.data : []);
        const invoicesList = i.data?.items || (Array.isArray(i.data) ? i.data : []);

        setVendors(vendorsList);
        setParts(partsList);
        setInvoices(invoicesList);
      } catch (err) {
        console.error("Failed to load analytics data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const lowStock = parts.filter((p) => Number(p.stockQty) <= Number(p.minimumStock));
  const totalPurchase = invoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);

  // Generate brand breakup for the Donut Chart
  const brandCounts = parts.reduce((acc: { [key: string]: number }, part) => {
    const brand = part.brand || "Other";
    acc[brand] = (acc[brand] || 0) + 1;
    return acc;
  }, {});

  const donutData = Object.entries(brandCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  const totalBrandsCount = donutData.reduce((sum, d) => sum + d.value, 0);

  // Mock historical data for smooth Line Chart (Sessions/Procurements Trend over last 7 days)
  const lineChartData = [
    { name: "25 Nov", Procurements: 1200, Sales: 700 },
    { name: "26 Nov", Procurements: 1900, Sales: 800 },
    { name: "27 Nov", Procurements: 3400, Sales: 2100 },
    { name: "28 Nov", Procurements: 2200, Sales: 1800 },
    { name: "29 Nov", Procurements: 4100, Sales: 2900 },
    { name: "30 Nov", Procurements: 3000, Sales: 2600 },
    { name: "1 Dec", Procurements: totalPurchase > 0 ? totalPurchase : 5400, Sales: 4900 },
  ];

  // Brand Summary for the bottom table
  const brandSummaries = Object.entries(brandCounts).map(([brand, count]) => {
    const brandParts = parts.filter(p => p.brand === brand);
    const avgStock = brandParts.reduce((sum, p) => sum + Number(p.stockQty), 0) / brandParts.length;
    const isCritical = brandParts.some(p => Number(p.stockQty) <= Number(p.minimumStock));
    
    return {
      brand,
      totalItems: count,
      avgStock: Math.round(avgStock),
      salesRevenue: count * 4500, // Calculated simulated revenue
      critical: isCritical
    };
  }).slice(0, 6);

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-[var(--vs-soft-border)]">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[var(--primary)] via-[var(--vs-green-600)] to-emerald-600 bg-clip-text text-transparent inline-block">
          Analytics
        </h1>
      </div>

      {/* Top Row: Recharts Charts (Line Chart on Left, Donut Chart on Right) exactly like screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-[var(--vs-text)]">Procurement & Sales Trend</h3>
              <p className="text-xs text-[var(--vs-muted)]">Comparison of procurement costs vs sales revenue over the last 7 days</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <TrendingUp size={10} /> +14% Growth
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProcurements" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e7a46" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1e7a46" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c447c" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0c447c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--vs-soft-border)" />
                <XAxis dataKey="name" stroke="var(--vs-faint)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--vs-faint)" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Procurements" stroke="#1e7a46" strokeWidth={2} fillOpacity={1} fill="url(#colorProcurements)" />
                <Area type="monotone" dataKey="Sales" stroke="#0c447c" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-[15px] font-bold text-[var(--vs-text)]">Brand Share Breakup</h3>
            <p className="text-xs text-[var(--vs-muted)]">Stock concentration and brand catalog distribution</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Chart Area */}
            <div className="h-60 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData.length > 0 ? donutData : [{ name: "No Parts", value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-[var(--vs-text)]">
                  {parts.length}
                </span>
                <span className="text-[10px] uppercase font-bold text-[var(--vs-muted)] tracking-wider">Total Parts</span>
              </div>
            </div>

            {/* Custom Legend exactly like the screenshot */}
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
              {donutData.map((d, index) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <span className="font-semibold text-gray-700 truncate max-w-[100px]">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{d.value}</span>
                    <span className="text-[10px] text-gray-400">
                      ({Math.round((d.value / (totalBrandsCount || 1)) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row: Six Gorgeous KPI Cards exactly like screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-4 flex flex-col gap-2 hover:-translate-y-1 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-[var(--vs-muted)] uppercase tracking-wider">Purchases</span>
            <span className="badge bg text-[10px] px-1 py-0.5 rounded-full font-bold">+12%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-extrabold text-gray-900 leading-tight">Rs. {totalPurchase.toLocaleString()}</span>
            <span className="text-[10px] text-[var(--vs-muted)]">Procurement value</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-4 flex flex-col gap-2 hover:-translate-y-1 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-[var(--vs-muted)] uppercase tracking-wider">Catalog Parts</span>
            <span className="badge bg text-[10px] px-1 py-0.5 rounded-full font-bold">+5%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-extrabold text-gray-900 leading-tight">{parts.length}</span>
            <span className="text-[10px] text-[var(--vs-muted)]">Active item definitions</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-4 flex flex-col gap-2 hover:-translate-y-1 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-[var(--vs-muted)] uppercase tracking-wider">Total Suppliers</span>
            <span className="badge bg text-[10px] px-1 py-0.5 rounded-full font-bold">+7%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-extrabold text-gray-900 leading-tight">{vendors.length}</span>
            <span className="text-[10px] text-[var(--vs-muted)]">Registered vendors</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-4 flex flex-col gap-2 hover:-translate-y-1 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-[var(--vs-muted)] uppercase tracking-wider">Low Stock</span>
            {lowStock.length > 0 ? (
              <span className="badge br text-[10px] px-1 py-0.5 rounded-full font-bold">Critical</span>
            ) : (
              <span className="badge bg text-[10px] px-1 py-0.5 rounded-full font-bold">Safe</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-extrabold text-[var(--vs-red)] leading-tight">{lowStock.length}</span>
            <span className="text-[10px] text-[var(--vs-muted)]">Items below minimum</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-4 flex flex-col gap-2 hover:-translate-y-1 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-[var(--vs-muted)] uppercase tracking-wider">Invoices</span>
            <span className="badge bg text-[10px] px-1 py-0.5 rounded-full font-bold">+10%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-extrabold text-gray-900 leading-tight">{invoices.length}</span>
            <span className="text-[10px] text-[var(--vs-muted)]">Saved transactions</span>
          </div>
        </div>

        {/* KPI 6 */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-4 flex flex-col gap-2 hover:-translate-y-1 transition-transform duration-200">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-[var(--vs-muted)] uppercase tracking-wider">Stock Turn</span>
            <span className="badge bg text-[10px] px-1 py-0.5 rounded-full font-bold">+9%</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-extrabold text-gray-900 leading-tight">84.3%</span>
            <span className="text-[10px] text-[var(--vs-muted)]">Efficient inventory flow</span>
          </div>
        </div>

      </div>

      {/* Bottom Row: High-fidelity Table (Brand and Critical Stock Analytics) exactly like the screenshot */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--vs-border)] p-5">
        <div className="mb-4">
          <h3 className="text-[15px] font-bold text-[var(--vs-text)]">Brand Procurement & Alert Summary</h3>
          <p className="text-xs text-[var(--vs-muted)]">Aggregation of stock performance and alerts grouped by vendor brand</p>
        </div>

        <div className="tbl-wrap border border-[var(--vs-border)]">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: '16px' }}>Brand / Vendor</th>
                <th>Active Parts</th>
                <th>Average Stock Quantity</th>
                <th>Estimated Revenue Contribution</th>
                <th>Critical Alerts</th>
                <th>Status Badge</th>
              </tr>
            </thead>
            <tbody>
              {brandSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tbl-empty py-10">No brand records found</td>
                </tr>
              ) : (
                brandSummaries.map((summary) => (
                  <tr key={summary.brand}>
                    <td style={{ paddingLeft: '16px' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                        <span className="text-[13px] font-bold text-[var(--vs-text)]">{summary.brand}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-gray-800">{summary.totalItems} parts</span>
                    </td>
                    <td>
                      <span className="font-semibold text-gray-800">{summary.avgStock} units avg</span>
                    </td>
                    <td>
                      <span className="font-bold text-emerald-700">Rs. {summary.salesRevenue.toLocaleString()}</span>
                    </td>
                    <td>
                      <span className={summary.critical ? "text-[var(--vs-red)] font-bold flex items-center gap-1" : "text-gray-500 flex items-center gap-1"}>
                        {summary.critical ? (
                          <>
                            <AlertTriangle size={12} /> Restock Alert
                          </>
                        ) : (
                          "Healthy Stock"
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${summary.critical ? "br" : "bg"}`}>
                        {summary.critical ? "Restock Needed" : "Optimal"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
