import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Modal, ConfirmDialog } from '../components/UI';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface CategoryForm {
  name: string;
  description: string;
}

export default function Categories() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryForm>();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryForm) => api.post('/categories', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setShowModal(false); reset(); toast.success('Category created'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CategoryForm) => api.put(`/categories/${editingId}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setShowModal(false); setEditingId(null); reset(); toast.success('Category updated'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/categories/${deleteId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setDeleteId(null); toast.success('Category deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Cannot delete category with products'),
  });

  const onSubmit = (data: CategoryForm) => {
    if (editingId) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={() => { setEditingId(null); reset({ name: '', description: '' }); setShowModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          + Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <p>Loading...</p> : categories?.map((cat: any) => (
          <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{cat.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cat.description || 'No description'}</p>
                <p className="text-xs text-gray-400 mt-2">{cat._count?.products || 0} products</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(cat.id); reset(cat); setShowModal(true); }} className="text-indigo-600 hover:text-indigo-800 text-sm">Edit</button>
                <button onClick={() => setDeleteId(cat.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); reset(); }} title={editingId ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input {...register('name', { required: true })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
            {errors.name && <p className="text-red-500 text-xs mt-1">Required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea {...register('description')} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
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
        title="Delete Category"
        message="Are you sure? This cannot be undone."
      />
    </div>
  );
}
