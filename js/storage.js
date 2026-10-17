/**
 * PricePulse AI - Storage & Privacy Vault (js/storage.js)
 * 100% Client-Side LocalStorage & Session Management
 */

const StorageKeys = {
  API_KEY: 'pricepulse_gemini_api_key',
  MODEL: 'pricepulse_gemini_model',
  WATCHLIST: 'pricepulse_watchlist',
  HISTORY: 'pricepulse_audit_history',
  PREFERENCES: 'pricepulse_user_prefs'
};

const StorageService = {
  // --- API Key & Model Settings ---
  getApiKey() {
    return localStorage.getItem(StorageKeys.API_KEY) || '';
  },

  setApiKey(key) {
    if (!key || key.trim() === '') {
      localStorage.removeItem(StorageKeys.API_KEY);
    } else {
      localStorage.setItem(StorageKeys.API_KEY, key.trim());
    }
  },

  hasApiKey() {
    const key = this.getApiKey();
    return Boolean(key && key.length > 10);
  },

  getModel() {
    return localStorage.getItem(StorageKeys.MODEL) || 'gemini-1.5-flash';
  },

  setModel(modelName) {
    if (modelName) {
      localStorage.setItem(StorageKeys.MODEL, modelName.trim());
    }
  },

  // --- Theme Mode ---
  getTheme() {
    return localStorage.getItem('pricepulse_theme') || 'dark';
  },

  setTheme(theme) {
    localStorage.setItem('pricepulse_theme', theme === 'light' ? 'light' : 'dark');
  },

  // --- Watchlist Management ---
  getWatchlist() {
    try {
      const data = localStorage.getItem(StorageKeys.WATCHLIST);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse watchlist from storage:', e);
      return [];
    }
  },

  addToWatchlist(item) {
    try {
      const list = this.getWatchlist();
      // Avoid duplicate by URL or domain + product title
      const existingIdx = list.findIndex(x => x.targetUrl === item.targetUrl);
      const entry = {
        id: item.id || 'wl_' + Date.now(),
        targetUrl: item.targetUrl,
        domain: item.domain || this.extractDomain(item.targetUrl),
        productTitle: item.productTitle || 'Tracked Product',
        threatLevel: item.threatLevel || 'MODERATE',
        threatScore: item.threatScore || 50,
        currentPrice: item.currentPrice || '$0.00',
        oldPrice: item.oldPrice || '$0.00',
        savedAt: new Date().toISOString(),
        lastAudit: item
      };

      if (existingIdx >= 0) {
        list[existingIdx] = entry;
      } else {
        list.unshift(entry);
      }

      // Cap at 25 items for performance
      if (list.length > 25) list.length = 25;
      localStorage.setItem(StorageKeys.WATCHLIST, JSON.stringify(list));
      return entry;
    } catch (e) {
      console.error('Error saving to watchlist:', e);
      return null;
    }
  },

  removeFromWatchlist(targetUrl) {
    const list = this.getWatchlist().filter(x => x.targetUrl !== targetUrl);
    localStorage.setItem(StorageKeys.WATCHLIST, JSON.stringify(list));
    return list;
  },

  clearWatchlist() {
    localStorage.removeItem(StorageKeys.WATCHLIST);
  },

  // --- Audit History ---
  saveAuditHistory(auditData) {
    try {
      const history = this.getAuditHistory();
      const record = {
        id: 'audit_' + Date.now(),
        timestamp: new Date().toISOString(),
        ...auditData
      };
      history.unshift(record);
      if (history.length > 20) history.length = 20;
      localStorage.setItem(StorageKeys.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to cache audit history:', e);
    }
  },

  getAuditHistory() {
    try {
      const data = localStorage.getItem(StorageKeys.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  extractDomain(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch (e) {
      return url || 'competitor.com';
    }
  }
};

window.StorageService = StorageService;
