import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { type ComponentType, type SVGProps } from "react";

interface VerificationCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
  title: string;
  description: string;
  href: string;
  accentColor?: string;
}

export function VerificationCard({
  icon: Icon,
  title,
  description,
  href,
  accentColor,
}: VerificationCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      onClick={() => navigate(href)}
    >
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
            accentColor || "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        </div>
        <Button className="mt-2 w-full pointer-events-none">Get Started</Button>
      </CardContent>
    </Card>
  );
}
