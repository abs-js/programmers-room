// projects.js - Project CRUD, files, local branches, contributions

const MAX_PROJECTS = 3;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

async function getCurrentUser() {
  const session = localStorage.getItem('proRom_currentUser');
  if (!session) return null;
  const { email } = JSON.parse(session);
  return await API.getData('users', `user_${email}`);
}

async function createProject(name, description, license, tags, readme) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autenticado' };
  if ((user.projects || []).length >= MAX_PROJECTS) {
    return { error: `Limite de ${MAX_PROJECTS} projetos atingido.` };
  }

  const projectId = generateId();
  const project = {
    id: projectId,
    name,
    description,
    license: license || 'MIT',
    tags: tags || [],
    owner: user.email,
    ownerNick: user.nickname,
    public: true,
    files: {
      'README.md': readme || `# ${name}\n\n${description}\n\n## Como usar\n\nDescreva aqui.\n`
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    downloads: [], // unique user emails
    likes: [],
    ratings: [],
    comments: [],
    contributors: [user.email],
    credits: [{ email: user.email, nick: user.nickname, role: 'Owner' }]
  };

  // Size check
  if (JSON.stringify(project).length > MAX_SIZE_BYTES) {
    return { error: 'Projeto excede 2MB.' };
  }

  await API.setData('projects', `proj_${projectId}`, project);
  user.projects = user.projects || [];
  user.projects.push(projectId);
  await API.setData('users', `user_${user.email}`, user);

  return { success: true, project };
}

async function updateProjectFile(projectId, path, content, isLocal = false) {
  if (isLocal) {
    const locals = JSON.parse(localStorage.getItem('proRom_localProjects') || '{}');
    if (!locals[projectId]) return { error: 'Branch local não encontrada' };
    locals[projectId].files[path] = content;
    locals[projectId].updatedAt = new Date().toISOString();
    localStorage.setItem('proRom_localProjects', JSON.stringify(locals));
    return { success: true };
  }

  const project = await API.getData('projects', `proj_${projectId}`);
  if (!project) return { error: 'Projeto não encontrado' };
  const user = await getCurrentUser();
  if (project.owner !== user.email && !(project.contributors || []).includes(user.email)) {
    return { error: 'Sem permissão' };
  }

  project.files[path] = content;
  project.updatedAt = new Date().toISOString();

  if (JSON.stringify(project).length > MAX_SIZE_BYTES) {
    return { error: 'Excede limite de 2MB' };
  }

  await API.setData('projects', `proj_${projectId}`, project);
  return { success: true };
}

async function deleteProjectFile(projectId, path, isLocal = false) {
  if (isLocal) {
    const locals = JSON.parse(localStorage.getItem('proRom_localProjects') || '{}');
    if (locals[projectId] && locals[projectId].files[path]) {
      delete locals[projectId].files[path];
      localStorage.setItem('proRom_localProjects', JSON.stringify(locals));
    }
    return { success: true };
  }
  const project = await API.getData('projects', `proj_${projectId}`);
  if (!project || project.owner !== (await getCurrentUser()).email) return { error: 'Sem permissão' };
  delete project.files[path];
  await API.setData('projects', `proj_${projectId}`, project);
  return { success: true };
}

async function listProjects(filter = '') {
  const all = await API.listData('projects');
  let projects = all.map(item => item.value).filter(p => p && p.name);
  if (filter) {
    const f = filter.toLowerCase();
    projects = projects.filter(p =>
      p.name.toLowerCase().includes(f) ||
      (p.description || '').toLowerCase().includes(f) ||
      (p.tags || []).some(t => t.toLowerCase().includes(f)) ||
      (p.ownerNick || '').toLowerCase().includes(f)
    );
  }
  // Only public or owned
  const user = await getCurrentUser();
  return projects.filter(p => p.public || (user && p.owner === user.email));
}

function getLocalProjects() {
  return JSON.parse(localStorage.getItem('proRom_localProjects') || '{}');
}

function createLocalBranch(projectId) {
  // For remote project
  // Will be called after fetching
}

async function submitContribution(projectId, message) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não logado' };
  const locals = getLocalProjects();
  const local = locals[projectId];
  if (!local) return { error: 'Nenhuma branch local' };

  const contrib = {
    id: generateId(),
    projectId,
    fromUser: user.email,
    fromNick: user.nickname,
    message: message || 'Contribuição',
    files: local.files,
    status: 'pending', // pending, approved, rejected
    createdAt: new Date().toISOString()
  };

  await API.setData('contributions', `contrib_${contrib.id}`, contrib);
  return { success: true, id: contrib.id };
}

async function approveContribution(contribId) {
  const contrib = await API.getData('contributions', `contrib_${contribId}`);
  if (!contrib || contrib.status !== 'pending') return { error: 'Inválido' };
  const user = await getCurrentUser();
  const project = await API.getData('projects', `proj_${contrib.projectId}`);
  if (!project || project.owner !== user.email) return { error: 'Sem permissão' };

  // Merge files
  Object.assign(project.files, contrib.files);
  project.updatedAt = new Date().toISOString();
  if (!project.contributors.includes(contrib.fromUser)) {
    project.contributors.push(contrib.fromUser);
    project.credits.push({ email: contrib.fromUser, nick: contrib.fromNick, role: 'Contributor' });
  }
  await API.setData('projects', `proj_${project.id}`, project);
  contrib.status = 'approved';
  await API.setData('contributions', `contrib_${contribId}`, contrib);
  return { success: true };
}

// Simple markdown renderer (basic)
function renderMarkdown(md) {
  if (!md) return '';
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\n/gim, '<br>');
  return html;
}

window.Projects = {
  createProject, updateProjectFile, deleteProjectFile, listProjects,
  getLocalProjects, submitContribution, approveContribution, renderMarkdown,
  generateId, getCurrentUser, MAX_PROJECTS, MAX_SIZE_BYTES
};
