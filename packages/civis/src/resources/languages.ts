import type { Http } from "../http";
import type { Language } from "../types";

const BASE = "/platform/api/v1/languages";

export function createLanguagesResource(http: Http) {
  return {
    async list(): Promise<Language[]> {
      const res = await http.get<Language[]>(BASE);
      return res.data;
    },
    async get(code: string): Promise<Language> {
      const res = await http.get<Language>(`${BASE}/${code}`);
      return res.data;
    },
  };
}
