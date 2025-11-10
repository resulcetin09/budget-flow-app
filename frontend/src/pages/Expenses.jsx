import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState({ amount: "", description: "", categoryId: "", date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API}/expenses`);
      setExpenses(res.data);
    } catch (error) {
      toast.error("Giderler yüklenemedi");
    }
  };

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
      const data = {
        ...form,
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString()
      };

      if (editingExpense) {
        await axios.put(`${API}/expenses/${editingExpense.id}`, data);
        toast.success("Gider güncellendi");
      } else {
        await axios.post(`${API}/expenses`, data);
        toast.success("Gider eklendi");
      }

      setShowModal(false);
      setEditingExpense(null);
      setForm({ amount: "", description: "", categoryId: "", date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (error) {
      toast.error(editingExpense ? "Gider güncellenemedi" : "Gider eklenemedi");
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setForm({
      amount: expense.amount.toString(),
      description: expense.description,
      categoryId: expense.categoryId,
      date: new Date(expense.date).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu gideri silmek istediğinizden emin misiniz?")) return;
    
    try {
      await axios.delete(`${API}/expenses/${id}`);
      toast.success("Gider silindi");
      fetchExpenses();
    } catch (error) {
      toast.error("Gider silinemedi");
    }
  };

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="expenses-page fade-in" data-testid="expenses-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Giderler</h1>
          <p className="page-subtitle">Tüm gider kayıtlarınızı yönetin</p>
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingExpense(null);
            setForm({ amount: "", description: "", categoryId: "", date: new Date().toISOString().split('T')[0] });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="btn-add-expense">
              <Plus size={20} /> Yeni Gider Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121214] border-[#d4af37]/20">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#d4af37]">
                {editingExpense ? "Gider Düzenle" : "Yeni Gider Ekle"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  data-testid="input-expense-amount"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  data-testid="input-expense-description"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <Select value={form.categoryId} onValueChange={(value) => setForm({ ...form, categoryId: value })}>
                  <SelectTrigger className="form-input" data-testid="select-expense-category">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-[#d4af37]/20">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-group">
                <label className="form-label">Tarih</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  data-testid="input-expense-date"
                />
              </div>
              <Button type="submit" className="w-full btn-primary" data-testid="btn-submit-expense">
                {editingExpense ? "Güncelle" : "Ekle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card mb-6" data-testid="total-expense-card">
        <h3 className="text-lg font-semibold text-gray-400 mb-2">Toplam Gider</h3>
        <p className="text-4xl font-bold text-red-400">{totalExpense.toFixed(2)} ₺</p>
      </div>

      <div className="glass-card">
        <table className="data-table" data-testid="expense-table">
          <thead>
            <tr>
              <th>Tutar</th>
              <th>Açıklama</th>
              <th>Kategori</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">Henüz gider kaydı bulunmuyor</td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} data-testid={`expense-row-${expense.id}`}>
                  <td className="font-semibold text-red-400">{expense.amount.toFixed(2)} ₺</td>
                  <td>{expense.description}</td>
                  <td>
                    <span className="badge badge-info">{expense.categoryName || 'Unknown'}</span>
                  </td>
                  <td>{new Date(expense.date).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 hover:bg-[#d4af37]/10 rounded transition"
                        data-testid={`btn-edit-expense-${expense.id}`}
                      >
                        <Edit size={18} className="text-[#d4af37]" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 hover:bg-red-500/10 rounded transition"
                        data-testid={`btn-delete-expense-${expense.id}`}
                      >
                        <Trash2 size={18} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
