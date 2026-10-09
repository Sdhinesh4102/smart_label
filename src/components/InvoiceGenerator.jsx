import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Printer, Upload, Download, FileText } from 'lucide-react';
import { getNextInvoiceNumberAsync, saveInvoiceAsync } from '../utils/api';

export default function InvoiceGenerator({ selectedClient }) {
  // Load saved 'From' details
  const [fromDetails, setFromDetails] = useState(() => {
    const saved = localStorage.getItem('invoiceFromDetails');
    return saved ? JSON.parse(saved) : {
      name: '',
      email: '',
      phone: '',
      address: '',
      website: ''
    };
  });

  // Invoice Meta
  const [invoiceMeta, setInvoiceMeta] = useState(() => {
    const nextNum = parseInt(localStorage.getItem('nextInvoiceNum')) || 1;
    return {
      number: `INV-${String(nextNum).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
  });
  const [numberReady, setNumberReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getNextInvoiceNumberAsync().then(number => {
      if (active) {
        setInvoiceMeta(meta => ({ ...meta, number }));
        setNumberReady(true);
      }
    }).catch(error => {
      console.error('Could not load invoice number:', error);
      if (active) setNumberReady(false);
    });
    return () => { active = false; };
  }, []);

  // Logo & Positioning
  const [logo, setLogo] = useState(() => localStorage.getItem('invoiceLogo') || null);
  const [savedLogoSettings, setSavedLogoSettings] = useState(() => {
    const saved = localStorage.getItem('invoiceLogoSettings');
    return saved ? JSON.parse(saved) : { scale: 1, x: 0, y: 0 };
  });

  const [showLogoModal, setShowLogoModal] = useState(false);
  const [tempLogo, setTempLogo] = useState(null);
  const [logoScale, setLogoScale] = useState(1);
  const [logoX, setLogoX] = useState(0);
  const [logoY, setLogoY] = useState(0);

  // 'To' Details (Pre-fill if client selected, but keep editable)
  const [toDetails, setToDetails] = useState({
    name: selectedClient ? selectedClient.name : '',
    email: selectedClient ? selectedClient.email || '' : '',
    phone: selectedClient ? selectedClient.whatsapp || '' : '',
    address: selectedClient ? selectedClient.address || '' : ''
  });

  // Reset To details when client changes
  useEffect(() => {
    if (selectedClient) {
      setToDetails({
        name: selectedClient.name || '',
        email: selectedClient.email || '',
        phone: selectedClient.whatsapp || '',
        address: selectedClient.address || ''
      });
    }
  }, [selectedClient]);

  // Items
  const [items, setItems] = useState([
    { id: 1, description: 'Smart QR Promo Stickers (Type-1)', quantity: 1000, rate: 1.0 }
  ]);

  // Totals & Settings
  const [taxRate, setTaxRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  
  // Footer text
  const [notes, setNotes] = useState('Thank you for your business!');
  const [terms, setTerms] = useState('Payment is due within 7 days. Please make checks payable to our company.');

  // Save 'From' details and Logo when they change
  useEffect(() => {
    localStorage.setItem('invoiceFromDetails', JSON.stringify(fromDetails));
  }, [fromDetails]);

  useEffect(() => {
    if (logo) {
      localStorage.setItem('invoiceLogo', logo);
    }
  }, [logo]);

  // Handlers
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempLogo(event.target.result);
        setLogoScale(1);
        setLogoX(0);
        setLogoY(0);
        setShowLogoModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveLogoAdjustment = () => {
    setLogo(tempLogo);
    const settings = { scale: Number(logoScale), x: Number(logoX), y: Number(logoY) };
    setSavedLogoSettings(settings);
    localStorage.setItem('invoiceLogoSettings', JSON.stringify(settings));
    setShowLogoModal(false);
  };

  const handleFromChange = (field, value) => setFromDetails({ ...fromDetails, [field]: value });
  const handleToChange = (field, value) => setToDetails({ ...toDetails, [field]: value });
  const handleMetaChange = (field, value) => setInvoiceMeta({ ...invoiceMeta, [field]: value });

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: field === 'description' ? value : Number(value) } : item));
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount - Number(discountAmount);

  const printInvoice = async () => {
    if (!numberReady || isSaving) return;
    setIsSaving(true);
    const isValidUuid = selectedClient && selectedClient.id && String(selectedClient.id).length > 10;

    // Recheck the database immediately before saving. Local storage can be
    // stale after switching browsers or another admin creating an invoice.
    let number;
    try {
      number = await getNextInvoiceNumberAsync();
    } catch (error) {
      console.error('Could not check invoice number:', error);
      alert('Could not check the next invoice number. Please try again.');
      setIsSaving(false);
      return;
    }
    const saved = await saveInvoiceAsync({
      invoice_number: number,
      client_id: isValidUuid ? selectedClient.id : null,
      client_name: toDetails.name || 'Unknown Client',
      date: invoiceMeta.date,
      due_date: invoiceMeta.dueDate,
      total_amount: total,
      status: 'Unpaid',
      items: items
    });

    if (!saved) {
      setIsSaving(false);
      return;
    }
    setInvoiceMeta(meta => ({ ...meta, number }));
    localStorage.setItem('nextInvoiceNum', Number(number.slice(4)) + 1);

    // Let React render the saved number before the print dialog opens.
    setTimeout(() => {
      window.print();
      setIsSaving(false);
    }, 100);
  };

  return (
    <div className="invoice-generator-wrapper" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
      
      {showLogoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Adjust Logo Frame</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Scale and position your logo perfectly.</p>
            
            <div style={{ width: '250px', height: '100px', border: '2px dashed #ccc', borderRadius: '8px', margin: '0 auto 2rem auto', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', background: '#f9fafb' }}>
              <img src={tempLogo} style={{ transform: `scale(${logoScale}) translate(${logoX}px, ${logoY}px)`, transformOrigin: 'center left', transition: 'none', maxWidth: 'none', maxHeight: 'none' }} />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}><span>Scale / Zoom</span> <span>{logoScale}x</span></label>
              <input type="range" min="0.2" max="3" step="0.1" value={logoScale} onChange={e => setLogoScale(e.target.value)} style={{ width: '100%', cursor: 'pointer' }} />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}><span>Horizontal Position</span> <span>{logoX}px</span></label>
              <input type="range" min="-200" max="200" value={logoX} onChange={e => setLogoX(e.target.value)} style={{ width: '100%', cursor: 'pointer' }} />
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}><span>Vertical Position</span> <span>{logoY}px</span></label>
              <input type="range" min="-200" max="200" value={logoY} onChange={e => setLogoY(e.target.value)} style={{ width: '100%', cursor: 'pointer' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowLogoModal(false)} style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={saveLogoAdjustment} style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Save Layout</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText className="icon-purple" size={28} />
            Invoice Generator
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>Create professional invoices for your clients.</p>
        </div>
        <button className="hide-on-print" onClick={printInvoice} disabled={!numberReady || isSaving} style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white', border: 'none', padding: '0.75rem 1.5rem',
          borderRadius: '50px', fontWeight: '600',
          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
          cursor: numberReady && !isSaving ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease',
          textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Printer size={18} /> {isSaving ? 'Saving...' : numberReady ? 'Download / Print PDF' : 'Invoice Number Unavailable'}
        </button>
      </div>

      <div className="invoice-paper" style={{ background: 'white', color: '#1a1a1a', padding: '3rem', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        
        {/* Header Row: Logo & Invoice Text */}
        <div className="invoice-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
          <div className="invoice-logo-section" style={{ width: '250px' }}>
            {logo ? (
              <div style={{ position: 'relative', width: '250px', height: '100px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <img src={logo} alt="Company Logo" style={{ transform: `scale(${savedLogoSettings.scale}) translate(${savedLogoSettings.x}px, ${savedLogoSettings.y}px)`, transformOrigin: 'center left', maxWidth: 'none', maxHeight: 'none' }} />
                <button className="hide-on-print" onClick={() => setLogo(null)} style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', zIndex: 10 }}>×</button>
              </div>
            ) : (
              <label className="hide-on-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '200px', height: '100px', border: '2px dashed #ccc', borderRadius: '8px', cursor: 'pointer', color: '#666' }}>
                <Upload size={24} style={{ marginBottom: '0.5rem' }} />
                <span>Upload Logo</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          
          <div className="invoice-title-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <h1 style={{ fontSize: '3rem', margin: 0, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800', marginBottom: '1.5rem' }}>INVOICE</h1>
            
            <table style={{ borderCollapse: 'collapse', textAlign: 'right' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingRight: '1rem', paddingBottom: '0.5rem' }}>Invoice #</td>
                  <td style={{ paddingBottom: '0.5rem' }}>
                    <input className="invoice-input text-right hide-on-print" style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1rem', width: '140px', padding: 0 }} value={invoiceMeta.number} readOnly />
                    <span className="print-only" style={{ display: 'none', fontWeight: 'bold', color: '#0f172a', fontSize: '1rem' }}>{invoiceMeta.number}</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingRight: '1rem', paddingBottom: '0.5rem' }}>Date</td>
                  <td style={{ paddingBottom: '0.5rem' }}>
                    <input type="date" className="invoice-input text-right hide-on-print" style={{ color: '#334155', fontWeight: '500', width: '140px', padding: 0 }} value={invoiceMeta.date} onChange={e => handleMetaChange('date', e.target.value)} />
                    <span className="print-only" style={{ display: 'none', color: '#334155', fontWeight: '500' }}>{invoiceMeta.date}</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingRight: '1rem' }}>Due Date</td>
                  <td>
                    <input type="date" className="invoice-input text-right hide-on-print" style={{ color: '#334155', fontWeight: '500', width: '140px', padding: 0 }} value={invoiceMeta.dueDate} onChange={e => handleMetaChange('dueDate', e.target.value)} />
                    <span className="print-only" style={{ display: 'none', color: '#334155', fontWeight: '500' }}>{invoiceMeta.dueDate}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Addresses Row */}
        <div className="invoice-addresses" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem' }}>From:</div>
            <input className="invoice-input bold text-lg" placeholder="Your Company Name" style={{ color: '#0f172a' }} value={fromDetails.name} onChange={e => handleFromChange('name', e.target.value)} />
            <input className="invoice-input" placeholder="Your Name / Email" value={fromDetails.email} onChange={e => handleFromChange('email', e.target.value)} />
            <input className="invoice-input" placeholder="Phone Number" value={fromDetails.phone} onChange={e => handleFromChange('phone', e.target.value)} />
            <textarea className="invoice-textarea" placeholder="Address" value={fromDetails.address} onChange={e => handleFromChange('address', e.target.value)} rows={2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Bill To:</div>
            <input className="invoice-input bold text-lg" placeholder="Client Name" style={{ color: '#0f172a' }} value={toDetails.name} onChange={e => handleToChange('name', e.target.value)} />
            <input className="invoice-input" placeholder="Client Email" value={toDetails.email} onChange={e => handleToChange('email', e.target.value)} />
            <input className="invoice-input" placeholder="Client Phone" value={toDetails.phone} onChange={e => handleToChange('phone', e.target.value)} />
            <textarea className="invoice-textarea" placeholder="Client Address" value={toDetails.address} onChange={e => handleToChange('address', e.target.value)} rows={2} />
          </div>
        </div>

        {/* Line Items */}
        <div className="invoice-items" style={{ marginBottom: '2rem' }}>
          <div className="invoice-items-header" style={{ display: 'grid', gridTemplateColumns: '4fr 1fr 1fr 1fr 40px', background: '#f8fafc', color: '#475569', padding: '1rem', borderTop: '2px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <div>Description</div>
            <div style={{ textAlign: 'center' }}>Rate (₹)</div>
            <div style={{ textAlign: 'center' }}>Qty</div>
            <div style={{ textAlign: 'right' }}>Amount</div>
            <div></div>
          </div>
          
          {items.map((item, index) => (
            <div key={item.id} className="invoice-item-row" style={{ display: 'grid', gridTemplateColumns: '4fr 1fr 1fr 1fr 40px', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', alignItems: 'center', color: '#334155' }}>
              <select 
                className="invoice-input" 
                value={item.description} 
                onChange={e => {
                  const val = e.target.value;
                  updateItem(item.id, 'description', val);
                  if (val.includes('Type-1')) updateItem(item.id, 'rate', 1.0);
                  if (val.includes('Type-2')) updateItem(item.id, 'rate', 2.0);
                }}
                style={{ cursor: 'pointer' }}
              >
                <option value="Smart QR Promo Stickers (Type-1)">Smart QR Promo Stickers (Type-1)</option>
                <option value="Advanced QR Promo Stickers (Type-2)">Advanced QR Promo Stickers (Type-2)</option>
                <option value="Custom Service / Setup Fee">Custom Service / Setup Fee</option>
                <option value="Shipping & Packaging">Shipping & Packaging</option>
              </select>
              <div style={{ padding: '0 0.5rem' }}>
                <input type="number" className="invoice-input text-center" value={item.rate} onChange={e => updateItem(item.id, 'rate', e.target.value)} />
              </div>
              <div style={{ padding: '0 0.5rem' }}>
                <input type="number" className="invoice-input text-center" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} />
              </div>
              <div style={{ textAlign: 'right', paddingRight: '0.5rem' }}>
                ₹{(item.rate * item.quantity).toFixed(2)}
              </div>
              <div className="hide-on-print" style={{ textAlign: 'right' }}>
                <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          <button 
            className="hide-on-print" 
            onClick={addItem} 
            style={{ 
              marginTop: '1.5rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)', 
              color: 'white', 
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '50px',
              fontWeight: '600',
              boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.85rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={18} /> Add New Item
          </button>
        </div>

        {/* Totals & Notes */}
        <div className="invoice-totals-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '3rem', paddingTop: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Notes</div>
              <textarea className="invoice-textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ background: '#f8fafc', color: '#334155' }} />
            </div>
            <div>
              <div style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Terms & Conditions</div>
              <textarea className="invoice-textarea" value={terms} onChange={e => setTerms(e.target.value)} rows={3} style={{ background: '#f8fafc', color: '#334155' }} />
            </div>
          </div>
          
          <div className="invoice-totals-section" style={{ width: '320px', color: '#334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b' }}>Subtotal</span>
              <span style={{ fontWeight: '500' }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Tax
                <input type="number" className="invoice-input hide-on-print" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} style={{ width: '60px', background: '#f8fafc', padding: '4px' }} />
                <span className="hide-on-print">%</span>
                <span className="print-only" style={{ display: 'none' }}>({taxRate}%)</span>
              </span>
              <span style={{ fontWeight: '500' }}>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '2px solid #cbd5e1', alignItems: 'center' }}>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Discount (₹)
                <input type="number" className="invoice-input hide-on-print" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} style={{ width: '80px', background: '#f8fafc', padding: '4px' }} />
              </span>
              <span style={{ color: '#ef4444', fontWeight: '500' }}>- ₹{Number(discountAmount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem 0', fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
