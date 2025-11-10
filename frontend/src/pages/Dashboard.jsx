import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown, Wallet, CreditCard } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#d4af37', '#ffd700', '#c0c0c0', '#b8860b', '#daa520', '#f0e68c'];

export default function Dashboard() {
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0, totalActiveDebt: 0 });
  const [period, setPeriod] = useState("monthly");
  const [chartData, setChartData] = useState({ barData: [], pieData: [] });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [incomeForm, setIncomeForm] = useState({ amount: "", source: "", type: "Aylık Sabit", date: new Date().toISOString().split('T')[0] });
  const [expenseForm, setExpenseForm] = useState({ amount: "", description: "", categoryId: "", date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchDashboardData();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpensesAnalysis();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/dashboard/summary`),
        axios.get(`${API}/dashboard/recent-transactions`)
      ]);
      setSummary(summaryRes.data);
      setRecentTransactions(transactionsRes.data);
    } catch (error) {
      toast.error("Dashboard verileri yüklenemedi");
    }
  };

  const fetchExpensesAnalysis = async () => {
    try {
      const res = await axios.get(`${API}/dashboard/expenses-analysis?period=${period}`);
      setChartData(res.data);
    } catch (error) {
      toast.error("Harcama analizi yüklenemedi");
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

  const handleAddIncome = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/income`, {
        ...incomeForm,
        amount: parseFloat(incomeForm.amount),
        date: new Date(incomeForm.date).toISOString()
      });
      toast.success("Gelir başarıyla eklendi");
      setShowIncomeModal(false);
      setIncomeForm({ amount: "", source: "", type: "Aylık Sabit", date: new Date().toISOString().split('T')[0] });
      fetchDashboardData();
      fetchExpensesAnalysis();
    } catch (error) {
      toast.error("Gelir eklenemedi");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses`, {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        date: new Date(expenseForm.date).toISOString()
      });
      toast.success("Gider başarıyla eklendi");
      setShowExpenseModal(false);
      setExpenseForm({ amount: "", description: "", categoryId: "", date: new Date().toISOString().split('T')[0] });
      fetchDashboardData();
      fetchExpensesAnalysis();
    } catch (error) {
      toast.error("Gider eklenemedi");
    }
  };

  return (
    <div className="dashboard-page fade-in" data-testid="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Finansal durumunuzun genel görünümü</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card" data-testid="card-total-income">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Bu Aylık Toplam Gelir</span>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-400">{summary.totalIncome.toFixed(2)} ₺</div>
        </div>

        <div className="glass-card" data-testid="card-total-expense">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Bu Aylık Toplam Gider</span>
            <TrendingDown className="text-red-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-red-400">{summary.totalExpense.toFixed(2)} ₺</div>
        </div>

        <div className="glass-card" data-testid="card-net-balance">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Net Bakiye</span>
            <Wallet className="text-yellow-500" size={20} />
          </div>
          <div className={`text-3xl font-bold ${summary.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {summary.netBalance.toFixed(2)} ₺
          </div>
        </div>

        <div className="glass-card" data-testid="card-total-debt">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Toplam Aktif Borç</span>
            <CreditCard className="text-orange-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-orange-400">{summary.totalActiveDebt.toFixed(2)} ₺</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-8">
        <Dialog open={showIncomeModal} onOpenChange={setShowIncomeModal}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="btn-quick-add-income">
              <Plus size={20} /> Hızlı Gelir Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121214] border-[#d4af37]/20">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#d4af37]">Yeni Gelir Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  required
                  data-testid="input-income-amount"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kaynak</label>
                <input
                  type="text"
                  className="form-input"
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  required
                  data-testid="input-income-source"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tür</label>
                <Select value={incomeForm.type} onValueChange={(value) => setIncomeForm({ ...incomeForm, type: value })}>
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
                  value={incomeForm.date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  required
                  data-testid="input-income-date"
                />
              </div>
              <Button type="submit" className="w-full btn-primary" data-testid="btn-submit-income">
                Gelir Ekle
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
          <DialogTrigger asChild>
            <Button className="btn-secondary" data-testid="btn-quick-add-expense">
              <Plus size={20} /> Hızlı Gider Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121214] border-[#d4af37]/20">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#d4af37]">Yeni Gider Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                  data-testid="input-expense-amount"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <input
                  type="text"
                  className="form-input"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  required
                  data-testid="input-expense-description"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <Select value={expenseForm.categoryId} onValueChange={(value) => setExpenseForm({ ...expenseForm, categoryId: value })}>
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
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
                  data-testid="input-expense-date"
                />
              </div>
              <Button type="submit" className="w-full btn-primary" data-testid="btn-submit-expense">
                Gider Ekle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-200">Harcama Raporu</h2>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg transition ${period === 'daily' ? 'bg-[#d4af37] text-black' : 'bg-[#d4af37]/10 text-[#d4af37]'}`}
              onClick={() => setPeriod('daily')}
              data-testid="btn-filter-daily"
            >
              Günlük
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition ${period === 'weekly' ? 'bg-[#d4af37] text-black' : 'bg-[#d4af37]/10 text-[#d4af37]'}`}
              onClick={() => setPeriod('weekly')}
              data-testid="btn-filter-weekly"
            >
              Haftalık
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition ${period === 'monthly' ? 'bg-[#d4af37] text-black' : 'bg-[#d4af37]/10 text-[#d4af37]'}`}
              onClick={() => setPeriod('monthly')}
              data-testid="btn-filter-monthly"
            >
              Aylık
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card" data-testid="chart-bar-container">
            <h3 className="text-lg font-semibold mb-4 text-[#d4af37]">Harcama Trendi</h3>
            {chartData.barData && chartData.barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#888"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1c', 
                      border: '1px solid #d4af37',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                    labelStyle={{ color: '#d4af37' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => [`${value.toFixed(2)} ₺`, 'Tutar']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#d4af37" 
                    strokeWidth={3}
                    dot={{ fill: '#ffd700', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p>Bu dönemde harcama bulunmuyor</p>
              </div>
            )}
          </div>

          <div className="glass-card" data-testid="chart-pie-container">
            <h3 className="text-lg font-semibold mb-4 text-[#d4af37]">Kategoriye Göre Dağılım</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid #d4af37' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card" data-testid="recent-transactions-container">
        <h2 className="text-2xl font-bold text-gray-200 mb-4">Son İşlemler</h2>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Henüz işlem bulunmuyor</p>
          ) : (
            recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-[#1a1a1c]/50 rounded-lg hover:bg-[#d4af37]/5 transition" data-testid={`transaction-${index}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {transaction.type === 'income' ? <TrendingUp className="text-green-400" size={20} /> : <TrendingDown className="text-red-400" size={20} />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-200">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{transaction.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)} ₺
                  </p>
                  <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
