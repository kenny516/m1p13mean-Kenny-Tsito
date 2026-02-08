/**
 * Parse une option de tri au format fieldName_order.
 */
export const parseSortOption = (sort, defaultSort = { createdAt: -1 }) => {
	if (!sort) return defaultSort;
	const lastUnderscore = sort.lastIndexOf("_");
	if (lastUnderscore === -1) return defaultSort;
	const field = sort.substring(0, lastUnderscore);
	const order = sort.substring(lastUnderscore + 1);
	return { [field]: order === "asc" ? 1 : -1 };
};