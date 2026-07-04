import React, { useState } from 'react';
import { calculateCostsAndMargins } from '../utils/financialMath';
import { TrendingUp, Calculator, Users, Printer, DollarSign, Activity } from 'lucide-react';

export default function BusinessCalculator({ config, clients = [] }) {
  const [projectionVolume, setProjectionVolume] = useState(5000);

  // Recalculate metrics based on config (inputs removed, using saved settings)
  const currentConfig = {
    printerCost: Number(config.printerCost || 15000),
    sheetsCost: Number(config.sheetsCost || 320),
    stickersPerSheet: config.stickersPerSheet || 18,
    coversCost: Number(config.coversCost || 150),
    inkCostPerSheet: Number(config.inkCostPerSheet || 1.5)
  };

  const metrics = calculateCostsAndMargins(currentConfig);

  // Aggregate stickers printed across all clients
  const totalStickersPrinted = clients.reduce((acc, client) => acc + (client.stickersPrinted || 0), 0);
  
  // Calculate total business numbers based on actual clients
  let totalRevenue = 0;
  let totalMaterialCost = 0;
  let totalProfit = 0;

  clients.forEach(client => {
    const pkg = metrics.getPackageMetrics(client.stickersPrinted || 0, client.qrType);
    totalRevenue += pkg.revenue;
    totalMaterialCost += pkg.materialCost;
    totalProfit += pkg.profit;
  });

  // Calculation for projection sliders (assuming an average of 500 stickers per shop)
  const projShopsPerType = Math.ceil((projectionVolume / 2) / 500);
  const simpleProj = metrics.getPackageMetrics(projectionVolume / 2, 'simple', projShopsPerType);
  const advancedProj = metrics.getPackageMetrics(projectionVolume / 2, 'advanced', projShopsPerType);
  const blendedRevenue = simpleProj.revenue + advancedProj.revenue;
  const blendedCost = simpleProj.materialCost + advancedProj.materialCost;
  const blendedProfit = blendedRevenue - blendedCost;

  return (
    <div className="calculator-container" style={{ padding: '1rem 0' }}>
      <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ justifyContent: 'center', fontSize: '2.5rem', background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
          Performance Dashboard
        </h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Monitor your live business metrics and project future earnings in real-time.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        
        {/* Total Shops Card */}
        <div className="card glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1.25rem', boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)' }}>
            <Users size={40} style={{ color: '#a855f7' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Shops</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {clients.length}
          </p>
        </div>

        {/* Stickers Printed Card */}
        <div className="card glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1.25rem', boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)' }}>
            <Printer size={40} style={{ color: '#3b82f6' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Stickers Printed</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {totalStickersPrinted.toLocaleString()}
          </p>
        </div>

        {/* Total Revenue Card */}
        <div className="card glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1.25rem', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
            <Activity size={40} style={{ color: '#10b981' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Gross Revenue</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '3rem', fontWeight: '800', color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}>
            ₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Total Net Profit Card */}
        <div className="card glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', borderTop: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '1rem', borderRadius: '50%', marginBottom: '1.25rem', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>
            <DollarSign size={40} style={{ color: '#10b981' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Net Profit</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '3rem', fontWeight: '800', color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
            ₹{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

      </div>

      {/* Sales projections */}
      <div className="card glass-card projection-card" style={{ padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h3 style={{ justifyContent: 'center', fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            <TrendingUp className="icon-purple" size={28} /> Earnings Simulator
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Project your monthly revenue by adjusting your expected print volume.</p>
        </div>
        
        <div className="premium-slider-container">
          <input 
            type="range" 
            className="premium-slider"
            min="1000" 
            max="30000" 
            step="1000" 
            value={projectionVolume}
            onChange={(e) => setProjectionVolume(Number(e.target.value))}
          />
          <div className="volume-display-premium">{projectionVolume.toLocaleString()} stickers / month</div>
        </div>

        <div className="premium-proj-grid">
          <div className="premium-proj-col">
            <span className="premium-proj-title">Sheets Required</span>
            <span className="premium-proj-val">{Math.ceil(projectionVolume / 18)}</span>
            <span className="premium-proj-desc">Based on 18 stickers per A4 page</span>
          </div>
          <div className="premium-proj-col">
            <span className="premium-proj-title">Projected Revenue</span>
            <span className="premium-proj-val">₹{blendedRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="premium-proj-desc">50/50 mix of Type-1 & Type-2</span>
          </div>
          <div className="premium-proj-col">
            <span className="premium-proj-title">Material & Shipping</span>
            <span className="premium-proj-val">₹{blendedCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="premium-proj-desc">Paper, Ink & ₹10 Covers</span>
          </div>
          <div className="premium-proj-col highlighting-profit">
            <span className="premium-proj-title">Monthly Net Profit</span>
            <span className="premium-proj-val">₹{blendedProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="premium-proj-desc">Pure ROI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
