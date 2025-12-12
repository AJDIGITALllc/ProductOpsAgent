'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface PlanApprovalProps {
  plan: any;
  onBack: () => void;
  onComplete: () => void;
}

export default function PlanApproval({
  plan,
  onBack,
  onComplete,
}: PlanApprovalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const actions = JSON.parse(plan.actions);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      // Approve the plan
      await api.approvePlan(plan.id);

      // Execute the plan
      const executionResult = await api.executePlan(plan.id);
      setResult(executionResult);

      if (executionResult.success) {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await api.cancelPlan(plan.id);
      onBack();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionDescription = (action: any): string => {
    switch (action.type) {
      case 'create_draft':
        return `Create draft product: "${action.payload.name}"${
          action.payload.templateId ? ' (from template)' : ''
        }`;
      case 'set_pricing': {
        const pricing = action.payload.pricing;
        const amount = (pricing.amount / 100).toFixed(2);
        return `Set pricing: $${amount} (${pricing.type}${
          pricing.interval ? ` / ${pricing.interval}` : ''
        })`;
      }
      case 'add_description_block':
        return `Add description block: ${action.payload.block.type}`;
      case 'add_faq':
        return `Add FAQ: "${action.payload.faq.question}"`;
      case 'set_payment_options':
        return `Set payment options: ${action.payload.options.methods.join(
          ', '
        )}`;
      case 'publish':
        return 'Publish product to Whop';
      default:
        return `Action: ${action.type}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Review Plan</h2>
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800"
          disabled={loading}
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {result ? (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-md ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-2 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {result.success ? '✓ Execution Successful' : '✗ Execution Failed'}
            </h3>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Results:</h4>
            {result.results.map((r: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded border ${
                  r.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {r.success ? '✓' : '✗'} {r.actionType}
                  </span>
                </div>
                {r.error && (
                  <p className="text-sm text-red-600 mt-1">{r.error}</p>
                )}
              </div>
            ))}
          </div>

          {result.success && (
            <p className="text-gray-600 text-center">
              Redirecting to products...
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              Plan Actions ({actions.length})
            </h3>
            <div className="space-y-2">
              {actions.map((action: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 rounded-md border border-gray-200"
                >
                  <div className="flex items-center">
                    <span className="text-gray-500 font-mono text-sm mr-3">
                      {idx + 1}.
                    </span>
                    <span className="text-gray-800">
                      {getActionDescription(action)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-yellow-800">
              ⚠️ This plan will execute the actions listed above. Please review
              carefully before approving.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Executing...' : 'Approve & Execute'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
