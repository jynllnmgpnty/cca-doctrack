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
      switchView('admin');
    } else {
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
  const lastUser = state.currentUser;
  state.currentUser = null;
  localStorage.removeItem('cca_auth_user');
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
    switchStudentSubtab(state.studentActiveTab || 'profile');
  } else if (viewName === 'admin') {
    elements.viewAdminPortal.classList.add('active');
    updateAdminDashboard();
    renderAdminTable();
    switchAdminSubtab(state.adminActiveTab || 'dashboard');
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
      title: 'Student Profile & ID',
      subtitle: 'Manage your active student credentials, profile photo, and guardian records'
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
