import { nanoid } from 'nanoid';
import type { ActionPlan, Action } from '@productopsagent/shared';

/**
 * PlannerService creates deterministic action plans from user prompts.
 * This is a rule-based implementation for MVP. In production, this could be
 * enhanced with LLM-based planning while maintaining deterministic output.
 */
export class PlannerService {
  /**
   * Generate an action plan from a user prompt
   * This is a simple rule-based parser for MVP demonstration
   */
  generatePlan(prompt: string, actorId: string): ActionPlan {
    const actions: Action[] = [];
    let order = 0;

    const lowerPrompt = prompt.toLowerCase();

    // Parse product creation
    const createMatch = lowerPrompt.match(/create.*?product.*?(?:called|named)\s+["']?([^"',]+)["']?/i);
    let productId = nanoid();

    if (createMatch) {
      const productName = createMatch[1].trim();
      const status = lowerPrompt.includes('publish') ? 'published' : 'draft';

      actions.push({
        id: nanoid(),
        type: 'whop.product.create',
        params: { name: productName, status },
        idempotencyKey: `create-${productId}-${actorId}`,
        order: order++,
      });
    }

    // Parse pricing
    const priceMatch = lowerPrompt.match(/price.*?(?:at|of)?\s*\$?(\d+(?:\.\d{2})?)/i);
    if (priceMatch) {
      const priceAmount = Math.round(parseFloat(priceMatch[1]) * 100); // Convert to cents

      let interval: 'one_time' | 'monthly' | 'yearly' = 'one_time';
      if (lowerPrompt.includes('recurring') || lowerPrompt.includes('monthly') || lowerPrompt.includes('subscription')) {
        interval = 'monthly';
      } else if (lowerPrompt.includes('yearly') || lowerPrompt.includes('annual')) {
        interval = 'yearly';
      }

      actions.push({
        id: nanoid(),
        type: 'whop.product.set_pricing',
        params: {
          productId,
          pricing: {
            amount: priceAmount,
            currency: 'usd',
            interval,
          },
        },
        idempotencyKey: `pricing-${productId}-${actorId}`,
        order: order++,
      });
    }

    // Parse description
    const descMatch = lowerPrompt.match(/description[:\s]+["']?([^"'\n]+)["']?/i);
    if (descMatch) {
      const descText = descMatch[1].trim();
      actions.push({
        id: nanoid(),
        type: 'whop.product.set_description',
        params: {
          productId,
          description: [
            { type: 'text', content: descText },
          ],
        },
        idempotencyKey: `description-${productId}-${actorId}`,
        order: order++,
      });
    }

    // Parse FAQs
    if (lowerPrompt.includes('faq') || lowerPrompt.includes('frequently asked')) {
      // Add default FAQs for demo
      actions.push({
        id: nanoid(),
        type: 'whop.product.set_faqs',
        params: {
          productId,
          faqs: [
            {
              question: 'What is included?',
              answer: 'All features and benefits are included in this product.',
            },
            {
              question: 'How do I get started?',
              answer: 'After purchase, you will receive instant access.',
            },
          ],
        },
        idempotencyKey: `faqs-${productId}-${actorId}`,
        order: order++,
      });
    }

    // If explicitly requested to publish
    if (lowerPrompt.includes('publish') && !createMatch) {
      actions.push({
        id: nanoid(),
        type: 'whop.product.publish',
        params: { productId },
        idempotencyKey: `publish-${productId}-${actorId}`,
        order: order++,
      });
    }

    // Generate summary
    const summary = this.generateSummary(actions);

    return {
      id: nanoid(),
      actions,
      summary,
      createdAt: new Date(),
    };
  }

  private generateSummary(actions: Action[]): string {
    if (actions.length === 0) {
      return 'No actions identified from prompt.';
    }

    const parts: string[] = [];

    actions.forEach((action) => {
      switch (action.type) {
        case 'whop.product.create':
          parts.push(`Create product "${action.params.name}" (${action.params.status})`);
          break;
        case 'whop.product.set_pricing':
          const amt = action.params.pricing.amount / 100;
          parts.push(`Set pricing to $${amt} (${action.params.pricing.interval})`);
          break;
        case 'whop.product.set_description':
          parts.push('Set product description');
          break;
        case 'whop.product.set_faqs':
          parts.push(`Add ${action.params.faqs.length} FAQs`);
          break;
        case 'whop.product.publish':
          parts.push('Publish product');
          break;
        case 'whop.product.update_name':
          parts.push(`Update product name to "${action.params.name}"`);
          break;
        case 'whop.product.set_payment_options':
          parts.push('Set payment options');
          break;
      }
    });

    return parts.join(', ');
  }
}
