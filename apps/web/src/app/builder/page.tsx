'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { ActionPlan, ActionResult } from '@productopsagent/shared';

type Phase = 'chat' | 'plan' | 'executing' | 'completed';

export default function Builder() {
  const [phase, setPhase] = useState<Phase>('chat');
  const [prompt, setPrompt] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [approvalToken, setApprovalToken] = useState<string | null>(null);
  const [results, setResults] = useState<ActionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.createPlan(prompt);
      setRunId(response.runId);
      setActionPlan(response.actionPlan);
      setApprovalToken(response.approvalToken);
      setPhase('plan');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePlan = async () => {
    if (!runId || !approvalToken) {
      setError('Missing run ID or approval token');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPhase('executing');
      const response = await api.executePlan(runId, approvalToken);
      setResults(response.results);
      setPhase('completed');
    } catch (err: any) {
      setError(err.message);
      setPhase('plan');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhase('chat');
    setPrompt('');
    setRunId(null);
    setActionPlan(null);
    setApprovalToken(null);
    setResults([]);
    setError(null);
  };

  const getActionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'executing':
        return 'text-blue-600';
      case 'skipped':
        return 'text-gray-400';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Product Builder</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Chat / Prompt */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Chat with Agent</h2>

          {phase === 'chat' ? (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to create?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Create a product called 'Premium Consulting', price it at $299 monthly, make it recurring, and add FAQs"
                  disabled={loading}
                />
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded text-sm text-gray-600">
                <strong>Tips:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Mention product name: "Create a product called X"</li>
                  <li>Set pricing: "Price it at $99" (defaults to one-time)</li>
                  <li>Make recurring: "Make it monthly" or "yearly"</li>
                  <li>Add description: "Description: ..."</li>
                  <li>Add FAQs: "Add FAQs"</li>
                  <li>Publish: "Publish the product" (defaults to draft)</li>
                </ul>
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={loading || !prompt.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Plan...' : 'Generate Plan'}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-700">Your prompt:</p>
                <p className="text-sm text-gray-600 mt-1">{prompt}</p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Start New
              </button>
            </div>
          )}

          {/* Execution Timeline */}
          {phase === 'executing' || phase === 'completed' ? (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3">Execution Timeline</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={result.actionId} className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        result.status === 'completed'
                          ? 'bg-green-500'
                          : result.status === 'failed'
                          ? 'bg-red-500'
                          : result.status === 'executing'
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${getActionStatusColor(result.status)}`}>
                        {result.status.toUpperCase()}
                      </div>
                      {result.error && (
                        <div className="text-sm text-red-600 mt-1">{result.error}</div>
                      )}
                      {result.completedAt && (
                        <div className="text-xs text-gray-500">
                          {new Date(result.completedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Action Plan */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Action Plan</h2>

          {!actionPlan ? (
            <div className="text-gray-500 text-center py-8">
              Generate a plan to see actions here
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-blue-50 rounded">
                <p className="text-sm font-medium text-blue-900">Summary</p>
                <p className="text-sm text-blue-700 mt-1">{actionPlan.summary}</p>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Actions</h3>
                <div className="space-y-3">
                  {actionPlan.actions.map((action, index) => (
                    <div key={action.id} className="border border-gray-200 rounded p-3">
                      <div className="flex items-start gap-2">
                        <span className="inline-block w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{action.type}</div>
                          <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                            {JSON.stringify(action.params, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {phase === 'plan' && (
                <button
                  onClick={handleExecutePlan}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Executing...' : 'Approve & Execute'}
                </button>
              )}

              {phase === 'completed' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded text-center">
                  <p className="text-green-800 font-medium">✓ Execution Complete</p>
                  <p className="text-sm text-green-600 mt-1">Run ID: {runId}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
