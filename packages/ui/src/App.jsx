import React, { useState, useEffect } from 'react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [stubMode, setStubMode] = useState(false);
  
  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  
  // Plan creation
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('29.99');
  const [currency, setCurrency] = useState('USD');
  const [interval, setInterval] = useState('monthly');
  const [publish, setPublish] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  
  // Plan results
  const [currentPlan, setCurrentPlan] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (token) {
      // Decode token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (err) {
        console.error('Invalid token:', err);
        setToken('');
        localStorage.removeItem('token');
      }
    }
    
    // Check stub mode
    fetch('/api/plans/stub-mode')
      .then(res => res.json())
      .then(data => setStubMode(data.stubMode))
      .catch(err => console.error('Failed to check stub mode:', err));
  }, [token]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      setSuccess('Login successful!');
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    setCurrentPlan(null);
    setExecutionResult(null);
  };
  
  const addFaq = () => {
    if (faqQuestion && faqAnswer) {
      setFaqs([...faqs, { question: faqQuestion, answer: faqAnswer }]);
      setFaqQuestion('');
      setFaqAnswer('');
    }
  };
  
  const removeFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };
  
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const input = {
        productName,
        price: parseFloat(price),
        currency,
        interval,
        publish,
        faqs: faqs.length > 0 ? faqs : undefined
      };
      
      const response = await fetch('/api/plans/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(input)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create plan');
      }
      
      setCurrentPlan(data.plan);
      setExecutionResult(null);
      setSuccess('Plan created successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprovePlan = async () => {
    if (!currentPlan) return;
    
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const response = await fetch(`/api/plans/${currentPlan.planId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to approve plan');
      }
      
      setCurrentPlan(data.plan);
      setSuccess('Plan approved successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExecutePlan = async () => {
    if (!currentPlan) return;
    
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const response = await fetch(`/api/plans/${currentPlan.planId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to execute plan');
      }
      
      setExecutionResult(data.result);
      
      if (data.result.status === 'EXECUTED') {
        setSuccess('Plan executed successfully!');
      } else if (data.result.status === 'FAILED') {
        setError(`Plan execution failed at step ${data.result.failedStepIndex + 1}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess(`${label} copied to clipboard!`);
      setTimeout(() => setSuccess(null), 2000);
    }).catch(err => {
      setError('Failed to copy to clipboard');
    });
  };
  
  // Login screen
  if (!token) {
    return (
      <div className="container">
        <div className="login-container">
          <div className="card">
            <h1>ProductOps Agent - Login</h1>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Demo login - any credentials accepted
            </p>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="User">User</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  
  // Main UI
  return (
    <div className="container">
      {stubMode && (
        <div className="stub-banner">
          ⚠️ STUB MODE - WHOP_API_KEY not configured. Actions will be simulated.
        </div>
      )}
      
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>ProductOps Agent</h1>
            <p style={{ color: '#666' }}>
              Logged in as: {user?.email} ({user?.role})
            </p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="card">
        <h2>Create Product Plan</h2>
        
        <form onSubmit={handleCreatePlan}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Premium Membership"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Billing Interval</label>
            <select value={interval} onChange={(e) => setInterval(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
              <option value="one_time">One Time</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Mode</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${!publish ? 'active' : ''}`}
                onClick={() => setPublish(false)}
              >
                Draft
              </button>
              <button
                type="button"
                className={`toggle-btn ${publish ? 'active' : ''}`}
                onClick={() => setPublish(true)}
              >
                Publish
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label>FAQs</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="Question"
                style={{ flex: 1 }}
              />
              <input
                type="text"
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="Answer"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={addFaq}
                className="btn btn-secondary"
              >
                Add FAQ
              </button>
            </div>
            
            {faqs.length > 0 && (
              <div className="faq-list">
                {faqs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <div className="faq-content">
                      <strong>Q:</strong> {faq.question}<br />
                      <strong>A:</strong> {faq.answer}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="btn btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Plan'}
          </button>
        </form>
      </div>
      
      {currentPlan && (
        <div className="card">
          <h2>Generated Plan</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Plan ID:</strong> {currentPlan.planId}<br />
            <strong>Status:</strong>{' '}
            <span className={`status-badge status-${currentPlan.status.toLowerCase()}`}>
              {currentPlan.status}
            </span><br />
            <strong>Actions:</strong> {currentPlan.actions.length}
          </div>
          
          <div className="plan-display">
            <pre className="plan-json">
              {JSON.stringify(currentPlan, null, 2)}
            </pre>
          </div>
          
          <div className="button-group">
            <button
              onClick={() => copyToClipboard(JSON.stringify(currentPlan, null, 2), 'Plan JSON')}
              className="btn btn-secondary"
            >
              📋 Copy Plan JSON
            </button>
            
            {currentPlan.status === 'PENDING' && (
              <button
                onClick={handleApprovePlan}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Approving...' : 'Approve Plan'}
              </button>
            )}
            
            {currentPlan.status === 'APPROVED' && (
              <button
                onClick={handleExecutePlan}
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? 'Executing...' : 'Execute Plan'}
              </button>
            )}
          </div>
        </div>
      )}
      
      {executionResult && (
        <div className="card">
          <h2>Execution Result</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Status:</strong>{' '}
            <span className={`status-badge status-${executionResult.status.toLowerCase()}`}>
              {executionResult.status}
            </span>
          </div>
          
          {executionResult.status === 'FAILED' && (
            <div className="failure-details">
              <h4>❌ Execution Failed</h4>
              <p><strong>Failed at step:</strong> {executionResult.failedStepIndex + 1}</p>
              <p><strong>Error:</strong> {executionResult.errorMessage}</p>
              <p><strong>Completed steps:</strong> {executionResult.completedSteps.length}</p>
            </div>
          )}
          
          <div className="plan-display">
            <pre className="plan-json">
              {JSON.stringify(executionResult, null, 2)}
            </pre>
          </div>
          
          <div className="button-group">
            <button
              onClick={() => copyToClipboard(JSON.stringify(executionResult, null, 2), 'Execution JSON')}
              className="btn btn-secondary"
            >
              📋 Copy Execution JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
