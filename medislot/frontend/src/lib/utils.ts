import { clsx } from "clsx";
import type { ClassValue } from "clsx"; // Explicitly importing ClassValue as a type
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}