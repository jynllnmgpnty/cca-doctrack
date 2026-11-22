/**
 * CCA DocTrack – Student Document Request Tracking System
 * City College of Angeles (CCA) Web Application
 * Client-Side Application Logic with Authentication & Multi-Portal Support
 */

// Global Application State
const state = {
  currentView: 'landing', // 'landing' | 'student' | 'admin'
  studentActiveTab: 'submit', // 'submit' | 'history' | 'profile'
  adminActiveTab: 'dashboard', // 'dashboard' | 'manage' | 'system'

  // Current authenticated user session (null when not signed in)
  currentUser: null,
  authTargetPortal: 'student', // 'student' | 'admin'

  allRequests: [],
  studentRequests: [],
  filteredAdminRequests: [],
  isDbConnected: false,
  isSubmitting: false
};

// DOM References
const elements = {
  // Views
  viewLanding: document.getElementById('viewLanding'),
  viewStudentPortal: document.getElementById('viewStudentPortal'),
  viewAdminPortal: document.getElementById('viewAdminPortal'),

  // Auth Modal Elements
  authModalOverlay: document.getElementById('authModalOverlay'),
  btnAuthClose: document.getElementById('btnAuthClose'),
  authTabSignIn: document.getElementById('authTabSignIn'),
  authTabRegister: document.getElementById('authTabRegister'),
  formSignIn: document.getElementById('formSignIn'),
  formRegister: document.getElementById('formRegister'),
  portalTargetBadge: document.getElementById('portalTargetBadge'),
  portalTargetHint: document.getElementById('portalTargetHint'),
  btnToggleTargetPortal: document.getElementById('btnToggleTargetPortal'),
  authAlert: document.getElementById('authAlert'),

  // Auth Inputs
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  btnToggleLoginPw: document.getElementById('btnToggleLoginPw'),
  btnSignInSubmit: document.getElementById('btnSignInSubmit'),
  loginSpinner: document.getElementById('loginSpinner'),
  loginBtnLabel: document.getElementById('loginBtnLabel'),

  regFullName: document.getElementById('regFullName'),
  regStudentId: document.getElementById('regStudentId'),
  regCourse: document.getElementById('regCourse'),
  regRole: document.getElementById('regRole'),
  regEmail: document.getElementById('regEmail'),
  regPassword: document.getElementById('regPassword'),
  btnRegisterSubmit: document.getElementById('btnRegisterSubmit'),
  registerSpinner: document.getElementById('registerSpinner'),
  registerBtnLabel: document.getElementById('registerBtnLabel'),

  // Demo Login Buttons
  btnDemoLoginStudent: document.getElementById('btnDemoLoginStudent'),
  btnDemoLoginAdmin: document.getElementById('btnDemoLoginAdmin'),

  // Landing Header Auth Action Buttons
  landingAuthActions: document.getElementById('landingAuthActions'),
  btnLandingSignIn: document.getElementById('btnLandingSignIn'),
  btnLandingRegister: document.getElementById('btnLandingRegister'),
  cardEnterStudentPortal: document.getElementById('cardEnterStudentPortal'),
  cardEnterAdminPortal: document.getElementById('cardEnterAdminPortal'),
  btnLandingBrand: document.getElementById('btnLandingBrand'),

  // Logout Buttons
  btnStudentLogout: document.getElementById('btnStudentLogout'),
  btnAdminLogout: document.getElementById('btnAdminLogout'),
  btnStudentBackToHome: document.getElementById('btnStudentBackToHome'),
  btnAdminBackToHome: document.getElementById('btnAdminBackToHome'),
  btnStudentSwitchAdmin: document.getElementById('btnStudentSwitchAdmin'),
  btnAdminSwitchStudent: document.getElementById('btnAdminSwitchStudent'),

  // Landing Page Status
  landingDbIndicator: document.getElementById('landingDbIndicator'),

  // Student Portal Sidebar & Navigation
  studentNavItems: document.querySelectorAll('[data-student-tab]'),
  studentSubtabs: document.querySelectorAll('.student-subtab'),
  sidebarStudentAvatar: document.getElementById('sidebarStudentAvatar'),
  sidebarStudentName: document.getElementById('sidebarStudentName'),
  sidebarStudentId: document.getElementById('sidebarStudentId'),
  studentPageTitle: document.getElementById('studentPageTitle'),
  studentPageSubtitle: document.getElementById('studentPageSubtitle'),
  studentMyRequestsBadge: document.getElementById('studentMyRequestsBadge'),

  // Student Portal Form
  studentRequestForm: document.getElementById('studentRequestForm'),
  formStudentName: document.getElementById('formStudentName'),
  formStudentId: document.getElementById('formStudentId'),
  formCourse: document.getElementById('formCourse'),
  formDocumentType: document.getElementById('formDocumentType'),
  formDateSubmitted: document.getElementById('formDateSubmitted'),
  formEmail: document.getElementById('formEmail'),
  formPurpose: document.getElementById('formPurpose'),
  btnStudentFormReset: document.getElementById('btnStudentFormReset'),
  btnStudentSubmit: document.getElementById('btnStudentSubmit'),
  studentSubmitSpinner: document.getElementById('studentSubmitSpinner'),
  studentSubmitBtnText: document.getElementById('studentSubmitBtnText'),
  studentFormAlert: document.getElementById('studentFormAlert'),

  // Form Field Errors
  errStudentName: document.getElementById('errStudentName'),
  errStudentId: document.getElementById('errStudentId'),
  errDocumentType: document.getElementById('errDocumentType'),
  errDateSubmitted: document.getElementById('errDateSubmitted'),
  errPurpose: document.getElementById('errPurpose'),

  // Student Tracking & History
  statStudentTotal: document.getElementById('statStudentTotal'),
  statStudentPending: document.getElementById('statStudentPending'),
  statStudentProcessing: document.getElementById('statStudentProcessing'),
  statStudentCompleted: document.getElementById('statStudentCompleted'),
  btnStudentRefreshHistory: document.getElementById('btnStudentRefreshHistory'),
  studentRequestsContainer: document.getElementById('studentRequestsContainer'),

  // Student Profile Elements
  cardProfileName: document.getElementById('cardProfileName'),
  cardProfileId: document.getElementById('cardProfileId'),
  cardProfileCourse: document.getElementById('cardProfileCourse'),
  profileInputName: document.getElementById('profileInputName'),
  profileInputId: document.getElementById('profileInputId'),
  profileInputCourse: document.getElementById('profileInputCourse'),
  btnSaveStudentProfile: document.getElementById('btnSaveStudentProfile'),

  // Admin Portal Navigation & Dashboard
  adminNavItems: document.querySelectorAll('[data-admin-tab]'),
  adminSubtabs: document.querySelectorAll('.admin-subtab'),
  adminPageTitle: document.getElementById('adminPageTitle'),
  adminPageSubtitle: document.getElementById('adminPageSubtitle'),
  adminDbStatus: document.getElementById('adminDbStatus'),
  adminTotalBadge: document.getElementById('adminTotalBadge'),
  adminGlobalRefreshBtn: document.getElementById('adminGlobalRefreshBtn'),

  cardTotalCount: document.getElementById('cardTotalCount'),
  cardPendingCount: document.getElementById('cardPendingCount'),
  cardProcessingCount: document.getElementById('cardProcessingCount'),
  cardCompletedCount: document.getElementById('cardCompletedCount'),
  btnAdminViewAll: document.getElementById('btnAdminViewAll'),
  adminRecentTableBody: document.getElementById('adminRecentTableBody'),

  adminSearchInput: document.getElementById('adminSearchInput'),
  adminStatusFilter: document.getElementById('adminStatusFilter'),
  adminAllRequestsTableBody: document.getElementById('adminAllRequestsTableBody'),
  adminRecordsCount: document.getElementById('adminRecordsCount'),

  adminSysHealthBadge: document.getElementById('adminSysHealthBadge'),
  adminSysDbStatus: document.getElementById('adminSysDbStatus'),

  // Mobile Drawers
  mobileStudentToggle: document.getElementById('mobileStudentToggle'),
  mobileStudentSidebarClose: document.getElementById('mobileStudentSidebarClose'),
  mobileAdminToggle: document.getElementById('mobileAdminToggle'),
  mobileAdminSidebarClose: document.getElementById('mobileAdminSidebarClose'),

  toastContainer: document.getElementById('toastContainer')
};

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Check for existing session in localStorage
  restoreSession();

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  if (elements.formDateSubmitted) {
    elements.formDateSubmitted.value = today;
  }

  // Register Event Handlers
  setupAuthHandlers();
  setupNavigationHandlers();
  setupStudentForm();
  setupAdminFilters();
  setupMobileDrawers();

  // Check Database & Load Initial Data
  fetchHealthCheck();
  fetchAllRequests();
});

// ==========================================
// Authentication Logic (Login & Register)
// ==========================================

function restoreSession() {
  const savedUser = localStorage.getItem('cca_auth_user');
  if (savedUser) {
    try {
      state.currentUser = JSON.parse(savedUser);
      updateLandingAuthUI();
    } catch (e) {
      console.warn('Session parse error:', e);
      state.currentUser = null;
    }
  }
}

function updateLandingAuthUI() {
  if (!elements.landingAuthActions) return;

  if (state.currentUser) {
    elements.landingAuthActions.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:0.85rem;font-weight:700;color:var(--cca-navy);">
          👤 ${escapeHtml(state.currentUser.fullName.split(' ')[0])}
        </span>
        <button class="btn btn-navy btn-sm" id="btnLandingGoDashboard">
          <span>Go to ${state.currentUser.role === 'admin' ? 'Admin' : 'Student'} Portal &rarr;</span>
        </button>
        <button class="btn btn-secondary btn-sm" id="btnLandingSignOut">
          <span>Sign Out</span>
        </button>
      </div>
    `;

    document.getElementById('btnLandingGoDashboard')?.addEventListener('click', () => {
      switchView(state.currentUser.role === 'admin' ? 'admin' : 'student');
    });

    document.getElementById('btnLandingSignOut')?.addEventListener('click', handleLogout);
  } else {
    elements.landingAuthActions.innerHTML = `
      <button class="flowize-btn-login" id="btnLandingSignIn">Log in</button>
      <button class="btn btn-flowize-primary" id="btnLandingRegister">Get Started</button>
    `;

    document.getElementById('btnLandingSignIn')?.addEventListener('click', () => openAuthModal('signin', 'student'));
    document.getElementById('btnLandingRegister')?.addEventListener('click', () => openAuthModal('register', 'student'));
  }
}

function openAuthModal(mode = 'signin', targetPortal = 'student') {
  state.authTargetPortal = targetPortal;
  updatePortalTargetBanner();
  clearAuthAlert();

  if (mode === 'signin') {
    elements.authTabSignIn.classList.add('active');
    elements.authTabRegister.classList.remove('active');
    elements.formSignIn.classList.add('active');
    elements.formRegister.classList.remove('active');
  } else {
    elements.authTabRegister.classList.add('active');
    elements.authTabSignIn.classList.remove('active');
    elements.formRegister.classList.add('active');
    elements.formSignIn.classList.remove('active');
  }

  elements.authModalOverlay.classList.remove('hidden');
}

function closeAuthModal() {
  elements.authModalOverlay.classList.add('hidden');
  clearAuthAlert();
}

function updatePortalTargetBanner() {
  const isStudent = state.authTargetPortal === 'student';
  elements.portalTargetBadge.className = `portal-target-badge ${isStudent ? 'student' : 'admin'}`;
  elements.portalTargetBadge.textContent = isStudent ? 'Student Portal' : 'Admin Portal';
  elements.portalTargetHint.textContent = isStudent ? 'Logging in as Student' : 'Logging in as Registrar Admin';
  elements.btnToggleTargetPortal.textContent = isStudent ? 'Switch to Admin Portal' : 'Switch to Student Portal';
}

function setupAuthHandlers() {
  // Modal Openers
  elements.btnLandingSignIn?.addEventListener('click', () => openAuthModal('signin', 'student'));
  elements.btnLandingRegister?.addEventListener('click', () => openAuthModal('register', 'student'));

  elements.cardEnterStudentPortal?.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.role === 'student') {
      switchView('student');
    } else {
      openAuthModal('signin', 'student');
    }
  });

  elements.cardEnterAdminPortal?.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.role === 'admin') {
      switchView('admin');
    } else {
      openAuthModal('signin', 'admin');
    }
  });

  // Modal Closers
  elements.btnAuthClose?.addEventListener('click', closeAuthModal);
  elements.authModalOverlay?.addEventListener('click', (e) => {
    if (e.target === elements.authModalOverlay) closeAuthModal();
  });

  // Segmented Tabs
  elements.authTabSignIn?.addEventListener('click', () => {
    elements.authTabSignIn.classList.add('active');
    elements.authTabRegister.classList.remove('active');
    elements.formSignIn.classList.add('active');
    elements.formRegister.classList.remove('active');
    clearAuthAlert();
  });

  elements.authTabRegister?.addEventListener('click', () => {
    elements.authTabRegister.classList.add('active');
    elements.authTabSignIn.classList.remove('active');
    elements.formRegister.classList.add('active');
    elements.formSignIn.classList.remove('active');
    clearAuthAlert();
  });

  // Target Portal Toggle
  elements.btnToggleTargetPortal?.addEventListener('click', () => {
    state.authTargetPortal = state.authTargetPortal === 'student' ? 'admin' : 'student';
    updatePortalTargetBanner();
  });

  // Password Visibility Toggle
  elements.btnToggleLoginPw?.addEventListener('click', () => {
    const isPw = elements.loginPassword.type === 'password';
    elements.loginPassword.type = isPw ? 'text' : 'password';
    elements.btnToggleLoginPw.textContent = isPw ? '🔒' : '👁';
  });

  // Login Form Submission
  elements.formSignIn?.addEventListener('submit', handleLoginSubmit);

  // Register Form Submission
  elements.formRegister?.addEventListener('submit', handleRegisterSubmit);

  // Logout Handlers
  elements.btnStudentLogout?.addEventListener('click', handleLogout);
  elements.btnAdminLogout?.addEventListener('click', handleLogout);
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  clearAuthAlert();

  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value;

  if (!email || !password) {
    showAuthAlert('Please fill in both email and password.', 'error');
    return;
  }

  setAuthLoading(true, 'signin');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, targetPortal: state.authTargetPortal })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Authentication failed.');
    }

    // Save user session
    state.currentUser = result.user;
    localStorage.setItem('cca_auth_user', JSON.stringify(result.user));

    showToast(`Signed in successfully as ${result.user.fullName}!`, 'success');
    closeAuthModal();
    updateLandingAuthUI();

    // Direct to matching portal
    if (result.user.role === 'admin') {
      switchView('admin');
    } else {
      switchView('student');
    }

  } catch (error) {
    showAuthAlert(error.message, 'error');
  } finally {
    setAuthLoading(false, 'signin');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  clearAuthAlert();

  const payload = {
    fullName: elements.regFullName.value.trim(),
    studentId: elements.regStudentId.value.trim(),
    course: elements.regCourse.value,
    role: elements.regRole.value,
    email: elements.regEmail.value.trim(),
    password: elements.regPassword.value
  };

  if (!payload.fullName || !payload.email || !payload.password) {
    showAuthAlert('Please fill in all required fields.', 'error');
    return;
  }

  if (payload.role === 'student' && !payload.studentId) {
    showAuthAlert('Student ID is required for student registration.', 'error');
    return;
  }

  setAuthLoading(true, 'register');

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      const err = result.errors ? result.errors.join('<br>') : result.message;
      throw new Error(err || 'Registration failed.');
    }

    // Auto login with new user
    state.currentUser = result.user;
    localStorage.setItem('cca_auth_user', JSON.stringify(result.user));

    showToast('Account created successfully!', 'success');
    closeAuthModal();
    updateLandingAuthUI();

    if (result.user.role === 'admin') {
      switchView('admin');
    } else {
      switchView('student');
    }

  } catch (error) {
    showAuthAlert(error.message, 'error');
  } finally {
    setAuthLoading(false, 'register');
  }
}

function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem('cca_auth_user');
  updateLandingAuthUI();
  switchView('landing');
  showToast('You have been logged out safely.', 'info');
}

function showAuthAlert(msg, type) {
  elements.authAlert.className = `auth-alert ${type}`;
  elements.authAlert.innerHTML = msg;
  elements.authAlert.classList.remove('hidden');
}

function clearAuthAlert() {
  elements.authAlert.innerHTML = '';
  elements.authAlert.classList.add('hidden');
}

function setAuthLoading(isLoading, mode) {
  if (mode === 'signin') {
    elements.btnSignInSubmit.disabled = isLoading;
    if (isLoading) {
      elements.loginSpinner.classList.remove('hidden');
      elements.loginBtnLabel.textContent = 'Verifying...';
    } else {
      elements.loginSpinner.classList.add('hidden');
      elements.loginBtnLabel.textContent = 'Sign In';
    }
  } else {
    elements.btnRegisterSubmit.disabled = isLoading;
    if (isLoading) {
      elements.registerSpinner.classList.remove('hidden');
      elements.registerBtnLabel.textContent = 'Creating Account...';
    } else {
      elements.registerSpinner.classList.add('hidden');
      elements.registerBtnLabel.textContent = 'Create Account & Sign In';
    }
  }
}

// ==========================================
// View & Portal Switching
// ==========================================
function switchView(viewName) {
  state.currentView = viewName;

  elements.viewLanding.classList.remove('active');
  elements.viewStudentPortal.classList.remove('active');
  elements.viewAdminPortal.classList.remove('active');

  if (viewName === 'landing') {
    elements.viewLanding.classList.add('active');
    updateLandingAuthUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (viewName === 'student') {
    elements.viewStudentPortal.classList.add('active');
    syncStudentProfileFromAuth();
    filterStudentRequests();
  } else if (viewName === 'admin') {
    elements.viewAdminPortal.classList.add('active');
    updateAdminDashboard();
    renderAdminTable();
  }
}

function setupNavigationHandlers() {
  elements.btnLandingBrand?.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('landing');
  });

  document.getElementById('btnHeroGetStarted')?.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.role === 'student') {
      switchView('student');
    } else {
      openAuthModal('signin', 'student');
    }
  });

  document.getElementById('btnHeroDemo')?.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.role === 'student') {
      switchView('student');
      switchStudentSubtab('history');
    } else {
      openAuthModal('signin', 'student');
    }
  });

  document.getElementById('heroTabletMockup')?.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.role === 'student') {
      switchView('student');
    } else {
      openAuthModal('signin', 'student');
    }
  });

  document.getElementById('cardEnterTracking')?.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.role === 'student') {
      switchView('student');
      switchStudentSubtab('history');
    } else {
      openAuthModal('signin', 'student');
    }
  });

  document.getElementById('cardHeroCenterHighlight')?.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.role === 'student') {
      switchView('student');
    } else {
      openAuthModal('signin', 'student');
    }
  });

  document.getElementById('btnCardSubmitQuick')?.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.role === 'student') {
      switchView('student');
      switchStudentSubtab('submit');
    } else {
      openAuthModal('signin', 'student');
    }
  });

  // Segmented Pill Switches
  const segStudent = document.getElementById('btnSegStudent');
  const segAdmin = document.getElementById('btnSegAdmin');
  const segAlumni = document.getElementById('btnSegAlumni');
  const allSegs = [segStudent, segAdmin, segAlumni];

  segStudent?.addEventListener('click', () => {
    allSegs.forEach(s => s?.classList.remove('active'));
    segStudent.classList.add('active');
  });
  segAdmin?.addEventListener('click', () => {
    allSegs.forEach(s => s?.classList.remove('active'));
    segAdmin.classList.add('active');
  });
  segAlumni?.addEventListener('click', () => {
    allSegs.forEach(s => s?.classList.remove('active'));
    segAlumni.classList.add('active');
  });

  // Hero Quick Search / Track Bar
  const heroInput = document.getElementById('heroStudentIdInput');
  const btnHeroTrack = document.getElementById('btnHeroTrack');
  const handleHeroTrack = () => {
    const val = heroInput ? heroInput.value.trim() : '';
    if (val) {
      if (elements.profileInputId) elements.profileInputId.value = val;
      if (state.currentUser) state.currentUser.studentId = val;
    }
    switchView('student');
    switchStudentSubtab('history');
  };
  btnHeroTrack?.addEventListener('click', handleHeroTrack);
  heroInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleHeroTrack();
  });

  elements.btnStudentBackToHome?.addEventListener('click', () => switchView('landing'));
  elements.btnAdminBackToHome?.addEventListener('click', () => switchView('landing'));

  elements.btnStudentSwitchAdmin?.addEventListener('click', () => {
    if (state.currentUser && state.currentUser.role === 'admin') {
      switchView('admin');
    } else {
      openAuthModal('signin', 'admin');
    }
  });

  // Student Subtab Switchers
  elements.studentNavItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-student-tab');
      switchStudentSubtab(tab);
      closeMobileDrawers();
    });
  });

  // Admin Subtab Switchers
  elements.adminNavItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-admin-tab');
      switchAdminSubtab(tab);
      closeMobileDrawers();
    });
  });

  elements.btnAdminViewAll?.addEventListener('click', () => switchAdminSubtab('manage'));

  // Refresh Handlers
  elements.btnStudentRefreshHistory?.addEventListener('click', async () => {
    elements.btnStudentRefreshHistory.classList.add('rotating');
    await fetchAllRequests();
    showToast('Student requests refreshed', 'info');
    elements.btnStudentRefreshHistory.classList.remove('rotating');
  });

  elements.adminGlobalRefreshBtn?.addEventListener('click', async () => {
    elements.adminGlobalRefreshBtn.classList.add('rotating');
    await fetchAllRequests();
    await fetchHealthCheck();
    showToast('Synchronized with Registrar Office!', 'success');
    elements.adminGlobalRefreshBtn.classList.remove('rotating');
  });

  // Save Profile in Profile Tab
  elements.btnSaveStudentProfile?.addEventListener('click', handleSaveProfileManual);
}

function switchStudentSubtab(tabName) {
  state.studentActiveTab = tabName;

  elements.studentNavItems.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-student-tab') === tabName);
  });

  elements.studentSubtabs.forEach((pane) => {
    pane.classList.toggle('active', pane.id === `studentSubtab-${tabName}`);
  });

  const titles = {
    submit: {
      title: 'Submit Document Request',
      subtitle: 'Request official school certificates and credentials online'
    },
    history: {
      title: 'My Requests & Live Tracking',
      subtitle: `Tracking document requests for Student ID: ${getActiveStudentId()}`
    },
    profile: {
      title: 'My Student Profile',
      subtitle: 'Manage your active student credential identification'
    }
  };

  if (titles[tabName]) {
    elements.studentPageTitle.textContent = titles[tabName].title;
    elements.studentPageSubtitle.textContent = titles[tabName].subtitle;
  }

  if (tabName === 'history') {
    filterStudentRequests();
  }
}

function switchAdminSubtab(tabName) {
  state.adminActiveTab = tabName;

  elements.adminNavItems.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-admin-tab') === tabName);
  });

  elements.adminSubtabs.forEach((pane) => {
    pane.classList.toggle('active', pane.id === `adminSubtab-${tabName}`);
  });

  const titles = {
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'Campus-wide student document request tracking & operations'
    },
    manage: {
      title: 'Manage All Document Requests',
      subtitle: 'Update request processing statuses and review student submissions'
    },
    system: {
      title: 'Cloud Infrastructure & API Specifications',
      subtitle: 'System connectivity, REST API endpoints, and IT 412 project specs'
    }
  };

  if (titles[tabName]) {
    elements.adminPageTitle.textContent = titles[tabName].title;
    elements.adminPageSubtitle.textContent = titles[tabName].subtitle;
  }

  if (tabName === 'manage') {
    renderAdminTable();
  }
}

// ==========================================
// REST API Communication (Fetch)
// ==========================================

async function fetchHealthCheck() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const isConnected = data.database && data.database.status === 'Connected';
    state.isDbConnected = isConnected;

    if (elements.landingDbIndicator) {
      elements.landingDbIndicator.style.display = 'none';
    }

    if (elements.adminDbStatus) {
      elements.adminDbStatus.style.display = 'none';
    }

    if (elements.adminSysHealthBadge) {
      elements.adminSysHealthBadge.textContent = isConnected ? 'Operational' : 'Service Offline';
      elements.adminSysHealthBadge.className = isConnected ? 'badge badge-success' : 'badge badge-error';
    }
  } catch (err) {
    console.warn('Health check error:', err);
    state.isDbConnected = false;
  }
}

async function fetchAllRequests() {
  try {
    const res = await fetch('/api/requests');
    const result = await res.json();

    if (!res.ok) throw new Error(result.message || 'Failed to fetch requests.');

    state.allRequests = result.data || [];

    if (elements.adminTotalBadge) {
      elements.adminTotalBadge.textContent = state.allRequests.length;
    }

    updateAdminDashboard();
    renderAdminTable();
    filterStudentRequests();
  } catch (err) {
    console.error('Fetch requests error:', err);
    renderTableErrors(err.message);
  }
}

async function submitDocumentRequest(payload) {
  setSubmitLoading(true);
  clearFormAlert();

  try {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok) {
      const msg = result.errors ? result.errors.join('<br>') : result.message;
      throw new Error(msg || 'Failed to submit document request.');
    }

    showToast('Document request submitted successfully!', 'success');
    showFormAlert('Your document request has been submitted successfully to the Registrar Office.', 'success');

    elements.studentRequestForm.reset();
    populateFormWithProfile();
    elements.formDateSubmitted.value = new Date().toISOString().split('T')[0];

    await fetchAllRequests();

    setTimeout(() => {
      switchStudentSubtab('history');
      showToast('Switched to My Requests & Tracking view.', 'info');
    }, 1200);

  } catch (err) {
    showFormAlert(err.message, 'error');
    showToast(err.message.replace(/<br>/g, ', '), 'error');
  } finally {
    setSubmitLoading(false);
  }
}

async function updateRequestStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update status.');

    showToast(`Status updated to "${newStatus}"`, 'success');
    await fetchAllRequests();
  } catch (err) {
    showToast(err.message, 'error');
    renderAdminTable();
  }
}

// ==========================================
// Student Profile & Tracking Helpers
// ==========================================

function getActiveStudentId() {
  if (state.currentUser && state.currentUser.studentId) {
    return state.currentUser.studentId;
  }
  return elements.profileInputId?.value || '23-67894';
}

function syncStudentProfileFromAuth() {
  const user = state.currentUser || {
    fullName: 'Jaynellan Almary O. Magpantay',
    studentId: '23-67894',
    course: 'BS Information Technology'
  };

  if (elements.sidebarStudentName) elements.sidebarStudentName.textContent = user.fullName;
  const greetingEl = document.getElementById('studentGreetingName');
  if (greetingEl) greetingEl.textContent = user.fullName ? user.fullName.split(' ')[0] : 'Student';
  if (elements.sidebarStudentId) elements.sidebarStudentId.textContent = `ID: ${user.studentId}`;
  if (elements.sidebarStudentAvatar) {
    const initials = user.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    elements.sidebarStudentAvatar.textContent = initials || 'JM';
  }

  if (elements.cardProfileName) elements.cardProfileName.textContent = user.fullName;
  if (elements.cardProfileId) elements.cardProfileId.textContent = `STUDENT ID: ${user.studentId}`;
  if (elements.cardProfileCourse) elements.cardProfileCourse.textContent = user.course || 'BS Information Technology';

  if (elements.profileInputName) elements.profileInputName.value = user.fullName;
  if (elements.profileInputId) elements.profileInputId.value = user.studentId;
  if (elements.profileInputCourse && user.course) elements.profileInputCourse.value = user.course;

  populateFormWithProfile();
}

function populateFormWithProfile() {
  const user = state.currentUser || {
    fullName: elements.profileInputName?.value || 'Jaynellan Almary O. Magpantay',
    studentId: elements.profileInputId?.value || '23-67894',
    course: elements.profileInputCourse?.value || 'BS Information Technology',
    email: 'jaynellan@cca.edu.ph'
  };

  if (elements.formStudentName && !elements.formStudentName.value) {
    elements.formStudentName.value = user.fullName;
  }
  if (elements.formStudentId && !elements.formStudentId.value) {
    elements.formStudentId.value = user.studentId;
  }
  if (elements.formCourse && user.course) {
    elements.formCourse.value = user.course;
  }
  if (elements.formEmail && user.email && !elements.formEmail.value) {
    elements.formEmail.value = user.email;
  }
}

function handleSaveProfileManual() {
  const name = elements.profileInputName.value.trim();
  const id = elements.profileInputId.value.trim();
  const course = elements.profileInputCourse.value;

  if (!name || !id) {
    showToast('Name and Student ID are required.', 'error');
    return;
  }

  if (state.currentUser) {
    state.currentUser.fullName = name;
    state.currentUser.studentId = id;
    state.currentUser.course = course;
    localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));
  }

  syncStudentProfileFromAuth();
  filterStudentRequests();
  showToast('Student credentials updated in active session!', 'success');
}

function filterStudentRequests() {
  const activeId = getActiveStudentId().trim().toLowerCase();

  state.studentRequests = state.allRequests.filter((req) => {
    return req.studentId && req.studentId.trim().toLowerCase() === activeId;
  });

  if (elements.studentMyRequestsBadge) {
    elements.studentMyRequestsBadge.textContent = state.studentRequests.length;
  }

  const total = state.studentRequests.length;
  const pending = state.studentRequests.filter((r) => r.status === 'Pending').length;
  const processing = state.studentRequests.filter((r) => r.status === 'Processing').length;
  const completed = state.studentRequests.filter((r) => r.status === 'Completed').length;

  if (elements.statStudentTotal) elements.statStudentTotal.textContent = total;
  if (elements.statStudentPending) elements.statStudentPending.textContent = pending;
  if (elements.statStudentProcessing) elements.statStudentProcessing.textContent = processing;
  if (elements.statStudentCompleted) elements.statStudentCompleted.textContent = completed;

  renderStudentTrackingCards();
}

function renderStudentTrackingCards() {
  const container = elements.studentRequestsContainer;
  if (!container) return;

  if (state.studentRequests.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <svg style="width:48px;height:48px;color:#94A3B8;margin-bottom:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <h4>No document requests found for ID: ${escapeHtml(getActiveStudentId())}</h4>
        <p style="font-size:0.85rem;color:#64748B;margin-top:6px;">Go to "Submit Request" to submit your first academic request, or adjust your Student ID in "My Profile".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.studentRequests
    .map((req, index) => {
      const formattedDate = formatDate(req.dateSubmitted || req.createdAt);
      const status = req.status || 'Pending';
      const shortId = req._id ? req._id.substring(req._id.length - 6).toUpperCase() : `#${index + 1}`;

      let stepProgressClass = 'step-1';
      let step1Class = 'step-item completed';
      let step2Class = 'step-item';
      let step3Class = 'step-item';

      if (status === 'Pending') {
        stepProgressClass = 'step-1';
        step2Class = 'step-item active';
      } else if (status === 'Processing') {
        stepProgressClass = 'step-2';
        step2Class = 'step-item completed';
        step3Class = 'step-item active';
      } else if (status === 'Completed') {
        stepProgressClass = 'step-3';
        step2Class = 'step-item completed';
        step3Class = 'step-item completed';
      }

      return `
        <div class="tracking-card">
          <div class="tracking-header">
            <div class="tracking-doc-info">
              <h4>${escapeHtml(req.documentType)}</h4>
              <div class="tracking-meta-tags">
                <span class="ref-tag">REF: ${shortId}</span>
                <span>&bull;</span>
                <span>Filed: ${formattedDate}</span>
                <span>&bull;</span>
                <span>Student: ${escapeHtml(req.studentName)}</span>
              </div>
            </div>
            <div>
              <span class="status-badge ${status.toLowerCase()}">${escapeHtml(status)}</span>
            </div>
          </div>

          <div class="progress-stepper">
            <div class="stepper-line">
              <div class="stepper-progress ${stepProgressClass}"></div>
            </div>

            <div class="${step1Class}">
              <div class="step-icon">✓</div>
              <span class="step-label">1. Request Submitted<br><small style="color:#64748B;">${formattedDate}</small></span>
            </div>

            <div class="${step2Class}">
              <div class="step-icon">${status === 'Processing' || status === 'Completed' ? '✓' : '2'}</div>
              <span class="step-label">2. Under Review<br><small style="color:#64748B;">Registrar Office</small></span>
            </div>

            <div class="${step3Class}">
              <div class="step-icon">${status === 'Completed' ? '✓' : '3'}</div>
              <span class="step-label">3. Ready for Release<br><small style="color:#64748B;">Registrar Window</small></span>
            </div>
          </div>

          <div class="tracking-footer-box">
            <span class="purpose-note"><strong>Stated Purpose:</strong> ${escapeHtml(req.purpose)}</span>
            <span style="color:#64748B;font-size:0.75rem;">Official CCA Registrar Record</span>
          </div>
        </div>
      `;
    })
    .join('');
}

// ==========================================
// Student Submission Form Validation
// ==========================================
function setupStudentForm() {
  const form = elements.studentRequestForm;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateStudentForm()) return;

    const payload = {
      studentName: elements.formStudentName.value.trim(),
      studentId: elements.formStudentId.value.trim(),
      course: elements.formCourse.value,
      documentType: elements.formDocumentType.value,
      purpose: elements.formPurpose.value.trim(),
      dateSubmitted: elements.formDateSubmitted.value,
      email: elements.formEmail ? elements.formEmail.value.trim() : ''
    };

    submitDocumentRequest(payload);
  });

  elements.btnStudentFormReset?.addEventListener('click', () => {
    form.reset();
    clearStudentErrors();
    clearFormAlert();
    populateFormWithProfile();
    elements.formDateSubmitted.value = new Date().toISOString().split('T')[0];
  });

  elements.formStudentName?.addEventListener('input', () => clearFieldValidation(elements.formStudentName, elements.errStudentName));
  elements.formStudentId?.addEventListener('input', () => clearFieldValidation(elements.formStudentId, elements.errStudentId));
  elements.formDocumentType?.addEventListener('change', () => clearFieldValidation(elements.formDocumentType, elements.errDocumentType));
  elements.formPurpose?.addEventListener('input', () => clearFieldValidation(elements.formPurpose, elements.errPurpose));
  elements.formDateSubmitted?.addEventListener('change', () => clearFieldValidation(elements.formDateSubmitted, elements.errDateSubmitted));
}

function validateStudentForm() {
  let isValid = true;
  clearStudentErrors();

  const name = elements.formStudentName.value.trim();
  const id = elements.formStudentId.value.trim();
  const docType = elements.formDocumentType.value;
  const purpose = elements.formPurpose.value.trim();
  const date = elements.formDateSubmitted.value;

  if (!name) {
    setFieldError(elements.formStudentName, elements.errStudentName, 'Please enter your full student name.');
    isValid = false;
  }
  if (!id) {
    setFieldError(elements.formStudentId, elements.errStudentId, 'Please enter your student ID number.');
    isValid = false;
  }
  if (!docType) {
    setFieldError(elements.formDocumentType, elements.errDocumentType, 'Please select the document to request.');
    isValid = false;
  }
  if (!purpose) {
    setFieldError(elements.formPurpose, elements.errPurpose, 'Please specify the purpose of this request.');
    isValid = false;
  }
  if (!date) {
    setFieldError(elements.formDateSubmitted, elements.errDateSubmitted, 'Please choose the date submitted.');
    isValid = false;
  }

  return isValid;
}

function setFieldError(input, errSpan, msg) {
  input.classList.add('input-error');
  errSpan.textContent = msg;
}

function clearFieldValidation(input, errSpan) {
  input.classList.remove('input-error');
  errSpan.textContent = '';
}

function clearStudentErrors() {
  clearFieldValidation(elements.formStudentName, elements.errStudentName);
  clearFieldValidation(elements.formStudentId, elements.errStudentId);
  clearFieldValidation(elements.formDocumentType, elements.errDocumentType);
  clearFieldValidation(elements.formPurpose, elements.errPurpose);
  clearFieldValidation(elements.formDateSubmitted, elements.errDateSubmitted);
}

function setSubmitLoading(isLoading) {
  state.isSubmitting = isLoading;
  elements.btnStudentSubmit.disabled = isLoading;
  if (isLoading) {
    elements.studentSubmitSpinner.classList.remove('hidden');
    elements.studentSubmitBtnText.textContent = 'Submitting Request...';
  } else {
    elements.studentSubmitSpinner.classList.add('hidden');
    elements.studentSubmitBtnText.textContent = 'Submit Request Now';
  }
}

function showFormAlert(htmlMsg, type) {
  elements.studentFormAlert.className = `form-alert ${type}`;
  elements.studentFormAlert.innerHTML = htmlMsg;
  elements.studentFormAlert.classList.remove('hidden');
}

function clearFormAlert() {
  elements.studentFormAlert.innerHTML = '';
  elements.studentFormAlert.classList.add('hidden');
}

// ==========================================
// Admin Dashboard & Table Logic
// ==========================================
function updateAdminDashboard() {
  const reqs = state.allRequests;
  const total = reqs.length;
  const pending = reqs.filter((r) => r.status === 'Pending').length;
  const processing = reqs.filter((r) => r.status === 'Processing').length;
  const completed = reqs.filter((r) => r.status === 'Completed').length;

  if (elements.cardTotalCount) elements.cardTotalCount.textContent = total;
  if (elements.cardPendingCount) elements.cardPendingCount.textContent = pending;
  if (elements.cardProcessingCount) elements.cardProcessingCount.textContent = processing;
  if (elements.cardCompletedCount) elements.cardCompletedCount.textContent = completed;

  renderAdminRecentTable();
}

function renderAdminRecentTable() {
  const tbody = elements.adminRecentTableBody;
  if (!tbody) return;

  const recent = state.allRequests.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No requests found.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent
    .map((req) => {
      const formattedDate = formatDate(req.dateSubmitted || req.createdAt);
      const status = req.status || 'Pending';
      return `
        <tr>
          <td><strong>${escapeHtml(req.studentName)}</strong></td>
          <td><code>${escapeHtml(req.studentId)}</code></td>
          <td>${escapeHtml(req.documentType)}</td>
          <td>${formattedDate}</td>
          <td><span class="status-badge ${status.toLowerCase()}">${escapeHtml(status)}</span></td>
        </tr>
      `;
    })
    .join('');
}

function setupAdminFilters() {
  elements.adminSearchInput?.addEventListener('input', applyAdminFilters);
  elements.adminStatusFilter?.addEventListener('change', applyAdminFilters);
}

function applyAdminFilters() {
  const search = elements.adminSearchInput ? elements.adminSearchInput.value.toLowerCase().trim() : '';
  const status = elements.adminStatusFilter ? elements.adminStatusFilter.value : 'ALL';

  state.filteredAdminRequests = state.allRequests.filter((req) => {
    const matchesStatus = status === 'ALL' || req.status === status;
    const matchesSearch =
      !search ||
      (req.studentName && req.studentName.toLowerCase().includes(search)) ||
      (req.studentId && req.studentId.toLowerCase().includes(search)) ||
      (req.documentType && req.documentType.toLowerCase().includes(search)) ||
      (req.purpose && req.purpose.toLowerCase().includes(search));

    return matchesStatus && matchesSearch;
  });

  renderAdminTable();
}

function renderAdminTable() {
  const tbody = elements.adminAllRequestsTableBody;
  if (!tbody) return;

  const list = state.filteredAdminRequests.length > 0 || (elements.adminSearchInput && elements.adminSearchInput.value)
    ? state.filteredAdminRequests
    : state.allRequests;

  if (elements.adminRecordsCount) {
    elements.adminRecordsCount.textContent = `Showing ${list.length} of ${state.allRequests.length} total requests`;
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty">${state.allRequests.length === 0 ? 'No student document requests recorded yet.' : 'No records match your filter criteria.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((req, index) => {
      const formattedDate = formatDate(req.dateSubmitted || req.createdAt);
      const shortId = req._id ? req._id.substring(req._id.length - 6).toUpperCase() : `#${index + 1}`;
      const status = req.status || 'Pending';

      return `
        <tr>
          <td><code title="${req._id}">${shortId}</code></td>
          <td><strong>${escapeHtml(req.studentName)}</strong></td>
          <td><code>${escapeHtml(req.studentId)}</code></td>
          <td><span style="font-size:0.8rem;color:#475569;">${escapeHtml(req.course || 'BSIT')}</span></td>
          <td>${escapeHtml(req.documentType)}</td>
          <td title="${escapeHtml(req.purpose)}">${escapeHtml(truncateText(req.purpose, 28))}</td>
          <td>${formattedDate}</td>
          <td><span class="status-badge ${status.toLowerCase()}">${escapeHtml(status)}</span></td>
          <td class="text-center">
            <select class="status-select" onchange="handleAdminStatusChange(event, '${req._id}')">
              <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Processing" ${status === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Completed" ${status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderTableErrors(msg) {
  const errorHtml = `<tr><td colspan="9" class="table-empty" style="color:#DC2626;">⚠️ ${escapeHtml(msg)}</td></tr>`;
  if (elements.adminRecentTableBody) elements.adminRecentTableBody.innerHTML = errorHtml;
  if (elements.adminAllRequestsTableBody) elements.adminAllRequestsTableBody.innerHTML = errorHtml;
}

window.handleAdminStatusChange = function (event, requestId) {
  const newStatus = event.target.value;
  updateRequestStatus(requestId, newStatus);
};

// ==========================================
// Mobile Drawers & Utilities
// ==========================================
function setupMobileDrawers() {
  const studentSidebar = document.querySelector('.portal-sidebar.student-theme');
  const adminSidebar = document.querySelector('.portal-sidebar.admin-theme');

  elements.mobileStudentToggle?.addEventListener('click', () => studentSidebar?.classList.add('open'));
  elements.mobileStudentSidebarClose?.addEventListener('click', () => studentSidebar?.classList.remove('open'));
  elements.mobileAdminToggle?.addEventListener('click', () => adminSidebar?.classList.add('open'));
  elements.mobileAdminSidebarClose?.addEventListener('click', () => adminSidebar?.classList.remove('open'));
}

function closeMobileDrawers() {
  document.querySelectorAll('.portal-sidebar').forEach((s) => s.classList.remove('open'));
}

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-message">${escapeHtml(msg)}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatDate(dateString) {
  if (!dateString) return '--';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function truncateText(str, max) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
