import React, { useState } from 'react';
import { Plus, Trash2, Edit2, ShoppingBag, Eye, QrCode, Save, X } from 'lucide-react';
import { saveClientAsync, deleteClientAsync } from '../utils/api';

export default function ClientManager({ clients, onSaveClients, onSelectClient, onViewSimulator }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [website, setWebsite] = useState('');
  const [qrType, setQrType] = useState('simple');
  const [packageSize, setPackageSize] = useState(500);
  const [stickersPrinted, setStickersPrinted] = useState(0);
  const [rewardCode, setRewardCode] = useState('');
  const [rewardCount, setRewardCount] = useState(1);
  const [offerText, setOfferText] = useState('');
  const [logoData, setLogoData] = useState(null);

  // Reset form
  const resetForm = () => {
    setName('');
    setLocationUrl('');
    setInstagram('');
    setWhatsapp('');
    setFacebook('');
    setWebsite('');
    setQrType('simple');
    setPackageSize(500);
    setStickersPrinted(0);
    setRewardCode('');
    setRewardCount(1);
    setOfferText('');
    setLogoData(null);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const clientData = {
      id: editingId || null,
      name: name.trim(),
      locationUrl: locationUrl.trim() || 'https://maps.google.com',
      instagram: instagram.trim(),
      whatsapp: whatsapp.trim(),
      facebook: facebook.trim(),
      website: website.trim(),
      qrType,
      rewardCode: qrType === 'advanced' ? rewardCode.trim().toUpperCase() : '',
      rewardCount: qrType === 'advanced' ? Number(rewardCount) : 0,
      offerText: qrType === 'advanced' ? offerText.trim() : '',
      packageSize: Number(packageSize),
      stickersPrinted: Number(stickersPrinted),
      logoData,
      createdDate: editingId ? (clients.find(c => c.id === editingId)?.createdDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
    };

    // Save to Supabase API
    const savedClient = await saveClientAsync(clientData);
    if (!savedClient) {
      alert("Failed to save to database. Check connection.");
      return;
    }

    if (editingId) {
      // Edit local state
      const updated = clients.map(c => c.id === editingId ? savedClient : c);
      onSaveClients(updated);
    } else {
      // Create local state
      onSaveClients([...clients, savedClient]);
    }
    resetForm();
  };

  const handleStartEdit = (client) => {
    setEditingId(client.id);
    setName(client.name);
    setLocationUrl(client.locationUrl);
    setInstagram(client.instagram || '');
    setWhatsapp(client.whatsapp || '');
    setFacebook(client.facebook || '');
    setWebsite(client.website || '');
    setQrType(client.qrType);
    setPackageSize(client.packageSize);
    setStickersPrinted(client.stickersPrinted || 0);
    setRewardCode(client.rewardCode || '');
    setRewardCount(client.rewardCount || 1);
    setOfferText(client.offerText || '');
    setLogoData(client.logoData || null);
    setIsAdding(true);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setLogoData(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this store profile?')) {
      const result = await deleteClientAsync(id);
      if (result.success) {
        onSaveClients(clients.filter(c => c.id !== id));
      } else if (result.reason === 'has_qrs') {
        alert('This store has QR batches. Deleting it would break stickers already in circulation, so it cannot be deleted.');
      } else {
        alert('Could not safely delete this store. Please try again later.');
      }
    }
  };

  return (
    <div className="client-manager-container">
      <div className="section-header-row">
        <div className="section-header">
          <h2>
            <ShoppingBag className="icon-purple" /> Store Clients Profile Directory
          </h2>
          <p>Register local shops, configure social/map targets, and manage coupon plans.</p>
        </div>
        {!isAdding && (
          <button className="btn btn-primary btn-icon" onClick={() => setIsAdding(true)}>
            <Plus size={18} /> Add New Store
          </button>
        )}
      </div>

      {isAdding && (
        <div className="card glass-card client-form-card">
          <h3>{editingId ? 'Edit Store Profile' : 'Add New Client Store'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-grid">
              {/* Basic Details */}
              <div className="form-col-full">
                <div className="input-group">
                  <label>Store / Cafe Name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g. Juicy Drops Cafe" 
                    required 
                  />
                </div>
              </div>

              <div className="form-col-full" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {logoData && (
                  <img src={logoData} alt="Store Logo" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                )}
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Store Logo (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ padding: '0.4rem' }}
                  />
                  <span className="input-note">Logo will be automatically resized for the scan page avatar.</span>
                </div>
              </div>

              <div className="form-col">
                <div className="input-group">
                  <label>Google Maps Location Link</label>
                  <input 
                    type="url" 
                    value={locationUrl} 
                    onChange={(e) => setLocationUrl(e.target.value)} 
                    placeholder="https://maps.google.com/?q=..." 
                  />
                </div>
              </div>

              <div className="form-col">
                <div className="input-group">
                  <label>Instagram Handle (username)</label>
                  <input 
                    type="text" 
                    value={instagram} 
                    onChange={(e) => setInstagram(e.target.value)} 
                    placeholder="e.g. juicy_drops_cafe" 
                  />
                </div>
              </div>

              <div className="form-col">
                <div className="input-group">
                  <label>WhatsApp Contact Number (with country code)</label>
                  <input 
                    type="text" 
                    value={whatsapp} 
                    onChange={(e) => setWhatsapp(e.target.value)} 
                    placeholder="e.g. 919876543210 (No + or spaces)" 
                  />
                </div>
              </div>

              <div className="form-col">
                <div className="input-group">
                  <label>Facebook Page Link (username)</label>
                  <input 
                    type="text" 
                    value={facebook} 
                    onChange={(e) => setFacebook(e.target.value)} 
                    placeholder="e.g. juicydropscafe" 
                  />
                </div>
              </div>

              <div className="form-col">
                <div className="input-group">
                  <label>Store Website URL</label>
                  <input 
                    type="url" 
                    value={website} 
                    onChange={(e) => setWebsite(e.target.value)} 
                    placeholder="e.g. https://www.juicydrops.com" 
                  />
                </div>
              </div>

              {/* Package Details */}
              <div className="form-col">
                <div className="input-group">
                  <label>Sticker Package Size</label>
                  <select value={packageSize} onChange={(e) => setPackageSize(Number(e.target.value))}>
                    <option value="500">500 stickers package</option>
                    <option value="1000">1000 stickers package</option>
                    <option value="1800">1800 stickers (Full Bundle)</option>
                    <option value="3600">3600 stickers (Two Bundles)</option>
                  </select>
                </div>
              </div>

              <div className="form-col">
                <div className="input-group">
                  <label>Total Stickers Printed So Far</label>
                  <input 
                    type="number" 
                    value={stickersPrinted} 
                    onChange={(e) => setStickersPrinted(Number(e.target.value))} 
                    min="0"
                  />
                </div>
              </div>

              <div className="form-col">
                <div className="input-group">
                  <label>QR Sticker Service Type</label>
                  <select value={qrType} onChange={(e) => setQrType(e.target.value)}>
                    <option value="simple">Type 1: Simple QR (Links only - ₹1/sticker)</option>
                    <option value="advanced">Type 2: Advanced QR (Links + Coupons - ₹2/sticker)</option>
                  </select>
                </div>
              </div>

              {/* Coupon Management for Advanced QR */}
              {qrType === 'advanced' && (
                <>
                  <div className="form-col-full">
                    <div className="input-group">
                      <label>Offer Message Text *</label>
                      <input 
                        type="text" 
                        value={offerText} 
                        onChange={(e) => setOfferText(e.target.value)} 
                        placeholder="e.g. YOU UNLOCKED A BUY 1 GET 1 OFFER!"
                        required={qrType === 'advanced'}
                      />
                      <span className="input-note">This text will be shown directly above the coupon code when they win.</span>
                    </div>
                  </div>

                  <div className="form-col">
                    <div className="input-group">
                      <label>Winning Coupon/Offer Code *</label>
                      <input 
                        type="text" 
                        value={rewardCode} 
                        onChange={(e) => setRewardCode(e.target.value)} 
                        placeholder="e.g. BOGOJUICE, FREECOFFEE"
                        required={qrType === 'advanced'}
                      />
                    </div>
                  </div>

                  <div className="form-col">
                    <div className="input-group">
                      <label>Reward Winner Count (Lottery Limit) *</label>
                      <input 
                        type="number" 
                        value={rewardCount} 
                        onChange={(e) => setRewardCount(Number(e.target.value))} 
                        min="1"
                        max={packageSize}
                        required={qrType === 'advanced'}
                      />
                      <span className="input-note">Out of {packageSize} QRs, only {rewardCount} will contain the reward coupon. The remaining {packageSize - rewardCount} will show "Oops, try again!".</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-link" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-icon">
                <Save size={16} /> Save Store Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Client List Grid */}
      <div className="clients-list">
        {clients.length === 0 ? (
          <div className="no-data-card glass-card text-center">
            <p>No store clients registered. Click "Add New Store" to get started.</p>
          </div>
        ) : (
          clients.map((client) => {
            const stickerCost = client.qrType === 'simple' ? 1 : 2;
            const invoiceAmt = client.stickersPrinted * stickerCost;

            return (
              <div key={client.id} className="card glass-card client-row-card">
                <div className="client-info-main">
                  <div>
                    <h4>{client.name}</h4>
                    <div className="client-tags">
                      <span className={`badge ${client.qrType === 'simple' ? 'badge-blue' : 'badge-purple'}`}>
                        {client.qrType === 'simple' ? 'Type 1: Simple QR' : 'Type 2: Advanced Coupon QR'}
                      </span>
                      <span className="badge badge-gray">Registered: {client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-IN') : '—'}</span>
                    </div>
                  </div>

                  <div className="client-financials-summary">
                    <div className="fin-metric">
                      <span>Printed Volume</span>
                      <strong>{client.stickersPrinted.toLocaleString()} QRs</strong>
                    </div>
                    <div className="fin-metric">
                      <span>Price Rate</span>
                      <strong>₹{stickerCost.toFixed(2)}/pc</strong>
                    </div>
                    <div className="fin-metric highlighted-invoice">
                      <span>Total Invoice</span>
                      <strong className="highlight-green">₹{invoiceAmt.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="client-links-summary">
                  {client.locationUrl && (
                    <span className="link-info text-truncate">📍 Maps Link Available</span>
                  )}
                  {client.instagram && (
                    <span className="link-info">📷 @{client.instagram}</span>
                  )}
                  {client.whatsapp && (
                    <span className="link-info">💬 WhatsApp Connected</span>
                  )}
                  {client.qrType === 'advanced' && (
                    <span className="link-info">🎟️ Rewards win rate: {client.rewardCount} / {client.packageSize} QRs ({client.rewardCode})</span>
                  )}
                </div>

                <div className="client-card-actions">
                  <div className="action-left">
                    <button 
                      className="btn btn-outline btn-sm btn-icon"
                      onClick={() => handleStartEdit(client)}
                    >
                      <Edit2 size={14} /> Edit Store
                    </button>
                    <button 
                      className="btn btn-outline btn-sm btn-icon text-danger"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                  <div className="action-right">
                    <button 
                      className="btn btn-secondary btn-sm btn-icon"
                      onClick={() => onViewSimulator(client)}
                    >
                      <Eye size={14} /> Simulate Scan
                    </button>
                    <button 
                      className="btn btn-purple btn-sm btn-icon"
                      onClick={() => onSelectClient(client)}
                    >
                      <QrCode size={14} /> Generate & Print Sheets
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
