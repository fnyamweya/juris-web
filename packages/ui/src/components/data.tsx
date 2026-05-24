import type { AuditEvent } from "@repo/contracts";
import type { ComponentType, ReactNode } from "react";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

export type StatusKind =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "draft"
  | "active"
  | "inactive"
  | "pending"
  | "success"
  | "warning"
  | "danger";

const statusVariant: Record<
  StatusKind,
  "success" | "warning" | "danger" | "secondary"
> = {
  healthy: "success",
  success: "success",
  active: "success",
  degraded: "warning",
  warning: "warning",
  pending: "warning",
  unavailable: "danger",
  danger: "danger",
  draft: "secondary",
  inactive: "secondary",
};

export function StatusBadge({ status }: { status: StatusKind }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={["animate-pulse rounded-md bg-muted", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "flat";
  icon?: ComponentType<{ className?: string }>;
  description?: string;
}) {
  const trendClass =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-danger"
        : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {change ? (
          <p className={"mt-1 text-xs " + trendClass}>{change}</p>
        ) : null}
        {description ? (
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Record<string, ReactNode>>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column}>{row[column]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AuditEventList({ events }: { events: AuditEvent[] }) {
  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center justify-between rounded-md border p-3"
        >
          <div>
            <p className="text-sm font-medium">{event.action}</p>
            <p className="text-xs text-muted-foreground">
              {event.actor} · {event.target}
            </p>
          </div>
          <StatusBadge
            status={event.severity === "info" ? "active" : event.severity}
          />
        </div>
      ))}
    </div>
  );
}
