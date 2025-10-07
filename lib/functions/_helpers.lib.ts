/* eslint-disable @typescript-eslint/no-explicit-any */
import { Filter } from "@/typescript/interface/common.interface";
import { parseCookies, setCookie } from "nookies";
/**
 * Check if the window object exists.
 * @returns A function that checks if the window is undefined.
 */
export function checkWindow() {
  return typeof window !== "undefined";
}

export function getRole() {
  const cookies = parseCookies();
  return JSON.parse(cookies.user || "{}").role?.[0]?.name;
}

export function setCurrentRole(ctx: any = null, role: string) {
  setCookie(ctx, "current_role", role, {
    path: "/",
    maxAge: 24 * 60 * 60
  });
}

export function isInServer() {
  return typeof document === "undefined";
}

export function isApple() {
  if (typeof navigator === "undefined") {
    return false;
  }
  const platformExpression = /Mac|iPhone|iPod|iPad/i;
  const agent = navigator.userAgent;
  return platformExpression.test(agent);
}

export function isAppleSafari() {
  if (typeof navigator === "undefined") {
    return false;
  }
  const rejectedExpression = /Chrome|Android|CriOS|FxiOS|EdgiOS/i;
  const expectedExpression = /Safari/i;

  const agent = navigator.userAgent;
  if (rejectedExpression.test(agent)) {
    return false;
  }
  return isApple() && expectedExpression.test(agent);
}

export const roleParser = (role: string) => {
  return role.replace("ROLE_", "").replaceAll("_", " ");
};

export function sanitizeFilters(values: Filter[]): Filter[] {
  return values.filter(
    (f) => f.selectedKey && f.selectedOperator && f.selectedValue
  );
}

export function getInitials(fullName?: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((name) => name[0].toUpperCase());
  return initials.join("");
}
