import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase";
import AdminLayout from "../../components/AdminLayout";
import { ArrowLeft, Save, Upload, Eye, Sparkles, RefreshCw } from "lucide-react";

// Helper function to strip basic markdown tags for clean plaintext presentation
const cleanMarkdownToPlainText = (markdown) => {
  if (!markdown) return "";
  
  let text = markdown;
  
  text = text
    // Remove inline links: [Link text](url) -> Link text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    // Keep image links intact for dynamic rendering
    // .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Remove ATX-style headers: ### title -> title
    .replace(/^(#+)\s+(.*)$/gm, "$2")
    // Remove Setext-style headers: title\n=== -> title
    .replace(/^([^\n]+)\n[=-]+\s*$/gm, "$1")
    // Remove bold/italic markup
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove blockquotes syntax: "> Quote" -> "Quote"
    .replace(/^\s*>\s+/gm, "")
    // Remove horizontal rules: --- or ***
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    // Remove bullet points symbols from the start of lines but keep the list text
    .replace(/^\s*[-*+]\s+/gm, "• ")
    // Clean up excessive empty lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
    
  return text;
};

// Helper function to compress and convert image files to base64 Data URIs
const compressAndConvertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Define max dimensions (e.g., 800px width/height)
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

const AddEditNews = () => {
  const { id } = useParams(); // If present, we are editing
  const isEdit = !!id;
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullContent, setFullContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [imageType, setImageType] = useState("upload"); // "upload" or "url"
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sourceUrl, setSourceUrl] = useState("");
  const [fetchingFullContent, setFetchingFullContent] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Function to manually extract full content from a URL
  const fetchFullContent = async (urlToFetch) => {
    const targetUrl = urlToFetch || sourceUrl;
    if (!targetUrl) return;

    setFetchingFullContent(true);
    setFetchError("");
    try {
      const response = await fetch(`https://r.jina.ai/${targetUrl.trim()}`, {
        headers: {
          "Accept": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to extract article (status: ${response.status})`);
      }
      
      const result = await response.json();
      if (result && result.data && result.data.content) {
        const cleanedText = cleanMarkdownToPlainText(result.data.content);
        
        // Auto-fill form fields from extracted Jina metadata if currently empty
        if (!title.trim() && result.data.title) {
          setTitle(result.data.title);
        }
        if (!shortDesc.trim() && result.data.description) {
          setShortDesc(result.data.description);
        }
        
        // Append source attribution footer (plain text)
        const authorInfo = location.state?.prefilledNews?.author || "Original Source";
        const finalContent = `${cleanedText}\n\n---\nSource: ${authorInfo} - Read full article: ${targetUrl}`;
        setFullContent(finalContent);
      } else {
        throw new Error("No readable content returned from extraction service.");
      }
    } catch (err) {
      console.error("Error fetching full text:", err);
      setFetchError(err.message || "Failed to extract article content.");
    } finally {
      setFetchingFullContent(false);
    }
  };

  useEffect(() => {
    // 1. Fetch active categories for dropdown
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, "categories"), where("status", "==", true));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCategories(list);
      } catch (err) {
        console.error("Error loading categories:", err);
        setError("Failed to load category list.");
      }
    };
    fetchCategories();

    // Prefill form details if passed via navigation state (from Import page)
    if (!isEdit && location.state?.prefilledNews) {
      const { title, short_desc, full_content, image, url } = location.state.prefilledNews;
      setTitle(title || "");
      setShortDesc(short_desc || "");
      setFullContent(full_content || "");
      if (image) {
        setImageType("url");
        setImageUrl(image);
      }
      if (url) {
        setSourceUrl(url);
        // Auto-fetch full text from URL
        const autoFetch = async () => {
          setFetchingFullContent(true);
          setFetchError("");
          try {
            const response = await fetch(`https://r.jina.ai/${url.trim()}`, {
              headers: { "Accept": "application/json" }
            });
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const result = await response.json();
            if (result?.data?.content) {
              const cleanedText = cleanMarkdownToPlainText(result.data.content);
              const authorInfo = location.state?.prefilledNews?.author || "Original Source";
              setFullContent(`${cleanedText}\n\n---\nSource: ${authorInfo} - Read full article: ${url}`);
            }
          } catch (err) {
            console.error("Auto-fetch error:", err);
            setFetchError("Failed to auto-extract full content.");
          } finally {
            setFetchingFullContent(false);
          }
        };
        autoFetch();
      }
    }

    // 2. Fetch news data if editing
    if (isEdit) {
      const fetchNewsDetails = async () => {
        try {
          const docRef = doc(db, "news", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setTitle(data.title || "");
            setShortDesc(data.short_desc || "");
            setFullContent(data.full_content || "");
            setCategoryId(data.category_id || "");
            setExistingImageUrl(data.image || "");
            setSourceUrl(data.source_url || "");
            if (data.image && !data.image.includes("firebasestorage.googleapis.com")) {
              setImageType("url");
              setImageUrl(data.image);
            } else {
              setImageType("upload");
            }
          } else {
            setError("News article not found.");
          }
        } catch (err) {
          console.error("Error loading news article details:", err);
          setError("Failed to load news details.");
        } finally {
          setPageLoading(false);
        }
      };
      fetchNewsDetails();
    }
  }, [id, isEdit]);

  // Sync image preview reactively based on image type and selections
  useEffect(() => {
    let objectUrl = "";
    if (imageType === "upload") {
      if (imageFile) {
        objectUrl = URL.createObjectURL(imageFile);
        setImagePreview(objectUrl);
      } else {
        setImagePreview(existingImageUrl);
      }
    } else {
      setImagePreview(imageUrl || existingImageUrl);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageType, imageFile, imageUrl, existingImageUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (categoryId === "") {
      setError("Please select a category.");
      setLoading(false);
      return;
    }

    try {
      let finalImageUrl = existingImageUrl;

      if (imageType === "upload") {
        // 1. Upload new image if selected
        if (imageFile) {
          // If editing and we have an existing storage image, we delete the old one first
          if (isEdit && existingImageUrl && existingImageUrl.startsWith("http") && existingImageUrl.includes("firebasestorage.googleapis.com")) {
            try {
              const oldImageRef = ref(storage, existingImageUrl);
              await deleteObject(oldImageRef);
            } catch (storageErr) {
              console.warn("Failed to delete old image from storage:", storageErr);
              // Non-blocking, continue uploading the new image
            }
          }

          try {
            finalImageUrl = await compressAndConvertToBase64(imageFile);
          } catch (compressErr) {
            console.error("Failed to process image:", compressErr);
            setError("Failed to process and compress the uploaded image. Please try a different image.");
            setLoading(false);
            return;
          }
        }
      } else {
        // Use direct image URL
        finalImageUrl = imageUrl.trim();
      }

      if (!finalImageUrl && !isEdit) {
        setError("Please upload an image or provide an image URL.");
        setLoading(false);
        return;
      }

      const newsData = {
        title,
        short_desc: shortDesc,
        full_content: fullContent,
        category_id: categoryId,
        image: finalImageUrl,
        source_url: sourceUrl.trim() || "",
      };

      // 2. Add or update doc in Firestore
      if (isEdit) {
        const docRef = doc(db, "news", id);
        await updateDoc(docRef, {
          ...newsData,
          updatedAt: new Date(),
        });
        setSuccess("News updated successfully!");
      } else {
        await addDoc(collection(db, "news"), {
          ...newsData,
          createdAt: new Date(),
        });
        setSuccess("News published successfully!");
        // Clear fields on success for new publication
        setTitle("");
        setShortDesc("");
        setFullContent("");
        setCategoryId("");
        setImageFile(null);
        setImageUrl("");
        setImagePreview("");
        setSourceUrl("");
        setFetchError("");
      }

      // Redirect back to manage news list after delay
      setTimeout(() => {
        navigate("/admin/manage-news");
      }, 1500);
    } catch (err) {
      console.error("Error saving news article:", err);
      setError("An error occurred while saving the news article.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Navigation Back */}
        <Link
          to="/admin/manage-news"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition"
        >
          <ArrowLeft size={16} />
          Back to Manage News
        </Link>

        {/* Header */}
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {isEdit ? "✏️ Edit News" : "➕ Add News"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEdit ? "Update news article information and image" : "Publish a new article to the site"}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-100/55 dark:border-red-950/30 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 p-3 rounded-xl border border-emerald-100/55 dark:border-emerald-950/30 text-sm">
            {success}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                News Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a compelling title..."
                className="mt-1 block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition"
              />
            </div>

            {/* Short Desc */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Short Description
              </label>
              <textarea
                required
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Write a brief intro..."
                rows={3}
                className="mt-1 block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition resize-none"
              />
            </div>

            {/* Source URL (For importing/extracting full content) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Source Article URL (Optional)
                </label>
                {sourceUrl && (
                  <button
                    type="button"
                    onClick={() => fetchFullContent(sourceUrl)}
                    disabled={fetchingFullContent}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles size={14} className={fetchingFullContent ? "animate-pulse" : ""} />
                    {fetchingFullContent ? "Extracting..." : "Auto-Extract Content"}
                  </button>
                )}
              </div>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/news-article-url"
                className="mt-1 block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Pasting a URL allows you to automatically extract and format the full article body.
              </p>
            </div>

            {/* Full News Content */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Full News Content
                </label>
                {fetchingFullContent && (
                  <span className="text-xs font-bold text-amber-500 dark:text-amber-400 animate-pulse flex items-center gap-1">
                    <RefreshCw size={12} className="animate-spin" />
                    Extracting full article narration...
                  </span>
                )}
                {fetchError && (
                  <span className="text-xs font-bold text-red-500 dark:text-red-400">
                    ⚠️ {fetchError}
                  </span>
                )}
              </div>
              <textarea
                required
                value={fullContent}
                onChange={(e) => setFullContent(e.target.value)}
                placeholder={fetchingFullContent ? "Fetching and writing article body from URL... Please wait." : "Write the complete news article details here..."}
                disabled={fetchingFullContent}
                rows={10}
                className={`mt-1 block w-full px-4 py-2.5 border rounded-xl sm:text-sm transition resize-y ${
                  fetchingFullContent
                    ? "bg-gray-100 dark:bg-gray-800 border-amber-300 animate-pulse text-gray-400 dark:text-gray-500"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                }`}
              />
            </div>

            {/* Category Select Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Select Category
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Source Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Image Source
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl max-w-xs border border-gray-200 dark:border-gray-750">
                <button
                  type="button"
                  onClick={() => setImageType("upload")}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    imageType === "upload"
                      ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageType("url")}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    imageType === "url"
                      ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {/* Image Input field based on source selection */}
            {imageType === "upload" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Upload Image File
                </label>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-900">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                      <label className="relative cursor-pointer rounded-md font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          required={!isEdit && !existingImageUrl}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Image URL
                </label>
                <input
                  type="url"
                  required={!isEdit && !existingImageUrl}
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg or /AA1wQy2w.jpeg"
                  className="mt-1 block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition"
                />
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Image Preview
                </label>
                <div className="relative rounded-xl overflow-hidden shadow-md max-w-sm border border-gray-150 dark:border-gray-700">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";
                    }}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full flex items-center gap-1 text-xs">
                    <Eye size={12} /> Live Preview
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-sm"
            >
              <Save size={18} />
              {loading ? "Saving news article..." : isEdit ? "Update News" : "Publish News"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddEditNews;
