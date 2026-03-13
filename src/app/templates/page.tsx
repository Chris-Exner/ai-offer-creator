"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Template } from "@/types/template";

const CATEGORY_LABELS: Record<string, string> = {
  software_development: "Software Development",
  consulting: "Consulting",
  marketing: "Marketing",
  general: "General",
};

const CATEGORY_COLORS: Record<string, string> = {
  software_development: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  consulting: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  marketing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-8">Offer Templates</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-lg border border-gray-200 dark:border-gray-800 animate-pulse bg-gray-50 dark:bg-gray-900"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Offer Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Choose a template to start creating your offer
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.general}`}
                >
                  {CATEGORY_LABELS[template.category] ?? template.category}
                </span>
                {template.isDefault && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Default
                  </span>
                )}
              </div>

              <h2 className="text-xl font-semibold mb-2">{template.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>

              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                  Sections ({template.sections.length})
                </h3>
                <div className="flex flex-wrap gap-1">
                  {template.sections.map((section) => (
                    <span
                      key={section.key}
                      className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    >
                      {section.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
              <Link
                href={`/offers/new?templateId=${template.id}`}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                Use this template &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
