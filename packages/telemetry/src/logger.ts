export type LogFields = Record<string, unknown>;

export type Logger = {
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
};

function serialize(
  serviceName: string,
  level: string,
  message: string,
  fields?: LogFields,
): string {
  return JSON.stringify({
    level,
    message,
    "service.name": serviceName,
    timestamp: new Date().toISOString(),
    ...fields,
  });
}

export function createLogger(serviceName: string): Logger {
  return {
    info(message, fields) {
      console.info(serialize(serviceName, "info", message, fields));
    },
    warn(message, fields) {
      console.warn(serialize(serviceName, "warn", message, fields));
    },
    error(message, fields) {
      console.error(serialize(serviceName, "error", message, fields));
    },
  };
}
