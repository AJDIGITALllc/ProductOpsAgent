import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Create a default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@productopsagent.local' },
    update: {},
    create: {
      id: nanoid(),
      email: 'admin@productopsagent.local',
      name: 'Admin User',
      role: 'admin',
    },
  });

  console.log('Created admin user:', adminUser.email);

  // Seed templates
  const templates = [
    {
      name: 'Consulting Retainer',
      description: 'Monthly consulting retainer package',
      actionPlan: {
        id: nanoid(),
        actions: [
          {
            id: nanoid(),
            type: 'whop.product.create',
            params: { name: 'Monthly Consulting Retainer', status: 'draft' },
            idempotencyKey: `template-consulting-create-${Date.now()}`,
            order: 0,
          },
          {
            id: nanoid(),
            type: 'whop.product.set_pricing',
            params: {
              productId: 'template-product-1',
              pricing: {
                amount: 299900, // $2,999/month
                currency: 'usd',
                interval: 'monthly',
              },
            },
            idempotencyKey: `template-consulting-pricing-${Date.now()}`,
            order: 1,
          },
          {
            id: nanoid(),
            type: 'whop.product.set_description',
            params: {
              productId: 'template-product-1',
              description: [
                { type: 'heading', content: 'Monthly Consulting Retainer' },
                {
                  type: 'text',
                  content:
                    'Get ongoing strategic guidance and support with our monthly consulting retainer.',
                },
                { type: 'heading', content: 'What\'s Included' },
                {
                  type: 'list',
                  content: 'Key benefits',
                  items: [
                    '4 hours of consulting per month',
                    'Priority email support',
                    'Monthly strategy session',
                    'Access to exclusive resources',
                  ],
                },
              ],
            },
            idempotencyKey: `template-consulting-desc-${Date.now()}`,
            order: 2,
          },
          {
            id: nanoid(),
            type: 'whop.product.set_faqs',
            params: {
              productId: 'template-product-1',
              faqs: [
                {
                  question: 'Can I cancel anytime?',
                  answer: 'Yes, you can cancel your subscription at any time.',
                },
                {
                  question: 'How are consulting hours scheduled?',
                  answer: 'We\'ll work with you to schedule sessions at your convenience.',
                },
              ],
            },
            idempotencyKey: `template-consulting-faqs-${Date.now()}`,
            order: 3,
          },
        ],
        summary: 'Create monthly consulting retainer product with pricing, description, and FAQs',
        createdAt: new Date().toISOString(),
      },
    },
    {
      name: 'Personal Brand Package',
      description: 'One-time personal branding package',
      actionPlan: {
        id: nanoid(),
        actions: [
          {
            id: nanoid(),
            type: 'whop.product.create',
            params: { name: 'Personal Brand Package', status: 'draft' },
            idempotencyKey: `template-brand-create-${Date.now()}`,
            order: 0,
          },
          {
            id: nanoid(),
            type: 'whop.product.set_pricing',
            params: {
              productId: 'template-product-2',
              pricing: {
                amount: 149900, // $1,499 one-time
                currency: 'usd',
                interval: 'one_time',
              },
            },
            idempotencyKey: `template-brand-pricing-${Date.now()}`,
            order: 1,
          },
          {
            id: nanoid(),
            type: 'whop.product.set_description',
            params: {
              productId: 'template-product-2',
              description: [
                { type: 'heading', content: 'Personal Brand Package' },
                {
                  type: 'text',
                  content:
                    'Build a powerful personal brand with our comprehensive one-time package.',
                },
                {
                  type: 'list',
                  content: 'Package includes',
                  items: [
                    'Brand strategy session',
                    'Logo and visual identity',
                    'Social media templates',
                    'Brand guidelines document',
                  ],
                },
              ],
            },
            idempotencyKey: `template-brand-desc-${Date.now()}`,
            order: 2,
          },
        ],
        summary: 'Create one-time personal brand package with pricing and description',
        createdAt: new Date().toISOString(),
      },
    },
    {
      name: 'AI Setup Service',
      description: 'One-time AI implementation service',
      actionPlan: {
        id: nanoid(),
        actions: [
          {
            id: nanoid(),
            type: 'whop.product.create',
            params: { name: 'AI Setup Service', status: 'draft' },
            idempotencyKey: `template-ai-create-${Date.now()}`,
            order: 0,
          },
          {
            id: nanoid(),
            type: 'whop.product.set_pricing',
            params: {
              productId: 'template-product-3',
              pricing: {
                amount: 499900, // $4,999 one-time
                currency: 'usd',
                interval: 'one_time',
              },
            },
            idempotencyKey: `template-ai-pricing-${Date.now()}`,
            order: 1,
          },
          {
            id: nanoid(),
            type: 'whop.product.set_description',
            params: {
              productId: 'template-product-3',
              description: [
                { type: 'heading', content: 'AI Setup Service' },
                {
                  type: 'text',
                  content:
                    'Get your AI infrastructure set up and running with our expert implementation service.',
                },
                {
                  type: 'list',
                  content: 'Service includes',
                  items: [
                    'Initial consultation and requirements gathering',
                    'AI model selection and configuration',
                    'Integration with your existing systems',
                    'Training and documentation',
                    '30 days of post-launch support',
                  ],
                },
              ],
            },
            idempotencyKey: `template-ai-desc-${Date.now()}`,
            order: 2,
          },
          {
            id: nanoid(),
            type: 'whop.product.set_faqs',
            params: {
              productId: 'template-product-3',
              faqs: [
                {
                  question: 'How long does setup take?',
                  answer: 'Typical implementation takes 2-4 weeks depending on complexity.',
                },
                {
                  question: 'Do I need technical knowledge?',
                  answer:
                    'No, we handle all technical aspects and provide training for your team.',
                },
              ],
            },
            idempotencyKey: `template-ai-faqs-${Date.now()}`,
            order: 3,
          },
        ],
        summary: 'Create AI setup service with pricing, description, and FAQs',
        createdAt: new Date().toISOString(),
      },
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { name: template.name },
      update: {
        description: template.description,
        actionPlan: JSON.stringify(template.actionPlan),
      },
      create: {
        id: nanoid(),
        name: template.name,
        description: template.description,
        actionPlan: JSON.stringify(template.actionPlan),
      },
    });
    console.log('Created template:', template.name);
  }

  console.log('Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
