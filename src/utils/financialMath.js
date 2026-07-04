/**
 * Calculates unit costs, profit margins, and break-even metrics for the business.
 * @param {Object} config - Config from localStorage 
 */
export const calculateCostsAndMargins = (config) => {
  const {
    printerCost,
    sheetsCost,
    stickersPerSheet,
    coversCost,
    inkCostPerSheet
  } = config;

  // 1. Materials Unit Costs
  const totalStickersPerBundle = 100 * stickersPerSheet; // e.g. 1800 stickers
  const stickerPaperCostUnit = sheetsCost / totalStickersPerBundle; // e.g. 320 / 1800 = 0.178 INR
  const courierCoverCostPerShop = 10; // Flat courier cover cost per shop/order
  const inkCostUnit = inkCostPerSheet / stickersPerSheet; // e.g. 1.5 / 18 = 0.083 INR

  const unitCost = stickerPaperCostUnit + inkCostUnit;

  // 2. Pricing and Margins
  const priceType1 = 1.0; // Simple QR: 1 INR per sticker
  const priceType2 = 2.0; // Advanced QR: 2 INR per sticker

  const profitType1 = priceType1 - unitCost;
  const profitType2 = priceType2 - unitCost;

  const marginPctType1 = (profitType1 / priceType1) * 100;
  const marginPctType2 = (profitType2 / priceType2) * 100;

  // 3. Break-Even Points
  const breakEvenType1 = profitType1 > 0 ? Math.ceil(printerCost / profitType1) : Infinity;
  const breakEvenType2 = profitType2 > 0 ? Math.ceil(printerCost / profitType2) : Infinity;

  // 4. Client Package Margins
  const getPackageMetrics = (quantity, qrType, numberOfShops = 1) => {
    const pricePerSticker = qrType === 'simple' ? priceType1 : priceType2;
    const revenue = quantity * pricePerSticker;
    
    // Each package of stickers is shipped to a store in a courier cover.
    // The cost of the packaging/courier cover is fixed at 10 INR per shop.
    const materialCost = (unitCost * quantity) + (courierCoverCostPerShop * numberOfShops);
    const profit = revenue - materialCost;
    const marginPct = (profit / revenue) * 100;

    return {
      revenue,
      materialCost,
      profit,
      marginPct
    };
  };

  return {
    stickerPaperCostUnit,
    courierCoverCostPerShop,
    inkCostUnit,
    unitCost,
    types: {
      simple: {
        price: priceType1,
        profit: profitType1,
        marginPct: marginPctType1,
        breakEven: breakEvenType1
      },
      advanced: {
        price: priceType2,
        profit: profitType2,
        marginPct: marginPctType2,
        breakEven: breakEvenType2
      }
    },
    getPackageMetrics
  };
};
