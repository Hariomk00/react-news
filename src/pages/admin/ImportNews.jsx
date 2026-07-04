import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { Search, Globe, Key, AlertCircle, Sparkles, PlusCircle } from "lucide-react";

const ImportNews = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(localStorage.getItem("currents_api_key") || "");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("en");

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSaveKey = (e) => {
    const key = e.target.value.trim();
    setApiKey(key);
    localStorage.setItem("currents_api_key", key);
  };

  const handleFetchNews = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setNews([]);

    if (!apiKey.trim()) {
      setError("Please set your CurrentsAPI Key first.");
      return;
    }

    setLoading(true);
    try {
      // Build query parameters
      let url = `https://api.currentsapi.services/v1/search?apiKey=${apiKey.trim()}`;
      if (keywords.trim()) url += `&keywords=${encodeURIComponent(keywords.trim())}`;
      if (category) url += `&category=${category}`;
      if (language) url += `&language=${language}`;

      // If no keywords or category is provided, fallback to latest-news endpoint
      if (!keywords.trim() && !category) {
        url = `https://api.currentsapi.services/v1/latest-news?apiKey=${apiKey.trim()}`;
        if (language) url += `&language=${language}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "error" || !data.news) {
        throw new Error(data.message || "Failed to fetch news from CurrentsAPI.");
      }

      setNews(data.news);
    } catch (err) {
      console.error("Error querying CurrentsAPI:", err);
      setError(err.message || "An error occurred while fetching news.");
    } finally {
      setLoading(false);
    }
  };

  // Run a default fetch if API Key is already present on mount
  useEffect(() => {
    if (apiKey) {
      handleFetchNews();
    }
  }, []);

  const handleImport = (article) => {
    navigate("/admin/add-news", {
      state: {
        prefilledNews: {
          title: article.title,
          short_desc: article.description || "",
          full_content: (article.description || "") + `\n\n---\nSource: ${article.author || 'CurrentsAPI'} - Read full article: ${article.url}`,
          image: article.image && article.image !== "None" ? article.image : "",
          url: article.url,
          author: article.author || 'CurrentsAPI',
        }
      }
    });
  };

  // Format date string beautifully
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const categoriesList = [
    "regional", "technology", "lifestyle", "business", "general",
    "programming", "science", "entertainment", "sports", "world", "politics"
  ];

  const languagesList = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "hi", name: "Hindi" },
    { code: "ar", name: "Arabic" },
    { code: "zh", name: "Chinese" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "ja", name: "Japanese" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="text-red-600 dark:text-red-500 animate-spin-slow" size={30} />
            🌐 Import External News
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Search, discover, and instantly import global articles from CurrentsAPI directly to your news site.
          </p>
        </div>

        {/* API Key settings card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-xl">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">CurrentsAPI Token</h3>
              <p className="text-xs text-gray-400">Required to authorize requests. Get one at <a href="https://currentsapi.services/" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">currentsapi.services</a>.</p>
            </div>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={handleSaveKey}
            placeholder="Paste your API key here..."
            className="w-full md:max-w-md px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
          />
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-950/30 text-sm flex items-center gap-2.5">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Search controls */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
          <form onSubmit={handleFetchNews} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              {/* Keywords search */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Search Keywords
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Enter keywords e.g. space, artificial intelligence..."
                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
                  />
                  <Search size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Quick Filters:</span>
                  {["Madhya Pradesh", "Morena", "Sabalgarh", "India News"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setKeywords(tag)}
                      className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-205 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-red-650 hover:bg-red-50/50 hover:border-red-200 dark:hover:text-red-400 dark:hover:bg-red-950/20 dark:hover:border-red-900 transition cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Language dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition cursor-pointer"
                >
                  {languagesList.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
            >
              {loading ? "Searching Feed..." : "Search Articles"}
            </button>
          </form>
        </div>

        {/* Results section */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-3">
            Search Results {news.length > 0 && `(${news.length})`}
          </h3>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="animate-pulse bg-white dark:bg-gray-800 h-80 rounded-2xl border border-gray-150 dark:border-gray-700"></div>
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-150 dark:border-gray-700 transition duration-300"
                >
                  {/* Article Card Image */}
                  <div className="h-44 overflow-hidden relative bg-gray-50 dark:bg-gray-900">
                    <img
                      src={item.image && item.image !== "None" ? item.image : "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80"}
                      alt={item.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {item.category && item.category[0] && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.category[0]}
                      </span>
                    )}
                  </div>

                  {/* Content info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase mb-2">
                        <span>{item.author || "Unknown Source"}</span>
                        <span>{formatDate(item.published)}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-500 transition duration-200">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleImport(item)}
                      className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm font-sans"
                    >
                      <PlusCircle size={14} />
                      Import Article
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 flex flex-col items-center justify-center">
              <Sparkles className="text-gray-300 dark:text-gray-600 mb-3" size={40} />
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                No external news articles loaded. Enter your API key and search parameters to load global news feed.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ImportNews;
