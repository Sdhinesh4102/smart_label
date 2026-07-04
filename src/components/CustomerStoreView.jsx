import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { MapPin, Instagram, MessageSquare, Facebook, Gift, Sparkles, RefreshCw, User, Phone, CheckCircle, Globe } from 'lucide-react';
import { getQRCodeDetailsAsync, claimQRCodeAsync } from '../utils/api';

export default function CustomerStoreView({ client, simulatedCouponCode = '', simulatedWin = true, isMock = false }) {
  const [scratched, setScratched] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  const scratchCanvasRef = useRef(null);
  
  // Database State
  const [qrId, setQrId] = useState(null);
  const [qrDetails, setQrDetails] = useState(null);
  const [loading, setLoading] = useState(!isMock);
  const [isClaimedByOther, setIsClaimedByOther] = useState(false);
  
  // Form State
  const [formSubmitted, setFormSubmitted] = useState(isMock);
  const [claimerName, setClaimerName] = useState('');
  const [claimerPhone, setClaimerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract coupon from URL query param if not in mock simulator mode
  const [couponCode, setCouponCode] = useState(simulatedCouponCode);
  const [isWinner, setIsWinner] = useState(simulatedWin);

  useEffect(() => {
    if (!isMock) {
      // Parse URL parameters from the hash for live scanning simulation
      const hashQuery = window.location.hash.split('?')[1] || '';
      const params = new URLSearchParams(hashQuery);
      const urlQrId = params.get('qr_id');
      
      if (urlQrId) {
        setQrId(urlQrId);
        getQRCodeDetailsAsync(urlQrId).then(details => {
          if (details) {
            setQrDetails(details);
            setIsWinner(details.isWinner);
            setCouponCode(details.couponCode);
            if (details.isClaimed) {
              setIsClaimedByOther(true);
              setFormSubmitted(true); // skip form if already claimed
            }
          } else {
            // If it's not in the database, it's a losing QR code
            setIsWinner(false);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } else {
      setCouponCode(simulatedCouponCode);
      setIsWinner(simulatedWin);
      setFormSubmitted(true); // Skip form in mock mode by default
    }
  }, [simulatedCouponCode, simulatedWin, isMock]);

  // Handle Form Submission
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimerName || !claimerPhone) return;
    
    setIsSubmitting(true);
    if (!isMock && qrId) {
      const success = await claimQRCodeAsync(qrId, claimerName, claimerPhone);
      if (success) {
        setFormSubmitted(true);
      } else {
        alert("Failed to register. Please try again.");
      }
    } else {
      // Mock mode
      setFormSubmitted(true);
    }
    setIsSubmitting(false);
  };

  // Generate validation code once coupon is unlocked
  useEffect(() => {
    if (scratched && !isClaimedByOther) {
      if (isWinner) {
        const storeInitials = client.name
          ? client.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 3)
          : 'QR';
        const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        setTicketCode(`${storeInitials}-${couponCode || 'BOGO'}-${randomId}`);
        
        // Fire confetti celebration!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b']
        });
      } else {
        const storeInitials = client.name
          ? client.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 3)
          : 'QR';
        const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        setTicketCode(`${storeInitials}-TRYAGAIN-${randomId}`);
      }
    }
  }, [scratched, couponCode, client.name, isWinner, isClaimedByOther]);

  // Handle Canvas scratch effect (for high-fidelity desktop/mobile simulation)
  useEffect(() => {
    if (!formSubmitted || isClaimedByOther) return; // Only show scratch card after form
    
    const canvas = scratchCanvasRef.current;
    if (!canvas || scratched) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Draw Silver Coating
    ctx.fillStyle = '#b8bac2';
    ctx.fillRect(0, 0, width, height);

    // Draw pattern or texture on foil
    ctx.fillStyle = '#a1a3ad';
    for (let i = 0; i < width; i += 10) {
      ctx.fillRect(i, 0, 1, height);
    }
    
    // Add text on the foil
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#4b5563';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH TO REVEAL OFFER', width / 2, height / 2);

    let isDrawing = false;

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const scratch = (x, y) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Check percentage scratched
      checkScratchedPercent();
    };

    const checkScratchedPercent = () => {
      const imgData = ctx.getImageData(0, 0, width, height);
      const pixels = imgData.data;
      let transparentPixels = 0;
      
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] === 0) {
          transparentPixels++;
        }
      }

      const percent = (transparentPixels / (pixels.length / 4)) * 100;
      if (percent > 45) {
        setScratched(true);
      }
    };

    const handleMouseDown = (e) => {
      isDrawing = true;
      const pos = getMousePos(e);
      scratch(pos.x, pos.y);
    };

    const handleMouseMove = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getMousePos(e);
      scratch(pos.x, pos.y);
    };

    const handleMouseUp = () => {
      isDrawing = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    canvas.addEventListener('touchstart', handleMouseDown);
    canvas.addEventListener('touchmove', handleMouseMove);
    canvas.addEventListener('touchend', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      
      canvas.removeEventListener('touchstart', handleMouseDown);
      canvas.removeEventListener('touchmove', handleMouseMove);
      canvas.removeEventListener('touchend', handleMouseUp);
    };
  }, [scratched, formSubmitted, isClaimedByOther]);

  const handleTapRevealFallback = () => {
    setScratched(true);
  };

  const handleResetScratch = () => {
    setScratched(false);
    setTicketCode('');
  };

  if (loading) {
    return (
      <div className="store-view-error">
        <p>Loading your prize...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="store-view-error">
        <p>No store information found. Please scan a valid store QR code.</p>
      </div>
    );
  }

  // Pre-fill whatsapp message URL
  const encodedMsg = encodeURIComponent(
    `Hello ${client.name}! I scanned your bottle QR code and would like to order or redeem an offer.`
  );
  const waUrl = client.whatsapp ? `https://wa.me/${client.whatsapp}?text=${encodedMsg}` : null;
  const igUrl = client.instagram ? `https://instagram.com/${client.instagram}` : null;
  const fbUrl = client.facebook ? `https://facebook.com/${client.facebook}` : null;
  const webUrl = client.website ? client.website : null;

  return (
    <div className={`customer-store-view ${isMock ? 'in-simulator' : 'standalone-page'}`}>
      <div className="phone-wrapper">
        <div className={`phone-screen ${(!scratched || isWinner) ? 'theme-light' : 'theme-dark'}`}>
          {/* Phone Status Bar - ONLY show in mock mode */}
          {isMock && (
            <div className="phone-status-bar">
              <span>9:41</span>
              <div className="status-icons">
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>
          )}

          <div className="phone-content scrollable">
            {/* Header / Store Info */}
            <div className="store-profile-header">
              {client.logoData ? (
                <div className="store-avatar" style={{ background: 'transparent', padding: 0 }}>
                  <img src={client.logoData} alt="Store Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div className="store-avatar">
                  {client.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <h1 className="store-title">{client.name}</h1>
              <span className="store-welcome-msg">Welcome to our store!</span>
            </div>

            {/* Quick Links Menu */}
            <div className="links-menu">
              {webUrl && (
                <a href={webUrl} target="_blank" rel="noopener noreferrer" className="link-button website-btn">
                  <Globe size={18} /><span>Store Website</span>
                </a>
              )}
              {client.locationUrl && (
                <a href={client.locationUrl} target="_blank" rel="noopener noreferrer" className="link-button maps-btn">
                  <MapPin size={18} /><span>Navigate to Store Location</span>
                </a>
              )}
              {igUrl && (
                <a href={igUrl} target="_blank" rel="noopener noreferrer" className="link-button instagram-btn">
                  <Instagram size={18} /><span>Follow us on Instagram</span>
                </a>
              )}
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="link-button whatsapp-btn">
                  <MessageSquare size={18} /><span>Chat & Order on WhatsApp</span>
                </a>
              )}
              {fbUrl && (
                <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="link-button facebook-btn">
                  <Facebook size={18} /><span>Like our Facebook Page</span>
                </a>
              )}
            </div>

            {/* Offers & Coupon section */}
            <div className="promo-section-card">
              <div className="promo-card-header">
                <Gift className="gift-icon" />
                <h3>Exclusive Scan Offers</h3>
              </div>

              {client.qrType === 'simple' ? (
                // Simple QR
                <div className="promo-card-body simple-promo">
                  <p>Thanks for scanning our packaging sticker! Keep an eye on this space for future discount coupons, menus, and weekend specials.</p>
                  <div className="simple-offer-tag">
                    <Sparkles size={16} /> Welcome Discount Available In-Store
                  </div>
                </div>
              ) : (
                // Advanced QR with Coupon Codes
                <div className="promo-card-body coupon-promo">
                  {isClaimedByOther ? (
                    <div className="reveal-content-container animate-reveal" style={{ textAlign: 'center' }}>
                      <div className="offer-title" style={{ color: '#ef4444' }}>⚠️ ALREADY CLAIMED</div>
                      <p className="offer-subtext" style={{ padding: '0.25rem 0.5rem', lineHeight: '1.4' }}>
                        This QR code has already been scratched and claimed. Please purchase another bottle and scan a new code!
                      </p>
                    </div>
                  ) : !formSubmitted ? (
                    <div className="claim-form-container" style={{ padding: '1rem', background: '#f5f5f7', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#1d1d1f', textAlign: 'center' }}>Register to Scratch!</h4>
                      <form onSubmit={handleClaimSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#515154' }}>
                            <User size={14} /> Your Full Name
                          </label>
                          <input 
                            type="text" 
                            required 
                            placeholder="John Doe"
                            value={claimerName}
                            onChange={(e) => setClaimerName(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#515154' }}>
                            <Phone size={14} /> Phone Number
                          </label>
                          <input 
                            type="tel" 
                            required 
                            placeholder="e.g. +91 9876543210"
                            value={claimerPhone}
                            onChange={(e) => setClaimerPhone(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={isSubmitting}
                          style={{ 
                            background: 'var(--purple-primary)', color: 'white', padding: '0.75rem', 
                            borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                          }}
                        >
                          {isSubmitting ? 'Registering...' : <><CheckCircle size={16} /> Register & Reveal</>}
                        </button>
                      </form>
                    </div>
                  ) : !scratched ? (
                    <div className="scratch-card-container">
                      <canvas 
                        ref={scratchCanvasRef} 
                        width={280} 
                        height={120} 
                        className="scratch-canvas"
                      />
                      <button 
                        className="tap-reveal-btn" 
                        onClick={handleTapRevealFallback}
                      >
                        Tap to reveal instantly
                      </button>
                    </div>
                  ) : (
                    <div className="reveal-content-container animate-reveal">
                      {isWinner ? (
                        <>
                          <Gift className="prize-icon bounce-animation" size={32} />
                          <div className="offer-title">{client.offerText || '🎁 YOU UNLOCKED A BUY 1 GET 1 OFFER!'}</div>
                          <p className="offer-subtext">Matches pre-stored store code: <strong>{couponCode || 'BOGOJUICE'}</strong></p>
                          
                          <div className="ticket-box">
                            <div className="ticket-label">VERIFICATION TICKET CODE</div>
                            <div className="ticket-code">{ticketCode}</div>
                            <div className="ticket-note">Present this screen to the cashier to redeem.</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="offer-title" style={{ color: '#ef4444' }}>😢 Better Luck Next Time!</div>
                          <p className="offer-subtext" style={{ padding: '0.25rem 0.5rem', lineHeight: '1.4' }}>
                            Thank you for scanning! Unfortunately, this bottle sticker was not a winning ticket. Try scanning again on your next order!
                          </p>
                          <div className="try-again-message" style={{ margin: '1rem 0 0.5rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            🎯 Scan packaging stickers on your next purchase to win rewards!
                          </div>
                        </>
                      )}

                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="footer-branding">
              <span>Powered by Synkraze.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
