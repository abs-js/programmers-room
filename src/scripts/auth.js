// auth.js - Authentication, registration, validation

const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C#', 'C++', 'C', 'PHP', 'Ruby', 'Swift',
  'Kotlin', 'Go', 'SQL', 'HTML', 'CSS', 'Rust', 'R', 'JSON', 'XML', 'YAML', 'Shell',
  'Perl', 'Objective-C', 'Lua', 'Assembly', 'Arduino', 'Markdown', 'Compino'
];

const WEAK_PASSWORDS = ['password', '12345678', '123456789', 'qwertyui', 'admin123', 'letmein', 'welcome1', 'password123'];

let pendingRegistration = null;
let captchaAnswer = 0;

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  captchaAnswer = a + b;
  document.getElementById('captcha-question').textContent = `Quanto é ${a} + ${b}?`;
}

function isWeakPassword(password, nickname, email) {
  const pw = password.toLowerCase();
  if (password.length < 8) return true;
  if (WEAK_PASSWORDS.includes(pw)) return true;
  if (pw.includes(nickname.toLowerCase()) && nickname.length > 2) return true;
  if (pw.includes(email.split('@')[0].toLowerCase())) return true;
  if (/^[0-9]+$/.test(password)) return true;
  if (/^(.)\1+$/.test(password)) return true; // all same char
  if (/123456|abcdef|qwerty/i.test(password)) return true;
  return false;
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function registerUser() {
  const nick = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pw = document.getElementById('reg-password').value;
  const pw2 = document.getElementById('reg-password2').value;
  const github = document.getElementById('reg-github').value.trim();
  const birth = document.getElementById('reg-birth').value;
  const captchaInput = parseInt(document.getElementById('captcha-answer').value);
  const avatarFile = document.getElementById('reg-avatar').files[0];
  const errorEl = document.getElementById('reg-error');

  errorEl.textContent = '';

  if (!nick || !email || !pw || !birth) {
    errorEl.textContent = 'Preencha todos os campos obrigatórios.';
    return;
  }
  if (pw !== pw2) {
    errorEl.textContent = 'Senhas não coincidem.';
    return;
  }
  if (isWeakPassword(pw, nick, email)) {
    errorEl.textContent = 'Senha muito fraca ou óbvia. Use pelo menos 8 caracteres, misture letras e números, evite sequências e palavras comuns.';
    return;
  }
  if (captchaInput !== captchaAnswer) {
    errorEl.textContent = 'Captcha incorreto.';
    generateCaptcha();
    return;
  }

  // Age check > 8 years
  const birthDate = new Date(birth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  if (age < 8) {
    errorEl.textContent = 'Você precisa ter pelo menos 8 anos.';
    return;
  }

  // Check existing
  const existing = await API.getData('users', `user_${email}`);
  if (existing) {
    errorEl.textContent = 'E-mail já cadastrado.';
    return;
  }
  // Check nickname uniqueness (simple scan)
  const allUsers = await API.listData('users');
  if (allUsers.some(u => u.value && u.value.nickname && u.value.nickname.toLowerCase() === nick.toLowerCase())) {
    errorEl.textContent = 'Nickname já em uso.';
    return;
  }

  let avatarData = '';
  if (avatarFile) {
    avatarData = await resizeImage(avatarFile, 128);
  }

  const code = Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digits

  pendingRegistration = {
    nickname: nick,
    email,
    passwordHash: await hashPassword(pw),
    github,
    birthdate: birth,
    avatar: avatarData,
    verifyCode: code,
    createdAt: new Date().toISOString()
  };

  await API.setData('pending_users', `pending_${email}`, pendingRegistration);

  document.getElementById('demo-code').textContent = code;
  document.getElementById('email-verify').style.display = 'block';
  document.getElementById('register-btn').style.display = 'none';
  errorEl.textContent = 'Código gerado! (Demo: em produção seria enviado por e-mail)';
}

async function verifyCode() {
  const inputCode = document.getElementById('verify-code').value.trim();
  const errorEl = document.getElementById('reg-error');
  if (!pendingRegistration || inputCode !== pendingRegistration.verifyCode) {
    errorEl.textContent = 'Código inválido.';
    return;
  }

  // Move to users
  const userData = { ...pendingRegistration };
  delete userData.verifyCode;
  userData.verified = true;
  userData.projects = []; // max 3
  userData.preferredLang = '';
  userData.secondaryLang = '';
  userData.bio = '';
  userData.description = '';
  userData.tags = [];
  userData.engine = 'none';
  userData.socials = {};

  await API.setData('users', `user_${userData.email}`, userData);
  await API.deleteData('pending_users', `pending_${userData.email}`);

  // Store session
  localStorage.setItem('proRom_currentUser', JSON.stringify({ email: userData.email, nickname: userData.nickname }));

  // Show setup
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('setup-screen').classList.add('active');
  populateLanguageSelects();
}

function populateLanguageSelects() {
  const selects = [document.getElementById('pref-lang'), document.getElementById('sec-lang')];
  selects.forEach(sel => {
    sel.innerHTML = '<option value="">Selecione...</option>';
    LANGUAGES.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = lang;
      sel.appendChild(opt);
    });
  });
}

async function finishSetup() {
  const email = JSON.parse(localStorage.getItem('proRom_currentUser')).email;
  const user = await API.getData('users', `user_${email}`);
  if (!user) return;

  user.preferredLang = document.getElementById('pref-lang').value;
  user.secondaryLang = document.getElementById('sec-lang').value;
  user.bio = document.getElementById('bio').value;
  user.description = document.getElementById('desc').value;
  user.tags = document.getElementById('proj-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  user.engine = document.getElementById('engine').value;
  user.socials = {
    facebook: document.getElementById('social-fb').value,
    youtube: document.getElementById('social-yt').value,
    chatgpt: document.getElementById('social-chatgpt').value,
    editor: document.getElementById('editor-pref').value
  };

  await API.setData('users', `user_${email}`, user);

  // Enter main app
  document.getElementById('setup-screen').classList.remove('active');
  document.getElementById('main-screen').classList.add('active');
  if (window.loadMainApp) window.loadMainApp();
}

async function loginUser() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pw = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  const user = await API.getData('users', `user_${email}`);
  if (!user) {
    errorEl.textContent = 'Usuário não encontrado.';
    return;
  }
  const hash = await hashPassword(pw);
  if (hash !== user.passwordHash) {
    errorEl.textContent = 'Senha incorreta.';
    return;
  }

  localStorage.setItem('proRom_currentUser', JSON.stringify({ email: user.email, nickname: user.nickname }));
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('main-screen').classList.add('active');
  if (window.loadMainApp) window.loadMainApp();
}

function resizeImage(file, maxSize) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Event bindings will be in app.js
window.Auth = {
  generateCaptcha, registerUser, verifyCode, finishSetup, loginUser, LANGUAGES
};
