import React, { useState, useEffect } from 'react';
import { 
  getPrinterConfig, 
  savePrinterConfig 
} from './utils/localStorage';
import { getClientsAsync, getPublicClientAsync } from './utils/api';
import BusinessCalculator from './components/BusinessCalculator';
import ClientManager from './components/ClientManager';
import QRStickerGenerator from './components/QRStickerGenerator';
import CustomerStoreView from './components/CustomerStoreView';
import InvoiceGenerator from './components/InvoiceGenerator';
import InvoiceHistory from './components/InvoiceHistory';
import { 
  QrCode, 
  Calculator, 
  ShoppingBag, 
  Eye, 
  Layers, 
  HelpCircle,
  ExternalLink,
  FileText,
  LogOut,
  History,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';

// Helper to parse routes from URL hash
const parseHashRoute = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#/store/')) {
    // Format: #/store/client-id?coupon=XYZ
    const cleanHash = hash.replace('#/store/', '');
    const parts = cleanHash.split('?');
    const clientId = parts[0];
    let coupon = '';
    let qrId = '';
    
    if (parts[1]) {
      const searchParams = new URLSearchParams(parts[1]);
      coupon = searchParams.get('coupon') || '';
      qrId = searchParams.get('qr_id') || '';
    }
    
    return {
      type: 'store',
      clientId,
      coupon,
      qrId
    };
  }
  const cleanHash = hash.replace('#', '');
  const validTabs = ['calculator', 'clients', 'invoice', 'invoice_history', 'generator', 'simulator'];
  
  if (validTabs.includes(cleanHash)) {
    return { type: 'dashboard', tab: cleanHash };
  }

  return {
    type: 'dashboard',
    tab: 'calculator'
  };
};

export default function App() {
  const { user, signOut } = useAuth();
  const [clients, setClients] = useState([]);
  const [publicClient, setPublicClient] = useState(null);
  const [publicClientLoading, setPublicClientLoading] = useState(false);
  const [publicClientError, setPublicClientError] = useState(false);
  const [config, setConfig] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Routing State
  const [route, setRoute] = useState(parseHashRoute);
  const activeTab = route.type === 'dashboard' ? route.tab : 'calculator';
  
  const setActiveTab = (tab) => {
    window.location.hash = tab;
  };
  const [simulatedWin, setSimulatedWin] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load local printer preferences and track URL changes.
  useEffect(() => {
    setConfig(getPrinterConfig());

    // Listen to hash changes (for client-side routing)
    const handleHashChange = () => {
      setRoute(parseHashRoute());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    let active = true;
    if (route.type === 'store') {
      setPublicClient(null);
      setPublicClientLoading(true);
      setPublicClientError(false);
      getPublicClientAsync(route.clientId).then(client => {
        if (active) setPublicClient(client);
      }).catch(error => {
        console.error('Could not load public store:', error);
        if (active) setPublicClientError(true);
      }).finally(() => {
        if (active) setPublicClientLoading(false);
      });
    } else if (user) {
      getClientsAsync().then(loadedClients => {
        if (active) setClients(loadedClients);
      });
    }
    return () => { active = false; };
  }, [route.type, route.clientId, user]);

  // Update client list state (API save handled by ClientManager)
  const handleSaveClients = (newClients) => {
    setClients(newClients);
  };

  // Update configuration
  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    savePrinterConfig(newConfig);
  };

  // Route specifically to print screen
  const handleSelectClientForPrint = (client) => {
    setSelectedClient(client);
    setActiveTab('generator');
  };

  // Route specifically to simulator screen
  const handleSelectClientForSimulate = (client) => {
    setSelectedClient(client);
    setActiveTab('simulator');
  };

  if (!config) {
    return <div className="app-loading">Loading configuration data...</div>;
  }

  // --- 1. RENDER STANDALONE CUSTOMER SCAN PAGE ---
  if (route.type === 'store') {
    if (publicClientLoading) return <div className="app-loading">Loading store...</div>;
    if (publicClientError) return <div className="app-loading">Store information is temporarily unavailable. Please try again shortly.</div>;
    return (
      <CustomerStoreView 
        client={publicClient}
        simulatedCouponCode={route.coupon} 
        scanQrId={route.qrId}
        isMock={false} 
      />
    );
  }

  // --- 2. AUTHENTICATION GUARD ---
  if (!user) {
    return <AuthScreen />;
  }

  // --- 3. RENDER BUSINESS ADMINISTRATION PANEL ---
  return (
    <div className="app-container">
      {/* Navigation Shell */}
      <header className="app-navbar hide-on-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            className="mobile-menu-btn hide-on-print" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="nav-brand">
            <QrCode size={24} className="icon-purple" />
            <span>Smart QR Promo Suite</span>
          </div>
        </div>

        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <button 
            className={`nav-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => { setActiveTab('calculator'); setIsMenuOpen(false); }}
          >
            <Calculator size={16} /> Dashboard & Projections
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => { setActiveTab('clients'); setIsMenuOpen(false); }}
          >
            <ShoppingBag size={16} /> Store Client Manager
          </button>

          <button 
            className={`nav-btn ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => { setActiveTab('invoice'); setIsMenuOpen(false); }}
          >
            <FileText size={16} /> Invoice Generator
          </button>

          <button 
            className={`nav-btn ${activeTab === 'invoice_history' ? 'active' : ''}`}
            onClick={() => { setActiveTab('invoice_history'); setIsMenuOpen(false); }}
          >
            <History size={16} /> Invoice History
          </button>

          <button 
            className={`nav-btn ${activeTab === 'generator' ? 'active' : ''} ${!selectedClient ? 'disabled-tab' : ''}`}
            onClick={() => { selectedClient && setActiveTab('generator'); setIsMenuOpen(false); }}
            title={!selectedClient ? 'Select a store in the Client Manager first' : ''}
            disabled={!selectedClient}
          >
            <Layers size={16} /> Sheet Printer Layout
          </button>

          <button 
            className={`nav-btn ${activeTab === 'simulator' ? 'active' : ''} ${!selectedClient ? 'disabled-tab' : ''}`}
            onClick={() => { selectedClient && setActiveTab('simulator'); setIsMenuOpen(false); }}
            title={!selectedClient ? 'Select a store in the Client Manager first' : ''}
            disabled={!selectedClient}
          >
            <Eye size={16} /> Scan View Simulator
          </button>
          
          <button 
            className="nav-btn"
            style={{ marginLeft: 'auto', color: '#ef4444' }}
            onClick={() => { signOut(); setIsMenuOpen(false); }}
          >
            <LogOut size={16} /> Logout
          </button>
        </nav>
      </header>

      {/* Main Panel Content */}
      <main className="app-content">
        {activeTab === 'calculator' && (
          <BusinessCalculator 
            config={config} 
            onConfigChange={handleSaveConfig} 
            clients={clients} 
          />
        )}

        {activeTab === 'clients' && (
          <ClientManager 
            clients={clients} 
            onSaveClients={handleSaveClients} 
            onSelectClient={handleSelectClientForPrint}
            onViewSimulator={handleSelectClientForSimulate}
          />
        )}

        {activeTab === 'invoice' && (
          <InvoiceGenerator selectedClient={selectedClient} />
        )}

        {activeTab === 'invoice_history' && (
          <InvoiceHistory />
        )}

        {activeTab === 'generator' && selectedClient && (
          <QRStickerGenerator 
            client={selectedClient} 
            config={config} 
            onConfigChange={handleSaveConfig} 
          />
        )}

        {activeTab === 'simulator' && selectedClient && (
          <div className="simulator-view-container">
            <div className="section-header hide-on-print">
              <h2><Eye className="icon-purple" /> Consumer Experience Simulator</h2>
              <p>Preview what customers see when scanning stickers printed for <strong>{selectedClient.name}</strong>.</p>
            </div>
            
            <div className="simulator-flex-layout">
              {/* Simulator Settings (Left side) */}
              <div className="card glass-card simulator-controls-side hide-on-print">
                <h3>Simulator Controls</h3>
                
                <div className="sim-details-item">
                  <span>Store Name:</span>
                  <strong>{selectedClient.name}</strong>
                </div>

                <div className="sim-details-item">
                  <span>Service Type:</span>
                  <span className={`badge ${selectedClient.qrType === 'simple' ? 'badge-blue' : 'badge-purple'}`}>
                    {selectedClient.qrType === 'simple' ? 'Type 1: Simple QR' : 'Type 2: Advanced QR'}
                  </span>
                </div>

                {selectedClient.qrType === 'advanced' && (
                  <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label>Simulated Scanner Result:</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="radio" 
                          name="simWin" 
                          checked={simulatedWin === true} 
                          onChange={() => setSimulatedWin(true)} 
                        />
                        Winner (Reward: {selectedClient.rewardCode})
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="radio" 
                          name="simWin" 
                          checked={simulatedWin === false} 
                          onChange={() => setSimulatedWin(false)} 
                        />
                        Loser (Try Again)
                      </label>
                    </div>
                  </div>
                )}

                {/* Removed obsolete standalone simulator links */}
              </div>

              {/* The Mobile mock frame (Right side) */}
              <div className="simulator-phone-preview">
                <CustomerStoreView 
                  client={selectedClient} 
                  simulatedCouponCode={selectedClient.rewardCode || 'BOGOJUICE'} 
                  simulatedWin={selectedClient.qrType === 'simple' ? true : simulatedWin}
                  isMock={true} 
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Styled styles injection for custom configurations */}
      <style>{`
        .disabled-tab {
          opacity: 0.4;
          cursor: not-allowed !important;
        }
        .simulator-flex-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 1.5rem;
        }
        .sim-details-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .sim-live-link-box {
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-color);
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .app-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.2rem;
          color: var(--text-secondary);
        }
        @media (max-width: 900px) {
          .simulator-flex-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
