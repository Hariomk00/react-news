import React, { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, where } from "firebase/firestore";
import { db } from "../../firebase";
import AdminLayout from "../../components/AdminLayout";
import { Plus, ToggleLeft, ToggleRight, Trash2, FolderPlus, ArrowLeft } from "lucide-react";

// URL friendly slug function matching the PHP regex pattern
const makeSlug = (string) => {
  return string
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Double click edit states
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setCategories(list);
    } catch (err) {
      console.error("Error loading categories:", err);
      setError(`Failed to load categories: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const name = newCatName.trim();
    const slug = makeSlug(name);

    if (name === "" || slug === "") {
      setError("Invalid category name.");
      return;
    }

    setBtnLoading(true);

    try {
      // Check duplicate slug
      const q = query(collection(db, "categories"), where("slug", "==", slug));
      const duplicateSnap = await getDocs(q);

      if (!duplicateSnap.empty) {
        setError("Category already exists.");
        setBtnLoading(false);
        return;
      }

      // Add to Firestore
      await addDoc(collection(db, "categories"), {
        name,
        slug,
        status: true,
        createdAt: new Date(),
      });

      setNewCatName("");
      setSuccess("Category added successfully.");
      fetchCategories();
    } catch (err) {
      console.error("Error adding category:", err);
      setError(`Failed to add category: ${err.message}`);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleToggleStatus = async (catId, currentStatus) => {
    setError("");
    setSuccess("");
    try {
      const catRef = doc(db, "categories", catId);
      await updateDoc(catRef, {
        status: !currentStatus,
      });
      setSuccess("Status updated successfully.");
      fetchCategories();
    } catch (err) {
      console.error("Error toggling category status:", err);
      setError(`Failed to toggle status: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Delete category? This might affect articles under it.")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const catRef = doc(db, "categories", catId);
      await deleteDoc(catRef);
      setSuccess("Category deleted successfully.");
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(`Failed to delete category: ${err.message}`);
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (catId, originalName) => {
    const trimmedName = editingName.trim();
    if (trimmedName === "") {
      setError("Category name cannot be empty.");
      handleCancelEdit();
      return;
    }

    if (trimmedName === originalName) {
      handleCancelEdit();
      return;
    }

    const newSlug = makeSlug(trimmedName);
    setError("");
    setSuccess("");

    try {
      // Check duplicate slug (excluding this category itself)
      const q = query(
        collection(db, "categories"),
        where("slug", "==", newSlug)
      );
      const duplicateSnap = await getDocs(q);
      const duplicateFound = duplicateSnap.docs.some(doc => doc.id !== catId);

      if (duplicateFound) {
        setError("Another category with this name already exists.");
        handleCancelEdit();
        return;
      }

      // Update in Firestore
      const catRef = doc(db, "categories", catId);
      await updateDoc(catRef, {
        name: trimmedName,
        slug: newSlug,
      });

      setSuccess("Category updated successfully.");
      fetchCategories();
    } catch (err) {
      console.error("Error updating category:", err);
      setError(`Failed to update category name: ${err.message}`);
    } finally {
      handleCancelEdit();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            🗂 Manage Categories
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create categories, toggle active status on main portal navigation, or delete them
          </p>
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

        {/* Add Category Form Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
            <FolderPlus size={18} className="text-red-500" />
            Add New Category
          </h3>
          <form onSubmit={handleAddCategory} className="flex gap-3">
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Technology, Health, Business"
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white sm:text-sm transition"
            />
            <button
              type="submit"
              disabled={btnLoading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition flex items-center gap-1 cursor-pointer sm:text-sm shadow-md"
            >
              <Plus size={16} />
              {btnLoading ? "Adding..." : "Add"}
            </button>
          </form>
        </div>

        {/* Categories Table Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Loading categories table...
            </div>
          ) : categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-150 dark:border-gray-700">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Slug</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-700">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/35 transition">
                      {editingId === c.id ? (
                        <td className="p-4">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleSaveEdit(c.id, c.name)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit(c.id, c.name);
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            autoFocus
                            className="px-3 py-1.5 border border-red-500 rounded-xl bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-white text-sm font-bold w-full max-w-xs transition font-sans"
                          />
                        </td>
                      ) : (
                        <td
                          className="p-4 font-bold text-gray-900 dark:text-white cursor-pointer select-none group"
                          onDoubleClick={() => handleStartEdit(c)}
                          title="Double-click to edit name"
                        >
                          <span className="border-b border-dashed border-transparent group-hover:border-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500 transition-all">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 font-normal">
                            (double-click to edit)
                          </span>
                        </td>
                      )}
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-450 font-mono">{c.slug}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            c.status
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-450"
                              : "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400"
                          }`}
                        >
                          {c.status ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(c.id, c.status)}
                          className={`p-2 rounded-lg transition cursor-pointer ${
                            c.status
                              ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                              : "text-gray-450 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
                          }`}
                          title="Toggle Status"
                        >
                          {c.status ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No categories found. Create one above!
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManageCategories;
