import { mockSession } from "./mock-session";
import type {
  AuthenticatedSession,
  EnterpriseIdentityProvider,
  Session,
} from "./types";

export function getMockSession(): Promise<AuthenticatedSession> {
  return Promise.resolve(mockSession);
}

export function getSession(): Promise<Session> {
  return Promise.resolve(mockSession);
}

export const enterpriseIdentityProviders: EnterpriseIdentityProvider[] = [
  {
    id: "oidc-placeholder",
    name: "Enterprise OIDC",
    kind: "oidc",
    signInUrl: "/en/login?provider=oidc",
  },
  {
    id: "saml-placeholder",
    name: "Enterprise SAML",
    kind: "saml",
    signInUrl: "/en/login?provider=saml",
  },
];

export type AuthRoadmap = {
  oidcProvider: "planned";
  samlProvider: "planned";
  sessionRefresh: "planned";
  logout: "planned";
  stepUpAuthentication: "planned";
};
