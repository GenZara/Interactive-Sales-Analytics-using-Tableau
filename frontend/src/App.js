/**
 * Root App — routing, providers, PDF export, topbar.
 */
import React, { useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { FilterProvider } from './context/FilterContext';
import Sidebar from './components/Sidebar';
import Overview  from './pages/Overview';
import Analytics from './pages/Analytics';
import Customers from './pages/Customers';
import { MdDownload } from 'react-icons/md';
import { useFilters } from './context/FilterContext';
import { api } from './services/api';

const PAGE_META = {
  '/':           { title: 'Dashboard Overview',  subtitle: 'Executive summary & KPIs' },
  '/analytics':  { title: 'Sales Analytics',     subtitle: 'Deep-dive performance metrics' },
  '/customers':  { title: 'Customer Insights',   subtitle: 'Segment & behaviour analysis' },
};

function AppShell() {
  const location = useLocation();
  const meta     = PAGE_META[location.pathname] || PAGE_META['/'];
  const { effectiveFilters } = useFilters();

  const handleExport = useCallback(async (type = 'pdf') => {
    const tid = toast.loading(`Generating ${type.toUpperCase()}…`);
    try {
      if (type === 'csv') {
        const r = await api.getSales(effectiveFilters, 1, 10000); // Get bulk data
        const data = r.data.data;
        if (!data.length) throw new Error("No data found");
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(item => Object.values(item).map(v => typeof v === 'string' ? `"${v}"` : v).join(',')).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV Downloaded!', { id: tid });
        return;
      }

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const el = document.querySelector('.main-content');
      if (!el) throw new Error("Content not found");

      // Temporarily expand to capture full content
      const oldH = el.style.height;
      const oldOver = el.style.overflow;
      el.style.height = 'auto';
      el.style.overflow = 'visible';

      const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: '#05060b' });
      
      el.style.height = oldH;
      el.style.overflow = oldOver;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4'); 
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, pdfW, Math.min(pdfH, 297)); 
      
      let heightLeft = pdfH - 297;
      while (heightLeft > 0) {
        position -= 297;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfW, pdfH);
        heightLeft -= 297;
      }
      
      pdf.save(meta.title.replace(/\s+/g, '_') + '.pdf');
      toast.success('PDF downloaded!', { id: tid });
    } catch (err) {
      toast.error('Export failed: ' + err.message, { id: tid });
    }
  }, [meta.title, effectiveFilters]);

  return (
    <div className="app-shell">
      <Sidebar onExport={handleExport} />

      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">{meta.title}</div>
            <div className="topbar-subtitle">{meta.subtitle}</div>
          </div>
          <div className="topbar-actions">
          </div>
        </header>

        {/* Page content */}
        <Routes>
          <Route path="/"           element={<Overview />}  />
          <Route path="/analytics"  element={<Analytics />} />
          <Route path="/customers"  element={<Customers />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FilterProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
            }}
          />
          <AppShell />
        </BrowserRouter>
      </FilterProvider>
    </ThemeProvider>
  );
}
