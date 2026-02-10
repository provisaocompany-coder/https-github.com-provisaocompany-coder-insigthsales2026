import React, { useState, useEffect } from 'react';
import { ViewState, DailyRecord, DashboardMetrics, User, Theme } from './types';
import { generateMockData, parseCSV, calculateMetrics, getGoogleSheetExportUrl } from './utils';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { 
  Overview, LeadQuality, ServiceEfficiency, SalesPerformance, 
  WeekdayAnalysis, AlertsView, DailyAnalysis, MonthlyAnalysis, SellerPerformance, SettingsView
} from './components/Views';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [data, setData] = useState<DailyRecord[] | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string>("");
  const [sheetUrl, setSheetUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>('light');

  // Load theme from local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('is_theme') as Theme;
    if (savedTheme) {
        setTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
      setTheme(newTheme);
      localStorage.setItem('is_theme', newTheme);
  };

  useEffect(() => {
    if (data) {
      const calculated = calculateMetrics(data);
      setMetrics(calculated);
    }
  }, [data]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError("");

    try {
      const allRecords: DailyRecord[] = [];
      const readFilePromises = (Array.from(files) as File[]).map((file, index) => {
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            const parsed = parseCSV(text, index); // Pass index to generate unique IDs
            allRecords.push(...parsed);
            resolve();
          };
          reader.onerror = () => reject(new Error(`Erro ao ler arquivo ${file.name}`));
          reader.readAsText(file);
        });
      });

      await Promise.all(readFilePromises);

      if (allRecords.length > 0) {
        // Sort by date just in case files were uploaded out of order
        allRecords.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
        
        setData(allRecords);
        // If we were in SETTINGS, move to OVERVIEW to show the result, 
        // unless explicitly staying. For now, redirecting feels more natural after upload.
        setView(ViewState.OVERVIEW);
      } else {
        setError("Nenhum dado válido encontrado nos arquivos.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao processar arquivos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlImport = async () => {
    if (!sheetUrl) return;
    setIsLoading(true);
    setError("");

    try {
      let fetchUrl = sheetUrl;
      const googleUrl = getGoogleSheetExportUrl(sheetUrl);
      if (googleUrl) {
        fetchUrl = googleUrl;
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error("Falha ao buscar dados da URL. Verifique as permissões.");
      }
      const text = await response.text();
      const parsed = parseCSV(text);
      
      if (parsed.length > 0) {
        setData(parsed);
        setView(ViewState.OVERVIEW);
        setError("");
      } else {
        setError("Não encontramos dados válidos. Verifique se a planilha segue o modelo padrão.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar link. Certifique-se que a planilha é PÚBLICA (Qualquer pessoa com link) e contém apenas uma aba ou use o upload de arquivos para múltiplas abas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (sheetUrl) {
        // If we have a URL, re-fetch the data
        await handleUrlImport();
    } else {
        // If it's local file data, we can't really "refresh" from disk easily
        // So we just simulate a loading state to give feedback
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 800);
    }
  };

  const loadSampleData = () => {
    const mock = generateMockData();
    setData(mock);
    setView(ViewState.OVERVIEW);
    setError("");
  };

  // Login handler now redirects based on data presence
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (!data) {
        setView(ViewState.SETTINGS); // Force settings if no data
    } else {
        setView(ViewState.OVERVIEW);
    }
  };

  if (view === ViewState.LOGIN) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentView={view} 
      setView={setView} 
      onReset={() => {
        setData(null);
        setCurrentUser(null);
        setView(ViewState.LOGIN);
        setSheetUrl("");
      }}
      onRefresh={handleRefresh}
      isLoading={isLoading}
      theme={theme}
    >
      {view === ViewState.OVERVIEW && data && metrics && <Overview data={data} metrics={metrics} theme={theme} />}
      {view === ViewState.LEAD_QUALITY && data && metrics && <LeadQuality data={data} metrics={metrics} theme={theme} />}
      {view === ViewState.SERVICE_EFFICIENCY && data && <ServiceEfficiency data={data} theme={theme} />}
      {view === ViewState.SALES_PERFORMANCE && data && metrics && <SalesPerformance data={data} metrics={metrics} theme={theme} />}
      {view === ViewState.SELLER_ANALYSIS && data && <SellerPerformance data={data} theme={theme} />}
      {view === ViewState.WEEKDAY_ANALYSIS && data && <WeekdayAnalysis data={data} theme={theme} />}
      {view === ViewState.DAILY_ANALYSIS && data && <DailyAnalysis data={data} theme={theme} />}
      {view === ViewState.MONTHLY_ANALYSIS && data && <MonthlyAnalysis data={data} theme={theme} />}
      {view === ViewState.ALERTS && data && metrics && <AlertsView data={data} metrics={metrics} theme={theme} />}
      
      {/* Settings View is always available, even if data is null */}
      {view === ViewState.SETTINGS && (
        <SettingsView 
            onFileUpload={handleFileUpload}
            onUrlImport={handleUrlImport}
            onLoadSample={loadSampleData}
            onRefresh={handleRefresh}
            onClear={() => {
                setData(null);
                setSheetUrl("");
            }}
            sheetUrl={sheetUrl}
            setSheetUrl={setSheetUrl}
            isLoading={isLoading}
            error={error}
            currentUser={currentUser}
            theme={theme}
            setTheme={handleThemeChange}
        />
      )}
    </Layout>
  );
};

export default App;