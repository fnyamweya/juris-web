import { listDeployableApps, selectApps } from "./shared";

type Group = "all" | "app-workers" | "gateway";

const args = process.argv.slice(2);
const group = getGroup(args);
const requestedApps = getApps(args);

const apps = selectApps(listDeployableApps(), requestedApps).filter((app) => {
  if (group === "all") {
    return true;
  }

  if (group === "gateway") {
    return app.kind === "gateway";
  }

  return app.kind !== "gateway";
});

console.log(
  JSON.stringify({
    include: apps.map((app) => ({
      slug: app.slug,
      packageName: app.packageName,
      kind: app.kind,
      binding: app.binding ?? null,
    })),
  }),
);

function getGroup(argv: string[]): Group {
  const flagIndex = argv.findIndex((value) => value === "--group");

  if (flagIndex === -1) {
    return "all";
  }

  const value = argv[flagIndex + 1];
  if (value === "all" || value === "app-workers" || value === "gateway") {
    return value;
  }

  throw new Error(`Unknown matrix group: ${value ?? "(missing)"}`);
}

function getApps(argv: string[]) {
  const flagIndex = argv.findIndex(
    (value) => value === "--apps" || value === "--app",
  );

  if (flagIndex === -1) {
    return undefined;
  }

  const value = argv[flagIndex + 1];
  if (!value) {
    throw new Error("Missing value for --apps");
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
