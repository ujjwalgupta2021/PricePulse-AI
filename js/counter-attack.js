/**
 * PricePulse AI - The Counter-Attack Script Generator (js/counter-attack.js)
 * Multi-tab generator for store announcements, social ad hooks, emails & coupons
 * Includes 1-click clipboard copy interactions
 */

const CounterAttack = {
  currentData: null,

  init() {
    this.bindTabEvents();
    this.bindCopyEvents();
  },

  /**
   * Update the Counter-Attack component with AI results
   */
  update(auditData) {
    this.currentData = auditData.counter_attack || {};

    const recStrategy = this.currentData.recommended_strategy || 'In-Store Value Shield';
    const recEl = document.getElementById('recStrategyTitle');
    if (recEl) recEl.innerText = recStrategy;

    // 1. Tab 1: Staff Counter-Script (Objection handler)
    const staffScript = this.currentData.staff_counter_script || 
      `Customer: "I saw this cheaper online on Amazon / competitor store."\n\n` +
      `Your Staff's Winning Response:\n` +
      `"Sir/Madam, I completely understand! Online, you often wait 4-5 days, pay delivery charges, and if the size or color isn't right, you have to pack it and wait 10 days for a refund.\n\n` +
      `Here in our store, you can try it right now, verify the genuine fabric/seal, and take it home today. Plus, if any problem happens, our shop is right here on this street to replace it immediately. Let me pack this fresh piece for you!"`;
    const staffEl = document.getElementById('codeStaffScript');
    if (staffEl) staffEl.innerText = staffScript;

    // 2. Tab 2: WhatsApp Broadcast
    const whatsappMsg = this.currentData.whatsapp_broadcast || 
      `📢 Exclusive Shop Update for our VIP Customers!\n\n` +
      `We noticed online prices fluctuating this week. At our store, we believe in 100% genuine quality you can touch & try before you buy.\n\n` +
      `✨ Special In-Store Perk This Week:\n` +
      `Visit our shop before Sunday and get our In-Store Replacement Guarantee + Complimentary Gift on your purchase!\n\n` +
      `📍 Visit us at: [Your Shop Name & Location]\n` +
      `📲 Reply 'HOLD' to reserve your size today!`;
    const waEl = document.getElementById('codeWhatsAppMsg');
    if (waEl) waEl.innerText = whatsappMsg;

    // 3. Tab 3: Shop Counter Signboard
    const counterSign = this.currentData.shop_counter_sign || 
      `====================================================\n` +
      `       WHY BUY FROM YOUR LOCAL STORE TODAY?         \n` +
      `====================================================\n\n` +
      `✅ 100% Genuine & Fresh Stock (Zero Transit Damage)\n` +
      `✅ Try Before You Buy - Free Trial & Immediate Fit\n` +
      `✅ Instant In-Store Exchange - No Courier Return Hassle\n` +
      `✅ Take It Home In 2 Minutes (Zero Delivery Waiting!)\n\n` +
      `Special Today: Ask at the counter for our complimentary bundle!`;
    const signEl = document.getElementById('codeCounterSign');
    if (signEl) signEl.innerText = counterSign;

    // 4. Tab 4: In-Store Margin Bundle
    const promo = this.currentData.in_store_bundle || {
      code: 'BEATONLINE',
      title: 'In-Store Trial & Replacement Bundle',
      offer_details: 'Free complimentary accessory or 1-year in-store replacement with any purchase over ₹1,999.',
      campaign_playbook: 'Do not match predatory online price cuts directly. Instead, bundle a low-cost, high-perceived-value accessory (worth ₹100-200) to keep customer delight high while protecting your core margin.'
    };
    const couponCodeEl = document.getElementById('promoCouponCode');
    const promoTitleEl = document.getElementById('promoTitle');
    const promoDescEl = document.getElementById('promoDescription');
    const promoPlaybookEl = document.getElementById('codeStoreBundle');

    if (couponCodeEl) couponCodeEl.innerText = promo.code || 'BEATONLINE';
    if (promoTitleEl) promoTitleEl.innerText = promo.title || 'In-Store Trial & Replacement Bundle';
    if (promoDescEl) promoDescEl.innerText = promo.offer_details || '';
    if (promoPlaybookEl) promoPlaybookEl.innerText = promo.campaign_playbook || '';
  },

  /**
   * Bind tab navigation switches
   */
  bindTabEvents() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        if (!targetId) return;

        // Reset all tabs
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });

        // Hide all panes
        const panes = document.querySelectorAll('.tab-pane');
        panes.forEach(p => p.classList.add('hidden'));

        // Activate selected
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const activePane = document.getElementById(targetId);
        if (activePane) activePane.classList.remove('hidden');
      });
    });
  },

  /**
   * Bind 1-click clipboard copy buttons
   */
  bindCopyEvents() {
    const copyBtns = document.querySelectorAll('.btn-copy-code');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-copy-target');
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        let textToCopy = targetEl.innerText;

        // If email campaign, copy subject and preview together with body
        if (targetId === 'codeEmailCampaign') {
          const subj = document.getElementById('emailSubjectLine')?.innerText || '';
          const prev = document.getElementById('emailPreviewLine')?.innerText || '';
          textToCopy = `SUBJECT: ${subj}\nPREVIEW: ${prev}\n\n${textToCopy}`;
        }

        try {
          await navigator.clipboard.writeText(textToCopy);
          this.triggerCopySuccess(btn);
          if (window.showToast) {
            window.showToast('Copied to clipboard! Ready to deploy 🚀');
          }
        } catch (err) {
          console.error('Clipboard copy failed:', err);
          // Fallback selection
          const range = document.createRange();
          range.selectNodeContents(targetEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('copy');
          this.triggerCopySuccess(btn);
        }
      });
    });
  },

  triggerCopySuccess(btn) {
    const originalText = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Copied! ✨</span>
    `;

    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = originalText;
    }, 2200);
  }
};

window.CounterAttack = CounterAttack;
