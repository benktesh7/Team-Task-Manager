// ─── AUTH ────────────────────────────────────────────────────
function showTab(tab) {
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
}

function setAuthLoading(formId, loading) {
  const btn = document.getElementById(formId === 'login-form' ? 'login-btn' : 'signup-btn');
  btn.querySelector('.btn-text').classList.toggle('hidden', loading);
  btn.querySelector('.btn-spinner').classList.toggle('hidden', !loading);
  btn.disabled = loading;
}

function showAuthError(formId, msg) {
  const el = document.getElementById(formId === 'login-form' ? 'login-error' : 'signup-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  document.getElementById('login-error').classList.add('hidden');
  setAuthLoading('login-form', true);
  try {
    const { data } = await API.login({
      email: document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value,
    });
    setToken(data.token);
    localStorage.setItem('tm_user', JSON.stringify(data.user));
    initApp(data.user);
  } catch (err) {
    showAuthError('login-form', err.message || 'Login failed');
  } finally {
    setAuthLoading('login-form', false);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  document.getElementById('signup-error').classList.add('hidden');
  setAuthLoading('signup-form', true);
  try {
    const { data } = await API.signup({
      name: document.getElementById('signup-name').value.trim(),
      email: document.getElementById('signup-email').value.trim(),
      password: document.getElementById('signup-password').value,
    });
    setToken(data.token);
    localStorage.setItem('tm_user', JSON.stringify(data.user));
    initApp(data.user);
  } catch (err) {
    showAuthError('signup-form', err.message || 'Signup failed');
  } finally {
    setAuthLoading('signup-form', false);
  }
}

function handleLogout() {
  clearToken();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  showTab('login');
}
