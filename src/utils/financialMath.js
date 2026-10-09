/** Cash planning for supplier-printed variable-data labels. */
export const calculateCostsAndMargins = (config) => {
  const {
    supplierUnitPrice = 0.5,
    purchaseGstPercent = 18,
    supplierMoq = 15000,
    freightPerOrder = 0,
    priceType1 = 1,
    priceType2 = 2
  } = config;

  const orderSize = Math.max(1, Number(supplierMoq) || 15000);
  const labelPrice = Math.max(0, Number(supplierUnitPrice) || 0);
  const gstRate = Math.max(0, Number(purchaseGstPercent) || 0);
  const freight = Math.max(0, Number(freightPerOrder) || 0);
  const unitCashCost = labelPrice * (1 + gstRate / 100) + freight / orderSize;

  const getPackageMetrics = (quantity, qrType) => {
    const pricePerSticker = qrType === 'simple' ? priceType1 : priceType2;
    const revenue = quantity * pricePerSticker;
    const materialCost = quantity * unitCashCost;
    return {
      revenue,
      materialCost,
      profit: revenue - materialCost
    };
  };

  const getSupplierCashOutlay = (quantity) => {
    if (quantity <= 0) return 0;
    const orders = Math.ceil(quantity / orderSize);
    return orders * (orderSize * labelPrice * (1 + gstRate / 100) + freight);
  };

  return { unitCashCost, getPackageMetrics, getSupplierCashOutlay };
};
