import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create 3 product templates
  const templates = [
    {
      name: 'Digital Course',
      description: 'A comprehensive online course with lifetime access',
      config: JSON.stringify({
        pricing: {
          type: 'one_time',
          amount: 9900, // $99.00
        },
        descriptionBlocks: [
          {
            type: 'text',
            content:
              'Get lifetime access to our comprehensive digital course.',
          },
          {
            type: 'features',
            items: [
              'Lifetime access to all course materials',
              'Downloadable resources and worksheets',
              'Certificate of completion',
              'Community access',
            ],
          },
        ],
        faqs: [
          {
            question: 'How long do I have access?',
            answer: 'You get lifetime access to the course materials.',
          },
          {
            question: 'Is there a money-back guarantee?',
            answer: 'Yes, we offer a 30-day money-back guarantee.',
          },
        ],
        paymentOptions: {
          methods: ['card', 'crypto'],
          trialPeriod: null,
        },
      }),
    },
    {
      name: 'Monthly Subscription',
      description: 'A recurring monthly membership with ongoing benefits',
      config: JSON.stringify({
        pricing: {
          type: 'recurring',
          amount: 2900, // $29.00
          interval: 'month',
        },
        descriptionBlocks: [
          {
            type: 'text',
            content:
              'Join our exclusive monthly membership for continuous access to premium content.',
          },
          {
            type: 'features',
            items: [
              'Monthly exclusive content drops',
              'Private community access',
              'Monthly Q&A sessions',
              'Priority support',
              'Cancel anytime',
            ],
          },
        ],
        faqs: [
          {
            question: 'Can I cancel anytime?',
            answer:
              'Yes, you can cancel your subscription at any time. You will retain access until the end of your billing period.',
          },
          {
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards and cryptocurrency.',
          },
          {
            question: 'Is there a free trial?',
            answer:
              'Yes, we offer a 7-day free trial for new members.',
          },
        ],
        paymentOptions: {
          methods: ['card', 'crypto'],
          trialPeriod: 7,
        },
      }),
    },
    {
      name: 'Premium Bundle',
      description:
        'A high-value bundle with one-time payment for multiple products',
      config: JSON.stringify({
        pricing: {
          type: 'one_time',
          amount: 29900, // $299.00
        },
        descriptionBlocks: [
          {
            type: 'text',
            content:
              'Get everything you need in one comprehensive bundle. Save over 50% compared to buying separately.',
          },
          {
            type: 'features',
            items: [
              'Access to all 5 premium courses',
              'Exclusive bonus materials worth $500',
              'Private coaching session (1 hour)',
              '1-year access to premium community',
              'All future updates included',
            ],
          },
          {
            type: 'testimonials',
            items: [
              {
                author: 'John D.',
                text: 'Best investment I made this year!',
              },
            ],
          },
        ],
        faqs: [
          {
            question: 'What is included in the bundle?',
            answer:
              'The bundle includes all 5 premium courses, bonus materials, a 1-hour coaching session, and 1-year community access.',
          },
          {
            question: 'Can I purchase courses individually?',
            answer:
              'Yes, but the bundle offers significant savings compared to individual purchases.',
          },
          {
            question: 'Do I get future updates?',
            answer:
              'Yes, all future course updates and improvements are included for free.',
          },
        ],
        paymentOptions: {
          methods: ['card', 'crypto'],
          trialPeriod: null,
        },
      }),
    },
  ];

  for (const template of templates) {
    await prisma.productTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
    console.log(`✅ Created template: ${template.name}`);
  }

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
