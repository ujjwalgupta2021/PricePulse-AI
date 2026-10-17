/**
 * PricePulse AI - Main Application Coordinator (js/app.js)
 * Ties UI, ScraperBridge, GeminiEngine, and Visualization Modules together
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  currentAudit: null,

  init() {
    this.initTheme();
    this.initUIState();
    this.bindEvents();
    this.renderWatchlist();
    window.CounterAttack?.init();

    // Check if initial key is saved
    this.updateApiKeyBadge();

    // Load initial demo preview so the dashboard displays impressive visuals immediately on load
    this.loadDemoScenario('fashion', false);
  },

  /**
   * Theme mode switcher (Dark / Light)
   */
  initTheme() {
    const savedTheme = window.StorageService?.getTheme() || 'dark';
    this.applyTheme(savedTheme);
  },

  applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.className = isLight ? 'light-theme' : 'dark-theme';
    
    const iconEl = document.getElementById('themeToggleIcon');
    const textEl = document.getElementById('themeToggleText');
    if (iconEl) iconEl.innerText = isLight ? '🌙' : '☀️';
    if (textEl) textEl.innerText = isLight ? 'Dark' : 'Light';

    window.StorageService?.setTheme(theme);
  },

  toggleTheme() {
    const current = window.StorageService?.getTheme() || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    this.showToast(`Switched to ${next.toUpperCase()} mode ✨`);
  },

  /**
   * Initialize UI state & references
   */
  initUIState() {
    const savedKey = window.StorageService?.getApiKey();
    const keyInput = document.getElementById('geminiApiKeyInput');
    const detectedLabel = document.getElementById('detectedModelName');

    if (savedKey && keyInput) keyInput.value = savedKey;
    if (detectedLabel) {
      const currentModel = window.StorageService?.getModel();
      detectedLabel.innerText = currentModel ? `Active: ${currentModel}` : 'Auto-Detect on Test / Save';
    }
  },

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Theme Mode Toggle
    const btnTheme = document.getElementById('btnThemeToggle');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Audit Form Submit
    const form = document.getElementById('auditForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAuditSubmit();
      });
    }

    // Quick Preset Pills
    const presetPills = document.querySelectorAll('.pill-btn');
    presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const presetKey = pill.getAttribute('data-preset');
        this.loadDemoScenario(presetKey, true);
      });
    });

    // Demo Scenarios Button in Navbar
    const btnDemo = document.getElementById('btnDemoScenarios');
    if (btnDemo) {
      btnDemo.addEventListener('click', () => {
        this.cycleDemoPresets();
      });
    }

    // Paste URL Button
    const btnPaste = document.getElementById('btnPasteUrl');
    if (btnPaste) {
      btnPaste.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            document.getElementById('targetUrl').value = text.trim();
            this.showToast('Pasted URL from clipboard!');
          }
        } catch (e) {
          this.showToast('Clipboard access denied. Please paste manually.', 'error');
        }
      });
    }

    // Auto-Suggest Baseline Button
    const btnAutoBaseline = document.getElementById('btnAutoSuggestBaseline');
    if (btnAutoBaseline) {
      btnAutoBaseline.addEventListener('click', () => {
        const baselineArea = document.getElementById('baselineText');
        if (baselineArea) {
          baselineArea.value = 'In my shop, I sell this for ₹2,499. Customers get immediate size trials, 1-year in-store replacement warranty, and instant take-home today.';
          this.showToast('Loaded sample in-store price details!');
        }
      });
    }

    // Settings Modal Open / Close
    const btnOpenSettings = document.getElementById('btnOpenSettings');
    const btnCloseSettings = document.getElementById('btnCloseSettingsModal');
    const settingsModal = document.getElementById('settingsModal');

    if (btnOpenSettings) {
      btnOpenSettings.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
      });
    }

    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
      });
    }

    // Close modal when clicking on backdrop
    if (settingsModal) {
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
          settingsModal.classList.add('hidden');
        }
      });
    }

    // Toggle Key Visibility
    const btnToggleVis = document.getElementById('btnToggleKeyVisibility');
    const keyInput = document.getElementById('geminiApiKeyInput');
    if (btnToggleVis && keyInput) {
      btnToggleVis.addEventListener('click', () => {
        const isPass = keyInput.type === 'password';
        keyInput.type = isPass ? 'text' : 'password';
        btnToggleVis.innerText = isPass ? 'Hide' : 'Show';
      });
    }

    // Test Key Connection
    const btnTest = document.getElementById('btnTestKey');
    if (btnTest) {
      btnTest.addEventListener('click', () => this.handleTestConnection());
    }

    // Save API Key
    const btnSaveKey = document.getElementById('btnSaveKey');
    if (btnSaveKey) {
      btnSaveKey.addEventListener('click', () => this.handleSaveApiKey());
    }

    // Export Markdown Report
    const btnExport = document.getElementById('btnExportMarkdown');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.handleExportReport());
    }

    // Save to Watchlist
    const btnSaveWatchlist = document.getElementById('btnSaveToWatchlist');
    if (btnSaveWatchlist) {
      btnSaveWatchlist.addEventListener('click', () => this.handleSaveCurrentToWatchlist());
    }

    // Clear Watchlist
    const btnClearWl = document.getElementById('btnClearWatchlist');
    if (btnClearWl) {
      btnClearWl.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your local competitor watchlist?')) {
          window.StorageService?.clearWatchlist();
          this.renderWatchlist();
          this.showToast('Watchlist cleared.');
        }
      });
    }
  },

  /**
   * Handle form submission & intelligence scan execution
   */
  async handleAuditSubmit() {
    const targetUrlInput = document.getElementById('targetUrl');
    const baselineInput = document.getElementById('baselineText');
    const brandTypeSelect = document.getElementById('yourBrandType');
    const focusSelect = document.getElementById('analysisFocus');
    const proxySelect = document.getElementById('scrapingEngine');

    const targetUrl = targetUrlInput?.value.trim();
    const baselineText = baselineInput?.value.trim();
    const brandType = brandTypeSelect?.value || 'clothing';
    const strategicFocus = focusSelect?.value || 'walkin_objection';
    const preferredEngine = proxySelect?.value || 'jina';

    if (!targetUrl) {
      this.showToast('Please enter a competitor or online product URL.', 'error');
      targetUrlInput.focus();
      return;
    }

    if (!baselineText) {
      this.showToast('Please enter what you sell it for in your shop.', 'error');
      baselineInput.focus();
      return;
    }

    const apiKey = window.StorageService?.getApiKey();
    const model = window.StorageService?.getModel() || 'gemini-3.8-flash';

    // Show Progress State
    this.setScanningState(true);

    try {
      // Step 1: Scrape Competitor Web Page
      this.updateProgress(25, 'Step 1/3: Reading competitor web page & pricing...', 'Step 1/3');
      const scrapeResult = await window.ScraperBridge.scrapeTarget(
        targetUrl, 
        preferredEngine, 
        (status, pct) => this.updateProgress(pct, status, 'Step 1/3')
      );

      // Step 2: Feed into Gemini AI Engine
      this.updateProgress(65, 'Step 2/3: Gemini AI analyzing price difference & risk to shop...', 'Step 2/3');
      
      const isDemo = !apiKey;
      if (isDemo) {
        this.showToast('Running in Demo Simulation Mode (No API key detected).');
      }

      const auditData = await window.GeminiEngine.runAudit({
        apiKey,
        model,
        targetUrl,
        pageTitle: scrapeResult.title,
        scrapedText: scrapeResult.rawText,
        baselineText,
        brandType,
        strategicFocus,
        isDemo
      });

      // Step 3: Render Intelligence Visuals
      this.updateProgress(95, 'Step 3/3: Drafting staff counter-script, WhatsApp text & counter sign...', 'Step 3/3');
      await new Promise(r => setTimeout(r, 400));

      this.currentAudit = {
        ...auditData,
        targetUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      this.renderAuditResults(this.currentAudit);

      // Cache to history
      window.StorageService?.saveAuditHistory(this.currentAudit);

      this.showToast('Price check complete! Your shop action plan is ready.');
      
      // Smooth scroll to results
      const resSection = document.getElementById('resultsSection');
      if (resSection) {
        resSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    } catch (err) {
      console.error('Audit execution error:', err);
      this.showToast(`Scan failed: ${err.message}`, 'error');
    } finally {
      this.setScanningState(false);
    }
  },

  /**
   * Render audit data to the visual components
   */
  renderAuditResults(data) {
    const resSection = document.getElementById('resultsSection');
    if (resSection) resSection.classList.remove('hidden');

    // Header info
    const hostEl = document.getElementById('resTargetDomain');
    const timeEl = document.getElementById('resTimestamp');
    const titleEl = document.getElementById('resProductTitle');

    if (hostEl) hostEl.innerText = data.competitor_domain || window.StorageService?.extractDomain(data.targetUrl);
    if (timeEl) timeEl.innerText = data.timestamp || 'Just now';
    if (titleEl) titleEl.innerText = data.product_title || 'Competitor Target';

    // Module 1: The Pulse Meter
    window.PulseMeter?.update(data);

    // Module 2: The Diff Matrix
    window.DiffMatrix?.update(data);

    // Module 3: The Counter-Attack Script Generator
    window.CounterAttack?.update(data);
  },

  /**
   * Load pre-configured demo scenario
   */
  loadDemoScenario(scenarioKey, triggerScroll = false) {
    const urlInput = document.getElementById('targetUrl');
    const baselineInput = document.getElementById('baselineText');
    const brandSelect = document.getElementById('yourBrandType');
    const focusSelect = document.getElementById('analysisFocus');

    if (scenarioKey === 'fashion') {
      if (urlInput) urlInput.value = 'https://competitor-apparel.store/products/arctic-expedition-parka';
      if (baselineInput) baselineInput.value = 'In my boutique, we sell this jacket for ₹2,799 with full mirror fitting, immediate take-home, and complimentary thermal cap.';
      if (brandSelect) brandSelect.value = 'clothing';
      if (focusSelect) focusSelect.value = 'walkin_objection';

      const demoData = window.GeminiEngine?.generateSimulatedAudit({
        targetUrl: 'https://competitor-apparel.store/products/arctic-expedition-parka',
        pageTitle: 'All-Weather Expedition Winter Jacket',
        baselineText: baselineInput.value,
        brandType: 'clothing',
        strategicFocus: 'walkin_objection'
      });

      this.currentAudit = {
        ...demoData,
        targetUrl: 'https://competitor-apparel.store/products/arctic-expedition-parka',
        timestamp: 'Demo: Clothing Boutique'
      };
      this.renderAuditResults(this.currentAudit);
    } else if (scenarioKey === 'electronics') {
      if (urlInput) urlInput.value = 'https://audio-soundlab.io/headphones/anc-pro-over-ear';
      if (baselineInput) baselineInput.value = 'In my electronics shop, we sell these earbuds for ₹2,399 with live phone testing on counter and 6-month in-store replacement.';
      if (brandSelect) brandSelect.value = 'electronics';
      if (focusSelect) focusSelect.value = 'walkin_objection';

      const demoData = window.GeminiEngine?.generateSimulatedAudit({
        targetUrl: 'https://audio-soundlab.io/headphones/anc-pro-over-ear',
        pageTitle: 'ANC Wireless Bluetooth Earbuds',
        baselineText: baselineInput.value,
        brandType: 'electronics',
        strategicFocus: 'walkin_objection'
      });

      this.currentAudit = {
        ...demoData,
        targetUrl: 'https://audio-soundlab.io/headphones/anc-pro-over-ear',
        timestamp: 'Demo: Mobile & Electronics'
      };
      this.renderAuditResults(this.currentAudit);
    } else if (scenarioKey === 'grocery' || scenarioKey === 'saas') {
      if (urlInput) urlInput.value = 'https://quick-grocery.app/products/premium-basmati-rice-5kg';
      if (baselineInput) baselineInput.value = 'In our grocery store, we sell fresh mill-packed 5kg Basmati Rice for ₹650 with free sugar pack on bills over ₹1,500.';
      if (brandSelect) brandSelect.value = 'grocery';
      if (focusSelect) focusSelect.value = 'walkin_objection';

      const demoData = window.GeminiEngine?.generateSimulatedAudit({
        targetUrl: 'https://quick-grocery.app/products/premium-basmati-rice-5kg',
        pageTitle: 'Premium Basmati Rice & Oil Combo (5kg)',
        baselineText: baselineInput.value,
        brandType: 'grocery',
        strategicFocus: 'walkin_objection'
      });

      this.currentAudit = {
        ...demoData,
        targetUrl: 'https://quick-grocery.app/products/premium-basmati-rice-5kg',
        timestamp: 'Demo: Supermarket / Kirana'
      };
      this.renderAuditResults(this.currentAudit);
    }

    if (triggerScroll) {
      const resSection = document.getElementById('resultsSection');
      if (resSection) resSection.scrollIntoView({ behavior: 'smooth' });
      const labelMap = { fashion: 'Clothing Boutique', electronics: 'Mobile & Electronics', grocery: 'Supermarket / Kirana', saas: 'Supermarket / Kirana' };
      this.showToast(`Loaded ${labelMap[scenarioKey] || scenarioKey} sample! ✨`);
    }
  },

  cycleDemoPresets() {
    const presets = ['fashion', 'electronics', 'grocery'];
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    this.loadDemoScenario(randomPreset, true);
  },

  /**
   * Save current audit item to local watchlist
   */
  handleSaveCurrentToWatchlist() {
    if (!this.currentAudit) {
      this.showToast('Run an audit first before saving.', 'error');
      return;
    }

    const priceNew = this.currentAudit.metrics_diff?.price?.new || '$0.00';
    const priceOld = this.currentAudit.metrics_diff?.price?.old || '$0.00';

    const item = {
      targetUrl: this.currentAudit.targetUrl,
      domain: this.currentAudit.competitor_domain,
      productTitle: this.currentAudit.product_title,
      threatLevel: this.currentAudit.threat_level,
      threatScore: this.currentAudit.threat_score,
      currentPrice: priceNew,
      oldPrice: priceOld,
      metrics: this.currentAudit.metrics_diff
    };

    window.StorageService?.addToWatchlist(item);
    this.renderWatchlist();
    this.showToast('Saved to local competitor watchlist! 📌');
  },

  /**
   * Render local watchlist cards
   */
  renderWatchlist() {
    const container = document.getElementById('watchlistContainer');
    if (!container) return;

    const list = window.StorageService?.getWatchlist() || [];
    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-watchlist-state">
          <p>No saved competitor targets yet. Run a scan above and click "Save to Watchlist" to track price trends!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'watchlist-card';

      let pillClass = 'threat-amber';
      if (item.threatLevel === 'RED') pillClass = 'threat-red';
      if (item.threatLevel === 'GREEN') pillClass = 'threat-green';

      card.innerHTML = `
        <div class="wl-top">
          <span class="wl-domain">${window.DiffMatrix?.escapeHtml(item.domain || 'competitor.com')}</span>
          <span class="threat-pill ${pillClass}" style="font-size: 0.68rem; padding: 0.15rem 0.5rem;">${item.threatLevel || 'MONITORED'}</span>
        </div>
        <div class="wl-title">${window.DiffMatrix?.escapeHtml(item.productTitle || 'Tracked Product')}</div>
        <div class="wl-bottom">
          <span class="wl-price">${window.DiffMatrix?.escapeHtml(item.currentPrice || '$0.00')} <span style="font-size: 0.72rem; color: var(--text-dim); text-decoration: line-through;">${window.DiffMatrix?.escapeHtml(item.oldPrice || '')}</span></span>
          <button class="btn btn-secondary btn-sm btn-wl-load" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Re-Audit</button>
        </div>
      `;

      // Click to load
      const loadBtn = card.querySelector('.btn-wl-load');
      loadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('targetUrl').value = item.targetUrl;
        document.getElementById('baselineText').value = `Baseline Price: ${item.oldPrice}. Monitored on ${new Date(item.savedAt).toLocaleDateString()}`;
        this.handleAuditSubmit();
      });

      container.appendChild(card);
    });
  },

  /**
   * Export audit report as formatted Markdown
   */
  handleExportReport() {
    if (!this.currentAudit) {
      this.showToast('No active audit data to export.', 'error');
      return;
    }

    const d = this.currentAudit;
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `PricePulse_Audit_${d.competitor_domain || 'Competitor'}_${dateStr}.md`;

    const mdContent = `# 🏪 PricePulse AI: Shopkeeper Counter-Attack Report
**Product:** ${d.product_title || 'N/A'}  
**Competitor / Online Link:** ${d.targetUrl || 'N/A'}  
**Competitor Platform:** ${d.competitor_domain || 'Online Store'}  
**Audit Date:** ${new Date().toLocaleString()}  

---

## 1. Risk to Your Shop (Threat Assessment)
- **Threat Level:** ${d.threat_level} (${d.threat_score}/100)
- **Shopkeeper Summary:** ${d.threat_rationale}

### Key Competitor Moves Detected:
${(d.strategic_shifts || []).map(s => `- ${s}`).join('\n')}

---

## 2. Your Shop vs. Online Competitor (Comparison)
| Comparison Factor | Your Shop | Online Competitor | Status | Retail Note |
|---|---|---|---|---|
| **Price** | ${d.metrics_diff?.price?.old || 'N/A'} | ${d.metrics_diff?.price?.new || 'N/A'} | ${d.metrics_diff?.price?.delta_pct || 0}% | ${d.metrics_diff?.price?.notes || ''} |
| **Delivery vs Instant Carry** | ${d.metrics_diff?.shipping?.old || 'N/A'} | ${d.metrics_diff?.shipping?.new || 'N/A'} | ${d.metrics_diff?.shipping?.status || ''} | ${d.metrics_diff?.shipping?.notes || ''} |
| **In-Store Trial & Perks** | ${d.metrics_diff?.bundle_promo?.old || 'N/A'} | ${d.metrics_diff?.bundle_promo?.new || 'N/A'} | ${d.metrics_diff?.bundle_promo?.status || ''} | ${d.metrics_diff?.bundle_promo?.notes || ''} |
| **Trust & Warranty** | ${d.metrics_diff?.urgency_stock?.old || 'N/A'} | ${d.metrics_diff?.urgency_stock?.new || 'N/A'} | ${d.metrics_diff?.urgency_stock?.status || ''} | ${d.metrics_diff?.urgency_stock?.notes || ''} |

**Your Shop's Advantage (In-Store Moat):**  
> ${d.positioning_analysis || 'N/A'}

---

## 3. Your Shop's In-Store Action Plan
**Recommended Defense Strategy:** ${d.counter_attack?.recommended_strategy || 'In-Store Trial & Value Shielding'}

### A. Staff Counter-Script (Objection Handler)
\`\`\`text
${d.counter_attack?.staff_counter_script || d.counter_attack?.shopify_announcement_bar || ''}
\`\`\`

### B. WhatsApp Customer Broadcast
\`\`\`text
${d.counter_attack?.whatsapp_broadcast || d.counter_attack?.social_ad_hook || ''}
\`\`\`

### C. Shop Counter Signboard (Print on A4 or Blackboard)
\`\`\`text
${d.counter_attack?.shop_counter_sign || (d.counter_attack?.email_campaign ? d.counter_attack.email_campaign.body : '')}
\`\`\`

### D. In-Store Margin Bundle & Playbook
- **Bundle Promo Code:** \`${d.counter_attack?.in_store_bundle?.code || d.counter_attack?.promo_coupon?.code || 'BEATONLINE'}\`
- **Bundle Offer Title:** ${d.counter_attack?.in_store_bundle?.title || d.counter_attack?.promo_coupon?.title || ''}
- **Bundle Details:** ${d.counter_attack?.in_store_bundle?.offer_details || d.counter_attack?.promo_coupon?.offer_details || ''}
- **Floor Playbook:** ${d.counter_attack?.in_store_bundle?.campaign_playbook || d.counter_attack?.promo_coupon?.campaign_playbook || ''}

---
*Generated client-side by PricePulse AI (Beat Online Discounts & Keep Walk-in Customers)*
`;

    // Trigger download
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Downloaded Markdown Audit Report! 📄');
  },

  /**
   * Handle testing API key connection
   */
  async handleTestConnection() {
    const keyInput = document.getElementById('geminiApiKeyInput');
    const statusBox = document.getElementById('keyValidationStatus');
    const detectedLabel = document.getElementById('detectedModelName');
    const btnTest = document.getElementById('btnTestKey');

    const key = keyInput?.value.trim();
    if (!key) {
      this.showToast('Please enter an API key to test.', 'error');
      if (statusBox) {
        statusBox.className = 'validation-status-box status-error';
        statusBox.classList.remove('hidden');
        statusBox.innerHTML = '⚠️ Please enter or paste your Google Gemini API key first.';
      }
      keyInput?.focus();
      return;
    }

    if (btnTest) {
      btnTest.disabled = true;
      btnTest.innerText = 'Testing... ⏳';
    }

    if (statusBox) {
      statusBox.className = 'validation-status-box';
      statusBox.classList.remove('hidden');
      statusBox.innerHTML = '⚡ Verifying key with Google AI Studio...';
    }

    try {
      const resp = await window.GeminiEngine?.autoDetectAndTest(key);
      if (detectedLabel) {
        detectedLabel.innerText = `Active Model: ${resp.modelUsed}`;
      }
      if (statusBox) {
        statusBox.className = 'validation-status-box status-success';
        statusBox.innerHTML = `✅ <strong>Connected & Verified!</strong> Auto-paired with <code>${resp.modelUsed}</code> in real time. Zero configuration needed!`;
      }
      this.showToast(`Connected & paired with ${resp.modelUsed}! ✨`);
    } catch (err) {
      if (statusBox) {
        statusBox.className = 'validation-status-box status-error';
        statusBox.innerHTML = `❌ <strong>Connection Failed:</strong> ${err.message}`;
      }
      this.showToast(`Connection failed: ${err.message}`, 'error');
    } finally {
      if (btnTest) {
        btnTest.disabled = false;
        btnTest.innerText = 'Test Connection';
      }
    }
  },

  /**
   * Save API Key
   */
  async handleSaveApiKey() {
    const keyInput = document.getElementById('geminiApiKeyInput');
    const settingsModal = document.getElementById('settingsModal');
    const detectedLabel = document.getElementById('detectedModelName');
    const btnSave = document.getElementById('btnSaveKey');

    const key = keyInput?.value.trim() || '';
    if (!key) {
      this.showToast('Please enter your Gemini API key before saving.', 'error');
      keyInput?.focus();
      return;
    }

    // 1. Immediately save into private local browser storage
    window.StorageService?.setApiKey(key);
    this.updateApiKeyBadge();

    // 2. Immediate visual button feedback
    if (btnSave) {
      btnSave.innerText = 'Saved! ✅';
      btnSave.style.background = 'var(--threat-green)';
      btnSave.style.borderColor = 'var(--threat-green)';
    }

    // 3. Immediate popup notification
    this.showToast('API Key saved successfully! 🔒 Vault updated.');

    // 4. Smooth modal close
    setTimeout(() => {
      if (settingsModal) settingsModal.classList.add('hidden');
      if (btnSave) {
        btnSave.innerText = 'Save & Lock Key';
        btnSave.style.background = '';
        btnSave.style.borderColor = '';
      }
    }, 450);

    // 5. Silent background detection if not tested yet
    if (key.length > 10) {
      window.GeminiEngine?.autoDetectAndTest(key)
        .then(resp => {
          if (detectedLabel) {
            detectedLabel.innerText = `Active Model: ${resp.modelUsed}`;
          }
        })
        .catch(e => {
          console.warn('Background key check note:', e.message);
        });
    }
  },

  updateApiKeyBadge() {
    const badgeLabel = document.getElementById('apiKeyBtnLabel');
    const hasKey = window.StorageService?.hasApiKey();
    if (badgeLabel) {
      badgeLabel.innerText = hasKey ? 'API Key: Active' : 'API Key';
    }
  },

  /**
   * Progress Bar controller
   */
  setScanningState(isScanning) {
    const btn = document.getElementById('btnRunAudit');
    const spinner = document.getElementById('auditSpinner');
    const btnText = document.getElementById('btnRunAuditText');
    const progressWrap = document.getElementById('scanProgressContainer');

    if (btn) btn.disabled = isScanning;
    if (spinner) spinner.classList.toggle('hidden', !isScanning);
    if (btnText) btnText.innerText = isScanning ? 'Auditing Target...' : 'Launch Intelligence Scan';
    if (progressWrap) progressWrap.classList.toggle('hidden', !isScanning);
  },

  updateProgress(pct, statusMsg, stepBadge) {
    const bar = document.getElementById('scanProgressBar');
    const msg = document.getElementById('scanStatusMsg');
    const badge = document.getElementById('scanStepBadge');

    if (bar) bar.style.width = `${pct}%`;
    if (msg) msg.innerText = statusMsg;
    if (badge && stepBadge) badge.innerText = stepBadge;
  },

  /**
   * Toast notification helper
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'error' ? '⚠️' : '✨';
    toast.innerHTML = `<span>${icon}</span> <span>${window.DiffMatrix?.escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

window.App = App;
window.showToast = (msg, type) => App.showToast(msg, type);
