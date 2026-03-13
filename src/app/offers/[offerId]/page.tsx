"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { OfferSectionContent } from "@/types/offer";

interface OfferDetail {
  id: string;
  title: string;
  status: string;
  metadata: Record<string, string | number>;
  contextParsed: {
    summary: string;
    keyPoints: string[];
  } | null;
  sections: OfferSectionContent[];
  createdAt: string;
  updatedAt: string;
  template: {
    name: string;
    category: string;
  };
}

export default function OfferDetailPage() {
  const params = useParams();
  const offerId = params.offerId as string;

  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/offers/${offerId}`)
      .then((res) => res.json())
      .then((data) => {
        setOffer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [offerId]);

  const handleSave = async () => {
    if (!offer) return;
    setSaving(true);

    await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sections: offer.sections,
        status: "finalized",
      }),
    });

    setSaving(false);
    setOffer((prev) => (prev ? { ...prev, status: "finalized" } : prev));
  };

  const handleRegenerate = async (sectionKey: string) => {
    setRegenerating(sectionKey);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, sectionKey }),
      });
      const data = await res.json();

      if (data.content) {
        setOffer((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map((s) =>
              s.sectionKey === sectionKey
                ? {
                    ...s,
                    content: data.content,
                    status: "generated" as const,
                    generatedAt: new Date().toISOString(),
                  }
                : s
            ),
          };
        });
      }
    } catch (error) {
      console.error("Regeneration error:", error);
    }

    setRegenerating(null);
  };

  const handleCopyMarkdown = useCallback(async () => {
    if (!offer) return;
    const markdown = offer.sections
      .map((s) => `## ${s.title}\n\n${s.content}`)
      .join("\n\n---\n\n");

    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(markdown);
    } catch {
      // Fallback: create a temporary textarea and use execCommand
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [offer]);

  const handleDownloadWord = async () => {
    if (!offer) return;
    setDownloading(true);

    try {
      const res = await fetch(`/api/offers/${offerId}/export-docx`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
        "Angebot.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }

    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-96 bg-gray-100 dark:bg-gray-900 rounded" />
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-4">Offer not found</h1>
        <Link href="/offers" className="text-blue-600 hover:text-blue-800">
          Back to offers &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/offers"
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            &larr; Back to Offers
          </Link>
          <h1 className="text-3xl font-bold mt-2">{offer.title}</h1>
          <p className="text-gray-500 mt-1">
            {offer.template.name} &middot; {offer.status}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyMarkdown}
            className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
              copied
                ? "border-green-500 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
          >
            {copied ? "Copied!" : "Copy Markdown"}
          </button>
          <button
            onClick={handleDownloadWord}
            disabled={downloading}
            className="px-4 py-2 text-sm border border-blue-500 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 transition-colors"
          >
            {downloading ? "Generating..." : "Download Word"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Finalize"}
          </button>
        </div>
      </div>

      {/* Metadata summary */}
      {Object.keys(offer.metadata).length > 0 && (
        <div className="mb-8 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold uppercase text-gray-500 mb-2">
            Metadata
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {Object.entries(offer.metadata).map(([key, value]) => (
              <div key={key}>
                <span className="text-gray-500">
                  {key.replace(/_/g, " ")}:
                </span>{" "}
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {offer.sections.map((section) => (
          <div
            key={section.sectionKey}
            className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold">{section.title}</h2>
              <button
                onClick={() => handleRegenerate(section.sectionKey)}
                disabled={regenerating === section.sectionKey}
                className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 disabled:opacity-50"
              >
                {regenerating === section.sectionKey
                  ? "Regenerating..."
                  : "Regenerate"}
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={section.content}
                onChange={(e) =>
                  setOffer((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      sections: prev.sections.map((s) =>
                        s.sectionKey === section.sectionKey
                          ? { ...s, content: e.target.value, status: "edited" as const }
                          : s
                      ),
                    };
                  })
                }
                className="w-full min-h-[200px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
