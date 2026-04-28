/* eslint-disable @typescript-eslint/no-explicit-any */
import { Filter } from "@/typescript/interface/common.interface";
import moment from "moment";
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

/**
 * Compact relative time for chat lists. Within the current week shows short
 * notations ("3s", "5m", "2h", "4d"); anything older falls back to an
 * absolute date so the list stays readable without ambiguous short tokens.
 * Independent of moment's global locale.
 */
export function formatChatTime(date?: string | Date | null): string {
  if (!date) return "";
  const m = moment(date);
  if (!m.isValid()) return "";
  const now = moment();
  const seconds = now.diff(m, "seconds");
  if (seconds < 60) return `${Math.max(seconds, 0)}s`;
  const minutes = now.diff(m, "minutes");
  if (minutes < 60) return `${minutes}m`;
  const hours = now.diff(m, "hours");
  if (hours < 24) return `${hours}h`;
  const days = now.diff(m, "days");
  if (days < 7) return `${days}d`;
  return m.format("DD/MM/YY");
}

export function formatDateOrEmpty(
  date?: string | Date | null,
  fmt: string = "D MMM, YYYY"
): string {
  if (!date) return "";
  const m = moment(date);
  if (!m.isValid()) return "";
  return m.format(fmt);
}

/**
 * WhatsApp-style day label for chat date separators.
 * Today / Yesterday / weekday name within last 7 days / full date otherwise.
 */
export function formatChatDayLabel(date?: string | Date | null): string {
  if (!date) return "";
  const m = moment(date).startOf("day");
  if (!m.isValid()) return "";
  const today = moment().startOf("day");
  const diff = today.diff(m, "days");
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return m.format("dddd");
  return m.format("MMMM D, YYYY");
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
