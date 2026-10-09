const CLIENTS_KEY = 'qr_business_clients';
const CONFIG_KEY = 'qr_business_config';

const DEFAULT_CLIENTS = [
  {
    id: 'client-1',
    name: 'Green Oasis Juice Bar',
    locationUrl: 'https://maps.google.com/?q=Juice+Bar',
    instagram: 'green_oasis_juice',
    whatsapp: '919876543210',
    facebook: 'greenoasisjuice',
    qrType: 'simple',
    rewardCode: '',
    rewardCount: 0,
    packageSize: 500,
    stickersPrinted: 500,
    createdDate: '2026-06-15'
  },
  {
    id: 'client-2',
    name: 'The Daily Brew Cafe',
    locationUrl: 'https://maps.google.com/?q=Cafe',
    instagram: 'dailybrew_cafe',
    whatsapp: '918765432109',
    facebook: 'dailybrewcafe',
    qrType: 'advanced',
    rewardCode: 'BOGOJUICE',
    rewardCount: 2,
    packageSize: 1000,
    stickersPrinted: 1000,
    createdDate: '2026-06-28'
  }
];

const DEFAULT_CONFIG = {
  supplierUnitPrice: 0.50,
  purchaseGstPercent: 18,
  supplierMoq: 15000,
  freightPerOrder: 0,
  printerCost: 15000,
  sheetsCost: 320, // for 100 sheets
  stickersPerSheet: 18,
  coversCost: 150, // for 500 covers
  inkCostPerSheet: 1.5,
  // Millimeter offsets for A4 sticker sheet printing
  margins: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
    colGap: 5,
    rowGap: 5,
    width: 50,
    height: 30
  },
  // Sticker visual settings
  stickerText: "Don't Throw Away—Scan & Win!",
  stickerFontFamily: "sans-serif",
  stickerFontColor: "#000000",
  stickerFontSize: 12,
  stickerFontWeight: "bold",
  stickerTextAlign: "center",
  
  // Shop Name styling
  shopNameFontFamily: "sans-serif",
  shopNameFontColor: "#000000",
  shopNameFontSize: 14,
  shopNameFontWeight: "bold",
  shopNameTextAlign: "center",
  
  // QR Design
  qrDesign: "standard"
};

export const getClients = () => {
  const data = localStorage.getItem(CLIENTS_KEY);
  if (!data) {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(DEFAULT_CLIENTS));
    return DEFAULT_CLIENTS;
  }
  return JSON.parse(data);
};

export const saveClients = (clients) => {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

export const getPrinterConfig = () => {
  const data = localStorage.getItem(CONFIG_KEY);
  if (!data) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }
  return JSON.parse(data);
};

export const savePrinterConfig = (config) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};
