'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.deleteProduct(id);
      await loadProducts();
    } catch (error: any) {
      alert(`Failed to delete product: ${error.message}`);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const product = await api.getProduct(id);
      setSelectedProduct(product);
    } catch (error: any) {
      alert(`Failed to load product details: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-center text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (selectedProduct) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
          <button
            onClick={() => setSelectedProduct(null)}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to list
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Status
            </h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                selectedProduct.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {selectedProduct.status}
            </span>
          </div>

          {selectedProduct.whopProductId && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Whop Product ID
              </h3>
              <p className="text-gray-900 font-mono">
                {selectedProduct.whopProductId}
              </p>
            </div>
          )}

          {selectedProduct.pricing && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Pricing
              </h3>
              <p className="text-gray-900">
                ${(selectedProduct.pricing.amount / 100).toFixed(2)}
                {selectedProduct.pricing.type === 'recurring' &&
                  ` / ${selectedProduct.pricing.interval}`}
                <span className="ml-2 text-gray-500">
                  ({selectedProduct.pricing.type})
                </span>
              </p>
            </div>
          )}

          {selectedProduct.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Description
              </h3>
              <p className="text-gray-900">{selectedProduct.description}</p>
            </div>
          )}

          {selectedProduct.faqs && selectedProduct.faqs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                FAQs
              </h3>
              <div className="space-y-3">
                {selectedProduct.faqs.map((faq: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded">
                    <p className="font-semibold text-gray-900">
                      {faq.question}
                    </p>
                    <p className="text-gray-700 mt-1">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedProduct.auditLogs &&
            selectedProduct.auditLogs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Recent Activity
                </h3>
                <div className="space-y-2">
                  {selectedProduct.auditLogs.slice(0, 5).map((log: any) => (
                    <div
                      key={log.id}
                      className="text-sm p-2 bg-gray-50 rounded"
                    >
                      <span className="font-medium">{log.action}</span>
                      <span className="text-gray-500 ml-2">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <span
                        className={`ml-2 ${
                          log.status === 'success'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="text-sm text-gray-500">
            <p>Created: {new Date(selectedProduct.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(selectedProduct.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Products</h2>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No products yet</p>
          <p className="text-sm text-gray-500">
            Create your first product using the Chat Builder
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  {product.pricing && (
                    <p className="text-gray-600 mt-1">
                      ${(product.pricing.amount / 100).toFixed(2)}
                      {product.pricing.type === 'recurring' &&
                        ` / ${product.pricing.interval}`}
                    </p>
                  )}
                  <div className="flex items-center mt-2 space-x-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        product.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {product.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(product.id)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    View
                  </button>
                  {product.status === 'draft' && (
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
