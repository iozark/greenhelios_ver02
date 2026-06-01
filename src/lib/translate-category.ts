const KNOWN_EXPENSE_KEYS = new Set([
  "maintenance",
  "utilities",
  "insurance",
  "management",
  "cleaning",
  "repairs",
  "taxes",
  "other",
]);

/** Maps DB/API expense category (English) to a next-intl key under *.categories */
export function translateExpenseCategory(
  cat: string,
  tr: (key: string) => string
): string {
  const key = cat.trim().toLowerCase();
  if (KNOWN_EXPENSE_KEYS.has(key)) return tr(key);
  return cat;
}
