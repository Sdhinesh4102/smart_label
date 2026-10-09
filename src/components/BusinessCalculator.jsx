import React, { useState } from 'react';
import { calculateCostsAndMargins } from '../utils/financialMath';
import { TrendingUp, Calculator, Users, Printer, DollarSign, Activity } from 'lucide-react';

export default function BusinessCalculator({ config, onConfigChange, clients = [] }) {
  const [projectionVolume, setProjectionVolume] = useState(5000);
  const [projectionMix, setProjectionMix] = useState('50/50'); // '50/50', 'simple', 'advanced'

  // Recalculate metrics based on config (inputs removed, using saved settings)
  const currentConfig = {
    supplierUnitPrice: Number(config.supplierUnitPrice ?? 0.50),
    purchaseGstPercent: Number(config.purchaseGstPercent ?? 18),
    supplierMoq: Number(config.supplierMoq ?? 15000),
    freightPerOrder: Number(config.freightPerOrder ?? 0),
    priceType1: Number(config.priceType1 ?? 1.0),
    priceType2: Number(config.priceType2 ?? 2.0)
  };

  const handlePriceChange = (field, value) => {
    if (onConfigChange) {
      onConfigChange({
        ...config,
        [field]: field === 'supplierMoq' ? Math.max(1, Number(value) || 1) : Number(value)
      });
    }
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
  let blendedRevenue = 0;
  let blendedCost = 0;
  let blendedProfit = 0;
  let mixDesc = '';

  if (projectionMix === '50/50') {
    const simpleProj = metrics.getPackageMetrics(projectionVolume / 2, 'simple');
    const advancedProj = metrics.getPackageMetrics(projectionVolume / 2, 'advanced');
    blendedRevenue = simpleProj.revenue + advancedProj.revenue;
    blendedCost = simpleProj.materialCost + advancedProj.materialCost;
    blendedProfit = blendedRevenue - blendedCost;
    mixDesc = '50/50 mix of Type-1 & Type-2';
  } else if (projectionMix === 'simple') {
    const proj = metrics.getPackageMetrics(projectionVolume, 'simple');
    blendedRevenue = proj.revenue;
    blendedCost = proj.materialCost;
    blendedProfit = proj.profit;
    mixDesc = '100% Type-1 (Simple QR)';
  } else if (projectionMix === 'advanced') {
    const proj = metrics.getPackageMetrics(projectionVolume, 'advanced');
    blendedRevenue = proj.revenue;
    blendedCost = proj.materialCost;
    blendedProfit = proj.profit;
    mixDesc = '100% Type-2 (Advanced QR)';
  }

  return (
    <div className="calculator-container" style={{ padding: '1rem 0' }}>
      <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ justifyContent: 'center', fontSize: '2.5rem', background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
          Performance Dashboard
        </h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Estimates based on printed sticker counts. Check invoice history for payment status.</p>
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
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Estimated Billing</h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '3rem', fontWeight: '800', color: '#10b981', textShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}>
            ₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Total Net Profit Card */}
        <div className="card glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', borderTop: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '1rem', borderRadius: '50%', marginBottom: '1.25rem', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}>
            <DollarSign size={40} style={{ color: '#10b981' }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Estimated Contribution</h3>
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
          <p style={{ color: 'var(--text-secondary)' }}>Project sticker sales and supplier cash needs. Contribution excludes delivery to shops, prizes, labour and sales tax.</p>
        </div>
        
        {/* Pricing Config inline */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '2.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Type-1 Price (₹):</label>
            <input 
              type="number" 
              value={currentConfig.priceType1} 
              onChange={(e) => handlePriceChange('priceType1', e.target.value)}
              style={{ width: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white', color: '#1e293b', textAlign: 'center', fontWeight: 'bold' }}
              step="0.5"
              min="0.5"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Type-2 Price (₹):</label>
            <input 
              type="number" 
              value={currentConfig.priceType2} 
              onChange={(e) => handlePriceChange('priceType2', e.target.value)}
              style={{ width: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white', color: '#1e293b', textAlign: 'center', fontWeight: 'bold' }}
              step="0.5"
              min="0.5"
            />
          </div>
          {[
            ['Supplier label ex-GST (₹)', 'supplierUnitPrice', '0.01', '0'],
            ['Purchase GST (%)', 'purchaseGstPercent', '1', '0'],
            ['Supplier MOQ', 'supplierMoq', '1', '1'],
            ['Freight per supplier order (₹)', 'freightPerOrder', '1', '0']
          ].map(([label, field, step, min]) => (
            <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>{label}:</label>
              <input type="number" value={currentConfig[field]} onChange={(e) => handlePriceChange(field, e.target.value)}
                style={{ width: '90px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white', color: '#1e293b', textAlign: 'center', fontWeight: 'bold' }}
                step={step} min={min} />
            </div>
          ))}
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
          
          {/* Projection Mix Selection */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="radio" name="mix" value="simple" checked={projectionMix === 'simple'} onChange={(e) => setProjectionMix(e.target.value)} />
              100% Type-1
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="radio" name="mix" value="50/50" checked={projectionMix === '50/50'} onChange={(e) => setProjectionMix(e.target.value)} />
              50/50 Mix
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="radio" name="mix" value="advanced" checked={projectionMix === 'advanced'} onChange={(e) => setProjectionMix(e.target.value)} />
              100% Type-2
            </label>
          </div>
        </div>

        <div className="premium-proj-grid">
          <div className="premium-proj-col">
            <span className="premium-proj-title">Supplier Cash to Order</span>
            <span className="premium-proj-val">₹{metrics.getSupplierCashOutlay(projectionVolume).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className="premium-proj-desc">MOQ {currentConfig.supplierMoq.toLocaleString()} labels per order; includes purchase GST and entered freight</span>
          </div>
          <div className="premium-proj-col">
            <span className="premium-proj-title">Projected Revenue</span>
            <span className="premium-proj-val">₹{blendedRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="premium-proj-desc">{mixDesc}</span>
          </div>
          <div className="premium-proj-col">
            <span className="premium-proj-title">Allocated Supplier Cost</span>
            <span className="premium-proj-val">₹{blendedCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="premium-proj-desc">Labels, purchase GST and entered freight</span>
          </div>
          <div className="premium-proj-col highlighting-profit">
            <span className="premium-proj-title">Projected Contribution</span>
            <span className="premium-proj-val">₹{blendedProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="premium-proj-desc">Before delivery, prizes, labour and sales tax</span>
          </div>
        </div>
      </div>
    </div>
  );
}
