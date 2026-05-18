import { useState, useEffect } from 'react'
import { Search, Wrench, Package, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const MOCK_PARTS = [
  { id: 1, name: 'Brake Pads (Front)', code: 'BP-F-001', category: 'Brakes', stock: 45, price: 2500, minStock: 10 },
  { id: 2, name: 'Oil Filter', code: 'OF-001', category: 'Engine', stock: 120, price: 800, minStock: 20 },
  { id: 3, name: 'Spark Plug', code: 'SP-001', category: 'Ignition', stock: 200, price: 400, minStock: 50 },
  { id: 4, name: 'Air Filter', code: 'AF-001', category: 'Engine', stock: 5, price: 1200, minStock: 15 }, // Low stock
  { id: 5, name: 'Alternator', code: 'ALT-001', category: 'Electrical', stock: 0, price: 15000, minStock: 2 }, // Out of stock
  { id: 6, name: 'Wiper Blades', code: 'WB-001', category: 'Accessories', stock: 30, price: 600, minStock: 10 },
]

export function StaffPartsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [parts, setParts] = useState(MOCK_PARTS)

  useEffect(() => {
    if (!searchTerm) {
      setParts(MOCK_PARTS)
    } else {
      const lower = searchTerm.toLowerCase()
      setParts(MOCK_PARTS.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.code.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower)
      ))
    }
  }, [searchTerm])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Parts Catalog</h1>
        <p className="text-sm text-gray-500 mt-1">Browse the inventory of available parts.</p>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <Package size={20} className="text-[var(--vs-green-600)]" />
              Inventory Overview
            </CardTitle>
            <CardDescription className="mt-1">Showing {parts.length} parts.</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search parts, codes, categories..."
              className="w-full pl-9 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vs-green-500)]/50 transition-all duration-300 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parts.map(part => (
              <div key={part.id} className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{part.name}</h3>
                    <Badge variant="outline" className="bg-gray-50 text-xs font-mono">{part.code}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Wrench size={12} />
                    {part.category}
                  </div>
                </div>
                <div className="flex justify-between items-end border-t pt-3 mt-2">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Stock Level</p>
                    {part.stock === 0 ? (
                      <span className="text-sm font-bold text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} /> Out of Stock
                      </span>
                    ) : part.stock < part.minStock ? (
                      <span className="text-sm font-bold text-orange-600 flex items-center gap-1">
                        <AlertCircle size={14} /> Low: {part.stock}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-green-600">{part.stock} Units</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Unit Price</p>
                    <p className="text-sm font-bold text-gray-900">NPR {part.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {parts.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p>No parts found matching your search.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
