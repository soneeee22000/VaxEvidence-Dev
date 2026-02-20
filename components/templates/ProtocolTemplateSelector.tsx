"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
  Shield,
  ChevronRight,
  Sparkles,
  LayoutTemplate,
} from "lucide-react";

import {
  PROTOCOL_TEMPLATES,
  type ProtocolTemplate,
} from "@/lib/templates/protocol-templates";

type ProtocolTemplateSelectorProps = {
  onSelectTemplate?: (templateId: string) => void;
};

const categories = [
  { id: "all", name: "All Templates", icon: FileText },
  { id: "effectiveness", name: "Effectiveness", icon: Target },
  { id: "safety", name: "Safety", icon: Shield },
  { id: "general", name: "General", icon: Sparkles },
];

const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case "Beginner":
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50";
    case "Intermediate":
      return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/50";
    case "Advanced":
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50";
    default:
      return "text-muted-foreground bg-muted";
  }
};

const getComplexityLabel = (template: ProtocolTemplate) => {
  if (template.category === "general") return "Beginner";
  if (template.category === "safety") return "Advanced";
  return "Intermediate";
};

export function ProtocolTemplateSelector({
  onSelectTemplate,
}: ProtocolTemplateSelectorProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [previewMode, setPreviewMode] = useState(false);

  const filteredTemplates = useMemo(() => {
    return PROTOCOL_TEMPLATES.filter((template) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategory === "all" || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const selectedTemplate = useMemo(
    () =>
      PROTOCOL_TEMPLATES.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId],
  );

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setPreviewMode(true);
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplateId) return;
    if (onSelectTemplate) {
      onSelectTemplate(selectedTemplateId);
      return;
    }
    router.push(`/app/new?template=${selectedTemplateId}`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Protocol Templates
              </h1>
              <p className="text-xl text-muted-foreground">
                Start your study with battle-tested frameworks from leading
                vaccine researchers.
              </p>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <LayoutTemplate className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-r-xl">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-foreground font-semibold mb-2">
                  Why use templates?
                </p>
                <ul className="text-foreground space-y-1 text-sm">
                  <li>
                    • <strong>Save 2+ hours</strong> - Skip the blank page,
                    start with proven structure
                  </li>
                  <li>
                    • <strong>Reduce errors</strong> - Pre-filled with
                    industry-standard PICO frameworks
                  </li>
                  <li>
                    • <strong>Learn best practices</strong> - Based on 15+ years
                    of real-world vaccine research
                  </li>
                  <li>
                    • <strong>Regulatory-ready</strong> - Aligned with FDA/EMA
                    RWE guidelines
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {!previewMode ? (
          <>
            <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search templates by name, vaccine, or use case..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-border rounded-lg focus:border-primary outline-none text-lg bg-background text-foreground"
                  />
                </div>

                <div className="flex space-x-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-6 py-3 rounded-lg font-semibold transition flex items-center space-x-2 ${
                          selectedCategory === category.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-card rounded-2xl shadow-lg hover:shadow-2xl transition p-6 border-2 border-border hover:border-primary/50 group cursor-pointer"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl">{template.icon}</div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getComplexityColor(
                        getComplexityLabel(template),
                      )}`}
                    >
                      {getComplexityLabel(template)}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition">
                    {template.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{template.typical_duration}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.use_cases.slice(0, 2).map((useCase) => (
                      <span
                        key={useCase}
                        className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full"
                      >
                        {useCase}
                      </span>
                    ))}
                    {template.use_cases.length > 2 && (
                      <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                        +{template.use_cases.length - 2} more
                      </span>
                    )}
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center space-x-2 group-hover:scale-105">
                    <span>Use Template</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="bg-card rounded-2xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  No templates found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-card rounded-2xl shadow-lg p-8">
            <button
              onClick={() => setPreviewMode(false)}
              className="text-primary hover:text-primary/80 font-semibold mb-6 flex items-center space-x-2"
            >
              <span>← Back to templates</span>
            </button>

            {selectedTemplate && (
              <div className="space-y-8">
                <div className="border-b pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-6xl">{selectedTemplate.icon}</div>
                      <div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                          {selectedTemplate.name}
                        </h2>
                        <p className="text-muted-foreground text-lg">
                          {selectedTemplate.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full font-bold ${getComplexityColor(
                        getComplexityLabel(selectedTemplate),
                      )}`}
                    >
                      {getComplexityLabel(selectedTemplate)} Level
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                    <CheckCircle className="w-7 h-7 text-green-600 mr-3" />
                    What&apos;s Included in This Template
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      {
                        label: "Pre-filled PICO Framework",
                        desc: "Population, Intervention, Comparator, Outcomes",
                      },
                      {
                        label: "Study Design Guidance",
                        desc: "Recommended methodology and approach",
                      },
                      {
                        label: "Inclusion/Exclusion Criteria",
                        desc: "Standard eligibility requirements",
                      },
                      {
                        label: "Data Source Recommendations",
                        desc: "Typical databases and registries",
                      },
                      {
                        label: "Statistical Methods",
                        desc: "Analysis plan and sample size calculations",
                      },
                      {
                        label: "Regulatory Context",
                        desc: "FDA/EMA alignment notes",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-card p-4 rounded-lg border-2 border-green-500/30 dark:border-green-400/30"
                      >
                        <div className="font-semibold text-foreground mb-1 flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          {item.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Perfect For
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedTemplate.use_cases.map((useCase) => (
                      <div
                        key={useCase}
                        className="bg-primary/20 text-primary px-6 py-3 rounded-full font-semibold"
                      >
                        {useCase}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Typical Timeline
                  </h3>
                  <div className="bg-muted rounded-xl p-6 flex items-center space-x-4">
                    <Clock className="w-8 h-8 text-primary" />
                    <div>
                      <div className="text-3xl font-bold text-primary">
                        {selectedTemplate.typical_duration}
                      </div>
                      <div className="text-muted-foreground">
                        From protocol to analysis
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted rounded-xl p-8 border-2 border-border">
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    Example Protocol Content
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-2">
                        Study Question:
                      </div>
                      <div className="bg-card p-4 rounded-lg border border-border italic text-muted-foreground">
                        {selectedTemplate.study_question}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-2">
                        Population:
                      </div>
                      <div className="bg-card p-4 rounded-lg border border-border text-muted-foreground whitespace-pre-line">
                        {selectedTemplate.population}
                      </div>
                    </div>
                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                        <strong>Note:</strong> All fields are pre-filled with
                        best-practice content. You can edit any section to match
                        your specific study needs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    onClick={handleCreateFromTemplate}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition flex items-center justify-center space-x-3"
                  >
                    <Sparkles className="w-6 h-6" />
                    <span>Create Protocol from This Template</span>
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="px-8 py-4 border-2 border-border text-muted-foreground rounded-xl font-semibold hover:bg-muted/50 transition"
                  >
                    Browse Other Templates
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
