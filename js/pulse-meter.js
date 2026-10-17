/**
 * PricePulse AI - The Pulse Meter Module (js/pulse-meter.js)
 * High-performance SVG needle & arc animation with color-coded threat thresholds
 */

const PulseMeter = {
  // SVG arc length calculation for semi-circle
  // Radius = 95, Arc circumference = Math.PI * 95 ≈ 298.45
  ARC_LENGTH: 298,

  /**
   * Render or update the Pulse Meter
   * @param {Object} auditData parsed intelligence response
   */
  update(auditData) {
    const score = Math.max(0, Math.min(100, Number(auditData.threat_score) || 0));
    const threatLevel = (auditData.threat_level || this.computeThreatLevel(score)).toUpperCase();
    const rationale = auditData.threat_rationale || 'Competitor monitoring active.';
    const shifts = auditData.strategic_shifts || [];

    // 1. Update Gauge Visual Elements
    this.animateNeedle(score);
    this.animateArc(score, threatLevel);
    this.animateScoreNumber(score);

    // 2. Update Badges and Header Pill
    this.updateThreatBadge(threatLevel, score);
    this.updateRationale(rationale, threatLevel);
    this.updateStrategicShifts(shifts);
  },

  /**
   * Needle rotation from 0 to 180 degrees
   * 0 score -> 0deg (pointing left)
   * 50 score -> 90deg (pointing top)
   * 100 score -> 180deg (pointing right)
   */
  animateNeedle(score) {
    const needle = document.getElementById('gaugeNeedle');
    if (!needle) return;

    // Angle in degrees: 0 score = 0 deg, 100 score = 180 deg
    const degrees = (score / 100) * 180;
    needle.style.transform = `rotate(${degrees}deg)`;
  },

  /**
   * Animate stroke-dashoffset of SVG fill arc
   */
  animateArc(score, threatLevel) {
    const arc = document.getElementById('gaugeFillArc');
    if (!arc) return;

    // Offset: at score 0 => dashoffset = ARC_LENGTH (invisible)
    // At score 100 => dashoffset = 0 (full semi-circle)
    const targetOffset = this.ARC_LENGTH - ((score / 100) * this.ARC_LENGTH);
    arc.style.strokeDashoffset = targetOffset;

    // Set dynamic stroke color according to threat
    if (threatLevel === 'RED') {
      arc.style.stroke = 'var(--threat-red)';
    } else if (threatLevel === 'AMBER' || threatLevel === 'MODERATE' || threatLevel === 'YELLOW') {
      arc.style.stroke = 'var(--threat-amber)';
    } else {
      arc.style.stroke = 'var(--threat-green)';
    }
  },

  /**
   * Smooth number counter animation
   */
  animateScoreNumber(targetScore) {
    const numEl = document.getElementById('gaugeScoreNumber');
    if (!numEl) return;

    const startScore = parseInt(numEl.innerText, 10) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startScore + (targetScore - startScore) * eased);
      numEl.innerText = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        numEl.innerText = targetScore;
      }
    }

    requestAnimationFrame(step);
  },

  /**
   * Update badge status
   */
  updateThreatBadge(threatLevel, score = 0) {
    const badge = document.getElementById('threatLevelBadge');
    const scorePill = document.getElementById('threatScoreHeaderPill');

    if (scorePill) {
      scorePill.innerText = `Threat Index: ${score}/100`;
    }

    if (!badge) return;

    badge.className = 'threat-pill';

    if (threatLevel === 'RED' || threatLevel === 'CRITICAL') {
      badge.classList.add('threat-red');
      badge.innerText = '🔴 Critical Threat';
    } else if (threatLevel === 'AMBER' || threatLevel === 'MODERATE' || threatLevel === 'YELLOW') {
      badge.classList.add('threat-amber');
      badge.innerText = '🟡 Moderate Shift';
    } else {
      badge.classList.add('threat-green');
      badge.innerText = '🟢 Low Threat';
    }
  },

  /**
   * Update executive summary rationale
   */
  updateRationale(rationaleText, threatLevel) {
    const el = document.getElementById('threatRationaleText');
    const box = document.getElementById('threatVerdictBox');
    if (el) el.innerText = rationaleText;

    if (box) {
      if (threatLevel === 'RED') {
        box.style.borderLeftColor = 'var(--threat-red)';
      } else if (threatLevel === 'AMBER' || threatLevel === 'MODERATE') {
        box.style.borderLeftColor = 'var(--threat-amber)';
      } else {
        box.style.borderLeftColor = 'var(--threat-green)';
      }
    }
  },

  /**
   * Populate bullet list of detected competitor shifts
   */
  updateStrategicShifts(shifts) {
    const list = document.getElementById('strategicShiftsList');
    if (!list) return;

    list.innerHTML = '';
    if (!shifts || shifts.length === 0) {
      list.innerHTML = '<li>No significant structural shifts detected against baseline.</li>';
      return;
    }

    shifts.forEach(shift => {
      const li = document.createElement('li');
      li.innerText = shift;
      list.appendChild(li);
    });
  },

  computeThreatLevel(score) {
    if (score >= 71) return 'RED';
    if (score >= 36) return 'AMBER';
    return 'GREEN';
  }
};

window.PulseMeter = PulseMeter;
