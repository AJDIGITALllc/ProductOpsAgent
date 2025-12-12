'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Template } from '@productopsagent/shared';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.getTemplates();
      setTemplates(data.templates);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Templates</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No templates available</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              <h3 className="text-xl font-bold mb-2">{template.name}</h3>
              <p className="text-gray-600 mb-4">{template.description}</p>
              <div className="text-sm text-gray-500">
                {template.actionPlan && typeof template.actionPlan === 'object'
                  ? `${template.actionPlan.actions?.length || 0} actions`
                  : '0 actions'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>

            {selectedTemplate.actionPlan && typeof selectedTemplate.actionPlan === 'object' && (
              <div>
                <h3 className="text-lg font-bold mb-2">Action Plan</h3>
                <div className="bg-gray-50 rounded p-4">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(selectedTemplate.actionPlan, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  // In a real implementation, this would copy the template to the builder
                  alert('Template would be copied to builder');
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Use Template
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
