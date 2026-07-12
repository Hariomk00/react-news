import { useEffect } from "react";

export const useSEO = ({ title, description, image, url, type = "website" } = {}) => {
  useEffect(() => {
    // 1. Update Title
    const finalTitle = title ? `${title} | Indiianews` : "Indiianews | Latest Hindi & English News Updates | हिंदी न्यूज़, ताज़ा खबर";
    document.title = finalTitle;

    // Helper to set or update meta tag
    const setMetaTag = (attributeName, attributeValue, contentValue) => {
      if (!contentValue) return;
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", contentValue);
    };

    const defaultDesc = "Stay updated with the latest news, breaking updates, and trending stories in Hindi and English on Indiianews.";

    // 2. Standard Meta Tags
    setMetaTag("name", "description", description || defaultDesc);
    
    // 3. Open Graph Meta Tags
    setMetaTag("property", "og:title", finalTitle);
    setMetaTag("property", "og:description", description || defaultDesc);
    setMetaTag("property", "og:image", image || "/favicon.png");
    setMetaTag("property", "og:url", url || window.location.href);
    setMetaTag("property", "og:type", type);

    // 4. Twitter Card Meta Tags
    setMetaTag("name", "twitter:title", finalTitle);
    setMetaTag("name", "twitter:description", description || defaultDesc);
    setMetaTag("name", "twitter:image", image || "/favicon.png");
    setMetaTag("name", "twitter:card", image ? "summary_large_image" : "summary");

  }, [title, description, image, url, type]);
};
