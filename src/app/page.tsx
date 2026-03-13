import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-2">AI Offer Creator</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Generate professional business offers powered by AI
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        <Link
          href="/templates"
          className="block p-6 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Browse Templates</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from pre-built offer templates for software development,
            consulting, and marketing.
          </p>
        </Link>

        <Link
          href="/offers"
          className="block p-6 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">My Offers</h2>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your generated offers.
          </p>
        </Link>

        <Link
          href="/offers/new"
          className="block p-6 rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-700 dark:text-blue-300">
            Create New Offer
          </h2>
          <p className="text-blue-600 dark:text-blue-400">
            Start generating a new offer from a template with your context.
          </p>
        </Link>
      </div>
    </div>
  );
}
