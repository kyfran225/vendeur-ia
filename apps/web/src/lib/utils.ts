import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripActionTags(text: string): string {
  if (!text) return "";
  return text.replace(/\[\[ACTION_.*?\]\]/g, "").trim();
}
