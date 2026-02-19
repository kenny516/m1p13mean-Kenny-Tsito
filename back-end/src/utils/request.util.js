/**
 * Parse une option de tri au format fieldName_order.
 */
export const parseSortOption = (sort, defaultSort = { createdAt: -1 }) => {
  if (!sort) return defaultSort;

  // Format: field_asc or field_desc
  const lastUnderscore = sort.lastIndexOf("_");
  if (lastUnderscore !== -1) {
    const field = sort.substring(0, lastUnderscore);
    const order = sort.substring(lastUnderscore + 1);
    return { [field]: order === "asc" ? 1 : -1 };
  }

  // Format: -field (desc) or field (desc by default)
  if (sort.startsWith("-")) {
    const field = sort.substring(1);
    return { [field]: -1 };
  }

  // Plain field name -> default to descending
  return { [sort]: -1 };
};
