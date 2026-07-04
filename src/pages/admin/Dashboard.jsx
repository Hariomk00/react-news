import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../../firebase";
import { updateEmail, updatePassword } from "firebase/auth";
import AdminLayout from "../../components/AdminLayout";
import { Newspaper, CalendarDays, Image, CalendarRange, PlusCircle, Settings, ClipboardList, Megaphone, Upload, Eye, UserCog } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalNews: 0,
    todayNews: 0,
    imageNews: 0,
    latestDate: "N/A",
  });
  const [loading, setLoading] = useState(true);

  // Breaking News States
  const [breakingNewsText, setBreakingNewsText] = useState("");
  const [breakingLoading, setBreakingLoading] = useState(false);
  const [breakingSuccess, setBreakingSuccess] = useState("");
  const [breakingError, setBreakingError] = useState("");

  // Featured Banner States
  const [bannerTag, setBannerTag] = useState("Featured");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerContent, setBannerContent] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerImageType, setBannerImageType] = useState("url"); // "url" or "upload"
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState("");
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState("");
  const [bannerError, setBannerError] = useState("");

  // Change Credentials States
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [credLoading, setCredLoading] = useState(false);
  const [credSuccess, setCredSuccess] = useState("");
  const [credError, setCredError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const newsRef = collection(db, "news");
        // Get all news to calculate counts
        const querySnapshot = await getDocs(newsRef);
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push(doc.data());
        });

        // 1. Total News
        const totalNews = docs.length;

        // 2. Today's News
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayNews = docs.filter((item) => {
          const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        }).length;

        // 3. News with image
        const imageNews = docs.filter((item) => item.image && item.image !== "").length;

        // 4. Latest News Date
        let latestDate = "N/A";
        if (totalNews > 0) {
          // Sort items by date desc
          const sorted = docs.sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
            return timeB - timeA;
          });
          const latestItem = sorted[0];
          const latestVal = latestItem.createdAt?.toDate ? latestItem.createdAt.toDate() : new Date(latestItem.createdAt);
          latestDate = latestVal.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }

        setStats({ totalNews, todayNews, imageNews, latestDate });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const fetchBreakingNews = async () => {
      try {
        const docRef = doc(db, "settings", "breaking");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBreakingNewsText(docSnap.data().text || "");
        }
      } catch (err) {
        console.error("Error fetching breaking news:", err);
      }
    };
    fetchBreakingNews();

    const fetchFeaturedBanner = async () => {
      try {
        const docRef = doc(db, "settings", "featured_banner");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBannerTag(data.tag || "Featured");
          setBannerTitle(data.title || "");
          setBannerContent(data.content || "");
          setBannerLink(data.link || "");
          setBannerImageUrl(data.image || "");
          setBannerImagePreview(data.image || "");
          if (data.image && !data.image.includes("firebasestorage.googleapis.com")) {
            setBannerImageType("url");
          } else {
            setBannerImageType("upload");
          }
        } else {
          setBannerTag("Featured");
          setBannerTitle("Rajveer sagai hogi 32january");
          setBannerContent("An exclusive update on Rajveer's special day. Click the banner image to check the PM Kisan Samman Nidhi status and details online on the official portal.");
          setBannerLink("https://pmkisan.gov.in/");
          setBannerImageUrl("/AA1wQy2w.jpeg");
          setBannerImagePreview("/AA1wQy2w.jpeg");
          setBannerImageType("url");
        }
      } catch (err) {
        console.error("Error fetching featured banner:", err);
      }
    };
    fetchFeaturedBanner();
  }, []);

  const handleUpdateBreakingNews = async (e) => {
    e.preventDefault();
    setBreakingLoading(true);
    setBreakingSuccess("");
    setBreakingError("");

    try {
      const docRef = doc(db, "settings", "breaking");
      await setDoc(docRef, {
        text: breakingNewsText,
        updatedAt: new Date(),
      }, { merge: true });
      setBreakingSuccess("Breaking news updated!");
      setTimeout(() => setBreakingSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating breaking news:", err);
      setBreakingError("Failed to update.");
    } finally {
      setBreakingLoading(false);
    }
  };

  // Sync featured banner image preview reactively
  useEffect(() => {
    let objectUrl = "";
    if (bannerImageType === "upload") {
      if (bannerImageFile) {
        objectUrl = URL.createObjectURL(bannerImageFile);
        setBannerImagePreview(objectUrl);
      } else {
        setBannerImagePreview(bannerImageUrl);
      }
    } else {
      setBannerImagePreview(bannerImageUrl);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [bannerImageType, bannerImageFile, bannerImageUrl]);

  const handleUpdateFeaturedBanner = async (e) => {
    e.preventDefault();
    setBannerLoading(true);
    setBannerSuccess("");
    setBannerError("");

    try {
      let finalImageUrl = bannerImageUrl;

      if (bannerImageType === "upload" && bannerImageFile) {
        const fileName = `featured_${Date.now()}_${bannerImageFile.name}`;
        const storageRef = ref(storage, `settings/${fileName}`);
        const snapshot = await uploadBytes(storageRef, bannerImageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
        setBannerImageUrl(finalImageUrl);
      }

      const docRef = doc(db, "settings", "featured_banner");
      await setDoc(docRef, {
        tag: bannerTag,
        title: bannerTitle,
        content: bannerContent,
        link: bannerLink,
        image: finalImageUrl,
        updatedAt: new Date(),
      }, { merge: true });

      setBannerSuccess("Featured banner updated successfully!");
      setTimeout(() => setBannerSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating featured banner:", err);
      setBannerError("Failed to update featured banner.");
    } finally {
      setBannerLoading(false);
    }
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setCredLoading(true);
    setCredSuccess("");
    setCredError("");

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found.");
      }

      if (newEmail.trim() && newEmail.trim() !== user.email) {
        await updateEmail(user, newEmail.trim());
      }

      if (newPassword.trim()) {
        await updatePassword(user, newPassword.trim());
      }

      setCredSuccess("Credentials updated successfully!");
      setNewEmail("");
      setNewPassword("");
    } catch (err) {
      console.error("Error updating credentials:", err);
      if (err.code === "auth/requires-recent-login") {
        setCredError("For security, please log out and log back in, then try again.");
      } else {
        setCredError(err.message || "Failed to update credentials.");
      }
    } finally {
      setCredLoading(false);
    }
  };

  const statCards = [
    { title: "Total News", value: stats.totalNews, icon: Newspaper, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20" },
    { title: "Today's News", value: stats.todayNews, icon: CalendarDays, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
    { title: "News with Images", value: stats.imageNews, icon: Image, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
    { title: "Latest News Date", value: stats.latestDate, icon: CalendarRange, color: "text-red-600 bg-red-50 dark:bg-red-950/20" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            📊 Admin Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of your news channel metrics and management tools
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse bg-white dark:bg-gray-800 h-32 rounded-2xl shadow-sm border border-gray-250/60 dark:border-gray-700"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 hover:shadow-md transition flex items-center gap-5"
                >
                  <div className={`p-4 rounded-xl ${card.color}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">
                      {card.value}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                      {card.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Management Links */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              to="/admin/add-news"
              className="flex flex-col items-center justify-center p-6 bg-red-50 hover:bg-red-100/70 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl font-bold transition text-center border border-red-100/50 dark:border-red-950/25 group"
            >
              <PlusCircle size={32} className="group-hover:scale-110 transition duration-200" />
              <span className="mt-3">Publish News</span>
            </Link>

            <Link
              to="/admin/manage-news"
              className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl font-bold transition text-center border border-blue-100/50 dark:border-blue-950/25 group"
            >
              <ClipboardList size={32} className="group-hover:scale-110 transition duration-200" />
              <span className="mt-3">Manage News List</span>
            </Link>

            <Link
              to="/admin/manage-categories"
              className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100/70 dark:bg-purple-950/20 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl font-bold transition text-center border border-purple-100/50 dark:border-purple-950/25 group"
            >
              <Settings size={32} className="group-hover:scale-110 transition duration-200" />
              <span className="mt-3">Configure Categories</span>
            </Link>
          </div>
        </div>

        {/* Breaking News Ticker Manager */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
            <Megaphone className="text-red-600 dark:text-red-500 animate-bounce" size={20} />
            📢 Breaking News Ticker
          </h3>
          <form onSubmit={handleUpdateBreakingNews} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Marquee Text
              </label>
              <textarea
                required
                value={breakingNewsText}
                onChange={(e) => setBreakingNewsText(e.target.value)}
                placeholder="Enter breaking news marquee text..."
                rows={2}
                className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tip: Use bullet symbols (•) to separate multiple news alerts.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={breakingLoading}
                className="py-2.5 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md font-sans"
              >
                {breakingLoading ? "Updating..." : "Update Ticker"}
              </button>
              {breakingSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-450 font-bold animate-fadeIn">
                  ✓ {breakingSuccess}
                </span>
              )}
              {breakingError && (
                <span className="text-xs text-red-600 dark:text-red-400 font-bold animate-fadeIn">
                  ✗ {breakingError}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Featured Banner Manager */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
            <Image className="text-red-600 dark:text-red-500 animate-pulse" size={20} />
            🎯 Homepage Featured Banner (Ads / Schemes)
          </h3>
          <form onSubmit={handleUpdateFeaturedBanner} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tag */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Banner Tag
                </label>
                <input
                  type="text"
                  required
                  value={bannerTag}
                  onChange={(e) => setBannerTag(e.target.value)}
                  placeholder="e.g. Featured, Govt Scheme, Sponsored"
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Banner Title
                </label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Rajveer sagai hogi 32january"
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
                />
              </div>
            </div>

            {/* Description/Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Banner Description
              </label>
              <textarea
                required
                value={bannerContent}
                onChange={(e) => setBannerContent(e.target.value)}
                placeholder="Write the banner content here..."
                rows={3}
                className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Redirect Action Link */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Action Link / Redirect URL
                </label>
                <input
                  type="url"
                  required
                  value={bannerLink}
                  onChange={(e) => setBannerLink(e.target.value)}
                  placeholder="https://pmkisan.gov.in/"
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
                />
              </div>

              {/* Image Source Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Image Source
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-750">
                  <button
                    type="button"
                    onClick={() => setBannerImageType("url")}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      bannerImageType === "url"
                        ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerImageType("upload")}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      bannerImageType === "upload"
                        ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Upload File
                  </button>
                </div>
              </div>
            </div>

            {/* Image Inputs */}
            {bannerImageType === "url" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  required
                  value={bannerImageUrl}
                  onChange={(e) => setBannerImageUrl(e.target.value)}
                  placeholder="/AA1wQy2w.jpeg or https://example.com/image.jpg"
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Upload Image File
                </label>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="flex text-xs text-gray-600 dark:text-gray-400 justify-center">
                      <label className="relative cursor-pointer rounded-md font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setBannerImageFile(e.target.files[0])}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Banner Image */}
            {bannerImagePreview && (
              <div className="mt-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Image Preview
                </label>
                <div className="relative rounded-xl overflow-hidden shadow-sm max-w-xs border border-gray-150 dark:border-gray-700">
                  <img
                    src={bannerImagePreview}
                    alt="Banner Preview"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
                    }}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full flex items-center gap-1 text-[10px]">
                    <Eye size={10} /> Preview
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={bannerLoading}
                className="py-2.5 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md font-sans"
              >
                {bannerLoading ? "Updating..." : "Update Featured Banner"}
              </button>
              {bannerSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-450 font-bold animate-fadeIn">
                  ✓ {bannerSuccess}
                </span>
              )}
              {bannerError && (
                <span className="text-xs text-red-600 dark:text-red-400 font-bold animate-fadeIn">
                  ✗ {bannerError}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Change Login Credentials Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
            <UserCog size={18} className="text-red-500" />
            Update Login Credentials
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Modify the admin login email and password. Leaving a field blank will keep it unchanged.
          </p>

          <form onSubmit={handleUpdateCredentials} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                New Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new-email@news.com"
                className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={credLoading}
                className="py-2.5 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md font-sans"
              >
                {credLoading ? "Updating..." : "Update Credentials"}
              </button>
              {credSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-450 font-bold animate-fadeIn">
                  ✓ {credSuccess}
                </span>
              )}
              {credError && (
                <span className="text-xs text-red-600 dark:text-red-400 font-bold animate-fadeIn">
                  ✗ {credError}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
