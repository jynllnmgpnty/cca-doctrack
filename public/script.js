/**
 * CCA DocTrack – Student Document Request Tracking System
 * City College of Angeles (CCA) Web Application
 * Client-Side Application Logic (ES6+ Vanilla JavaScript)
 */

// Application Global State
const state = {
  currentView: 'landing', // 'landing' | 'student' | 'admin'
  studentActiveTab: 'submit', // 'submit' | 'history' | 'profile'
  adminActiveTab: 'dashboard', // 'dashboard' | 'manage' | 'system'

  // Active Student Profile (Can be configured in Student Portal > Profile)
  activeStudent: {
    name: 'Juan Dela Cruz',
    id: '2023-00123',
    course: 'BS Information Technology'
  },

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

  // Navigation / Portal Switchers
  btnGoStudentPortalHeader: document.getElementById('btnGoStudentPortalHeader'),
  btnGoAdminPortalHeader: document.getElementById('btnGoAdminPortalHeader'),
  cardEnterStudentPortal: document.getElementById('cardEnterStudentPortal'),
  cardEnterAdminPortal: document.getElementById('cardEnterAdminPortal'),
  btnLandingBrand: document.getElementById('btnLandingBrand'),
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

  // Student Form Error Elements
  errStudentName: document.getElementById('errStudentName'),
  errStudentId: document.getElementById('errStudentId'),
  errDocumentType: document.getElementById('errDocumentType'),
  errDateSubmitted: document.getElementById('errDateSubmitted'),
  errPurpose: document.getElementById('errPurpose'),

  // Student Tracking & History Tab
  statStudentTotal: document.getElementById('statStudentTotal'),
  statStudentPending: document.getElementById('statStudentPending'),
  statStudentProcessing: document.getElementById('statStudentProcessing'),
  statStudentCompleted: document.getElementById('statStudentCompleted'),
  btnStudentRefreshHistory: document.getElementById('btnStudentRefreshHistory'),
  studentRequestsContainer: document.getElementById('studentRequestsContainer'),

  // Student Profile Tab Elements
  cardProfileName: document.getElementById('cardProfileName'),
  cardProfileId: document.getElementById('cardProfileId'),
  cardProfileCourse: document.getElementById('cardProfileCourse'),
  profileInputName: document.getElementById('profileInputName'),
  profileInputId: document.getElementById('profileInputId'),
  profileInputCourse: document.getElementById('profileInputCourse'),
  btnSaveStudentProfile: document.getElementById('btnSaveStudentProfile'),

  // Admin Portal Sidebar & Navigation
  adminNavItems: document.querySelectorAll('[data-admin-tab]'),
  adminSubtabs: document.querySelectorAll('.admin-subtab'),
  adminPageTitle: document.getElementById('adminPageTitle'),
  adminPageSubtitle: document.getElementById('adminPageSubtitle'),
  adminDbStatus: document.getElementById('adminDbStatus'),
  adminTotalBadge: document.getElementById('adminTotalBadge'),
  adminGlobalRefreshBtn: document.getElementById('adminGlobalRefreshBtn'),

  // Admin Dashboard Stat Cards
  cardTotalCount: document.getElementById('cardTotalCount'),
  cardPendingCount: document.getElementById('cardPendingCount'),
  cardProcessingCount: document.getElementById('cardProcessingCount'),
  cardCompletedCount: document.getElementById('cardCompletedCount'),
  btnAdminViewAll: document.getElementById('btnAdminViewAll'),
  adminRecentTableBody: document.getElementById('adminRecentTableBody'),

  // Admin Manage Table Elements
  adminSearchInput: document.getElementById('adminSearchInput'),
  adminStatusFilter: document.getElementById('adminStatusFilter'),
  adminAllRequestsTableBody: document.getElementById('adminAllRequestsTableBody'),
  adminRecordsCount: document.getElementById('adminRecordsCount'),

  // Admin System Info Elements
  adminSysHealthBadge: document.getElementById('adminSysHealthBadge'),
  adminSysDbStatus: document.getElementById('adminSysDbStatus'),

  // Mobile Toggles
  mobileStudentToggle: document.getElementById('mobileStudentToggle'),
  mobileStudentSidebarClose: document.getElementById('mobileStudentSidebarClose'),
  mobileAdminToggle: document.getElementById('mobileAdminToggle'),
  mobileAdminSidebarClose: document.getElementById('mobileAdminSidebarClose'),

  // Toast Container
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Load saved student profile from localStorage if exists
  loadSavedProfile();

  // Set default date to today (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  if (elements.formDateSubmitted) {
    elements.formDateSubmitted.value = today;
  }

  // Bind Event Listeners
  setupPortalSwitching();
  setupStudentNavigation();
  setupAdminNavigation();
  setupStudentForm();
  setupAdminFilters();
  setupMobileDrawers();

  // Check Database & Fetch initial records
  fetchHealthCheck();
  fetchAllRequests();
});

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (viewName === 'student') {
    elements.viewStudentPortal.classList.add('active');
    updateStudentProfileUI();
    filterStudentRequests();
  } else if (viewName === 'admin') {
    elements.viewAdminPortal.classList.add('active');
    updateAdminDashboard();
    renderAdminTable();
  }
}

function setupPortalSwitching() {
  // Landing Page Buttons
  if (elements.btnGoStudentPortalHeader) {
    elements.btnGoStudentPortalHeader.addEventListener('click', () => switchView('student'));
  }
  if (elements.cardEnterStudentPortal) {
    elements.cardEnterStudentPortal.addEventListener('click', () => switchView('student'));
  }

  if (elements.btnGoAdminPortalHeader) {
    elements.btnGoAdminPortalHeader.addEventListener('click', () => switchView('admin'));
  }
  if (elements.cardEnterAdminPortal) {
    elements.cardEnterAdminPortal.addEventListener('click', () => switchView('admin'));
  }

  // Back to Home Buttons
  if (elements.btnLandingBrand) {
    elements.btnLandingBrand.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('landing');
    });
  }
  if (elements.btnStudentBackToHome) {
    elements.btnStudentBackToHome.addEventListener('click', () => switchView('landing'));
  }
  if (elements.btnAdminBackToHome) {
    elements.btnAdminBackToHome.addEventListener('click', () => switchView('landing'));
  }

  // Cross Portal Switchers
  if (elements.btnStudentSwitchAdmin) {
    elements.btnStudentSwitchAdmin.addEventListener('click', () => switchView('admin'));
  }
  if (elements.btnAdminSwitchStudent) {
    elements.btnAdminSwitchStudent.addEventListener('click', () => switchView('student'));
  }
}

// ==========================================
// Student Portal Navigation & Subtabs
// ==========================================
function setupStudentNavigation() {
  elements.studentNavItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-student-tab');
      switchStudentSubtab(targetTab);
      closeMobileDrawers();
    });
  });

  if (elements.btnStudentRefreshHistory) {
    elements.btnStudentRefreshHistory.addEventListener('click', async () => {
      elements.btnStudentRefreshHistory.classList.add('rotating');
      await fetchAllRequests();
      showToast('Student requests refreshed from MongoDB Atlas', 'info');
      elements.btnStudentRefreshHistory.classList.remove('rotating');
    });
  }

  // Profile Save Button
  if (elements.btnSaveStudentProfile) {
    elements.btnSaveStudentProfile.addEventListener('click', handleSaveProfile);
  }
}

function switchStudentSubtab(tabName) {
  state.studentActiveTab = tabName;

  // Update Nav Buttons
  elements.studentNavItems.forEach((btn) => {
    if (btn.getAttribute('data-student-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Subtab Panes
  elements.studentSubtabs.forEach((pane) => {
    if (pane.id === `studentSubtab-${tabName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  const titles = {
    submit: {
      title: 'Submit Document Request',
      subtitle: 'Request official school certificates and credentials online'
    },
    history: {
      title: 'My Requests & Live Tracking',
      subtitle: `Tracking document requests for Student ID: ${state.activeStudent.id}`
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

// ==========================================
// Admin Portal Navigation & Subtabs
// ==========================================
function setupAdminNavigation() {
  elements.adminNavItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-admin-tab');
      switchAdminSubtab(targetTab);
      closeMobileDrawers();
    });
  });

  if (elements.btnAdminViewAll) {
    elements.btnAdminViewAll.addEventListener('click', () => switchAdminSubtab('manage'));
  }

  if (elements.adminGlobalRefreshBtn) {
    elements.adminGlobalRefreshBtn.addEventListener('click', async () => {
      elements.adminGlobalRefreshBtn.classList.add('rotating');
      await fetchAllRequests();
      await fetchHealthCheck();
      showToast('Data synchronized with MongoDB Atlas!', 'success');
      elements.adminGlobalRefreshBtn.classList.remove('rotating');
    });
  }
}

function switchAdminSubtab(tabName) {
  state.adminActiveTab = tabName;

  elements.adminNavItems.forEach((btn) => {
    if (btn.getAttribute('data-admin-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  elements.adminSubtabs.forEach((pane) => {
    if (pane.id === `adminSubtab-${tabName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
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
      subtitle: 'MongoDB Atlas connectivity, REST API endpoints, and IT 412 project specs'
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

/**
 * Fetch Backend & MongoDB Atlas Health Status via GET /api/health
 */
async function fetchHealthCheck() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();

    const isConnected = data.database && data.database.status === 'Connected';
    state.isDbConnected = isConnected;

    // Update Landing Page Indicator
    if (elements.landingDbIndicator) {
      elements.landingDbIndicator.className = isConnected ? 'db-indicator connected' : 'db-indicator disconnected';
      elements.landingDbIndicator.querySelector('.label').textContent = isConnected
        ? 'MongoDB Atlas Connected'
        : 'Cloud DB Disconnected';
    }

    // Update Admin Sidebar Status
    if (elements.adminDbStatus) {
      elements.adminDbStatus.className = isConnected ? 'db-status-badge connected' : 'db-status-badge disconnected';
      elements.adminDbStatus.querySelector('.status-label').textContent = isConnected
        ? 'Atlas Connected'
        : 'Atlas Disconnected';
    }

    if (elements.adminSysHealthBadge) {
      elements.adminSysHealthBadge.textContent = isConnected ? 'Operational' : 'Database Offline';
      elements.adminSysHealthBadge.className = isConnected ? 'badge badge-success' : 'badge badge-error';
    }
    if (elements.adminSysDbStatus) {
      elements.adminSysDbStatus.textContent = isConnected
        ? 'MongoDB Atlas (Connected)'
        : 'Disconnected (Check .env)';
    }
  } catch (error) {
    console.warn('Health check request failed:', error.message);
    state.isDbConnected = false;
    if (elements.landingDbIndicator) {
      elements.landingDbIndicator.className = 'db-indicator disconnected';
      elements.landingDbIndicator.querySelector('.label').textContent = 'API Offline';
    }
  }
}

/**
 * Fetch All Document Requests from MongoDB Atlas via GET /api/requests
 */
async function fetchAllRequests() {
  try {
    const response = await fetch('/api/requests');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch document requests.');
    }

    state.allRequests = result.data || [];

    // Update Badges & Counters
    if (elements.adminTotalBadge) {
      elements.adminTotalBadge.textContent = state.allRequests.length;
    }

    // Refresh Sub-Views
    updateAdminDashboard();
    renderAdminTable();
    filterStudentRequests();
  } catch (error) {
    console.error('Error fetching requests:', error.message);
    renderTableErrors(error.message);
  }
}

/**
 * Create a New Document Request via POST /api/requests
 */
async function submitDocumentRequest(payload) {
  setSubmitLoading(true);
  clearFormAlert();

  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMsg = result.errors ? result.errors.join('<br>') : result.message;
      throw new Error(errorMsg || 'Failed to submit document request.');
    }

    showToast('Document request submitted successfully!', 'success');
    showFormAlert('Your document request has been recorded and saved in MongoDB Atlas.', 'success');

    // Reset Form
    elements.studentRequestForm.reset();
    populateFormWithProfile();
    elements.formDateSubmitted.value = new Date().toISOString().split('T')[0];

    // Reload Requests & Auto-switch to History Tab so student sees their request immediately!
    await fetchAllRequests();

    setTimeout(() => {
      switchStudentSubtab('history');
      showToast('Switched to My Requests & Tracking view.', 'info');
    }, 1200);

  } catch (error) {
    console.error('Submission error:', error);
    showFormAlert(error.message, 'error');
    showToast(error.message.replace(/<br>/g, ', '), 'error');
  } finally {
    setSubmitLoading(false);
  }
}

/**
 * Update Document Request Status via PATCH /api/requests/:id
 */
async function updateRequestStatus(id, newStatus) {
  try {
    const response = await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update request status.');
    }

    showToast(`Status updated to "${newStatus}"`, 'success');
    await fetchAllRequests();
  } catch (error) {
    console.error('Update status error:', error);
    showToast(error.message, 'error');
    renderAdminTable();
  }
}

// ==========================================
// Student Subtab Logic & Tracking Stepper
// ==========================================
function filterStudentRequests() {
  const activeId = state.activeStudent.id.trim().toLowerCase();

  // Filter requests that match the active student ID
  state.studentRequests = state.allRequests.filter((req) => {
    return req.studentId && req.studentId.trim().toLowerCase() === activeId;
  });

  // Update Student Request Count Badge
  if (elements.studentMyRequestsBadge) {
    elements.studentMyRequestsBadge.textContent = state.studentRequests.length;
  }

  // Update Student Stat Pills
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
        <h4>No document requests found for ID: ${escapeHtml(state.activeStudent.id)}</h4>
        <p style="font-size:0.85rem;color:#64748B;margin-top:6px;">Go to "Submit Request" to file your first academic document request, or verify your Student ID in "My Profile".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.studentRequests
    .map((req, index) => {
      const formattedDate = formatDate(req.dateSubmitted || req.createdAt);
      const status = req.status || 'Pending';
      const shortId = req._id ? req._id.substring(req._id.length - 6).toUpperCase() : `#${index + 1}`;

      // Stepper Stage Logic
      let stepProgressClass = 'step-1';
      let step1Class = 'step-item completed';
      let step2Class = 'step-item';
      let step3Class = 'step-item';

      if (status === 'Pending') {
        stepProgressClass = 'step-1';
        step2Class = 'step-item active';
        step3Class = 'step-item';
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

          <!-- 3-Step Interactive Visual Stepper -->
          <div class="progress-stepper">
            <div class="stepper-line">
              <div class="stepper-progress ${stepProgressClass}"></div>
            </div>

            <!-- Step 1 -->
            <div class="${step1Class}">
              <div class="step-icon">✓</div>
              <span class="step-label">1. Request Submitted<br><small style="color:#64748B;">${formattedDate}</small></span>
            </div>

            <!-- Step 2 -->
            <div class="${step2Class}">
              <div class="step-icon">${status === 'Processing' || status === 'Completed' ? '✓' : '2'}</div>
              <span class="step-label">2. Under Review<br><small style="color:#64748B;">Registrar Office</small></span>
            </div>

            <!-- Step 3 -->
            <div class="${step3Class}">
              <div class="step-icon">${status === 'Completed' ? '✓' : '3'}</div>
              <span class="step-label">3. Ready for Release<br><small style="color:#64748B;">Registrar Window</small></span>
            </div>
          </div>

          <div class="tracking-footer-box">
            <span class="purpose-note"><strong>Stated Purpose:</strong> ${escapeHtml(req.purpose)}</span>
            <span style="color:#64748B;font-size:0.75rem;">Status updated live via MongoDB Atlas</span>
          </div>
        </div>
      `;
    })
    .join('');
}

// ==========================================
// Student Profile Management
// ==========================================
function loadSavedProfile() {
  const saved = localStorage.getItem('cca_student_profile');
  if (saved) {
    try {
      state.activeStudent = JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved profile');
    }
  }
}

function updateStudentProfileUI() {
  const s = state.activeStudent;

  // Sidebar Preview
  if (elements.sidebarStudentName) elements.sidebarStudentName.textContent = s.name;
  if (elements.sidebarStudentId) elements.sidebarStudentId.textContent = `ID: ${s.id}`;
  if (elements.sidebarStudentAvatar) {
    const initials = s.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    elements.sidebarStudentAvatar.textContent = initials || 'ST';
  }

  // Profile Card Preview
  if (elements.cardProfileName) elements.cardProfileName.textContent = s.name;
  if (elements.cardProfileId) elements.cardProfileId.textContent = `STUDENT ID: ${s.id}`;
  if (elements.cardProfileCourse) elements.cardProfileCourse.textContent = s.course;

  // Form Inputs
  if (elements.profileInputName) elements.profileInputName.value = s.name;
  if (elements.profileInputId) elements.profileInputId.value = s.id;
  if (elements.profileInputCourse) elements.profileInputCourse.value = s.course;

  // Populate Submission Form
  populateFormWithProfile();
}

function populateFormWithProfile() {
  if (elements.formStudentName && !elements.formStudentName.value) {
    elements.formStudentName.value = state.activeStudent.name;
  }
  if (elements.formStudentId && !elements.formStudentId.value) {
    elements.formStudentId.value = state.activeStudent.id;
  }
  if (elements.formCourse && state.activeStudent.course) {
    elements.formCourse.value = state.activeStudent.course;
  }
}

function handleSaveProfile() {
  const name = elements.profileInputName.value.trim();
  const id = elements.profileInputId.value.trim();
  const course = elements.profileInputCourse.value;

  if (!name || !id) {
    showToast('Name and Student ID cannot be empty', 'error');
    return;
  }

  state.activeStudent = { name, id, course };
  localStorage.setItem('cca_student_profile', JSON.stringify(state.activeStudent));

  updateStudentProfileUI();
  filterStudentRequests();
  showToast('Student profile and active ID updated successfully!', 'success');
}

// ==========================================
// Student Submission Form Validation
// ==========================================
function setupStudentForm() {
  const form = elements.studentRequestForm;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateStudentForm()) {
      return;
    }

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

  if (elements.btnStudentFormReset) {
    elements.btnStudentFormReset.addEventListener('click', () => {
      form.reset();
      clearStudentErrors();
      clearFormAlert();
      populateFormWithProfile();
      elements.formDateSubmitted.value = new Date().toISOString().split('T')[0];
    });
  }

  // Real-time error clearing
  elements.formStudentName.addEventListener('input', () => clearFieldValidation(elements.formStudentName, elements.errStudentName));
  elements.formStudentId.addEventListener('input', () => clearFieldValidation(elements.formStudentId, elements.errStudentId));
  elements.formDocumentType.addEventListener('change', () => clearFieldValidation(elements.formDocumentType, elements.errDocumentType));
  elements.formPurpose.addEventListener('input', () => clearFieldValidation(elements.formPurpose, elements.errPurpose));
  elements.formDateSubmitted.addEventListener('change', () => clearFieldValidation(elements.formDateSubmitted, elements.errDateSubmitted));
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
// Admin Portal Dashboard & Master Table
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
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No requests found in MongoDB Atlas.</td></tr>`;
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
  if (elements.adminSearchInput) {
    elements.adminSearchInput.addEventListener('input', applyAdminFilters);
  }
  if (elements.adminStatusFilter) {
    elements.adminStatusFilter.addEventListener('change', applyAdminFilters);
  }
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

// Global hook for inline select element in table
window.handleAdminStatusChange = function (event, requestId) {
  const newStatus = event.target.value;
  updateRequestStatus(requestId, newStatus);
};

// ==========================================
// Mobile Drawers
// ==========================================
function setupMobileDrawers() {
  const studentSidebar = document.querySelector('.portal-sidebar.student-theme');
  const adminSidebar = document.querySelector('.portal-sidebar.admin-theme');

  if (elements.mobileStudentToggle && studentSidebar) {
    elements.mobileStudentToggle.addEventListener('click', () => studentSidebar.classList.add('open'));
  }
  if (elements.mobileStudentSidebarClose && studentSidebar) {
    elements.mobileStudentSidebarClose.addEventListener('click', () => studentSidebar.classList.remove('open'));
  }

  if (elements.mobileAdminToggle && adminSidebar) {
    elements.mobileAdminToggle.addEventListener('click', () => adminSidebar.classList.add('open'));
  }
  if (elements.mobileAdminSidebarClose && adminSidebar) {
    elements.mobileAdminSidebarClose.addEventListener('click', () => adminSidebar.classList.remove('open'));
  }
}

function closeMobileDrawers() {
  document.querySelectorAll('.portal-sidebar').forEach((s) => s.classList.remove('open'));
}

// ==========================================
// Toast & Format Utilities
// ==========================================
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
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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
