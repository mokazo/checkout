import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Product } from '../../types';
import { mockApi } from '../../services/mockApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await mockApi.getProducts();
    setProducts(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (currentProduct.id) {
        await mockApi.updateProduct(currentProduct.id, currentProduct);
      } else {
        await mockApi.createProduct({
          merchantId: 'merch_123',
          name: currentProduct.name || 'New Product',
          description: currentProduct.description || '',
          price: Number(currentProduct.price) || 0,
          imageUrl: currentProduct.imageUrl || 'https://picsum.photos/400',
          stock: Number(currentProduct.stock) || 0,
          isActive: true
        });
      }
      setIsEditing(false);
      setCurrentProduct({});
      loadProducts();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await mockApi.deleteProduct(id);
      loadProducts();
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-900 p-6 rounded-xl border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-6">{currentProduct.id ? 'Edit Product' : 'New Product'}</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <Input 
            label="Product Name" 
            value={currentProduct.name || ''} 
            onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Price (€)" 
              type="number" 
              step="0.01" 
              value={currentProduct.price || ''} 
              onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
              required
            />
            <Input 
              label="Stock" 
              type="number" 
              value={currentProduct.stock || ''} 
              onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-900/50 text-gray-200"
              rows={3}
              value={currentProduct.description || ''}
              onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
            />
          </div>
          <Input 
            label="Image URL" 
            value={currentProduct.imageUrl || ''} 
            onChange={e => setCurrentProduct({...currentProduct, imageUrl: e.target.value})}
            placeholder="https://..."
          />
          {currentProduct.imageUrl && (
            <img src={currentProduct.imageUrl} alt="Preview" className="h-32 w-32 object-cover rounded-lg border border-gray-700" />
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Save Product</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <Button onClick={() => { setCurrentProduct({}); setIsEditing(true); }}>
          <Plus size={18} /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col group">
            <div className="h-48 overflow-hidden bg-gray-800">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-white line-clamp-1">{product.name}</h3>
                <span className="bg-orange-500/10 text-orange-400 text-xs px-2 py-1 rounded-full font-medium">
                  €{product.price.toFixed(2)}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800">
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <Package size={16} /> {product.stock} in stock
                </span>
                <div className="flex gap-2">
                  <button onClick={() => { setCurrentProduct(product); setIsEditing(true); }} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-gray-800 rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-800 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No products found. Create your first product to get started.
          </div>
        )}
      </div>
    </div>
  );
};