import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [payingDebt, setPayingDebt] = useState(null);
  const [form, setForm] = useState({ name: "", totalAmount: "", dueDate: "" });
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const res = await axios.get(`${API}/debts`);
      setDebts(res.data);
    } catch (error) {
      toast.error("Borçlar yüklenemedi");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: form.name,
        totalAmount: parseFloat(form.totalAmount),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null
      };

      if (editingDebt) {
        await axios.put(`${API}/debts/${editingDebt.id}`, data);
        toast.success("Borç güncellendi");
      } else {
        await axios.post(`${API}/debts`, data);
        toast.success("Borç eklendi");
      }

      setShowModal(false);
      setEditingDebt(null);
      setForm({ name: "", totalAmount: "", dueDate: "" });
      fetchDebts();
    } catch (error) {
      toast.error(editingDebt ? "Borç güncellenemedi" : "Borç eklenemedi");
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API}/debts/${payingDebt.id}/pay`, {
        amount: parseFloat(paymentAmount)
      });
      toast.success("Ödeme yapıldı");
      setShowPaymentModal(false);
      setPayingDebt(null);
      setPaymentAmount("");
      fetchDebts();
    } catch (error) {
      toast.error("Ödeme yapılamadı");
    }
  };

  const handleEdit = (debt) => {
    setEditingDebt(debt);
    setForm({
      name: debt.name,
      totalAmount: debt.totalAmount.toString(),
      dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu borcu silmek istediğinizden emin misiniz?")) return;
    
    try {
      await axios.delete(`${API}/debts/${id}`);
      toast.success("Borç silindi");
      fetchDebts();
    } catch (error) {
      toast.error("Borç silinemedi");
    }
  };

  const openPaymentModal = (debt) => {
    setPayingDebt(debt);
    setPaymentAmount("");
    setShowPaymentModal(true);
  };

  const totalActiveDebt = debts
    .filter(d => d.status === "Aktif")
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

  return (
    <div className="debts-page fade-in" data-testid="debts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Borçlar</h1>
          <p className="page-subtitle">Borç kayıtlarınızı ve ödemelerinizi yönetin</p>
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingDebt(null);
            setForm({ name: "", totalAmount: "", dueDate: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="btn-add-debt">
              <Plus size={20} /> Yeni Borç Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121214] border-[#d4af37]/20">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#d4af37]">
                {editingDebt ? "Borç Düzenle" : "Yeni Borç Ekle"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Borç Adı</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  data-testid="input-debt-name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Toplam Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                  required
                  data-testid="input-debt-amount"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vade Tarihi (Opsiyonel)</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  data-testid="input-debt-duedate"
                />
              </div>
              <Button type="submit" className="w-full btn-primary" data-testid="btn-submit-debt">
                {editingDebt ? "Güncelle" : "Ekle"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card mb-6" data-testid="total-debt-card">
        <h3 className="text-lg font-semibold text-gray-400 mb-2">Toplam Aktif Borç</h3>
        <p className="text-4xl font-bold text-orange-400">{totalActiveDebt.toFixed(2)} ₺</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="debts-grid">
        {debts.length === 0 ? (
          <div className="col-span-full glass-card text-center py-12">
            <p className="text-gray-500">Henüz borç kaydı bulunmuyor</p>
          </div>
        ) : (
          debts.map((debt) => {
            const remaining = debt.totalAmount - debt.paidAmount;
            const percentage = (debt.paidAmount / debt.totalAmount) * 100;

            return (
              <div key={debt.id} className="glass-card" data-testid={`debt-card-${debt.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-200">{debt.name}</h3>
                    <span className={`badge ${debt.status === 'Ödendi' ? 'badge-success' : 'badge-warning'}`}>
                      {debt.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(debt)}
                      className="p-2 hover:bg-[#d4af37]/10 rounded transition"
                      data-testid={`btn-edit-debt-${debt.id}`}
                    >
                      <Edit size={18} className="text-[#d4af37]" />
                    </button>
                    <button
                      onClick={() => handleDelete(debt.id)}
                      className="p-2 hover:bg-red-500/10 rounded transition"
                      data-testid={`btn-delete-debt-${debt.id}`}
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Toplam Borç:</span>
                    <span className="font-semibold text-gray-200">{debt.totalAmount.toFixed(2)} ₺</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Ödenen:</span>
                    <span className="font-semibold text-green-400">{debt.paidAmount.toFixed(2)} ₺</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Kalan:</span>
                    <span className="font-semibold text-orange-400">{remaining.toFixed(2)} ₺</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-[#d4af37] to-[#ffd700] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center">{percentage.toFixed(0)}% ödendi</p>

                  {debt.dueDate && (
                    <div className="text-xs text-gray-500 mt-2">
                      Vade: {new Date(debt.dueDate).toLocaleDateString('tr-TR')}
                    </div>
                  )}

                  {debt.status === "Aktif" && (
                    <Button
                      onClick={() => openPaymentModal(debt)}
                      className="w-full btn-secondary mt-4"
                      data-testid={`btn-pay-debt-${debt.id}`}
                    >
                      <DollarSign size={18} /> Ödeme Yap
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="bg-[#121214] border-[#d4af37]/20">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#d4af37]">Ödeme Yap</DialogTitle>
          </DialogHeader>
          {payingDebt && (
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Borç: {payingDebt.name}</p>
                <p className="text-sm text-gray-400">Kalan: {(payingDebt.totalAmount - payingDebt.paidAmount).toFixed(2)} ₺</p>
              </div>
              <div className="form-group">
                <label className="form-label">Ödeme Tutarı (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  data-testid="input-payment-amount"
                />
              </div>
              <Button type="submit" className="w-full btn-primary" data-testid="btn-submit-payment">
                Ödeme Yap
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
