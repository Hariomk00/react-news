import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../../firebase";
import { updateEmail, updatePassword } from "firebase/auth";
import AdminLayout from "../../components/AdminLayout";
import { Newspaper, CalendarDays, Image, CalendarRange, PlusCircle, Settings, ClipboardList, Megaphone, Upload, Eye, UserCog, Trash2, Plus, ExternalLink } from "lucide-react";

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

  // Slides States
  const [slides, setSlides] = useState([]);
  const [slideDescription, setSlideDescription] = useState("");
  const [slideLink, setSlideLink] = useState("");
  const [slideImageType, setSlideImageType] = useState("upload"); // "upload" or "url"
  const [slideImageUrl, setSlideImageUrl] = useState("");
  const [slideImageFile, setSlideImageFile] = useState(null);
  const [slideImagePreview, setSlideImagePreview] = useState("");
  const [slideLoading, setSlideLoading] = useState(false);
  const [slideSuccess, setSlideSuccess] = useState("");
  const [slideError, setSlideError] = useState("");

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
        const querySnapshot = await getDocs(newsRef);
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push(doc.data());
        });

        const totalNews = docs.length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayNews = docs.filter((item) => {
          const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        }).length;

        const imageNews = docs.filter((item) => item.image && item.image !== "").length;

        let latestDate = "N/A";
        if (totalNews > 0) {
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

    const fetchSlides = async () => {
      try {
        const q = query(collection(db, "slides"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setSlides(list);
      } catch (err) {
        console.error("Error fetching slides:", err);
      }
    };
    fetchSlides();
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

  const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(img, 0, 0, width, height);

          // Compress as JPEG with 0.7 quality to keep document under Firestore limits
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSlideImageChange = (file) => {
    if (!file) return;
    setSlideImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSlideImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    setSlideLoading(true);
    setSlideSuccess("");
    setSlideError("");

    try {
      let finalImageUrl = "";

      if (slideImageType === "upload") {
        if (!slideImageFile) {
          throw new Error("Please select an image file to upload.");
        }
        finalImageUrl = await compressAndConvertToBase64(slideImageFile);
      } else {
        if (!slideImageUrl.trim()) {
          throw new Error("Please enter an image URL.");
        }
        finalImageUrl = slideImageUrl.trim();
      }

      await addDoc(collection(db, "slides"), {
        image: finalImageUrl,
        link: slideLink.trim() || "",
        description: slideDescription.trim() || "",
        createdAt: new Date(),
      });

      setSlideSuccess("Scheme slide added successfully!");
      setSlideDescription("");
      setSlideLink("");
      setSlideImageUrl("");
      setSlideImageFile(null);
      setSlideImagePreview("");
      
      // Refresh the slides list
      const q = query(collection(db, "slides"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setSlides(list);

      setTimeout(() => setSlideSuccess(""), 3000);
    } catch (err) {
      console.error("Error adding slide:", err);
      setSlideError(err.message || "Failed to add slide.");
    } finally {
      setSlideLoading(false);
    }
  };

  const handleDeleteSlide = async (slideId) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    try {
      await deleteDoc(doc(db, "slides", slideId));
      setSlides(slides.filter((slide) => slide.id !== slideId));
    } catch (err) {
      console.error("Error deleting slide:", err);
      alert("Failed to delete slide.");
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

        {/* Scheme Slides (Carousel) Manager Card */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 space-y-8">
          <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Megaphone className="text-red-600 dark:text-red-500 animate-pulse" size={20} />
              📢 Scheme Slides Manager (Auto-Sliding Carousel)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Add and manage scheme slides that automatically cycle on the homepage.
            </p>
          </div>

          {/* Form to Add Slide */}
          <form onSubmit={handleSaveSlide} className="space-y-6">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
              ➕ Add New Scheme Slide
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Short Description / Title
                </label>
                <input
                  type="text"
                  required
                  value={slideDescription}
                  onChange={(e) => setSlideDescription(e.target.value)}
                  placeholder="e.g. कौशल युवा से बनता विकसित भारत"
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
                />
              </div>

              {/* Redirect Action Link */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Redirect URL / Link
                </label>
                <input
                  type="url"
                  required
                  value={slideLink}
                  onChange={(e) => setSlideLink(e.target.value)}
                  placeholder="e.g. https://pmkivy.gov.in"
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Source Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Image Source
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-750">
                  <button
                    type="button"
                    onClick={() => setSlideImageType("upload")}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      slideImageType === "upload"
                        ? "bg-white dark:bg-gray-800 text-red-650 dark:text-red-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideImageType("url")}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      slideImageType === "url"
                        ? "bg-white dark:bg-gray-800 text-red-650 dark:text-red-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {/* Conditional Inputs */}
              {slideImageType === "url" ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    required
                    value={slideImageUrl}
                    onChange={(e) => setSlideImageUrl(e.target.value)}
                    placeholder="https://example.com/slide.jpg"
                    className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white text-sm transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Upload Image File
                  </label>
                  <div className="flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-6 w-6 text-gray-400" />
                      <div className="flex text-xs text-gray-600 dark:text-gray-400 justify-center">
                        <label className="relative cursor-pointer rounded-md font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus-within:outline-none">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlideImageChange(e.target.files[0])}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Selected Slide Image */}
            {slideImagePreview && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Image Preview
                </label>
                <div className="relative rounded-xl overflow-hidden shadow-sm max-w-xs border border-gray-150 dark:border-gray-700">
                  <img
                    src={slideImagePreview}
                    alt="Slide Preview"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full flex items-center gap-1 text-[10px]">
                    <Eye size={10} /> Preview
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={slideLoading}
                className="py-2.5 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md font-sans"
              >
                {slideLoading ? "Adding Slide..." : "Add Scheme Slide"}
              </button>
              {slideSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-450 font-bold animate-fadeIn">
                  ✓ {slideSuccess}
                </span>
              )}
              {slideError && (
                <span className="text-xs text-red-600 dark:text-red-400 font-bold animate-fadeIn">
                  ✗ {slideError}
                </span>
              )}
            </div>
          </form>

          {/* List of Existing Slides */}
          <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
              📁 Manage Current Slides ({slides.length})
            </h4>

            {slides.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                No slides uploaded yet. Add slides above to show them on the home page.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {slides.map((slide) => (
                  <div
                    key={slide.id}
                    className="flex flex-col bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow relative group transition duration-200"
                  >
                    <div className="h-32 overflow-hidden relative">
                      <img
                        src={slide.image}
                        alt={slide.description}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
                        }}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="absolute top-2 right-2 p-2 bg-red-650/90 hover:bg-red-750 text-white rounded-full transition shadow-md cursor-pointer opacity-90 hover:opacity-100"
                        title="Delete Slide"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2">
                        {slide.description || "No Description"}
                      </p>
                      {slide.link && (
                        <a
                          href={slide.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-red-500 hover:text-red-600 font-bold inline-flex items-center gap-1 truncate w-full"
                        >
                          <ExternalLink size={10} />
                          {slide.link}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
