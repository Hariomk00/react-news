import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import { useSEO } from "../hooks/useSEO";
import { getUrlFriendlyTitle } from "../utils/slugify";

const Home = () => {
  useSEO();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [breakingNews, setBreakingNews] = useState("Stay tuned for live updates • PM Kisan Samman Nidhi Portal updates out • Rajveer sagai updates inside!");
  const [featuredBanner, setFeaturedBanner] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const articles = [];
        querySnapshot.forEach((doc) => {
          articles.push({ id: doc.id, ...doc.data() });
        });
        setNewsList(articles);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchBreakingNews = async () => {
      try {
        const docRef = doc(db, "settings", "breaking");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().text) {
          setBreakingNews(docSnap.data().text);
        }
      } catch (error) {
        console.error("Error fetching breaking news:", error);
      }
    };

    const fetchFeaturedBanner = async () => {
      try {
        const docRef = doc(db, "settings", "featured_banner");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFeaturedBanner({
            tag: data.tag || "",
            title: data.title || "",
            content: data.content || "",
            link: data.link || "",
            image: data.image || ""
          });
        }
      } catch (error) {
        console.error("Error fetching featured banner:", error);
      } finally {
        setBannerLoading(false);
      }
    };

    fetchNews();
    fetchBreakingNews();
    fetchFeaturedBanner();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header />

      {/* Breaking News Marquee */}
      <div className="bg-red-600 dark:bg-red-700 text-white font-bold h-10 flex items-center overflow-hidden relative shadow-inner">
        <div className="absolute left-0 top-0 bottom-0 bg-red-800 px-4 flex items-center z-10 font-extrabold uppercase text-xs tracking-wider shadow-md">
          Breaking
        </div>
        <div className="w-full flex whitespace-nowrap pl-24">
          <span className="animate-marquee inline-block text-sm uppercase tracking-wide py-1 font-semibold">
            {breakingNews}
          </span>
        </div>
      </div>

      {/* Main Body container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        {bannerLoading ? (
          <section className="mb-12 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-850 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:h-[450px]">
              <div className="h-[250px] md:h-full bg-gray-200 dark:bg-gray-800"></div>
              <div className="p-8 flex flex-col justify-center bg-gray-50/50 dark:bg-gray-900/50 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 space-y-4">
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded"></div>
              </div>
            </div>
          </section>
        ) : featuredBanner && featuredBanner.image ? (
          <section className="mb-12 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-850">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:h-[450px]">
              {/* Clickable Image */}
              <a 
                href={featuredBanner.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-[250px] md:h-full overflow-hidden block relative group"
              >
                <img 
                  src={featuredBanner.image} 
                  alt={featuredBanner.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition duration-300"></div>
              </a>

              {/* Content info */}
              <div className="p-8 flex flex-col justify-center bg-gray-50/50 dark:bg-gray-900/50 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800">
                {featuredBanner.tag && (
                  <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider text-xs rounded-full mb-4 w-fit">
                    {featuredBanner.tag}
                  </span>
                )}
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-gray-900 dark:text-white">
                  {featuredBanner.title}
                </h1>
                {featuredBanner.content && (
                  <p className="text-gray-500 dark:text-gray-400 mt-4 leading-relaxed text-sm md:text-base">
                    {featuredBanner.content}
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {/* Latest News Title */}
        <div className="border-l-4 border-red-600 dark:border-red-500 pl-3 mb-8">
          <h2 className="text-2xl font-black uppercase tracking-wider">Latest Articles</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fresh stories published recently</p>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse bg-white dark:bg-gray-900 rounded-2xl h-80 border border-gray-100 dark:border-gray-850"></div>
            ))}
          </div>
        ) : newsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsList.map((news) => (
              <Link 
                key={news.id} 
                to={`/news/${getUrlFriendlyTitle(news.title)}`}
                className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-850 transition duration-300"
              >
                {/* Card Image */}
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={news.image} 
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-955 dark:text-white leading-snug group-hover:text-red-600 dark:group-hover:text-red-500 transition duration-200">
                      {news.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                      {news.short_desc}
                    </p>
                  </div>

                  <span className="text-xs text-red-500 dark:text-red-400 font-bold uppercase tracking-wider mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition duration-200">
                    Read Article &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-850">
            <p className="text-gray-400 dark:text-gray-500">No news articles found. Visit the admin panel to publish some news!</p>
            <Link 
              to="/admin/dashboard" 
              className="inline-block mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
