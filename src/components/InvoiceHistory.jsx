import React, { useState, useEffect } from 'react';
import { getInvoicesAsync, updateInvoiceStatusAsync, deleteInvoiceAsync } from '../utils/api';
import { FileText, Trash2, Clock, CheckCircle, AlertCircle, Download, FileJson, FileSpreadsheet, Printer } from 'lucide-react';
import { csvCell } from '../utils/vendorExport';
import { escapeHtml } from '../utils/escapeHtml';

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    const data = await getInvoicesAsync();
    setInvoices(data);
    setLoading(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    const success = await updateInvoiceStatusAsync(id, newStatus);
    if (success) {
      setInvoices(invoices.map(inv => 
        inv.id === id ? { ...inv, status: newStatus } : inv
      ));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice record?")) {
      const success = await deleteInvoiceAsync(id);
      if (success) {
        setInvoices(invoices.filter(inv => inv.id !== id));
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return { bg: '#dcfce7', text: '#166534', icon: <CheckCircle size={14} /> };
      case 'Partially Paid': return { bg: '#fef9c3', text: '#854d0e', icon: <Clock size={14} /> };
      case 'Unpaid': default: return { bg: '#fee2e2', text: '#991b1b', icon: <AlertCircle size={14} /> };
    }
  };

  const triggerDownload = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setShowExportMenu(false);
  };

  const exportJSON = () => {
    const data = JSON.stringify(invoices, null, 2);
    triggerDownload(data, `invoices_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const exportCSV = () => {
    const headers = ['Invoice Number', 'Client', 'Date', 'Due Date', 'Total Amount', 'Status'];
    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.client_name,
      inv.date,
      inv.due_date,
      inv.total_amount,
      inv.status
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
    triggerDownload(csvContent, `invoices_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportWord = () => {
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Invoice History</title></head>
      <body>
        <h2>Invoice History</h2>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th>Invoice #</th><th>Client</th><th>Date</th><th>Amount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(inv => `
              <tr>
                <td>${escapeHtml(inv.invoice_number)}</td>
                <td>${escapeHtml(inv.client_name)}</td>
                <td>${escapeHtml(new Date(inv.date).toLocaleDateString())}</td>
                <td>${escapeHtml(inv.total_amount)}</td>
                <td>${escapeHtml(inv.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    triggerDownload(html, `invoices_${new Date().toISOString().split('T')[0]}.doc`, 'application/msword');
  };

  const exportPDF = () => {
    setShowExportMenu(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>Loading invoices...</div>;
  }

  return (
    <div className="invoice-history-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div className="hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: '#0f172a', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText className="icon-purple" />
            Invoice History
          </h2>
          <p style={{ color: '#64748b', margin: 0 }}>Track payments and manage all generated invoices.</p>
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)', transition: 'transform 0.1s' }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Download size={18} /> Export Data
          </button>
          
          {showExportMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', width: '220px', zIndex: 50, overflow: 'hidden' }}>
              <button onClick={exportJSON} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500', fontSize: '0.9rem' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><FileJson size={16} color="#3b82f6" /> JSON Format</button>
              <button onClick={exportCSV} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500', fontSize: '0.9rem' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><FileSpreadsheet size={16} color="#10b981" /> Excel (CSV)</button>
              <button onClick={exportWord} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500', fontSize: '0.9rem' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><FileText size={16} color="#8b5cf6" /> Word Document</button>
              <button onClick={exportPDF} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500', fontSize: '0.9rem' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Printer size={16} color="#ef4444" /> Print / Save as PDF</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>Invoice #</th>
              <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>Client</th>
              <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>Amount</th>
              <th style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>Status</th>
              <th className="hide-on-print" style={{ padding: '1rem 1.5rem', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  No invoices generated yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const statusStyle = getStatusColor(inv.status);
                return (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{inv.invoice_number}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#334155', fontWeight: '500' }}>{inv.client_name}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.95rem' }}>
                      <div style={{ marginBottom: '0.25rem' }}>{new Date(inv.date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Due: {new Date(inv.due_date).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{formatCurrency(inv.total_amount)}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <select 
                        className="print-no-appearance"
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        style={{ 
                          padding: '0.5rem 2rem 0.5rem 0.75rem', 
                          borderRadius: '9999px', 
                          border: 'none', 
                          backgroundColor: statusStyle.bg, 
                          color: statusStyle.text,
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          outline: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(statusStyle.text)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1em'
                        }}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </td>
                    <td className="hide-on-print" style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(inv.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Delete Invoice Record"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
