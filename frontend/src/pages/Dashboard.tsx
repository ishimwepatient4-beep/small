import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { StatCard } from '../components/UI';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  if (isLoading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={data?.totalProducts || 0} icon="📦" color="indigo" />
        <StatCard title="Total Stock" value={data?.totalStock || 0} icon="📊" color="green" />
        <StatCard title="Low Stock Items" value={data?.lowStockItems || 0} icon="⚠️" color="yellow" warning={data?.lowStockItems > 0} />
        <StatCard title="Out of Stock" value={data?.outOfStockItems || 0} icon="🚫" color="red" warning={data?.outOfStockItems > 0} />
      </div>

      {data?.lowStockItems > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">⚠️ Low Stock Warning</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            You have {data.lowStockItems} item(s) below minimum stock level.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {data?.recentTransactions?.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-gray-400 text-center">No recent transactions</p>
          )}
          {data?.recentTransactions?.map((tx: any) => (
            <div key={tx.id} className="p-4 flex items-center justify-between">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                  tx.transactionType === 'IN'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {tx.transactionType}
                </span>
                <span className="font-medium">{tx.product.name}</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {tx.quantity} pcs by {tx.user.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
