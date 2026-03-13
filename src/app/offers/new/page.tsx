"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Template, TemplateSection, MetadataField } from "@/types/template";
import type { OfferSectionContent, ParsedContext } from "@/types/offer";

type WizardStep = "context" | "metadata" | "generate" | "review";

const STEPS: { key: WizardStep; label: string; number: number }[] = [
  { key: "context", label: "Provide Context", number: 1 },
  { key: "metadata", label: "Review Metadata", number: 2 },
  { key: "generate", label: "Generate", number: 3 },
  { key: "review", label: "Review & Edit", number: 4 },
];

export default function NewOfferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8">Loading...</div>}>
      <NewOfferWizard />
    </Suspense>
  );
}

function NewOfferWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get("templateId");

  const [step, setStep] = useState<WizardStep>("context");
  const [template, setTemplate] = useState<Template | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Context step state
  const [pastedText, setPastedText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; chunkCount: number; warning?: string }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Metadata step state
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [contextParsed, setContextParsed] = useState<ParsedContext | null>(
    null
  );

  // Generate step state
  const [sections, setSections] = useState<OfferSectionContent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<string | null>(
    null
  );

  // Load template
  useEffect(() => {
    if (!templateId) return;
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        const templates: Template[] = Array.isArray(data) ? data : [];
        const t = templates.find((t) => t.id === templateId);
        if (t) {
          setTemplate(t);
          // Initialize metadata with defaults
          const initial: Record<string, string> = {};
          t.metadataSchema.forEach((field: MetadataField) => {
            if (field.defaultValue !== undefined) {
              initial[field.key] = String(field.defaultValue);
            }
          });
          setMetadata(initial);
        }
        setLoading(false);
      });
  }, [templateId]);

  // Handle pasted text submission
  const handleSubmitContext = async () => {
    if (!pastedText.trim() && uploadedFiles.length === 0) return;

    // Create the offer first if needed
    let currentOfferId = offerId;
    if (!currentOfferId) {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template?.id,
          title: `New ${template?.name ?? "Offer"}`,
        }),
      });
      const data = await res.json();
      currentOfferId = data.id;
      setOfferId(currentOfferId);
    }

    if (pastedText.trim()) {
      setIsUploading(true);
      setUploadError(null);
      const formData = new FormData();
      formData.append("text", pastedText);
      formData.append("offerId", currentOfferId!);

      try {
        const res = await fetch("/api/parse-document", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setUploadedFiles((prev) => [
            ...prev,
            {
              name: "Pasted Text",
              chunkCount: data.chunkCount,
              warning: data.embeddingWarning ?? undefined,
            },
          ]);
          setPastedText("");
        } else {
          setUploadError(data.error ?? "Failed to process text");
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Upload failed");
      }
      setIsUploading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let currentOfferId = offerId;
    if (!currentOfferId) {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template?.id,
          title: `New ${template?.name ?? "Offer"}`,
        }),
      });
      const data = await res.json();
      currentOfferId = data.id;
      setOfferId(currentOfferId);
    }

    setIsUploading(true);
    setUploadError(null);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("offerId", currentOfferId!);

      try {
        const res = await fetch("/api/parse-document", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setUploadedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              chunkCount: data.chunkCount,
              warning: data.embeddingWarning ?? undefined,
            },
          ]);
        } else {
          setUploadError(`${file.name}: ${data.error ?? "Upload failed"}`);
        }
      } catch (error) {
        setUploadError(
          `${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`
        );
      }
    }
    setIsUploading(false);
    e.target.value = "";
  };

  // Analyze context and move to metadata step
  const handleAnalyzeAndContinue = async () => {
    if (!offerId) return;
    setIsUploading(true);

    try {
      // Trigger generation which will analyze context first
      await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, analyzeOnly: true }),
      });

      // Fetch the updated offer to get parsed context
      const offerRes = await fetch(`/api/offers/${offerId}`);
      if (offerRes.ok) {
        const offer = await offerRes.json();
        if (offer.contextParsed) {
          setContextParsed(offer.contextParsed);
          // Auto-populate metadata from extracted entities
          const updated = { ...metadata };
          Object.entries(offer.contextParsed.extractedEntities).forEach(
            ([key, value]) => {
              if (
                template?.metadataSchema.some(
                  (f: MetadataField) => f.key === key
                )
              ) {
                updated[key] = value as string;
              }
            }
          );
          setMetadata(updated);
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
    }

    setIsUploading(false);
    setStep("metadata");
  };

  // Generate all sections
  const handleGenerate = async () => {
    if (!offerId) return;

    // First update metadata on the offer
    await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata }),
    });

    setIsGenerating(true);
    setStep("generate");

    // Initialize empty sections
    const emptySections: OfferSectionContent[] =
      template?.sections.map((s: TemplateSection) => ({
        sectionKey: s.key,
        title: s.title,
        content: "",
        status: "pending" as const,
      })) ?? [];
    setSections(emptySections);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      const data = await res.json();

      if (data.sections) {
        setSections(data.sections);
      }
    } catch (error) {
      console.error("Generation error:", error);
    }

    setIsGenerating(false);
    setStep("review");
  };

  // Regenerate a single section
  const handleRegenerateSection = async (sectionKey: string) => {
    if (!offerId) return;
    setGeneratingSection(sectionKey);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, sectionKey }),
      });
      const data = await res.json();

      if (data.content) {
        setSections((prev) =>
          prev.map((s) =>
            s.sectionKey === sectionKey
              ? {
                  ...s,
                  content: data.content,
                  status: "generated" as const,
                  generatedAt: new Date().toISOString(),
                }
              : s
          )
        );
      }
    } catch (error) {
      console.error("Regeneration error:", error);
    }

    setGeneratingSection(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="animate-pulse h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
        <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-900 rounded" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-4">Template not found</h1>
        <Link href="/templates" className="text-blue-600 hover:text-blue-800">
          Browse templates &rarr;
        </Link>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/templates"
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          &larr; Back to Templates
        </Link>
        <h1 className="text-3xl font-bold mt-2">{template.name}</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                i === currentStepIndex
                  ? "bg-blue-600 text-white"
                  : i < currentStepIndex
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-xs">
                {s.number}
              </span>
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-gray-300 dark:bg-gray-700 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Context */}
      {step === "context" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Provide Context</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Paste emails, meeting notes, requirements documents, or upload
              files. The AI will use this context to generate your offer.
            </p>
          </div>

          {/* Paste text area */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Paste Text
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste emails, meeting notes, requirements, or any other context here..."
              className="w-full h-48 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmitContext}
              disabled={!pastedText.trim() || isUploading}
              className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {isUploading ? "Processing..." : "Add Text"}
            </button>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Files
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt,.md"
                multiple
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800"
              >
                Click to upload
              </label>
              <span className="text-gray-500"> or drag and drop</span>
              <p className="text-xs text-gray-400 mt-2">
                PDF, DOCX, TXT, MD files supported
              </p>
            </div>
          </div>

          {/* Error display */}
          {uploadError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                {uploadError}
              </p>
            </div>
          )}

          {/* Uploaded files list */}
          {uploadedFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Processed Documents ({uploadedFiles.length})
              </h3>
              <div className="space-y-2">
                {uploadedFiles.map((file, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {file.chunkCount} chunks
                      </span>
                    </div>
                    {file.warning && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 ml-1">
                        Note: {file.warning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleAnalyzeAndContinue}
              disabled={uploadedFiles.length === 0 || isUploading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Analyzing..." : "Analyze Context & Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Metadata */}
      {step === "metadata" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Review Metadata</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Review and adjust the metadata fields. Fields marked with * are
              auto-populated from your context.
            </p>
          </div>

          {contextParsed && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium mb-2">Context Summary</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {contextParsed.summary}
              </p>
              {contextParsed.keyPoints.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">
                    Key Points
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                    {contextParsed.keyPoints.slice(0, 5).map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.metadataSchema.map((field: MetadataField) => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {contextParsed?.extractedEntities[field.key] && (
                    <span className="ml-2 text-xs text-blue-500">
                      (auto-filled)
                    </span>
                  )}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={metadata[field.key] ?? ""}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                ) : (
                  <input
                    type={
                      field.type === "date"
                        ? "date"
                        : field.type === "number" || field.type === "currency"
                          ? "number"
                          : "text"
                    }
                    value={metadata[field.key] ?? ""}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep("context")}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800"
            >
              &larr; Back
            </button>
            <button
              onClick={handleGenerate}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Generate Offer
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generate */}
      {step === "generate" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Generating Offer</h2>
            <p className="text-gray-600 dark:text-gray-400">
              The AI is generating each section of your offer...
            </p>
          </div>

          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.sectionKey}
                className={`p-4 rounded-lg border ${
                  section.status === "generated"
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                    : section.status === "generating"
                      ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {section.status === "generated" ? (
                      <span className="text-green-600 text-lg">&#10003;</span>
                    ) : section.status === "generating" ? (
                      <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{section.title}</h3>
                    {section.status === "generated" && section.content && (
                      <p className="text-sm text-gray-500 mt-1">
                        {section.content.slice(0, 100)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isGenerating && (
            <p className="text-center text-sm text-gray-500">
              Please wait while the AI generates your offer...
            </p>
          )}
        </div>
      )}

      {/* Step 4: Review & Edit */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Review & Edit</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Review the generated content and make any edits.
              </p>
            </div>
            <button
              onClick={() =>
                offerId && router.push(`/offers/${offerId}`)
              }
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Save & Finalize
            </button>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <div
                key={section.sectionKey}
                className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="font-semibold">{section.title}</h3>
                  <button
                    onClick={() =>
                      handleRegenerateSection(section.sectionKey)
                    }
                    disabled={generatingSection === section.sectionKey}
                    className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
                  >
                    {generatingSection === section.sectionKey
                      ? "Regenerating..."
                      : "Regenerate"}
                  </button>
                </div>
                <div className="p-4">
                  <textarea
                    value={section.content}
                    onChange={(e) =>
                      setSections((prev) =>
                        prev.map((s) =>
                          s.sectionKey === section.sectionKey
                            ? {
                                ...s,
                                content: e.target.value,
                                status: "edited" as const,
                                editedAt: new Date().toISOString(),
                              }
                            : s
                        )
                      )
                    }
                    className="w-full min-h-[200px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
