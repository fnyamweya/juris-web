import { ErrorState } from "@repo/ui";

export default function NotFound() {
  return (
    <main className="p-6">
      <ErrorState
        title="Page not found"
        description="The requested page does not exist."
      />
    </main>
  );
}
