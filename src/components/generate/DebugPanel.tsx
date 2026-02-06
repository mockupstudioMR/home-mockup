import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Bug, ChevronDown, ChevronRight, Clock, Copy, Check } from "lucide-react";

interface DebugStep {
  timestamp: string;
  step: string;
  detail: string;
  data?: unknown;
}

interface DebugPanelProps {
  steps: DebugStep[];
  prompt?: string;
}

const DebugPanel = ({ steps, prompt }: DebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  if (steps.length === 0 && !prompt) return null;

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const copyDebugLog = () => {
    const log = steps
      .map((s) => `[${s.timestamp}] ${s.step}: ${s.detail}${s.data ? "\n  " + JSON.stringify(s.data, null, 2) : ""}`)
      .join("\n");
    const full = prompt ? `--- PROMPT ---\n${prompt}\n\n--- STEPS ---\n${log}` : log;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepColor = (step: string) => {
    if (step.toLowerCase().includes("error") || step.toLowerCase().includes("fail")) return "destructive";
    if (step.toLowerCase().includes("complete") || step.toLowerCase().includes("success") || step.toLowerCase().includes("generated")) return "default";
    if (step.toLowerCase().includes("retry") || step.toLowerCase().includes("fallback")) return "secondary";
    return "outline";
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bug className="w-4 h-4" />
                <span>Debug Pipeline</span>
                <Badge variant="outline" className="text-xs">
                  {steps.length} steps
                </Badge>
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={copyDebugLog}>
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? "Copied" : "Copy log"}
              </Button>
            </div>

            {/* Prompt */}
            {prompt && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Final Prompt</p>
                <pre className="text-xs bg-background/80 rounded-md p-3 whitespace-pre-wrap border border-border/50 max-h-40 overflow-y-auto font-mono">
                  {prompt}
                </pre>
              </div>
            )}

            {/* Steps */}
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-1">
                {steps.map((step, i) => {
                  const isExpanded = expandedSteps.has(i);
                  const time = new Date(step.timestamp).toLocaleTimeString();
                  const hasData = step.data !== undefined && step.data !== null;

                  return (
                    <div
                      key={i}
                      className="group rounded-md border border-transparent hover:border-border/50 hover:bg-background/50 transition-colors"
                    >
                      <button
                        className="w-full flex items-start gap-2 p-2 text-left"
                        onClick={() => hasData && toggleStep(i)}
                        disabled={!hasData}
                      >
                        <Clock className="w-3 h-3 mt-0.5 text-muted-foreground/60 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getStepColor(step.step)} className="text-[10px] px-1.5 py-0">
                              {step.step}
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate">{step.detail}</span>
                            <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0">{time}</span>
                          </div>
                        </div>
                        {hasData && (
                          <span className="text-muted-foreground/40 shrink-0">
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </span>
                        )}
                      </button>

                      {isExpanded && hasData && (
                        <pre className="text-[11px] bg-background/80 rounded-md p-2 mx-2 mb-2 whitespace-pre-wrap border border-border/30 max-h-48 overflow-y-auto font-mono text-muted-foreground">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default DebugPanel;
