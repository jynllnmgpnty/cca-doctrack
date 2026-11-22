/**
 * CCA DocTrack – Student Document Request Tracking System
 * City College of Angeles (CCA) Web Application
 * Client-Side Application Logic with Authentication & Multi-Portal Support
 */

// Global Application State
const state = {
  currentView: 'landing', // 'landing' | 'student' | 'admin'
  studentActiveTab: 'profile', // 'profile' | 'submit' | 'history'
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
  btnIndicatorStudent: document.getElementById('btnIndicatorStudent'),
  btnIndicatorAdmin: document.getElementById('btnIndicatorAdmin'),
  authRoleIndicators: document.getElementById('authRoleIndicators'),
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
  regConfirmPassword: document.getElementById('regConfirmPassword'),
  btnToggleRegPw: document.getElementById('btnToggleRegPw'),
  btnToggleRegConfirmPw: document.getElementById('btnToggleRegConfirmPw'),
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

  // Student Profile, Digital ID Card & Guardian Records
  cardProfileName: document.getElementById('cardProfileName'),
  cardProfileId: document.getElementById('cardProfileId'),
  cardProfileCourse: document.getElementById('cardProfileCourse'),
  cardProfileYear: document.getElementById('cardProfileYear'),
  cardProfileStatus: document.getElementById('cardProfileStatus'),
  cardParentDetails: document.getElementById('cardParentDetails'),
  cardParentPhone: document.getElementById('cardParentPhone'),
  cardBarcodeNum: document.getElementById('cardBarcodeNum'),
  idPhotoBox: document.getElementById('idPhotoBox'),
  idCardPhotoImg: document.getElementById('idCardPhotoImg'),
  idPhotoPlaceholder: document.getElementById('idPhotoPlaceholder'),
  inputStudentAvatar: document.getElementById('inputStudentAvatar'),
  btnUploadPhoto: document.getElementById('btnUploadPhoto'),
  btnChangePhotoTrigger: document.getElementById('btnChangePhotoTrigger'),
  btnRemovePhoto: document.getElementById('btnRemovePhoto'),
  topbarStudentAvatar: document.getElementById('topbarStudentAvatar'),
  topbarStudentName: document.getElementById('topbarStudentName'),
  btnTopbarProfileShortcut: document.getElementById('btnTopbarProfileShortcut'),
  btnProfileQuickSubmit: document.getElementById('btnProfileQuickSubmit'),
  btnProfileQuickTracking: document.getElementById('btnProfileQuickTracking'),
  profileInputName: document.getElementById('profileInputName'),
  profileInputId: document.getElementById('profileInputId'),
  profileInputCourse: document.getElementById('profileInputCourse'),
  profileInputYear: document.getElementById('profileInputYear'),
  profileInputEmail: document.getElementById('profileInputEmail'),
  profileInputPhone: document.getElementById('profileInputPhone'),
  profileInputParentName: document.getElementById('profileInputParentName'),
  profileInputParentRelation: document.getElementById('profileInputParentRelation'),
  profileInputParentPhone: document.getElementById('profileInputParentPhone'),
  profileInputParentEmail: document.getElementById('profileInputParentEmail'),
  profileInputParentAddress: document.getElementById('profileInputParentAddress'),
  btnSaveStudentProfile: document.getElementById('btnSaveStudentProfile'),
  profileSaveStatus: document.getElementById('profileSaveStatus'),

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
  setupStudentRefPortalListeners();

  // Check Database & Load Initial Data
  fetchHealthCheck();
  fetchAllRequests();
});

// ==========================================
// Authentication Logic (Login & Register)
// ==========================================

function dismissInitialLoader() {
  const loader = document.getElementById('appInitialLoader');
  if (!loader || loader.classList.contains('fade-out')) return;
  setTimeout(() => {
    loader.classList.add('fade-out');
    setTimeout(() => {
      if (loader.parentNode) loader.style.display = 'none';
    }, 400);
  }, 250);
}

function restoreSession() {
  const savedUser = localStorage.getItem('cca_auth_user');
  const savedView = localStorage.getItem('cca_current_view');
  const savedStudentTab = localStorage.getItem('cca_student_active_tab');
  const savedAdminTab = localStorage.getItem('cca_admin_active_tab');

  if (savedUser) {
    try {
      state.currentUser = JSON.parse(savedUser);
      updateLandingAuthUI();

      if (state.currentUser.role === 'admin') {
        const targetView = (savedView === 'landing') ? 'landing' : 'admin';
        state.adminActiveTab = savedAdminTab || 'dashboard';
        switchView(targetView);
        if (targetView === 'admin') {
          switchAdminSubtab(state.adminActiveTab);
        }
      } else {
        const targetView = (savedView === 'landing') ? 'landing' : 'student';
        state.studentActiveTab = savedStudentTab || 'profile';
        switchView(targetView);
        if (targetView === 'student') {
          switchStudentSubtab(state.studentActiveTab);
        }
      }
    } catch (e) {
      console.warn('Session parse error:', e);
      state.currentUser = null;
      switchView('landing');
    }
  } else {
    switchView('landing');
  }

  // Dismiss full-screen initial loader
  dismissInitialLoader();
  // Fallback safety timeout to guarantee loader never hangs
  setTimeout(dismissInitialLoader, 1500);
}

function updateLandingAuthUI() {
  if (!elements.landingAuthActions) return;

  if (state.currentUser) {
    elements.landingAuthActions.innerHTML = `
      <button class="btn btn-flowize-primary" id="btnLandingSignIn">Log in</button>
    `;

    document.getElementById('btnLandingSignIn')?.addEventListener('click', () => openAuthModal('signin', 'student'));
  }
}

function setRoleIndicator(role = 'student') {
  state.authTargetPortal = role;
  const isStudent = role === 'student';

  if (elements.btnIndicatorStudent && elements.btnIndicatorAdmin) {
    if (isStudent) {
      elements.btnIndicatorStudent.classList.add('active');
      elements.btnIndicatorAdmin.classList.remove('active');
    } else {
      elements.btnIndicatorAdmin.classList.add('active');
      elements.btnIndicatorStudent.classList.remove('active');
    }
  }

  // Update inputs placeholder and button labels
  if (elements.loginEmail) {
    elements.loginEmail.placeholder = isStudent ? 'e.g., student@cca.edu.ph or 23-0000' : 'e.g., admin@cca.edu.ph';
  }
  if (elements.loginBtnLabel) {
    elements.loginBtnLabel.textContent = isStudent ? 'Sign In as Student' : 'Sign In as Admin';
  }
  if (elements.authModalSubtext) {
    elements.authModalSubtext.textContent = isStudent 
      ? 'Student Document Portal • CCA DocTrack'
      : 'Registrar Admin Management • CCA DocTrack';
  }

  // Also sync register fields if registration tab is used
  if (elements.regRole) {
    elements.regRole.value = role;
  }
  const groupStudentId = document.getElementById('groupRegStudentId');
  if (groupStudentId) {
    groupStudentId.style.display = isStudent ? 'flex' : 'none';
  }
  const groupCourse = document.getElementById('groupRegCourse');
  if (groupCourse) {
    groupCourse.style.display = isStudent ? 'flex' : 'none';
  }
  const groupFullName = document.getElementById('groupRegFullName');
  if (groupFullName) {
    if (isStudent) {
      groupFullName.classList.remove('full-width');
    } else {
      groupFullName.classList.add('full-width');
    }
  }
  const groupEmail = document.getElementById('groupRegEmail');
  if (groupEmail) {
    if (isStudent) {
      groupEmail.classList.remove('full-width');
    } else {
      groupEmail.classList.add('full-width');
    }
  }
  if (elements.registerBtnLabel) {
    elements.registerBtnLabel.textContent = isStudent ? 'Create Student Account' : 'Create Admin Account';
  }
}

function openAuthModal(mode = 'signin', targetPortal = 'student') {
  setRoleIndicator(targetPortal);
  clearAuthAlert();

  // Clear password inputs on open to prevent stale browser autocomplete issues
  if (elements.loginPassword) elements.loginPassword.value = '';
  if (elements.regPassword) elements.regPassword.value = '';
  if (elements.regConfirmPassword) elements.regConfirmPassword.value = '';

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

function setupPasswordToggle(button, input) {
  if (!button || !input) return;
  button.addEventListener('click', (e) => {
    e.preventDefault();
    const isPw = input.type === 'password';
    input.type = isPw ? 'text' : 'password';
    button.classList.toggle('unhidden', isPw);
    button.title = isPw ? 'Hide Password' : 'Show Password';
    button.innerHTML = isPw
      ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });
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

  // Role Indicators (Student vs Admin)
  elements.btnIndicatorStudent?.addEventListener('click', () => setRoleIndicator('student'));
  elements.btnIndicatorAdmin?.addEventListener('click', () => setRoleIndicator('admin'));

  // Password Visibility Toggles (Hide and Unhide)
  setupPasswordToggle(elements.btnToggleLoginPw, elements.loginPassword);
  setupPasswordToggle(elements.btnToggleRegPw, elements.regPassword);
  setupPasswordToggle(elements.btnToggleRegConfirmPw, elements.regConfirmPassword);

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
  const password = elements.loginPassword.value.trim();

  if (!email || !password) {
    showAuthAlert('Please fill in both email/student ID and password.', 'error');
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
      localStorage.setItem('cca_current_view', 'admin');
      localStorage.setItem('cca_admin_active_tab', 'dashboard');
      switchView('admin');
      switchAdminSubtab('dashboard');
    } else {
      localStorage.setItem('cca_current_view', 'student');
      localStorage.setItem('cca_student_active_tab', 'profile');
      switchView('student');
      switchStudentSubtab('profile');
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

  const role = elements.regRole ? elements.regRole.value : state.authTargetPortal;
  const fullName = elements.regFullName.value.trim();
  const studentId = elements.regStudentId ? elements.regStudentId.value.trim() : '';
  const email = elements.regEmail.value.trim();
  const password = elements.regPassword.value;
  const confirmPassword = elements.regConfirmPassword ? elements.regConfirmPassword.value : '';
  const course = elements.regCourse ? elements.regCourse.value : 'BS Information Technology';

  if (!fullName || !email || !password || !confirmPassword) {
    showAuthAlert('Please fill in all required fields.', 'error');
    return;
  }

  if (role === 'student' && !studentId) {
    showAuthAlert('Student ID is required for student registration.', 'error');
    return;
  }

  // Password rules validation: 8-12 characters, uppercase, lowercase, number
  if (password.length < 8 || password.length > 12) {
    showAuthAlert('Password must be between 8 and 12 characters long.', 'error');
    return;
  }
  if (!/[A-Z]/.test(password)) {
    showAuthAlert('Password must include at least one uppercase letter (A-Z).', 'error');
    return;
  }
  if (!/[a-z]/.test(password)) {
    showAuthAlert('Password must include at least one lowercase letter (a-z).', 'error');
    return;
  }
  if (!/[0-9]/.test(password)) {
    showAuthAlert('Password must include at least one number (0-9).', 'error');
    return;
  }

  // Password match verification
  if (password !== confirmPassword) {
    showAuthAlert('Passwords do not match. Please re-enter your password.', 'error');
    return;
  }

  const payload = {
    fullName,
    studentId,
    course,
    role,
    email,
    password,
    confirmPassword
  };

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

    // Pre-fill login input with registered email/ID for seamless future logins
    if (elements.loginEmail) elements.loginEmail.value = result.user.email;
    if (elements.regPassword) elements.regPassword.value = '';
    if (elements.regConfirmPassword) elements.regConfirmPassword.value = '';

    showToast('Account created successfully!', 'success');
    closeAuthModal();
    updateLandingAuthUI();

    if (result.user.role === 'admin') {
      localStorage.setItem('cca_current_view', 'admin');
      localStorage.setItem('cca_admin_active_tab', 'dashboard');
      switchView('admin');
      switchAdminSubtab('dashboard');
    } else {
      localStorage.setItem('cca_current_view', 'student');
      localStorage.setItem('cca_student_active_tab', 'profile');
      switchView('student');
      switchStudentSubtab('profile');
    }

  } catch (error) {
    showAuthAlert(error.message, 'error');
  } finally {
    setAuthLoading(false, 'register');
  }
}

function handleLogout() {
  const lastUser = state.currentUser;
  state.currentUser = null;
  localStorage.removeItem('cca_auth_user');
  localStorage.setItem('cca_current_view', 'landing');
  localStorage.removeItem('cca_student_active_tab');
  localStorage.removeItem('cca_admin_active_tab');
  updateLandingAuthUI();
  switchView('landing');

  // Clear sensitive password inputs
  if (elements.loginPassword) elements.loginPassword.value = '';
  if (elements.regPassword) elements.regPassword.value = '';
  if (elements.regConfirmPassword) elements.regConfirmPassword.value = '';

  // Pre-fill email/ID with the user who just logged out for convenient re-login
  if (lastUser && lastUser.email && elements.loginEmail) {
    elements.loginEmail.value = lastUser.email;
  }

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
  try {
    localStorage.setItem('cca_current_view', viewName);
  } catch (e) {}

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
    initStudentRefPortal();
    const activeTab = state.studentActiveTab || localStorage.getItem('cca_student_active_tab') || 'profile';
    switchStudentSubtab(activeTab);
  } else if (viewName === 'admin') {
    elements.viewAdminPortal.classList.add('active');
    updateAdminDashboard();
    renderAdminTable();
    const activeTab = state.adminActiveTab || localStorage.getItem('cca_admin_active_tab') || 'dashboard';
    switchAdminSubtab(activeTab);
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

  elements.btnStudentBackToHome?.addEventListener('click', () => switchView('landing'));
  elements.btnAdminBackToHome?.addEventListener('click', () => switchView('landing'));

  // Student Subtab Switchers
  elements.studentNavItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-student-tab');
      switchStudentSubtab(tab);
      closeMobileDrawers();
    });
  });

  // Setup Student Profile, Avatar Upload & Live ID Card Handlers
  setupProfileHandlers();

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
  try {
    localStorage.setItem('cca_student_active_tab', tabName);
  } catch (e) {}
  if (typeof triggerStudentViewLoader === 'function') {
    triggerStudentViewLoader();
  }

  document.querySelectorAll('.ref-nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-student-tab') === tabName);
  });

  document.querySelectorAll('.student-subtab-pane').forEach((pane) => {
    pane.classList.toggle('active', pane.id === 'studentSubtab-' + tabName);
  });

  // Also support legacy subtabs if any
  document.querySelectorAll('.student-subtab').forEach((pane) => {
    pane.classList.toggle('active', pane.id === 'studentSubtab-' + tabName);
  });

  if (tabName === 'dashboard') {
    renderStudentDashboardData();
  } else if (tabName === 'profile') {
    syncStudentRefProfile();
  } else if (tabName === 'request') {
    renderStudentHistoryTable();
  } else if (tabName === 'tracking') {
    renderStudentTrackingCards();
  } else if (tabName === 'settings') {
    syncStudentRefProfile();
  } else if (tabName === 'change-password') {
    const pwForm = document.getElementById('refChangePasswordForm');
    if (pwForm) pwForm.reset();
  }
}

function switchAdminSubtab(tabName) {
  state.adminActiveTab = tabName;
  try {
    localStorage.setItem('cca_admin_active_tab', tabName);
  } catch (e) {}

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
// Student Profile, Digital ID & Guardian Records
// ==========================================

function getActiveStudentId() {
  if (state.currentUser && state.currentUser.studentId) {
    return state.currentUser.studentId;
  }
  return elements.profileInputId?.value || '23-0000';
}

function setupProfileHandlers() {
  // Avatar upload trigger buttons
  elements.btnUploadPhoto?.addEventListener('click', () => elements.inputStudentAvatar?.click());
  elements.btnChangePhotoTrigger?.addEventListener('click', () => elements.inputStudentAvatar?.click());
  elements.inputStudentAvatar?.addEventListener('change', handleAvatarFileSelected);
  elements.btnRemovePhoto?.addEventListener('click', handleAvatarRemove);

  // Two-way interactive live typing on ID Card
  elements.profileInputName?.addEventListener('input', (e) => {
    const val = e.target.value.trim() || 'User';
    if (elements.cardProfileName) elements.cardProfileName.textContent = val;
    if (elements.topbarStudentName) elements.topbarStudentName.textContent = val;
    if (elements.sidebarStudentName) elements.sidebarStudentName.textContent = val;
    const greetingEl = document.getElementById('studentGreetingName');
    if (greetingEl) greetingEl.textContent = val;
    renderAvatarImage(localStorage.getItem(`cca_student_avatar_${getActiveStudentId()}`) || localStorage.getItem('cca_student_avatar'), val);
  });

  elements.profileInputId?.addEventListener('input', (e) => {
    const val = e.target.value.trim() || '23-0000';
    if (elements.cardProfileId) elements.cardProfileId.textContent = `STUDENT ID: ${val}`;
    if (elements.cardBarcodeNum) elements.cardBarcodeNum.textContent = `${val}-CCA-2026`;
    if (elements.sidebarStudentId) elements.sidebarStudentId.textContent = `ID: ${val}`;
  });

  elements.profileInputCourse?.addEventListener('change', (e) => {
    if (elements.cardProfileCourse) elements.cardProfileCourse.textContent = e.target.value;
  });

  elements.profileInputYear?.addEventListener('change', (e) => {
    if (elements.cardProfileYear) elements.cardProfileYear.textContent = e.target.value;
  });

  // Dedicated Parent / Guardian UI live reflection on ID Card
  const updateCardGuardian = () => {
    const pName = elements.profileInputParentName ? elements.profileInputParentName.value.trim() : '';
    const pRel = elements.profileInputParentRelation ? elements.profileInputParentRelation.value : 'Guardian';
    const pPhone = elements.profileInputParentPhone ? elements.profileInputParentPhone.value.trim() : '';
    if (elements.cardParentDetails) {
      elements.cardParentDetails.textContent = pName ? `${pRel}: ${pName}` : 'Parent / Guardian: Not Specified';
    }
    if (elements.cardParentPhone) {
      elements.cardParentPhone.textContent = pPhone ? `Contact: ${pPhone}` : 'Contact: Not Provided';
    }
  };
  elements.profileInputParentName?.addEventListener('input', updateCardGuardian);
  elements.profileInputParentRelation?.addEventListener('change', updateCardGuardian);
  elements.profileInputParentPhone?.addEventListener('input', updateCardGuardian);

  // Quick Action Navigation Buttons
  elements.btnProfileQuickSubmit?.addEventListener('click', () => switchStudentSubtab('submit'));
  elements.btnProfileQuickTracking?.addEventListener('click', () => switchStudentSubtab('history'));
  elements.btnTopbarProfileShortcut?.addEventListener('click', () => switchStudentSubtab('profile'));

  // Save Active Student Profile
  elements.btnSaveStudentProfile?.addEventListener('click', handleSaveProfileManual);
}

function loadStudentAvatar(studentId, fullName) {
  const avatarKey = `cca_student_avatar_${studentId || getActiveStudentId()}`;
  const dataUrl = localStorage.getItem(avatarKey) || localStorage.getItem('cca_student_avatar');
  renderAvatarImage(dataUrl, fullName);
}

function renderAvatarImage(dataUrl, fullName) {
  const effectiveName = fullName || elements.profileInputName?.value || (state.currentUser && state.currentUser.fullName) || 'User';
  const initials = effectiveName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  if (dataUrl) {
    if (elements.idCardPhotoImg) {
      elements.idCardPhotoImg.src = dataUrl;
      elements.idCardPhotoImg.classList.remove('hidden');
    }
    if (elements.idPhotoPlaceholder) {
      elements.idPhotoPlaceholder.classList.add('hidden');
    }
    if (elements.btnRemovePhoto) {
      elements.btnRemovePhoto.classList.remove('hidden');
    }
    if (elements.sidebarStudentAvatar) {
      elements.sidebarStudentAvatar.style.backgroundImage = `url("${dataUrl}")`;
      elements.sidebarStudentAvatar.textContent = '';
    }
    if (elements.topbarStudentAvatar) {
      elements.topbarStudentAvatar.style.backgroundImage = `url("${dataUrl}")`;
      elements.topbarStudentAvatar.textContent = '';
    }
  } else {
    if (elements.idCardPhotoImg) {
      elements.idCardPhotoImg.src = '';
      elements.idCardPhotoImg.classList.add('hidden');
    }
    if (elements.idPhotoPlaceholder) {
      elements.idPhotoPlaceholder.classList.remove('hidden');
    }
    if (elements.btnRemovePhoto) {
      elements.btnRemovePhoto.classList.add('hidden');
    }
    if (elements.sidebarStudentAvatar) {
      elements.sidebarStudentAvatar.style.backgroundImage = 'none';
      elements.sidebarStudentAvatar.textContent = initials;
    }
    if (elements.topbarStudentAvatar) {
      elements.topbarStudentAvatar.style.backgroundImage = 'none';
      elements.topbarStudentAvatar.textContent = initials;
    }
  }
}

function handleAvatarFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (PNG, JPG, WEBP).', 'error');
    return;
  }

  if (file.size > 3 * 1024 * 1024) {
    showToast('Image size exceeds 3MB. Please choose a smaller picture.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const studentId = getActiveStudentId();
    try {
      localStorage.setItem(`cca_student_avatar_${studentId}`, dataUrl);
      localStorage.setItem('cca_student_avatar', dataUrl);
    } catch (err) {
      console.warn('Could not persist avatar to localStorage:', err);
    }
    renderAvatarImage(dataUrl);
    showToast('Profile photo updated successfully!', 'success');
  };
  reader.readAsDataURL(file);
}

function handleAvatarRemove() {
  const studentId = getActiveStudentId();
  localStorage.removeItem(`cca_student_avatar_${studentId}`);
  localStorage.removeItem('cca_student_avatar');
  if (elements.inputStudentAvatar) elements.inputStudentAvatar.value = '';
  renderAvatarImage(null);
  showToast('Profile photo removed.', 'info');
}

function syncStudentProfileFromAuth() {
  const user = state.currentUser || {
    fullName: 'User',
    studentId: '23-0000',
    course: 'BS Information Technology',
    email: 'user@cca.edu.ph'
  };

  const storedProfileKey = `cca_student_profile_${user.studentId || 'default'}`;
  let storedProfile = {};
  try {
    const raw = localStorage.getItem(storedProfileKey) || localStorage.getItem('cca_student_profile');
    if (raw) storedProfile = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read stored profile:', e);
  }

  const effectiveProfile = {
    fullName: storedProfile.fullName || user.fullName || 'User',
    studentId: storedProfile.studentId || user.studentId || '23-0000',
    course: storedProfile.course || user.course || 'BS Information Technology',
    yearLevel: storedProfile.yearLevel || '4th Year',
    email: storedProfile.email || user.email || 'user@cca.edu.ph',
    phone: storedProfile.phone || '',
    parentName: storedProfile.parentName || '',
    parentRelation: storedProfile.parentRelation || 'Mother',
    parentPhone: storedProfile.parentPhone || '',
    parentEmail: storedProfile.parentEmail || '',
    parentAddress: storedProfile.parentAddress || ''
  };

  // Topbar and sidebar updates
  if (elements.sidebarStudentName) elements.sidebarStudentName.textContent = effectiveProfile.fullName;
  if (elements.sidebarStudentId) elements.sidebarStudentId.textContent = `ID: ${effectiveProfile.studentId}`;
  if (elements.topbarStudentName) elements.topbarStudentName.textContent = effectiveProfile.fullName;
  const greetingEl = document.getElementById('studentGreetingName');
  if (greetingEl) greetingEl.textContent = effectiveProfile.fullName;

  // Digital ID Card live updates
  if (elements.cardProfileName) elements.cardProfileName.textContent = effectiveProfile.fullName;
  if (elements.cardProfileId) elements.cardProfileId.textContent = `STUDENT ID: ${effectiveProfile.studentId}`;
  if (elements.cardProfileCourse) elements.cardProfileCourse.textContent = effectiveProfile.course;
  if (elements.cardProfileYear) elements.cardProfileYear.textContent = effectiveProfile.yearLevel;
  if (elements.cardBarcodeNum) elements.cardBarcodeNum.textContent = `${effectiveProfile.studentId}-CCA-2026`;

  // Guardian Emergency Contact on Card
  if (elements.cardParentDetails) {
    elements.cardParentDetails.textContent = effectiveProfile.parentName
      ? `${effectiveProfile.parentRelation}: ${effectiveProfile.parentName}`
      : 'Parent / Guardian: Not Specified';
  }
  if (elements.cardParentPhone) {
    elements.cardParentPhone.textContent = effectiveProfile.parentPhone
      ? `Contact: ${effectiveProfile.parentPhone}`
      : 'Contact: Not Provided';
  }

  // Form input field values
  if (elements.profileInputName) elements.profileInputName.value = effectiveProfile.fullName;
  if (elements.profileInputId) elements.profileInputId.value = effectiveProfile.studentId;
  if (elements.profileInputCourse) elements.profileInputCourse.value = effectiveProfile.course;
  if (elements.profileInputYear) elements.profileInputYear.value = effectiveProfile.yearLevel;
  if (elements.profileInputEmail) elements.profileInputEmail.value = effectiveProfile.email;
  if (elements.profileInputPhone) elements.profileInputPhone.value = effectiveProfile.phone;
  if (elements.profileInputParentName) elements.profileInputParentName.value = effectiveProfile.parentName;
  if (elements.profileInputParentRelation) elements.profileInputParentRelation.value = effectiveProfile.parentRelation;
  if (elements.profileInputParentPhone) elements.profileInputParentPhone.value = effectiveProfile.parentPhone;
  if (elements.profileInputParentEmail) elements.profileInputParentEmail.value = effectiveProfile.parentEmail;
  if (elements.profileInputParentAddress) elements.profileInputParentAddress.value = effectiveProfile.parentAddress;

  // Load avatar photo
  loadStudentAvatar(effectiveProfile.studentId, effectiveProfile.fullName);

  populateFormWithProfile(effectiveProfile);
}

function populateFormWithProfile(profile) {
  const user = profile || state.currentUser || {
    fullName: elements.profileInputName?.value || 'User',
    studentId: elements.profileInputId?.value || '23-0000',
    course: elements.profileInputCourse?.value || 'BS Information Technology',
    email: 'user@cca.edu.ph'
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
  const name = elements.profileInputName ? elements.profileInputName.value.trim() : 'User';
  const id = elements.profileInputId ? elements.profileInputId.value.trim() : '23-0000';
  const course = elements.profileInputCourse ? elements.profileInputCourse.value : 'BS Information Technology';
  const yearLevel = elements.profileInputYear ? elements.profileInputYear.value : '4th Year';
  const email = elements.profileInputEmail ? elements.profileInputEmail.value.trim() : '';
  const phone = elements.profileInputPhone ? elements.profileInputPhone.value.trim() : '';
  const parentName = elements.profileInputParentName ? elements.profileInputParentName.value.trim() : '';
  const parentRelation = elements.profileInputParentRelation ? elements.profileInputParentRelation.value : 'Mother';
  const parentPhone = elements.profileInputParentPhone ? elements.profileInputParentPhone.value.trim() : '';
  const parentEmail = elements.profileInputParentEmail ? elements.profileInputParentEmail.value.trim() : '';
  const parentAddress = elements.profileInputParentAddress ? elements.profileInputParentAddress.value.trim() : '';

  if (!name || !id) {
    showToast('Name and Student ID are required.', 'error');
    if (elements.profileSaveStatus) {
      elements.profileSaveStatus.textContent = '⚠ Name and Student ID are required.';
      elements.profileSaveStatus.classList.add('error');
    }
    return;
  }

  const profileData = {
    fullName: name,
    studentId: id,
    course,
    yearLevel,
    email,
    phone,
    parentName,
    parentRelation,
    parentPhone,
    parentEmail,
    parentAddress
  };

  if (state.currentUser) {
    state.currentUser.fullName = name;
    state.currentUser.studentId = id;
    state.currentUser.course = course;
    if (email) state.currentUser.email = email;
    localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));
  }

  localStorage.setItem(`cca_student_profile_${id}`, JSON.stringify(profileData));
  localStorage.setItem('cca_student_profile', JSON.stringify(profileData));

  syncStudentProfileFromAuth();
  filterStudentRequests();

  if (elements.profileSaveStatus) {
    elements.profileSaveStatus.classList.remove('error');
    elements.profileSaveStatus.textContent = '✓ Profile & Guardian records saved!';
    setTimeout(() => {
      if (elements.profileSaveStatus) elements.profileSaveStatus.textContent = '';
    }, 4000);
  }

  showToast('Student credentials and guardian records updated!', 'success');
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
  const errorHtml = `<tr><td colspan="9" class="table-empty" style="color:#DC2626;">${escapeHtml(msg)}</td></tr>`;
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


// ==========================================================================
// STUDENT PORTAL REFERENCE IMPLEMENTATION (V2 - FULL INTERACTIVITY & CROPPING)
// ==========================================================================

// Global cropper state
const cropperState = {
  img: null,
  zoom: 1,
  rotation: 0,
  panX: 0,
  panY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0
};

function initStudentRefPortal() {
  restoreDarkModeState();
  syncStudentRefProfile();
  renderStudentDashboardData();
  renderStudentTrackingCards();
  renderStudentHistoryTable();
}

function restoreDarkModeState() {
  const isDark = localStorage.getItem('cca_dark_mode') === 'true';
  const toggle = document.getElementById('toggleDarkMode');
  if (toggle) toggle.checked = isDark;

  const portal = document.getElementById('viewStudentPortal');
  if (portal) portal.classList.toggle('student-dark-mode', isDark);
  document.body.classList.toggle('student-dark-mode', isDark);
}

function triggerStudentViewLoader() {
  const loader = document.getElementById('studentViewLoader');
  if (loader) {
    loader.classList.add('loading');
    setTimeout(() => {
      loader.classList.remove('loading');
    }, 350);
  }
}

function syncStudentRefProfile() {
  const user = state.currentUser || {
    fullName: 'Juan Dela Cruz',
    studentId: 'REQ-00234',
    course: 'BS Information Technology (BSIT)',
    email: 'juan.delacruz@cca.edu.ph'
  };

  const storedKey = 'cca_student_profile_' + (user.studentId || 'default');
  let stored = {};
  try {
    const raw = localStorage.getItem(storedKey) || localStorage.getItem('cca_student_profile');
    if (raw) stored = JSON.parse(raw);
  } catch (e) {
    console.warn('Profile parse error:', e);
  }

  const profile = {
    fullName: stored.fullName || user.fullName || 'Juan Dela Cruz',
    studentId: stored.studentId || user.studentId || 'REQ-00234',
    course: stored.course || user.course || 'BS Information Technology (BSIT)',
    email: stored.email || user.email || 'juan.delacruz@cca.edu.ph'
  };

  // Topbar
  const topbarName = document.getElementById('dropdownUserName');
  if (topbarName) topbarName.textContent = profile.fullName;
  const topbarEmail = document.getElementById('dropdownUserEmail');
  if (topbarEmail) topbarEmail.textContent = profile.email;

  // Initials for topbar avatar
  const initials = profile.fullName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'JD';
  const topbarAv = document.getElementById('topbarUserAvatar');
  if (topbarAv) topbarAv.textContent = initials;

  // Sidebar
  const sbName = document.getElementById('studentSidebarName');
  if (sbName) sbName.textContent = profile.fullName;
  const sbMeta = document.getElementById('studentSidebarMeta');
  if (sbMeta) sbMeta.textContent = profile.course;

  // Dashboard Hero
  const heroName = document.getElementById('heroStudentName');
  if (heroName) heroName.textContent = profile.fullName + '!';

  // My Profile Overview Card
  const profName = document.getElementById('profileNameDisplay');
  if (profName) profName.textContent = profile.fullName;
  const profId = document.getElementById('profileIdDisplay');
  if (profId) profId.textContent = profile.studentId;
  const profProg = document.getElementById('profileProgramDisplay');
  if (profProg) profProg.textContent = profile.course;
  const profEmail = document.getElementById('profileEmailDisplay');
  if (profEmail) profEmail.textContent = profile.email;

  // Registered Student Information Card (Matches Register Fields)
  const pName = document.getElementById('personalFullName');
  if (pName) pName.textContent = profile.fullName;
  const pId = document.getElementById('personalStudentId');
  if (pId) pId.textContent = profile.studentId;
  const pEmail = document.getElementById('personalEmail');
  if (pEmail) pEmail.textContent = profile.email;
  const pProg = document.getElementById('personalProgram');
  if (pProg) pProg.textContent = profile.course;

  // Settings inputs
  const setFull = document.getElementById('settingsInputFullName');
  if (setFull) setFull.value = profile.fullName;
  const setEmail = document.getElementById('settingsInputEmail');
  if (setEmail) setEmail.value = profile.email;
  const setProg = document.getElementById('settingsInputProgram');
  if (setProg) setProg.value = profile.course;

  // Load avatar if stored
  const savedAvatar = localStorage.getItem('cca_student_avatar_' + profile.studentId) || localStorage.getItem('cca_student_avatar');
  if (savedAvatar) {
    applyAvatarToElements(savedAvatar);
  }
}

function applyAvatarToElements(dataUrl) {
  const ids = ['sidebarProfileAvatar', 'profileMainAvatar', 'settingsAvatarPreview', 'topbarUserAvatar'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.backgroundImage = 'url(' + dataUrl + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      if (id === 'topbarUserAvatar') el.textContent = '';
      const svg = el.querySelector('svg');
      if (svg) svg.style.display = 'none';
    }
  });
}

function renderStudentDashboardData() {
  const all = state.allRequests || [];
  const total = all.length || 3;
  const inProcess = all.filter(r => (r.status || '').toUpperCase().includes('PROCESS')).length || 1;
  const completed = all.filter(r => ['APPROVED', 'RELEASED', 'COMPLETED', 'FOR_RELEASE'].includes((r.status || '').toUpperCase())).length || 2;

  const statTotal = document.getElementById('overviewStatTotal');
  if (statTotal) statTotal.textContent = total;
  const statProc = document.getElementById('overviewStatInProcess');
  if (statProc) statProc.textContent = inProcess;
  const statComp = document.getElementById('overviewStatCompleted');
  if (statComp) statComp.textContent = completed;

  // Recent requests list in Dashboard
  const listEl = document.getElementById('dashboardRecentRequestsList');
  if (!listEl) return;

  if (all.length > 0) {
    const recent = all.slice(0, 3);
    listEl.innerHTML = recent.map(req => {
      const status = (req.status || 'PENDING').toUpperCase();
      let badgeClass = 'gray';
      let statusLabel = 'Pending';
      if (status.includes('APPROV')) { badgeClass = 'green'; statusLabel = 'Approved'; }
      else if (status.includes('PROCESS')) { badgeClass = 'blue'; statusLabel = 'Processing'; }
      else if (status.includes('RELEASE')) { badgeClass = 'purple'; statusLabel = 'Released'; }

      const dateStr = formatDate(req.date_submitted || req.created_at || new Date().toISOString());

      return `
        <div class="recent-req-row">
          <div class="req-icon-box bg-blue-tint">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="req-main-info">
            <div class="req-type-title">${escapeHtml(req.document_type || 'Official Document')}</div>
            <div class="req-id-tag">${escapeHtml(req.tracking_number || 'REQ-' + req.id)} &bull; <span class="badge-status-pill ${badgeClass}">${statusLabel}</span></div>
          </div>
          <div class="req-date-text">${dateStr}</div>
        </div>
      `;
    }).join('');
  }
}

function renderStudentTrackingCards() {
  const all = state.allRequests || [];
  const container = document.getElementById('trackCardsList');
  if (!container) return;

  // Default fallback mock requests if no db requests
  const sampleCards = [
    { id: 'REQ-00234', doc: 'TOR', date: 'May 20, 2025 10:24 AM', purpose: 'Enrollment Requirement', remarks: 'For enrollment', status: 'APPROVED', statusText: 'Approved', statusDate: 'May 20, 2025 02:15 PM', badge: 'green', claimDate: 'May 22, 2025 (Registrar Window 2)' },
    { id: 'REQ-00233', doc: 'Certificate of Enrollment', date: 'May 18, 2025 02:15 PM', purpose: 'Scholarship Application', remarks: 'N/A', status: 'PROCESSING', statusText: 'Processing', statusDate: 'May 18, 2025 04:30 PM', badge: 'blue' },
    { id: 'REQ-00232', doc: 'Good Moral Certificate', date: 'May 15, 2025 11:30 AM', purpose: 'Employment', remarks: 'N/A', status: 'FOR_RELEASE', statusText: 'For Release', statusDate: 'May 15, 2025 03:45 PM', badge: 'purple', claimDate: 'May 16, 2025 (Registrar Window 2)' },
    { id: 'REQ-00231', doc: 'Report Card', date: 'May 12, 2025 09:20 AM', purpose: 'Transferring', remarks: 'N/A', status: 'PENDING', statusText: 'Pending', statusDate: 'May 12, 2025 09:20 AM', badge: 'gray' },
    { id: 'REQ-00230', doc: 'Others', date: 'May 10, 2025 01:45 PM', purpose: 'Visa Application', remarks: 'N/A', status: 'APPROVED', statusText: 'Approved', statusDate: 'May 10, 2025 04:10 PM', badge: 'green', claimDate: 'May 12, 2025 (Registrar Window 2)' }
  ];

  let itemsToRender = sampleCards;
  if (all.length > 0) {
    itemsToRender = all.map(req => {
      const statusRaw = (req.status || 'PENDING').toUpperCase();
      let statusAttr = 'PENDING';
      let badgeClass = 'gray';
      let statusText = 'Pending';
      let claim = null;

      if (statusRaw.includes('APPROV')) {
        statusAttr = 'APPROVED';
        badgeClass = 'green';
        statusText = 'Approved';
        claim = 'May 22, 2025 (Registrar Window 2)';
      } else if (statusRaw.includes('PROCESS')) {
        statusAttr = 'PROCESSING';
        badgeClass = 'blue';
        statusText = 'Processing';
      } else if (statusRaw.includes('RELEASE')) {
        statusAttr = 'FOR_RELEASE';
        badgeClass = 'purple';
        statusText = 'For Release';
        claim = 'Ready for Release (Registrar Window 2)';
      }

      const reqId = req.tracking_number || ('REQ-00' + (230 + (req.id || 1)));
      const dateStr = formatDate(req.date_submitted || req.created_at || new Date().toISOString());

      return {
        id: reqId,
        doc: req.document_type || 'Official Document',
        date: dateStr + ' 10:24 AM',
        purpose: req.purpose || 'Official Document Requirement',
        remarks: req.remarks || 'N/A',
        status: statusAttr,
        statusText: statusText,
        statusDate: dateStr + ' 02:00 PM',
        badge: badgeClass,
        claimDate: claim
      };
    });
  }

  // Update Stats counts
  const total = itemsToRender.length;
  const proc = itemsToRender.filter(r => r.status === 'PROCESSING').length;
  const apprv = itemsToRender.filter(r => r.status === 'APPROVED').length;
  const forRel = itemsToRender.filter(r => r.status === 'FOR_RELEASE').length;
  const pend = itemsToRender.filter(r => r.status === 'PENDING').length;

  const elTot = document.getElementById('trackStatTotal'); if (elTot) elTot.textContent = total;
  const elProc = document.getElementById('trackStatProcessing'); if (elProc) elProc.textContent = proc;
  const elApp = document.getElementById('trackStatApproved'); if (elApp) elApp.textContent = apprv;
  const elRel = document.getElementById('trackStatForRelease'); if (elRel) elRel.textContent = forRel;
  const elPend = document.getElementById('trackStatPending'); if (elPend) elPend.textContent = pend;

  container.innerHTML = itemsToRender.map(card => `
    <div class="ref-track-card" data-status="${card.status}" data-req="${escapeHtml(card.id)}">
      <div class="track-card-icon-box bg-blue-tint">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div class="track-col-req-info">
        <div class="track-req-id">${escapeHtml(card.id)}</div>
        <div class="track-doc-type">${escapeHtml(card.doc)}</div>
        <div class="track-req-date">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Requested: ${escapeHtml(card.date)}
        </div>
        ${card.claimDate ? `<div class="track-receive-date"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Pickup: <strong>${escapeHtml(card.claimDate)}</strong></div>` : ''}
      </div>
      <div class="track-col-purpose">
        <div class="meta-sub-lbl">Purpose:</div>
        <div class="meta-sub-val">${escapeHtml(card.purpose)}</div>
        <div class="meta-sub-lbl">Remarks:</div>
        <div class="meta-sub-val">${escapeHtml(card.remarks)}</div>
      </div>
      <div class="track-col-status">
        <span class="badge-status-pill ${card.badge}">&bull; ${card.statusText}</span>
        <div class="status-date-time">${escapeHtml(card.statusDate)}</div>
      </div>
      <div class="track-col-action">
        <button class="btn-ref-outline-rounded" data-view-details="${escapeHtml(card.id)}">View Details &rarr;</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-view-details]').forEach(btn => {
    btn.addEventListener('click', () => {
      openRequestDetailsModal(btn.getAttribute('data-view-details'));
    });
  });
}

function renderStudentHistoryTable() {
  const all = state.allRequests || [];
  const tbody = document.getElementById('studentHistoryTableBody');
  if (!tbody) return;

  const defaultRows = [
    { id: 'REQ-00234', doc: 'TOR', date: 'May 20, 2025 10:24 AM', status: 'APPROVED', statusText: 'Approved', badge: 'green', claim: 'May 22, 2025 (Window 2)' },
    { id: 'REQ-00233', doc: 'Certificate of Enrollment', date: 'May 18, 2025 02:15 PM', status: 'PROCESSING', statusText: 'Processing', badge: 'blue', claim: null },
    { id: 'REQ-00232', doc: 'Good Moral Certificate', date: 'May 15, 2025 11:30 AM', status: 'FOR_RELEASE', statusText: 'For Release', badge: 'purple', claim: 'May 16, 2025 (Window 2)' },
    { id: 'REQ-00231', doc: 'Report Card', date: 'May 12, 2025 09:20 AM', status: 'PENDING', statusText: 'Pending', badge: 'gray', claim: null }
  ];

  let rowsToRender = defaultRows;
  if (all.length > 0) {
    rowsToRender = all.map(req => {
      const statusRaw = (req.status || 'PENDING').toUpperCase();
      let badgeClass = 'gray';
      let statusText = 'Pending';
      let statusKey = 'PENDING';
      let claim = null;

      if (statusRaw.includes('APPROV')) {
        badgeClass = 'green';
        statusText = 'Approved';
        statusKey = 'APPROVED';
        claim = 'May 22, 2025 (Window 2)';
      } else if (statusRaw.includes('PROCESS')) {
        badgeClass = 'blue';
        statusText = 'Processing';
        statusKey = 'PROCESSING';
      } else if (statusRaw.includes('RELEASE')) {
        badgeClass = 'purple';
        statusText = 'For Release';
        statusKey = 'FOR_RELEASE';
        claim = 'May 16, 2025 (Window 2)';
      }

      const reqId = req.tracking_number || ('REQ-00' + (230 + (req.id || 1)));
      const dateStr = formatDate(req.date_submitted || req.created_at || new Date().toISOString());

      return {
        id: reqId,
        doc: req.document_type || 'Official Document',
        date: dateStr + ' 10:24 AM',
        status: statusKey,
        statusText: statusText,
        badge: badgeClass,
        claim: claim
      };
    });
  }

  tbody.innerHTML = rowsToRender.map(row => `
    <tr data-history-status="${row.status}">
      <td><strong>${escapeHtml(row.id)}</strong></td>
      <td>${escapeHtml(row.doc)}</td>
      <td>${escapeHtml(row.date)}</td>
      <td><span class="badge-status-pill ${row.badge}">&bull; ${row.statusText}</span></td>
      <td>${row.claim ? `<span class="badge-status-pill green">${escapeHtml(row.claim)}</span>` : '<span class="text-muted">--</span>'}</td>
      <td><button class="btn-ref-link" data-req-id="${escapeHtml(row.id)}">View Details &rarr;</button></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-req-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      openRequestDetailsModal(btn.getAttribute('data-req-id'));
    });
  });
}

function openRequestDetailsModal(reqId) {
  const modal = document.getElementById('modalRequestDetails');
  if (!modal) return;

  const all = state.allRequests || [];
  const req = all.find(r => (r.tracking_number === reqId || ('REQ-00' + (230 + (r.id || 1))) === reqId)) || {
    tracking_number: reqId || 'REQ-00234',
    document_type: 'Transcript of Records (TOR)',
    purpose: 'Enrollment Requirement',
    date_submitted: 'May 20, 2025',
    remarks: 'For enrollment',
    status: 'Approved'
  };

  const statusRaw = (req.status || 'PENDING').toUpperCase();
  let badgeClass = 'green';
  let statusText = 'Approved';
  let isComplete = false;

  if (statusRaw.includes('APPROV')) {
    badgeClass = 'green';
    statusText = 'Approved';
    isComplete = true;
  } else if (statusRaw.includes('RELEASE')) {
    badgeClass = 'purple';
    statusText = 'For Release';
    isComplete = true;
  } else if (statusRaw.includes('PROCESS')) {
    badgeClass = 'blue';
    statusText = 'Processing';
  } else if (statusRaw.includes('PENDING')) {
    badgeClass = 'gray';
    statusText = 'Pending';
  }

  document.getElementById('detailsModalReqId').textContent = req.tracking_number || reqId;
  const badgeEl = document.getElementById('detailsModalBadge');
  badgeEl.className = 'badge-status-pill ' + badgeClass;
  badgeEl.innerHTML = '&bull; ' + statusText;

  document.getElementById('detailsModalDocType').textContent = req.document_type || 'Transcript of Records (TOR)';
  document.getElementById('detailsModalPurpose').textContent = req.purpose || 'Official Document Requirement';
  document.getElementById('detailsModalDate').textContent = formatDate(req.date_submitted || new Date().toISOString()) + ' 10:24 AM';
  document.getElementById('detailsModalRemarks').textContent = req.remarks || 'None specified';

  // When to receive / Pickup Schedule: ONLY show once approved / completed as requested
  const claimRow = document.getElementById('detailsModalClaimRow');
  if (claimRow) {
    if (isComplete) {
      claimRow.style.display = 'flex';
      document.getElementById('detailsModalClaimDate').textContent = 'May 22, 2025 (Registrar Window 2)';
    } else {
      claimRow.style.display = 'none';
    }
  }

  // Build timeline steps
  const tlEl = document.getElementById('detailsModalTimeline');
  tlEl.innerHTML = `
    <div class="timeline-step completed">
      <div class="step-circle">&#10003;</div>
      <div class="step-desc">
        <strong>1. Request Submitted</strong>
        <div class="text-muted">${formatDate(req.date_submitted || new Date().toISOString())} 10:24 AM &bull; Student submission verified</div>
      </div>
    </div>
    <div class="timeline-step ${statusRaw.includes('PROCESS') || isComplete ? 'completed' : 'current'}">
      <div class="step-circle">${statusRaw.includes('PROCESS') || isComplete ? '&#10003;' : '2'}</div>
      <div class="step-desc">
        <strong>2. Under Review &amp; Processing</strong>
        <div class="text-muted">Office of the Registrar assigned evaluation</div>
      </div>
    </div>
    <div class="timeline-step ${isComplete ? 'completed' : ''}">
      <div class="step-circle">${isComplete ? '&#10003;' : '3'}</div>
      <div class="step-desc">
        <strong>3. Approved for Release</strong>
        <div class="text-muted">Document prepared with official seal and dry stamp</div>
      </div>
    </div>
    <div class="timeline-step ${statusRaw.includes('RELEASE') ? 'completed' : ''}">
      <div class="step-circle">${statusRaw.includes('RELEASE') ? '&#10003;' : '4'}</div>
      <div class="step-desc">
        <strong>4. Document Released / Claimed</strong>
        <div class="text-muted">Claimed at Registrar Counter Window 2</div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

// -------------------------------------------------------------------------
// IMAGE CROPPING FUNCTIONALITY
// -------------------------------------------------------------------------

function openImageCropper(imageSource) {
  const modal = document.getElementById('modalCropPhoto');
  if (!modal) return;

  const canvas = document.getElementById('cropCanvas');
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.onload = () => {
    cropperState.img = img;
    cropperState.zoom = 1;
    cropperState.rotation = 0;
    cropperState.panX = 0;
    cropperState.panY = 0;

    const zoomSlider = document.getElementById('cropZoomRange');
    if (zoomSlider) zoomSlider.value = 1;

    renderCropCanvas();
    modal.style.display = 'flex';
  };
  img.src = imageSource;
}

function renderCropCanvas() {
  const canvas = document.getElementById('cropCanvas');
  if (!canvas || !cropperState.img) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.save();

  // Move origin to center of canvas
  ctx.translate(w / 2 + cropperState.panX, h / 2 + cropperState.panY);
  ctx.rotate((cropperState.rotation * Math.PI) / 180);
  ctx.scale(cropperState.zoom, cropperState.zoom);

  // Draw image centered
  const imgW = cropperState.img.width;
  const imgH = cropperState.img.height;
  const scale = Math.max(w / imgW, h / imgH);
  const dw = imgW * scale;
  const dh = imgH * scale;

  ctx.drawImage(cropperState.img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  renderCropPreview();
}

function renderCropPreview() {
  const previewCanvas = document.getElementById('cropCircularPreview');
  const sourceCanvas = document.getElementById('cropCanvas');
  if (!previewCanvas || !sourceCanvas) return;

  const pCtx = previewCanvas.getContext('2d');
  pCtx.clearRect(0, 0, 72, 72);

  pCtx.save();
  pCtx.beginPath();
  pCtx.arc(36, 36, 36, 0, Math.PI * 2);
  pCtx.clip();

  // Sample the 240px circle from the center of sourceCanvas (w:340, h:340 -> center box [50, 50, 240, 240])
  pCtx.drawImage(sourceCanvas, 50, 50, 240, 240, 0, 0, 72, 72);
  pCtx.restore();
}

function getCroppedDataUrl() {
  const sourceCanvas = document.getElementById('cropCanvas');
  if (!sourceCanvas) return null;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 256;
  exportCanvas.height = 256;
  const eCtx = exportCanvas.getContext('2d');

  eCtx.save();
  eCtx.beginPath();
  eCtx.arc(128, 128, 128, 0, Math.PI * 2);
  eCtx.clip();
  eCtx.drawImage(sourceCanvas, 50, 50, 240, 240, 0, 0, 256, 256);
  eCtx.restore();

  return exportCanvas.toDataURL('image/jpeg', 0.92);
}

function setupImageCropperListeners() {
  const container = document.getElementById('cropperContainer');
  const zoomSlider = document.getElementById('cropZoomRange');
  const rotateBtn = document.getElementById('btnRotateCropImg');
  const cancelBtn = document.getElementById('btnCancelCropPhoto');
  const closeBtn = document.getElementById('btnCloseCropPhoto');
  const applyBtn = document.getElementById('btnApplyCropPhoto');
  const modal = document.getElementById('modalCropPhoto');

  // Mouse Drag / Touch Drag
  if (container) {
    container.addEventListener('mousedown', (e) => {
      cropperState.isDragging = true;
      cropperState.dragStartX = e.clientX - cropperState.panX;
      cropperState.dragStartY = e.clientY - cropperState.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!cropperState.isDragging) return;
      cropperState.panX = e.clientX - cropperState.dragStartX;
      cropperState.panY = e.clientY - cropperState.dragStartY;
      renderCropCanvas();
    });

    window.addEventListener('mouseup', () => {
      cropperState.isDragging = false;
    });

    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      cropperState.zoom = Math.max(0.5, Math.min(3, cropperState.zoom + delta));
      if (zoomSlider) zoomSlider.value = cropperState.zoom;
      renderCropCanvas();
    }, { passive: false });
  }

  // Zoom range slider
  zoomSlider?.addEventListener('input', (e) => {
    cropperState.zoom = parseFloat(e.target.value);
    renderCropCanvas();
  });

  // Rotate 90 degrees
  rotateBtn?.addEventListener('click', () => {
    cropperState.rotation = (cropperState.rotation + 90) % 360;
    renderCropCanvas();
  });

  // Close / Cancel
  cancelBtn?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });
  closeBtn?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });

  // Apply & Save
  applyBtn?.addEventListener('click', () => {
    const croppedUrl = getCroppedDataUrl();
    if (!croppedUrl) return;

    const user = state.currentUser || {};
    const id = user.studentId || 'REQ-00234';

    localStorage.setItem('cca_student_avatar_' + id, croppedUrl);
    localStorage.setItem('cca_student_avatar', croppedUrl);

    applyAvatarToElements(croppedUrl);
    triggerStudentViewLoader();

    if (modal) modal.style.display = 'none';
    showToast('Profile photo cropped and saved successfully!', 'success');
  });
}

// -------------------------------------------------------------------------
// EVENT LISTENERS SETUP
// -------------------------------------------------------------------------

function setupStudentRefPortalListeners() {
  setupImageCropperListeners();

  // 1. Sidebar Nav & Tab Switching
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-student-tab]');
    if (tabBtn) {
      const tabName = tabBtn.getAttribute('data-student-tab');
      if (tabName) {
        triggerStudentViewLoader();
        switchStudentSubtab(tabName);
        const drop = document.getElementById('studentUserDropdown');
        if (drop) drop.classList.remove('show');
      }
    }
  });

  // 2. Notification Bell: Clicking toggles dropdown AND disappears the notification count badge!
  const bellBtn = document.getElementById('btnStudentTopbarBell');
  const notifDropdown = document.getElementById('topbarNotifDropdown');
  const bellBadge = document.getElementById('topbarBellBadge');

  if (bellBtn && notifDropdown) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Hide badge count as requested
      if (bellBadge) bellBadge.style.display = 'none';
      notifDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!bellBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('show');
      }
    });

    document.getElementById('btnClearNotifs')?.addEventListener('click', () => {
      document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
      showToast('Notifications marked as read.', 'info');
      notifDropdown.classList.remove('show');
    });
  }

  // 3. Topbar User Chip Dropdown Toggle
  const userChip = document.getElementById('topbarUserChip');
  const userDropdown = document.getElementById('studentUserDropdown');
  if (userChip && userDropdown) {
    userChip.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!userChip.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }

  // Topbar Dropdown Logout
  document.getElementById('dropdownBtnLogout')?.addEventListener('click', () => {
    handleLogout();
  });

  // 4. Clickable Document Type Cards (Auto-selects in form & scrolls)
  document.querySelectorAll('.doc-type-box').forEach(box => {
    box.addEventListener('click', () => {
      const targetDoc = box.getAttribute('data-doctype');
      const select = document.getElementById('studentDocTypeSelect');
      if (select && targetDoc) {
        select.value = targetDoc;
      }
      const section = document.getElementById('requestFormCardSection');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
      document.getElementById('studentDocPurposeInput')?.focus();
    });
  });

  // 5. Request Form Submission (With Purpose as Text Input)
  const docForm = document.getElementById('studentRefDocForm');
  if (docForm) {
    docForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const docType = document.getElementById('studentDocTypeSelect')?.value;
      const purpose = document.getElementById('studentDocPurposeInput')?.value.trim();
      const remarks = document.getElementById('studentDocRemarksInput')?.value || '';

      if (!docType) {
        showToast('Please select a document type.', 'error');
        return;
      }
      if (!purpose) {
        showToast('Please enter the purpose of your request.', 'error');
        return;
      }

      const user = state.currentUser || {};
      const payload = {
        studentName: user.fullName || 'Juan Dela Cruz',
        studentId: user.studentId || 'REQ-00234',
        course: user.course || 'BS Information Technology',
        documentType: docType,
        purpose: purpose,
        dateSubmitted: new Date().toISOString().split('T')[0],
        remarks: remarks,
        email: user.email || 'juan.delacruz@cca.edu.ph'
      };

      try {
        triggerStudentViewLoader();
        const res = await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || 'Failed to submit request.');
        }

        showToast('Document request submitted successfully!', 'success');
        docForm.reset();
        await fetchAllRequests();
        initStudentRefPortal();

        setTimeout(() => {
          switchStudentSubtab('tracking');
        }, 800);

      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('btnStudentFormCancel')?.addEventListener('click', () => {
      docForm.reset();
    });
  }

  // 6. Track Filter & Search
  const trackSearch = document.getElementById('trackSearchInput');
  const trackStatus = document.getElementById('trackStatusSelect');

  function filterTrackingCards() {
    const query = (trackSearch?.value || '').toLowerCase().trim();
    const statusVal = trackStatus?.value || 'ALL';

    document.querySelectorAll('.ref-track-card').forEach(card => {
      const cardStatus = card.getAttribute('data-status') || '';
      const text = card.textContent.toLowerCase();

      const matchesStatus = (statusVal === 'ALL' || cardStatus === statusVal);
      const matchesQuery = (!query || text.includes(query));

      card.style.display = (matchesStatus && matchesQuery) ? 'flex' : 'none';
    });
  }

  trackSearch?.addEventListener('input', filterTrackingCards);
  trackStatus?.addEventListener('change', filterTrackingCards);

  // History table filter
  document.getElementById('historyTableFilter')?.addEventListener('change', (e) => {
    const val = e.target.value;
    document.querySelectorAll('#studentHistoryTableBody tr').forEach(row => {
      const rowStatus = row.getAttribute('data-history-status');
      if (val === 'ALL' || rowStatus === val) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });

  // 7. Photo upload triggering the interactive cropper
  function handleFileSelect(fileInput) {
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      openImageCropper(e.target.result);
      fileInput.value = '';
    };
    reader.readAsDataURL(file);
  }

  const fileInputProf = document.getElementById('profilePhotoFileInput');
  document.getElementById('btnChangeProfilePhoto')?.addEventListener('click', () => {
    fileInputProf?.click();
  });
  fileInputProf?.addEventListener('change', () => handleFileSelect(fileInputProf));

  const fileInputSet = document.getElementById('settingsPhotoFileInput');
  document.getElementById('btnSettingsChangePhoto')?.addEventListener('click', () => {
    fileInputSet?.click();
  });
  fileInputSet?.addEventListener('change', () => handleFileSelect(fileInputSet));

  // 8. Details Modal Close
  const detailsModal = document.getElementById('modalRequestDetails');
  document.getElementById('btnCloseRequestDetails')?.addEventListener('click', () => {
    if (detailsModal) detailsModal.style.display = 'none';
  });
  document.getElementById('btnCloseDetailsModalBtn')?.addEventListener('click', () => {
    if (detailsModal) detailsModal.style.display = 'none';
  });
  document.getElementById('backdropRequestDetails')?.addEventListener('click', () => {
    if (detailsModal) detailsModal.style.display = 'none';
  });

  // 9. Edit Registered Profile Modal (Works smoothly with only register fields)
  const editModal = document.getElementById('modalEditPersonalInfo');
  document.getElementById('btnEditPersonalInfo')?.addEventListener('click', () => {
    if (!editModal) return;
    const curName = document.getElementById('personalFullName')?.textContent || '';
    const curEmail = document.getElementById('personalEmail')?.textContent || '';
    const curProg = document.getElementById('personalProgram')?.textContent || '';

    const inName = document.getElementById('modalInputFullName'); if (inName) inName.value = curName;
    const inEmail = document.getElementById('modalInputEmail'); if (inEmail) inEmail.value = curEmail;
    const inProg = document.getElementById('modalInputProgram');
    if (inProg) {
      for (let i = 0; i < inProg.options.length; i++) {
        if (curProg.includes(inProg.options[i].value) || inProg.options[i].text.includes(curProg)) {
          inProg.selectedIndex = i;
          break;
        }
      }
    }

    editModal.style.display = 'flex';
  });

  document.getElementById('btnCloseEditPersonalInfo')?.addEventListener('click', () => {
    if (editModal) editModal.style.display = 'none';
  });
  document.getElementById('btnCancelEditPersonal')?.addEventListener('click', () => {
    if (editModal) editModal.style.display = 'none';
  });
  document.getElementById('backdropEditPersonalInfo')?.addEventListener('click', () => {
    if (editModal) editModal.style.display = 'none';
  });

  document.getElementById('btnSaveEditPersonal')?.addEventListener('click', () => {
    const name = document.getElementById('modalInputFullName')?.value.trim();
    const email = document.getElementById('modalInputEmail')?.value.trim();
    const prog = document.getElementById('modalInputProgram')?.value;

    if (!name || !email) {
      showToast('Name and Email are required.', 'error');
      return;
    }

    triggerStudentViewLoader();

    if (state.currentUser) {
      state.currentUser.fullName = name;
      state.currentUser.email = email;
      state.currentUser.course = prog;
      localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));
    }

    const key = 'cca_student_profile_' + (state.currentUser?.studentId || 'default');
    let profile = {};
    try {
      const raw = localStorage.getItem(key);
      if (raw) profile = JSON.parse(raw);
    } catch (e) {}

    profile.fullName = name;
    profile.email = email;
    profile.course = prog;
    localStorage.setItem(key, JSON.stringify(profile));
    localStorage.setItem('cca_student_profile', JSON.stringify(profile));

    syncStudentRefProfile();
    showToast('Profile information updated successfully!', 'success');
    if (editModal) editModal.style.display = 'none';
  });

  // 10. Account Settings Save
  document.getElementById('btnSettingsSave')?.addEventListener('click', () => {
    const full = document.getElementById('settingsInputFullName')?.value.trim();
    const email = document.getElementById('settingsInputEmail')?.value.trim();
    const prog = document.getElementById('settingsInputProgram')?.value;

    if (!full || !email) {
      showToast('Full name and email are required.', 'error');
      return;
    }

    triggerStudentViewLoader();

    if (state.currentUser) {
      state.currentUser.fullName = full;
      state.currentUser.email = email;
      state.currentUser.course = prog;
      localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));
    }

    const key = 'cca_student_profile_' + (state.currentUser?.studentId || 'default');
    let profile = {};
    try {
      const raw = localStorage.getItem(key);
      if (raw) profile = JSON.parse(raw);
    } catch (e) {}

    profile.fullName = full;
    profile.email = email;
    profile.course = prog;
    localStorage.setItem(key, JSON.stringify(profile));
    localStorage.setItem('cca_student_profile', JSON.stringify(profile));

    syncStudentRefProfile();
    showToast('Account settings saved successfully!', 'success');
  });

  document.getElementById('btnSettingsCancel')?.addEventListener('click', () => {
    syncStudentRefProfile();
    showToast('Settings changes reset.', 'info');
  });

  document.getElementById('btnSettingsToChangePw')?.addEventListener('click', () => {
    switchStudentSubtab('change-password');
  });

  // 11. Dark Mode Toggle
  const darkToggle = document.getElementById('toggleDarkMode');
  darkToggle?.addEventListener('change', () => {
    const isDark = darkToggle.checked;
    triggerStudentViewLoader();
    document.getElementById('viewStudentPortal')?.classList.toggle('student-dark-mode', isDark);
    document.body.classList.toggle('student-dark-mode', isDark);
    localStorage.setItem('cca_dark_mode', isDark ? 'true' : 'false');
    showToast(isDark ? 'Dark mode enabled.' : 'Light mode enabled.', 'info');
  });

  // 12. Change Password Form & Live Strength Meter
  const newPwInput = document.getElementById('inputNewPassword');
  const curPwInput = document.getElementById('inputCurrentPassword');
  const confPwInput = document.getElementById('inputConfirmNewPassword');

  function evalPwStrength(pw) {
    const isLen = pw.length >= 8 && pw.length <= 12;
    const isUp = /[A-Z]/.test(pw);
    const isLow = /[a-z]/.test(pw);
    const isNumSpec = /[0-9]|[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw);

    document.getElementById('reqLen')?.classList.toggle('valid', isLen);
    document.getElementById('reqUpper')?.classList.toggle('valid', isUp);
    document.getElementById('reqLower')?.classList.toggle('valid', isLow);
    document.getElementById('reqNum')?.classList.toggle('valid', isNumSpec);

    const score = (isLen ? 1 : 0) + (isUp ? 1 : 0) + (isLow ? 1 : 0) + (isNumSpec ? 1 : 0);

    const b1 = document.getElementById('strBar1');
    const b2 = document.getElementById('strBar2');
    const b3 = document.getElementById('strBar3');
    const b4 = document.getElementById('strBar4');
    const txt = document.getElementById('pwStrengthText');

    [b1, b2, b3, b4].forEach(b => {
      if (b) b.className = 'str-bar';
    });

    if (!pw) {
      if (txt) { txt.textContent = ''; txt.style.color = '#64748B'; }
      return;
    }

    if (score <= 1) {
      if (b1) b1.classList.add('active-red');
      if (txt) { txt.textContent = 'Weak'; txt.style.color = '#DC2626'; }
    } else if (score === 2) {
      if (b1) b1.classList.add('active-yellow');
      if (b2) b2.classList.add('active-yellow');
      if (txt) { txt.textContent = 'Fair'; txt.style.color = '#EAB308'; }
    } else if (score === 3) {
      if (b1) b1.classList.add('active-green');
      if (b2) b2.classList.add('active-green');
      if (b3) b3.classList.add('active-green');
      if (txt) { txt.textContent = 'Good'; txt.style.color = '#16A34A'; }
    } else {
      [b1, b2, b3, b4].forEach(b => b && b.classList.add('active-green'));
      if (txt) { txt.textContent = 'Strong'; txt.style.color = '#16A34A'; }
    }
  }

  newPwInput?.addEventListener('input', () => {
    evalPwStrength(newPwInput.value);
  });

  // Eye toggle buttons
  document.querySelectorAll('.btn-toggle-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.style.color = '#2563EB';
        } else {
          input.type = 'password';
          btn.style.color = '#94A3B8';
        }
      }
    });
  });

  // Change Password Form submit
  const changePwForm = document.getElementById('refChangePasswordForm');
  if (changePwForm) {
    changePwForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const currentPassword = curPwInput?.value.trim();
      const newPassword = newPwInput?.value.trim();
      const confirmPassword = confPwInput?.value.trim();

      if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill out all password fields.', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match.', 'error');
        return;
      }

      if (newPassword.length < 8 || newPassword.length > 12) {
        showToast('Password must be between 8 and 12 characters.', 'error');
        return;
      }

      if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]|[!@#$%^&*]/.test(newPassword)) {
        showToast('Password must contain upper, lower, and number/special char.', 'error');
        return;
      }

      const user = state.currentUser || {};
      const payload = {
        identifier: user.email || user.studentId,
        currentPassword,
        newPassword
      };

      try {
        triggerStudentViewLoader();
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || 'Failed to update password.');
        }

        showToast('Password updated successfully!', 'success');
        changePwForm.reset();
        evalPwStrength('');

        setTimeout(() => {
          switchStudentSubtab('settings');
        }, 1200);

      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('btnCancelChangePw')?.addEventListener('click', () => {
      switchStudentSubtab('settings');
    });
  }
}
