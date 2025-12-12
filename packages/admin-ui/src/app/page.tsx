'use client';

import { useState } from 'react';
import ChatBuilder from '@/components/ChatBuilder';
import ProductList from '@/components/ProductList';
import PlanApproval from '@/components/PlanApproval';

export default function Home() {
  const [view, setView] = useState<'chat' | 'products' | 'plan'>('chat');
  const [pendingPlan, setPendingPlan] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              ProductOpsAgent
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setView('chat')}
                className={`px-4 py-2 rounded-md ${
                  view === 'chat'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Chat Builder
              </button>
              <button
                onClick={() => setView('products')}
                className={`px-4 py-2 rounded-md ${
                  view === 'products'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Products
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'chat' && (
          <ChatBuilder
            onPlanCreated={(plan) => {
              setPendingPlan(plan);
              setView('plan');
            }}
          />
        )}
        {view === 'products' && <ProductList />}
        {view === 'plan' && pendingPlan && (
          <PlanApproval
            plan={pendingPlan}
            onBack={() => setView('chat')}
            onComplete={() => {
              setPendingPlan(null);
              setView('products');
            }}
          />
        )}
      </main>
    </div>
  );
}
