/* global axios, bootstrap */
const BASE_API_URL = 'http://localhost/hospital_billing2/api/';
const TRANSACTIONS_API_URL = BASE_API_URL + 'transactions/';

class AdmissionManager {
  constructor() {
    this.apiUrl = TRANSACTIONS_API_URL + 'admission.php';
    this.admissions = [];
    this.patients = [];
    this.users = [];
    this.init();
  }

  async init() {
    await Promise.all([
      this.loadAdmissions(),
      this.loadPatients(),
      this.loadUsers()
    ]);
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('addAdmissionBtn')?.addEventListener('click', () => this.openModal('add'));
    const tbody = document.getElementById('admissionTableBody');
    if (tbody) {
      tbody.removeEventListener('click', this.handleTableClick);
      tbody.addEventListener('click', this.handleTableClick.bind(this));
    }

    // Add search button event listener
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.filterAdmissions());
    }
  }

  handleTableClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const admission = this.admissions.find(a => String(a.admissionid) === String(id));
    if (!admission) return;
    this.openModal(action, admission);
  }

  async loadAdmissions() {
    const tbody = document.getElementById('admissionTableBody');
    if (!tbody) return;
    tbody.innerHTML = this.loadingRow(5, 'Loading admissions...');
    try {
      const res = await axios.get(this.apiUrl, { params: { operation: 'getAllAdmissions' } });
      this.admissions = Array.isArray(res.data) ? res.data : [];
      this.renderTable();
      this.populateFilterDropdowns();
    } catch (err) {
      tbody.innerHTML = this.errorRow(5, err.message);
    }
  }

  populateFilterDropdowns() {
    // Populate patient filter
    const patientFilter = document.getElementById('patientFilter');
    if (patientFilter) {
      const uniquePatients = [...new Map(this.patients.map(p => [p.patientid, p])).values()];
      patientFilter.innerHTML = '<option value="">All Patients</option>' +
        uniquePatients.map(p => `<option value="${p.patientid}">${this.escape(p.fullname)}</option>`).join('');
    }

    // Populate user filter
    const userFilter = document.getElementById('userFilter');
    if (userFilter) {
      userFilter.innerHTML = '<option value="">All Users</option>' +
        this.users.map(u => `<option value="${u.userid}">${this.escape(u.fullname)}</option>`).join('');
    }

    // Set default dates for date filters (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');

    if (dateFromFilter) {
      dateFromFilter.value = thirtyDaysAgo.toISOString().split('T')[0];
    }

    if (dateToFilter) {
      dateToFilter.value = today.toISOString().split('T')[0];
    }
  }

  filterAdmissions() {
    const patientFilter = document.getElementById('patientFilter')?.value;
    const userFilter = document.getElementById('userFilter')?.value;
    const statusFilter = document.getElementById('statusFilter')?.value;
    const dateFromFilter = document.getElementById('dateFromFilter')?.value;
    const dateToFilter = document.getElementById('dateToFilter')?.value;

    const tbody = document.getElementById('admissionTableBody');
    if (!tbody) return;

    const filteredAdmissions = this.admissions.filter(a => {
      // Filter by patient
      if (patientFilter && String(a.patientid) !== String(patientFilter)) {
        return false;
      }

      // Filter by user
      if (userFilter && String(a.userid) !== String(userFilter)) {
        return false;
      }

      // Filter by status
      if (statusFilter && a.status !== statusFilter) {
        return false;
      }

      // Filter by date range
      if (dateFromFilter || dateToFilter) {
        const admissionDate = new Date(a.admission_date);

        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          if (admissionDate < fromDate) {
            return false;
          }
        }

        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999); // End of the day
          if (admissionDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });

    if (filteredAdmissions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No admissions found matching the filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filteredAdmissions.map(a => `
      <tr>
        <td><strong>${this.escape(a.patient_name)}</strong></td>
        <td>${this.escape(a.user_name)}</td>
        <td>${this.escape(this.formatDateTimeForDisplay(a.admission_date))}</td>
        <td><span class="${this.escape(a.status_class)}">${this.escape(a.status_label)}</span></td>
        <td>
          <div class="d-flex gap-2 flex-nowrap">
            <button class="btn btn-sm btn-info" data-id="${a.admissionid}" data-action="view" title="View"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-warning" data-id="${a.admissionid}" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger" data-id="${a.admissionid}" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async loadPatients() {
    try {
      const res = await axios.get(BASE_API_URL + 'patients.php', { params: { operation: 'getAll' } });
      this.patients = Array.isArray(res.data) ? res.data : [];
    } catch {
      this.patients = [];
    }
  }

  async loadUsers() {
    try {
      const res = await axios.get(BASE_API_URL + 'users.php', { params: { operation: 'getAllUsers' } });
      this.users = Array.isArray(res.data) ? res.data : [];
    } catch {
      this.users = [];
    }
  }

  renderTable() {
    const tbody = document.getElementById('admissionTableBody');
    if (!tbody) return;

    if (this.admissions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No admissions found.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.admissions.map(a => `
      <tr>
        <td><strong>${this.escape(a.patient_name)}</strong></td>
        <td>${this.escape(a.user_name)}</td>
        <td>${this.escape(this.formatDateTimeForDisplay(a.admission_date))}</td>
        <td><span class="${this.escape(a.status_class)}">${this.escape(a.status_label)}</span></td>
        <td>
          <div class="d-flex gap-2 flex-nowrap">
            <button class="btn btn-sm btn-info" data-id="${a.admissionid}" data-action="view" title="View"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-warning" data-id="${a.admissionid}" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger" data-id="${a.admissionid}" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  loadingRow(colspan, msg) {
    return `<tr><td colspan="${colspan}" class="text-center py-4">
      <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
      <p class="mt-2">${msg}</p>
    </td></tr>`;
  }

  errorRow(colspan, msg) {
    return `<tr><td colspan="${colspan}" class="text-center text-danger py-4">${this.escape(msg)}</td></tr>`;
  }

  openModal(mode, admission = null) {
    document.querySelectorAll('#admissionModal').forEach(el => el.remove());
    let title = '', body = '';
    if (mode === 'view') {
      title = 'View Admission';
      body = `
        <p><strong>Patient:</strong> ${this.escape(admission.patient_name)}</p>
        <p><strong>User:</strong> ${this.escape(admission.user_name)}</p>
        <p><strong>Date:</strong> ${this.escape(this.formatDateTimeForDisplay(admission.admission_date))}</p>
        <p><strong>Status:</strong> ${this.escape(admission.status_label)}</p>
      `;
    } else if (mode === 'delete') {
      title = 'Delete Admission';
      body = `<p>Are you sure you want to delete admission record for <strong>${this.escape(admission.patient_name)}</strong>?</p>`;
    } else {
      title = mode === 'add' ? 'Add Admission' : 'Edit Admission';
      body = `
        <form id="admissionForm" novalidate>
          <input type="hidden" id="admissionId" value="${admission ? admission.admissionid : ''}" />
          <div class="mb-3">
            <label for="patientId" class="form-label">Patient</label>
            ${mode === 'add' ? `
              <select id="patientId" class="form-select" required>
                <option value="">Select Patient</option>
                ${this.patients.map(p => `<option value="${p.patientid}">${this.escape(p.lastname + ', ' + p.firstname)}</option>`).join('')}
              </select>` :
              `<input type="text" class="form-control" value="${this.escape(admission.patient_name)}" readonly />`}
          </div>
          <div class="mb-3">
            <label for="userId" class="form-label">User</label>
            <select id="userId" class="form-select" required>
              <option value="">Select User</option>
              ${this.users.map(u => `<option value="${u.userid}" ${admission && admission.userid == u.userid ? 'selected' : ''}>${this.escape(u.username)}</option>`).join('')}
            </select>
          </div>
          <div class="mb-3">
            <label for="admissionDate" class="form-label">Admission Date</label>
            <input type="date" id="admissionDate" class="form-control" value="${admission ? this.formatDateForInput(admission.admission_date) : this.getTodayDate()}" required />
          </div>
          ${mode === 'edit' ? `
            <div class="mb-3">
              <label for="admissionStatus" class="form-label">Status</label>
              <select id="admissionStatus" class="form-select" required>
                <option value="Admitted" ${admission.status === 'Admitted' ? 'selected' : ''}>Admitted</option>
                <option value="Discharged" ${admission.status === 'Discharged' ? 'selected' : ''}>Discharged</option>
                <option value="Closed" ${admission.status === 'Closed' ? 'selected' : ''}>Closed</option>
              </select>
            </div>` : ''}
        </form>
      `;
    }

    const modalHtml = `
      <div class="modal fade" id="admissionModal" tabindex="-1" aria-labelledby="admissionModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title" id="admissionModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${(mode === 'add' || mode === 'edit') ? `<button class="btn btn-primary" id="saveAdmissionBtn">${mode === 'add' ? 'Add' : 'Update'}</button>` : ''}
              ${mode === 'delete' ? `<button class="btn btn-danger" id="confirmDeleteAdmissionBtn">Delete</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('admissionModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    modalEl.addEventListener('hidden.bs.modal', () => {
      bsModal.dispose(); modalEl.remove();
    }, { once: true });

    document.getElementById('saveAdmissionBtn')?.addEventListener('click', () => this.saveAdmission(mode, bsModal));
    document.getElementById('confirmDeleteAdmissionBtn')?.addEventListener('click', () => this.deleteAdmission(admission.admissionid, bsModal));
  }

  async saveAdmission(mode, modal) {
    const form = document.getElementById('admissionForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    const admissionId = form.querySelector('#admissionId').value || null;
    const patientId = mode === 'add' ? form.querySelector('#patientId').value : null;
    const userId = form.querySelector('#userId').value;
    const admissionDateValue = form.querySelector('#admissionDate').value;
    const statusValue = mode === 'add' ? 'Admitted' : form.querySelector('#admissionStatus').value;

    // Convert admissionDate from date only to datetime string for backend
    const admissionDate = admissionDateValue + ' 00:00:00';

    const data = {
      admissionid: admissionId,
      patientid: patientId,
      userid: userId,
      admission_date: admissionDate,
      status: statusValue
    };
    try {
      const res = await axios.post(this.apiUrl, {
        operation: mode === 'add' ? 'insertAdmission' : 'updateAdmission',
        ...data
      });
      if (res.data.success === false) throw new Error(res.data.error || 'Operation failed');
      this.showAlert(`Admission ${mode === 'add' ? 'added' : 'updated'} successfully!`, 'success');
      modal.hide();
      await this.loadAdmissions();
    } catch (err) {
      this.showAlert(err.message, 'danger');
    }
  }

  async deleteAdmission(admissionid, modal) {
    try {
      const res = await axios.post(this.apiUrl, { operation: 'deleteAdmission', admissionid });
      if (res.data.success === false) throw new Error(res.data.error || 'Delete failed');
      this.showAlert('Admission deleted successfully!', 'success');
      modal.hide();
      await this.loadAdmissions();
    } catch (err) {
      this.showAlert(err.message, 'danger');
    }
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert.position-fixed').forEach(e => e.remove());
    const icons = { success: 'check-circle', danger: 'exclamation-triangle', info: 'info-circle' };
    const icon = icons[type] || icons.info;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed" style="top:20px;right:20px;z-index:1055;min-width:350px;">
        <i class="bi bi-${icon} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`);
    setTimeout(() => document.querySelector('.alert.position-fixed')?.remove(), 4000);
  }

  escape(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  formatDateTimeForDisplay(datetimeStr) {
    if (!datetimeStr) return '';
    const dt = new Date(datetimeStr);
    if (isNaN(dt)) return this.escape(datetimeStr);

    const formattedDate = dt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const formattedTime = dt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `${formattedDate} ${formattedTime}`;
  }

  formatDateForInput(datetimeStr) {
    if (!datetimeStr) return '';
    const dt = new Date(datetimeStr);
    if (isNaN(dt)) return '';
    return dt.toISOString().split('T')[0];
  }

  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }
}

document.addEventListener('DOMContentLoaded', () => new AdmissionManager());
