import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import QRCodeStyling from 'qr-code-styling';
import { QrCode, Printer, Sliders, RefreshCw, Download, Layers } from 'lucide-react';
import { savePrintRunAsync, logPrintRunAsync } from '../utils/api';
import { createVendorCsv } from '../utils/vendorExport';

export default function QRStickerGenerator({ client, config, onConfigChange }) {
  const [targetBaseUrl, setTargetBaseUrl] = useState(
    window.location.origin + window.location.pathname
  );
  
  // Printable Layout state initialized from config
  const [margins, setMargins] = useState(config.margins);
  const [quantity, setQuantity] = useState(18); // default to 1 full sheet
  const [winnersCount, setWinnersCount] = useState(client ? Math.min(18, client.rewardCount || 1) : 1);
  const [qrCodes, setQrCodes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedRun, setHasSavedRun] = useState(false);
  const [runId, setRunId] = useState(null);
  const isGeneratingRef = useRef(false);
  const [printLayoutMode, setPrintLayoutMode] = useState(false);

  // Sync margins with parent config
  useEffect(() => {
    onConfigChange({
      ...config,
      margins: margins
    });
  }, [margins]);

  // Sync winners count with client/quantity defaults and clear QRs on client change
  useEffect(() => {
    if (client) {
      setWinnersCount(prev => Math.min(quantity, client.rewardCount || 1));
      setQrCodes([]); // Clear previous QRs so they must generate explicitly for the new client
      setHasSavedRun(false);
      setRunId(null);
    }
  }, [client, quantity]);

  // Handle margin input changes
  const handleMarginChange = (key, value) => {
    setMargins(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  // Handle text styling changes
  const handleTextConfigChange = (key, value) => {
    onConfigChange({
      ...config,
      [key]: value
    });
  };

  // Fallbacks for older configs
  const stickerText = config.stickerText || "Don't Throw Away—Scan & Win!";
  const stickerFontFamily = config.stickerFontFamily || "sans-serif";
  const stickerFontColor = config.stickerFontColor || "#000000";
  const stickerFontSize = config.stickerFontSize || 12;
  const stickerFontWeight = config.stickerFontWeight || "bold";
  const stickerTextAlign = config.stickerTextAlign || "center";
  
  const shopNameFontFamily = config.shopNameFontFamily || "sans-serif";
  const shopNameFontColor = config.shopNameFontColor || "#000000";
  const shopNameFontSize = config.shopNameFontSize || 14;
  const shopNameFontWeight = config.shopNameFontWeight || "bold";
  const shopNameTextAlign = config.shopNameTextAlign || "center";
  
  const qrDesign = config.qrDesign || "standard";


  // Generate QR codes in batch
  const generateQRs = async () => {
    if (!client || isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setHasSavedRun(false);
    setRunId(null);
    const codes = [];

    // Base URL structure: [TargetUrl]?store=[clientId]
    const baseStoreUrl = `${targetBaseUrl}#/store/${client.id}`;

    // Select first N indices to be winners
    const winningIndices = new Set();
    if (client.qrType === 'advanced') {
      const targetWinners = Math.min(winnersCount, quantity);
      for (let i = 0; i < targetWinners; i++) {
        winningIndices.add(i);
      }
    }

    for (let i = 0; i < quantity; i++) {
      let finalUrl = baseStoreUrl;
      let isWinner = false;
      let couponCode = '';
      const uuid = crypto.randomUUID();

      if (client.qrType === 'advanced') {
        isWinner = winningIndices.has(i);
        couponCode = isWinner ? (client.rewardCode || 'BOGOJUICE') : '';
        finalUrl = `${baseStoreUrl}?qr_id=${uuid}`;
      } else {
        // Simple type
        finalUrl = `${baseStoreUrl}?qr_id=${uuid}`;
      }

      try {
        let qrDataUrl = '';
        if (qrDesign !== 'standard') {
            const designConfigs = {
              rounded: { dots: 'rounded', corners: 'extra-rounded', cornersDot: 'dot' },
              dots: { dots: 'dots', corners: 'dot', cornersDot: 'dot' },
              classy: { dots: 'classy', corners: 'extra-rounded', cornersDot: 'dot' },
              soft_square: { dots: 'square', corners: 'extra-rounded', cornersDot: 'dot' },
              classy_rounded: { dots: 'classy-rounded', corners: 'extra-rounded', cornersDot: 'dot' },
              bold_dots: { dots: 'dots', corners: 'square', cornersDot: 'square' },
              fluid: { dots: 'rounded', corners: 'extra-rounded', cornersDot: 'dot' },
              professional: { dots: 'square', corners: 'square', cornersDot: 'square' },
              bubbles: { dots: 'dots', corners: 'dot', cornersDot: 'dot' }
            };
            const selectedDesign = designConfigs[qrDesign] || designConfigs.classy;

            const qrStyling = new QRCodeStyling({
              width: 200,
              height: 200,
              data: finalUrl,
              margin: 1,
              dotsOptions: {
                color: "#1e1b4b",
                type: selectedDesign.dots
              },
              cornersSquareOptions: {
                type: selectedDesign.corners
              },
              cornersDotOptions: {
                type: selectedDesign.cornersDot
              }
            });
            const blob = await qrStyling.getRawData("png");
            qrDataUrl = await new Promise((resolve) => {
               const reader = new FileReader();
               reader.onloadend = () => resolve(reader.result);
               reader.readAsDataURL(blob);
            });
        } else {
            qrDataUrl = await QRCode.toDataURL(finalUrl, {
              width: 200,
              margin: 1,
              color: {
                dark: '#1e1b4b',
                light: '#ffffff'
              }
            });
        }

        codes.push({
          id: i,
          uuid,
          url: qrDataUrl,
          targetUrl: finalUrl,
          couponCode,
          isWinner,
          stickerNumber: i + 1
        });
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    }

    try {
      if (codes.length !== quantity) {
        throw new Error('Some QR images could not be generated. No sheet was saved.');
      }
      // A sheet is printable only after every QR has been saved successfully.
      const actualWinners = codes.filter(c => c.isWinner).length;
      const runId = await savePrintRunAsync(client.id, codes.length, actualWinners, codes);
      if (!runId) throw new Error('The QR batch could not be saved. Please try again.');
      setQrCodes(codes);
      setRunId(runId);
      setHasSavedRun(true);
    } catch (error) {
      setQrCodes([]);
      alert(error.message);
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };



  // Group stickers into sheets of 18
  const stickersPerSheet = 18;
  const totalSheets = Math.ceil(qrCodes.length / stickersPerSheet);
  const sheets = [];

  for (let s = 0; s < totalSheets; s++) {
    sheets.push(qrCodes.slice(s * stickersPerSheet, (s + 1) * stickersPerSheet));
  }

  const handlePrint = async () => {
    // Only log analytics when they actually print
    if (!hasSavedRun || qrCodes.length === 0) return;
    if (qrCodes.length > 0) {
      await logPrintRunAsync(client.id, qrCodes.length);
    }
    window.print();
  };

  const downloadVendorCsv = () => {
    if (!hasSavedRun || !runId || qrCodes.length === 0) return;
    const csv = createVendorCsv({ runId, clientName: client.name, promoText: stickerText, codes: qrCodes });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-labels-${runId}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="generator-container">
      {/* Calibration Controls */}
      <div className="card glass-card calibration-card hide-on-print">
        <h3>
          <Sliders className="icon-purple" /> Sticker Sheet Printer Calibration
        </h3>
        <p className="subtitle">Adjust grid margins in millimeters (mm) to align with your physical 18-sticker sheet layout.</p>
        
        <div className="calibration-grid">
          <div className="cal-col">
            <h4>Margins (mm)</h4>
            <div className="cal-input-row">
              <div className="cal-input-group">
                <label>Top</label>
                <input 
                  type="number" 
                  value={margins.top} 
                  onChange={(e) => handleMarginChange('top', e.target.value)} 
                  step="0.5" 
                />
              </div>
              <div className="cal-input-group">
                <label>Bottom</label>
                <input 
                  type="number" 
                  value={margins.bottom} 
                  onChange={(e) => handleMarginChange('bottom', e.target.value)} 
                  step="0.5" 
                />
              </div>
              <div className="cal-input-group">
                <label>Left</label>
                <input 
                  type="number" 
                  value={margins.left} 
                  onChange={(e) => handleMarginChange('left', e.target.value)} 
                  step="0.5" 
                />
              </div>
              <div className="cal-input-group">
                <label>Right</label>
                <input 
                  type="number" 
                  value={margins.right} 
                  onChange={(e) => handleMarginChange('right', e.target.value)} 
                  step="0.5" 
                />
              </div>
            </div>
          </div>

          <div className="cal-col">
            <h4>Sticker Size (mm)</h4>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setMargins(current => ({ ...current, width: 50, height: 30 }))}>
              Use supplier 50 × 30 mm size
            </button>
            <div className="cal-input-row">
              <div className="cal-input-group">
                <label>Width</label>
                <input 
                  type="number" 
                  value={margins.width} 
                  onChange={(e) => handleMarginChange('width', e.target.value)} 
                  step="0.5" 
                />
              </div>
              <div className="cal-input-group">
                <label>Height</label>
                <input 
                  type="number" 
                  value={margins.height} 
                  onChange={(e) => handleMarginChange('height', e.target.value)} 
                  step="0.5" 
                />
              </div>
            </div>
          </div>

          <div className="cal-col">
            <h4>Grid Gaps (mm)</h4>
            <div className="cal-input-row">
              <div className="cal-input-group">
                <label>Col Gap</label>
                <input 
                  type="number" 
                  value={margins.colGap} 
                  onChange={(e) => handleMarginChange('colGap', e.target.value)} 
                  step="0.5" 
                />
              </div>
              <div className="cal-input-group">
                <label>Row Gap</label>
                <input 
                  type="number" 
                  value={margins.rowGap} 
                  onChange={(e) => handleMarginChange('rowGap', e.target.value)} 
                  step="0.5" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="cal-col text-styling-col" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <h4>Sticker Promo Text Styling</h4>
          <div className="cal-input-row" style={{ flexWrap: 'wrap' }}>
            <div className="cal-input-group" style={{ flex: '1 1 200px' }}>
              <label>Promo Text</label>
              <input type="text" value={stickerText} onChange={(e) => handleTextConfigChange('stickerText', e.target.value)} />
            </div>
            <div className="cal-input-group">
              <label>Font Style</label>
              <select value={stickerFontFamily} onChange={(e) => handleTextConfigChange('stickerFontFamily', e.target.value)}>
                <option value="sans-serif">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="'Courier New', Courier, monospace">Courier New</option>
                <option value="Impact, sans-serif">Impact</option>
                <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
              </select>
            </div>
            <div className="cal-input-group">
              <label>Color</label>
              <input type="color" value={stickerFontColor} onChange={(e) => handleTextConfigChange('stickerFontColor', e.target.value)} style={{ padding: '0', height: '32px' }} />
            </div>
            <div className="cal-input-group">
              <label>Alignment</label>
              <select value={stickerTextAlign} onChange={(e) => handleTextConfigChange('stickerTextAlign', e.target.value)}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="cal-input-group">
              <label>Size (px)</label>
              <input type="number" value={stickerFontSize} onChange={(e) => handleTextConfigChange('stickerFontSize', Number(e.target.value))} />
            </div>
            <div className="cal-input-group">
              <label>Thickness</label>
              <select value={stickerFontWeight} onChange={(e) => handleTextConfigChange('stickerFontWeight', e.target.value)}>
                <option value="normal">Normal</option>
                <option value="500">Medium</option>
                <option value="bold">Bold</option>
                <option value="900">Black (Heavy)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="cal-col text-styling-col" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <h4>Shop Name Text Styling</h4>
          <div className="cal-input-row" style={{ flexWrap: 'wrap' }}>
            <div className="cal-input-group">
              <label>Font Style</label>
              <select value={shopNameFontFamily} onChange={(e) => handleTextConfigChange('shopNameFontFamily', e.target.value)}>
                <option value="sans-serif">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="'Courier New', Courier, monospace">Courier New</option>
                <option value="Impact, sans-serif">Impact</option>
                <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
              </select>
            </div>
            <div className="cal-input-group">
              <label>Color</label>
              <input type="color" value={shopNameFontColor} onChange={(e) => handleTextConfigChange('shopNameFontColor', e.target.value)} style={{ padding: '0', height: '32px' }} />
            </div>
            <div className="cal-input-group">
              <label>Alignment</label>
              <select value={shopNameTextAlign} onChange={(e) => handleTextConfigChange('shopNameTextAlign', e.target.value)}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="cal-input-group">
              <label>Size (px)</label>
              <input type="number" value={shopNameFontSize} onChange={(e) => handleTextConfigChange('shopNameFontSize', Number(e.target.value))} />
            </div>
            <div className="cal-input-group">
              <label>Thickness</label>
              <select value={shopNameFontWeight} onChange={(e) => handleTextConfigChange('shopNameFontWeight', e.target.value)}>
                <option value="normal">Normal</option>
                <option value="500">Medium</option>
                <option value="bold">Bold</option>
                <option value="900">Black (Heavy)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="calibration-settings-row">
          <div className="input-group">
            <label>Redirect Base URL (Destination QR target)</label>
            <input 
              type="text" 
              value={targetBaseUrl} 
              onChange={(e) => setTargetBaseUrl(e.target.value)} 
              placeholder="e.g. https://store-promo.web.app/" 
            />
          </div>
          <div className="input-group">
            <label>Stickers to Print</label>
            <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
              <option value="18">18 stickers (1 sheet)</option>
              <option value="36">36 stickers (2 sheets)</option>
              <option value="54">54 stickers (3 sheets)</option>
              <option value="90">90 stickers (5 sheets)</option>
              <option value="500">500 stickers package</option>
              <option value="1000">1000 stickers package</option>
            </select>
          </div>
          {client.qrType === 'advanced' && (
            <div className="input-group">
              <label>Winners in this Print Run</label>
              <input 
                type="number" 
                value={winnersCount} 
                onChange={(e) => setWinnersCount(Math.max(0, Math.min(quantity, Number(e.target.value))))} 
                min="0"
                max={quantity}
              />
              <span className="input-note">Client reward target: {client.rewardCount} wins</span>
            </div>
          )}
          <div className="input-group">
            <label>QR Pattern Design</label>
            <select value={qrDesign} onChange={(e) => handleTextConfigChange('qrDesign', e.target.value)}>
              <option value="standard">Standard Square</option>
              <option value="rounded">Rounded Corners</option>
              <option value="dots">Modern Dots</option>
              <option value="classy">Classy Style</option>
              <option value="soft_square">Soft Square</option>
              <option value="classy_rounded">Classy Rounded</option>
              <option value="bold_dots">Bold Dots</option>
              <option value="fluid">Fluid Smooth</option>
              <option value="professional">Strict Professional</option>
              <option value="bubbles">Playful Bubbles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Generator View */}
      <div className="generator-main hide-on-print">
        <div className="generator-controls-header">
          <div>
            <h3>QR Sticker Output ({qrCodes.length} stickers)</h3>
            <p>Targeting: <strong>{client.name}</strong> ({client.qrType === 'simple' ? 'Simple Links' : 'Advanced Coupons'})</p>
          </div>
          <div className="generator-actions">
            <button className="btn btn-secondary btn-icon" onClick={generateQRs} disabled={isGenerating || isSaving}>
              <RefreshCw size={16} className={isGenerating ? 'spin' : ''} /> Generate QR Codes
            </button>
            <button className="btn btn-secondary btn-icon" onClick={downloadVendorCsv} disabled={!hasSavedRun || qrCodes.length === 0}>
              <Download size={16} /> Download Vendor CSV (50×30 mm)
            </button>
            <button className="btn btn-primary btn-icon" onClick={handlePrint} disabled={!hasSavedRun || qrCodes.length === 0 || isSaving}>
              <Printer size={16} /> {isSaving ? 'Saving...' : 'Print & Save Sheet (Ctrl+P)'}
            </button>
          </div>
        </div>
      </div>

      {/* Print Preview Grid Page (This is styled dynamically based on mm inputs) */}
      <div className="print-sheets-container">
        {sheets.map((sheetStickers, sheetIdx) => (
          <div 
            key={sheetIdx} 
            className="print-sheet-page"
            style={{
              paddingTop: `${margins.top}mm`,
              paddingBottom: `${margins.bottom}mm`,
              paddingLeft: `${margins.left}mm`,
              paddingRight: `${margins.right}mm`
            }}
          >
            <div 
              className="sticker-grid-system"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                columnGap: `${margins.colGap}mm`,
                rowGap: `${margins.rowGap}mm`
              }}
            >
              {sheetStickers.map((sticker) => (
                <div 
                  key={sticker.id} 
                  className="sticker-label"
                  style={{
                    width: `${margins.width}mm`,
                    height: `${margins.height}mm`,
                    padding: '2mm'
                  }}
                >
                  <div className="sticker-content-wrapper">
                    <div className="sticker-header" style={{ width: '100%', marginBottom: '2px' }}>
                      <span className="sticker-store-name" style={{
                        fontFamily: shopNameFontFamily,
                        color: shopNameFontColor,
                        fontSize: `${shopNameFontSize}px`,
                        fontWeight: shopNameFontWeight,
                        textAlign: shopNameTextAlign,
                        display: 'block',
                        width: '100%',
                        lineHeight: '1.2'
                      }}>{client.name}</span>
                    </div>
                    <div className="sticker-qr-container">
                      <img src={sticker.url} alt="QR Code" className="sticker-qr-img" />
                    </div>
                    <div className="sticker-footer" style={{ width: '100%' }}>
                      <span className="sticker-promo-tag" style={{
                        fontFamily: stickerFontFamily,
                        color: stickerFontColor,
                        fontSize: `${stickerFontSize}px`,
                        fontWeight: stickerFontWeight,
                        textAlign: stickerTextAlign,
                        display: 'block',
                        width: '100%',
                        lineHeight: '1.2'
                      }}>
                        {stickerText}
                      </span>
                      <span className="sticker-number">
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Fill out the remaining empty grid slots on the last page to preserve spacing */}
              {sheetStickers.length < stickersPerSheet && 
                Array.from({ length: stickersPerSheet - sheetStickers.length }).map((_, emptyIdx) => (
                  <div 
                    key={`empty-${emptyIdx}`} 
                    className="sticker-label empty-sticker-label"
                    style={{
                      width: `${margins.width}mm`,
                      height: `${margins.height}mm`
                    }}
                  />
                ))
              }
            </div>
            <div className="sheet-watermark-footer hide-on-print">
              Sheet {sheetIdx + 1} of {totalSheets} | Calibrated for 18-sticker layout (3x6)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
