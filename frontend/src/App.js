import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Income from "@/pages/Income";
import Expenses from "@/pages/Expenses";
import Categories from "@/pages/Categories";
import Debts from "@/pages/Debts";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { Wallet, TrendingUp, TrendingDown, Layers, CreditCard } from "lucide-react";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="app-container">
          <nav className="sidebar" data-testid="sidebar-nav">
            <div className="logo-section">
              <Wallet className="logo-icon" />
              <h1 className="logo-text">BudgetFlow</h1>
            </div>
            
            <div className="nav-links">
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} data-testid="nav-dashboard">
                <Wallet size={20} />
                <span>Dashboard</span>
              </NavLink>
              
              <NavLink to="/income" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} data-testid="nav-income">
                <TrendingUp size={20} />
                <span>Gelirler</span>
              </NavLink>
              
              <NavLink to="/expenses" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} data-testid="nav-expenses">
                <TrendingDown size={20} />
                <span>Giderler</span>
              </NavLink>
              
              <NavLink to="/categories" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} data-testid="nav-categories">
                <Layers size={20} />
                <span>Kategoriler</span>
              </NavLink>
              
              <NavLink to="/debts" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} data-testid="nav-debts">
                <CreditCard size={20} />
                <span>Borçlar</span>
              </NavLink>
            </div>
            
            <div className="sidebar-footer">
              <div className="version-badge">v1.0</div>
            </div>
          </nav>
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/income" element={<Income />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/debts" element={<Debts />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
