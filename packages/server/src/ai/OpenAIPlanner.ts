import OpenAI from 'openai';
import { ActionPlan } from '../types';
import { validateActionPlan } from '../utils/validation';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const SYSTEM_PROMPT = `You are a Product Manager Agent that converts user requests into structured action plans.

You can ONLY use these whitelisted action types:
- CREATE_PRODUCT: Create a new product (requires: name, price, recurring)
- UPDATE_PRODUCT: Update a product (requires: productId, optional: name, price, recurring)
- DELETE_PRODUCT: Delete a product (requires: productId)
- ADD_FAQ: Add a FAQ (requires: question, answer)
- UPDATE_FAQ: Update a FAQ (requires: faqId, optional: question, answer)
- DELETE_FAQ: Delete a FAQ (requires: faqId)

You must return a valid JSON action plan with this structure:
{
  "planId": "unique-plan-id",
  "actions": [
    {
      "type": "CREATE_PRODUCT",
      "payload": {
        "name": "Product Name",
        "price": 99.99,
        "recurring": true
      }
    }
  ],
  "description": "Brief description of the plan"
}

IMPORTANT:
- Only use the 6 whitelisted action types listed above
- Never invent new action types
- Generate a unique planId using format: plan_<timestamp>_<random>
- Be precise with payload fields based on the action type
- Validate all required fields are present`;

/**
 * Generate an action plan using OpenAI
 */
export async function generatePlanWithOpenAI(
  userPrompt: string,
  templateData?: any
): Promise<ActionPlan> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  
  const userMessage = templateData
    ? `${userPrompt}\n\nTemplate data: ${JSON.stringify(templateData)}`
    : userPrompt;
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    const planData = JSON.parse(content);
    
    // Validate the plan
    const validation = validateActionPlan(planData);
    if (!validation.valid) {
      throw new Error(`Invalid action plan from AI: ${validation.error}`);
    }
    
    return validation.plan;
  } catch (error: any) {
    console.error('OpenAI planner error:', error);
    throw new Error(`Failed to generate plan with OpenAI: ${error.message}`);
  }
}

/**
 * Generate a plan using rules (deterministic, no AI)
 */
export function generatePlanWithRules(actions: any[], planId?: string): ActionPlan {
  const plan = {
    planId: planId || `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    actions,
    description: 'Plan created with rules',
  };
  
  const validation = validateActionPlan(plan);
  if (!validation.valid) {
    throw new Error(`Invalid action plan: ${validation.error}`);
  }
  
  return validation.plan;
}

/**
 * Generate a plan based on PLANNER_MODE setting
 */
export async function generatePlan(
  userPromptOrActions: string | any[],
  planId?: string,
  templateData?: any
): Promise<ActionPlan> {
  const plannerMode = process.env.PLANNER_MODE || 'RULES';
  
  if (plannerMode === 'OPENAI') {
    if (typeof userPromptOrActions !== 'string') {
      throw new Error('OpenAI planner requires a string prompt');
    }
    return generatePlanWithOpenAI(userPromptOrActions, templateData);
  } else {
    // RULES mode
    if (typeof userPromptOrActions === 'string') {
      throw new Error('Rules planner requires an array of actions');
    }
    return generatePlanWithRules(userPromptOrActions, planId);
  }
}
