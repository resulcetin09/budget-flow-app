import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Income() {
  const [incomes, setIncomes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [form, setForm] = useState({ amount: "", source: "", type: "Aylık Sabit", date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      const res = await axios.get(`${API}/income`);
      setIncomes(res.data);
    } catch (error) {
      toast.error("Gelirler yüklenemedi");
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

      if (editingIncome) {
        await axios.put(`${API}/income/${editingIncome.id}`, data);
        toast.success("Gelir güncellendi");
      } else {
        await axios.post(`${API}/income`, data);
        toast.success("Gelir eklendi");
      }

      setShowModal(false);
      setEditingIncome(null);
      setForm({ amount: "", source: "", type: "Aylık Sabit", date: new Date().toISOString().split('T')[0] });
      fetchIncomes();
    } catch (error) {
      toast.error(editingIncome ? "Gelir güncellenemedi" : "Gelir eklenemedi");
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setForm({
      amount: income.amount.toString(),
      source: income.source,
      type: income.type,
      date: new Date(income.date).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu geliri silmek istediğinizden emin misiniz?")) return;
    
    try {
      await axios.delete(`${API}/income/${id}`);
      toast.success("Gelir silindi");
      fetchIncomes();
    } catch (error) {
      toast.error("Gelir silinemedi");
    }
  };

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="income-page fade-in" data-testid="income-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gelirler</h1>
          <p className="page-subtitle">Tüm gelir kayıtlarınızı yönetin</p>
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingIncome(null);
            setForm({ amount: "", source: "", type: "Aylık Sabit", date: new Date().toISOString().split('T')[0] });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="btn-add-income">
              <Plus size={20} /> Yeni Gelir Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121214] border-[#d4af37]/20">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#d4af37]">
                {editingIncome ? "Gelir Düzenle" : "Yeni Gelir Ekle"}
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
                  data-testid="input-income-amount"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kaynak</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  required
                  data-testid="input-income-source"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tür</label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                  <SelectTrigger className="form-input" data-testid="select-income-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-[#d4af37]/20">
                    <SelectItem value="Aylık Sabit">Aylık Sabit</SelectItem>
                    <SelectItem value="Ek Gelir">Ek Gelir</SelectItem>
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
                  data-testid="input-income-date"
                />
              </div>
              <Button type="submit" className="w-full btn-primary" data-testid="btn-submit-income">
                {editingIncome ? "Güncelle" : "Ekle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card mb-6" data-testid="total-income-card">
        <h3 className="text-lg font-semibold text-gray-400 mb-2">Toplam Gelir</h3>
        <p className="text-4xl font-bold text-green-400">{totalIncome.toFixed(2)} ₺</p>
      </div>

      <div className="glass-card">
        <table className="data-table" data-testid="income-table">
          <thead>
            <tr>
              <th>Tutar</th>
              <th>Kaynak</th>
              <th>Tür</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {incomes.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">Henüz gelir kaydı bulunmuyor</td>
              </tr>
            ) : (
              incomes.map((income) => (
                <tr key={income.id} data-testid={`income-row-${income.id}`}>
                  <td className="font-semibold text-green-400">{income.amount.toFixed(2)} ₺</td>
                  <td>{income.source}</td>
                  <td>
                    <span className={`badge ${income.type === 'Aylık Sabit' ? 'badge-success' : 'badge-info'}`}>
                      {income.type}
                    </span>
                  </td>
                  <td>{new Date(income.date).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(income)}
                        className="p-2 hover:bg-[#d4af37]/10 rounded transition"
                        data-testid={`btn-edit-income-${income.id}`}
                      >
                        <Edit size={18} className="text-[#d4af37]" />
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="p-2 hover:bg-red-500/10 rounded transition"
                        data-testid={`btn-delete-income-${income.id}`}
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
