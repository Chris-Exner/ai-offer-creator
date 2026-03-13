"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OfferSummary {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  template: { name: string; slug: string; category: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  generating:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  review:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  finalized:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/offers")
      .then((res) => res.json())
      .then((data) => {
        setOffers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Offers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your generated offers
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Dashboard
          </Link>
          <Link
            href="/templates"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700"
          >
            New Offer
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg border border-gray-200 dark:border-gray-800 animate-pulse bg-gray-50 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No offers yet.</p>
          <Link
            href="/templates"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Create your first offer &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-w-4xl">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/offers/${offer.id}`}
              className="block p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{offer.title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {offer.template?.name ?? "Unknown template"} &middot;
                    Updated{" "}
                    {new Date(offer.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[offer.status] ?? STATUS_COLORS.draft}`}
                >
                  {offer.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
