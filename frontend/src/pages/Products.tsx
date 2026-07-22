import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Modal, ConfirmDialog, Pagination } from '../components/UI';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface ProductForm {
  name: string;
  sku: string;
  description: string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  unit: string;
  barcode: string;
  categoryId: number;
}

export default function Products() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (categoryFilter !== '') params.set('categoryId', String(categoryFilter));
      return api.get(`/products?${params}`).then((r) => r.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setShowModal(false); reset(); setImageFile(null); setImagePreview(null); toast.success('Product created'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/products/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setShowModal(false); setEditingId(null); reset(); setImageFile(null); setImagePreview(null); toast.success('Product updated'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/products/${deleteId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setDeleteId(null); toast.success('Product deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Cannot delete product with transaction history'),
  });

  const onSubmit = (data: ProductForm) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }
    if (editingId) updateMutation.mutate(formData);
    else createMutation.mutate(formData);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    reset(product);
    setImageFile(null);
    setImagePreview(product.image ? (product.image.startsWith('http') ? product.image : `http://localhost:5000${product.image}`) : null);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingId(null);
    reset({ name: '', sku: '', description: '', purchasePrice: 0, sellingPrice: 0, minimumStock: 0, unit: 'pcs', barcode: '', categoryId: 0 });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          + Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
        >
          <option value="">All Categories</option>
          {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Stock</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Price</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr><td colSpan={6} className="p-6 text-center">Loading...</td></tr>
              ) : data?.products?.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No products found</td></tr>
              ) : data?.products?.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image && (
                        <img
                          src={p.image.startsWith('http') ? p.image : `http://localhost:5000${p.image}`}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{p.name}</div>
                        {p.description && <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{p.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">{p.sku}</td>
                  <td className="px-4 py-3 text-sm">{p.category.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${p.stock <= 0 ? 'text-red-600 dark:text-red-400' : p.stock <= p.minimumStock ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                      {p.stock}
                    </span>
                    <span className="text-gray-400 ml-1 text-sm">{p.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">${Number(p.sellingPrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800 text-sm mr-3">Edit</button>
                    <button onClick={() => setDeleteId(p.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset(); }} title={editingId ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input {...register('name', { required: true })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
              {errors.name && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU *</label>
              <input {...register('sku', { required: true })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
              {errors.sku && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select {...register('categoryId', { required: true, valueAsNumber: true })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                <option value="">Select</option>
                {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Purchase Price *</label>
              <input type="number" step="0.01" {...register('purchasePrice', { required: true, min: 0, valueAsNumber: true })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Selling Price *</label>
              <input type="number" step="0.01" {...register('sellingPrice', { required: true, min: 0, valueAsNumber: true })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Stock</label>
              <input type="number" {...register('minimumStock', { valueAsNumber: true })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select {...register('unit')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="liters">Liters</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Barcode</label>
              <input {...register('barcode')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea {...register('description')} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-20 h-20 rounded-lg object-cover" />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  );
}
