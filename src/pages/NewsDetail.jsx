import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import { useSEO } from "../hooks/useSEO";

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [categoryName, setCategoryName] = useState("Uncategorized");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useSEO({
    title: news ? news.title : "News Article",
    description: news ? news.short_desc : undefined,
    image: news ? news.image : undefined,
    type: "article"
  });

  useEffect(() => {
    const fetchNewsDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, "news", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("News article not found");
          setLoading(false);
          return;
        }

        const data = docSnap.data();
        setNews(data);

        // Fetch Category name if category_id exists
        if (data.category_id) {
          const catDocRef = doc(db, "categories", data.category_id);
          const catDocSnap = await getDoc(catDocRef);
          if (catDocSnap.exists()) {
            setCategoryName(catDocSnap.data().name);
          }
        }
      } catch (error) {
        console.error("Error fetching news article:", error);
        setError("Error loading article contents");
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [id]);

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 dark:hover:text-red-500 transition mb-6"
        >
          <ArrowLeft size={16} />
          Back to Articles
        </Link>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-[400px] w-full bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800">
            <p className="text-red-500 font-bold text-lg">{error}</p>
            <Link to="/" className="inline-block mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition">
              Return Home
            </Link>
          </div>
        ) : (
          <article className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800/60 p-6 md:p-10">
            
            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-gray-950 dark:text-white">
              {news.title}
            </h1>

            {/* Metadata (Category, Date) */}
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-6">
              {/* Category */}
              <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 px-3 py-1 rounded-full text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                <Tag size={13} />
                {categoryName}
              </div>

              {/* Date */}
              {news.createdAt && (
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Calendar size={14} className="text-gray-400" />
                  {formatDate(news.createdAt)}
                </div>
              )}
            </div>

            {/* Main Featured Image */}
            {news.image && (
              <div className="mt-8 rounded-2xl overflow-hidden shadow-md max-h-[500px]">
                <img
                  src={news.image}
                  alt={news.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Full News Content */}
            <div className="mt-8 text-gray-700 dark:text-gray-300 leading-relaxed text-base md:text-lg whitespace-pre-line">
              {news.full_content}
            </div>
          </article>
        )}
      </main>
    </div>
  );
};

export default NewsDetail;
