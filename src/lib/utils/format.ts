import {
  differenceInDays,
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

export function formatDate(value: string | Date, pattern = "dd MMM yyyy"): string {
  return format(toDate(value), pattern, { locale: ptBR });
}

export function formatDateTime(value: string | Date): string {
  return format(toDate(value), "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatRelative(value: string | Date): string {
  const date = toDate(value);
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  if (isYesterday(date)) return "Ontem";
  return formatDistanceToNowStrict(date, { locale: ptBR, addSuffix: true });
}

export function daysUntil(value: string | Date): number {
  return differenceInDays(toDate(value), new Date());
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function truncate(text: string, max = 140): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
