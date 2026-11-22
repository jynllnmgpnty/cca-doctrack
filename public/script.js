/**
 * CCA DocTrack – Student Document Request Tracking System
 * Frontend Application Logic (Vanilla JavaScript)
 * Communicates with Node.js/Express REST API endpoints via fetch()
 */

// Application State
const state = {
  requests: [],
  filteredRequests: [],
  activeTab: 'dashboard',
  isDbConnected: false,
  isLoading: false
};

// DOM Element References
const elements = {
  // Navigation
  navButtons: document.querySelectorAll('.nav-item'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebarOverlay'),
  mobileToggle: document.getElementById('mobileSidebarToggle'),
  mobileClose: document.getElementById('mobileSidebarClose'),
  globalRefreshBtn: document.getElementById('globalRefreshBtn'),

  // Metric Cards
  cardTotalCount: document.getElementById('cardTotalCount'),
  cardPendingCount: document.getElementById('cardPendingCount'),
  cardProcessingCount: document.getElementById('cardProcessingCount'),
  cardCompletedCount: document.getElementById('cardCompletedCount'),

  // Quick Action Buttons
  btnQuickSubmit: document.getElementById('btnQuickSubmit'),
  btnViewAllRequests: document.getElementById('btnViewAllRequests'),

  // Recent Requests Table
  recentRequestsTableBody: document.getElementById('recentRequestsTableBody'),

  // Form Elements
  documentRequestForm: document.getElementById('documentRequestForm'),
  studentNameInput: document.getElementById('studentName'),
  studentIdInput: document.getElementById('studentId'),
  documentTypeSelect: document.getElementById('documentType'),
  dateSubmittedInput: document.getElementById('dateSubmitted'),
  purposeTextarea: document.getElementById('purpose'),
  btnResetForm: document.getElementById('btnResetForm'),
  btnSubmitForm: document.getElementById('btnSubmitForm'),
  submitSpinner: document.getElementById('submitSpinner'),
  submitBtnText: document.getElementById('submitBtnText'),
  formAlert: document.getElementById('formAlert'),

  // Error Message Spans
  studentNameError: document.getElementById('studentNameError'),
  studentIdError: document.getElementById('studentIdError'),
  documentTypeError: document.getElementById('documentTypeError'),
  dateSubmittedError: document.getElementById('dateSubmittedError'),
  purposeError: document.getElementById('purposeError'),

  // Manage Tab Elements
  allRequestsTableBody: document.getElementById('allRequestsTableBody'),
  manageSearchInput: document.getElementById('manageSearchInput'),
  manageStatusFilter: document.getElementById('manageStatusFilter'),
  recordsCountText: document.getElementById('recordsCountText'),

  // System & Health Elements
  sidebarDbStatus: document.getElementById('sidebarDbStatus'),
  sysHealthBadge: document.getElementById('sysHealthBadge'),
  sysDbStatus: document.getElementById('sysDbStatus'),
  sysUptime: document.getElementById('sysUptime'),
  sysTimestamp: document.getElementById('sysTimestamp'),

  // Toast Container
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Set default date to today for the submission form (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  if (elements.dateSubmittedInput) {
    elements.dateSubmittedInput.value = today;
  }

  // Register Event Listeners
  setupNavigationListeners();
  setupFormListeners();
  setupManageFilterListeners();

  // Load Initial Data
  fetchHealthStatus();
  loadAllRequests();
});

// ==========================================
// Navigation & Tab Switching
// ==========================================
function setupNavigationListeners() {
  elements.navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
      closeMobileSidebar();
    });
  });

  if (elements.btnQuickSubmit) {
    elements.btnQuickSubmit.addEventListener('click', () => switchTab('submit'));
  }

  if (elements.btnViewAllRequests) {
    elements.btnViewAllRequests.addEventListener('click', () => switchTab('manage'));
  }

  if (elements.globalRefreshBtn) {
    elements.globalRefreshBtn.addEventListener('click', () => {
      elements.globalRefreshBtn.classList.add('rotating');
      fetchHealthStatus();
      loadAllRequests().finally(() => {
        setTimeout(() => {
          elements.globalRefreshBtn.classList.remove('rotating');
        }, 500);
      });
    });
  }

  // Mobile Drawer Controls
  if (elements.mobileToggle) {
    elements.mobileToggle.addEventListener('click', openMobileSidebar);
  }
  if (elements.mobileClose) {
    elements.mobileClose.addEventListener('click', closeMobileSidebar);
  }
  if (elements.sidebarOverlay) {
    elements.sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }
}

function switchTab(tabId) {
  state.activeTab = tabId;

  // Update Nav Buttons Active State
  elements.navButtons.forEach((btn) => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Tab Content Panes
  elements.tabPanes.forEach((pane) => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Update Topbar Titles
  const titles = {
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: 'Real-time status of student document processing'
    },
    submit: {
      title: 'Submit Document Request',
      subtitle: 'Enter student information to request official academic credentials'
    },
    manage: {
      title: 'Manage Requests',
      subtitle: 'Review submissions and update processing status'
    },
    system: {
      title: 'Cloud & System Info',
      subtitle: 'Platform infrastructure, database health, and REST API specification'
    }
  };

  if (titles[tabId]) {
    elements.pageTitle.textContent = titles[tabId].title;
    elements.pageSubtitle.textContent = titles[tabId].subtitle;
  }
}

function openMobileSidebar() {
  elements.sidebar.classList.add('open');
  elements.sidebarOverlay.classList.add('active');
}

function closeMobileSidebar() {
  elements.sidebar.classList.remove('open');
  elements.sidebarOverlay.classList.remove('active');
}

// ==========================================
// REST API Communication (Fetch)
// ==========================================

/**
 * Check backend and MongoDB Atlas connectivity via GET /api/health
 */
async function fetchHealthStatus() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();

    const isConnected = data.database && data.database.status === 'Connected';
    state.isDbConnected = isConnected;

    // Update Sidebar Database Indicator
    if (isConnected) {
      elements.sidebarDbStatus.className = 'db-status-badge connected';
      elements.sidebarDbStatus.querySelector('.status-label').textContent = 'Atlas Connected';
    } else {
      elements.sidebarDbStatus.className = 'db-status-badge disconnected';
      elements.sidebarDbStatus.querySelector('.status-label').textContent = 'Atlas Disconnected';
    }

    // Update System Info Tab
    if (elements.sysDbStatus) {
      elements.sysDbStatus.textContent = isConnected
        ? 'MongoDB Atlas (Connected)'
        : 'Disconnected (Check .env)';
    }
    if (elements.sysHealthBadge) {
      elements.sysHealthBadge.textContent = isConnected ? 'Operational' : 'Database Offline';
      elements.sysHealthBadge.className = isConnected ? 'badge badge-success' : 'badge badge-error';
    }
    if (elements.sysUptime && data.uptime) {
      elements.sysUptime.textContent = data.uptime;
    }
    if (elements.sysTimestamp && data.timestamp) {
      elements.sysTimestamp.textContent = new Date(data.timestamp).toLocaleString();
    }
  } catch (error) {
    console.warn('Health-check request failed:', error.message);
    state.isDbConnected = false;
    elements.sidebarDbStatus.className = 'db-status-badge disconnected';
    elements.sidebarDbStatus.querySelector('.status-label').textContent = 'API Offline';
  }
}

/**
 * Retrieve all document requests via GET /api/requests
 */
async function loadAllRequests() {
  try {
    const response = await fetch('/api/requests');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to retrieve records.');
    }

    state.requests = result.data || [];
    applyFilters();
    updateDashboardMetrics();
    renderRecentRequestsTable();
  } catch (error) {
    console.error('Error loading requests:', error);
    renderTableError(error.message);
  }
}

/**
 * Submit a new document request via POST /api/requests
 */
async function submitDocumentRequest(payload) {
  setSubmitLoading(true);
  clearFormAlert();

  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMsg = result.errors ? result.errors.join('<br>') : result.message;
      throw new Error(errorMsg || 'Failed to submit document request.');
    }

    // Submission Success
    showToast('Document request submitted successfully!', 'success');
    showFormAlert('Your document request has been submitted and saved to MongoDB Atlas.', 'success');
    elements.documentRequestForm.reset();
    elements.dateSubmittedInput.value = new Date().toISOString().split('T')[0];

    // Refresh application state
    await loadAllRequests();
  } catch (error) {
    console.error('Submission error:', error);
    showFormAlert(error.message, 'error');
    showToast(error.message.replace(/<br>/g, ', '), 'error');
  } finally {
    setSubmitLoading(false);
  }
}

/**
 * Update request status via PATCH /api/requests/:id
 */
async function updateRequestStatus(id, newStatus) {
  try {
    const response = await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update request status.');
    }

    showToast(`Status updated to "${newStatus}"`, 'success');
    await loadAllRequests();
  } catch (error) {
    console.error('Update status error:', error);
    showToast(error.message, 'error');
    // Reload to revert select UI in case of failure
    renderAllRequestsTable();
  }
}

// ==========================================
// Dashboard Metrics & Rendering
// ==========================================
function updateDashboardMetrics() {
  const requests = state.requests;

  const total = requests.length;
  const pending = requests.filter((r) => r.status === 'Pending').length;
  const processing = requests.filter((r) => r.status === 'Processing').length;
  const completed = requests.filter((r) => r.status === 'Completed').length;

  elements.cardTotalCount.textContent = total;
  elements.cardPendingCount.textContent = pending;
  elements.cardProcessingCount.textContent = processing;
  elements.cardCompletedCount.textContent = completed;
}

function renderRecentRequestsTable() {
  const tbody = elements.recentRequestsTableBody;
  if (!tbody) return;

  const recent = state.requests.slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">
          No document requests found. Click "New Request" to create one.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = recent
    .map((req) => {
      const formattedDate = formatDate(req.dateSubmitted || req.createdAt);
      const statusClass = (req.status || 'Pending').toLowerCase();

      return `
        <tr>
          <td><strong>${escapeHtml(req.studentName)}</strong></td>
          <td><code>${escapeHtml(req.studentId)}</code></td>
          <td>${escapeHtml(req.documentType)}</td>
          <td>${formattedDate}</td>
          <td>
            <span class="status-badge ${statusClass}">
              ${escapeHtml(req.status)}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderAllRequestsTable() {
  const tbody = elements.allRequestsTableBody;
  if (!tbody) return;

  const list = state.filteredRequests;
  elements.recordsCountText.textContent = `Showing ${list.length} of ${state.requests.length} requests`;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="table-empty">
          ${state.requests.length === 0 ? 'No document requests submitted yet.' : 'No requests match your search or filter.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list
    .map((req, index) => {
      const formattedDate = formatDate(req.dateSubmitted || req.createdAt);
      const shortId = req._id ? req._id.substring(req._id.length - 6).toUpperCase() : `#${index + 1}`;
      const statusClass = (req.status || 'Pending').toLowerCase();

      return `
        <tr>
          <td><code title="${req._id}">${shortId}</code></td>
          <td><strong>${escapeHtml(req.studentName)}</strong></td>
          <td><code>${escapeHtml(req.studentId)}</code></td>
          <td>${escapeHtml(req.documentType)}</td>
          <td title="${escapeHtml(req.purpose)}">
            ${escapeHtml(truncateText(req.purpose, 35))}
          </td>
          <td>${formattedDate}</td>
          <td>
            <span class="status-badge ${statusClass}">
              ${escapeHtml(req.status)}
            </span>
          </td>
          <td class="text-center">
            <select 
              class="status-select" 
              data-id="${req._id}" 
              onchange="handleStatusChange(event, '${req._id}')"
            >
              <option value="Pending" ${req.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Processing" ${req.status === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Completed" ${req.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderTableError(message) {
  const tbodyRecent = elements.recentRequestsTableBody;
  const tbodyAll = elements.allRequestsTableBody;

  const errorHtml = `
    <tr>
      <td colspan="8" class="table-empty" style="color: #DC2626;">
        ⚠️ ${escapeHtml(message)}<br>
        <small style="color: #6B7280;">Ensure MongoDB Atlas credentials in .env are configured and your IP is whitelisted.</small>
      </td>
    </tr>
  `;

  if (tbodyRecent) tbodyRecent.innerHTML = errorHtml;
  if (tbodyAll) tbodyAll.innerHTML = errorHtml;
}

// Global handler for the inline select element
window.handleStatusChange = function (event, requestId) {
  const newStatus = event.target.value;
  updateRequestStatus(requestId, newStatus);
};

// ==========================================
// Form Validation & Handling
// ==========================================
function setupFormListeners() {
  const form = elements.documentRequestForm;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      studentName: elements.studentNameInput.value.trim(),
      studentId: elements.studentIdInput.value.trim(),
      documentType: elements.documentTypeSelect.value,
      purpose: elements.purposeTextarea.value.trim(),
      dateSubmitted: elements.dateSubmittedInput.value
    };

    submitDocumentRequest(payload);
  });

  if (elements.btnResetForm) {
    elements.btnResetForm.addEventListener('click', () => {
      form.reset();
      clearValidationErrors();
      clearFormAlert();
      elements.dateSubmittedInput.value = new Date().toISOString().split('T')[0];
    });
  }

  // Real-time error removal on input
  elements.studentNameInput.addEventListener('input', () => clearFieldValidation(elements.studentNameInput, elements.studentNameError));
  elements.studentIdInput.addEventListener('input', () => clearFieldValidation(elements.studentIdInput, elements.studentIdError));
  elements.documentTypeSelect.addEventListener('change', () => clearFieldValidation(elements.documentTypeSelect, elements.documentTypeError));
  elements.purposeTextarea.addEventListener('input', () => clearFieldValidation(elements.purposeTextarea, elements.purposeError));
  elements.dateSubmittedInput.addEventListener('change', () => clearFieldValidation(elements.dateSubmittedInput, elements.dateSubmittedError));
}

function validateForm() {
  let isValid = true;
  clearValidationErrors();

  const nameVal = elements.studentNameInput.value.trim();
  const idVal = elements.studentIdInput.value.trim();
  const docVal = elements.documentTypeSelect.value;
  const purposeVal = elements.purposeTextarea.value.trim();
  const dateVal = elements.dateSubmittedInput.value;

  if (!nameVal) {
    setFieldError(elements.studentNameInput, elements.studentNameError, 'Please enter the student\'s full name.');
    isValid = false;
  }

  if (!idVal) {
    setFieldError(elements.studentIdInput, elements.studentIdError, 'Please enter the student ID number.');
    isValid = false;
  }

  if (!docVal) {
    setFieldError(elements.documentTypeSelect, elements.documentTypeError, 'Please select a document type.');
    isValid = false;
  }

  if (!purposeVal) {
    setFieldError(elements.purposeTextarea, elements.purposeError, 'Please state the purpose of this request.');
    isValid = false;
  }

  if (!dateVal) {
    setFieldError(elements.dateSubmittedInput, elements.dateSubmittedError, 'Please choose the date submitted.');
    isValid = false;
  }

  return isValid;
}

function setFieldError(inputElem, errorSpan, message) {
  inputElem.classList.add('input-error');
  errorSpan.textContent = message;
}

function clearFieldValidation(inputElem, errorSpan) {
  inputElem.classList.remove('input-error');
  errorSpan.textContent = '';
}

function clearValidationErrors() {
  clearFieldValidation(elements.studentNameInput, elements.studentNameError);
  clearFieldValidation(elements.studentIdInput, elements.studentIdError);
  clearFieldValidation(elements.documentTypeSelect, elements.documentTypeError);
  clearFieldValidation(elements.purposeTextarea, elements.purposeError);
  clearFieldValidation(elements.dateSubmittedInput, elements.dateSubmittedError);
}

function setSubmitLoading(isLoading) {
  state.isLoading = isLoading;
  elements.btnSubmitForm.disabled = isLoading;
  if (isLoading) {
    elements.submitSpinner.classList.remove('hidden');
    elements.submitBtnText.textContent = 'Submitting...';
  } else {
    elements.submitSpinner.classList.add('hidden');
    elements.submitBtnText.textContent = 'Submit Request';
  }
}

function showFormAlert(htmlMessage, type) {
  elements.formAlert.className = `form-alert ${type}`;
  elements.formAlert.innerHTML = htmlMessage;
  elements.formAlert.classList.remove('hidden');
}

function clearFormAlert() {
  elements.formAlert.innerHTML = '';
  elements.formAlert.classList.add('hidden');
}

// ==========================================
// Manage Filters & Search
// ==========================================
function setupManageFilterListeners() {
  if (elements.manageSearchInput) {
    elements.manageSearchInput.addEventListener('input', applyFilters);
  }
  if (elements.manageStatusFilter) {
    elements.manageStatusFilter.addEventListener('change', applyFilters);
  }
}

function applyFilters() {
  const searchTerm = elements.manageSearchInput ? elements.manageSearchInput.value.toLowerCase().trim() : '';
  const statusFilter = elements.manageStatusFilter ? elements.manageStatusFilter.value : 'ALL';

  state.filteredRequests = state.requests.filter((req) => {
    // Status Filter Matching
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;

    // Search Term Matching across Name, Student ID, and Document Type
    const matchesSearch =
      !searchTerm ||
      (req.studentName && req.studentName.toLowerCase().includes(searchTerm)) ||
      (req.studentId && req.studentId.toLowerCase().includes(searchTerm)) ||
      (req.documentType && req.documentType.toLowerCase().includes(searchTerm)) ||
      (req.purpose && req.purpose.toLowerCase().includes(searchTerm));

    return matchesStatus && matchesSearch;
  });

  renderAllRequestsTable();
}

// ==========================================
// Utilities & Toasts
// ==========================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-message">${escapeHtml(message)}</span>`;

  elements.toastContainer.appendChild(toast);

  // Automatically remove toast after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
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

function truncateText(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
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
