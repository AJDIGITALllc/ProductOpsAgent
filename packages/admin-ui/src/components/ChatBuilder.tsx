'use client';

import { useState, useEffect, FormEvent } from 'react';
import { api } from '@/lib/api';

interface ChatBuilderProps {
  onPlanCreated: (plan: any) => void;
}

export default function ChatBuilder({ onPlanCreated }: ChatBuilderProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([
    {
      role: 'assistant',
      content:
        'Hi! I can help you create products for Whop. Try saying: "Create a new product called Premium Course, price it at $99 one-time, and add an FAQ about access duration."',
    },
  ]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  // Placeholder for product ID that will be created during execution
  const PLACEHOLDER_PRODUCT_ID = '__CREATED_PRODUCT_ID__';

  // Regex pattern to extract product name from user input
  // Matches: "create...product...(called|named) <name>"
  const PRODUCT_NAME_PATTERN = /create.*?product.*?(?:called|named)\s+["']?([^"',]+)["']?/i;

  const parseUserInput = (text: string): any[] => {
    const actions: any[] = [];
    const lowerText = text.toLowerCase();

    // Extract product name
    const nameMatch = text.match(PRODUCT_NAME_PATTERN);
    const productName = nameMatch ? nameMatch[1].trim() : 'New Product';

    // Check if using a template
    if (selectedTemplate) {
      actions.push({
        type: 'create_draft',
        payload: {
          name: productName,
          templateId: selectedTemplate,
        },
      });
      return actions;
    }

    // Create draft action
    actions.push({
      type: 'create_draft',
      payload: {
        name: productName,
      },
    });

    // Parse pricing
    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      const amount = Math.round(parseFloat(priceMatch[1]) * 100);
      const isRecurring =
        lowerText.includes('recurring') ||
        lowerText.includes('monthly') ||
        lowerText.includes('subscription');

      actions.push({
        type: 'set_pricing',
        payload: {
          productId: PLACEHOLDER_PRODUCT_ID,
          pricing: isRecurring
            ? {
                type: 'recurring',
                amount,
                interval: lowerText.includes('yearly') ? 'year' : 'month',
              }
            : {
                type: 'one_time',
                amount,
              },
        },
      });
    }

    // Parse FAQs
    if (lowerText.includes('faq') || lowerText.includes('question')) {
      const faqMatch = text.match(/about\s+([^.,]+)/i);
      if (faqMatch) {
        actions.push({
          type: 'add_faq',
          payload: {
            productId: PLACEHOLDER_PRODUCT_ID,
            faq: {
              question: `What about ${faqMatch[1].trim()}?`,
              answer: `Information about ${faqMatch[1].trim()} will be provided.`,
            },
          },
        });
      }
    }

    // Check for publish request
    if (lowerText.includes('publish') || lowerText.includes('go live')) {
      actions.push({
        type: 'publish',
        payload: {
          productId: PLACEHOLDER_PRODUCT_ID,
        },
      });
    }

    return actions;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Parse user input into actions
      const actions = parseUserInput(userMessage);

      if (actions.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              "I couldn't understand that. Try something like: 'Create a product called X, price it at $Y'",
          },
        ]);
        setLoading(false);
        return;
      }

      // Create plan
      const plan = await api.createPlan(actions);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I've created a plan with ${actions.length} action(s). Please review and approve it.`,
        },
      ]);

      // Navigate to approval
      onPlanCreated(plan);
    } catch (error: any) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Chat Builder</h2>

      {templates.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Use a template (optional):
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">No template - start from scratch</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.description}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg h-96 overflow-y-auto p-4 mb-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Examples:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Create a product called "Premium Course" and price it at $99</li>
          <li>Make a monthly subscription for $29 with a 7-day trial</li>
          <li>Add an FAQ about refunds</li>
        </ul>
      </div>
    </div>
  );
}
