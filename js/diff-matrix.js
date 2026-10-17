/**
 * PricePulse AI - The Diff Matrix Module (js/diff-matrix.js)
 * High-contrast side-by-side transition cards comparing baseline vs live page
 */

const DiffMatrix = {
  /**
   * Update the Diff Matrix module
   * @param {Object} auditData 
   */
  update(auditData) {
    const grid = document.getElementById('matrixGrid');
    const posText = document.getElementById('positioningText');
    if (!grid) return;

    grid.innerHTML = '';

    const metrics = auditData.metrics_diff || {};

    // 1. Price Card
    const price = metrics.price || {
      old: 'N/A',
      new: 'N/A',
      delta_pct: 0,
      status: 'neutral',
      notes: 'No historical price delta available.'
    };
    grid.appendChild(this.createPriceCard(price));

    // 2. Shipping / Delivery vs Take-Home Card
    const shipping = metrics.shipping || {
      old: 'Instant Carry-Out (₹0)',
      new: 'Courier Delivery',
      status: 'positive',
      notes: 'Customer takes it home today without courier waiting.'
    };
    grid.appendChild(this.createGenericCard('Delivery vs Instant Take-Home', shipping, '🚚'));

    // 3. Bundles & In-Store Perks Card
    const promo = metrics.bundle_promo || {
      old: 'In-Store Trial & Personal Service',
      new: 'Online-Only Promo Code',
      status: 'positive',
      notes: 'Personal fitting and service beats digital coupons.'
    };
    grid.appendChild(this.createGenericCard('In-Store Trial & Perks', promo, '🎁'));

    // 4. Trust, Warranty & Replacement Card
    const urgency = metrics.urgency_stock || {
      old: 'Direct Store Warranty & Trial',
      new: 'Online Return Friction',
      status: 'positive',
      notes: 'Immediate counter replacement if defective.'
    };
    grid.appendChild(this.createGenericCard('Trust, Trial & Warranty', urgency, '🛡️'));

    // 5. Update Positioning Analysis
    if (posText) {
      posText.innerText = auditData.positioning_analysis || 
        'Online sellers discount to clear warehouse surplus. Counter this by emphasizing in-store trial and personal service.';
    }
  },

  /**
   * Price card with dynamic percentage pill
   */
  createPriceCard(priceObj) {
    const card = document.createElement('div');
    card.className = 'diff-card';

    const delta = priceObj.delta_pct || 0;
    let badgeClass = 'delta-neutral';
    let deltaText = `${delta > 0 ? '+' : ''}${delta}%`;

    // In retail, competitor dropping price is threatening (red), raising is positive (green)
    if (delta < 0) {
      badgeClass = 'delta-negative';
    } else if (delta > 0) {
      badgeClass = 'delta-positive';
    } else {
      deltaText = '0% (Equal)';
    }

    card.innerHTML = `
      <div class="diff-card-header">
        <span>💰 Price Comparison</span>
        <span class="delta-badge ${badgeClass}">${deltaText}</span>
      </div>
      <div class="diff-values">
        <span class="val-old">${this.escapeHtml(priceObj.old || 'N/A')}</span>
        <span class="val-arrow">&rarr;</span>
        <span class="val-new">${this.escapeHtml(priceObj.new || 'N/A')}</span>
      </div>
      <p class="diff-notes">${this.escapeHtml(priceObj.notes || '')}</p>
    `;
    return card;
  },

  /**
   * Generic transition card
   */
  createGenericCard(title, dataObj, icon) {
    const card = document.createElement('div');
    card.className = 'diff-card';

    let badgeClass = 'delta-neutral';
    let badgeLabel = 'Matched';

    if (dataObj.status === 'negative') {
      badgeClass = 'delta-negative';
      badgeLabel = 'Online Cheaper';
    } else if (dataObj.status === 'positive') {
      badgeClass = 'delta-positive';
      badgeLabel = 'Your Shop Edge';
    }

    card.innerHTML = `
      <div class="diff-card-header">
        <span>${icon} ${this.escapeHtml(title)}</span>
        <span class="delta-badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="diff-values">
        <span class="val-old">${this.escapeHtml(dataObj.old || 'None')}</span>
        <span class="val-arrow">&rarr;</span>
        <span class="val-new" style="font-size: 0.96rem;">${this.escapeHtml(dataObj.new || 'None')}</span>
      </div>
      <p class="diff-notes">${this.escapeHtml(dataObj.notes || '')}</p>
    `;
    return card;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.DiffMatrix = DiffMatrix;
