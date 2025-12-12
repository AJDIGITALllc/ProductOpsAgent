import { z } from 'zod';

// Zod validators for Action Plan JSON and related types

export const CurrencySchema = z.enum(['usd', 'eur', 'gbp']);

export const PricingIntervalSchema = z.enum(['one_time', 'monthly', 'yearly']);

export const PricingConfigSchema = z.object({
  amount: z.number().min(1, 'Price must be greater than 0'),
  currency: CurrencySchema,
  interval: PricingIntervalSchema,
});

export const FAQSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const DescriptionBlockSchema = z.object({
  type: z.enum(['text', 'heading', 'list']),
  content: z.string(),
  items: z.array(z.string()).optional(),
});

// Action type validation with params
export const ActionTypeSchema = z.enum([
  'whop.product.create',
  'whop.product.update_name',
  'whop.product.set_pricing',
  'whop.product.set_description',
  'whop.product.set_faqs',
  'whop.product.set_payment_options',
  'whop.product.publish',
  'whop.product.get',
]);

// Params validation for each action type
export const CreateProductParamsSchema = z.object({
  name: z.string().min(1),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const UpdateNameParamsSchema = z.object({
  productId: z.string(),
  name: z.string().min(1),
});

export const SetPricingParamsSchema = z.object({
  productId: z.string(),
  pricing: PricingConfigSchema,
});

export const SetDescriptionParamsSchema = z.object({
  productId: z.string(),
  description: z.array(DescriptionBlockSchema),
});

export const SetFAQsParamsSchema = z.object({
  productId: z.string(),
  faqs: z.array(FAQSchema),
});

export const SetPaymentOptionsParamsSchema = z.object({
  productId: z.string(),
  paymentOptions: z.array(z.string()), // e.g., ['card', 'crypto']
});

export const PublishProductParamsSchema = z.object({
  productId: z.string(),
});

export const GetProductParamsSchema = z.object({
  productId: z.string(),
});

// Action schema with dynamic params validation
export const ActionSchema = z.object({
  id: z.string(),
  type: ActionTypeSchema,
  params: z.record(z.any()), // Will be validated based on type
  idempotencyKey: z.string(),
  order: z.number().int().min(0),
});

export const ActionPlanSchema = z.object({
  id: z.string(),
  actions: z.array(ActionSchema).min(1, 'Action plan must have at least one action'),
  summary: z.string().min(1),
  createdAt: z.coerce.date(),
});

// Validate action params based on type
export function validateActionParams(action: z.infer<typeof ActionSchema>): boolean {
  switch (action.type) {
    case 'whop.product.create':
      CreateProductParamsSchema.parse(action.params);
      return true;
    case 'whop.product.update_name':
      UpdateNameParamsSchema.parse(action.params);
      return true;
    case 'whop.product.set_pricing':
      SetPricingParamsSchema.parse(action.params);
      return true;
    case 'whop.product.set_description':
      SetDescriptionParamsSchema.parse(action.params);
      return true;
    case 'whop.product.set_faqs':
      SetFAQsParamsSchema.parse(action.params);
      return true;
    case 'whop.product.set_payment_options':
      SetPaymentOptionsParamsSchema.parse(action.params);
      return true;
    case 'whop.product.publish':
      PublishProductParamsSchema.parse(action.params);
      return true;
    case 'whop.product.get':
      GetProductParamsSchema.parse(action.params);
      return true;
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

// Plan execution request
export const ExecutePlanRequestSchema = z.object({
  runId: z.string(),
  approvalToken: z.string(),
});

// User prompt for planning
export const PlanRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  actorId: z.string(),
});
