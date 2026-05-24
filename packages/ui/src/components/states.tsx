import { AlertCircle, FileSearch, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";

export type StateAction = {
  label: string;
  onClick?: () => void;
  href?: string;
};

function StateFrame({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: StateAction;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="mb-4 rounded-full bg-muted p-3 text-muted-foreground">
        {icon}
      </div>
      <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button
          asChild={Boolean(action.href)}
          className="mt-5"
          onClick={action.onClick}
        >
          {action.href ? (
            <a href={action.href}>{action.label}</a>
          ) : (
            <span>{action.label}</span>
          )}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState(props: {
  title: string;
  description?: string;
  action?: StateAction;
}) {
  return <StateFrame icon={<FileSearch className="h-5 w-5" />} {...props} />;
}

export function ErrorState(props: {
  title: string;
  description?: string;
  action?: StateAction;
}) {
  return <StateFrame icon={<AlertCircle className="h-5 w-5" />} {...props} />;
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
