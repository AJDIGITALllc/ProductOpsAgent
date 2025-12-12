/**
 * Telemetry Service
 * 
 * Tracks and manages:
 * - Planner latency, token usage, and plan size
 * - Daily execution quota
 * - Daily planner call quota
 * - Global EXECUTION_DISABLED kill switch
 * - Image generation metrics
 */

class TelemetryService {
  constructor() {
    this.metrics = {
      planner: {
        totalCalls: 0,
        todayCalls: 0,
        totalLatencyMs: 0,
        totalTokens: 0,
        totalPlanSize: 0,
        lastReset: new Date().toISOString().split('T')[0]
      },
      execution: {
        totalExecutions: 0,
        todayExecutions: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        lastReset: new Date().toISOString().split('T')[0]
      },
      images: {
        totalGenerated: 0,
        todayGenerated: 0,
        lastReset: new Date().toISOString().split('T')[0]
      },
      quotas: {
        dailyExecutionQuota: parseInt(process.env.DAILY_EXECUTION_QUOTA || '100', 10),
        dailyPlannerQuota: parseInt(process.env.DAILY_PLANNER_QUOTA || '1000', 10),
        dailyImageQuota: parseInt(process.env.DAILY_IMAGE_QUOTA || '50', 10)
      }
    };
    
    this.resetInterval = null;
    
    // Reset daily counters at midnight
    this.startDailyReset();
  }
  
  startDailyReset() {
    this.resetInterval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      
      if (this.metrics.planner.lastReset !== today) {
        console.log('🔄 Resetting daily planner metrics');
        this.metrics.planner.todayCalls = 0;
        this.metrics.planner.lastReset = today;
      }
      
      if (this.metrics.execution.lastReset !== today) {
        console.log('🔄 Resetting daily execution metrics');
        this.metrics.execution.todayExecutions = 0;
        this.metrics.execution.lastReset = today;
      }
      
      if (this.metrics.images.lastReset !== today) {
        console.log('🔄 Resetting daily image metrics');
        this.metrics.images.todayGenerated = 0;
        this.metrics.images.lastReset = today;
      }
    }, 60000); // Check every minute
  }
  
  // Cleanup method for graceful shutdown
  cleanup() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
      this.resetInterval = null;
      console.log('🧹 Telemetry service cleanup complete');
    }
  }
  
  // Record planner call
  recordPlannerCall(latencyMs, tokens, planSize) {
    this.metrics.planner.totalCalls++;
    this.metrics.planner.todayCalls++;
    this.metrics.planner.totalLatencyMs += latencyMs;
    this.metrics.planner.totalTokens += tokens;
    this.metrics.planner.totalPlanSize += planSize;
    
    console.log(`📊 Planner call recorded: ${latencyMs}ms, ${tokens} tokens, plan size ${planSize}`);
  }
  
  // Check if planner quota exceeded
  checkPlannerQuota() {
    if (this.metrics.planner.todayCalls >= this.metrics.quotas.dailyPlannerQuota) {
      throw new Error(`Daily planner quota exceeded (${this.metrics.quotas.dailyPlannerQuota})`);
    }
  }
  
  // Record execution
  recordExecution(success) {
    this.metrics.execution.totalExecutions++;
    this.metrics.execution.todayExecutions++;
    
    if (success) {
      this.metrics.execution.totalSuccesses++;
    } else {
      this.metrics.execution.totalFailures++;
    }
    
    console.log(`📊 Execution recorded: ${success ? 'success' : 'failure'}`);
  }
  
  // Check if execution quota exceeded
  checkExecutionQuota() {
    if (this.metrics.execution.todayExecutions >= this.metrics.quotas.dailyExecutionQuota) {
      throw new Error(`Daily execution quota exceeded (${this.metrics.quotas.dailyExecutionQuota})`);
    }
  }
  
  // Check if execution is disabled globally
  checkExecutionEnabled() {
    if (process.env.EXECUTION_DISABLED === 'true') {
      throw new Error('Execution is globally disabled (EXECUTION_DISABLED=true)');
    }
  }
  
  // Record image generation
  recordImageGeneration() {
    this.metrics.images.totalGenerated++;
    this.metrics.images.todayGenerated++;
    
    console.log(`📊 Image generation recorded`);
  }
  
  // Check if image quota exceeded
  checkImageQuota() {
    if (this.metrics.images.todayGenerated >= this.metrics.quotas.dailyImageQuota) {
      throw new Error(`Daily image quota exceeded (${this.metrics.quotas.dailyImageQuota})`);
    }
  }
  
  // Get all metrics
  getTelemetry() {
    const avgLatency = this.metrics.planner.totalCalls > 0
      ? Math.round(this.metrics.planner.totalLatencyMs / this.metrics.planner.totalCalls)
      : 0;
    
    const avgPlanSize = this.metrics.planner.totalCalls > 0
      ? Math.round(this.metrics.planner.totalPlanSize / this.metrics.planner.totalCalls)
      : 0;
    
    const successRate = this.metrics.execution.totalExecutions > 0
      ? (this.metrics.execution.totalSuccesses / this.metrics.execution.totalExecutions * 100).toFixed(2)
      : 0;
    
    return {
      planner: {
        totalCalls: this.metrics.planner.totalCalls,
        todayCalls: this.metrics.planner.todayCalls,
        avgLatencyMs: avgLatency,
        totalTokens: this.metrics.planner.totalTokens,
        avgPlanSize: avgPlanSize
      },
      execution: {
        totalExecutions: this.metrics.execution.totalExecutions,
        todayExecutions: this.metrics.execution.todayExecutions,
        totalSuccesses: this.metrics.execution.totalSuccesses,
        totalFailures: this.metrics.execution.totalFailures,
        successRate: parseFloat(successRate)
      },
      images: {
        totalGenerated: this.metrics.images.totalGenerated,
        todayGenerated: this.metrics.images.todayGenerated
      },
      quotas: {
        dailyExecutionQuota: this.metrics.quotas.dailyExecutionQuota,
        dailyPlannerQuota: this.metrics.quotas.dailyPlannerQuota,
        dailyImageQuota: this.metrics.quotas.dailyImageQuota,
        executionDisabled: process.env.EXECUTION_DISABLED === 'true'
      }
    };
  }
}

// Singleton instance
const telemetryService = new TelemetryService();

module.exports = {
  recordPlannerCall: (latencyMs, tokens, planSize) => telemetryService.recordPlannerCall(latencyMs, tokens, planSize),
  checkPlannerQuota: () => telemetryService.checkPlannerQuota(),
  recordExecution: (success) => telemetryService.recordExecution(success),
  checkExecutionQuota: () => telemetryService.checkExecutionQuota(),
  checkExecutionEnabled: () => telemetryService.checkExecutionEnabled(),
  recordImageGeneration: () => telemetryService.recordImageGeneration(),
  checkImageQuota: () => telemetryService.checkImageQuota(),
  getTelemetry: () => telemetryService.getTelemetry(),
  cleanup: () => telemetryService.cleanup()
};
