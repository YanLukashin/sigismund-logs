(function () {
  'use strict';

  // === CONSTANTS ===
  const SCENARIOS = {
    hardware: {
      title: 'Своё железо и экономия',
      desc: 'Как слезть с иглы дорогих API, собрать свой инференс-сервер и не разориться на подписках. GPU, квантизация, локальный деплой, оптимизация стоимости.',
      shortDesc: 'Как слезть с API и собрать свой инференс',
    },
    'private-ai': {
      title: 'Приватный ИИ',
      desc: 'Запуск нейросетей на своём оборудовании. Работа без интернета, коммерческая тайна остаётся внутри компании. Локальные модели, edge-инференс, приватность данных.',
      shortDesc: 'Локальные модели. Данные остаются внутри.',
    },
    'ai-teams': {
      title: 'ИИ-команды',
      desc: 'Мультиагенты и оркестрация. Как заставить несколько агентов работать вместе: один пишет код, второй тестирует, третий постит. Swarm, MCP, tool-use, делегирование.',
      shortDesc: 'Мультиагенты и оркестрация. Один пишет, второй тестит.',
    },
    'ai-knowledge': {
      title: 'ИИ со знаниями бизнеса',
      desc: 'Как взять базовую модель и вшить в неё знания вашего бизнеса. RAG, fine-tuning, embeddings, графовая память. Чтобы модель не галлюцинировала, а работала с вашими регламентами.',
      shortDesc: 'RAG, fine-tune, embeddings. Модель знает ваш бизнес.',
    },
    autopilot: {
      title: 'Бизнес на автопилоте',
      desc: 'Связки, пайплайны и конвейеры. Как сделать так, чтобы всё работало само по триггеру без участия человека. No-code автоматизации, workflow, CI/CD для бизнес-процессов.',
      shortDesc: 'Пайплайны и автоматизация. Всё по триггеру.',
    },
  };

  const INDUSTRY_LABELS = {
    energy: 'ENERGY', chips: 'CHIPS', infrastructure: 'INFRA',
    models: 'MODELS', applications: 'APPS',
  };

  const SPECIALIST_LABELS = {
    0: 'L0', 1: 'L1', 2: 'L2', 3: 'L3', 4: 'L4', 5: 'L5', 6: 'L6',
  };

  const COMPANY_LABELS = {
    0: 'C0', 1: 'C1', 2: 'C2', 3: 'C3', 4: 'C4', 5: 'C5',
  };

  // === STATE ===
  const activeFilters = { specialist: new Set(), company: new Set() };
  let currentScenario = null;
  let lastScenario = null;

  // === HELPERS ===
  function sortPosts(posts) {
    return [...posts].sort((a, b) => {
      const [da, ma, ya] = (a.date || '01.01.2000').split('.').map(Number);
      const [db, mb, yb] = (b.date || '01.01.2000').split('.').map(Number);
      const dateA = ya * 10000 + ma * 100 + da;
      const dateB = yb * 10000 + mb * 100 + db;
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || 0) - (a.id || 0);
    });
  }

  function extractTitle(html) {
    const m = html.match(/<strong[^>]*>(.*?)<\/strong>/i);
    if (!m) return '';
    return m[1].replace(/<[^>]+>/g, '').replace(/\n/g, ' ').trim();
  }

  function extractPreview(html) {
    let text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    // Skip past the title (first sentence ending with ] or first 60 chars)
    const titleEnd = text.indexOf(']');
    if (titleEnd > 0 && titleEnd < 200) {
      text = text.substring(titleEnd + 1).trim();
    }
    return text.substring(0, 140) + (text.length > 140 ? '...' : '');
  }

  function getPostsByScenario(scenarioId) {
    return window.POSTS_DATA.filter(p =>
      (p.scenarios || []).includes(scenarioId)
    );
  }

  function renderTags(post) {
    let html = '';
    (post.industry_layers || []).forEach(l => {
      html += `<span class="post-tag tag-industry">${INDUSTRY_LABELS[l] || l.toUpperCase()}</span>`;
    });
    (post.specialist_levels || []).forEach(l => {
      html += `<span class="post-tag tag-specialist">${SPECIALIST_LABELS[l] || 'L' + l}</span>`;
    });
    (post.company_levels || []).forEach(l => {
      html += `<span class="post-tag tag-company">${COMPANY_LABELS[l] || 'C' + l}</span>`;
    });
    return html;
  }

  // === VIEWS ===
  function showView(viewId) {
    ['homeView', 'scenarioView', 'postView'].forEach(id => {
      document.getElementById(id).classList.toggle('hidden', id !== viewId);
    });
    window.scrollTo(0, 0);
  }

  // HOME
  function renderHome() {
    const grid = document.getElementById('scenariosGrid');
    grid.innerHTML = Object.entries(SCENARIOS).map(([id, s]) => {
      const count = getPostsByScenario(id).length;
      return `
        <a class="scenario-card" href="#scenario=${id}">
          <span class="scenario-badge">SCENARIO</span>
          <div class="scenario-title">${s.title}</div>
          <div class="scenario-desc">${s.shortDesc}</div>
          <span class="scenario-count">${count} ${count === 1 ? 'лог' : count < 5 ? 'лога' : 'логов'}</span>
        </a>
      `;
    }).join('');
    showView('homeView');
  }

  // SCENARIO
  function renderScenario(scenarioId) {
    const scenario = SCENARIOS[scenarioId];
    if (!scenario) { renderHome(); return; }

    currentScenario = scenarioId;
    lastScenario = scenarioId;

    // Header
    document.getElementById('scenarioHeader').innerHTML = `
      <div class="section-label">[SCENARIO]</div>
      <h2 class="scenario-header-title">${scenario.title}</h2>
      <p class="scenario-header-desc">${scenario.desc}</p>
    `;

    // Posts grid
    const posts = sortPosts(getPostsByScenario(scenarioId));
    const grid = document.getElementById('postsGrid');
    grid.innerHTML = posts.map(post => {
      const title = extractTitle(post.html_content);
      const preview = extractPreview(post.html_content);
      return `
        <div class="post-tile" data-id="${post.id}"
          data-specialist="${(post.specialist_levels || []).join(',')}"
          data-company="${(post.company_levels || []).join(',')}"
          onclick="location.hash='post=${post.id}'">
          <div class="tile-meta">
            <span class="tile-date">${post.date || ''}</span>
            <span class="tile-id">#${post.id}</span>
          </div>
          <div class="tile-title">${title}</div>
          <div class="tile-preview">${preview}</div>
          <div class="tile-tags">${renderTags(post)}</div>
        </div>
      `;
    }).join('');

    // Reset filters
    activeFilters.specialist.clear();
    activeFilters.company.clear();
    document.querySelectorAll('#scenarioView .filter-btn.active').forEach(
      btn => btn.classList.remove('active')
    );

    showView('scenarioView');
    applyFilters();
  }

  // POST
  function renderPost(postId) {
    const post = window.POSTS_DATA.find(p => p.id === postId);
    if (!post) { renderHome(); return; }

    const container = document.getElementById('postContent');
    container.innerHTML = `
      <div class="post-full-meta">
        <span class="post-full-date">${post.date || ''}</span>
        <span class="post-full-id">#${post.id}</span>
      </div>
      <div class="post-full-body">${post.html_content}</div>
      <div class="post-full-tags">${renderTags(post)}</div>
    `;

    // Back button
    const backBtn = document.getElementById('postBackBtn');
    if (lastScenario) {
      backBtn.innerHTML = '&larr; НАЗАД';
      backBtn.onclick = () => { location.hash = 'scenario=' + lastScenario; };
    } else {
      backBtn.innerHTML = '&larr; ГЛАВНАЯ';
      backBtn.onclick = () => { location.hash = ''; };
    }

    // Related posts
    const relatedContainer = document.getElementById('relatedPosts');
    const scenarios = post.scenarios || [];
    if (scenarios.length > 0) {
      const related = sortPosts(
        getPostsByScenario(scenarios[0]).filter(p => p.id !== post.id)
      ).slice(0, 3);

      if (related.length > 0) {
        relatedContainer.innerHTML = `
          <div class="related-label">[ПОХОЖИЕ ЛОГИ]</div>
          <div class="related-grid">
            ${related.map(r => `
              <div class="related-item" onclick="location.hash='post=${r.id}'">
                <div class="related-item-date">${r.date || ''}</div>
                <div class="related-item-title">${extractTitle(r.html_content)}</div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        relatedContainer.innerHTML = '';
      }
    } else {
      relatedContainer.innerHTML = '';
    }

    showView('postView');
  }

  // === FILTERS ===
  function applyFilters() {
    const tiles = document.querySelectorAll('.post-tile');
    let visible = 0;

    tiles.forEach(tile => {
      const specialist = tile.dataset.specialist ? tile.dataset.specialist.split(',') : [];
      const company = tile.dataset.company ? tile.dataset.company.split(',') : [];

      const matchSpecialist = activeFilters.specialist.size === 0 ||
        [...activeFilters.specialist].some(f => specialist.includes(String(f)));
      const matchCompany = activeFilters.company.size === 0 ||
        [...activeFilters.company].some(f => company.includes(String(f)));

      const show = matchSpecialist && matchCompany;
      tile.classList.toggle('hidden', !show);
      if (show) visible++;
    });

    const counter = document.getElementById('postCounter');
    if (counter) {
      counter.textContent = `${visible} / ${tiles.length} POSTS`;
    }
  }

  function initFilters() {
    document.querySelectorAll('#scenarioView .filter-buttons').forEach(group => {
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
      activeFilters.specialist.clear();
      activeFilters.company.clear();
      document.querySelectorAll('#scenarioView .filter-btn.active').forEach(
        btn => btn.classList.remove('active')
      );
      applyFilters();
    });
  }

  // === ROUTER ===
  function router() {
    const hash = location.hash.replace('#', '');

    if (hash.startsWith('scenario=')) {
      const id = hash.split('=')[1];
      renderScenario(id);
    } else if (hash.startsWith('post=')) {
      const id = parseInt(hash.split('=')[1], 10);
      renderPost(id);
    } else {
      currentScenario = null;
      renderHome();
    }
  }

  // === INIT ===
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.POSTS_DATA) {
      document.getElementById('scenariosGrid').innerHTML =
        '<p style="text-align:center;color:#8D877C;padding:48px 0;">NO DATA LOADED</p>';
      return;
    }
    initFilters();
    router();
    window.addEventListener('hashchange', router);
  });
})();
