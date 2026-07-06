import Link from "next/link";
import { CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = {
  key: string;
  label: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
};

export function OnboardingChecklist({ steps }: { steps: Step[] }) {
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PartyPopper className="text-primary size-4.5" />
          <CardTitle className="text-base">Get set up</CardTitle>
        </div>
        <CardDescription>
          {doneCount} of {steps.length} steps done — finish these to get real leads flowing in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.key}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3.5",
                step.done ? "bg-muted/40" : "bg-background"
              )}
            >
              <div className="flex items-start gap-2">
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium", step.done && "text-muted-foreground")}>
                    {step.label}
                  </p>
                  <p className="text-muted-foreground text-xs">{step.description}</p>
                </div>
              </div>
              {!step.done && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  nativeButton={false}
                  render={<Link href={step.href} />}
                >
                  {step.cta}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
