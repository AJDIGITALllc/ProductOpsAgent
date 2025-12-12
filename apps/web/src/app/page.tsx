import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          ProductOpsAgent
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          A chat-based interface for creating and managing Whop products with guardrails,
          two-phase commit (Plan → Approve → Execute), and full audit logging.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Link
            href="/builder"
            className="block p-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <h2 className="text-2xl font-bold mb-2">Start Building</h2>
            <p>Chat with the agent to create products</p>
          </Link>

          <Link
            href="/templates"
            className="block p-8 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <h2 className="text-2xl font-bold mb-2">Browse Templates</h2>
            <p>Use pre-built templates as starting points</p>
          </Link>

          <Link
            href="/dashboard"
            className="block p-8 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <h2 className="text-2xl font-bold mb-2">View Dashboard</h2>
            <p>See recent runs and activity</p>
          </Link>

          <Link
            href="/products"
            className="block p-8 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            <h2 className="text-2xl font-bold mb-2">Manage Products</h2>
            <p>Browse and manage all products</p>
          </Link>
        </div>

        <div className="mt-16 p-6 bg-gray-100 rounded-lg text-left">
          <h3 className="text-lg font-bold mb-4">Key Features</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Two-phase commit: PLAN → APPROVE → EXECUTE</li>
            <li>✅ Whitelisted actions with validation</li>
            <li>✅ Idempotent execution prevents duplicates</li>
            <li>✅ Full audit log of all operations</li>
            <li>✅ Defaults to draft (publish must be explicit)</li>
            <li>✅ Stub mode when WHOP_API_KEY is missing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
