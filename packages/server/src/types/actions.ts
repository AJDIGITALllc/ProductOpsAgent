import { z } from 'zod';

// Action types whitelist
export enum ActionType {
  CREATE_DRAFT = 'create_draft',
  SET_PRICING = 'set_pricing',
  ADD_DESCRIPTION_BLOCK = 'add_description_block',
  ADD_FAQ = 'add_faq',
  SET_PAYMENT_OPTIONS = 'set_payment_options',
  PUBLISH = 'publish',
}

// Pricing schemas
export const OneTimePricingSchema = z.object({
  type: z.literal('one_time'),
  amount: z.number().positive(),
});

export const RecurringPricingSchema = z.object({
  type: z.literal('recurring'),
  amount: z.number().positive(),
  interval: z.enum(['day', 'week', 'month', 'year']),
});

export const PricingSchema = z.union([
  OneTimePricingSchema,
  RecurringPricingSchema,
]);

// Description block schema
export const DescriptionBlockSchema = z.object({
  type: z.enum(['text', 'features', 'testimonials']),
  content: z.string().optional(),
  items: z.array(z.any()).optional(),
});

// FAQ schema
export const FAQSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

// Payment options schema
export const PaymentOptionsSchema = z.object({
  methods: z.array(z.enum(['card', 'crypto', 'paypal'])),
  trialPeriod: z.number().nullable().optional(),
});

// Action payloads
export const CreateDraftActionSchema = z.object({
  type: z.literal(ActionType.CREATE_DRAFT),
  payload: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    templateId: z.string().optional(),
  }),
});

export const SetPricingActionSchema = z.object({
  type: z.literal(ActionType.SET_PRICING),
  payload: z.object({
    productId: z.string(),
    pricing: PricingSchema,
  }),
});

export const AddDescriptionBlockActionSchema = z.object({
  type: z.literal(ActionType.ADD_DESCRIPTION_BLOCK),
  payload: z.object({
    productId: z.string(),
    block: DescriptionBlockSchema,
  }),
});

export const AddFAQActionSchema = z.object({
  type: z.literal(ActionType.ADD_FAQ),
  payload: z.object({
    productId: z.string(),
    faq: FAQSchema,
  }),
});

export const SetPaymentOptionsActionSchema = z.object({
  type: z.literal(ActionType.SET_PAYMENT_OPTIONS),
  payload: z.object({
    productId: z.string(),
    options: PaymentOptionsSchema,
  }),
});

export const PublishActionSchema = z.object({
  type: z.literal(ActionType.PUBLISH),
  payload: z.object({
    productId: z.string(),
  }),
});

// Union of all action schemas
export const ActionSchema = z.discriminatedUnion('type', [
  CreateDraftActionSchema,
  SetPricingActionSchema,
  AddDescriptionBlockActionSchema,
  AddFAQActionSchema,
  SetPaymentOptionsActionSchema,
  PublishActionSchema,
]);

export type Action = z.infer<typeof ActionSchema>;
export type CreateDraftAction = z.infer<typeof CreateDraftActionSchema>;
export type SetPricingAction = z.infer<typeof SetPricingActionSchema>;
export type AddDescriptionBlockAction = z.infer<
  typeof AddDescriptionBlockActionSchema
>;
export type AddFAQAction = z.infer<typeof AddFAQActionSchema>;
export type SetPaymentOptionsAction = z.infer<
  typeof SetPaymentOptionsActionSchema
>;
export type PublishAction = z.infer<typeof PublishActionSchema>;
