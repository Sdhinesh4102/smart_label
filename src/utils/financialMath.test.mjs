import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCostsAndMargins } from './financialMath.js';

test('supplier quote drives cash planning and contribution', () => {
  const metrics = calculateCostsAndMargins({
    supplierUnitPrice: 0.5,
    purchaseGstPercent: 18,
    supplierMoq: 15000,
    freightPerOrder: 0,
    priceType1: 1,
    priceType2: 2
  });

  assert.ok(Math.abs(metrics.unitCashCost - 0.59) < 0.000001);
  assert.equal(metrics.getSupplierCashOutlay(500), 8850);
  assert.ok(Math.abs(metrics.getPackageMetrics(500, 'simple').profit - 205) < 0.000001);
  assert.ok(Math.abs(metrics.getPackageMetrics(500, 'advanced').profit - 705) < 0.000001);
});

test('actual freight raises unit cost and MOQ cash requirement', () => {
  const metrics = calculateCostsAndMargins({
    supplierUnitPrice: 0.5,
    purchaseGstPercent: 18,
    supplierMoq: 15000,
    freightPerOrder: 1500
  });
  assert.ok(Math.abs(metrics.unitCashCost - 0.69) < 0.000001);
  assert.equal(metrics.getSupplierCashOutlay(15001), 20700);
});
