import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface StockForm {
  productId: number;
  quantity: number;
  supplier: string;
  notes: string;
}

export default function StockIn() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StockForm>();
  const [lastResult, setLastResult] = useState<any>(null);

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => api.get('/products?limit=100').then((r) => r.data.products),
  });

  const mutation = useMutation({
    mutationFn: (data: StockForm) => api.post('/stock/in', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setLastResult(res.data);
      reset();
      toast.success('Stock added successfully');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to add stock'),
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Stock In</h1>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product *</label>
            <select {...register('productId', { required: true, valueAsNumber: true })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
              <option value="">Select a product</option>
              {products?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Current: {p.stock} {p.unit}</option>
              ))}
            </select>
            {errors.productId && <p className="text-red-500 text-xs mt-1">Required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity *</label>
            <input type="number" min="1" {...register('quantity', { required: true, min: 1, valueAsNumber: true })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">Minimum 1</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Supplier</label>
            <input {...register('supplier')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors font-medium">
            {mutation.isPending ? 'Processing...' : 'Stock In'}
          </button>
        </form>
      </div>

      {lastResult && (
        <div className="max-w-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="font-medium text-green-800 dark:text-green-200">Last Transaction</p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            +{lastResult.transaction.quantity} {lastResult.product.unit} of {lastResult.product.name}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">New stock level: {lastResult.product.stock}</p>
        </div>
      )}
    </div>
  );
}
