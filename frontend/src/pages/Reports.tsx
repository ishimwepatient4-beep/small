import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

type ReportType = 'current-inventory' | 'stock-movement' | 'low-stock';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('current-inventory');

  const { data, isLoading } = useQuery({
    queryKey: ['report', activeReport],
    queryFn: () => api.get(`/reports/${activeReport}`).then((r) => r.data),
  });

  const handleExport = async (format: 'pdf' | 'excel') => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL}/reports/export/${format}/${activeReport}`;
    try {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('Export failed');
      const blob = await resp.blob();
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${activeReport}-report.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert('Failed to export report. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">
            Export PDF
          </button>
          <button onClick={() => handleExport('excel')} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm">
            Export Excel
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['current-inventory', 'stock-movement', 'low-stock'] as ReportType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveReport(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeReport === type
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : activeReport === 'current-inventory' || activeReport === 'low-stock' ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Category</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Stock</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Min Stock</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-sm font-mono">{p.sku}</td>
                    <td className="px-4 py-3 text-sm">{p.category?.name || p.categoryName}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${p.stock <= 0 ? 'text-red-600' : p.stock <= (p.minimumStock || p.minimum_stock) ? 'text-yellow-600' : ''}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{p.minimumStock || p.minimum_stock}</td>
                    <td className="px-4 py-3 text-right text-sm">${Number(p.sellingPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Qty</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{tx.product.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.transactionType === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{tx.transactionType}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{tx.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{tx.user.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
