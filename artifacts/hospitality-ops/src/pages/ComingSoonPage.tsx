import type { LucideProps } from "lucide-react";
import { Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

interface Props {
  title: string;
  group: string;
  description: string;
  Icon: React.ComponentType<LucideProps>;
  accentColor?: string;
}

export function ComingSoonPage({ title, group, description, Icon, accentColor = "#3b82f6" }: Props) {
  return (
    <AppLayout>
      <div className="flex flex-col min-h-[60vh] justify-center items-center py-16 px-4">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border"
            style={{
              background: `${accentColor}12`,
              borderColor: `${accentColor}30`,
            }}
          >
            <Icon className="w-7 h-7" style={{ color: accentColor }} />
          </div>

          {/* Group label */}
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{ color: accentColor }}
          >
            {group}
          </p>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">
            {title}
          </h1>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            {description}
          </p>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-muted-foreground font-medium">
            <Clock className="w-3 h-3" />
            In development
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
