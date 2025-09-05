class LabRequestManager {
  constructor() {
    this.apiUrl = 'http://localhost/hospital_billing2/api/transactions/lab_request.php';
    this.labRequests = [];
    this.admissions = [];
    this.doctors = [];
    this.tests = [];
    this.init();
  }

  init() {
    this.loadAdmissions();
    this.loadDoctors();
    this.loadTests();
    this.loadLabRequests();
    this.setupEventListeners();
    this.setupSearchFilter();
    this.populateFilters();
  }

  setupEventListeners() {
    document.getElementById('addLabRequestBtn')?.addEventListener('click', () => this.openModal('add'));
    document.getElementById('searchLabRequestBtn')?.addEventListener('click', () => this.filterLabRequests());

    document.getElementById('labRequestTableBody')?.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (!id || !action) return;

      const labRequest = this.labRequests.find(lr => String(lr.lab_requestid) === String(id));
      if (!labRequest) return;

      this.openModal(action, labRequest);
    });
  }

  setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        this.renderLabRequestsTable(searchTerm);
      });
    }
  }

  async loadAdmissions() {
    try {
      const res = await axios.get('http://localhost/hospital_billing2/api/transactions/admission.php', {
        params: { operation: 'getAllAdmissions' }
      });
      if (res.data.error) throw new Error(res.data.error);
      this.admissions = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Failed to load admissions:', err);
      this.admissions = [];
    }
  }

  async loadDoctors() {
    try {
      const res = await axios.get('http://localhost/hospital_billing2/api/doctors.php', {
        params: { operation: 'getAllDoctors' }
      });
      if (res.data.error) throw new Error(res.data.error);
      this.doctors = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Failed to load doctors:', err);
      this.doctors = [];
    }
  }

  async loadTests() {
    try {
      const res = await axios.get('http://localhost/hospital_billing2/api/lab_test.php', {
        params: { operation: 'getAllTests' }
      });
      if (res.data.error) throw new Error(res.data.error);
      this.tests = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Failed to load lab tests:', err);
      this.tests = [];
    }
  }

  populateFilters() {
    // Populate patient filter
    const patientFilter = document.getElementById('patientFilter');
    if (patientFilter) {
      patientFilter.innerHTML = '<option value="">All Patients</option>';
      const uniquePatients = new Map();
      
      this.admissions.forEach(admission => {
        if (admission.patientid && admission.patient_name && !uniquePatients.has(admission.patientid)) {
          uniquePatients.set(admission.patientid, admission.patient_name);
        }
      });
      
      uniquePatients.forEach((name, id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        patientFilter.appendChild(option);
      });
    }
    
    // Populate doctor filter
    const doctorFilter = document.getElementById('doctorFilter');
    if (doctorFilter) {
      doctorFilter.innerHTML = '<option value="">All Doctors</option>';
      
      this.doctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.doctorid;
        option.textContent = `${doctor.firstname} ${doctor.lastname}`;
        doctorFilter.appendChild(option);
      });
    }
    
    // Populate test filter
    const testFilter = document.getElementById('testFilter');
    if (testFilter) {
      testFilter.innerHTML = '<option value="">All Tests</option>';
      
      this.tests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.testid;
        option.textContent = test.name;
        testFilter.appendChild(option);
      });
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
  
  filterLabRequests() {
    const patientId = document.getElementById('patientFilter')?.value;
    const doctorId = document.getElementById('doctorFilter')?.value;
    const testId = document.getElementById('testFilter')?.value;
    const status = document.getElementById('statusFilter')?.value;
    const dateFromFilter = document.getElementById('dateFromFilter')?.value;
    const dateToFilter = document.getElementById('dateToFilter')?.value;
    
    let filtered = this.labRequests;
    
    // Filter by patient
    if (patientId) {
      filtered = filtered.filter(lr => String(lr.patientid) === String(patientId) || String(lr.patient_id) === String(patientId));
    }
    
    // Filter by doctor
    if (doctorId) {
      filtered = filtered.filter(lr => String(lr.doctorid) === String(doctorId) || String(lr.doctor_id) === String(doctorId));
    }
    
    // Filter by test
    if (testId) {
      filtered = filtered.filter(lr => String(lr.testid) === String(testId) || String(lr.test_id) === String(testId));
    }
    
    // Filter by status
    if (status) {
      filtered = filtered.filter(lr => lr.status === status);
    }
    
    // Filter by date range
    if (dateFromFilter || dateToFilter) {
      filtered = filtered.filter(lr => {
        const requestDate = new Date(lr.request_date);
        
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          if (requestDate < fromDate) {
            return false;
          }
        }
        
        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999); // End of the day
          if (requestDate > toDate) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    this.renderFilteredTable(filtered);
  }
  
  renderFilteredTable(data) {
    const tbody = document.getElementById('labRequestTableBody');
    if (!tbody) return;
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">No matching lab requests found.</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(request => {
      const statusClass = this.getStatusClass(request.status);
      return `
        <tr>
          <td>${this.escapeHtml(request.patient_name || 'N/A')}</td>
          <td>${this.escapeHtml(request.test_name || 'N/A')}</td>
          <td>${this.escapeHtml(request.category_name || 'N/A')}</td>
          <td>${this.escapeHtml(request.doctor_name || 'N/A')}</td>
          <td><span class="${statusClass}">${this.escapeHtml(request.status || 'Pending')}</span></td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-info" data-id="${request.lab_requestid}" data-action="view" title="View Details">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-warning" data-id="${request.lab_requestid}" data-action="edit" title="Edit">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger" data-id="${request.lab_requestid}" data-action="delete" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async loadLabRequests() {
    try {
      const res = await axios.get(this.apiUrl, {
        params: { operation: 'getAllLabRequests' }
      });
      if (res.data.error) throw new Error(res.data.error);
      this.labRequests = Array.isArray(res.data) ? res.data : [];
      this.renderLabRequestsTable();
    } catch (err) {
      console.error('Failed to load lab requests:', err);
      this.showAlert('Failed to load lab requests: ' + err.message, 'danger');
      this.labRequests = [];
      this.renderLabRequestsTable();
    }
  }

  renderLabRequestsTable(searchTerm = '') {
    const tbody = document.getElementById('labRequestTableBody');
    if (!tbody) return;

    let filteredRequests = this.labRequests;

    if (searchTerm) {
      filteredRequests = filteredRequests.filter(req =>
        (req.patient_name && req.patient_name.toLowerCase().includes(searchTerm)) ||
        (req.test_name && req.test_name.toLowerCase().includes(searchTerm)) ||
        (req.category_name && req.category_name.toLowerCase().includes(searchTerm)) ||
        (req.doctor_name && req.doctor_name.toLowerCase().includes(searchTerm)) ||
        (req.status && req.status.toLowerCase().includes(searchTerm))
      );
    }

    if (!filteredRequests.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-3">
            <i class="bi bi-inbox me-2"></i>No lab requests found
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = filteredRequests.map(req => {
      const statusClass =
        req.status === 'Completed' ? 'success' :
        req.status === 'In Progress' ? 'warning' :
        req.status === 'Cancelled' ? 'danger' : 'info';

      return `
        <tr>
          <td><strong>${req.patient_name || 'Unknown'}</strong></td>
          <td><strong>${req.test_name || 'Unknown'}</strong></td>
          <td><span class="badge bg-info">${req.category_name || 'Unknown'}</span></td>
          <td><strong>${req.doctor_name || 'Unknown'}</strong></td>
          <td><span class="badge bg-${statusClass}">${req.status || 'Pending'}</span></td>
          <td>
            <div style="display: flex; gap: 8px; flex-wrap: nowrap;">
              <button class="btn btn-sm btn-info" title="View Lab Request" data-id="${req.lab_requestid}" data-action="view">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-warning" title="Edit Lab Request" data-id="${req.lab_requestid}" data-action="edit">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger" title="Delete Lab Request" data-id="${req.lab_requestid}" data-action="delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  openModal(mode, labRequest = null) {
    const existingModal = document.getElementById('labRequestModal');
    if (existingModal) existingModal.remove();

    const admissionOptions = this.admissions.map(admission => {
      const selected = labRequest && labRequest.admissionid == admission.admissionid ? 'selected' : '';
      return `<option value="${admission.admissionid}" ${selected}>${admission.patient_name} (ID: ${admission.admissionid})</option>`;
    }).join('');

    const doctorOptions = this.doctors.map(doctor => {
      const selected = labRequest && labRequest.requestedBy == doctor.doctorid ? 'selected' : '';
      return `<option value="${doctor.doctorid}" ${selected}>${doctor.fullname}</option>`;
    }).join('');

    const testOptions = this.tests.map(test => {
      const selected = labRequest && labRequest.testid == test.testid ? 'selected' : '';
      return `<option value="${test.testid}" ${selected}>${test.name} (${test.category_name})</option>`;
    }).join('');

    // Only show status select for edit and view modes
    const statusOptions = ['Pending', 'In Progress', 'Completed', 'Cancelled'].map(status => {
      const selected = labRequest && labRequest.status === status ? 'selected' : '';
      return `<option value="${status}" ${selected}>${status}</option>`;
    }).join('');

    const modalBody = `
      <form id="labRequestForm" class="needs-validation" novalidate>
        <input type="hidden" id="labRequestId" value="${labRequest ? labRequest.lab_requestid : ''}">

        <div class="row mb-3">
          <div class="col-md-6">
            <label for="admissionSelect" class="form-label">Admission</label>
            <select class="form-select" id="admissionSelect" ${mode === 'view' || mode === 'delete' ? 'disabled' : ''} required>
              <option value="">-- Select Admission --</option>
              ${admissionOptions}
            </select>
            <div class="invalid-feedback">Please select an admission.</div>
          </div>

          <div class="col-md-6">
            <label for="doctorSelect" class="form-label">Requested By</label>
            <select class="form-select" id="doctorSelect" ${mode === 'view' || mode === 'delete' ? 'disabled' : ''} required>
              <option value="">-- Select Doctor --</option>
              ${doctorOptions}
            </select>
            <div class="invalid-feedback">Please select a doctor.</div>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-md-6">
            <label for="testSelect" class="form-label">Lab Test</label>
            <select class="form-select" id="testSelect" ${mode === 'view' || mode === 'delete' ? 'disabled' : ''} required>
              <option value="">-- Select Test --</option>
              ${testOptions}
            </select>
            <div class="invalid-feedback">Please select a lab test.</div>
          </div>

          ${mode !== 'add' ? `<div class="col-md-6">
            <label for="statusSelect" class="form-label">Status</label>
            <select class="form-select" id="statusSelect" ${mode === 'view' || mode === 'delete' ? 'disabled' : ''} required>
              <option value="">-- Select Status --</option>
              ${statusOptions}
            </select>
            <div class="invalid-feedback">Please select status.</div>
          </div>` : ''}
        </div>

        ${mode === 'delete' ? `
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Are you sure you want to delete this lab request? This action cannot be undone.
          </div>
        ` : ''}
      </form>
    `;

    const modalHtml = `
      <div class="modal fade" id="labRequestModal" tabindex="-1" aria-labelledby="labRequestModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="labRequestModalLabel">
                <i class="bi bi-${mode === 'edit' ? 'pencil-square' : mode === 'view' ? 'eye' : mode === 'delete' ? 'trash' : 'plus-circle'} me-2"></i>
                ${mode === 'edit' ? 'Edit' : mode === 'view' ? 'View' : mode === 'delete' ? 'Delete' : 'Add'} Lab Request
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${modalBody}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              ${mode !== 'view' ? `
                <button type="button" class="btn btn-${mode === 'delete' ? 'danger' : 'primary'}" id="saveLabRequestBtn">
                  ${mode === 'delete' ? 'Delete' : 'Save'} Lab Request
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('labRequestModal'));
    modal.show();

    if (mode !== 'view') {
      document.getElementById('saveLabRequestBtn').addEventListener('click', () => {
        if (mode === 'delete') {
          this.deleteLabRequest(labRequest.lab_requestid);
        } else {
          this.saveLabRequest(mode);
        }
      });
    }
  }

  async saveLabRequest(mode) {
    const form = document.getElementById('labRequestForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const data = {
      lab_requestid: document.getElementById('labRequestId').value || null,
      admissionid: document.getElementById('admissionSelect').value,
      requestedBy: document.getElementById('doctorSelect').value,
      testid: document.getElementById('testSelect').value,
      status: mode === 'add' ? 'Pending' : document.getElementById('statusSelect').value
    };

    try {
      const operation = mode === 'edit' ? 'updateLabRequest' : 'insertLabRequest';
      const res = await axios.post(this.apiUrl, { operation, ...data });
      if (!res.data.success) throw new Error(res.data.error || 'Operation failed');

      this.showAlert(`Lab request ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      bootstrap.Modal.getInstance(document.getElementById('labRequestModal')).hide();
      this.loadLabRequests();
    } catch (err) {
      this.showAlert(`Failed to ${mode === 'edit' ? 'update' : 'add'} lab request: ${err.message}`, 'danger');
    }
  }

  async deleteLabRequest(id) {
    try {
      const res = await axios.post(this.apiUrl, {
        operation: 'deleteLabRequest',
        lab_requestid: id
      });
      if (!res.data.success) throw new Error(res.data.error || 'Delete failed');

      this.showAlert('Lab request deleted successfully!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('labRequestModal')).hide();
      this.loadLabRequests();
    } catch (err) {
      this.showAlert(`Failed to delete lab request: ${err.message}`, 'danger');
    }
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert-floating').forEach(a => a.remove());
    const icon = type === 'success' ? 'check-circle' : 'exclamation-triangle';
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show alert-floating position-fixed"
           style="top: 20px; right: 20px; min-width: 350px; z-index: 1055;">
        <i class="bi bi-${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    setTimeout(() => {
      const alert = document.querySelector('.alert-floating');
      if (alert) new bootstrap.Alert(alert).close();
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => new LabRequestManager());
