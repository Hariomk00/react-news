import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase";
import AdminLayout from "../../components/AdminLayout";
import { Edit, Trash2, Plus, Calendar, AlertTriangle } from "lucide-react";

const ManageNews = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnapshot) => {
        list.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });
      setNewsList(list);
    } catch (err) {
      console.error("Error loading news list:", err);
      setError("Failed to load news articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const openDeleteConfirm = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteId(null);
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Get the news doc to find the image URL
      const newsDocRef = doc(db, "news", deleteId);
      const newsDocSnap = await getDoc(newsDocRef);

      if (newsDocSnap.exists()) {
        const newsData = newsDocSnap.data();
        const imageUrl = newsData.image;

        // 2. Delete the image from Firebase Storage if it's a firebase url
        if (imageUrl && imageUrl.startsWith("http")) {
          try {
            const imageStorageRef = ref(storage, imageUrl);
            await deleteObject(imageStorageRef);
          } catch (storageErr) {
            console.error("Failed to delete image from Firebase Storage:", storageErr);
            // We proceed to delete document anyway
          }
        }
      }

      // 3. Delete from Firestore
      await deleteDoc(newsDocRef);

      setSuccess("News article deleted successfully.");
      closeDeleteConfirm();
      fetchNews();
    } catch (err) {
      console.error("Error deleting news article:", err);
      setError("Failed to delete the article.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper to format date
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
    <AdminLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              📰 Manage News
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Publish new articles, update existing ones, or delete them
            </p>
          </div>
          <Link
            to="/admin/add-news"
            className="w-fit flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl transition gap-1.5 shadow-md text-sm cursor-pointer"
          >
            <Plus size={18} />
            Publish Article
          </Link>
        </div>

        {/* Message Notifications */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-950/30 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 p-3 rounded-xl border border-emerald-100 dark:border-emerald-950/30 text-sm">
            {success}
          </div>
        )}

        {/* News Table Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Loading news articles table...
            </div>
          ) : newsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-150 dark:border-gray-700">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">ID</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Image</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Title</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-700">
                  {newsList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/35 transition">
                      <td className="p-4 text-sm font-mono text-gray-450">{item.id.slice(0, 8)}...</td>
                      <td className="p-4">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-14 h-10 object-cover rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-14 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400">
                            No Img
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-gray-900 dark:text-white line-clamp-2 mt-1">
                        {item.title}
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          {formatDate(item.createdAt)}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/edit-news/${item.id}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition inline-block"
                            title="Edit News"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => openDeleteConfirm(item.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition cursor-pointer"
                            title="Delete News"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-gray-400 dark:text-gray-500">
              No news articles published. Click "Publish Article" to add one!
            </div>
          )}
        </div>
      </div>

      {/* Legacy inspired Animated Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700 animate-scaleIn text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
              Delete News?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure? This action cannot be undone, and the associated image file will also be permanently deleted.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={closeDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-md"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageNews;
