import { z } from 'zod';
import { ActionType } from '../types';

const ActionTypeSchema = z.enum([
  'CREATE_PRODUCT',
  'UPDATE_PRODUCT',
  'DELETE_PRODUCT',
  'ADD_FAQ',
  'UPDATE_FAQ',
  'DELETE_FAQ',
]);

const ActionPayloadSchema = z.object({
  // CREATE_PRODUCT fields
  name: z.string().optional(),
  price: z.number().optional(),
  recurring: z.boolean().optional(),
  
  // UPDATE_PRODUCT, DELETE_PRODUCT fields
  productId: z.string().optional(),
  
  // FAQ fields
  question: z.string().optional(),
  answer: z.string().optional(),
  faqId: z.string().optional(),
}).passthrough();

const ActionSchema = z.object({
  type: ActionTypeSchema,
  payload: ActionPayloadSchema,
});

export const ActionPlanSchema = z.object({
  planId: z.string(),
  actions: z.array(ActionSchema).min(1),
  description: z.string().optional(),
});

export function validateActionPlan(data: any): { valid: boolean; error?: string; plan?: any } {
  try {
    const plan = ActionPlanSchema.parse(data);
    return { valid: true, plan };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

export function isWhitelistedAction(type: string): type is ActionType {
  return ActionTypeSchema.safeParse(type).success;
}
