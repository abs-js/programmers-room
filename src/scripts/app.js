// app.js - Main application logic, UI rendering, events

let currentView = 'profile';
let currentProject = null;
let isLocal = false;

async function renderCustomize(user) {
  const main = document.getElementById('main-content');
  const settings = user.uiSettings || {};
  main.innerHTML = `
    <div class="customize-panel">
      <h2>🎨 Personalização do UI e HUD</h2>
      <p>Deixe o Programmer's Room com a sua cara. As mudanças são salvas na sua conta.</p>

      <div class="customize-group">
        <label>Tema base</label>
        <select id="ui-theme">
          <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark (GitHub)</option>
          <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
          <option value="monokai" ${settings.theme === 'monokai' ? 'selected' : ''}>Monokai</option>
          <option value="solarized" ${settings.theme === 'solarized' ? 'selected' : ''}>Solarized Dark</option>
          <option value="dracula" ${settings.theme === 'dracula' ? 'selected' : ''}>Dracula</option>
          <option value="nord" ${settings.theme === 'nord' ? 'selected' : ''}>Nord</option>
        </select>
      </div>

      <div class="customize-group">
        <label>Cor de destaque (accent)</label>
        <div class="color-row">
          <input type="color" id="ui-accent" value="${settings.accent || '#58a6ff'}">
          <span>Usada em botões, links e destaques</span>
        </div>
      </div>

      <div class="customize-group">
        <label>Fonte da interface</label>
        <select id="ui-font">
          <option value="system" ${!settings.font || settings.font === 'system' ? 'selected' : ''}>Sistema</option>
          <option value="inter" ${settings.font === 'inter' ? 'selected' : ''}>Inter</option>
          <option value="roboto" ${settings.font === 'roboto' ? 'selected' : ''}>Roboto</option>
          <option value="mono" ${settings.font === 'mono' ? 'selected' : ''}>Monospace</option>
        </select>
      </div>

      <div class="customize-group">
        <label>Fonte do editor de código</label>
        <select id="ui-code-font">
          <option value="courier" ${!settings.codeFont || settings.codeFont === 'courier' ? 'selected' : ''}>Courier New</option>
          <option value="consolas" ${settings.codeFont === 'consolas' ? 'selected' : ''}>Consolas</option>
          <option value="fira" ${settings.codeFont === 'fira' ? 'selected' : ''}>Fira Code</option>
          <option value="jetbrains" ${settings.codeFont === 'jetbrains' ? 'selected' : ''}>JetBrains Mono</option>
        </select>
      </div>

      <div class="customize-group">
        <label>Densidade</label>
        <select id="ui-density">
          <option value="0.9" ${settings.density == 0.9 ? 'selected' : ''}>Compacta</option>
          <option value="1" ${!settings.density || settings.density == 1 ? 'selected' : ''}>Normal</option>
          <option value="1.15" ${settings.density == 1.15 ? 'selected' : ''}>Confortável</option>
        </select>
      </div>

      <div class="customize-group">
        <label>Arredondamento</label>
        <input type="range" id="ui-radius" min="0" max="16" value="${settings.radius || 8}">
        <span id="radius-value">${settings.radius || 8}px</span>
      </div>

      <div class="customize-group">
        <label>Largura da barra de ferramentas</label>
        <input type="range" id="ui-toolbar" min="220" max="400" value="${settings.toolbarWidth || 280}">
        <span id="toolbar-value">${settings.toolbarWidth || 280}px</span>
      </div>

      <div class="customize-group">
        <label>
          <input type="checkbox" id="ui-hide-search" ${settings.hideSearch ? 'checked' : ''}>
          Ocultar barra de pesquisa no topo
        </label>
        <label>
          <input type="checkbox" id="ui-compact-toolbar" ${settings.compactToolbar ? 'checked' : ''}>
          Toolbar mais discreta
        </label>
      </div>

      <button id="save-ui-btn">Salvar e aplicar</button>
      <button onclick="renderView('profile')">Cancelar</button>
      <p id="ui-save-msg" style="color:var(--success);margin-top:10px;"></p>
    </div>
  `;

  // Live preview updates
  document.getElementById('ui-radius').oninput = (e) => {
    document.getElementById('radius-value').textContent = e.target.value + 'px';
    document.documentElement.style.setProperty('--radius', e.target.value + 'px');
  };
  document.getElementById('ui-toolbar').oninput = (e) => {
    document.getElementById('toolbar-value').textContent = e.target.value + 'px';
    document.documentElement.style.setProperty('--toolbar-width', e.target.value + 'px');
  };
  document.getElementById('ui-accent').oninput = (e) => {
    document.documentElement.style.setProperty('--accent', e.target.value);
    document.documentElement.style.setProperty('--accent-hover', e.target.value);
  };

  document.getElementById('save-ui-btn').onclick = () => saveUiSettings(user);
}

async function saveUiSettings(user) {
  const settings = {
    theme: document.getElementById('ui-theme').value,
    accent: document.getElementById('ui-accent').value,
    font: document.getElementById('ui-font').value,
    codeFont: document.getElementById('ui-code-font').value,
    density: parseFloat(document.getElementById('ui-density').value),
    radius: parseInt(document.getElementById('ui-radius').value),
    toolbarWidth: parseInt(document.getElementById('ui-toolbar').value),
    hideSearch: document.getElementById('ui-hide-search').checked,
    compactToolbar: document.getElementById('ui-compact-toolbar').checked
  };

  user.uiSettings = settings;
  await API.setData('users', `user_${user.email}`, user);
  applyUiSettings(settings);
  document.getElementById('ui-save-msg').textContent = 'Preferências salvas e aplicadas!';
}

function applyUiSettings(settings = {}) {
  const root = document.documentElement;
  const theme = settings.theme || 'dark';

  const themes = {
    dark: { bg: '#0d1117', bg2: '#161b22', bg3: '#21262d', text: '#c9d1d9', text2: '#8b949e', border: '#30363d' },
    light: { bg: '#ffffff', bg2: '#f6f8fa', bg3: '#eaeef2', text: '#24292f', text2: '#57606a', border: '#d0d7de' },
    monokai: { bg: '#272822', bg2: '#1e1f1c', bg3: '#3e3d32', text: '#f8f8f2', text2: '#75715e', border: '#49483e' },
    solarized: { bg: '#002b36', bg2: '#073642', bg3: '#586e75', text: '#839496', text2: '#657b83', border: '#073642' },
    dracula: { bg: '#282a36', bg2: '#21222c', bg3: '#44475a', text: '#f8f8f2', text2: '#6272a4', border: '#44475a' },
    nord: { bg: '#2e3440', bg2: '#3b4252', bg3: '#434c5e', text: '#eceff4', text2: '#d8dee9', border: '#4c566a' }
  };

  const t = themes[theme] || themes.dark;
  root.style.setProperty('--bg', t.bg);
  root.style.setProperty('--bg-secondary', t.bg2);
  root.style.setProperty('--bg-tertiary', t.bg3);
  root.style.setProperty('--text', t.text);
  root.style.setProperty('--text-secondary', t.text2);
  root.style.setProperty('--border', t.border);

  if (settings.accent) {
    root.style.setProperty('--accent', settings.accent);
    root.style.setProperty('--accent-hover', settings.accent);
  }

  const fonts = {
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    inter: "'Inter', -apple-system, sans-serif",
    roboto: "'Roboto', sans-serif",
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace"
  };
  root.style.setProperty('--font-ui', fonts[settings.font] || fonts.system);

  const codeFonts = {
    courier: "'Courier New', monospace",
    consolas: "Consolas, 'Courier New', monospace",
    fira: "'Fira Code', 'Courier New', monospace",
    jetbrains: "'JetBrains Mono', Consolas, monospace"
  };
  root.style.setProperty('--font-code', codeFonts[settings.codeFont] || codeFonts.courier);

  root.style.setProperty('--density', settings.density || 1);
  root.style.setProperty('--radius', (settings.radius || 8) + 'px');
  root.style.setProperty('--toolbar-width', (settings.toolbarWidth || 280) + 'px');

  // HUD toggles
  const search = document.getElementById('search-input');
  if (search) search.style.display = settings.hideSearch ? 'none' : '';
  const toolbar = document.getElementById('right-toolbar');
  if (toolbar) toolbar.style.opacity = settings.compactToolbar ? '0.85' : '1';
}

// Apply on load
async function loadMainApp() {
  await API.initTables();
  const session = JSON.parse(localStorage.getItem('proRom_currentUser') || 'null');
  if (!session) {
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('active');
    return;
  }

  const user = await API.getData('users', `user_${session.email}`);
  if (!user) return;

  document.getElementById('user-nick').textContent = user.nickname;
  document.getElementById('user-avatar').src = user.avatar || 'https://via.placeholder.com/32?text=' + user.nickname[0];

  // Apply saved UI settings
  applyUiSettings(user.uiSettings || {});

  renderView('profile');
  setupEvents();
}

function setupEvents() {
  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + '-form').classList.add('active');
    });
  });

  document.getElementById('login-btn').addEventListener('click', () => Auth.loginUser());
  document.getElementById('register-btn').addEventListener('click', () => Auth.registerUser());
  document.getElementById('verify-btn').addEventListener('click', () => Auth.verifyCode());
  document.getElementById('setup-btn').addEventListener('click', () => Auth.finishSetup());

  document.getElementById('reg-avatar').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.getElementById('avatar-preview');
        img.src = ev.target.result;
        img.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  Auth.generateCaptcha();

  // Main events
  document.getElementById('logo').addEventListener('click', () => renderView('profile'));
  document.getElementById('search-input').addEventListener('input', (e) => {
    if (e.target.value.length > 2 || e.target.value === '') {
      renderView('search', e.target.value);
    }
  });

  document.getElementById('user-menu').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('user-menu').classList.toggle('active');
  });
  document.addEventListener('click', () => document.getElementById('user-menu').classList.remove('active'));

  document.getElementById('view-profile').addEventListener('click', () => renderView('profile'));
  document.getElementById('my-projects').addEventListener('click', () => renderView('my-projects'));
  document.getElementById('customize-ui')?.addEventListener('click', () => renderView('customize'));
  document.getElementById('settings').addEventListener('click', () => renderView('settings'));
  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('proRom_currentUser');
    location.reload();
  });

  // Toolbar
  const toolbar = document.getElementById('right-toolbar');
  const toggle = document.getElementById('toolbar-toggle');
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toolbar.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!toolbar.contains(e.target) && toolbar.classList.contains('open')) {
      toolbar.classList.remove('open');
    }
  });

  document.getElementById('new-project-btn').addEventListener('click', () => showNewProjectModal());
  document.getElementById('local-branches').addEventListener('click', () => renderView('local'));
  document.getElementById('insights').addEventListener('click', () => renderView('insights'));
  document.getElementById('customize-ui-toolbar')?.addEventListener('click', () => renderView('customize'));
}

async function renderView(view, data = null) {
  currentView = view;
  const main = document.getElementById('main-content');
  main.innerHTML = '<p>Carregando...</p>';

  const user = await Projects.getCurrentUser();

  if (view === 'profile') {
    if (!user) return;
    main.innerHTML = `
      <div class="profile-card">
        <img src="${user.avatar || ''}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">
        <h2>${user.nickname}</h2>
        <p>${user.bio || 'Sem bio'}</p>
        <p><strong>Linguagens:</strong> ${user.preferredLang || '-'} / ${user.secondaryLang || '-'}</p>
        <p><strong>Engine:</strong> ${user.engine || 'none'}</p>
        <div class="tags">${(user.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <p>${user.description || ''}</p>
        <p><small>GitHub: ${user.github || 'não informado'}</small></p>
      </div>
      <h3>Meus Projetos (${(user.projects || []).length}/${Projects.MAX_PROJECTS})</h3>
      <div id="user-projects-list"></div>
    `;
    const listEl = document.getElementById('user-projects-list');
    for (const pid of (user.projects || [])) {
      const p = await API.getData('projects', `proj_${pid}`);
      if (p) {
        listEl.innerHTML += renderProjectCard(p);
      }
    }
  } else if (view === 'search') {
    const projects = await Projects.listProjects(data || '');
    main.innerHTML = `<h2>Resultados da busca (${projects.length})</h2><div id="search-results"></div>`;
    const resEl = document.getElementById('search-results');
    projects.forEach(p => {
      resEl.innerHTML += renderProjectCard(p);
    });
    if (!projects.length) resEl.innerHTML = '<p>Nenhum projeto encontrado.</p>';
  } else if (view === 'my-projects') {
    main.innerHTML = '<h2>Meus Projetos</h2><div id="my-list"></div>';
    const list = document.getElementById('my-list');
    for (const pid of (user.projects || [])) {
      const p = await API.getData('projects', `proj_${pid}`);
      if (p) list.innerHTML += renderProjectCard(p, true);
    }
  } else if (view === 'project') {
    await renderProjectView(data, false);
  } else if (view === 'local') {
    const locals = Projects.getLocalProjects();
    main.innerHTML = '<h2>Branches Locais (ilimitadas, localStorage)</h2>';
    Object.keys(locals).forEach(id => {
      const p = locals[id];
      main.innerHTML += `<div class="project-card"><h3>${p.name} (local)</h3><button onclick="openLocal('${id}')">Abrir</button></div>`;
    });
  } else if (view === 'insights') {
    main.innerHTML = '<h2>Insights dos seus projetos</h2>';
    let totalViews = 0, totalDownloads = 0, totalLikes = 0;
    for (const pid of (user.projects || [])) {
      const p = await API.getData('projects', `proj_${pid}`);
      if (p) {
        totalViews += p.views || 0;
        totalDownloads += (p.downloads || []).length;
        totalLikes += (p.likes || []).length;
        main.innerHTML += `<div class="project-card"><strong>${p.name}</strong>: ${p.views || 0} views, ${(p.downloads || []).length} downloads únicos, ${(p.likes || []).length} likes</div>`;
      }
    }
    main.innerHTML += `<p><strong>Total:</strong> ${totalViews} views, ${totalDownloads} downloads, ${totalLikes} likes</p>`;
  } else if (view === 'settings') {
    main.innerHTML = `
      <h2>Configurações</h2>
      <p>Nickname: ${user.nickname}</p>
      <p>E-mail: ${user.email}</p>
      <button onclick="renderView('profile')">Voltar ao perfil</button>
      <button onclick="renderView('customize')">Personalizar UI / HUD</button>
    `;
  } else if (view === 'customize') {
    await renderCustomize(user);
  }
}

function renderProjectCard(p, isOwner = false) {
  return `
    <div class="project-card" onclick="openProject('${p.id}')">
      <h3>${p.name}</h3>
      <p>${p.description || ''}</p>
      <div class="tags">${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <small>por ${p.ownerNick} • ${p.public ? 'Público' : 'Privado'} • ${Object.keys(p.files || {}).length} arquivos</small>
    </div>
  `;
}

async function openProject(id) {
  const p = await API.getData('projects', `proj_${id}`);
  if (!p) return alert('Projeto não encontrado');
  // Increment view
  p.views = (p.views || 0) + 1;
  await API.setData('projects', `proj_${id}`, p);
  currentProject = p;
  isLocal = false;
  await renderProjectView(p, false);
}

async function openLocal(id) {
  const locals = Projects.getLocalProjects();
  const p = locals[id];
  if (!p) return;
  currentProject = p;
  isLocal = true;
  await renderProjectView(p, true);
}

async function renderProjectView(p, local) {
  const main = document.getElementById('main-content');
  const user = await Projects.getCurrentUser();
  const isOwner = user && p.owner === user.email;

  let filesHtml = Object.keys(p.files || {}).map(f => 
    `<div class="file-item" onclick="editFile('${f}')">${f}</div>`
  ).join('');

  main.innerHTML = `
    <div class="project-card">
      <h2>${p.name} ${local ? '(Local Branch)' : ''}</h2>
      <p>${p.description}</p>
      <div class="tags">${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <p>Licença: ${p.license} | Visibilidade: ${p.public ? 'Público' : 'Privado'}</p>
      <div>
        <button onclick="likeProject()">Like (${(p.likes || []).length})</button>
        <button onclick="downloadProject()">Download (${(p.downloads || []).length} únicos)</button>
        ${isOwner ? '<button onclick="toggleVisibility()">Tornar ' + (p.public ? 'Privado' : 'Público') + '</button>' : ''}
        ${!local ? '<button onclick="getLocalBranch()">Get Local Branch</button>' : ''}
        ${local ? '<button onclick="submitModifications()">Enviar Modificações</button>' : ''}
      </div>
    </div>
    <h3>README</h3>
    <div class="markdown-preview">${Projects.renderMarkdown(p.files['README.md'] || '')}</div>
    <h3>Arquivos</h3>
    <div id="files-list">${filesHtml}</div>
    <button onclick="createNewFile()">+ Novo Arquivo</button>
    <label>Ou enviar arquivos do computador:</label>
    <input type="file" id="file-upload" multiple onchange="uploadFiles(this.files)">
    <h3>Comentários (${(p.comments || []).length})</h3>
    <div id="comments"></div>
    <textarea id="new-comment" placeholder="Adicionar comentário..."></textarea>
    <button onclick="addComment()">Comentar</button>
    <h3>Avaliação</h3>
    <div>Média: ${calculateRating(p)}</div>
    <select id="rate-select"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select>
    <button onclick="rateProject()">Avaliar</button>
    <button onclick="reportProject()">Reportar</button>
    ${isOwner ? '<h3>Contribuições pendentes</h3><div id="pending-contribs"></div>' : ''}
  `;

  // Load comments
  const commentsEl = document.getElementById('comments');
  (p.comments || []).forEach(c => {
    commentsEl.innerHTML += `<div class="comment"><strong>${c.nick}</strong>: ${c.text} <small>${new Date(c.date).toLocaleString()}</small></div>`;
  });

  if (isOwner) loadPendingContributions(p.id);
}

function calculateRating(p) {
  const ratings = p.ratings || [];
  if (!ratings.length) return 'N/A';
  const avg = ratings.reduce((s, r) => s + r.stars, 0) / ratings.length;
  return avg.toFixed(1) + ' ★';
}

async function likeProject() {
  if (!currentProject || isLocal) return;
  const user = await Projects.getCurrentUser();
  if (!user) return alert('Faça login');
  const likes = currentProject.likes || [];
  if (likes.includes(user.email)) {
    currentProject.likes = likes.filter(e => e !== user.email);
  } else {
    likes.push(user.email);
    currentProject.likes = likes;
  }
  await API.setData('projects', `proj_${currentProject.id}`, currentProject);
  renderProjectView(currentProject, false);
}

async function downloadProject() {
  if (!currentProject) return;
  const user = await Projects.getCurrentUser();
  if (user && !(currentProject.downloads || []).includes(user.email)) {
    currentProject.downloads = currentProject.downloads || [];
    currentProject.downloads.push(user.email);
    if (!isLocal) await API.setData('projects', `proj_${currentProject.id}`, currentProject);
  }
  // Simple download: create a text file with all contents or individual
  let content = '';
  Object.entries(currentProject.files || {}).forEach(([name, cont]) => {
    content += `\n\n===== ${name} =====\n${cont}`;
  });
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentProject.name}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function getLocalBranch() {
  if (!currentProject || isLocal) return;
  const locals = Projects.getLocalProjects();
  const localId = currentProject.id + '_local_' + Date.now();
  locals[localId] = JSON.parse(JSON.stringify(currentProject));
  locals[localId].isLocal = true;
  locals[localId].sourceId = currentProject.id;
  localStorage.setItem('proRom_localProjects', JSON.stringify(locals));
  alert('Branch local criada! Vá em Branches Locais para editar.');
  renderView('local');
}

function showNewProjectModal() {
  const modal = document.getElementById('modal-content');
  modal.innerHTML = `
    <h2>Novo Projeto</h2>
    <input id="new-name" placeholder="Nome do projeto">
    <textarea id="new-desc" placeholder="Descrição"></textarea>
    <input id="new-license" placeholder="Licença (ex: MIT)" value="MIT">
    <input id="new-tags" placeholder="Tags (vírgula)">
    <textarea id="new-readme" placeholder="README.md inicial" rows="6"># Nome do Projeto\n\nDescrição aqui.\n</textarea>
    <button onclick="doCreateProject()">Criar</button>
    <button onclick="closeModal()">Cancelar</button>
  `;
  document.getElementById('modal-overlay').style.display = 'flex';
}

async function doCreateProject() {
  const name = document.getElementById('new-name').value.trim();
  const desc = document.getElementById('new-desc').value;
  const license = document.getElementById('new-license').value;
  const tags = document.getElementById('new-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const readme = document.getElementById('new-readme').value;
  if (!name) return alert('Nome obrigatório');
  const res = await Projects.createProject(name, desc, license, tags, readme);
  if (res.error) alert(res.error);
  else {
    closeModal();
    renderView('my-projects');
  }
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

async function editFile(path) {
  const content = (currentProject.files || {})[path] || '';
  const modal = document.getElementById('modal-content');
  modal.innerHTML = `
    <h3>Editando: ${path}</h3>
    <div class="editor-toolbar">
      <select id="editor-theme" onchange="changeEditorTheme(this.value)">
        <option value="theme-dark">Dark</option>
        <option value="theme-light">Light</option>
        <option value="theme-monokai">Monokai</option>
        <option value="theme-solarized">Solarized</option>
      </select>
      <span>Paleta de cores do editor</span>
    </div>
    <textarea id="file-editor" class="editor-area theme-dark" style="height:400px;">${content.replace(/</g, '<')}</textarea>
    <button onclick="saveFile('${path}')">Salvar</button>
    <button onclick="deleteFile('${path}')">Deletar</button>
    <button onclick="closeModal()">Fechar</button>
  `;
  document.getElementById('modal-overlay').style.display = 'flex';
}

function changeEditorTheme(theme) {
  const editor = document.getElementById('file-editor');
  editor.className = 'editor-area ' + theme;
}

async function saveFile(path) {
  const content = document.getElementById('file-editor').value;
  const res = await Projects.updateProjectFile(currentProject.id, path, content, isLocal);
  if (res.error) alert(res.error);
  else {
    if (!isLocal) {
      currentProject = await API.getData('projects', `proj_${currentProject.id}`);
    } else {
      const locals = Projects.getLocalProjects();
      currentProject = locals[currentProject.id];
    }
    closeModal();
    renderProjectView(currentProject, isLocal);
  }
}

async function deleteFile(path) {
  if (!confirm('Deletar arquivo?')) return;
  await Projects.deleteProjectFile(currentProject.id, path, isLocal);
  closeModal();
  if (!isLocal) currentProject = await API.getData('projects', `proj_${currentProject.id}`);
  else {
    const locals = Projects.getLocalProjects();
    currentProject = locals[currentProject.id];
  }
  renderProjectView(currentProject, isLocal);
}

function createNewFile() {
  const name = prompt('Nome do arquivo (ex: main.py):');
  if (!name) return;
  editFile(name); // will create on save if new
}

async function addComment() {
  const text = document.getElementById('new-comment').value.trim();
  if (!text || isLocal) return;
  const user = await Projects.getCurrentUser();
  if (!user) return alert('Login necessário');
  currentProject.comments = currentProject.comments || [];
  currentProject.comments.push({
    nick: user.nickname,
    email: user.email,
    text,
    date: new Date().toISOString()
  });
  await API.setData('projects', `proj_${currentProject.id}`, currentProject);
  renderProjectView(currentProject, false);
}

async function rateProject() {
  const stars = parseInt(document.getElementById('rate-select').value);
  const user = await Projects.getCurrentUser();
  if (!user || isLocal) return;
  currentProject.ratings = currentProject.ratings || [];
  const existing = currentProject.ratings.find(r => r.email === user.email);
  if (existing) existing.stars = stars;
  else currentProject.ratings.push({ email: user.email, stars });
  await API.setData('projects', `proj_${currentProject.id}`, currentProject);
  renderProjectView(currentProject, false);
}

function reportProject() {
  const reason = prompt('Motivo do report (spam, conteúdo impróprio, violação de licença, etc.):');
  if (!reason) return;
  const details = prompt('Detalhes adicionais:');
  // Store report
  const report = {
    id: Projects.generateId(),
    projectId: currentProject.id,
    reporter: (JSON.parse(localStorage.getItem('proRom_currentUser') || '{}').email),
    reason,
    details,
    status: 'open',
    createdAt: new Date().toISOString()
  };
  API.setData('reports', `report_${report.id}`, report);
  alert('Report enviado. Obrigado!');
}

async function toggleVisibility() {
  if (!currentProject || isLocal) return;
  currentProject.public = !currentProject.public;
  await API.setData('projects', `proj_${currentProject.id}`, currentProject);
  renderProjectView(currentProject, false);
}

async function submitModifications() {
  const msg = prompt('Mensagem da contribuição:');
  const res = await Projects.submitContribution(currentProject.sourceId || currentProject.id, msg);
  if (res.success) alert('Modificações enviadas para aprovação do dono!');
  else alert(res.error);
}

async function loadPendingContributions(projectId) {
  const all = await API.listData('contributions');
  const pending = all.filter(c => c.value && c.value.projectId === projectId && c.value.status === 'pending');
  const el = document.getElementById('pending-contribs');
  if (!el) return;
  el.innerHTML = '';
  pending.forEach(c => {
    el.innerHTML += `<div>${c.value.fromNick}: ${c.value.message} <button onclick="approve('${c.value.id}')">Aprovar</button></div>`;
  });
}

async function approve(id) {
  const res = await Projects.approveContribution(id);
  if (res.success) {
    alert('Aprovado e mesclado!');
    openProject(currentProject.id);
  } else alert(res.error);
}

async function uploadFiles(files) {
  if (!currentProject) return;
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      // For text files mostly; binary as base64 if needed, but keep simple
      const res = await Projects.updateProjectFile(currentProject.id, file.name, content, isLocal);
      if (res.error) alert(res.error + ' for ' + file.name);
    };
    reader.readAsText(file); // Assume text; for binary use readAsDataURL
  }
  setTimeout(() => {
    if (!isLocal) openProject(currentProject.id);
    else openLocal(currentProject.id);
  }, 500);
}

window.uploadFiles = uploadFiles;

// Init
document.addEventListener('DOMContentLoaded', () => {
  const session = localStorage.getItem('proRom_currentUser');
  if (session) {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    loadMainApp();
  } else {
    Auth.generateCaptcha();
  }
});

// Make functions global for onclick
window.renderView = renderView;
window.openProject = openProject;
window.openLocal = openLocal;
window.likeProject = likeProject;
window.downloadProject = downloadProject;
window.getLocalBranch = getLocalBranch;
window.showNewProjectModal = showNewProjectModal;
window.doCreateProject = doCreateProject;
window.closeModal = closeModal;
window.editFile = editFile;
window.saveFile = saveFile;
window.deleteFile = deleteFile;
window.createNewFile = createNewFile;
window.addComment = addComment;
window.rateProject = rateProject;
window.reportProject = reportProject;
window.toggleVisibility = toggleVisibility;
window.submitModifications = submitModifications;
window.approve = approve;
window.changeEditorTheme = changeEditorTheme;
window.loadMainApp = loadMainApp;
