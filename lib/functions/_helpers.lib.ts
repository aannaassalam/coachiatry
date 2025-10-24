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

export const createPageRange = (
  siblingCount: number,
  totalPages: number,
  page: number
) => {
  const totalNumbers = siblingCount * 2 + 3; // current, siblings, first, last
  const totalBlocks = totalNumbers + 2; // including ellipses

  if (totalPages > totalBlocks) {
    const startPage = Math.max(2, page - siblingCount);
    const endPage = Math.min(totalPages - 1, page + siblingCount);
    const pages = [];

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    const hasLeftEllipsis = startPage > 2;
    const hasRightEllipsis = endPage < totalPages - 1;

    if (hasLeftEllipsis && !hasRightEllipsis) {
      const extra = startPage === 3 ? [2] : ["…"];
      return [1, ...extra, ...pages, totalPages];
    } else if (!hasLeftEllipsis && hasRightEllipsis) {
      const extra = endPage === totalPages - 2 ? [totalPages - 1] : ["…"];
      return [1, ...pages, ...extra, totalPages];
    } else if (hasLeftEllipsis && hasRightEllipsis) {
      return [1, "…", ...pages, "…", totalPages];
    }
    return pages;
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
};
