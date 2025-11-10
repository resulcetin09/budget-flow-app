import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data);
    } catch (error) {
      toast.error("Kategoriler yüklenemedi");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory.id}`, form);
        toast.success("Kategori güncellendi");
      } else {
        await axios.post(`${API}/categories`, form);
        toast.success("Kategori eklendi");
      }

      setShowModal(false);
      setEditingCategory(null);
      setForm({ name: "" });
      fetchCategories();
    } catch (error) {
      toast.error(editingCategory ? "Kategori güncellenemedi" : "Kategori eklenemedi");
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setForm({ name: category.name });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;
    
    try {
      await axios.delete(`${API}/categories/${id}`);
      toast.success("Kategori silindi");
      fetchCategories();
    } catch (error) {
      toast.error("Kategori silinemedi");
    }
  };

  return (
    <div className="categories-page fade-in" data-testid="categories-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategoriler</h1>
          <p className="page-subtitle">Gider kategorilerinizi yönetin</p>
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingCategory(null);
            setForm({ name: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="btn-add-category">
              <Plus size={20} /> Yeni Kategori Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121214] border-[#d4af37]/20">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#d4af37]">
                {editingCategory ? "Kategori Düzenle" : "Yeni Kategori Ekle"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Kategori Adı</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  data-testid="input-category-name"
                />
              </div>
              <Button type="submit" className="w-full btn-primary" data-testid="btn-submit-category">
                {editingCategory ? "Güncelle" : "Ekle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="categories-grid">
        {categories.length === 0 ? (
          <div className="col-span-full glass-card text-center py-12">
            <p className="text-gray-500">Henüz kategori bulunmuyor</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="glass-card" data-testid={`category-card-${category.id}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-200">{category.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 hover:bg-[#d4af37]/10 rounded transition"
                    data-testid={`btn-edit-category-${category.id}`}
                  >
                    <Edit size={18} className="text-[#d4af37]" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 hover:bg-red-500/10 rounded transition"
                    data-testid={`btn-delete-category-${category.id}`}
                  >
                    <Trash2 size={18} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
