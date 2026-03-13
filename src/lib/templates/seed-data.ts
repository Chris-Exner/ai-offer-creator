export const softwareDevTemplate = {
  name: "Software Development Project Offer",
  slug: "software-development",
  description:
    "A comprehensive offer template for custom software development projects including web applications, mobile apps, and system integrations.",
  category: "software_development" as const,
  version: 1,
  isDefault: true,
  metadataSchema: [
    {
      key: "client_name",
      label: "Client Name",
      type: "text" as const,
      required: true,
      placeholder: "Acme Corporation",
    },
    {
      key: "project_name",
      label: "Project Name",
      type: "text" as const,
      required: true,
      placeholder: "Customer Portal Redesign",
    },
    {
      key: "offer_date",
      label: "Offer Date",
      type: "date" as const,
      required: true,
    },
    {
      key: "valid_until",
      label: "Valid Until",
      type: "date" as const,
      required: true,
    },
    {
      key: "total_budget",
      label: "Estimated Budget",
      type: "currency" as const,
      required: false,
      placeholder: "50000",
    },
    {
      key: "contact_person",
      label: "Contact Person",
      type: "text" as const,
      required: false,
      placeholder: "John Smith",
    },
  ],
  sections: [
    {
      key: "executive_summary",
      title: "Executive Summary",
      description:
        "A high-level overview of the proposed solution and its business value.",
      promptHint:
        "Write a concise executive summary (150-250 words) for a software development proposal. Highlight the business problem being solved, the proposed technical approach at a high level, and the expected business outcomes. Use a professional but approachable tone. Reference the client name and project name from metadata.",
      order: 1,
      required: true,
      maxWords: 250,
    },
    {
      key: "background",
      title: "Background & Current Situation",
      description:
        "Analysis of the client's current situation and the problem space.",
      promptHint:
        "Describe the client's current situation based on the provided context. Identify pain points, inefficiencies, or opportunities that the project aims to address. Include any relevant technical debt or legacy system constraints mentioned in the context. Be specific and reference concrete details from the context documents.",
      order: 2,
      required: true,
      maxWords: 400,
    },
    {
      key: "objectives",
      title: "Project Objectives",
      description:
        "Clear, measurable objectives the project aims to achieve.",
      promptHint:
        "List 4-7 specific, measurable project objectives derived from the context. Each objective should follow the SMART pattern where possible. Format as a numbered list. Include both technical objectives (e.g., system performance, uptime) and business objectives (e.g., user adoption, cost reduction).",
      order: 3,
      required: true,
      maxWords: 300,
    },
    {
      key: "scope_of_work",
      title: "Scope of Work",
      description:
        "Detailed breakdown of deliverables and work packages.",
      promptHint:
        "Create a detailed scope of work organized into work packages or phases. For each work package, include: a title, description of deliverables, key activities, and acceptance criteria. Cover areas such as: requirements analysis, UI/UX design, frontend development, backend development, testing, deployment, and documentation. Be specific to the technology and requirements mentioned in the context.",
      order: 4,
      required: true,
      maxWords: 800,
      subsections: [
        {
          key: "in_scope",
          title: "In Scope",
          promptHint:
            "List specific deliverables and features that are included.",
        },
        {
          key: "out_of_scope",
          title: "Out of Scope",
          promptHint:
            "Explicitly state items that are NOT included to manage expectations.",
        },
        {
          key: "assumptions",
          title: "Assumptions",
          promptHint:
            "List key assumptions the proposal is based on.",
        },
      ],
    },
    {
      key: "timeline",
      title: "Project Timeline",
      description:
        "Phased timeline with milestones and deliverable dates.",
      promptHint:
        "Create a realistic project timeline broken into phases (e.g., Discovery, Design, Development, Testing, Launch). For each phase include: duration in weeks, key activities, milestones, and deliverables. Present as a structured list. Base duration estimates on the complexity implied by the context. A typical mid-size project runs 12-20 weeks.",
      order: 5,
      required: true,
      maxWords: 400,
    },
    {
      key: "commercial_terms",
      title: "Commercial Terms",
      description: "Pricing, payment schedule, and contractual terms.",
      promptHint:
        "Present the commercial terms including: pricing model (fixed price or time & materials), cost breakdown by phase or work package, payment schedule tied to milestones, and standard terms (change request process, warranty period, IP ownership). If a budget is provided in metadata, work within that range. Use a professional tone suitable for a formal business proposal.",
      order: 6,
      required: true,
      maxWords: 500,
      subsections: [
        {
          key: "pricing",
          title: "Pricing Breakdown",
          promptHint: "Itemized pricing by work package or phase.",
        },
        {
          key: "payment_schedule",
          title: "Payment Schedule",
          promptHint: "Milestone-based payment schedule.",
        },
        {
          key: "terms_conditions",
          title: "Terms & Conditions",
          promptHint:
            "Standard contractual terms, warranty, IP ownership.",
        },
      ],
    },
  ],
};

export const consultingTemplate = {
  name: "Consulting & Advisory Services Offer",
  slug: "consulting-advisory",
  description:
    "A professional template for consulting engagements including strategy, process optimization, and advisory services.",
  category: "consulting" as const,
  version: 1,
  isDefault: false,
  metadataSchema: [
    {
      key: "client_name",
      label: "Client Name",
      type: "text" as const,
      required: true,
      placeholder: "GlobalTech Industries",
    },
    {
      key: "engagement_title",
      label: "Engagement Title",
      type: "text" as const,
      required: true,
      placeholder: "Digital Transformation Assessment",
    },
    {
      key: "offer_date",
      label: "Offer Date",
      type: "date" as const,
      required: true,
    },
    {
      key: "valid_until",
      label: "Valid Until",
      type: "date" as const,
      required: true,
    },
    {
      key: "daily_rate",
      label: "Daily Rate",
      type: "currency" as const,
      required: false,
      placeholder: "1500",
    },
    {
      key: "estimated_days",
      label: "Estimated Days",
      type: "number" as const,
      required: false,
      placeholder: "30",
    },
  ],
  sections: [
    {
      key: "executive_summary",
      title: "Executive Summary",
      description:
        "High-level overview of the consulting engagement.",
      promptHint:
        "Write a compelling executive summary for a consulting proposal. Address the strategic challenge the client faces, summarize the proposed approach, and articulate the expected business impact. Emphasize thought leadership and domain expertise. Keep it to 150-200 words.",
      order: 1,
      required: true,
      maxWords: 200,
    },
    {
      key: "situation_analysis",
      title: "Situation Analysis",
      description:
        "Assessment of the client's current challenges and opportunities.",
      promptHint:
        "Provide a structured analysis of the client's situation based on the context provided. Use a framework like SWOT or current-state/future-state. Identify key challenges, market pressures, and internal constraints. Reference specific details from the context documents.",
      order: 2,
      required: true,
      maxWords: 500,
    },
    {
      key: "objectives",
      title: "Engagement Objectives",
      description:
        "What the consulting engagement aims to achieve.",
      promptHint:
        "Define 3-5 clear objectives for this consulting engagement. Each should be outcome-oriented and measurable. Distinguish between primary and secondary objectives. Tie each objective to a business outcome mentioned in the context.",
      order: 3,
      required: true,
      maxWords: 250,
    },
    {
      key: "approach_methodology",
      title: "Approach & Methodology",
      description:
        "The consulting framework and methodology to be applied.",
      promptHint:
        "Describe the consulting approach in 3-4 phases (e.g., Assessment, Analysis, Recommendations, Implementation Support). For each phase, explain the methodology, key activities, workshops or interviews planned, and deliverables. Convey expertise and a structured, repeatable process.",
      order: 4,
      required: true,
      maxWords: 600,
    },
    {
      key: "deliverables",
      title: "Key Deliverables",
      description:
        "Concrete outputs the client will receive.",
      promptHint:
        "List all concrete deliverables the client will receive, such as: assessment reports, strategy documents, roadmaps, workshop facilitation, executive presentations, and implementation guidelines. For each, provide a brief description of content and format.",
      order: 5,
      required: true,
      maxWords: 300,
    },
    {
      key: "timeline",
      title: "Engagement Timeline",
      description:
        "Duration and phasing of the consulting work.",
      promptHint:
        "Outline the engagement timeline by phase. Include duration, key milestones, and checkpoint meetings. A typical advisory engagement runs 4-12 weeks. Factor in client availability for workshops and review cycles.",
      order: 6,
      required: true,
      maxWords: 300,
    },
    {
      key: "commercial_terms",
      title: "Commercial Terms",
      description: "Fees, expenses, and engagement terms.",
      promptHint:
        "Present the commercial structure: daily/hourly rates or fixed-fee per phase, estimated total engagement cost, expense policy (travel, materials), invoicing schedule, and engagement terms (confidentiality, cancellation, intellectual property). If daily rate and estimated days are provided, calculate totals accordingly.",
      order: 7,
      required: true,
      maxWords: 400,
    },
  ],
};

export const marketingTemplate = {
  name: "Marketing Campaign Offer",
  slug: "marketing-campaign",
  description:
    "A creative and strategic template for marketing campaign proposals including digital, content, and brand campaigns.",
  category: "marketing" as const,
  version: 1,
  isDefault: false,
  metadataSchema: [
    {
      key: "client_name",
      label: "Client Name",
      type: "text" as const,
      required: true,
      placeholder: "FreshBrew Coffee Co.",
    },
    {
      key: "campaign_name",
      label: "Campaign Name",
      type: "text" as const,
      required: true,
      placeholder: "Summer Launch 2026",
    },
    {
      key: "offer_date",
      label: "Offer Date",
      type: "date" as const,
      required: true,
    },
    {
      key: "valid_until",
      label: "Valid Until",
      type: "date" as const,
      required: true,
    },
    {
      key: "campaign_budget",
      label: "Campaign Budget",
      type: "currency" as const,
      required: false,
      placeholder: "25000",
    },
    {
      key: "target_audience",
      label: "Primary Target Audience",
      type: "text" as const,
      required: false,
      placeholder: "Millennials, urban professionals",
    },
  ],
  sections: [
    {
      key: "executive_summary",
      title: "Executive Summary",
      description:
        "Overview of the campaign concept and expected impact.",
      promptHint:
        "Write an engaging executive summary for a marketing campaign proposal. Lead with the campaign concept/big idea, connect it to the client's brand goals, and highlight expected outcomes (reach, engagement, conversions). Make it inspiring yet grounded in data. 150-200 words.",
      order: 1,
      required: true,
      maxWords: 200,
    },
    {
      key: "market_context",
      title: "Market Context & Opportunity",
      description:
        "Market analysis and the opportunity the campaign addresses.",
      promptHint:
        "Analyze the market context based on provided materials. Identify the target audience, competitive landscape, market trends, and the specific opportunity or gap this campaign will exploit. Use data points from the context where available.",
      order: 2,
      required: true,
      maxWords: 400,
    },
    {
      key: "campaign_objectives",
      title: "Campaign Objectives & KPIs",
      description: "Measurable goals and success metrics.",
      promptHint:
        "Define 4-6 campaign objectives with specific KPIs. Include awareness metrics (impressions, reach), engagement metrics (CTR, social engagement), and conversion metrics (leads, sales). Set realistic targets based on the budget and channel mix implied by the context.",
      order: 3,
      required: true,
      maxWords: 250,
    },
    {
      key: "creative_strategy",
      title: "Creative Strategy & Concept",
      description:
        "The creative direction, messaging, and visual approach.",
      promptHint:
        "Describe the creative strategy including: the campaign theme/big idea, key messaging pillars, tone of voice, visual direction, and how the creative connects to the target audience. Include channel-specific creative adaptations if relevant (social, digital, print).",
      order: 4,
      required: true,
      maxWords: 500,
    },
    {
      key: "channel_plan",
      title: "Channel Plan & Tactics",
      description:
        "Media channels, tactics, and content distribution strategy.",
      promptHint:
        "Detail the channel strategy with specific tactics for each channel (social media, PPC, email, content marketing, PR, events, etc.). Include content types, posting frequency, ad formats, and budget allocation per channel. Base the channel mix on the target audience and budget from metadata.",
      order: 5,
      required: true,
      maxWords: 500,
    },
    {
      key: "timeline",
      title: "Campaign Timeline",
      description:
        "Launch phases, content calendar milestones.",
      promptHint:
        "Create a campaign timeline with phases: Pre-launch/Teaser, Launch, Sustain, and Wrap-up. Include key dates, content drops, ad flight dates, and reporting checkpoints. Typical campaigns run 4-12 weeks.",
      order: 6,
      required: true,
      maxWords: 300,
    },
    {
      key: "commercial_terms",
      title: "Investment & Commercial Terms",
      description: "Budget breakdown and payment terms.",
      promptHint:
        "Present the investment breakdown: agency fees (strategy, creative, project management), media spend allocation by channel, production costs, and any third-party costs. Include a payment schedule and standard terms. If a campaign budget is provided, allocate within that range.",
      order: 7,
      required: true,
      maxWords: 400,
    },
  ],
};

export const allTemplates = [
  softwareDevTemplate,
  consultingTemplate,
  marketingTemplate,
];
