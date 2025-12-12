import { prisma } from '@product-ops-agent/database';
import {
  Action,
  ActionType,
  ActionSchema,
  CreateDraftAction,
  SetPricingAction,
  AddDescriptionBlockAction,
  AddFAQAction,
  SetPaymentOptionsAction,
  PublishAction,
} from '../types/actions';
import { whopClient } from '../integrations/whop/WhopClient';
import { auditService } from './audit.service';

export class ActionService {
  // Validate action against whitelist and schema
  validateAction(action: unknown): Action {
    return ActionSchema.parse(action);
  }

  // Execute a single action
  async executeAction(action: Action, planId?: string): Promise<any> {
    const validated = this.validateAction(action);

    switch (validated.type) {
      case ActionType.CREATE_DRAFT:
        return this.executeCreateDraft(validated, planId);
      case ActionType.SET_PRICING:
        return this.executeSetPricing(validated, planId);
      case ActionType.ADD_DESCRIPTION_BLOCK:
        return this.executeAddDescriptionBlock(validated, planId);
      case ActionType.ADD_FAQ:
        return this.executeAddFAQ(validated, planId);
      case ActionType.SET_PAYMENT_OPTIONS:
        return this.executeSetPaymentOptions(validated, planId);
      case ActionType.PUBLISH:
        return this.executePublish(validated, planId);
      default:
        throw new Error(`Unknown action type: ${(action as any).type}`);
    }
  }

  private async executeCreateDraft(
    action: CreateDraftAction,
    planId?: string
  ): Promise<any> {
    const { name, description, templateId } = action.payload;

    // Load template config if provided
    let templateConfig: any = null;
    if (templateId) {
      const template = await prisma.productTemplate.findUnique({
        where: { id: templateId },
      });
      if (template) {
        templateConfig = JSON.parse(template.config);
      }
    }

    // Create draft product in database
    const product = await prisma.product.create({
      data: {
        name,
        description: description || templateConfig?.descriptionBlocks?.[0]?.content,
        pricing: templateConfig?.pricing
          ? JSON.stringify(templateConfig.pricing)
          : JSON.stringify({ type: 'one_time', amount: 0 }),
        descriptionBlocks: templateConfig?.descriptionBlocks
          ? JSON.stringify(templateConfig.descriptionBlocks)
          : null,
        faqs: templateConfig?.faqs ? JSON.stringify(templateConfig.faqs) : null,
        paymentOptions: templateConfig?.paymentOptions
          ? JSON.stringify(templateConfig.paymentOptions)
          : null,
        status: 'draft',
      },
    });

    // Log the action
    await auditService.log({
      action: ActionType.CREATE_DRAFT,
      productId: product.id,
      planId,
      details: JSON.stringify({ name, description, templateId }),
      status: 'success',
    });

    return product;
  }

  private async executeSetPricing(
    action: SetPricingAction,
    planId?: string
  ): Promise<any> {
    const { productId, pricing } = action.payload;

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        pricing: JSON.stringify(pricing),
      },
    });

    await auditService.log({
      action: ActionType.SET_PRICING,
      productId,
      planId,
      details: JSON.stringify({ pricing }),
      status: 'success',
    });

    return product;
  }

  private async executeAddDescriptionBlock(
    action: AddDescriptionBlockAction,
    planId?: string
  ): Promise<any> {
    const { productId, block } = action.payload;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const blocks = product.descriptionBlocks
      ? JSON.parse(product.descriptionBlocks)
      : [];
    blocks.push(block);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        descriptionBlocks: JSON.stringify(blocks),
      },
    });

    await auditService.log({
      action: ActionType.ADD_DESCRIPTION_BLOCK,
      productId,
      planId,
      details: JSON.stringify({ block }),
      status: 'success',
    });

    return updated;
  }

  private async executeAddFAQ(
    action: AddFAQAction,
    planId?: string
  ): Promise<any> {
    const { productId, faq } = action.payload;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const faqs = product.faqs ? JSON.parse(product.faqs) : [];
    faqs.push(faq);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        faqs: JSON.stringify(faqs),
      },
    });

    await auditService.log({
      action: ActionType.ADD_FAQ,
      productId,
      planId,
      details: JSON.stringify({ faq }),
      status: 'success',
    });

    return updated;
  }

  private async executeSetPaymentOptions(
    action: SetPaymentOptionsAction,
    planId?: string
  ): Promise<any> {
    const { productId, options } = action.payload;

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        paymentOptions: JSON.stringify(options),
      },
    });

    await auditService.log({
      action: ActionType.SET_PAYMENT_OPTIONS,
      productId,
      planId,
      details: JSON.stringify({ options }),
      status: 'success',
    });

    return product;
  }

  private async executePublish(
    action: PublishAction,
    planId?: string
  ): Promise<any> {
    const { productId } = action.payload;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.status === 'published') {
      throw new Error('Product is already published');
    }

    // Create or update in Whop using new WhopClient
    let whopProduct;
    if (product.whopProductId) {
      // Update existing product in Whop
      whopProduct = await whopClient.updateProduct(product.whopProductId, {
        name: product.name,
        description: product.description || undefined,
      });
      
      // Set pricing if available
      if (product.pricing) {
        const pricing = JSON.parse(product.pricing);
        await whopClient.setPricing(product.whopProductId, pricing);
      }
      
      // Add metadata (description blocks, FAQs, payment options)
      const metadata: Record<string, any> = {};
      if (product.descriptionBlocks) {
        metadata.descriptionBlocks = JSON.parse(product.descriptionBlocks);
      }
      if (product.faqs) {
        metadata.faqs = JSON.parse(product.faqs);
      }
      if (product.paymentOptions) {
        metadata.paymentOptions = JSON.parse(product.paymentOptions);
      }
      if (Object.keys(metadata).length > 0) {
        await whopClient.addMetadata(product.whopProductId, metadata);
      }
      
      // Publish the product
      whopProduct = await whopClient.publishProduct(product.whopProductId);
    } else {
      // Create new product in Whop
      whopProduct = await whopClient.createProduct({
        name: product.name,
        description: product.description || undefined,
      });
      
      // Set pricing if available
      if (product.pricing) {
        const pricing = JSON.parse(product.pricing);
        await whopClient.setPricing(whopProduct.id, pricing);
      }
      
      // Add metadata (description blocks, FAQs, payment options)
      const metadata: Record<string, any> = {};
      if (product.descriptionBlocks) {
        metadata.descriptionBlocks = JSON.parse(product.descriptionBlocks);
      }
      if (product.faqs) {
        metadata.faqs = JSON.parse(product.faqs);
      }
      if (product.paymentOptions) {
        metadata.paymentOptions = JSON.parse(product.paymentOptions);
      }
      if (Object.keys(metadata).length > 0) {
        await whopClient.addMetadata(whopProduct.id, metadata);
      }
      
      // Publish the product
      whopProduct = await whopClient.publishProduct(whopProduct.id);
    }

    // Update local product with Whop ID and status
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        whopProductId: whopProduct.id,
        status: 'published',
      },
    });

    await auditService.log({
      action: ActionType.PUBLISH,
      productId,
      planId,
      details: JSON.stringify({ whopProductId: whopProduct.id }),
      status: 'success',
    });

    return updated;
  }
}

export const actionService = new ActionService();
