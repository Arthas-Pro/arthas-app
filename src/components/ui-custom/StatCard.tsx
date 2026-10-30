import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
  iconClassName
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all border-border/60 p-4 bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm group", className)}>
      <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none z-0">
        <Icon className="w-40 h-40" />
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
          {title}
        </CardTitle>
        <div className={cn("p-3 rounded-2xl shadow-inner border border-border/40 backdrop-blur-sm", iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10 pt-2">
        <div className="text-3xl sm:text-4xl font-black tracking-tight">{value}</div>
        {(description || trend) && (
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {trend && (
              <div className={cn(
                "flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border uppercase tracking-wider",
                trend === 'up' && "text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/30",
                trend === 'down' && "text-red-700 bg-red-100/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/30",
                trend === 'neutral' && "text-gray-600 bg-gray-100/80 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800/30"
              )}>
                {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 mr-1.5" />}
                {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 mr-1.5" />}
                {trend === 'neutral' && <Minus className="h-3.5 w-3.5 mr-1.5" />}
                {trendValue}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground font-medium">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
