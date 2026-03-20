(function () {
  'use strict';

  const INDUSTRY_LABELS = {
    energy: 'ENERGY',
    chips: 'CHIPS',
    infrastructure: 'INFRA',
    models: 'MODELS',
    applications: 'APPS',
  };

  const SPECIALIST_LABELS = {
    0: 'L0 ЗРИТЕЛЬ',
    1: 'L1 ПОЛЬЗОВАТЕЛЬ',
    2: 'L2 ОПЕРАТОР',
    3: 'L3 ДЕЛЕГАТОР',
    4: 'L4 АРХИТЕКТОР',
    5: 'L5 ОРКЕСТРАТОР',
    6: 'L6 ИНФРА',
  };

  const COMPANY_LABELS = {
    0: 'C0 ДИНОЗАВР',
    1: 'C1 ВИТРИНА',
    2: 'C2 ЛОСКУТЫ',
    3: 'C3 ОРКЕСТРАЦИЯ',
    4: 'C4 АГЕНТЫ',
    5: 'C5 ИНФРА-ВЛАСТЬ',
  };

  // Active filters: { industry: Set, specialist: Set, company: Set }
  const activeFilters = {
    industry: new Set(),
    specialist: new Set(),
    company: new Set(),
  };

  function renderPosts() {
    const container = document.getElementById('postsContainer');
    // Sort posts newest first
    const sorted = [...window.POSTS_DATA].reverse();
    container.innerHTML = sorted.map(post => {
      const industryTags = (post.industry_layers || [])
        .map(l => `<span class="post-tag tag-industry">${INDUSTRY_LABELS[l] || l.toUpperCase()}</span>`)
        .join('');

      const specialistTags = (post.specialist_levels || [])
        .map(l => `<span class="post-tag tag-specialist">${SPECIALIST_LABELS[l] || 'L' + l}</span>`)
        .join('');

      const companyTags = (post.company_levels || [])
        .map(l => `<span class="post-tag tag-company">${COMPANY_LABELS[l] || 'C' + l}</span>`)
        .join('');

      return `
        <article class="post-card" data-id="${post.id}"
          data-industry="${(post.industry_layers || []).join(',')}"
          data-specialist="${(post.specialist_levels || []).join(',')}"
          data-company="${(post.company_levels || []).join(',')}">
          <div class="post-meta">
            <span class="post-date">${post.date || ''}</span>
            <span class="post-id">#${post.id}</span>
          </div>
          <div class="post-content">${post.html_content}</div>
          <div class="post-tags">${industryTags}${specialistTags}${companyTags}</div>
        </article>
      `;
    }).join('');
  }

  function applyFilters() {
    const cards = document.querySelectorAll('.post-card');
    let visible = 0;

    cards.forEach(card => {
      const industry = card.dataset.industry ? card.dataset.industry.split(',') : [];
      const specialist = card.dataset.specialist ? card.dataset.specialist.split(',') : [];
      const company = card.dataset.company ? card.dataset.company.split(',') : [];

      const matchIndustry = activeFilters.industry.size === 0 ||
        [...activeFilters.industry].some(f => industry.includes(f));
      const matchSpecialist = activeFilters.specialist.size === 0 ||
        [...activeFilters.specialist].some(f => specialist.includes(String(f)));
      const matchCompany = activeFilters.company.size === 0 ||
        [...activeFilters.company].some(f => company.includes(String(f)));

      const show = matchIndustry && matchSpecialist && matchCompany;
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });

    document.getElementById('postCounter').textContent =
      `SHOWING ${visible} / ${cards.length} POSTS`;
  }

  function initFilters() {
    document.querySelectorAll('.filter-buttons').forEach(group => {
      const axis = group.dataset.axis;
      group.addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        const value = btn.dataset.value;
        if (activeFilters[axis].has(value)) {
          activeFilters[axis].delete(value);
          btn.classList.remove('active');
        } else {
          activeFilters[axis].add(value);
          btn.classList.add('active');
        }
        applyFilters();
      });
    });

    document.getElementById('resetFilters').addEventListener('click', () => {
      activeFilters.industry.clear();
      activeFilters.specialist.clear();
      activeFilters.company.clear();
      document.querySelectorAll('.filter-btn.active').forEach(btn => btn.classList.remove('active'));
      applyFilters();
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.POSTS_DATA) {
      document.getElementById('postsContainer').innerHTML =
        '<p style="text-align:center;color:#8D877C;padding:48px 0;">NO DATA LOADED</p>';
      return;
    }
    renderPosts();
    initFilters();
    applyFilters();
  });
})();
