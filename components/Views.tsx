import React, { useMemo, useState, useEffect } from 'react';
import { DailyRecord, DashboardMetrics, User, Theme } from '../types';
import { formatCurrency, formatPercent, calculateMetrics, getUsers, saveUser, deleteUser, checkLicenseValidity } from '../utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, AlertTriangle, 
  CheckCircle, XCircle, Clock, PhoneOff, Calendar, Filter, ArrowUpRight, Trophy, Target, Banknote, ArrowDownUp, Headset, Info,
  FileSpreadsheet, Upload, Link as LinkIcon, DownloadCloud, Files, PlayCircle, Shield, Trash2, Plus, Inbox, MessageCircleX, RefreshCw,
  CalendarDays, Bell, CalendarRange, FileClock, Moon, Sun, Key, UserPlus, Lock, ArrowUp, ArrowDown
} from 'lucide-react';

// --- Shared Components ---

const Card: React.FC<{ children?: React.ReactNode; className?: string; theme?: Theme }> = ({ children, className = '', theme = 'light' }) => {
  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
  return (
    <div className={`${bg} p-6 rounded-xl shadow-sm border ${className}`}>
      {children}
    </div>
  );
};

const KPICard = ({ title, value, subtext, format = 'number', color = 'text-slate-800', tooltip, theme = 'light' }: { title: string, value: number, subtext?: string, format?: 'currency' | 'percent' | 'number', color?: string, tooltip?: string, theme?: Theme }) => {
  let displayValue = value.toString();
  const isDark = theme === 'dark';

  if (format === 'currency') {
    displayValue = formatCurrency(value);
  } else if (format === 'percent') {
    displayValue = formatPercent(value);
  } else {
    displayValue = new Intl.NumberFormat('pt-BR').format(value);
  }

  // Adjust specific text colors for dark mode if they are standard slate
  let finalColor = color;
  if (isDark) {
      if (color.includes('slate-800') || color.includes('slate-700')) finalColor = 'text-slate-100';
      if (color.includes('indigo-600')) finalColor = 'text-indigo-400';
      if (color.includes('emerald-600')) finalColor = 'text-emerald-400';
      if (color.includes('rose-600')) finalColor = 'text-rose-400';
      if (color.includes('blue-600')) finalColor = 'text-blue-400';
      if (color.includes('purple-600')) finalColor = 'text-purple-400';
      if (color.includes('amber-600')) finalColor = 'text-amber-400';
  }

  const bg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
  const titleColor = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`${bg} p-5 rounded-xl border shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow relative overflow-visible`}>
      <div>
        <div className="flex items-center gap-2 mb-2">
            <p className={`text-sm font-medium ${titleColor} uppercase tracking-wide`}>{title}</p>
            {tooltip && (
                <div className="relative group inline-block">
                    <Info size={14} className="text-slate-400 cursor-help hover:text-indigo-500 transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-center pointer-events-none">
                        {tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                </div>
            )}
        </div>
        <h3 className={`text-2xl font-bold ${finalColor}`}>{displayValue}</h3>
      </div>
      {subtext && (
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-50 text-slate-400'} text-xs`}>
          {subtext}
        </div>
      )}
    </div>
  );
};

// --- DATA HELPERS ---
const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

// Helper to check for unidentified sellers consistently
const isUnidentifiedSeller = (sellerName: string) => {
    const name = (sellerName || '').toLowerCase().trim();
    return name === '' || 
           name === 'não identificado' || 
           name === 'nao identificado' || 
           name === 'desconhecido' || 
           name === 'geral' ||
           name === 'vendedor não identificado' ||
           name === 'vendedor nao identificado' ||
           name === 'vendedor vazio' ||
           name === 'vendedor nulo';
};

// Helper for chart colors based on theme
const getChartColors = (theme: Theme) => {
    const isDark = theme === 'dark';
    return {
        text: isDark ? '#94a3b8' : '#64748b', // slate-400 : slate-500
        grid: isDark ? '#334155' : '#e2e8f0', // slate-700 : slate-200
        tooltipBg: isDark ? '#1e293b' : '#ffffff', // slate-800 : white
        tooltipBorder: isDark ? '#334155' : '#e2e8f0',
        tooltipText: isDark ? '#f1f5f9' : '#1e293b'
    };
};

const aggregateByDate = (data: DailyRecord[]) => {
    const map = new Map<string, any>();
    data.forEach(d => {
        const key = d.data; // DD/MM/YYYY or similar string representation
        if (!map.has(key)) {
            map.set(key, {
                dateStr: d.data,
                dateObj: d.dateObj,
                leads: 0,
                vendas: 0,
                faturamento: 0,
                semResposta: 0,
                desqualificado: 0,
                atendimento: 0,
                investimento: 0,
                emEntrada: 0
            });
        }
        const entry = map.get(key);
        entry.leads += d.leads;
        entry.vendas += d.vendasQtd;
        entry.faturamento += d.faturamento;
        entry.semResposta += d.semResposta;
        entry.desqualificado += d.desqualificado;
        entry.atendimento += d.atendimento;
        entry.investimento += d.investimento;
        entry.emEntrada += d.emEntrada;
    });
    return Array.from(map.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
};

const aggregateBySeller = (data: DailyRecord[]) => {
  const map = new Map<string, any>();
  data.forEach(d => {
    const key = d.vendedor || 'Desconhecido';
    if (!map.has(key)) {
      map.set(key, { name: key, leads: 0, vendas: 0, faturamento: 0, atendimento: 0 });
    }
    const entry = map.get(key);
    entry.leads += d.leads;
    entry.vendas += d.vendasQtd;
    entry.faturamento += d.faturamento;
    entry.atendimento += d.atendimento;
  });
  
  // Convert map to array and filter out unidentified/unknown/general sellers
  return Array.from(map.values())
    .filter(v => !isUnidentifiedSeller(v.name))
    .map(v => ({
      ...v,
      conversao: v.leads > 0 ? (v.vendas / v.leads) * 100 : 0,
      ticket: v.vendas > 0 ? v.faturamento / v.vendas : 0
    }))
    .sort((a, b) => {
        // Priority 1: Faturamento (Revenue) - Descending
        if (b.faturamento !== a.faturamento) return b.faturamento - a.faturamento;
        
        // Priority 2: Vendas (Sales) - Descending
        if (b.vendas !== a.vendas) return b.vendas - a.vendas;
        
        // Priority 3: Conversão (Conversion) - Descending
        if (b.conversao !== a.conversao) return b.conversao - a.conversao;
        
        // Priority 4: Ticket Médio (Avg Ticket) - Descending
        return b.ticket - a.ticket;
    });
}

// --- DATE FILTER HOOK ---
const useDateFilter = (data: DailyRecord[]) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');

  // Initialize dates based on data when "all" is selected initially
  useEffect(() => {
    if (data.length > 0 && filterPeriod === 'all' && !startDate) {
       const sorted = [...data].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
       const first = sorted[0].dateObj;
       const last = sorted[sorted.length - 1].dateObj;
       setStartDate(first.toISOString().split('T')[0]);
       setEndDate(last.toISOString().split('T')[0]);
    }
  }, [data]);

  const setPreset = (period: 'all' | 'today' | '7days' | '30days') => {
      setFilterPeriod(period);
      const end = new Date();
      let start = new Date();

      if (period === 'today') {
         // start is today
      } else if (period === '7days') {
         start.setDate(end.getDate() - 7);
      } else if (period === '30days') {
         start.setDate(end.getDate() - 30);
      } else if (period === 'all') {
          if (data.length > 0) {
            const sorted = [...data].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
            start = sorted[0].dateObj;
            const last = sorted[sorted.length - 1].dateObj;
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(last.toISOString().split('T')[0]);
            return;
          }
      }
      
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setStartDate(e.target.value);
      setFilterPeriod('custom');
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEndDate(e.target.value);
      setFilterPeriod('custom');
  };

  const filteredData = useMemo(() => {
      if (!startDate || !endDate) return data;
      
      const start = new Date(startDate);
      start.setHours(0,0,0,0);
      const [sy, sm, sd] = startDate.split('-').map(Number);
      const startFixed = new Date(sy, sm - 1, sd);

      const [ey, em, ed] = endDate.split('-').map(Number);
      const endFixed = new Date(ey, em - 1, ed);
      endFixed.setHours(23, 59, 59, 999);

      return data.filter(d => {
          const recDate = new Date(d.dateObj.getFullYear(), d.dateObj.getMonth(), d.dateObj.getDate());
          return recDate >= startFixed && recDate <= endFixed;
      });
  }, [data, startDate, endDate]);

  return { startDate, endDate, handleStartChange, handleEndChange, setPreset, filterPeriod, filteredData };
};

// --- SETTINGS VIEW ---
interface SettingsViewProps {
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onUrlImport: () => void;
    onLoadSample: () => void;
    onRefresh: () => void;
    onClear: () => void;
    sheetUrl: string;
    setSheetUrl: (url: string) => void;
    isLoading: boolean;
    error: string;
    currentUser: User | null;
    theme: Theme;
    setTheme: (t: Theme) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    onFileUpload, onUrlImport, onLoadSample, onRefresh, onClear, sheetUrl, setSheetUrl, isLoading, error, currentUser, theme, setTheme
}) => {
    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-slate-100' : 'text-slate-800';
    const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
    const [usersList, setUsersList] = useState<User[]>([]);
    const [newUserUsername, setNewUserUsername] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserExpiry, setNewUserExpiry] = useState('');
    const [userError, setUserError] = useState('');

    useEffect(() => {
        if (currentUser?.role === 'admin') {
            setUsersList(getUsers());
        }
    }, [currentUser]);

    const handleCreateUser = () => {
        setUserError('');
        if (!newUserUsername || !newUserPassword || !newUserExpiry) {
            setUserError('Preencha todos os campos do usuário.');
            return;
        }
        try {
            saveUser({
                username: newUserUsername,
                password: newUserPassword,
                role: 'user', // Default role
                expirationDate: newUserExpiry,
                createdAt: new Date().toISOString()
            });
            setUsersList(getUsers());
            setNewUserUsername('');
            setNewUserPassword('');
            setNewUserExpiry('');
        } catch (e: any) {
            setUserError(e.message || 'Erro ao criar usuário.');
        }
    };

    const handleDeleteUser = (username: string) => {
        if (username === currentUser?.username) {
            setUserError('Você não pode excluir a si mesmo.');
            return;
        }
        deleteUser(username);
        setUsersList(getUsers());
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-10">
            <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold ${textColor}`}>Configuração de Dados</h2>
                <p className={`${subTextColor} mt-1`}>Carregue ou atualize a fonte de dados do dashboard.</p>
            </div>

            <div className="space-y-6">
                 {/* Theme Toggle Section */}
                 <div className="flex items-center justify-between bg-indigo-600 p-4 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                    <div className="flex items-center gap-3">
                        {isDark ? <Moon size={24} /> : <Sun size={24} />}
                        <div>
                            <h4 className="font-bold">Aparência</h4>
                            <p className="text-indigo-100 text-sm">Escolha entre modo claro ou escuro</p>
                        </div>
                    </div>
                    <div className="flex bg-indigo-800/50 p-1 rounded-lg">
                        <button 
                            onClick={() => setTheme('light')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!isDark ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Claro
                        </button>
                        <button 
                            onClick={() => setTheme('dark')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isDark ? 'bg-slate-800 text-white shadow-sm' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Escuro
                        </button>
                    </div>
                 </div>

                <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-2`}>
                    <Upload size={20} className="text-indigo-600" />
                    Fonte de Dados
                </h3>
                
                <Card theme={theme} className={isDark ? 'border-slate-800' : 'border-indigo-100 bg-indigo-50/30'}>
                    <h4 className={`font-semibold ${textColor} mb-4 flex items-center gap-2`}>
                        <FileSpreadsheet className="text-indigo-600" size={18} />
                        Arquivos Locais (CSV)
                    </h4>
                    
                    <div className={`border-2 border-dashed ${isDark ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'border-indigo-200 bg-white hover:bg-slate-50'} rounded-xl p-6 text-center transition-colors relative group cursor-pointer`}>
                        <input 
                            type="file" 
                            accept=".csv,.txt"
                            multiple
                            onChange={onFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="relative z-0 pointer-events-none">
                            {isLoading ? (
                            <div className="mx-auto w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                            ) : (
                            <div className="flex justify-center mb-2">
                                <Upload className={`text-indigo-500 ${isDark ? 'bg-slate-700' : 'bg-white'} rounded-full p-1 shadow-sm`} size={32} />
                            </div>
                            )}
                            <p className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}>Arraste CSVs</p>
                        </div>
                    </div>
                </Card>

                <Card theme={theme}>
                    <h4 className={`font-semibold ${textColor} mb-4 flex items-center gap-2`}>
                        <LinkIcon className={isDark ? 'text-slate-400' : 'text-slate-600'} size={18} />
                        Google Sheets
                    </h4>
                    <div className="flex gap-2">
                        <input 
                        type="text" 
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="Link público..."
                        className={`flex-1 px-3 py-2 text-sm border ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500' : 'border-slate-300 bg-white'} rounded-lg outline-none focus:border-indigo-500`}
                        />
                        <button 
                            onClick={onUrlImport}
                            disabled={isLoading || !sheetUrl}
                            className="bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center min-w-[44px]"
                            title="Importar"
                        >
                            <DownloadCloud size={18} />
                        </button>
                        {sheetUrl && (
                            <button 
                                onClick={onRefresh}
                                disabled={isLoading}
                                className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
                                title="Recarregar Dados"
                            >
                                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                                <span className="text-xs font-semibold hidden sm:inline">Atualizar</span>
                            </button>
                        )}
                    </div>
                </Card>
                
                    <button 
                    onClick={onLoadSample}
                    className={`w-full py-2 border text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm rounded-xl ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-indigo-400 hover:border-indigo-900' : 'bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200'}`}
                    >
                    <PlayCircle size={16} />
                    Carregar Dados Demo
                </button>

                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle size={14} />
                        {error}
                    </div>
                )}
                
                <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex justify-between items-center mt-4`}>
                    <span className="text-xs text-slate-400">Gerenciamento de Dados</span>
                    <button 
                        onClick={onClear}
                        className="flex items-center gap-2 px-3 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 text-xs font-medium"
                    >
                        <Trash2 size={14} />
                        Limpar Dados
                    </button>
                </div>

                {/* --- LICENSE MANAGEMENT SECTION (ADMIN ONLY) --- */}
                {currentUser?.role === 'admin' && (
                    <>
                        <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-2 pt-6`}>
                            <Shield size={20} className="text-emerald-600" />
                            Gestão de Acesso e Licenças
                        </h3>

                        <Card theme={theme} className={isDark ? 'border-slate-800' : 'border-emerald-100 bg-emerald-50/30'}>
                             <div className="space-y-6">
                                {/* New User Form */}
                                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                    <h4 className={`font-semibold text-sm ${textColor} mb-3 flex items-center gap-2`}>
                                        <UserPlus size={16} />
                                        Novo Usuário
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Usuário" 
                                                value={newUserUsername}
                                                onChange={e => setNewUserUsername(e.target.value)}
                                                className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none focus:border-emerald-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'border-slate-300'}`}
                                            />
                                            <Users size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Senha" 
                                                value={newUserPassword}
                                                onChange={e => setNewUserPassword(e.target.value)}
                                                className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none focus:border-emerald-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'border-slate-300'}`}
                                            />
                                            <Key size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="date" 
                                                value={newUserExpiry}
                                                onChange={e => setNewUserExpiry(e.target.value)}
                                                className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none focus:border-emerald-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'border-slate-300'}`}
                                                title="Data de Validade da Licença"
                                            />
                                            <Calendar size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                        </div>
                                        <button 
                                            onClick={handleCreateUser}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus size={16} />
                                            Adicionar
                                        </button>
                                    </div>
                                    {userError && (
                                        <p className="text-rose-500 text-xs mt-2 flex items-center gap-1">
                                            <AlertTriangle size={12} /> {userError}
                                        </p>
                                    )}
                                </div>

                                {/* User List */}
                                <div className={`border rounded-xl overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <table className="w-full text-sm text-left">
                                        <thead className={`text-xs uppercase ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                            <tr>
                                                <th className="px-4 py-3">Usuário</th>
                                                <th className="px-4 py-3">Validade</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                                            {usersList.map((user) => {
                                                const isValid = checkLicenseValidity(user);
                                                return (
                                                    <tr key={user.username} className={`${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                                                        <td className={`px-4 py-3 font-medium flex items-center gap-2 ${textColor}`}>
                                                            {user.role === 'admin' ? <Shield size={14} className="text-indigo-500" /> : <Users size={14} className="text-slate-400" />}
                                                            {user.username}
                                                        </td>
                                                        <td className={`px-4 py-3 ${subTextColor}`}>
                                                            {user.expirationDate.split('-').reverse().join('/')}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isValid ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                                    Ativo
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                                                                    Expirado
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {user.role !== 'admin' && (
                                                                <button 
                                                                    onClick={() => handleDeleteUser(user.username)}
                                                                    className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
                                                                    title="Remover Acesso"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                             </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
};

// --- VIEWS COMPONENTS ---

export const Overview: React.FC<{ data: DailyRecord[], metrics: DashboardMetrics, theme: Theme }> = ({ data, metrics, theme }) => {
    const { startDate, endDate, handleStartChange, handleEndChange, setPreset, filterPeriod, filteredData } = useDateFilter(data);
    const chartData = useMemo(() => aggregateByDate(filteredData), [filteredData]);
    const periodMetrics = useMemo(() => calculateMetrics(filteredData), [filteredData]);
    
    const isDark = theme === 'dark';
    const chartColors = getChartColors(theme);
    const textColor = isDark ? 'text-slate-100' : 'text-slate-700';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className={`flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 rounded-xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex gap-2 text-sm overflow-x-auto pb-2 md:pb-0">
                    {['all', '30days', '7days', 'today'].map(p => (
                        <button 
                            key={p}
                            onClick={() => setPreset(p as any)}
                            className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${filterPeriod === p ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {p === 'all' ? 'Todo o Período' : p === '30days' ? 'Últimos 30 Dias' : p === '7days' ? 'Últimos 7 Dias' : 'Hoje'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-slate-400" />
                    <input type="date" value={startDate} onChange={handleStartChange} className={`border rounded-lg px-2 py-1 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`} />
                    <span className="text-slate-400">até</span>
                    <input type="date" value={endDate} onChange={handleEndChange} className={`border rounded-lg px-2 py-1 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard theme={theme} title="Total de Leads" value={periodMetrics.totalLeads} color="text-indigo-600" tooltip="Total de leads importados no período selecionado." />
                <KPICard theme={theme} title="Vendas Realizadas" value={periodMetrics.totalGanhos} color="text-emerald-600" tooltip="Total de vendas (Qtd Vendas) no período." />
                <KPICard theme={theme} title="Vendas Perdidas" value={periodMetrics.totalVendaNaoConcluida} color="text-rose-600" tooltip="Total de oportunidades perdidas (Venda Não Concluída)." />
                <KPICard theme={theme} title="Faturamento" value={periodMetrics.faturamentoTotal} format="currency" color="text-emerald-600" tooltip="Soma do Faturamento (P. Real) no período." />
                <KPICard theme={theme} title="Ticket Médio" value={periodMetrics.ticketMedio} format="currency" color="text-slate-700" tooltip="Faturamento Total / Vendas Realizadas." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <Card theme={theme} className="lg:col-span-2 h-[400px] flex flex-col">
                    <h3 className={`font-bold ${textColor} mb-6 flex items-center gap-2`}>
                        <TrendingUp size={20} className="text-indigo-500" />
                        Evolução de Leads vs Vendas
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{top: 5, right: 20, bottom: 5, left: 0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                            <XAxis dataKey="dateStr" tick={{fontSize: 12, fill: chartColors.text}} />
                            <YAxis yAxisId="left" tick={{fontSize: 12, fill: chartColors.text}} />
                            <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: chartColors.text}} />
                            <Tooltip 
                                contentStyle={{borderRadius: '12px', border: `1px solid ${chartColors.tooltipBorder}`, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                itemStyle={{ color: chartColors.tooltipText }}
                                formatter={(value: number, name: string) => [value, name]}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="leads" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            <Line yAxisId="right" type="monotone" dataKey="vendas" name="Vendas" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Card>

                <Card theme={theme} className="h-[400px] flex flex-col">
                    <h3 className={`font-bold ${textColor} mb-6 flex items-center gap-2`}>
                        <Target size={20} className="text-purple-500" />
                        Funil de Conversão
                    </h3>
                    <div className="flex-1 flex flex-col justify-center space-y-6">
                        {[
                            { label: 'Leads Totais', value: periodMetrics.totalLeads, color: isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-700' },
                            { label: 'Em Atendimento', value: periodMetrics.totalAtendidos, color: isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700' },
                            { label: 'Vendas', value: periodMetrics.totalGanhos, color: isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700' }
                        ].map((step, idx) => (
                             <div key={idx} className="relative">
                                <div className={`p-4 rounded-xl ${step.color} font-medium flex justify-between items-center relative z-10 mx-${idx * 4}`}>
                                    <span>{step.label}</span>
                                    <span className="font-bold text-lg">{step.value}</span>
                                </div>
                                {idx < 2 && (
                                    <div className={`h-4 mx-auto w-0.5 border-l-2 border-dashed ${isDark ? 'border-slate-700' : 'border-slate-300'} my-1`}></div>
                                )}
                             </div>
                        ))}
                         <div className={`text-center pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
                            <span className="text-xs text-slate-400 uppercase tracking-wide">Taxa de Conversão Global</span>
                            <div className={`text-3xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'} mt-1`}>{formatPercent(periodMetrics.conversao)}</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const LeadQuality: React.FC<{ data: DailyRecord[], metrics: DashboardMetrics, theme: Theme }> = ({ data, metrics, theme }) => {
    const { startDate, endDate, handleStartChange, handleEndChange, setPreset, filterPeriod, filteredData } = useDateFilter(data);
    const chartData = useMemo(() => aggregateByDate(filteredData), [filteredData]);
    const periodMetrics = useMemo(() => calculateMetrics(filteredData), [filteredData]);
    
    const isDark = theme === 'dark';
    const chartColors = getChartColors(theme);
    const textColor = isDark ? 'text-slate-100' : 'text-slate-700';

    // Pie Data: Strictly Qualification Metrics (Entry, No Reply, Disqualified, In Service)
    const pieData = [
        { name: 'Em Atendimento', value: periodMetrics.totalAtendidos, color: '#3b82f6' },
        { name: 'Desqualificado', value: periodMetrics.totalDesqualificados, color: '#ef4444' },
        { name: 'Sem Resposta', value: periodMetrics.totalSemResposta, color: '#f59e0b' },
        { name: 'Em Entrada', value: periodMetrics.totalEmEntrada, color: '#6366f1' }
    ].filter(d => d.value > 0);

    const totalPie = pieData.reduce((acc, cur) => acc + cur.value, 0);
    const desqPercent = periodMetrics.totalLeads > 0 ? (periodMetrics.totalDesqualificados / periodMetrics.totalLeads) * 100 : 0;

    return (
        <div className="space-y-6 animate-fade-in">
             <div className={`flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 rounded-xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex gap-2 text-sm overflow-x-auto pb-2 md:pb-0">
                    {['all', '30days', '7days', 'today'].map(p => (
                        <button 
                            key={p}
                            onClick={() => setPreset(p as any)}
                            className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${filterPeriod === p ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {p === 'all' ? 'Todo o Período' : p === '30days' ? 'Últimos 30 Dias' : p === '7days' ? 'Últimos 7 Dias' : 'Hoje'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-slate-400" />
                    <input type="date" value={startDate} onChange={handleStartChange} className={`border rounded-lg px-2 py-1 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`} />
                    <span className="text-slate-400">até</span>
                    <input type="date" value={endDate} onChange={handleEndChange} className={`border rounded-lg px-2 py-1 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 1. Em Entrada */}
                <KPICard theme={theme} title="Em Entrada" value={periodMetrics.totalEmEntrada} color="text-purple-600" tooltip="Total de leads que entraram mas não iniciaram atendimento." />
                
                {/* 2. Sem Resposta (New Format: Absolute value, reordered) */}
                <KPICard theme={theme} title="Sem Resposta" value={periodMetrics.totalSemResposta} color="text-amber-600" tooltip="Total de leads que não responderam ao primeiro contato." />

                {/* 3. Total Desqualificados */}
                <KPICard theme={theme} title="Total Desqualificados" value={periodMetrics.totalDesqualificados} subtext={`${formatPercent(desqPercent)} do total`} color="text-rose-600" tooltip="Total de leads marcados como desqualificados." />

                {/* 4. Em Atendimento */}
                <KPICard theme={theme} title="Em Atendimento" value={periodMetrics.totalAtendidos} color="text-blue-600" tooltip="Total de leads que efetivamente entraram em atendimento." />

                {/* 5. Qualidade de Leads */}
                <KPICard theme={theme} title="Qualidade de Leads" value={periodMetrics.qualidadeRate} format="percent" color="text-indigo-600" tooltip="Taxa de leads que geraram atendimento efetivo (Atendimento / Leads)." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card theme={theme} className="h-[400px]">
                    <h3 className={`font-bold ${textColor} mb-6`}>Distribuição dos Leads (Status)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = outerRadius * 1.1; 
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return `${value} (${(percent * 100).toFixed(0)}%)`; 
                                }}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val: number) => [`${val} (${((val / totalPie) * 100).toFixed(1)}%)`, 'Quantidade']} contentStyle={{borderRadius: '8px', border: `1px solid ${chartColors.tooltipBorder}`, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText}} itemStyle={{ color: chartColors.tooltipText }} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ color: chartColors.text }} formatter={(value, entry: any) => `${value}: ${entry.payload.value}`} />
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 dark:fill-slate-400">
                                <tspan x="50%" dy="-0.5em" fontSize="12">Total</tspan>
                                <tspan x="50%" dy="1.5em" fontSize="18" fontWeight="bold">{totalPie}</tspan>
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                <Card theme={theme} className="h-[400px]">
                    <h3 className={`font-bold ${textColor} mb-6`}>Perda de Leads (Pré-Atendimento)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                            <defs>
                                <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSemResp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorDesq" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="dateStr" tick={{fontSize: 10, fill: chartColors.text}} />
                            <YAxis tick={{fontSize: 10, fill: chartColors.text}} />
                            <Tooltip contentStyle={{borderRadius: '8px', border: `1px solid ${chartColors.tooltipBorder}`, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText}} itemStyle={{ color: chartColors.tooltipText }} />
                            <Legend wrapperStyle={{ color: chartColors.text }} />
                            <Area type="monotone" dataKey="emEntrada" name="Em Entrada" stroke="#6366f1" fillOpacity={1} fill="url(#colorEntrada)" />
                            <Area type="monotone" dataKey="semResposta" name="Sem Resposta" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSemResp)" />
                            <Area type="monotone" dataKey="desqualificado" name="Desqualificado" stroke="#ef4444" fillOpacity={1} fill="url(#colorDesq)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};

export const ServiceEfficiency: React.FC<{ data: DailyRecord[], theme: Theme }> = ({ data, theme }) => {
    const { startDate, endDate, handleStartChange, handleEndChange, setPreset, filterPeriod, filteredData } = useDateFilter(data);
    const chartData = useMemo(() => aggregateByDate(filteredData), [filteredData]);
    const periodMetrics = useMemo(() => calculateMetrics(filteredData), [filteredData]);
    const isDark = theme === 'dark';
    const chartColors = getChartColors(theme);
    const textColor = isDark ? 'text-slate-100' : 'text-slate-700';

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Filter Header Reuse */}
             <div className={`flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 rounded-xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex gap-2 text-sm overflow-x-auto pb-2 md:pb-0">
                    {['all', '30days', '7days', 'today'].map(p => (
                        <button key={p} onClick={() => setPreset(p as any)} className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${filterPeriod === p ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{p === 'all' ? 'Todo' : p === '30days' ? '30 Dias' : p === '7days' ? '7 Dias' : 'Hoje'}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-slate-400" />
                    <input type="date" value={startDate} onChange={handleStartChange} className={`border rounded-lg px-2 py-1 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`} />
                    <span className="text-slate-400">até</span>
                    <input type="date" value={endDate} onChange={handleEndChange} className={`border rounded-lg px-2 py-1 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard theme={theme} title="Total Atendidos" value={periodMetrics.totalAtendidos} color="text-blue-600" tooltip="Total de leads que receberam atendimento." />
                <KPICard theme={theme} title="Eficiência de Atendimento" value={periodMetrics.totalLeads > 0 ? (periodMetrics.totalAtendidos/periodMetrics.totalLeads)*100 : 0} format="percent" color="text-indigo-600" tooltip="% de leads atendidos sobre o total de leads." />
                <KPICard theme={theme} title="Vendas Concluídas" value={periodMetrics.totalGanhos} color="text-emerald-600" />
                 <KPICard theme={theme} title="Taxa de Conversão Real" value={periodMetrics.totalAtendidos > 0 ? (periodMetrics.totalGanhos/periodMetrics.totalAtendidos)*100 : 0} format="percent" color="text-emerald-600" tooltip="% de vendas sobre leads atendidos." />
            </div>

            <Card theme={theme} className="h-[400px]">
                <h3 className={`font-bold ${textColor} mb-6`}>Volume de Atendimento vs Vendas (Diário)</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                        <XAxis dataKey="dateStr" tick={{fontSize: 10, fill: chartColors.text}} />
                        <YAxis tick={{fontSize: 10, fill: chartColors.text}} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: `1px solid ${chartColors.tooltipBorder}`, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText}} itemStyle={{ color: chartColors.tooltipText }} />
                        <Legend />
                        <Bar dataKey="atendimento" name="Atendimentos" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="vendas" name="Vendas" stackId="a" fill="#10b981" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export const SalesPerformance: React.FC<{ data: DailyRecord[], metrics: DashboardMetrics, theme: Theme }> = ({ data, metrics, theme }) => {
    const { startDate, endDate, handleStartChange, handleEndChange, setPreset, filterPeriod, filteredData } = useDateFilter(data);
    const chartData = useMemo(() => aggregateByDate(filteredData), [filteredData]);
    const periodMetrics = useMemo(() => calculateMetrics(filteredData), [filteredData]);
    const isDark = theme === 'dark';
    const chartColors = getChartColors(theme);
    const textColor = isDark ? 'text-slate-100' : 'text-slate-700';

    return (
         <div className="space-y-6 animate-fade-in">
             <div className={`flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 rounded-xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex gap-2 text-sm overflow-x-auto pb-2 md:pb-0">
                    {['all', '30days', '7days', 'today'].map(p => (
                        <button key={p} onClick={() => setPreset(p as any)} className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${filterPeriod === p ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{p === 'all' ? 'Todo' : p === '30days' ? '30 Dias' : p === '7days' ? '7 Dias' : 'Hoje'}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-slate-400" />
                    <input type="date" value={startDate} onChange={handleStartChange} className={`border rounded-lg px-2 py-1 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`} />
                    <span className="text-slate-400">até</span>
                    <input type="date" value={endDate} onChange={handleEndChange} className={`border rounded-lg px-2 py-1 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard theme={theme} title="Faturamento Total" value={periodMetrics.faturamentoTotal} format="currency" color="text-emerald-600" />
                <KPICard theme={theme} title="Ticket Médio" value={periodMetrics.ticketMedio} format="currency" color="text-indigo-600" />
                <KPICard theme={theme} title="ROI Estimado" value={periodMetrics.investimentoTotal > 0 ? ((periodMetrics.faturamentoTotal - periodMetrics.investimentoTotal) / periodMetrics.investimentoTotal) * 100 : 0} format="percent" color="text-blue-600" subtext="Baseado no Investimento Informado" />
            </div>

            <Card theme={theme} className="h-[400px]">
                <h3 className={`font-bold ${textColor} mb-6`}>Evolução de Faturamento</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                        <defs>
                            <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="dateStr" tick={{fontSize: 10, fill: chartColors.text}} />
                        <YAxis tick={{fontSize: 10, fill: chartColors.text}} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{borderRadius: '8px', border: `1px solid ${chartColors.tooltipBorder}`, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText}} itemStyle={{ color: chartColors.tooltipText }} />
                        <Legend />
                        <Area type="monotone" dataKey="faturamento" name="Faturamento (R$)" stroke="#10b981" fillOpacity={1} fill="url(#colorFat)" />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>
         </div>
    );
};

export const SellerPerformance: React.FC<{ data: DailyRecord[], theme: Theme }> = ({ data, theme }) => {
    const { startDate, endDate, handleStartChange, handleEndChange, setPreset, filterPeriod, filteredData } = useDateFilter(data);
    const sellerData = useMemo(() => aggregateBySeller(filteredData), [filteredData]);
    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-slate-100' : 'text-slate-700';

    return (
        <div className="space-y-6 animate-fade-in">
             <div className={`flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-4 rounded-xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex gap-2 text-sm overflow-x-auto pb-2 md:pb-0">
                    {['all', '30days', '7days', 'today'].map(p => (
                        <button key={p} onClick={() => setPreset(p as any)} className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${filterPeriod === p ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{p === 'all' ? 'Todo' : p === '30days' ? '30 Dias' : p === '7days' ? '7 Dias' : 'Hoje'}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-slate-400" />
                    <input type="date" value={startDate} onChange={handleStartChange} className={`border rounded-lg px-2 py-1 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`} />
                    <span className="text-slate-400">até</span>
                    <input type="date" value={endDate} onChange={handleEndChange} className={`border rounded-lg px-2 py-1 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`} />
                </div>
            </div>

            <Card theme={theme}>
                <h3 className={`font-bold ${textColor} mb-6 flex items-center gap-2`}>
                    <Trophy size={20} className="text-yellow-500" />
                    Ranking de Vendedores
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className={`text-xs uppercase ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                            <tr>
                                <th className="px-4 py-3">Vendedor</th>
                                <th className="px-4 py-3">Leads</th>
                                <th className="px-4 py-3">Vendas</th>
                                <th className="px-4 py-3">Conversão</th>
                                <th className="px-4 py-3">Faturamento</th>
                                <th className="px-4 py-3">Ticket Médio</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                            {sellerData.map((seller, idx) => (
                                <tr key={seller.name} className={`${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                                    <td className={`px-4 py-3 font-medium ${textColor} flex items-center gap-2`}>
                                        {idx < 3 && <Trophy size={14} className={idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-amber-600'} />}
                                        {seller.name}
                                    </td>
                                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{seller.leads}</td>
                                    <td className="px-4 py-3 font-bold text-emerald-600">{seller.vendas}</td>
                                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatPercent(seller.conversao)}</td>
                                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatCurrency(seller.faturamento)}</td>
                                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatCurrency(seller.ticket)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export const WeekdayAnalysis: React.FC<{ data: DailyRecord[], theme: Theme }> = ({ data, theme }) => {
    // Aggregation logic for weekdays
    const weekdayData = useMemo(() => {
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const map = new Map<string, any>();
        days.forEach(d => map.set(d, { name: d, leads: 0, vendas: 0, count: 0 }));
        
        data.forEach(d => {
            const key = d.diaSemana;
            if (map.has(key)) {
                const entry = map.get(key);
                entry.leads += d.leads;
                entry.vendas += d.vendasQtd;
                entry.count += 1;
            }
        });

        // Normalize to averages to handle different number of Mondays vs Sundays etc.
        return days.map(day => {
            const d = map.get(day);
            return {
                name: day,
                leads: d.count > 0 ? Math.round(d.leads / d.count) : 0,
                vendas: d.count > 0 ? Math.round(d.vendas / d.count) : 0,
                conversao: d.leads > 0 ? (d.vendas / d.leads) * 100 : 0
            };
        });
    }, [data]);

    const isDark = theme === 'dark';
    const chartColors = getChartColors(theme);
    const textColor = isDark ? 'text-slate-100' : 'text-slate-700';

    return (
        <div className="space-y-6 animate-fade-in">
             <Card theme={theme} className="h-[400px]">
                <h3 className={`font-bold ${textColor} mb-6`}>Média de Leads e Vendas por Dia da Semana</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={weekdayData} margin={{top: 20, right: 20, bottom: 20, left: 20}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: chartColors.text}} />
                        <YAxis yAxisId="left" tick={{fontSize: 12, fill: chartColors.text}} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: chartColors.text}} unit="%" />
                        <Tooltip contentStyle={{borderRadius: '8px', border: `1px solid ${chartColors.tooltipBorder}`, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText}} itemStyle={{ color: chartColors.tooltipText }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="leads" name="Média Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="vendas" name="Média Vendas" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="conversao" name="Conversão (%)" stroke="#f59e0b" strokeWidth={2} />
                    </ComposedChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export const DailyAnalysis: React.FC<{ data: DailyRecord[], theme: Theme }> = ({ data, theme }) => {
    const { startDate, endDate, handleStartChange, handleEndChange, filteredData } = useDateFilter(data);
    
    // Filter out unidentified sellers for the table view as requested
    const displayData = useMemo(() => {
        return filteredData.filter(row => !isUnidentifiedSeller(row.vendedor));
    }, [filteredData]);

    const [page, setPage] = useState(1);
    const itemsPerPage = 15;
    
    // Reset page when data changes
    useEffect(() => setPage(1), [displayData]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return displayData.slice(start, start + itemsPerPage);
    }, [displayData, page]);

    const totalPages = Math.ceil(displayData.length / itemsPerPage);
    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-slate-100' : 'text-slate-700';

    return (
        <div className="space-y-6 animate-fade-in">
             <div className={`flex flex-col md:flex-row gap-4 justify-between items-center p-4 rounded-xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <h3 className={`font-bold ${textColor}`}>Registros Diários</h3>
                <div className="flex items-center gap-2 text-sm">
                     <input type="date" value={startDate} onChange={handleStartChange} className={`border rounded-lg px-2 py-1 outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200'}`} />
                     <span className="text-slate-400">até</span>
                     <input type="date" value={endDate} onChange={handleEndChange} className={`border rounded-lg px-2 py-1 outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'border-slate-200'}`} />
                </div>
            </div>

            <Card theme={theme} className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className={`text-xs uppercase ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                            <tr>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Vendedor</th>
                                <th className="px-4 py-3">Leads</th>
                                <th className="px-4 py-3">Atendimentos</th>
                                <th className="px-4 py-3">Vendas</th>
                                <th className="px-4 py-3">Faturamento</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                            {paginatedData.map((row) => (
                                <tr key={row.id} className={`${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{row.data}</td>
                                    <td className={`px-4 py-3 font-medium ${textColor}`}>{row.vendedor}</td>
                                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{row.leads}</td>
                                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{row.atendimento}</td>
                                    <td className="px-4 py-3 text-emerald-600 font-medium">{row.vendasQtd}</td>
                                    <td className={`px-4 py-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatCurrency(row.faturamento)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                     <div className={`flex justify-between items-center p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border disabled:opacity-50 text-xs">Anterior</button>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Página {page} de {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border disabled:opacity-50 text-xs">Próxima</button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export const MonthlyAnalysis: React.FC<{ data: DailyRecord[], theme: Theme }> = ({ data, theme }) => {
    const monthlyData = useMemo(() => {
        const map = new Map<string, any>();
        data.forEach(d => {
            const key = `${d.dateObj.getMonth() + 1}/${d.dateObj.getFullYear()}`; // MM/YYYY
            if (!map.has(key)) {
                map.set(key, { name: key, dateObj: new Date(d.dateObj.getFullYear(), d.dateObj.getMonth(), 1), leads: 0, vendas: 0, faturamento: 0 });
            }
            const entry = map.get(key);
            entry.leads += d.leads;
            entry.vendas += d.vendasQtd;
            entry.faturamento += d.faturamento;
        });
        return Array.from(map.values())
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    }, [data]);

    const isDark = theme === 'dark';
    const chartColors = getChartColors(theme);
    const textColor = isDark ? 'text-slate-100' : 'text-slate-700';

    return (
        <div className="space-y-6 animate-fade-in">
            <Card theme={theme} className="h-[400px]">
                <h3 className={`font-bold ${textColor} mb-6`}>Evolução Mensal (Leads vs Vendas)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: chartColors.text}} />
                        <YAxis yAxisId="left" tick={{fontSize: 12, fill: chartColors.text}} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: chartColors.text}} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: `1px solid ${chartColors.tooltipBorder}`, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText}} itemStyle={{ color: chartColors.tooltipText }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="leads" name="Leads" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="vendas" name="Vendas" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

             <Card theme={theme} className="h-[400px]">
                <h3 className={`font-bold ${textColor} mb-6`}>Faturamento Mensal</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                        <defs>
                             <linearGradient id="colorFatMonth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: chartColors.text}} />
                        <YAxis tick={{fontSize: 12, fill: chartColors.text}} />
                        <Tooltip formatter={(val:number)=>formatCurrency(val)} contentStyle={{borderRadius: '8px', border: `1px solid ${chartColors.tooltipBorder}`, backgroundColor: chartColors.tooltipBg, color: chartColors.tooltipText}} itemStyle={{ color: chartColors.tooltipText }} />
                        <Legend />
                        <Area type="monotone" dataKey="faturamento" name="Faturamento (R$)" stroke="#06b6d4" fill="url(#colorFatMonth)" />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
};

export const AlertsView: React.FC<{ data: DailyRecord[], metrics: DashboardMetrics, theme: Theme }> = ({ data, metrics, theme }) => {
    // Determine alerts based on metrics
    const alerts = [];

    if (metrics.semRespostaRate > 20) {
        alerts.push({ type: 'warning', title: 'Taxa de Sem Resposta Alta', message: `A taxa de leads sem resposta está em ${formatPercent(metrics.semRespostaRate)}, acima do ideal de 20%.` });
    }
    if (metrics.conversao < 3) {
        alerts.push({ type: 'danger', title: 'Conversão Abaixo da Meta', message: `Sua taxa de conversão atual é de ${formatPercent(metrics.conversao)}. A meta recomendada é > 3%.` });
    }
    if (metrics.totalDesqualificados > (metrics.totalLeads * 0.4)) {
         alerts.push({ type: 'warning', title: 'Alto Volume de Desqualificados', message: `Mais de 40% dos seus leads estão sendo desqualificados. Verifique a qualidade do tráfego.` });
    }

    // Check for days with zero sales recently
    const recentData = data.slice(-7);
    const zeroSalesDays = recentData.filter(d => d.vendasQtd === 0).length;
    if (zeroSalesDays > 2) {
        alerts.push({ type: 'danger', title: 'Dias Sem Vendas', message: `Nos últimos 7 registros, ${zeroSalesDays} dias não tiveram vendas.` });
    }

    if (alerts.length === 0) {
        alerts.push({ type: 'success', title: 'Tudo Certo!', message: 'Seus indicadores estão dentro dos parâmetros esperados.' });
    }

    const isDark = theme === 'dark';

    return (
        <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Painel de Alertas</h2>
            {alerts.map((alert, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex items-start gap-4 shadow-sm ${
                    alert.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                    'bg-emerald-50 border-emerald-100 text-emerald-800'
                }`}>
                    <div className={`p-2 rounded-full ${
                        alert.type === 'danger' ? 'bg-rose-200 text-rose-700' :
                        alert.type === 'warning' ? 'bg-amber-200 text-amber-700' :
                        'bg-emerald-200 text-emerald-700'
                    }`}>
                        {alert.type === 'danger' ? <XCircle size={24} /> :
                         alert.type === 'warning' ? <AlertTriangle size={24} /> :
                         <CheckCircle size={24} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">{alert.title}</h4>
                        <p className="opacity-90">{alert.message}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};