"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

type Point = Record<string, number | string>;

const statusConfig = {
  count: { label: "Tenants", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const regionConfig = {
  tenants: { label: "Tenants", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const activityConfig = {
  onboarded: { label: "Onboarded", color: "hsl(var(--primary))" },
  secured: { label: "Secured", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const pieColors = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

export function TenantStatusChart({ data }: { data: Point[] }) {
  return (
    <ChartContainer
      config={statusConfig}
      className="h-[260px] w-full"
      initialDimension={{ width: 520, height: 260 }}
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={3}
        >
          {data.map((item, index) => (
            <Cell
              key={String(item.status)}
              fill={pieColors[index % pieColors.length] ?? "hsl(var(--primary))"}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

export function RegionBarChart({ data }: { data: Point[] }) {
  return (
    <ChartContainer
      config={regionConfig}
      className="h-[260px] w-full"
      initialDimension={{ width: 620, height: 260 }}
    >
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="region" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="tenants" fill="var(--color-tenants)" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function OnboardingAreaChart({ data }: { data: Point[] }) {
  return (
    <ChartContainer
      config={activityConfig}
      className="h-[280px] w-full"
      initialDimension={{ width: 760, height: 280 }}
    >
      <AreaChart data={data}>
        <defs>
          <linearGradient id="onboarded-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-onboarded)" stopOpacity={0.32} />
            <stop offset="95%" stopColor="var(--color-onboarded)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="secured-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-secured)" stopOpacity={0.24} />
            <stop offset="95%" stopColor="var(--color-secured)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="onboarded"
          stroke="var(--color-onboarded)"
          fill="url(#onboarded-fill)"
          strokeWidth={2}
          type="monotone"
        />
        <Area
          dataKey="secured"
          stroke="var(--color-secured)"
          fill="url(#secured-fill)"
          strokeWidth={2}
          type="monotone"
        />
      </AreaChart>
    </ChartContainer>
  );
}
