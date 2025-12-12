import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface HealthStatus {
  mode: 'REAL' | 'STUB';
  database: 'connected' | 'error';
  timestamp: string;
}

interface Plan {
  planId: string;
  status: string;
  plan: any;
  actions: any[];
  execution?: {
    status: string;
    startedAt: string;
    completedAt?: string;
    failedStepIndex?: number;
    resultJson?: any;
    errorMessage?: string;
  };
}

interface WebhookDelivery {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  lastAttemptAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  createdAt: string;
  attemptsHistory: any[];
}

const API_BASE = '/api';

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [planId, setPlanId] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE}/health`);
      setHealth(response.data);
    } catch (err: any) {
      console.error('Failed to load health:', err);
    }
  };

  const loadPlan = async () => {
    if (!planId) {
      setError('Please enter a plan ID');
      return;
    }

    setLoading(true);
    setError('');
    setPlan(null);
    setWebhooks([]);

    try {
      // Note: In production, this would require authentication
      const response = await axios.get(`${API_BASE}/plans/${planId}`);
      setPlan(response.data);

      // Load webhooks if available (Owner only)
      try {
        const webhookResponse = await axios.get(`${API_BASE}/admin/webhooks/${planId}`);
        setWebhooks(webhookResponse.data.webhooks);
      } catch (webhookErr) {
        // Webhooks might not be accessible without auth
        console.log('Webhooks not loaded (may require authentication)');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed')) return 'status-completed';
    if (statusLower.includes('failed')) return 'status-failed';
    if (statusLower.includes('running') || statusLower.includes('executing')) return 'status-running';
    return 'status-pending';
  };

  return (
    <div>
      {health && (
        <div className={`banner ${health.mode === 'REAL' ? 'banner-real' : 'banner-stub'}`}>
          MODE: {health.mode} | Database: {health.database.toUpperCase()}
        </div>
      )}

      <div className="container">
        <h1 style={{ marginBottom: '20px' }}>ProductOpsAgent Admin</h1>

        <div className="card">
          <h2>Load Plan</h2>
          <div>
            <input
              type="text"
              placeholder="Enter Plan ID"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadPlan()}
            />
            <button onClick={loadPlan} disabled={loading}>
              {loading ? 'Loading...' : 'Load Plan'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {plan && (
          <>
            <div className="card">
              <h2>Plan Overview</h2>
              <p><strong>Plan ID:</strong> {plan.planId}</p>
              <p><strong>Status:</strong> <span className={`status-badge ${getStatusClass(plan.status)}`}>{plan.status}</span></p>
              <p><strong>Actions:</strong> {plan.actions.length}</p>
            </div>

            <div className="card">
              <h2>Plan JSON</h2>
              <div className="code-block" style={{ position: 'relative' }}>
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(JSON.stringify(plan.plan, null, 2))}
                >
                  Copy
                </button>
                {JSON.stringify(plan.plan, null, 2)}
              </div>
            </div>

            <div className="card">
              <h2>Actions</h2>
              {plan.actions.map((action, index) => (
                <div key={index} style={{ marginBottom: '15px', borderLeft: '3px solid #2196f3', paddingLeft: '15px' }}>
                  <p><strong>Action {index}:</strong> {action.actionType}</p>
                  <p><strong>Status:</strong> <span className={`status-badge ${getStatusClass(action.status)}`}>{action.status}</span></p>
                  <details>
                    <summary style={{ cursor: 'pointer', marginTop: '5px' }}>Payload & Result</summary>
                    <div className="code-block" style={{ marginTop: '10px' }}>
                      <strong>Payload:</strong>
                      <pre>{JSON.stringify(action.payload, null, 2)}</pre>
                      {action.result && (
                        <>
                          <strong>Result:</strong>
                          <pre>{JSON.stringify(action.result, null, 2)}</pre>
                        </>
                      )}
                    </div>
                  </details>
                </div>
              ))}
            </div>

            {plan.execution && (
              <div className="card">
                <h2>Execution State</h2>
                <p><strong>Status:</strong> <span className={`status-badge ${getStatusClass(plan.execution.status)}`}>{plan.execution.status}</span></p>
                <p><strong>Started:</strong> {new Date(plan.execution.startedAt).toLocaleString()}</p>
                {plan.execution.completedAt && (
                  <p><strong>Completed:</strong> {new Date(plan.execution.completedAt).toLocaleString()}</p>
                )}
                {plan.execution.failedStepIndex !== undefined && (
                  <p><strong>Failed at Step:</strong> {plan.execution.failedStepIndex}</p>
                )}
                {plan.execution.errorMessage && (
                  <p><strong>Error:</strong> {plan.execution.errorMessage}</p>
                )}
                {plan.execution.resultJson && (
                  <div>
                    <h3 style={{ marginTop: '15px' }}>Execution Results</h3>
                    <div className="code-block" style={{ position: 'relative' }}>
                      <button
                        className="copy-button"
                        onClick={() => copyToClipboard(JSON.stringify(plan.execution!.resultJson, null, 2))}
                      >
                        Copy
                      </button>
                      {JSON.stringify(plan.execution.resultJson, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {webhooks.length > 0 && (
              <div className="card">
                <h2>Webhook Deliveries</h2>
                <div className="webhook-list">
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="webhook-item">
                      <h4>{webhook.eventType}</h4>
                      <p><strong>Status:</strong> <span className={`status-badge ${getStatusClass(webhook.status)}`}>{webhook.status}</span></p>
                      <p><strong>Attempts:</strong> {webhook.attempts} / {webhook.maxAttempts}</p>
                      {webhook.deliveredAt && (
                        <p><strong>Delivered:</strong> {new Date(webhook.deliveredAt).toLocaleString()}</p>
                      )}
                      {webhook.errorMessage && (
                        <p><strong>Error:</strong> {webhook.errorMessage}</p>
                      )}
                      {webhook.nextRetryAt && (
                        <p><strong>Next Retry:</strong> {new Date(webhook.nextRetryAt).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
