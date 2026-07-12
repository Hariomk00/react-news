export const getUrlFriendlyTitle = (title) => {
  if (!title) return "";
  // Replace slashes with hyphens so they don't break routing paths
  return title.replace(/\//g, "-").trim();
};

export const slugify = (title) => {
  if (!title) return "";
  return title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")           // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start of text
    .replace(/-+$/, "");            // Trim - from end of text
};
