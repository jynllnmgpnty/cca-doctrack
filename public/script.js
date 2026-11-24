
// ==========================================
// Global Full-Screen App Loader & Alert Controls
// ==========================================
function showAppLoading(title = 'CCA DocTrack', caption = 'Loading...') {
  const loader = document.getElementById('appInitialLoader');
  if (!loader) return;
  const titleEl = loader.querySelector('.loader-title');
  const capEl = loader.querySelector('.loader-caption');
  if (titleEl) titleEl.textContent = title;
  if (capEl) capEl.textContent = caption;
  loader.classList.remove('fade-out');
  loader.style.display = 'flex';
  loader.style.opacity = '1';
  loader.style.visibility = 'visible';
  loader.style.pointerEvents = 'all';
}

function hideAppLoading(delay = 0) {
  const loader = document.getElementById('appInitialLoader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('fade-out');
    setTimeout(() => {
      if (loader.classList.contains('fade-out')) {
        loader.style.display = 'none';
      }
    }, 400);
  }, delay);
}

function promptLogout() {
  const modal = document.getElementById('modalConfirmLogout');
  if (modal) {
    modal.style.display = 'flex';
  } else {
    if (confirm('Are you sure you want to log out of CCA DocTrack?')) {
      performLogoutWithLoading();
    }
  }
}

function performLogoutWithLoading() {
  const modal = document.getElementById('modalConfirmLogout');
  if (modal) modal.style.display = 'none';

  showAppLoading('Logging Out...', 'Ending your session safely...');

  setTimeout(() => {
    executeActualLogout();
    hideAppLoading(300);
  }, 650);
}

function executeActualLogout() {
  const lastUser = state.currentUser;
  state.currentUser = null;
  localStorage.removeItem('cca_auth_user');
  localStorage.setItem('cca_current_view', 'landing');
  localStorage.removeItem('cca_student_active_tab');
  localStorage.removeItem('cca_admin_active_tab');
  updateLandingAuthUI();
  switchView('landing');

  if (elements.loginPassword) elements.loginPassword.value = '';
  if (elements.regPassword) elements.regPassword.value = '';
  if (elements.regConfirmPassword) elements.regConfirmPassword.value = '';

  if (lastUser && lastUser.email && elements.loginEmail) {
    elements.loginEmail.value = lastUser.email;
  }

  showToast('You have been logged out safely.', 'info');
}

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
  setupAdminRefPortalListeners();

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

        // Live refresh of admin profile from Supabase database
        const aIdent = state.currentUser.email || state.currentUser.id || 'admin@cca.edu.ph';
        fetch('/api/auth/profile?identifier=' + encodeURIComponent(aIdent))
          .then(r => r.json())
          .then(res => {
            if (res && res.success && res.user) {
              state.currentUser.fullName = res.user.fullName;
              state.currentUser.email = res.user.email;
              state.currentUser.role = res.user.role || 'admin';
              localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));
              syncAdminProfileInfo();
            }
          })
          .catch(() => {});
      } else {
        const targetView = (savedView === 'landing') ? 'landing' : 'student';
        state.studentActiveTab = savedStudentTab || 'profile';
        switchView(targetView);
        if (targetView === 'student') {
          switchStudentSubtab(state.studentActiveTab);
        }

        // Live refresh of student profile from Supabase database
        const sIdent = state.currentUser.studentId || state.currentUser.email || state.currentUser.id;
        if (sIdent) {
          fetch('/api/auth/profile?identifier=' + encodeURIComponent(sIdent))
            .then(r => r.json())
            .then(res => {
              if (res && res.success && res.user) {
                state.currentUser.fullName = res.user.fullName;
                state.currentUser.email = res.user.email;
                state.currentUser.course = res.user.course;
                if (res.user.studentId) state.currentUser.studentId = res.user.studentId;
                localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));

                const key = 'cca_student_profile_' + (state.currentUser.studentId || 'default');
                const prof = {
                  fullName: state.currentUser.fullName,
                  email: state.currentUser.email,
                  course: state.currentUser.course,
                  studentId: state.currentUser.studentId
                };
                localStorage.setItem(key, JSON.stringify(prof));
                localStorage.setItem('cca_student_profile', JSON.stringify(prof));

                syncStudentProfileFromAuth();
                syncStudentRefProfile();
              }
            })
            .catch(() => {});
        }

        // Verify that restored student account is still active
        fetch('/api/auth/students').then(r => r.json()).then(data => {
          if (data && data.success && Array.isArray(data.data)) {
            const myAcc = data.data.find(s => 
              (state.currentUser && state.currentUser.studentId && s.studentId === state.currentUser.studentId) ||
              (state.currentUser && state.currentUser.email && s.email && s.email.toLowerCase() === state.currentUser.email.toLowerCase())
            );
            if (myAcc && myAcc.status && myAcc.status.toLowerCase() === 'inactive') {
              localStorage.removeItem('cca_auth_user');
              state.currentUser = null;
              updateLandingAuthUI();
              switchView('landing');
              showToast('Your student account has been deactivated. Please submit a reactivation request.', 'error');
            }
          }
        }).catch(() => {});
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
      if (result.isDeactivated) {
        showAuthAlert(
          `${escapeHtml(result.message)} <br><a href="javascript:void(0)" onclick="openReactivationModal('${escapeHtml(result.studentId || email)}', '${escapeHtml(result.email || email)}')" style="color:#2563EB; font-weight:700; text-decoration:underline; display:inline-block; margin-top:6px;">Submit Reactivation Request &rarr;</a>`,
          'error'
        );
        return;
      }
      throw new Error(result.message || 'Authentication failed.');
    }

    // Save user session
    state.currentUser = result.user;
    localStorage.setItem('cca_auth_user', JSON.stringify(result.user));

    // Seed profile caches immediately so new devices don't show stale/default values
    if (result.user.role === 'student') {
      const initStudentProfile = {
        fullName: result.user.fullName,
        email: result.user.email,
        course: result.user.course,
        studentId: result.user.studentId
      };
      if (result.user.studentId) {
        localStorage.setItem('cca_student_profile_' + result.user.studentId, JSON.stringify(initStudentProfile));
      }
      localStorage.setItem('cca_student_profile', JSON.stringify(initStudentProfile));
    }

    // Smooth loading overlay for login
    showAppLoading('Signing In...', 'Authenticating credentials and preparing workspace...');

    setTimeout(() => {
      closeAuthModal();
      updateLandingAuthUI();
      showToast(`Signed in successfully as ${result.user.fullName}!`, 'success');

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

      hideAppLoading(300);
    }, 650);

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

  // Password rules validation: at least 8 characters
  if (password.length < 8 || password.length > 64) {
    showAuthAlert('Password must be at least 8 characters long.', 'error');
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
  promptLogout();
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
    initAdminRefPortal();
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
    if (typeof evalPwStrength === 'function') evalPwStrength('');
    const matchInd = document.getElementById('pwMatchIndicator');
    if (matchInd) matchInd.style.display = 'none';
  }
}

function switchAdminSubtab(tabName) {
  state.adminActiveTab = tabName;
  try {
    localStorage.setItem('cca_admin_active_tab', tabName);
  } catch (e) {}

  triggerAdminViewLoader();

  document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-admin-tab') === tabName);
  });

  document.querySelectorAll('.admin-subtab').forEach((pane) => {
    pane.classList.toggle('active', pane.id === `adminSubtab-${tabName}`);
  });

  if (tabName === 'dashboard') {
    updateAdminDashboard();
  } else if (tabName === 'manage') {
    renderAdminTable();
  } else if (tabName === 'students') {
    renderAdminStudentsTable();
  } else if (tabName === 'announcements') {
    renderAdminAnnouncements();
  } else if (tabName === 'reports') {
    renderAdminReports();
  } else if (tabName === 'audit') {
    renderAdminAuditLogs();
  } else if (tabName === 'system') {
    fetchHealthCheck();
  } else if (tabName === 'settings') {
    syncAdminProfileInfo();
  } else if (tabName === 'change-password') {
    const pwForm = document.getElementById('adminChangePasswordForm');
    if (pwForm) pwForm.reset();
    evalAdminPwStrength('');
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

    const sysDbEl = document.getElementById('adminSysDbStatus');
    if (sysDbEl) {
      sysDbEl.textContent = isConnected ? 'Operational (Online)' : 'Standby / Offline';
    }
  } catch (err) {
    console.warn('Health check error:', err);
    state.isDbConnected = false;
  }
}

async function fetchAllRequests() {
  try {
    let endpoint = '/api/requests';
    const isStudent = state.currentUser && state.currentUser.role !== 'admin';
    if (isStudent) {
      const sId = (state.currentUser.studentId || getActiveStudentId() || '').trim();
      const sEmail = (state.currentUser.email || '').trim();
      const params = new URLSearchParams();
      if (sId) params.append('studentId', sId);
      if (sEmail) params.append('email', sEmail);
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }

    const res = await fetch(endpoint);
    const result = await res.json();

    if (!res.ok) throw new Error(result.message || 'Failed to fetch requests.');

    const fetchedData = result.data || [];
    if (isStudent) {
      state.studentRequests = fetchedData;
      // Isolate student state so other users' requests are never stored in student session
      state.allRequests = fetchedData;
    } else {
      state.allRequests = fetchedData;
    }

    if (elements.adminTotalBadge) {
      elements.adminTotalBadge.textContent = state.allRequests.length;
    }

    if (!isStudent) {
      updateAdminDashboard();
      renderAdminTable();
    }
    filterStudentRequests();
    renderStudentDashboardData();
    renderStudentTrackingCards();
    renderStudentHistoryTable();
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

async function updateRequestStatus(id, newStatus, pickupDate) {
  try {
    const payload = { status: newStatus };
    if (pickupDate !== undefined) {
      payload.pickupDate = pickupDate;
    }
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update status.');

    showToast(`Status updated to "${newStatus}"`, 'success');
    if (typeof addAdminAuditLog === 'function') {
      const pInfo = pickupDate ? ` (Pickup: ${pickupDate})` : '';
      addAdminAuditLog(`Updated request #${id} status to ${newStatus}${pInfo}`, 'STATUS');
    }
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

async function handleSaveProfileManual() {
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
      elements.profileSaveStatus.textContent = 'Name and Student ID are required.';
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

  const oldIdentifier = (state.currentUser && (state.currentUser.email || state.currentUser.studentId)) || email || id;

  try {
    triggerStudentViewLoader();
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: oldIdentifier,
        fullName: name,
        course: course,
        studentId: id,
        email: email
      })
    });

    const result = await res.json();
    if (res.ok && result.user) {
      if (state.currentUser) {
        state.currentUser.fullName = result.user.fullName;
        state.currentUser.course = result.user.course;
        if (result.user.studentId) state.currentUser.studentId = result.user.studentId;
        if (result.user.email) state.currentUser.email = result.user.email;
        localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));
      }
    }
  } catch (err) {
    console.warn('Profile sync to database error:', err);
  }

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
  syncStudentRefProfile();
  filterStudentRequests();
  renderStudentDashboardData();
  renderStudentHistoryTable();

  if (elements.profileSaveStatus) {
    elements.profileSaveStatus.classList.remove('error');
    elements.profileSaveStatus.textContent = 'Profile & name updated in Supabase database!';
    setTimeout(() => {
      if (elements.profileSaveStatus) elements.profileSaveStatus.textContent = '';
    }, 4000);
  }

  showToast('Student credentials & name updated in Supabase database!', 'success');
}

function filterStudentRequests() {
  const user = state.currentUser || {};
  const activeId = (user.studentId || getActiveStudentId() || '').trim().toLowerCase();
  const activeEmail = (user.email || '').trim().toLowerCase();

  if (user.role !== 'admin') {
    state.studentRequests = (state.allRequests || []).filter((req) => {
      const rId = (req.studentId || req.student_id || '').trim().toLowerCase();
      const rEmail = (req.email || '').trim().toLowerCase();
      return (activeId && rId === activeId) || (activeEmail && rEmail === activeEmail);
    });
  } else {
    state.studentRequests = state.allRequests || [];
  }

  if (elements.studentMyRequestsBadge) {
    elements.studentMyRequestsBadge.textContent = state.studentRequests.length;
  }

  const total = state.studentRequests.length;
  const pending = state.studentRequests.filter((r) => (r.status || '').toLowerCase() === 'pending').length;
  const processing = state.studentRequests.filter((r) => (r.status || '').toLowerCase() === 'processing').length;
  const completed = state.studentRequests.filter((r) => ['approved', 'completed', 'for release', 'released'].includes((r.status || '').toLowerCase())).length;

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
              <div class="step-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
              <span class="step-label">1. Request Submitted<br><small style="color:#64748B;">${formattedDate}</small></span>
            </div>

            <div class="${step2Class}">
              <div class="step-icon">${status === 'Processing' || status === 'Completed' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '2'}</div>
              <span class="step-label">2. Under Review<br><small style="color:#64748B;">Registrar Office</small></span>
            </div>

            <div class="${step3Class}">
              <div class="step-icon">${status === 'Completed' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '3'}</div>
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
// Admin Dashboard & Modern Table Logic (100% Real Live Data)
// ==========================================
function updateAdminDashboard() {
  const reqs = state.allRequests || [];
  const total = reqs.length;
  const pending = reqs.filter((r) => (r.status || '').toUpperCase() === 'PENDING').length;
  const processing = reqs.filter((r) => (r.status || '').toUpperCase() === 'PROCESSING').length;
  const approved = reqs.filter((r) => {
    const s = (r.status || '').toUpperCase();
    return s === 'COMPLETED' || s === 'APPROVED';
  }).length;
  const released = reqs.filter((r) => (r.status || '').toUpperCase() === 'FOR RELEASE').length;

  // True card counts - 100% real live database data
  const cardTotal = document.getElementById('cardTotalCount');
  if (cardTotal) cardTotal.textContent = total.toLocaleString();

  const cardPending = document.getElementById('cardPendingCount');
  if (cardPending) cardPending.textContent = pending.toLocaleString();

  const cardApproved = document.getElementById('cardApprovedCount');
  if (cardApproved) cardApproved.textContent = approved.toLocaleString();

  const cardReleased = document.getElementById('cardReleasedCount');
  if (cardReleased) cardReleased.textContent = released.toLocaleString();

  const badgeEl = document.getElementById('adminTotalBadge');
  if (badgeEl) badgeEl.textContent = total;

  // Donut total label
  const donutTotal = document.getElementById('overviewDonutTotal');
  if (donutTotal) donutTotal.textContent = total.toLocaleString() + ' Total';

  // Real percentages computed purely from database records
  let pctApproved = '0.0%';
  let pctProcessing = '0.0%';
  let pctPending = '0.0%';
  let pctRelease = '0.0%';

  let dashApproved = 0;
  let dashProcessing = 0;
  let dashPending = 0;
  let dashRelease = 0;

  if (total > 0) {
    const pApp = (approved / total) * 100;
    const pProc = (processing / total) * 100;
    const pPend = (pending / total) * 100;
    const pRel = (released / total) * 100;

    pctApproved = pApp.toFixed(1) + '%';
    pctProcessing = pProc.toFixed(1) + '%';
    pctPending = pPend.toFixed(1) + '%';
    pctRelease = pRel.toFixed(1) + '%';

    dashApproved = pApp;
    dashProcessing = pProc;
    dashPending = pPend;
    dashRelease = pRel;
  }

  const legApproved = document.getElementById('legendPctApproved');
  if (legApproved) legApproved.textContent = pctApproved;

  const legProcessing = document.getElementById('legendPctProcessing');
  if (legProcessing) legProcessing.textContent = pctProcessing;

  const legPending = document.getElementById('legendPctPending');
  if (legPending) legPending.textContent = pctPending;

  const legRelease = document.getElementById('legendPctRelease');
  if (legRelease) legRelease.textContent = pctRelease;

  // Dynamically update SVG donut chart stroke-dasharray based on real slices
  const donutSvg = document.querySelector('.overview-donut-svg');
  if (donutSvg) {
    if (total === 0) {
      donutSvg.innerHTML = `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="#E2E8F0" stroke-width="4.5"/>`;
    } else {
      let offset = 0;
      const segs = [
        { val: dashApproved, color: '#2563EB' },
        { val: dashProcessing, color: '#60A5FA' },
        { val: dashPending, color: '#10B981' },
        { val: dashRelease, color: '#A855F7' }
      ];
      let paths = `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F1F5F9" stroke-width="4.5"/>`;
      segs.forEach(s => {
        if (s.val > 0) {
          paths += `<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${s.color}" stroke-width="4.5" stroke-dasharray="${s.val.toFixed(1)}, 100" stroke-dashoffset="${(-offset).toFixed(1)}"/>`;
          offset += s.val;
        }
      });
      donutSvg.innerHTML = paths;
    }
  }

  renderAdminRecentActivities();
  renderAdminRecentTable();
}

function renderAdminRecentActivities() {
  const container = document.getElementById('adminRecentActivitiesList');
  if (!container) return;

  const reqs = state.allRequests || [];
  if (reqs.length === 0) {
    container.innerHTML = `<div style="padding:28px 16px; text-align:center; color:#64748B; font-size:13.5px;">No recent request activities recorded yet.</div>`;
    return;
  }

  // Sort newest first
  const sorted = [...reqs].sort((a, b) => {
    const da = new Date(a.created_at || a.date_submitted || a.createdAt || 0);
    const db = new Date(b.created_at || b.date_submitted || b.createdAt || 0);
    return db - da;
  }).slice(0, 5);

  container.innerHTML = sorted.map((r, i) => {
    const student = r.student_name || r.studentName || 'Student';
    const doc = r.document_type || r.documentType || 'Official Document';
    const status = r.status || 'Pending';
    const shortId = r.tracking_number || (r._id ? ('REQ-' + r._id.substring(r._id.length - 5).toUpperCase()) : ('REQ-00' + (r.id || (i + 1))));
    const timeDisplay = formatDate(r.created_at || r.date_submitted || r.createdAt);

    let iconClass = 'new-req';
    let iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
    let text = `${escapeHtml(doc)} request submitted by ${escapeHtml(student)}.`;

    if (status === 'Approved' || status === 'Completed') {
      iconClass = 'approved';
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      text = `${escapeHtml(doc)} (${escapeHtml(shortId)}) for ${escapeHtml(student)} was approved.`;
    } else if (status === 'Processing') {
      iconClass = 'processing';
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      text = `${escapeHtml(doc)} (${escapeHtml(shortId)}) is currently processing.`;
    } else if (status === 'For Release') {
      iconClass = 'released';
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
      text = `${escapeHtml(doc)} (${escapeHtml(shortId)}) is ready for release.`;
    }

    return `
      <div class="activity-item">
        <div class="activity-icon ${iconClass}">
          ${iconSvg}
        </div>
        <div class="activity-text">${text}</div>
        <div class="activity-time">${escapeHtml(timeDisplay)}</div>
      </div>
    `;
  }).join('');
}

function renderAdminRecentTable() {
  const tbody = elements.adminRecentTableBody || document.getElementById('adminRecentTableBody');
  if (!tbody) return;

  const reqs = state.allRequests || [];
  if (reqs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No document requests recorded yet.</td></tr>`;
    return;
  }

  const list = reqs.slice(0, 5);
  tbody.innerHTML = list.map((req, index) => {
    const formattedDate = formatDate(req.date_submitted || req.dateSubmitted || req.createdAt);
    const shortId = req.tracking_number || (req._id ? ('REQ-' + req._id.substring(req._id.length - 5).toUpperCase()) : ('REQ-00' + (230 + (req.id || index + 1))));
    const status = req.status || 'Pending';
    const statusClass = status.toLowerCase().replace(/\s+/g, '-');
    const studentName = req.student_name || req.studentName || 'Student';
    const docType = req.document_type || req.documentType || 'Official Document';
    const reqIdentifier = req._id || req.id || req.tracking_number || shortId;

    return `
      <tr>
        <td><code class="ref-req-code">${escapeHtml(shortId)}</code></td>
        <td><strong>${escapeHtml(studentName)}</strong></td>
        <td><span style="font-weight:500; color:#1E293B;">${escapeHtml(docType)}</span></td>
        <td>
          <span class="admin-status-pill status-${statusClass}">
            <span class="pill-dot"></span>
            <span>${escapeHtml(status)}</span>
          </span>
        </td>
        <td style="color:#64748B; font-size:13px;">${escapeHtml(formattedDate)}</td>
        <td>
          <button class="btn-table-pill" onclick="openRequestDetailsModal('${escapeHtml(reqIdentifier)}')">View</button>
        </td>
      </tr>
    `;
  }).join('');
}

function setupAdminFilters() {
  elements.adminSearchInput?.addEventListener('input', applyAdminFilters);
  elements.adminStatusFilter?.addEventListener('change', applyAdminFilters);
  document.getElementById('adminDocTypeFilter')?.addEventListener('change', applyAdminFilters);
}

function applyAdminFilters() {
  const searchInput = document.getElementById('adminSearchInput');
  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const statusEl = document.getElementById('adminStatusFilter');
  const status = statusEl ? statusEl.value : 'ALL';
  const docTypeEl = document.getElementById('adminDocTypeFilter');
  const docType = docTypeEl ? docTypeEl.value : 'ALL';

  state.filteredAdminRequests = (state.allRequests || []).filter((req) => {
    const s = req.status || 'Pending';
    const matchesStatus = status === 'ALL' || s === status || (status === 'Completed' && (s === 'Completed' || s === 'Approved'));
    const dType = (req.document_type || req.documentType || '').toLowerCase();
    const matchesDocType = docType === 'ALL' || dType.includes(docType.toLowerCase());

    const sName = (req.student_name || req.studentName || '').toLowerCase();
    const sId = (req.student_id || req.studentId || '').toLowerCase();
    const purp = (req.purpose || '').toLowerCase();
    const track = (req.tracking_number || '').toLowerCase();

    const matchesSearch =
      !search ||
      sName.includes(search) ||
      sId.includes(search) ||
      dType.includes(search) ||
      purp.includes(search) ||
      track.includes(search);

    return matchesStatus && matchesDocType && matchesSearch;
  });

  renderAdminTable();
}

// ==========================================
// Generic Dynamic Pagination Helper
// ==========================================
function renderPagination(containerId, countLabelId, totalItems, currentPage, pageSize, onPageChangeFnName, itemLabel = 'records') {
  const container = document.getElementById(containerId);
  const countLabel = document.getElementById(countLabelId);
  
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, totalItems);

  if (countLabel) {
    countLabel.textContent = `Showing ${startIdx}–${endIdx} of ${totalItems.toLocaleString()} ${itemLabel}`;
  }

  if (!container) return;

  let html = `<div class="pagination-btn-group">`;
  html += `<button type="button" class="btn-page-nav" ${safePage <= 1 ? 'disabled' : ''} onclick="${onPageChangeFnName}(${safePage - 1})" aria-label="Previous page">&laquo;</button>`;

  const maxButtons = 5;
  let startPage = Math.max(1, safePage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    html += `<button type="button" class="btn-page-num" onclick="${onPageChangeFnName}(1)">1</button>`;
    if (startPage > 2) {
      html += `<span class="pagination-ellipsis">&hellip;</span>`;
    }
  }

  for (let p = startPage; p <= endPage; p++) {
    html += `<button type="button" class="btn-page-num ${p === safePage ? 'active' : ''}" onclick="${onPageChangeFnName}(${p})">${p}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span class="pagination-ellipsis">&hellip;</span>`;
    }
    html += `<button type="button" class="btn-page-num" onclick="${onPageChangeFnName}(${totalPages})">${totalPages}</button>`;
  }

  html += `<button type="button" class="btn-page-nav" ${safePage >= totalPages ? 'disabled' : ''} onclick="${onPageChangeFnName}(${safePage + 1})" aria-label="Next page">&raquo;</button>`;
  html += `</div>`;
  container.innerHTML = html;
}

let studentCurrentPage = 1;
let announceCurrentPage = 1;
let auditCurrentPage = 1;
let manageCurrentPage = 1;
let cachedRegisteredStudents = [];

window.setStudentPage = function(page) {
  studentCurrentPage = page;
  renderAdminStudentsTable();
};

window.setAnnouncePage = function(page) {
  announceCurrentPage = page;
  renderAdminAnnouncements();
};

window.setAuditPage = function(page) {
  auditCurrentPage = page;
  renderAdminAuditLogs();
};

window.setManagePage = function(page) {
  manageCurrentPage = page;
  renderAdminTable();
};

async function fetchRegisteredStudents() {
  try {
    const res = await fetch('/api/auth/students');
    if (res.ok) {
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        cachedRegisteredStudents = result.data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch students from API, using local request data:', err);
  }
}

async function renderAdminStudentsTable() {
  const tbody = document.getElementById('adminStudentsTableBody');
  if (!tbody) return;

  const search = document.getElementById('adminStudentSearchInput')?.value.toLowerCase().trim() || '';
  const progFilter = document.getElementById('adminStudentProgramFilter')?.value || 'ALL';
  const statusFilter = document.getElementById('adminStudentStatusFilter')?.value || 'ALL';

  if (cachedRegisteredStudents.length === 0) {
    await fetchRegisteredStudents();
  }

  // Also check for pending reactivation requests to update badge count
  checkPendingReactivationRequests();

  // Combine database registered students with any request submitters not yet in list
  const studentMap = new Map();

  cachedRegisteredStudents.forEach(s => {
    const key = (s.studentId || s.email || s.name).toLowerCase();
    studentMap.set(key, {
      studentId: s.studentId || '23-0000',
      name: s.name || s.fullName || 'Student',
      course: s.course || 'BSIT',
      status: s.status || 'Active',
      email: s.email || ''
    });
  });

  // Also include any students with requests in state.allRequests
  (state.allRequests || []).forEach(r => {
    const sId = r.student_id || r.studentId;
    const sName = r.student_name || r.studentName;
    if (sName) {
      const key = (sId || sName).toLowerCase();
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentId: sId || '23-10021',
          name: sName,
          course: r.course || 'BSIT',
          status: 'Active',
          email: ''
        });
      }
    }
  });

  const allStudents = Array.from(studentMap.values());

  const total = allStudents.length;
  const active = allStudents.filter(s => s.status.toLowerCase() !== 'inactive').length;
  const inactive = allStudents.filter(s => s.status.toLowerCase() === 'inactive').length;
  const grad = allStudents.filter(s => s.status.toLowerCase() === 'graduated').length;

  const elTot = document.getElementById('studentStatTotal'); if (elTot) elTot.textContent = total.toLocaleString();
  const elAct = document.getElementById('studentStatActive'); if (elAct) elAct.textContent = active.toLocaleString();
  const elInact = document.getElementById('studentStatInactive'); if (elInact) elInact.textContent = inactive.toLocaleString();
  const elGrad = document.getElementById('studentStatGraduated'); if (elGrad) elGrad.textContent = grad.toLocaleString();

  const filtered = allStudents.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search) || s.studentId.toLowerCase().includes(search);
    const matchesCourse = progFilter === 'ALL' || s.course.includes(progFilter);
    const matchesStatus = statusFilter === 'ALL' || s.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (studentCurrentPage > totalPages) studentCurrentPage = totalPages;
  const paged = filtered.slice((studentCurrentPage - 1) * pageSize, studentCurrentPage * pageSize);

  renderPagination('adminStudentsPagination', 'adminStudentsCountLabel', filtered.length, studentCurrentPage, pageSize, 'setStudentPage', 'students');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No registered students found matching filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = paged.map(s => {
    const initials = s.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'ST';
    const isActive = s.status.toLowerCase() === 'active';
    const statusClass = isActive ? 'status-approved' : 'status-rejected';

    return `
      <tr>
        <td><code class="ref-req-code">${escapeHtml(s.studentId)}</code></td>
        <td>
          <div class="student-table-user-cell">
            <div class="student-table-avatar">${escapeHtml(initials)}</div>
            <strong>${escapeHtml(s.name)}</strong>
          </div>
        </td>
        <td><span style="font-weight:500; color:#334155;">${escapeHtml(s.course)}</span></td>
        <td>
          <span class="admin-status-pill ${statusClass}">
            <span class="pill-dot"></span>
            <span>${escapeHtml(s.status)}</span>
          </span>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            ${isActive
              ? `<button type="button" class="btn-table-pill btn-deactivate" onclick="toggleStudentStatus('${escapeHtml(s.studentId)}', 'Inactive', '${escapeHtml(s.name)}')">Deactivate</button>`
              : `<button type="button" class="btn-table-pill btn-reactivate" onclick="toggleStudentStatus('${escapeHtml(s.studentId)}', 'Active', '${escapeHtml(s.name)}')">Reactivate</button>`
            }
            <button type="button" class="btn-table-pill" onclick="editStudentDetails('${escapeHtml(s.studentId)}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.filterToDeactivatedStudents = function() {
  const sel = document.getElementById('adminStudentStatusFilter');
  if (sel) {
    sel.value = 'Inactive';
    studentCurrentPage = 1;
    renderAdminStudentsTable();
    showToast('Filtered to show Deactivated Accounts', 'info');
  }
};

window.toggleStudentStatus = async function(studentId, newStatus, studentName) {
  const isDeactivating = newStatus === 'Inactive';
  const actionText = isDeactivating ? 'deactivate' : 'reactivate';
  const confirmMsg = isDeactivating
    ? `Are you sure you want to DEACTIVATE the student account for ${studentName || studentId}? They will not be able to log in to the student portal until reactivated.`
    : `Are you sure you want to REACTIVATE the student account for ${studentName || studentId}?`;

  if (!confirm(confirmMsg)) return;

  triggerAdminViewLoader();
  try {
    const res = await fetch(`/api/auth/students/${encodeURIComponent(studentId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || `Failed to ${actionText} account.`);

    showToast(`Student account ${actionText}d successfully.`, 'success');
    if (typeof addAdminAuditLog === 'function') {
      addAdminAuditLog(`${isDeactivating ? 'Deactivated' : 'Reactivated'} student account #${studentId} (${studentName || ''})`, 'USER');
    }

    await fetchRegisteredStudents();
    await checkPendingReactivationRequests();
    renderAdminStudentsTable();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.openReactivationModal = function(studentId = '', email = '') {
  const modal = document.getElementById('modalRequestReactivation');
  if (!modal) return;
  const idEl = document.getElementById('reactivateStudentId');
  if (idEl && studentId) idEl.value = studentId;
  const emEl = document.getElementById('reactivateEmail');
  if (emEl && email) emEl.value = email;
  modal.style.display = 'flex';
};

window.closeReactivationModal = function() {
  const modal = document.getElementById('modalRequestReactivation');
  if (modal) modal.style.display = 'none';
};

window.openReactivationRequestsModal = async function() {
  const modal = document.getElementById('modalReactivationRequests');
  if (!modal) return;
  modal.style.display = 'flex';

  const listEl = document.getElementById('reactivationRequestsList');
  if (!listEl) return;
  listEl.innerHTML = '<p style="text-align:center; color:#64748B; font-size:13px; padding:24px;">Loading requests...</p>';

  try {
    const res = await fetch('/api/auth/reactivation-requests');
    const result = await res.json();
    const requests = result.data || [];

    if (requests.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:32px 16px; color:#64748B;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5" style="margin-bottom:8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <h4 style="margin:0 0 4px; font-size:15px; color:#1E293B;">No Reactivation Requests</h4>
          <p style="font-size:12.5px; margin:0;">All student accounts are up to date. No pending reactivation requests found.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = requests.map(r => {
      const isPending = (r.status || 'Pending').toLowerCase() === 'pending';
      return `
        <div style="border:1px solid #E2E8F0; border-radius:12px; padding:14px; margin-bottom:10px; background:#FFFFFF;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div>
              <strong style="color:#0F172A; font-size:14px;">${escapeHtml(r.full_name)}</strong>
              <div style="font-size:12px; color:#64748B; margin-top:2px;">
                ID: <code class="ref-req-code">${escapeHtml(r.student_id)}</code> &bull; ${escapeHtml(r.email)}
              </div>
            </div>
            <span class="badge-status-pill ${isPending ? 'pending' : 'green'}">&bull; ${escapeHtml(r.status || 'Pending')}</span>
          </div>
          <div style="background:#F8FAFC; border-radius:8px; padding:8px 12px; font-size:12.5px; color:#334155; margin-bottom:10px;">
            <div style="font-weight:600; color:#475569; font-size:11px; margin-bottom:2px; text-transform:uppercase;">Reason for Reactivation:</div>
            "${escapeHtml(r.reason)}"
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11.5px; color:#94A3B8;">Submitted: ${formatDate(r.created_at)}</span>
            ${isPending ? `<button type="button" class="btn-table-pill btn-reactivate" style="font-weight:700;" onclick="approveReactivationRequest('${escapeHtml(r.student_id)}', '${r.id}')">Approve &amp; Reactivate &rarr;</button>` : '<span style="font-size:12px; color:#16A34A; font-weight:600;">&#10003; Reactivated</span>'}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    listEl.innerHTML = `<p style="color:#DC2626; text-align:center; padding:16px;">Error loading requests: ${escapeHtml(err.message)}</p>`;
  }
};

window.closeReactivationRequestsModal = function() {
  const modal = document.getElementById('modalReactivationRequests');
  if (modal) modal.style.display = 'none';
};

window.approveReactivationRequest = async function(studentId, requestId) {
  triggerAdminViewLoader();
  try {
    const res = await fetch(`/api/auth/students/${encodeURIComponent(studentId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Active' })
    });
    if (!res.ok) throw new Error('Failed to reactivate account.');
    showToast(`Student ${studentId} reactivated successfully!`, 'success');
    if (typeof addAdminAuditLog === 'function') {
      addAdminAuditLog(`Approved reactivation request for student #${studentId}`, 'USER');
    }
    await fetchRegisteredStudents();
    await checkPendingReactivationRequests();
    renderAdminStudentsTable();
    openReactivationRequestsModal();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

async function checkPendingReactivationRequests() {
  try {
    const res = await fetch('/api/auth/reactivation-requests');
    if (res.ok) {
      const data = await res.json();
      const pending = (data.data || []).filter(r => (r.status || '').toLowerCase() === 'pending');
      const badge = document.getElementById('badgeReactivationCount');
      if (badge) {
        if (pending.length > 0) {
          badge.textContent = pending.length;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch (e) {}
}

async function handleReactivationSubmit(e) {
  e.preventDefault();
  const studentId = document.getElementById('reactivateStudentId')?.value.trim();
  const email = document.getElementById('reactivateEmail')?.value.trim();
  const reason = document.getElementById('reactivateReason')?.value.trim();

  if (!studentId || !email || !reason) {
    showToast('Please fill out all required fields.', 'error');
    return;
  }

  const btn = document.getElementById('btnSubmitReactivation');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/auth/reactivation-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, email, reason })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to submit reactivation request.');

    showToast('Reactivation request submitted! The Registrar will review your account.', 'success');
    closeReactivationModal();
    checkPendingReactivationRequests();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

window.viewStudentDetails = function(studentId) {
  const student = cachedRegisteredStudents.find(s => s.studentId === studentId);
  if (student) {
    showToast(`Student: ${student.name} (${student.studentId}) - ${student.course}`, 'info');
  } else {
    showToast(`Viewing student ${studentId}`, 'info');
  }
};

window.editStudentDetails = function(studentId) {
  const modal = document.getElementById('modalAdminAddStudent');
  if (modal) {
    const idIn = document.getElementById('adminNewStudentId');
    if (idIn) idIn.value = studentId;
    modal.style.display = 'flex';
  }
};

window.filterRequestsByStudent = function(studentName) {
  switchAdminSubtab('manage');
  if (elements.adminSearchInput) {
    elements.adminSearchInput.value = studentName;
    applyAdminFilters();
  }
};

function renderAdminAnnouncements() {
  const tbody = document.getElementById('adminAnnouncementsTableBody');
  if (!tbody) return;

  const search = document.getElementById('adminAnnounceSearchInput')?.value.toLowerCase().trim() || '';
  const statusFilter = document.getElementById('adminAnnounceStatusFilter')?.value || 'ALL';
  const catFilter = document.getElementById('adminAnnounceCategoryFilter')?.value || 'ALL';

  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('cca_announcements') || '[]');
  } catch (e) {}

  const allAnnouncements = stored.map((a, i) => ({
    id: a.id || ('ann_' + (i + 1)),
    num: i + 1,
    title: a.title,
    category: a.category || 'General',
    status: a.status || 'Published',
    message: a.message || '',
    pubDate: formatDate(a.timestamp || new Date()),
    expDate: a.expDate || '-'
  }));

  const total = allAnnouncements.length;
  const published = allAnnouncements.filter(a => a.status === 'Published').length;
  const drafts = allAnnouncements.filter(a => a.status === 'Draft').length;
  const scheduled = allAnnouncements.filter(a => a.status === 'Scheduled').length;

  const elTot = document.getElementById('annStatTotal'); if (elTot) elTot.textContent = total;
  const elPub = document.getElementById('annStatPublished'); if (elPub) elPub.textContent = published;
  const elDrf = document.getElementById('annStatDrafts'); if (elDrf) elDrf.textContent = drafts;
  const elSch = document.getElementById('annStatScheduled'); if (elSch) elSch.textContent = scheduled;

  const filtered = allAnnouncements.filter(a => {
    const matchesSearch = !search || a.title.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'ALL' || a.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory = catFilter === 'ALL' || a.category.toLowerCase() === catFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (announceCurrentPage > totalPages) announceCurrentPage = totalPages;
  const paged = filtered.slice((announceCurrentPage - 1) * pageSize, announceCurrentPage * pageSize);

  renderPagination('adminAnnouncePagination', 'adminAnnounceCountLabel', filtered.length, announceCurrentPage, pageSize, 'setAnnouncePage', 'announcements');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No announcements published yet. Click "+ Create Announcement" above to publish one.</td></tr>`;
    return;
  }

  tbody.innerHTML = paged.map((a, i) => {
    let catClass = 'bg-blue-tint';
    let catColor = '#2563EB';
    if (a.category === 'General') { catClass = 'bg-purple-tint'; catColor = '#9333EA'; }
    else if (a.category === 'System') { catClass = 'bg-orange-tint'; catColor = '#D97706'; }
    else if (a.category === 'Scholarship') { catClass = 'bg-green-tint'; catColor = '#16A34A'; }

    const statusPill = a.status === 'Published'
      ? '<span class="admin-status-pill status-approved"><span class="pill-dot"></span><span>Published</span></span>'
      : '<span class="admin-status-pill status-pending"><span class="pill-dot"></span><span>Draft</span></span>';
    const rowNum = (announceCurrentPage - 1) * pageSize + i + 1;

    return `
      <tr>
        <td style="color:#64748B; font-weight:600;">${rowNum}</td>
        <td><strong>${escapeHtml(a.title)}</strong></td>
        <td><span class="badge-status-pill" style="background:${catClass === 'bg-blue-tint' ? '#EFF6FF' : (catClass === 'bg-purple-tint' ? '#FAF5FF' : (catClass === 'bg-green-tint' ? '#F0FDF4' : '#FFFBEB'))}; color:${catColor}; font-weight:600;">${escapeHtml(a.category)}</span></td>
        <td>${statusPill}</td>
        <td style="color:#64748B; font-size:13px;">${escapeHtml(a.pubDate)}</td>
        <td style="color:#64748B; font-size:13px;">${escapeHtml(a.expDate)}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="btn-table-pill" onclick="openAdminViewAnnouncement('${escapeHtml(a.id)}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>View</span>
            </button>
            <button type="button" class="btn-table-pill" onclick="openAdminEditAnnouncement('${escapeHtml(a.id)}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit</span>
            </button>
            <button type="button" class="btn-table-pill" style="color:#DC2626;" onclick="deleteAdminAnnouncement('${escapeHtml(a.id)}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAdminViewAnnouncement = function(annId) {
  let existing = [];
  try {
    existing = JSON.parse(localStorage.getItem('cca_announcements') || '[]');
  } catch (e) {}
  const ann = existing.find(a => (a.id === annId || ('ann_' + a.id) === annId));
  if (!ann) return;

  const modal = document.getElementById('modalAdminViewAnnouncement');
  if (!modal) return;

  const titleEl = document.getElementById('viewAnnTitle') || document.getElementById('adminViewAnnTitle');
  if (titleEl) titleEl.textContent = ann.title;

  const badgeEl = document.getElementById('viewAnnBadge') || document.getElementById('adminViewAnnStatus');
  if (badgeEl) {
    badgeEl.className = 'badge-status-pill ' + (ann.status === 'Published' ? 'green' : 'gray');
    badgeEl.innerHTML = '&bull; ' + (ann.status || 'Published');
  }

  const catEl = document.getElementById('viewAnnCategory') || document.getElementById('adminViewAnnCategory');
  if (catEl) catEl.textContent = ann.category || 'General';

  const dateEl = document.getElementById('viewAnnDate') || document.getElementById('adminViewAnnDate');
  if (dateEl) dateEl.textContent = formatDate(ann.timestamp || new Date());

  const contentEl = document.getElementById('viewAnnContent') || document.getElementById('adminViewAnnContent');
  if (contentEl) contentEl.textContent = ann.message || '';

  modal.style.display = 'flex';
};

window.openAdminEditAnnouncement = function(annId) {
  let existing = [];
  try {
    existing = JSON.parse(localStorage.getItem('cca_announcements') || '[]');
  } catch (e) {}
  const ann = existing.find(a => (a.id === annId || ('ann_' + a.id) === annId));
  if (!ann) return;

  const modal = document.getElementById('modalAdminCreateAnnouncement');
  const form = document.getElementById('formAdminCreateAnnouncement');
  if (!modal || !form) return;

  form.setAttribute('data-edit-id', annId);
  document.getElementById('adminNewAnnTitle').value = ann.title || '';
  document.getElementById('adminNewAnnCategory').value = ann.category || 'General';
  document.getElementById('adminNewAnnStatus').value = ann.status || 'Published';
  document.getElementById('adminNewAnnContent').value = ann.message || '';

  const titleEl = modal.querySelector('.modal-title');
  if (titleEl) titleEl.textContent = 'Edit Announcement';

  modal.style.display = 'flex';
};

window.deleteAdminAnnouncement = function(annId) {
  if (!confirm('Are you sure you want to delete this announcement?')) return;
  try {
    let existing = JSON.parse(localStorage.getItem('cca_announcements') || '[]');
    const target = existing.find(a => (a.id === annId || ('ann_' + a.id) === annId));
    existing = existing.filter(a => a.id !== annId && ('ann_' + a.id) !== annId);
    localStorage.setItem('cca_announcements', JSON.stringify(existing));
    if (target) {
      addAdminAuditLog(`Deleted announcement: "${target.title}"`, 'SYSTEM');
    }
    showToast('Announcement deleted.', 'info');
    renderAdminAnnouncements();
  } catch (e) {}
};

function renderAdminReports() {
  const reqs = state.allRequests || [];
  const total = reqs.length;
  const pending = reqs.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
  const approved = reqs.filter(r => ['COMPLETED', 'APPROVED'].includes((r.status || '').toUpperCase())).length;
  const released = reqs.filter(r => ['FOR RELEASE', 'RELEASED'].includes((r.status || '').toUpperCase())).length;

  const elTot = document.getElementById('reportStatTotal'); if (elTot) elTot.textContent = total.toLocaleString();
  const elPend = document.getElementById('reportStatPending'); if (elPend) elPend.textContent = pending.toLocaleString();
  const elApp = document.getElementById('reportStatApproved'); if (elApp) elApp.textContent = approved.toLocaleString();
  const elRel = document.getElementById('reportStatReleased'); if (elRel) elRel.textContent = released.toLocaleString();

  // 1. Dynamic Request Trends Line Chart (November 2026: 4 Weeks)
  const trendLinesGroup = document.getElementById('reportTrendLinesGroup');
  if (trendLinesGroup) {
    const w1 = reqs.filter(r => { const d = new Date(r.created_at || r.date_submitted || 0).getDate(); return d >= 1 && d <= 7; }).length;
    const w2 = reqs.filter(r => { const d = new Date(r.created_at || r.date_submitted || 0).getDate(); return d >= 8 && d <= 14; }).length;
    const w3 = reqs.filter(r => { const d = new Date(r.created_at || r.date_submitted || 0).getDate(); return d >= 15 && d <= 21; }).length;
    const w4 = reqs.filter(r => { const d = new Date(r.created_at || r.date_submitted || 0).getDate(); return d >= 22 && d <= 30; }).length;

    const maxVal = Math.max(w1, w2, w3, w4, 5);
    const getY = (val) => 170 - (val / maxVal) * 140;

    const xCoords = [75, 195, 320, 445];
    const pts = [
      { x: xCoords[0], y: getY(w1), count: w1, week: 'Nov 1-7' },
      { x: xCoords[1], y: getY(w2), count: w2, week: 'Nov 8-14' },
      { x: xCoords[2], y: getY(w3), count: w3, week: 'Nov 15-21' },
      { x: xCoords[3], y: getY(w4), count: w4, week: 'Nov 22-30' }
    ];

    const dPath = `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y} L ${pts[2].x} ${pts[2].y} L ${pts[3].x} ${pts[3].y}`;
    const fillPath = `M ${pts[0].x} 170 L ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y} L ${pts[2].x} ${pts[2].y} L ${pts[3].x} ${pts[3].y} L ${pts[3].x} 170 Z`;

    let groupHtml = `
      <path d="${fillPath}" fill="rgba(37, 99, 235, 0.08)" />
      <path d="${dPath}" fill="none" stroke="#2563EB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    `;

    pts.forEach(p => {
      groupHtml += `
        <circle cx="${p.x}" cy="${p.y}" r="6" fill="#FFFFFF" stroke="#2563EB" stroke-width="3" style="cursor:pointer;" onclick="filterRequestsByWeek('${p.week}')">
          <title>${p.week}: ${p.count} requests</title>
        </circle>
        <text x="${p.x}" y="${p.y - 12}" fill="#2563EB" font-size="11" font-weight="700" text-anchor="middle">${p.count}</text>
      `;
    });

    trendLinesGroup.innerHTML = groupHtml;
  }

  // 2. Dynamic Document Types Donut & Legend
  const docCounts = {};
  reqs.forEach(r => {
    const d = r.document_type || r.documentType || 'Official Document';
    docCounts[d] = (docCounts[d] || 0) + 1;
  });

  const donutTotalEl = document.getElementById('reportDocDonutTotal');
  if (donutTotalEl) donutTotalEl.textContent = total;

  const colors = ['#2563EB', '#10B981', '#F59E0B', '#A855F7', '#EC4899', '#6366F1'];
  const docTypesList = Object.entries(docCounts).map(([doc, count], idx) => ({
    name: doc,
    count: count,
    pct: total > 0 ? ((count / total) * 100) : 0,
    color: colors[idx % colors.length]
  }));

  const legendList = document.getElementById('reportDocLegendList');
  if (legendList) {
    if (docTypesList.length === 0) {
      legendList.innerHTML = `<div style="color:#64748B; font-size:12px; padding:10px;">No document records available.</div>`;
    } else {
      legendList.innerHTML = docTypesList.map(item => `
        <div class="overview-legend-item" style="cursor:pointer;" onclick="filterRequestsByDocType('${escapeHtml(item.name)}')">
          <div class="legend-color-dot" style="background:${item.color};"></div>
          <div class="legend-label-col">
            <span class="legend-label-title">${escapeHtml(item.name)}</span>
            <span class="legend-label-pct">${item.pct.toFixed(1)}% (${item.count})</span>
          </div>
        </div>
      `).join('');
    }
  }

  const donutSvg = document.getElementById('reportDocDonutSvg');
  if (donutSvg) {
    if (total === 0) {
      donutSvg.innerHTML = `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="#E2E8F0" stroke-width="4.5"/>`;
    } else {
      let offset = 0;
      let paths = `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F1F5F9" stroke-width="4.5"/>`;
      docTypesList.forEach(item => {
        if (item.pct > 0) {
          paths += `<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${item.color}" stroke-width="4.5" stroke-dasharray="${item.pct.toFixed(1)}, 100" stroke-dashoffset="${(-offset).toFixed(1)}" style="cursor:pointer;" onclick="filterRequestsByDocType('${escapeHtml(item.name)}')"><title>${escapeHtml(item.name)}: ${item.count} (${item.pct.toFixed(1)}%)</title></path>`;
          offset += item.pct;
        }
      });
      donutSvg.innerHTML = paths;
    }
  }

  // 3. Dynamic Top Courses
  const courseCounts = { BSIT: 0, BSBA: 0, BSA: 0, BSCS: 0, Others: 0 };
  reqs.forEach(r => {
    const c = (r.course || '').toUpperCase();
    if (c.includes('BSIT') || c.includes('INFORMATION')) courseCounts.BSIT++;
    else if (c.includes('BSBA') || c.includes('BUSINESS')) courseCounts.BSBA++;
    else if (c.includes('BSA') || c.includes('ACCOUNTANCY')) courseCounts.BSA++;
    else if (c.includes('BSCS') || c.includes('COMPUTER SCIENCE')) courseCounts.BSCS++;
    else courseCounts.Others++;
  });

  const topCoursesContainer = document.getElementById('reportTopCoursesList');
  if (topCoursesContainer) {
    const maxCourse = Math.max(...Object.values(courseCounts), 1);
    topCoursesContainer.innerHTML = Object.entries(courseCounts).map(([course, count]) => {
      const widthPct = Math.max(8, (count / maxCourse) * 100);
      return `
        <div style="margin-bottom:12px; cursor:pointer;" onclick="filterRequestsByCourse('${course}')" title="Click to filter by ${course}">
          <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:600; color:#334155; margin-bottom:4px;">
            <span>${course}</span>
            <span>${count}</span>
          </div>
          <div style="height:8px; background:#F1F5F9; border-radius:4px; overflow:hidden;">
            <div style="height:100%; width:${widthPct}%; background:#2563EB; border-radius:4px; transition:width 0.3s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.filterRequestsByDocType = function(docType) {
  switchAdminSubtab('manage');
  const docTypeEl = document.getElementById('adminDocTypeFilter');
  if (docTypeEl) {
    let found = false;
    for (let opt of docTypeEl.options) {
      if (opt.value.toLowerCase().includes(docType.toLowerCase()) || docType.toLowerCase().includes(opt.value.toLowerCase())) {
        docTypeEl.value = opt.value;
        found = true;
        break;
      }
    }
    if (!found) {
      const sIn = document.getElementById('adminSearchInput');
      if (sIn) sIn.value = docType;
    }
  }
  applyAdminFilters();
  showToast(`Filtering requests by document: "${docType}"`, 'info');
};

window.filterRequestsByCourse = function(course) {
  switchAdminSubtab('manage');
  const sIn = document.getElementById('adminSearchInput');
  if (sIn) {
    sIn.value = course === 'Others' ? '' : course;
  }
  applyAdminFilters();
  showToast(`Filtering requests by course: "${course}"`, 'info');
};

window.filterRequestsByWeek = function(weekLabel) {
  switchAdminSubtab('manage');
  showToast(`Filtered requests for: ${weekLabel}`, 'info');
};

window.filterRequestsByStatus = function(status) {
  switchAdminSubtab('manage');
  const statusEl = document.getElementById('adminStatusFilter');
  if (statusEl) {
    statusEl.value = status;
    applyAdminFilters();
  }
};

function renderMonthlyChartBars(reqs) {
  const container = document.querySelector('.bar-chart-visual');
  if (!container) return;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const counts = new Array(12).fill(0);

  (reqs || []).forEach(r => {
    const dStr = r.created_at || r.date_submitted || r.createdAt;
    if (dStr) {
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        counts[d.getMonth()]++;
      }
    }
  });

  const max = Math.max(...counts, 1);

  container.innerHTML = monthNames.map((name, i) => {
    const count = counts[i];
    const pct = count > 0 ? Math.max(18, (count / max) * 100) : 6;
    return `
      <div class="bar-col" title="${name}: ${count} requests">
        <div class="bar-col-fill" style="height: ${pct}%;"></div>
        <span class="bar-col-label">${name}</span>
      </div>
    `;
  }).join('');
}

window.exportAdminReportsPdf = function(reportTitle = 'CCA DocTrack Official Report') {
  const reqs = state.allRequests || [];
  const total = reqs.length;
  const pending = reqs.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
  const processing = reqs.filter(r => (r.status || '').toUpperCase() === 'PROCESSING').length;
  const approved = reqs.filter(r => ['APPROVED', 'COMPLETED'].includes((r.status || '').toUpperCase())).length;
  const released = reqs.filter(r => ['FOR RELEASE', 'RELEASED'].includes((r.status || '').toUpperCase())).length;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Please allow popups in your browser to generate PDF reports.', 'warning');
    return;
  }

  const rowsHtml = reqs.map((r, i) => {
    const id = r.tracking_number || (r._id ? ('REQ-' + r._id.substring(r._id.length - 5).toUpperCase()) : ('REQ-00' + (230 + (r.id || i + 1))));
    const sName = escapeHtml(r.student_name || r.studentName || 'Student');
    const sId = escapeHtml(r.student_id || r.studentId || '--');
    const course = escapeHtml(r.course || 'BSIT');
    const doc = escapeHtml(r.document_type || r.documentType || 'Official Document');
    const date = escapeHtml(formatDate(r.date_submitted || r.dateSubmitted || r.createdAt));
    const status = escapeHtml(r.status || 'Pending');

    return `
      <tr>
        <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0; font-family:monospace;">${id}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0; font-weight:600;">${sName}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0;">${sId}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0;">${course}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0;">${doc}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0;">${date}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #E2E8F0; font-weight:600;">${status}</td>
      </tr>
    `;
  }).join('');

  const reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(reportTitle)} - November 2026</title>
      <style>
        @page { size: A4 portrait; margin: 16mm 14mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0F172A; margin: 0; padding: 20px; font-size: 13px; }
        .report-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #2563EB; padding-bottom: 14px; margin-bottom: 20px; }
        .report-logo-text { font-size: 20px; font-weight: 800; color: #2563EB; }
        .report-sub { font-size: 12px; color: #64748B; margin-top: 3px; }
        .report-date { font-size: 12px; color: #334155; text-align: right; }
        .stat-cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .stat-card { border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; text-align: center; background: #F8FAFC; }
        .stat-val { font-size: 22px; font-weight: 700; color: #1E293B; }
        .stat-lbl { font-size: 11px; text-transform: uppercase; color: #64748B; margin-top: 4px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th { background: #F1F5F9; color: #475569; text-align: left; padding: 10px; font-weight: 700; border-bottom: 2px solid #CBD5E1; }
        .footer-sign { margin-top: 40px; display: flex; justify-content: space-between; }
        .sign-box { width: 220px; border-top: 1px solid #000; text-align: center; padding-top: 6px; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div>
          <div class="report-logo-text">CCA DocTrack &bull; Official Report</div>
          <div class="report-sub">City College of Angeles - Registrar Document Tracking System</div>
        </div>
        <div class="report-date">
          <strong>Generated Date:</strong> November 23, 2026<br>
          <strong>Report:</strong> ${escapeHtml(reportTitle)}
        </div>
      </div>

      <div class="stat-cards-row">
        <div class="stat-card">
          <div class="stat-val">${total}</div>
          <div class="stat-lbl">Total Requests</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${pending}</div>
          <div class="stat-lbl">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${approved}</div>
          <div class="stat-lbl">Approved</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">${released}</div>
          <div class="stat-lbl">For Release</div>
        </div>
      </div>

      <h3 style="margin-bottom:8px; font-size:15px; color:#1E293B;">Summary of Document Requests</h3>
      <table>
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Student Name</th>
            <th>Student ID</th>
            <th>Course</th>
            <th>Document Type</th>
            <th>Date Submitted</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748B;">No request records found.</td></tr>'}
        </tbody>
      </table>

      <div class="footer-sign">
        <div class="sign-box">
          <strong>${escapeHtml(state.currentUser?.fullName || 'Office of the College Registrar')}</strong><br>
          CCA System Administrator
        </div>
        <div class="sign-box">
          <strong>Office of the Registrar</strong><br>
          City College of Angeles
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(reportHtml);
  printWindow.document.close();
  addAdminAuditLog(`Exported PDF report: "${reportTitle}"`, 'SECURITY');
  showToast('Official PDF report generated.', 'info');
};

function addAdminAuditLog(action, type = 'STATUS') {
  try {
    const logs = JSON.parse(localStorage.getItem('cca_audit_logs') || '[]');
    const user = state.currentUser || {};
    const newLog = {
      id: 'log_' + Date.now(),
      time: 'Just now',
      timestamp: new Date().toISOString(),
      user: user.email || 'admin@cca.edu.ph',
      action: action,
      module: type === 'STATUS' ? 'Requests' : (type === 'SECURITY' ? 'Security' : 'Announcements'),
      type: type,
      details: action,
      ip: '192.168.1.10',
      status: 'Success'
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();
    localStorage.setItem('cca_audit_logs', JSON.stringify(logs));
  } catch (e) {}
}

function renderAdminAuditLogs() {
  const tbody = document.getElementById('adminAuditTableBody');
  if (!tbody) return;

  const search = document.getElementById('adminAuditSearchInput')?.value.toLowerCase().trim() || '';
  const filter = document.getElementById('adminAuditFilter')?.value || 'ALL';
  const moduleFilter = document.getElementById('adminAuditModuleFilter')?.value || 'ALL';

  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('cca_audit_logs') || '[]');
  } catch (e) {}

  if (logs.length === 0) {
    logs = [
      { id: 'log_init', time: 'Today ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }), timestamp: new Date().toISOString(), user: 'admin@cca.edu.ph', action: 'Synchronized live records with database', module: 'System', type: 'CONFIG', details: 'Database connection verified', ip: '192.168.1.10', status: 'Success' }
    ];
  }

  const total = logs.length;
  const userActions = logs.filter(l => l.module === 'Requests' || l.type === 'STATUS' || l.type === 'USER').length;
  const sysEvents = logs.filter(l => l.module === 'System' || l.type === 'CONFIG' || l.module === 'Announcements').length;
  const secEvents = logs.filter(l => l.type === 'SECURITY' || l.module === 'Security').length;

  const elTot = document.getElementById('auditStatTotal'); if (elTot) elTot.textContent = total.toLocaleString();
  const elUsr = document.getElementById('auditStatUser'); if (elUsr) elUsr.textContent = userActions.toLocaleString();
  const elSys = document.getElementById('auditStatSystem'); if (elSys) elSys.textContent = sysEvents.toLocaleString();
  const elSec = document.getElementById('auditStatSecurity'); if (elSec) elSec.textContent = secEvents.toLocaleString();

  const filtered = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.type === filter;
    const matchesModule = moduleFilter === 'ALL' || (log.module || '').toUpperCase() === moduleFilter.toUpperCase();
    const matchesSearch = !search || (log.action || '').toLowerCase().includes(search) || (log.user || '').toLowerCase().includes(search) || (log.details || '').toLowerCase().includes(search);
    return matchesFilter && matchesModule && matchesSearch;
  });

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (auditCurrentPage > totalPages) auditCurrentPage = totalPages;
  const paged = filtered.slice((auditCurrentPage - 1) * pageSize, auditCurrentPage * pageSize);

  renderPagination('adminAuditPagination', 'adminAuditCountLabel', filtered.length, auditCurrentPage, pageSize, 'setAuditPage', 'logs');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No audit logs matching this event filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = paged.map((log, i) => {
    const rowNum = (auditCurrentPage - 1) * pageSize + i + 1;
    const timeDisplay = log.timestamp ? formatDate(log.timestamp) + ' ' + new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : log.time;

    return `
      <tr>
        <td style="color:#64748B; font-weight:600;">${rowNum}</td>
        <td><span style="color:#64748B; font-size:13px;">${escapeHtml(timeDisplay)}</span></td>
        <td><strong>${escapeHtml(log.user)}</strong></td>
        <td><span style="font-weight:500; color:#1E293B;">${escapeHtml(log.action)}</span></td>
        <td><code style="background:#F1F5F9; padding:2px 6px; border-radius:4px; font-size:12px; color:#475569;">${escapeHtml(log.module || 'System')}</code></td>
        <td style="color:#64748B; font-size:12.5px;">${escapeHtml(log.details || log.action)}</td>
        <td><code style="font-size:11.5px; color:#64748B;">${escapeHtml(log.ip || '192.168.1.10')}</code></td>
        <td><span class="admin-status-pill status-approved"><span class="pill-dot"></span><span>${escapeHtml(log.status || 'Success')}</span></span></td>
      </tr>
    `;
  }).join('');
}

function renderAdminTable() {
  const tbody = document.getElementById('adminAllRequestsTableBody');
  if (!tbody) return;

  const reqs = state.allRequests || [];
  const total = reqs.length;
  const pending = reqs.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
  const processing = reqs.filter(r => (r.status || '').toUpperCase() === 'PROCESSING').length;
  const completed = reqs.filter(r => ['APPROVED', 'COMPLETED', 'RELEASED', 'FOR RELEASE'].includes((r.status || '').toUpperCase())).length;

  const elTot = document.getElementById('manageStatTotal'); if (elTot) elTot.textContent = total.toLocaleString();
  const elPend = document.getElementById('manageStatPending'); if (elPend) elPend.textContent = pending.toLocaleString();
  const elProc = document.getElementById('manageStatProcessing'); if (elProc) elProc.textContent = processing.toLocaleString();
  const elComp = document.getElementById('manageStatCompleted'); if (elComp) elComp.textContent = completed.toLocaleString();

  const searchInput = document.getElementById('adminSearchInput');
  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const statusEl = document.getElementById('adminStatusFilter');
  const statusFilter = statusEl ? statusEl.value : 'ALL';
  const docTypeEl = document.getElementById('adminDocTypeFilter');
  const docTypeFilter = docTypeEl ? docTypeEl.value : 'ALL';

  const filtered = reqs.filter(r => {
    const s = r.status || 'Pending';
    const matchesStatus = statusFilter === 'ALL' || s.toUpperCase() === statusFilter.toUpperCase() || (statusFilter === 'Approved' && (s === 'Approved' || s === 'Completed'));
    const dType = (r.document_type || r.documentType || '').toLowerCase();
    const matchesDocType = docTypeFilter === 'ALL' || dType.includes(docTypeFilter.toLowerCase());
    const sName = (r.student_name || r.studentName || '').toLowerCase();
    const sId = (r.student_id || r.studentId || '').toLowerCase();
    const purp = (r.purpose || '').toLowerCase();
    const matchesSearch = !search || sName.includes(search) || sId.includes(search) || dType.includes(search) || purp.includes(search);
    return matchesStatus && matchesDocType && matchesSearch;
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (manageCurrentPage > totalPages) manageCurrentPage = totalPages;
  const paged = filtered.slice((manageCurrentPage - 1) * pageSize, manageCurrentPage * pageSize);

  renderPagination('adminManagePagination', 'adminRecordsCount', filtered.length, manageCurrentPage, pageSize, 'setManagePage', 'requests');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No document requests found matching filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = paged.map((req, index) => {
    const formattedDate = formatDate(req.date_submitted || req.dateSubmitted || req.createdAt);
    const shortId = req.tracking_number || (req._id ? ('REQ-' + req._id.substring(req._id.length - 5).toUpperCase()) : ('REQ-00' + (230 + (req.id || index + 1))));
    const status = req.status || 'Pending';
    let statusClass = 'pending';
    const sUp = status.toUpperCase();
    if (sUp.includes('APPROV') || sUp.includes('COMPLET')) statusClass = 'approved';
    else if (sUp.includes('PROCESS')) statusClass = 'processing';
    else if (sUp.includes('RELEASE')) statusClass = 'for-release';
    else if (sUp.includes('REJECT')) statusClass = 'rejected';

    const sName = req.student_name || req.studentName || 'Student';
    const sId = req.student_id || req.studentId || '--';
    const docType = req.document_type || req.documentType || 'Official Document';
    const purpose = req.purpose || 'Official Document Requirement';
    const reqIdentifier = req._id || req.id || req.tracking_number || shortId;

    return `
      <tr>
        <td><code class="ref-req-code">${escapeHtml(shortId)}</code></td>
        <td><strong>${escapeHtml(sName)}</strong></td>
        <td><code class="ref-req-code" style="color:#64748B;">${escapeHtml(sId)}</code></td>
        <td><span style="font-weight:500; color:#1E293B;">${escapeHtml(docType)}</span></td>
        <td><span style="color:#475569; font-size:13px;">${escapeHtml(purpose)}</span></td>
        <td style="color:#64748B; font-size:13px;">${escapeHtml(formattedDate)}</td>
        <td>
          <span class="admin-status-pill status-${statusClass}">
            <span class="pill-dot"></span>
            <span>${escapeHtml(status)}</span>
          </span>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="btn-table-pill" onclick="openRequestDetailsModal('${escapeHtml(reqIdentifier)}')">View</button>
            <button type="button" class="btn-table-pill" style="padding:4px 8px;" onclick="openAdminStatusMenu('${escapeHtml(reqIdentifier)}')">&bull;&bull;&bull;</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAdminStatusMenu = function(reqIdentifier) {
  const all = state.allRequests || [];
  const req = all.find(r => (
    r.tracking_number === reqIdentifier ||
    r._id === reqIdentifier ||
    String(r.id) === String(reqIdentifier) ||
    ('REQ-00' + (230 + (r.id || 1))) === reqIdentifier ||
    (r._id && ('REQ-' + r._id.substring(r._id.length - 5).toUpperCase()) === reqIdentifier)
  ));

  const modal = document.getElementById('modalAdminStatusChange');
  if (!modal) return;

  const targetId = req ? (req._id || req.id || req.tracking_number) : reqIdentifier;
  modal.setAttribute('data-request-id', targetId);

  const trackingDisplay = req ? (req.tracking_number || (req._id ? ('REQ-' + req._id.substring(req._id.length - 5).toUpperCase()) : ('REQ-00' + (230 + (req.id || 1))))) : targetId;
  const docType = req ? (req.document_type || req.documentType || 'Official Document') : 'Official Document';

  const subEl = document.getElementById('statusChangeSubtitle');
  if (subEl) subEl.textContent = `Update status for ${trackingDisplay} (${docType})`;

  const targetEl = document.getElementById('statusChangeTargetId');
  if (targetEl) targetEl.value = targetId;

  const sSel = document.getElementById('statusChangeSelect');
  if (sSel && req) {
    const curStatus = (req.status || 'Pending').trim().toLowerCase();
    for (let opt of sSel.options) {
      if (opt.value.trim().toLowerCase() === curStatus) {
        sSel.value = opt.value;
        break;
      }
    }
  }

  const pEl = document.getElementById('statusChangePickupDate');
  if (pEl) {
    let pVal = (req && (req.pickup_date || req.pickupDate)) ? (req.pickup_date || req.pickupDate) : '';
    if (pVal && pVal.length >= 10 && !isNaN(new Date(pVal).getTime())) {
      try {
        pEl.value = new Date(pVal).toISOString().split('T')[0];
      } catch (e) {
        pEl.value = pVal;
      }
    } else if (!pVal) {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      pEl.value = d.toISOString().split('T')[0];
    } else {
      pEl.value = pVal;
    }
  }

  const rEl = document.getElementById('statusChangeRemarks');
  if (rEl) rEl.value = (req && req.remarks) ? req.remarks : '';

  modal.style.display = 'flex';
};

window.openAdminStatusFromDetails = function() {
  const reqIdEl = document.getElementById('detailsModalReqId');
  const reqId = reqIdEl ? reqIdEl.textContent.trim() : null;
  if (reqId) {
    const modal = document.getElementById('modalRequestDetails');
    if (modal) modal.style.display = 'none';
    openAdminStatusMenu(reqId);
  }
};

window.quickUpdateStatusFromModal = async function(newStatus) {
  const reqIdEl = document.getElementById('detailsModalReqId');
  const reqId = reqIdEl ? reqIdEl.textContent.trim() : null;
  if (!reqId) return;

  const all = state.allRequests || [];
  const req = all.find(r => (
    r.tracking_number === reqId ||
    r._id === reqId ||
    String(r.id) === String(reqId) ||
    ('REQ-00' + (230 + (r.id || 1))) === reqId ||
    (r._id && ('REQ-' + r._id.substring(r._id.length - 5).toUpperCase()) === reqId)
  ));

  let pickupDate = req ? (req.pickup_date || req.pickupDate) : '';
  if (!pickupDate && (newStatus === 'Approved' || newStatus === 'For Release' || newStatus === 'Completed')) {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    pickupDate = d.toISOString().split('T')[0];
  }

  triggerAdminViewLoader();
  try {
    await updateRequestStatus(reqId, newStatus, pickupDate);
    let notifMsg = `Your request (${reqId}) status has been updated to "${newStatus}".`;
    if (pickupDate && (newStatus === 'Approved' || newStatus === 'For Release' || newStatus === 'Completed')) {
      notifMsg += ` Scheduled pickup: ${formatDate(pickupDate)} at Registrar Window 2.`;
    }
    pushStudentNotification({
      title: 'Document Request Updated',
      message: notifMsg,
      type: 'request',
      timestamp: new Date().toISOString()
    });
    if (typeof addAdminAuditLog === 'function') {
      const pText = pickupDate ? ` (Pickup: ${pickupDate})` : '';
      addAdminAuditLog(`Updated request #${reqId} status to ${newStatus}${pText}`, 'STATUS');
    }
    const modal = document.getElementById('modalRequestDetails');
    if (modal) modal.style.display = 'none';
    await fetchAllRequests();
    renderAdminTable();
    updateAdminDashboard();
    showToast(`Request ${reqId} set to "${newStatus}"`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

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
// Admin UI Helpers & Interactive Functionality
// ==========================================

function triggerAdminViewLoader() {
  const bar = document.getElementById('adminViewLoader');
  if (!bar) return;
  bar.classList.add('loading');
  setTimeout(() => {
    bar.classList.remove('loading');
  }, 450);
}

function restoreAdminDarkModeState() {
  const isDark = localStorage.getItem('cca_admin_dark_mode') === 'true' || localStorage.getItem('cca_dark_mode') === 'true';
  const toggle = document.getElementById('adminDarkModeToggle');
  if (toggle) toggle.checked = isDark;

  const portal = document.getElementById('viewAdminPortal');
  if (portal) portal.classList.toggle('student-dark-mode', isDark);
  document.body.classList.toggle('student-dark-mode', isDark);
}

function syncAdminProfileInfo() {
  const user = state.currentUser || {};
  const adminName = user.fullName || 'Office of the College Registrar';
  const adminEmail = user.email || 'admin@cca.edu.ph';
  const adminRole = user.role === 'admin' ? 'System Administrator' : (user.role || 'System Administrator');

  const heroGreet = document.getElementById('adminHeroGreetingName');
  if (heroGreet) heroGreet.textContent = adminName;

  const hero = document.getElementById('adminHeroName');
  if (hero) hero.textContent = adminName + '!';

  const sideName = document.getElementById('adminSidebarName');
  if (sideName) sideName.textContent = adminName;

  const sideMeta = document.getElementById('adminSidebarMeta');
  if (sideMeta) sideMeta.textContent = adminRole;

  const dropName = document.getElementById('adminDropdownUserName');
  if (dropName) dropName.textContent = adminName;

  const dropEmail = document.getElementById('adminDropdownUserEmail');
  if (dropEmail) dropEmail.textContent = adminEmail;

  // Sync the actual admin settings input fields
  const setFullName = document.getElementById('adminSettingsFullName');
  if (setFullName) setFullName.value = adminName;

  const setEmail = document.getElementById('adminSettingsEmail');
  if (setEmail) setEmail.value = adminEmail;

  const setContact = document.getElementById('adminSettingsContact');
  if (setContact && user.phone) setContact.value = user.phone;

  const inName = document.getElementById('adminInputFullName');
  if (inName) inName.value = adminName;

  const inEmail = document.getElementById('adminInputEmail');
  if (inEmail) inEmail.value = adminEmail;

  const inRole = document.getElementById('adminInputRole');
  if (inRole) inRole.value = adminRole;

  const lastUp = document.getElementById('adminSettingsLastUpdated');
  if (lastUp) {
    const now = new Date();
    lastUp.textContent = `Last updated: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }

  const initials = adminName
    ? (adminName.trim().split(/\s+/).length > 1
        ? (adminName.trim().split(/\s+/)[0][0] + adminName.trim().split(/\s+/)[1][0]).toUpperCase()
        : adminName.slice(0, 2).toUpperCase())
    : 'AR';

  const topAvatar = document.getElementById('adminTopbarAvatar');
  if (topAvatar) topAvatar.textContent = initials;

  const sideAvatar = document.getElementById('adminSidebarAvatar');
  if (sideAvatar) sideAvatar.textContent = initials;

  // Load avatar if stored in localStorage
  const savedAdminAvatar = localStorage.getItem('cca_admin_avatar');
  if (savedAdminAvatar) {
    applyAdminAvatarToElements(savedAdminAvatar);
  }
}

function applyAdminAvatarToElements(dataUrl) {
  const ids = ['adminSidebarAvatar', 'adminTopbarAvatar', 'adminSettingsAvatar'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.backgroundImage = 'url(' + dataUrl + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.textContent = '';
      const svg = el.querySelector('svg');
      if (svg) svg.style.display = 'none';
      const badge = el.querySelector('.avatar-edit-badge');
      if (badge) badge.style.display = 'flex';
    }
  });
}

async function initAdminRefPortal() {
  restoreAdminDarkModeState();

  // Fetch live fresh admin profile from Supabase database
  try {
    const ident = (state.currentUser && (state.currentUser.email || state.currentUser.id)) || 'admin@cca.edu.ph';
    const pRes = await fetch('/api/auth/profile?identifier=' + encodeURIComponent(ident));
    if (pRes.ok) {
      const pData = await pRes.json();
      if (pData && pData.success && pData.user) {
        if (!state.currentUser) state.currentUser = {};
        state.currentUser.fullName = pData.user.fullName;
        state.currentUser.email = pData.user.email;
        state.currentUser.role = pData.user.role || 'admin';
        state.currentUser.course = pData.user.course;
        localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));
      }
    }
  } catch (err) {
    console.warn('Could not refresh live admin profile:', err);
  }

  syncAdminProfileInfo();
  updateAdminDashboard();
  renderAdminTable();
  renderAdminStudentsTable();
  renderAdminAnnouncements();
  renderAdminReports();
  renderAdminAuditLogs();
}

function evalAdminPwStrength(pw) {
  const isLen = pw.length >= 8 && pw.length <= 64;
  const isUp = /[A-Z]/.test(pw);
  const isLow = /[a-z]/.test(pw);
  const isNumSpec = /[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw);

  document.getElementById('adminReqLength')?.classList.toggle('valid', isLen);
  document.getElementById('adminReqUpper')?.classList.toggle('valid', isUp);
  document.getElementById('adminReqLower')?.classList.toggle('valid', isLow);
  document.getElementById('adminReqNumber')?.classList.toggle('valid', isNumSpec);

  const score = (isLen ? 1 : 0) + (isUp ? 1 : 0) + (isLow ? 1 : 0) + (isNumSpec ? 1 : 0);

  const b1 = document.getElementById('adminStrBar1');
  const b2 = document.getElementById('adminStrBar2');
  const b3 = document.getElementById('adminStrBar3');
  const b4 = document.getElementById('adminStrBar4');
  const txt = document.getElementById('adminStrText');

  [b1, b2, b3, b4].forEach((b) => {
    if (b) b.className = 'str-bar';
  });

  if (!pw) {
    if (txt) {
      txt.textContent = '';
      txt.style.color = '#64748B';
    }
    return;
  }

  if (score <= 1) {
    if (b1) b1.classList.add('active-red');
    if (txt) {
      txt.textContent = 'Weak';
      txt.style.color = '#DC2626';
    }
  } else if (score === 2) {
    if (b1) b1.classList.add('active-yellow');
    if (b2) b2.classList.add('active-yellow');
    if (txt) {
      txt.textContent = 'Fair';
      txt.style.color = '#EAB308';
    }
  } else if (score === 3) {
    if (b1) b1.classList.add('active-green');
    if (b2) b2.classList.add('active-green');
    if (b3) b3.classList.add('active-green');
    if (txt) {
      txt.textContent = 'Good';
      txt.style.color = '#16A34A';
    }
  } else {
    [b1, b2, b3, b4].forEach((b) => b && b.classList.add('active-green'));
    if (txt) {
      txt.textContent = 'Strong';
      txt.style.color = '#16A34A';
    }
  }
}

function setupAdminRefPortalListeners() {

  // Sync Requests Button on Manage Requests
  document.getElementById('btnSyncAdminRequests')?.addEventListener('click', async () => {
    triggerAdminViewLoader();
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        state.allRequests = await res.json();
      }
    } catch (e) {}
    updateAdminDashboard();
    renderAdminTable();
    showToast('Database records synchronized successfully!', 'success');
  });

  // Filter Button on Manage Requests
  document.getElementById('btnAdminApplyManageFilter')?.addEventListener('click', () => {
    triggerAdminViewLoader();
    renderAdminTable();
  });

  // Filter Button on Manage Students
  document.getElementById('btnAdminApplyStudentFilter')?.addEventListener('click', () => {
    triggerAdminViewLoader();
    renderAdminStudentsTable();
  });

  // Filter Button on Announcements
  document.getElementById('btnAdminApplyAnnounceFilter')?.addEventListener('click', () => {
    triggerAdminViewLoader();
    renderAdminAnnouncements();
  });

  // Filter Button on Audit Logs
  document.getElementById('btnAdminApplyAuditFilter')?.addEventListener('click', () => {
    triggerAdminViewLoader();
    renderAdminAuditLogs();
  });

  // Modal: Add Student
  const addStudentModal = document.getElementById('modalAdminAddStudent');
  document.getElementById('btnOpenAddStudentModal')?.addEventListener('click', () => {
    if (addStudentModal) addStudentModal.style.display = 'flex';
  });
  document.getElementById('btnCloseAddStudent')?.addEventListener('click', () => {
    if (addStudentModal) addStudentModal.style.display = 'none';
  });
  document.getElementById('btnCancelAddStudent')?.addEventListener('click', () => {
    if (addStudentModal) addStudentModal.style.display = 'none';
  });
  document.getElementById('backdropAddStudent')?.addEventListener('click', () => {
    if (addStudentModal) addStudentModal.style.display = 'none';
  });
  document.getElementById('formAdminAddStudent')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const studentId = document.getElementById('adminNewStudentId')?.value.trim();
    const name = document.getElementById('adminNewStudentName')?.value.trim();
    const course = document.getElementById('adminNewStudentCourse')?.value || 'BSIT';
    const year = document.getElementById('adminNewStudentYear')?.value || '1st Year';

    if (!studentId || !name) {
      showToast('Student ID and Name are required.', 'error');
      return;
    }

    const newStudent = { studentId, name, course, year, status: 'Active' };
    try {
      const existing = JSON.parse(localStorage.getItem('cca_custom_students') || '[]');
      existing.unshift(newStudent);
      localStorage.setItem('cca_custom_students', JSON.stringify(existing));
    } catch (err) {}

    triggerAdminViewLoader();
    renderAdminStudentsTable();
    if (addStudentModal) addStudentModal.style.display = 'none';
    showToast('New student record saved successfully!', 'success');
  });

  // Modal: Create Announcement
  const createAnnModal = document.getElementById('modalAdminCreateAnnouncement');
  document.getElementById('btnAdminCreateAnnouncement')?.addEventListener('click', () => {
    if (createAnnModal) {
      const form = document.getElementById('formAdminCreateAnnouncement');
      if (form) {
        form.reset();
        form.removeAttribute('data-edit-id');
      }
      const titleEl = createAnnModal.querySelector('.modal-title');
      if (titleEl) titleEl.textContent = 'Create Campus Announcement';
      createAnnModal.style.display = 'flex';
    }
  });
  document.getElementById('btnCloseCreateAnnouncement')?.addEventListener('click', () => {
    if (createAnnModal) createAnnModal.style.display = 'none';
  });
  document.getElementById('btnCancelCreateAnnouncement')?.addEventListener('click', () => {
    if (createAnnModal) createAnnModal.style.display = 'none';
  });
  document.getElementById('backdropCreateAnnouncement')?.addEventListener('click', () => {
    if (createAnnModal) createAnnModal.style.display = 'none';
  });
  document.getElementById('formAdminCreateAnnouncement')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('adminNewAnnTitle')?.value.trim();
    const category = document.getElementById('adminNewAnnCategory')?.value || 'General';
    const status = document.getElementById('adminNewAnnStatus')?.value || 'Published';
    const message = document.getElementById('adminNewAnnContent')?.value.trim();
    const form = e.target;
    const editId = form.getAttribute('data-edit-id');

    if (!title || !message) {
      showToast('Title and message content are required.', 'error');
      return;
    }

    let existing = [];
    try {
      existing = JSON.parse(localStorage.getItem('cca_announcements') || '[]');
    } catch (err) {}

    if (editId) {
      const target = existing.find(a => a.id === editId || ('ann_' + a.id) === editId);
      if (target) {
        target.title = title;
        target.category = category;
        target.status = status;
        target.message = message;
        addAdminAuditLog(`Updated announcement: "${title}"`, 'ANNOUNCEMENT');
      }
      form.removeAttribute('data-edit-id');
      const titleEl = document.getElementById('adminAnnModalTitle');
      if (titleEl) titleEl.textContent = 'Create Campus Announcement';
      showToast('Announcement updated successfully!', 'success');
    } else {
      const newAnn = {
        id: 'ann_' + Date.now(),
        title,
        category,
        status,
        message,
        timestamp: new Date().toISOString()
      };
      existing.unshift(newAnn);

      if (status === 'Published') {
        pushStudentNotification({
          title: 'Announcement: ' + title,
          message: message,
          type: 'announcement',
          timestamp: new Date().toISOString()
        });
        addAdminAuditLog(`Published announcement: "${title}"`, 'ANNOUNCEMENT');
      }
      showToast('Announcement published successfully!', 'success');
    }

    localStorage.setItem('cca_announcements', JSON.stringify(existing));
    triggerAdminViewLoader();
    renderAdminAnnouncements();
    form.reset();
    if (createAnnModal) createAnnModal.style.display = 'none';
  });

  // Modal: View Announcement Close Handlers
  const viewAnnModal = document.getElementById('modalAdminViewAnnouncement');
  const closeViewAnn = () => {
    if (viewAnnModal) viewAnnModal.style.display = 'none';
  };
  document.getElementById('btnCloseViewAnnouncement')?.addEventListener('click', closeViewAnn);
  document.getElementById('btnCloseViewAnnBtn')?.addEventListener('click', closeViewAnn);
  document.getElementById('backdropViewAnnouncement')?.addEventListener('click', closeViewAnn);

  // Modal: Admin Status Change Quick Modal
  const statusModal = document.getElementById('modalAdminStatusChange');
  const closeStatusModal = () => {
    if (statusModal) statusModal.style.display = 'none';
  };
  document.getElementById('btnCloseStatusChangeModal')?.addEventListener('click', closeStatusModal);
  document.getElementById('btnCancelStatusChangeModal')?.addEventListener('click', closeStatusModal);
  document.getElementById('backdropAdminStatusChange')?.addEventListener('click', closeStatusModal);

  document.getElementById('btnSaveStatusChangeModal')?.addEventListener('click', async () => {
    const targetId = document.getElementById('statusChangeTargetId')?.value || statusModal?.getAttribute('data-request-id');
    const newStatus = document.getElementById('statusChangeSelect')?.value;
    const pickupDate = document.getElementById('statusChangePickupDate')?.value;
    const remarks = document.getElementById('statusChangeRemarks')?.value.trim();

    if (!targetId || !newStatus) return;

    triggerAdminViewLoader();
    try {
      await updateRequestStatus(targetId, newStatus, pickupDate);
      let notifMsg = `Your request (${targetId}) status has been updated to "${newStatus}".`;
      if (pickupDate && (newStatus === 'Approved' || newStatus === 'For Release' || newStatus === 'Completed')) {
        notifMsg += ` Scheduled pickup: ${formatDate(pickupDate)} at Registrar Window 2.`;
      }
      pushStudentNotification({
        title: 'Document Request Updated',
        message: notifMsg,
        type: 'request',
        timestamp: new Date().toISOString()
      });
      const pLog = pickupDate ? ` (Pickup: ${pickupDate})` : '';
      addAdminAuditLog(`Updated request #${targetId} status to ${newStatus}${pLog}`, 'STATUS');
      closeStatusModal();
      await fetchAllRequests();
      renderAdminTable();
      updateAdminDashboard();
      showToast(`Request ${targetId} status updated to "${newStatus}"`, 'success');
    } catch (err) {
      showToast('Error updating status: ' + err.message, 'error');
    }
  });

  // Settings Save & Photo upload
  async function handleSaveAdminProfileAndSettings() {
    const full = document.getElementById('adminSettingsFullName')?.value.trim();
    const email = document.getElementById('adminSettingsEmail')?.value.trim();
    const contact = document.getElementById('adminSettingsContact')?.value.trim();

    if (!full) {
      showToast('Administrator full name cannot be empty.', 'error');
      return;
    }
    if (!email) {
      showToast('Administrator email address cannot be empty.', 'error');
      return;
    }

    triggerAdminViewLoader();

    // Use current session's email / user id as identifier before updating
    const currentIdent = (state.currentUser && (state.currentUser.email || state.currentUser.id || state.currentUser.studentId)) || 'admin@cca.edu.ph';

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: currentIdent,
          fullName: full,
          email: email,
          role: 'admin'
        })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Database update failed.');
      }

      if (!state.currentUser) state.currentUser = {};
      state.currentUser.fullName = resData.user.fullName || full;
      state.currentUser.email = resData.user.email || email;
      if (contact) state.currentUser.phone = contact;
      localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));

      syncAdminProfileInfo();
      addAdminAuditLog(`Updated administrator profile: ${full} (${email})`, 'CONFIG');
      showToast('Admin details updated successfully in Supabase database!', 'success');
    } catch (err) {
      console.error('Admin profile update error:', err);
      showToast('Failed to save admin details in database: ' + err.message, 'error');
    }
  }

  document.getElementById('btnSaveAdminSettings')?.addEventListener('click', handleSaveAdminProfileAndSettings);
  document.getElementById('btnAdminUpdateProfile')?.addEventListener('click', handleSaveAdminProfileAndSettings);

  document.getElementById('btnAdminChangePhoto')?.addEventListener('click', () => {
    document.getElementById('adminPhotoUploadInput')?.click();
  });
  document.getElementById('adminSettingsAvatar')?.addEventListener('click', () => {
    document.getElementById('adminPhotoUploadInput')?.click();
  });

  document.getElementById('adminPhotoUploadInput')?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        openImageCropper(ev.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  // Reports Generation and PDF Exports
  document.getElementById('btnAdminGenerateReport')?.addEventListener('click', () => {
    exportAdminReportsPdf('Official Academic Document Tracking Report');
  });
  document.getElementById('btnAdminExportAuditLogs')?.addEventListener('click', () => {
    exportAdminReportsPdf('Audit Logs Report');
  });

  // Logout Modal Handlers
  document.getElementById('btnConfirmLogoutModal')?.addEventListener('click', performLogoutWithLoading);
  document.getElementById('btnCancelLogoutModal')?.addEventListener('click', () => {
    const m = document.getElementById('modalConfirmLogout');
    if (m) m.style.display = 'none';
  });
  document.getElementById('backdropConfirmLogout')?.addEventListener('click', () => {
    const m = document.getElementById('modalConfirmLogout');
    if (m) m.style.display = 'none';
  });

  // 1. Sidebar Nav & Tab Switching
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-admin-tab]');
    if (tabBtn) {
      const tabName = tabBtn.getAttribute('data-admin-tab');
      if (tabName) {
        switchAdminSubtab(tabName);
        const drop = document.getElementById('adminUserDropdown');
        if (drop) drop.classList.remove('show');
      }
    }
  });

  // 2. Notification Bell
  const bellBtn = document.getElementById('btnAdminTopbarBell');
  const notifDropdown = document.getElementById('adminNotifDropdown');
  const bellBadge = document.getElementById('adminBellBadge');

  if (bellBtn && notifDropdown) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (bellBadge) bellBadge.style.display = 'none';
      notifDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!bellBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('show');
      }
    });

    document.getElementById('btnClearAdminNotifs')?.addEventListener('click', () => {
      notifDropdown.querySelectorAll('.notif-item.unread').forEach((item) => item.classList.remove('unread'));
      showToast('Admin notifications marked as read.', 'info');
      notifDropdown.classList.remove('show');
    });
  }

  // 3. User Chip Dropdown
  const userChip = document.getElementById('adminUserChip');
  const userDropdown = document.getElementById('adminUserDropdown');
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

  // Topbar Dropdown Logout & Sidebar Logout Button
  document.getElementById('btnAdminDropdownLogout')?.addEventListener('click', () => {
    handleLogout();
  });
  document.getElementById('adminSidebarLogoutBtn')?.addEventListener('click', () => {
    handleLogout();
  });

  // 4. Global Search in Topbar
  const globalSearch = document.getElementById('adminGlobalSearch');
  if (globalSearch) {
    const doGlobalSearch = () => {
      const q = globalSearch.value.trim();
      switchAdminSubtab('manage');
      const inEl = document.getElementById('adminSearchInput');
      if (inEl) {
        inEl.value = q;
        applyAdminFilters();
      }
    };

    globalSearch.addEventListener('input', () => {
      if (state.adminActiveTab === 'manage') {
        const inEl = document.getElementById('adminSearchInput');
        if (inEl) {
          inEl.value = globalSearch.value;
          applyAdminFilters();
        }
      }
    });

    globalSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doGlobalSearch();
      }
    });
  }

  // 5. Dashboard View All Buttons
  document.getElementById('btnAdminViewAll')?.addEventListener('click', () => {
    switchAdminSubtab('manage');
  });
  document.getElementById('btnAdminRecentViewAll')?.addEventListener('click', () => {
    switchAdminSubtab('manage');
  });
  document.getElementById('btnAdminActivitiesViewAll')?.addEventListener('click', () => {
    switchAdminSubtab('audit');
  });

  // 6. Time Range Filter on Dashboard
  document.getElementById('overviewTimeRange')?.addEventListener('change', () => {
    triggerAdminViewLoader();
    updateAdminDashboard();
  });

  // 7. Manage Requests Filters
  setupAdminFilters();

  // 8. Manage Students Filters & Reactivation Handlers
  document.getElementById('adminStudentSearchInput')?.addEventListener('input', renderAdminStudentsTable);
  document.getElementById('adminStudentProgramFilter')?.addEventListener('change', renderAdminStudentsTable);
  document.getElementById('adminStudentStatusFilter')?.addEventListener('change', renderAdminStudentsTable);
  document.getElementById('btnAdminApplyStudentFilter')?.addEventListener('click', renderAdminStudentsTable);
  document.getElementById('btnViewReactivationRequests')?.addEventListener('click', openReactivationRequestsModal);
  document.getElementById('btnCloseReactivationRequestsModal')?.addEventListener('click', closeReactivationRequestsModal);
  document.getElementById('btnCloseReactivationRequestsBtn')?.addEventListener('click', closeReactivationRequestsModal);
  document.getElementById('backdropReactivationRequests')?.addEventListener('click', closeReactivationRequestsModal);

  // Student Reactivation Request Modal Handlers
  document.getElementById('linkOpenReactivationFromLogin')?.addEventListener('click', () => {
    closeAuthModal();
    const loginEmailVal = document.getElementById('loginEmail')?.value.trim();
    openReactivationModal(loginEmailVal, loginEmailVal && loginEmailVal.includes('@') ? loginEmailVal : '');
  });
  document.getElementById('btnCloseReactivationModal')?.addEventListener('click', closeReactivationModal);
  document.getElementById('btnCancelReactivationModal')?.addEventListener('click', closeReactivationModal);
  document.getElementById('backdropRequestReactivation')?.addEventListener('click', closeReactivationModal);
  document.getElementById('formRequestReactivation')?.addEventListener('submit', handleReactivationSubmit);

  // 9. Announcements Form Submit
  const announceForm = document.getElementById('formAdminAnnouncement');
  if (announceForm) {
    announceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('announcementTitle')?.value.trim();
      const category = document.getElementById('announcementCategory')?.value || 'general';
      const audience = document.getElementById('announcementAudience')?.value || 'all';
      const message = document.getElementById('announcementMessage')?.value.trim();

      if (!title || !message) {
        showToast('Please provide both announcement title and message body.', 'error');
        return;
      }

      const newAnn = {
        id: 'ann_' + Date.now(),
        title,
        category,
        audience,
        message,
        timestamp: new Date().toISOString(),
        timeAgo: 'Just now'
      };

      try {
        const existing = JSON.parse(localStorage.getItem('cca_announcements') || '[]');
        existing.unshift(newAnn);
        localStorage.setItem('cca_announcements', JSON.stringify(existing));
      } catch (err) {}

      announceForm.reset();
      triggerAdminViewLoader();
      renderAdminAnnouncements();
      showToast('New announcement published successfully!', 'success');
    });
  }

  // 10. Reports PDF Export (Always PDF as requested)
  document.getElementById('btnExportReportCsv')?.addEventListener('click', () => {
    exportAdminReportsPdf('Document Requests Report');
  });

  // 11. Audit Logs Filter
  document.getElementById('adminAuditFilter')?.addEventListener('change', () => {
    renderAdminAuditLogs();
  });

  // 12. Settings: Save Administrator Account
  document.getElementById('btnSaveAdminAccount')?.addEventListener('click', () => {
    handleSaveAdminProfileAndSettings();
  });

  // 13. Settings: Dark Mode Toggle
  const adminDarkToggle = document.getElementById('adminDarkModeToggle');
  adminDarkToggle?.addEventListener('change', () => {
    const isDark = adminDarkToggle.checked;
    triggerAdminViewLoader();
    const portal = document.getElementById('viewAdminPortal');
    if (portal) portal.classList.toggle('student-dark-mode', isDark);
    document.body.classList.toggle('student-dark-mode', isDark);
    localStorage.setItem('cca_admin_dark_mode', isDark ? 'true' : 'false');
    localStorage.setItem('cca_dark_mode', isDark ? 'true' : 'false');
    showToast(isDark ? 'Dark mode enabled.' : 'Light mode enabled.', 'info');
  });

  // 14. Settings: Navigate to Change Password
  document.getElementById('btnAdminGoChangePassword')?.addEventListener('click', () => {
    switchAdminSubtab('change-password');
  });

  // 15. Change Password: Input strength & eye toggles & submission
  const adminNewPw = document.getElementById('adminNewPassword');
  const adminCurPw = document.getElementById('adminCurrentPassword');
  const adminConfPw = document.getElementById('adminConfirmNewPassword');

  const checkAdminPwMatch = () => {
    const matchEl = document.getElementById('adminPwMatchIndicator');
    if (!matchEl) return;
    const np = adminNewPw?.value || '';
    const cp = adminConfPw?.value || '';
    if (!cp) {
      matchEl.style.display = 'none';
      return;
    }
    matchEl.style.display = 'flex';
    if (np === cp) {
      matchEl.innerHTML = '<span style="color:#16A34A; display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Passwords match</span>';
    } else {
      matchEl.innerHTML = '<span style="color:#DC2626; display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Passwords do not match</span>';
    }
  };

  adminNewPw?.addEventListener('input', () => {
    evalAdminPwStrength(adminNewPw.value);
    checkAdminPwMatch();
  });
  adminConfPw?.addEventListener('input', checkAdminPwMatch);

  const togglePwVisibility = (btnId, inputId) => {
    document.getElementById(btnId)?.addEventListener('click', () => {
      const inEl = document.getElementById(inputId);
      if (inEl) {
        inEl.type = inEl.type === 'password' ? 'text' : 'password';
      }
    });
  };

  togglePwVisibility('btnToggleAdminCurPw', 'adminCurrentPassword');
  togglePwVisibility('btnToggleAdminNewPw', 'adminNewPassword');
  togglePwVisibility('btnToggleAdminConfPw', 'adminConfirmNewPassword');

  document.getElementById('btnCancelAdminChangePw')?.addEventListener('click', () => {
    switchAdminSubtab('settings');
  });

  const adminPwForm = document.getElementById('adminChangePasswordForm');
  if (adminPwForm) {
    adminPwForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const currentPassword = adminCurPw?.value.trim();
      const newPassword = adminNewPw?.value.trim();
      const confirmPassword = adminConfPw?.value.trim();

      if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill out all password fields.', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match.', 'error');
        return;
      }

      if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters long.', 'error');
        return;
      }

      if (newPassword.length > 64) {
        showToast('Password cannot exceed 64 characters.', 'error');
        return;
      }

      if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !(/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword))) {
        showToast('Password must contain upper, lower, and number/special char.', 'error');
        return;
      }

      const user = state.currentUser || {};
      const payload = {
        identifier: user.email || user.username || 'admin@cca.edu.ph',
        currentPassword,
        newPassword
      };

      try {
        triggerAdminViewLoader();
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message || 'Failed to update administrator password.');
        }

        showToast('Administrator password updated successfully!', 'success');
        adminPwForm.reset();
        evalAdminPwStrength('');

        setTimeout(() => {
          switchAdminSubtab('settings');
        }, 1000);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

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
  const cleanStr = (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) ? dateString + 'T00:00:00' : dateString;
  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
  if (!dateString) return '--';
  const cleanStr = (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) ? dateString + 'T00:00:00' : dateString;
  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) return dateString;
  const dateFormatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  if (String(dateString).includes('T') || String(dateString).includes(':') || String(dateString).includes(' ')) {
    const timeFormatted = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateFormatted} ${timeFormatted}`;
  }
  return dateFormatted;
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

async function initStudentRefPortal() {
  restoreDarkModeState();

  // Live refresh of student profile from Supabase database
  try {
    const sIdent = state.currentUser && (state.currentUser.studentId || state.currentUser.email || state.currentUser.id);
    if (sIdent) {
      const pRes = await fetch('/api/auth/profile?identifier=' + encodeURIComponent(sIdent));
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData && pData.success && pData.user) {
          if (!state.currentUser) state.currentUser = {};
          state.currentUser.fullName = pData.user.fullName;
          state.currentUser.email = pData.user.email;
          state.currentUser.course = pData.user.course;
          state.currentUser.role = pData.user.role || 'student';
          if (pData.user.studentId) state.currentUser.studentId = pData.user.studentId;
          localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));

          const key = 'cca_student_profile_' + (state.currentUser.studentId || 'default');
          const prof = {
            fullName: state.currentUser.fullName,
            email: state.currentUser.email,
            course: state.currentUser.course,
            studentId: state.currentUser.studentId
          };
          localStorage.setItem(key, JSON.stringify(prof));
          localStorage.setItem('cca_student_profile', JSON.stringify(prof));
        }
      }
    }
  } catch (err) {
    console.warn('Could not refresh live student profile:', err);
  }

  syncStudentRefProfile();
  renderStudentDashboardData();
  renderStudentTrackingCards();
  renderStudentHistoryTable();
  renderStudentNotifications();
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
    fullName: 'Jaynellan Almary O. Magpantay',
    studentId: '23-67894',
    course: 'BS Information Technology',
    email: 'jaynellan@cca.edu.ph'
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
    fullName: user.fullName || stored.fullName || 'Jaynellan Almary O. Magpantay',
    studentId: user.studentId || stored.studentId || '23-67894',
    course: user.course || stored.course || 'BS Information Technology',
    email: user.email || stored.email || 'jaynellan@cca.edu.ph'
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

function getEstimatedReleaseDate(baseDateStr) {
  const d = baseDateStr ? new Date(baseDateStr) : new Date();
  if (isNaN(d.getTime())) return 'Within 2–3 business days (Registrar Window 2)';
  const target = new Date(d);
  target.setDate(target.getDate() + 2);
  return `${formatDate(target.toISOString())} (Registrar Window 2)`;
}

function pushStudentNotification(notif) {
  try {
    const list = JSON.parse(localStorage.getItem('cca_student_notifications') || '[]');
    const newNotif = {
      id: 'notif_' + Date.now(),
      title: notif.title || 'New Notification',
      message: notif.message || '',
      type: notif.type || 'info',
      timeAgo: 'Just now',
      timestamp: notif.timestamp || new Date().toISOString(),
      unread: true
    };
    list.unshift(newNotif);
    localStorage.setItem('cca_student_notifications', JSON.stringify(list));
    renderStudentNotifications();
  } catch (e) {}
}

function renderStudentNotifications() {
  const container = document.getElementById('studentNotifDropdownList');
  const badge = document.getElementById('topbarBellBadge');
  const sidebarBadge = document.getElementById('studentSidebarNotifBadge');
  if (!container) return;

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('cca_student_notifications') || '[]');
  } catch (e) {}

  if (list.length === 0) {
    const userRequests = state.allRequests || [];
    if (userRequests.length > 0) {
      const topReq = userRequests[0];
      list = [
        {
          id: 'notif_init_1',
          title: `Request ${topReq.tracking_number || ('REQ-' + topReq.id)}`,
          message: `Current status is ${topReq.status || 'Pending'}.`,
          type: 'request',
          timeAgo: 'Today',
          unread: true
        }
      ];
    } else {
      list = [
        {
          id: 'notif_init_0',
          title: 'Welcome to CCA DocTrack',
          message: 'Your official document tracking and request portal is active.',
          type: 'announcement',
          timeAgo: 'Today',
          unread: true
        }
      ];
    }
    localStorage.setItem('cca_student_notifications', JSON.stringify(list));
  }

  const unreadCount = list.filter(n => n.unread).length;
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
  if (sidebarBadge) {
    if (unreadCount > 0) {
      sidebarBadge.textContent = unreadCount;
      sidebarBadge.style.display = 'inline-block';
    } else {
      sidebarBadge.style.display = 'none';
    }
  }

  container.innerHTML = list.map(item => {
    let iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    let tintClass = 'bg-blue-tint';
    if (item.type === 'request' || (item.title && item.title.includes('Approved'))) {
      iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      tintClass = 'bg-green-tint';
    } else if (item.type === 'alert') {
      iconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
      tintClass = 'bg-red-tint';
    }

    return `
      <div class="notif-item ${item.unread ? 'unread' : ''}" data-notif-id="${escapeHtml(item.id)}">
        <div class="notif-bullet-icon ${tintClass}">
          ${iconSvg}
        </div>
        <div class="notif-text-col">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.message)}</p>
          <span class="notif-time-ago">${escapeHtml(item.timeAgo || 'Recently')}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderStudentDashboardData() {
  const isStudent = state.currentUser && state.currentUser.role !== 'admin';
  const all = (isStudent && state.studentRequests !== undefined) ? (state.studentRequests || []) : (state.allRequests || []);
  const total = all.length;
  const inProcess = all.filter(r => (r.status || '').toUpperCase().includes('PROCESS')).length;
  const completed = all.filter(r => ['APPROVED', 'RELEASED', 'COMPLETED', 'FOR RELEASE'].includes((r.status || '').toUpperCase())).length;

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
      if (status.includes('APPROV') || status.includes('COMPLET')) { badgeClass = 'green'; statusLabel = status.includes('COMPLET') ? 'Completed' : 'Approved'; }
      else if (status.includes('PROCESS')) { badgeClass = 'blue'; statusLabel = 'Processing'; }
      else if (status.includes('RELEASE')) { badgeClass = 'purple'; statusLabel = 'For Release'; }

      const dateStr = formatDateTime(req.date_submitted || req.created_at || new Date().toISOString());

      return `
        <div class="recent-req-row">
          <div class="req-icon-box bg-blue-tint">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="req-main-info">
            <div class="req-type-title">${escapeHtml(req.document_type || 'Official Document')}</div>
            <div class="req-id-tag">${escapeHtml(req.tracking_number || ('REQ-' + req.id))} &bull; <span class="badge-status-pill ${badgeClass}">${statusLabel}</span></div>
          </div>
          <div class="req-date-text">${dateStr}</div>
        </div>
      `;
    }).join('');
  } else {
    listEl.innerHTML = `<div style="padding:20px; text-align:center; color:#64748B; font-size:13px;">No document requests submitted yet.</div>`;
  }
}

function renderStudentTrackingCards() {
  const isStudent = state.currentUser && state.currentUser.role !== 'admin';
  const all = (isStudent && state.studentRequests !== undefined) ? (state.studentRequests || []) : (state.allRequests || []);
  const container = document.getElementById('trackCardsList');
  if (!container) return;

  if (all.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:48px 16px; background:#FFFFFF; border-radius:16px; border:1px solid #E2E8F0; color:#64748B;">
        <svg style="width:48px;height:48px;color:#94A3B8;margin-bottom:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <h4 style="font-size:16px; font-weight:700; color:#1E293B; margin-bottom:6px;">No Document Requests Found</h4>
        <p style="font-size:13px; color:#64748B;">You have no active document requests. Click "Document Request" to create one.</p>
      </div>
    `;
    const elTot = document.getElementById('trackStatTotal'); if (elTot) elTot.textContent = '0';
    const elProc = document.getElementById('trackStatProcessing'); if (elProc) elProc.textContent = '0';
    const elApp = document.getElementById('trackStatApproved'); if (elApp) elApp.textContent = '0';
    const elRel = document.getElementById('trackStatForRelease'); if (elRel) elRel.textContent = '0';
    const elPend = document.getElementById('trackStatPending'); if (elPend) elPend.textContent = '0';
    return;
  }

  const itemsToRender = all.map(req => {
    const statusRaw = (req.status || 'PENDING').toUpperCase();
    let statusAttr = 'PENDING';
    let badgeClass = 'gray';
    let statusText = 'Pending';
    let claim = null;

    if (statusRaw.includes('APPROV')) {
      statusAttr = 'APPROVED';
      badgeClass = 'green';
      statusText = 'Approved';
      claim = (req.pickup_date || req.pickupDate)
        ? `${formatDate(req.pickup_date || req.pickupDate)} (Registrar Window 2)`
        : getEstimatedReleaseDate(req.date_submitted || req.created_at);
    } else if (statusRaw.includes('RELEASE')) {
      statusAttr = 'FOR_RELEASE';
      badgeClass = 'purple';
      statusText = 'For Release';
      claim = (req.pickup_date || req.pickupDate)
        ? `${formatDate(req.pickup_date || req.pickupDate)} (Registrar Window 2)`
        : 'Ready for Release (Registrar Window 2)';
    } else if (statusRaw.includes('COMPLET')) {
      statusAttr = 'COMPLETED';
      badgeClass = 'green';
      statusText = 'Completed';
      claim = (req.pickup_date || req.pickupDate)
        ? `Claimed on ${formatDate(req.pickup_date || req.pickupDate)}`
        : 'Claimed / Released';
    } else if (statusRaw.includes('PROCESS')) {
      statusAttr = 'PROCESSING';
      badgeClass = 'blue';
      statusText = 'Processing';
    }

    const reqId = req.tracking_number || (req._id ? ('REQ-' + req._id.substring(req._id.length - 5).toUpperCase()) : ('REQ-00' + (230 + (req.id || 1))));
    const dateSubmitted = req.date_submitted || req.created_at || new Date().toISOString();
    const dateStr = formatDateTime(dateSubmitted);
    const updatedDate = formatDateTime(req.updated_at || dateSubmitted);

    return {
      id: reqId,
      doc: req.document_type || 'Official Document',
      date: dateStr,
      purpose: req.purpose || 'Official Document Requirement',
      remarks: req.remarks || 'N/A',
      status: statusAttr,
      statusText: statusText,
      statusDate: updatedDate,
      badge: badgeClass,
      claimDate: claim
    };
  });

  // Update Stats counts
  const total = itemsToRender.length;
  const proc = itemsToRender.filter(r => r.status === 'PROCESSING').length;
  const apprv = itemsToRender.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length;
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
        ${card.claimDate ? `<div class="track-receive-date"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> When to Receive: <strong>${escapeHtml(card.claimDate)}</strong></div>` : ''}
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
  const isStudent = state.currentUser && state.currentUser.role !== 'admin';
  const all = (isStudent && state.studentRequests !== undefined) ? (state.studentRequests || []) : (state.allRequests || []);
  const tbody = document.getElementById('studentHistoryTableBody');
  if (!tbody) return;

  if (all.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No request history found.</td></tr>`;
    return;
  }

  const rowsToRender = all.map(req => {
    const statusRaw = (req.status || 'PENDING').toUpperCase();
    let badgeClass = 'gray';
    let statusText = 'Pending';
    let statusKey = 'PENDING';
    let claim = null;

    if (statusRaw.includes('APPROV')) {
      badgeClass = 'green';
      statusText = 'Approved';
      statusKey = 'APPROVED';
      claim = (req.pickup_date || req.pickupDate)
        ? `${formatDate(req.pickup_date || req.pickupDate)} (Window 2)`
        : getEstimatedReleaseDate(req.date_submitted || req.created_at);
    } else if (statusRaw.includes('RELEASE')) {
      badgeClass = 'purple';
      statusText = 'For Release';
      statusKey = 'FOR_RELEASE';
      claim = (req.pickup_date || req.pickupDate)
        ? `${formatDate(req.pickup_date || req.pickupDate)} (Window 2)`
        : 'Ready for Release (Window 2)';
    } else if (statusRaw.includes('COMPLET')) {
      badgeClass = 'green';
      statusText = 'Completed';
      statusKey = 'COMPLETED';
      claim = (req.pickup_date || req.pickupDate)
        ? `Claimed on ${formatDate(req.pickup_date || req.pickupDate)}`
        : 'Claimed / Released';
    } else if (statusRaw.includes('PROCESS')) {
      badgeClass = 'blue';
      statusText = 'Processing';
      statusKey = 'PROCESSING';
    }

    const reqId = req.tracking_number || (req._id ? ('REQ-' + req._id.substring(req._id.length - 5).toUpperCase()) : ('REQ-00' + (230 + (req.id || 1))));
    const dateSubmitted = req.date_submitted || req.created_at || new Date().toISOString();
    const dateStr = formatDateTime(dateSubmitted);

    return {
      id: reqId,
      doc: req.document_type || 'Official Document',
      date: dateStr,
      status: statusKey,
      statusText: statusText,
      badge: badgeClass,
      claim: claim
    };
  });

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

  const isStudent = state.currentUser && state.currentUser.role !== 'admin';
  const pool = (isStudent && state.studentRequests !== undefined) ? (state.studentRequests || []) : (state.allRequests || []);
  const req = pool.find(r => (
    r.tracking_number === reqId ||
    r._id === reqId ||
    String(r.id) === String(reqId) ||
    ('REQ-00' + (230 + (r.id || 1))) === reqId ||
    (r._id && ('REQ-' + r._id.substring(r._id.length - 5).toUpperCase()) === reqId)
  ));

  if (!req) {
    showToast('Document request details not found.', 'error');
    return;
  }

  const statusRaw = (req.status || 'PENDING').toUpperCase();
  let badgeClass = 'green';
  let statusText = 'Approved';
  let isComplete = false;

  if (statusRaw.includes('APPROV') || statusRaw.includes('COMPLET')) {
    badgeClass = 'green';
    statusText = statusRaw.includes('COMPLET') ? 'Completed' : 'Approved';
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

  const trackingDisplay = req.tracking_number || (req._id ? ('REQ-' + req._id.substring(req._id.length - 5).toUpperCase()) : ('REQ-00' + (230 + (req.id || 1))));
  document.getElementById('detailsModalReqId').textContent = trackingDisplay;
  const badgeEl = document.getElementById('detailsModalBadge');
  badgeEl.className = 'badge-status-pill ' + badgeClass;
  badgeEl.innerHTML = '&bull; ' + statusText;

  document.getElementById('detailsModalDocType').textContent = req.document_type || req.documentType || 'Official Document';
  document.getElementById('detailsModalPurpose').textContent = req.purpose || 'Official Document Requirement';
  document.getElementById('detailsModalDate').textContent = formatDateTime(req.date_submitted || req.dateSubmitted || req.createdAt || new Date().toISOString());
  document.getElementById('detailsModalRemarks').textContent = req.remarks || 'None specified';

  // When to receive / Pickup Schedule: ONLY show once approved / completed as requested
  const claimRow = document.getElementById('detailsModalClaimRow');
  if (claimRow) {
    if (isComplete) {
      claimRow.style.display = 'flex';
      const pDate = req.pickup_date || req.pickupDate;
      if (pDate) {
        document.getElementById('detailsModalClaimDate').textContent = `${formatDate(pDate)} (Registrar Window 2)`;
      } else {
        document.getElementById('detailsModalClaimDate').textContent = getEstimatedReleaseDate(req.date_submitted || req.created_at);
      }
    } else {
      claimRow.style.display = 'none';
    }
  }

  // Toggle admin actions bar if logged in as admin
  const adminActions = document.getElementById('detailsModalAdminActions');
  if (adminActions) {
    adminActions.style.display = (state.currentUser && state.currentUser.role === 'admin') ? 'flex' : 'none';
  }

  const dateSub = req.date_submitted || req.created_at || new Date().toISOString();
  const subTimeStr = formatDateTime(dateSub);

  // Build timeline steps
  const tlEl = document.getElementById('detailsModalTimeline');
  tlEl.innerHTML = `
    <div class="timeline-step completed">
      <div class="step-circle">&#10003;</div>
      <div class="step-desc">
        <strong>1. Request Submitted</strong>
        <div class="text-muted">${subTimeStr} &bull; Student submission verified</div>
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
    <div class="timeline-step ${statusRaw.includes('RELEASE') || statusRaw.includes('COMPLET') ? 'completed' : ''}">
      <div class="step-circle">${statusRaw.includes('RELEASE') || statusRaw.includes('COMPLET') ? '&#10003;' : '4'}</div>
      <div class="step-desc">
        <strong>4. Document Released / Claimed</strong>
        <div class="text-muted">Claimed at Registrar Counter Window 2</div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

window.openRequestDetailsModal = openRequestDetailsModal;

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
    const adminPortal = document.getElementById('viewAdminPortal');
    const isAdmin = user.role === 'admin' || (adminPortal && adminPortal.classList.contains('active') && adminPortal.style.display !== 'none');

    if (isAdmin) {
      localStorage.setItem('cca_admin_avatar', croppedUrl);
      applyAdminAvatarToElements(croppedUrl);
      triggerAdminViewLoader();
      showToast('Admin profile photo cropped and updated successfully!', 'success');
    } else {
      const id = user.studentId || user.email || 'REQ-00234';
      localStorage.setItem('cca_student_avatar_' + id, croppedUrl);
      localStorage.setItem('cca_student_avatar', croppedUrl);
      applyAvatarToElements(croppedUrl);
      triggerStudentViewLoader();
      showToast('Profile photo cropped and saved successfully!', 'success');
    }

    if (modal) modal.style.display = 'none';
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

  // Sidebar Logout Button
  document.getElementById('studentSidebarLogoutBtn')?.addEventListener('click', () => {
    handleLogout();
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
      try {
        const notifs = JSON.parse(localStorage.getItem('cca_student_notifications') || '[]');
        notifs.forEach(n => { n.unread = false; });
        localStorage.setItem('cca_student_notifications', JSON.stringify(notifs));
      } catch (err) {}
    });

    document.addEventListener('click', (e) => {
      if (!bellBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('show');
      }
    });

    document.getElementById('btnClearNotifs')?.addEventListener('click', () => {
      document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
      try {
        const notifs = JSON.parse(localStorage.getItem('cca_student_notifications') || '[]');
        notifs.forEach(n => { n.unread = false; });
        localStorage.setItem('cca_student_notifications', JSON.stringify(notifs));
      } catch (err) {}
      if (bellBadge) bellBadge.style.display = 'none';
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
    const u = state.currentUser || {};
    const curName = u.fullName || (document.getElementById('personalFullName')?.textContent !== '---' ? document.getElementById('personalFullName')?.textContent : '') || '';
    const curEmail = u.email || (document.getElementById('personalEmail')?.textContent !== '---' ? document.getElementById('personalEmail')?.textContent : '') || '';
    const curProg = u.course || (document.getElementById('personalProgram')?.textContent !== '---' ? document.getElementById('personalProgram')?.textContent : '') || '';

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

  async function handleSaveStudentPersonalInfo(name, email, prog, modalEl = null) {
    if (!name || !email) {
      showToast('Name and Email are required.', 'error');
      return;
    }

    triggerStudentViewLoader();

    // Use current user's studentId, email, or id as identifier before updating
    const currentIdent = (state.currentUser && (state.currentUser.studentId || state.currentUser.email || state.currentUser.id)) || email;

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: currentIdent,
          fullName: name,
          email: email,
          course: prog,
          role: 'student'
        })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Database update failed.');
      }

      if (!state.currentUser) state.currentUser = {};
      state.currentUser.fullName = resData.user.fullName || name;
      state.currentUser.email = resData.user.email || email;
      state.currentUser.course = resData.user.course || prog;
      if (resData.user.studentId) state.currentUser.studentId = resData.user.studentId;
      localStorage.setItem('cca_auth_user', JSON.stringify(state.currentUser));

      const key = 'cca_student_profile_' + (state.currentUser?.studentId || 'default');
      const profile = {
        fullName: state.currentUser.fullName,
        email: state.currentUser.email,
        course: state.currentUser.course,
        studentId: state.currentUser.studentId
      };
      localStorage.setItem(key, JSON.stringify(profile));
      localStorage.setItem('cca_student_profile', JSON.stringify(profile));

      syncStudentRefProfile();
      showToast('Student profile updated successfully in Supabase database!', 'success');
      if (modalEl) modalEl.style.display = 'none';
    } catch (err) {
      console.error('Student profile update error:', err);
      showToast('Failed to update student profile in database: ' + err.message, 'error');
    }
  }

  document.getElementById('btnSaveEditPersonal')?.addEventListener('click', async () => {
    const name = document.getElementById('modalInputFullName')?.value.trim();
    const email = document.getElementById('modalInputEmail')?.value.trim();
    const prog = document.getElementById('modalInputProgram')?.value;
    await handleSaveStudentPersonalInfo(name, email, prog, editModal);
  });

  // 10. Account Settings Save
  document.getElementById('btnSettingsSave')?.addEventListener('click', async () => {
    const full = document.getElementById('settingsInputFullName')?.value.trim();
    const email = document.getElementById('settingsInputEmail')?.value.trim();
    const prog = document.getElementById('settingsInputProgram')?.value;
    await handleSaveStudentPersonalInfo(full, email, prog);
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

  const checkStudentPwMatch = () => {
    const matchEl = document.getElementById('pwMatchIndicator');
    if (!matchEl) return;
    const np = newPwInput?.value || '';
    const cp = confPwInput?.value || '';
    if (!cp) {
      matchEl.style.display = 'none';
      return;
    }
    matchEl.style.display = 'flex';
    if (np === cp) {
      matchEl.innerHTML = '<span style="color:#16A34A; display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Passwords match</span>';
    } else {
      matchEl.innerHTML = '<span style="color:#DC2626; display:inline-flex; align-items:center; gap:5px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Passwords do not match</span>';
    }
  };

  function evalPwStrength(pw) {
    const isLen = pw.length >= 8 && pw.length <= 64;
    const isUp = /[A-Z]/.test(pw);
    const isLow = /[a-z]/.test(pw);
    const isNumSpec = /[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw);

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
    checkStudentPwMatch();
  });
  confPwInput?.addEventListener('input', checkStudentPwMatch);

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

      if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters long.', 'error');
        return;
      }

      if (newPassword.length > 64) {
        showToast('Password cannot exceed 64 characters.', 'error');
        return;
      }

      if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !(/[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword))) {
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
