import React, { useState } from 'react';
import { ViewState, Theme } from '../types';
import { 
  LayoutDashboard, Target, Headset, Banknote, CalendarDays, 
  Bell, Upload, Menu, X, LogOut, RefreshCw, CalendarRange, FileClock, Users, Settings
} from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onReset: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
  theme: Theme;
}

const NavItem = ({ view, current, label, icon: Icon, onClick }: any) => (
  <button
    onClick={() => onClick(view)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      current === view 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, onReset, onRefresh, isLoading = false, children, theme }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const headerClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textClass = isDark ? 'text-slate-100' : 'text-slate-800';
  const subTextClass = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`flex h-screen overflow-hidden ${bgClass}`}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-100 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white">IS</div>
          <h1 className="text-xl font-bold tracking-tight">Insight Sales</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Analítico</p>
          <NavItem view={ViewState.OVERVIEW} current={currentView} label="Visão Geral" icon={LayoutDashboard} onClick={setView} />
          <NavItem view={ViewState.LEAD_QUALITY} current={currentView} label="Qualidade Leads" icon={Target} onClick={setView} />
          <NavItem view={ViewState.SERVICE_EFFICIENCY} current={currentView} label="Eficiência Atendimento" icon={Headset} onClick={setView} />
          <NavItem view={ViewState.SALES_PERFORMANCE} current={currentView} label="Performance Vendas" icon={Banknote} onClick={setView} />
          <NavItem view={ViewState.SELLER_ANALYSIS} current={currentView} label="Performance Vendedores" icon={Users} onClick={setView} />
          
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Estratégico</p>
          <NavItem view={ViewState.DAILY_ANALYSIS} current={currentView} label="Análise Diária" icon={FileClock} onClick={setView} />
          <NavItem view={ViewState.WEEKDAY_ANALYSIS} current={currentView} label="Análise Semanal" icon={CalendarDays} onClick={setView} />
          <NavItem view={ViewState.MONTHLY_ANALYSIS} current={currentView} label="Análise Mensal" icon={CalendarRange} onClick={setView} />
          <NavItem view={ViewState.ALERTS} current={currentView} label="Alertas Inteligentes" icon={Bell} onClick={setView} />

          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Sistema</p>
          <NavItem view={ViewState.SETTINGS} current={currentView} label="Configurações & Dados" icon={Settings} onClick={setView} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onReset}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-rose-400 hover:bg-rose-900/20 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className={`h-16 ${headerClass} flex items-center justify-between px-6 shrink-0 transition-colors`}>
          <div className="flex items-center gap-4">
            <button 
              className={`lg:hidden p-2 rounded-lg ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className={`text-lg font-semibold ${textClass}`}>
              {currentView === ViewState.OVERVIEW && 'Resumo Executivo'}
              {currentView === ViewState.LEAD_QUALITY && 'Qualidade dos Leads'}
              {currentView === ViewState.SERVICE_EFFICIENCY && 'Produtividade da Equipe'}
              {currentView === ViewState.SALES_PERFORMANCE && 'Faturamento e Metas'}
              {currentView === ViewState.SELLER_ANALYSIS && 'Performance dos Vendedores'}
              {currentView === ViewState.WEEKDAY_ANALYSIS && 'Padrões de Comportamento'}
              {currentView === ViewState.DAILY_ANALYSIS && 'Performance Dia a Dia'}
              {currentView === ViewState.MONTHLY_ANALYSIS && 'Evolução Mensal'}
              {currentView === ViewState.ALERTS && 'Radar de Problemas'}
              {currentView === ViewState.SETTINGS && 'Configuração de Dados'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             {onRefresh && (
               <button 
                 onClick={onRefresh}
                 disabled={isLoading}
                 aria-label="Atualizar dados"
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                   isLoading 
                     ? 'bg-indigo-50 text-indigo-500 cursor-wait' 
                     : isDark 
                       ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800' 
                       : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95'
                 }`}
                 title="Atualizar dados"
               >
                 <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                 <span className="hidden md:inline font-medium text-sm">Atualizar</span>
               </button>
             )}
             <div className={`hidden md:block text-sm ${subTextClass}`}>
               Última atualização: Hoje
             </div>
             <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
               A
             </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};