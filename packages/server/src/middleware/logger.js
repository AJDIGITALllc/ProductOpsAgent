/**
 * Structured request logger middleware
 * Logs all plan/execute calls with user, planId, action count, duration, and status
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Capture the original end function
  const originalEnd = res.end;
  
  // Override end to log after response
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Structured log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };
    
    // Add user info if authenticated
    if (req.user) {
      logEntry.userId = req.user.userId;
      logEntry.userEmail = req.user.email;
      logEntry.userRole = req.user.role;
    }
    
    // Add plan-specific info
    if (req.body?.planId || req.params?.planId) {
      logEntry.planId = req.body.planId || req.params.planId;
    }
    
    if (req.body?.actions) {
      logEntry.actionCount = req.body.actions.length;
    }
    
    // Log based on status
    if (res.statusCode >= 500) {
      console.error('[ERROR]', JSON.stringify(logEntry));
    } else if (res.statusCode >= 400) {
      console.warn('[WARN]', JSON.stringify(logEntry));
    } else {
      console.log('[INFO]', JSON.stringify(logEntry));
    }
    
    // Call the original end function
    originalEnd.apply(res, args);
  };
  
  next();
}
