class PatientManager {
  constructor() {
    this.patientsData = [];
    this.baseApiUrl = 'http://localhost/hospital_billing2/api';
    this.init();
  }

  init() {
    this.loadPatients();
    this.loadInsuranceProviders();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addPatientBtn');
    if (addBtn) addBtn.addEventListener('click', () => this.openModal('add'));

    const tbody = document.getElementById('patientTableBody');
    if (tbody) {
      tbody.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (!action || !id) return;
        const patient = this.patientsData.find(p => String(p.patientid) === String(id));
        if (!patient) return;

        switch (action) {
          case 'view':
            this.openModal('view', patient);
            break;
          case 'edit':
            this.openModal('edit', patient);
            break;
          case 'delete':
            this.openModal('delete', patient);
            break;
        }
      });
    }
  }

  async loadPatients() {
    const tbody = document.getElementById('patientTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5">
          <div class="smooth-loader">
            <span></span><span></span><span></span>
          </div>
          <p class="mt-3 text-muted fw-semibold">Loading patients...</p>
        </td>
      </tr>`;

    try {
      const res = await axios.get(`${this.baseApiUrl}/patients.php`, { params: { operation: 'getAll' } });
      if (res.data.error) throw new Error(res.data.error);
      this.patientsData = Array.isArray(res.data) ? res.data : [];
      this.renderPatientsTable();
    } catch (err) {
      console.error('Error loading patients:', err);
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle me-2"></i>Failed to load patients
          </td>
        </tr>`;
    }
  }

  renderPatientsTable() {
    const tbody = document.getElementById('patientTableBody');
    if (!tbody) return;

    if (!this.patientsData.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            <i class="bi bi-inbox me-2"></i>No patients found
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = this.patientsData.map(p => {
      const fullName = `${p.lastname}, ${p.firstname}${p.middlename ? ' ' + p.middlename : ''}`;
      return `
      <tr>
        <td><strong>${fullName}</strong></td>
      


        <td><i class="bi bi-telephone me-1"></i>${p.contact_no || ''}</td>
        <td>${p.email || ''}</td>

        <td>
          <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
            <button class="btn btn-sm btn-info" style="flex-shrink: 0;" data-id="${p.patientid}" data-action="view" title="View Patient">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning" style="flex-shrink: 0;" data-id="${p.patientid}" data-action="edit" title="Edit Patient">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${p.patientid}" data-action="delete" title="Delete Patient">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  async loadInsuranceProviders() {
    try {
      const res = await axios.get(`${this.baseApiUrl}/insurance_provider.php`, { params: { operation: 'getAll' } });
      const providers = Array.isArray(res.data) ? res.data : [];
      this.insuranceProviders = providers;
    } catch (e) {
      console.error('Error loading insurance providers:', e);
      this.insuranceProviders = [];
    }
  }

  openModal(mode, patient = null) {
    const existingModal = document.getElementById('patientModal');
    if (existingModal) existingModal.remove();

    let modalHtml = '';
    if (mode === 'delete') {
      modalHtml = this.getDeleteModalHtml(patient);
    } else {
      modalHtml = this.getFormModalHtml(mode, patient);
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('patientModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());

    if (mode === 'delete') {
      modalEl.querySelector('#confirmDeleteBtn').onclick = async () => {
        await this.deletePatient(patient.patientid);
        modal.hide();
      };
    } else {
      const form = modalEl.querySelector('#patientForm');
      const saveBtn = modalEl.querySelector('#savePatientBtn');

      if (mode !== 'view') {
        this.fillForm(patient, false, modalEl);

        // Load insurance providers NOW for modal select
        this.loadInsuranceProvidersForSelect(form.querySelector('#insuranceid'), patient ? patient.insuranceid : '');

        saveBtn.onclick = async () => {
          if (this.validateForm(form)) await this.savePatient(modal);
        };

        form.onsubmit = async e => {
          e.preventDefault();
          if (this.validateForm(form)) await this.savePatient(modal);
        };
      } else {
        this.fillForm(patient, true, modalEl);
      }
    }
  }

  getFormModalHtml(mode, patient) {
    const isEdit = mode === 'edit';
    const isView = mode === 'view';
    const titleIcon = mode === 'add' ? 'person-plus' : mode === 'edit' ? 'pencil-square' : 'eye';
    const titleText = mode === 'add' ? 'Add Patient' : mode === 'edit' ? 'Edit Patient' : 'View Patient';

    const p = patient || {};

    return `
    <div class="modal fade" id="patientModal" tabindex="-1" aria-labelledby="patientModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-light border-bottom">
            <h5 class="modal-title text-primary fw-bold" id="patientModalLabel">
              <i class="bi bi-${titleIcon} me-2"></i>${titleText}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <form id="patientForm" novalidate style="display: ${isView ? 'none' : 'block'};">
              <input type="hidden" id="patientId" value="${p.patientid || ''}">

              <div class="row g-3">
                <div class="col-md-4">
                  <label for="lastname" class="form-label">Last Name</label>
                  <input type="text" id="lastname" class="form-control" value="${p.lastname || ''}" ${isView ? 'readonly' : 'required'}>
                  <div class="invalid-feedback">Last name is required.</div>
                </div>
                <div class="col-md-4">
                  <label for="firstname" class="form-label">First Name</label>
                  <input type="text" id="firstname" class="form-control" value="${p.firstname || ''}" ${isView ? 'readonly' : 'required'}>
                  <div class="invalid-feedback">First name is required.</div>
                </div>
                <div class="col-md-4">
                  <label for="middlename" class="form-label">Middle Name</label>
                  <input type="text" id="middlename" class="form-control" value="${p.middlename || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-3">
                  <label for="suffix" class="form-label">Suffix</label>
                  <input type="text" id="suffix" class="form-control" value="${p.suffix || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-3">
                  <label for="gender" class="form-label">Gender</label>
                  <select id="gender" class="form-select" ${isView ? 'disabled' : 'required'}>
                    <option value="">-- Select Gender --</option>
                    <option value="Male" ${p.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${p.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Other" ${p.gender === 'Other' ? 'selected' : ''}>Other</option>
                  </select>
                  <div class="invalid-feedback">Gender is required.</div>
                </div>
                <div class="col-md-3">
                  <label for="civil_status" class="form-label">Civil Status</label>
                  <select id="civil_status" class="form-select" ${isView ? 'disabled' : ''}>
                    <option value="">-- Select Civil Status --</option>
                    <option value="Single" ${p.civil_status === 'Single' ? 'selected' : ''}>Single</option>
                    <option value="Married" ${p.civil_status === 'Married' ? 'selected' : ''}>Married</option>
                    <option value="Widowed" ${p.civil_status === 'Widowed' ? 'selected' : ''}>Widowed</option>
                    <option value="Separated" ${p.civil_status === 'Separated' ? 'selected' : ''}>Separated</option>
                    <option value="Other" ${p.civil_status === 'Other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label for="birthdate" class="form-label">Birthdate</label>
                  <input type="date" id="birthdate" class="form-control" value="${p.birthdate || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-6">
                  <label for="contact_no" class="form-label">Contact No</label>
                  <input type="tel" id="contact_no" class="form-control" value="${p.contact_no || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-6">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" id="email" class="form-control" value="${p.email || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-6">
                  <label for="insuranceid" class="form-label">Insurance Provider</label>
                  <select id="insuranceid" class="form-select" ${isView ? 'disabled' : ''}>
                    <option value="">-- Loading providers... --</option>
                  </select>
                </div>
                <div class="col-md-12">
                  <label for="address" class="form-label">Address</label>
                  <textarea id="address" rows="2" class="form-control" ${isView ? 'readonly' : 'required'}>${p.address || ''}</textarea>
                  <div class="invalid-feedback">Address is required.</div>
                </div>
                <div class="col-md-4">
                  <label for="city" class="form-label">City</label>
                  <input type="text" id="city" class="form-control" value="${p.city || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-4">
                  <label for="province" class="form-label">Province</label>
                  <input type="text" id="province" class="form-control" value="${p.province || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-4">
                  <label for="zipcode" class="form-label">Zip Code</label>
                  <input type="text" id="zipcode" class="form-control" value="${p.zipcode || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-6">
                  <label for="national_id" class="form-label">National ID</label>
                  <input type="text" id="national_id" class="form-control" value="${p.national_id || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-6">
                  <label for="emergency_name" class="form-label">Emergency Contact Name</label>
                  <input type="text" id="emergency_name" class="form-control" value="${p.emergency_name || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-6">
                  <label for="emergency_relation" class="form-label">Emergency Contact Relation</label>
                  <input type="text" id="emergency_relation" class="form-control" value="${p.emergency_relation || ''}" ${isView ? 'readonly' : ''}>
                </div>
                <div class="col-md-6">
                  <label for="emergency_contact" class="form-label">Emergency Contact Number</label>
                  <input type="text" id="emergency_contact" class="form-control" value="${p.emergency_contact || ''}" ${isView ? 'readonly' : ''}>
                </div>
              </div>
            </form>

            <div id="patientDetails" style="display: ${isView ? 'block' : 'none'};">
              <p><strong>Full Name:</strong> ${fullName(p)}</p>
              <p><strong>Gender:</strong> ${p.gender || ''}</p>
              <p><strong>Civil Status:</strong> ${p.civil_status || ''}</p>
              <p><strong>Birthdate:</strong> ${p.birthdate || ''}</p>
              <p><strong>Contact No:</strong> ${p.contact_no || ''}</p>
              <p><strong>Email:</strong> ${p.email || ''}</p>
              <p><strong>Insurance:</strong> ${p.insurance_name || ''}</p>
              <p><strong>Address:</strong><br>${p.address || ''} ${p.city || ''} ${p.province || ''} ${p.zipcode || ''}</p>
              <p><strong>National ID:</strong> ${p.national_id || ''}</p>
              <p><strong>Emergency Contact:</strong> ${p.emergency_name || ''} (${p.emergency_relation || ''}) - ${p.emergency_contact || ''}</p>
            </div>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            ${!isView ? `<button type="button" class="btn btn-primary" id="savePatientBtn">
              <i class="bi bi-check-circle me-2"></i>${isEdit ? 'Update' : 'Save'}
            </button>` : ''}
          </div>
        </div>
      </div>
    </div>`;

    function fullName(p) {
      let name = '';
      if (p.lastname) name += p.lastname;
      if (p.firstname) name += ', ' + p.firstname;
      if (p.middlename) name += ' ' + p.middlename;
      if (p.suffix) name += ', ' + p.suffix;
      return name;
    }
  }

  getDeleteModalHtml(patient) {
    return `
    <div class="modal fade" id="patientModal" tabindex="-1" aria-labelledby="patientModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-light border-bottom text-danger">
            <h5 class="modal-title" id="patientModalLabel">
              <i class="bi bi-exclamation-triangle me-2"></i>Delete Patient
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center pt-4">
            <p>Are you sure you want to delete <strong>${patient.lastname}, ${patient.firstname}</strong>?</p>
            <div class="alert alert-warning mt-3 d-flex align-items-center justify-content-center">
              <i class="bi bi-info-circle me-2"></i>
              <strong>Warning:</strong> This action is permanent and cannot be undone.
            </div>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" id="confirmDeleteBtn" data-id="${patient.patientid}">
              <i class="bi bi-trash me-2"></i>Delete
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }

  fillForm(patient, viewOnly = false, modalEl = null) {
    if (!modalEl) modalEl = document.getElementById('patientModal');
    if (!modalEl) return;

    const form = modalEl.querySelector('#patientForm');
    if (!form) return;

    const p = patient || {};

    form.querySelector('#patientId').value = p.patientid || '';
    form.querySelector('#lastname').value = p.lastname || '';
    form.querySelector('#firstname').value = p.firstname || '';
    form.querySelector('#middlename').value = p.middlename || '';
    form.querySelector('#suffix').value = p.suffix || '';
    form.querySelector('#gender').value = p.gender || '';
    form.querySelector('#civil_status').value = p.civil_status || '';
    form.querySelector('#birthdate').value = p.birthdate || '';
    form.querySelector('#contact_no').value = p.contact_no || '';
    form.querySelector('#email').value = p.email || '';
    form.querySelector('#insuranceid').value = p.insuranceid || '';
    form.querySelector('#address').value = p.address || '';
    form.querySelector('#city').value = p.city || '';
    form.querySelector('#province').value = p.province || '';
    form.querySelector('#zipcode').value = p.zipcode || '';
    form.querySelector('#national_id').value = p.national_id || '';
    form.querySelector('#emergency_name').value = p.emergency_name || '';
    form.querySelector('#emergency_relation').value = p.emergency_relation || '';
    form.querySelector('#emergency_contact').value = p.emergency_contact || '';

    // Set fields readonly or disabled
    Array.from(form.elements).forEach(el => {
      if (el.id !== 'patientId') {
        el.readOnly = viewOnly && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA' && el.type !== 'select-one';
        el.disabled = viewOnly && (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.type === 'select-one');
        if(el.tagName === 'TEXTAREA') el.disabled = viewOnly;
      }
    });

    // Load insurance providers Select options (only if enabled)
    if (form.querySelector('#insuranceid') && !viewOnly) {
      this.loadInsuranceProvidersForSelect(form.querySelector('#insuranceid'), p.insuranceid || '');
    }
  }

  async loadInsuranceProvidersForSelect(selectEl, selectedId = '') {
    try {
      selectEl.innerHTML = '<option value="">-- Loading providers... --</option>';
      const res = await axios.get(`${this.baseApiUrl}/insurance_provider.php`, { params: { operation: 'getAll' } });
      const providers = Array.isArray(res.data) ? res.data : [];
      selectEl.innerHTML = '<option value="">-- Select Provider --</option>' +
        providers.map(p => `<option value="${p.insuranceid}"${String(p.insuranceid) === String(selectedId) ? ' selected' : ''}>${p.name}</option>`).join('');
    } catch (e) {
      console.error('Error loading insurance providers:', e);
      selectEl.innerHTML = '<option value="">-- Failed to load providers --</option>';
    }
  }

  validateForm(form) {
    let valid = true;

    // Validate required fields (lastname, firstname, gender, address)
    const lastname = form.querySelector('#lastname');
    const firstname = form.querySelector('#firstname');
    const gender = form.querySelector('#gender');
    const address = form.querySelector('#address');

    [lastname, firstname, gender, address].forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('is-invalid');
        valid = false;
      } else {
        field.classList.remove('is-invalid');
      }
    });

    return valid;
  }

  async savePatient(modal) {
    const modalEl = modal._element;
    const form = modalEl.querySelector('#patientForm');
    if (!form) return;

    const id = form.querySelector('#patientId').value;
    const data = {
      patientid: id || null,
      lastname: form.querySelector('#lastname').value.trim(),
      firstname: form.querySelector('#firstname').value.trim(),
      middlename: form.querySelector('#middlename').value.trim() || null,
      suffix: form.querySelector('#suffix').value.trim() || null,
      gender: form.querySelector('#gender').value,
      civil_status: form.querySelector('#civil_status').value || null,
      birthdate: form.querySelector('#birthdate').value,
      contact_no: form.querySelector('#contact_no').value.trim() || null,
      email: form.querySelector('#email').value.trim() || null,
      insuranceid: form.querySelector('#insuranceid').value || null,
      address: form.querySelector('#address').value.trim(),
      city: form.querySelector('#city').value.trim() || null,
      province: form.querySelector('#province').value.trim() || null,
      zipcode: form.querySelector('#zipcode').value.trim() || null,
      national_id: form.querySelector('#national_id').value.trim() || null,
      emergency_name: form.querySelector('#emergency_name').value.trim() || null,
      emergency_relation: form.querySelector('#emergency_relation').value.trim() || null,
      emergency_contact: form.querySelector('#emergency_contact').value.trim() || null,
    };

    const formData = new FormData();
    formData.append('operation', id ? 'update' : 'insert');
    formData.append('json', JSON.stringify(data));

    try {
      const res = await axios.post(`${this.baseApiUrl}/patients.php`, formData);
      if (res.data.error) throw new Error(res.data.error);
      this.showAlert(`Patient ${id ? 'updated' : 'added'} successfully!`, 'success');
      modal.hide();
      this.loadPatients();
    } catch (e) {
      console.error('Error saving patient:', e);
      this.showAlert(e.response?.data?.error || 'Error saving patient. Please try again.', 'danger');
    }
  }

  async deletePatient(id) {
    try {
      const formData = new FormData();
      formData.append('operation', 'delete');
      formData.append('patientid', id);
      const res = await axios.post(`${this.baseApiUrl}/patients.php`, formData);
      if (res.data.error) throw new Error(res.data.error);
      this.showAlert('Patient deleted successfully!', 'success');
      this.loadPatients();
    } catch (e) {
      console.error('Error deleting patient:', e);
      this.showAlert(e.response?.data?.error || 'Error deleting patient. Please try again.', 'danger');
    }
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert.position-fixed').forEach(a => a.remove());

    const icon = type === 'success' ? 'check-circle'
      : type === 'danger' ? 'exclamation-triangle'
      : 'info-circle';

    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed"
           style="top: 20px; right: 20px; z-index: 1055; min-width: 350px;">
        <i class="bi bi-${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', alertHtml);

    const alertEl = document.querySelector('.alert.position-fixed');
    if (alertEl && window.bootstrap?.Alert) {
      const bsAlert = new bootstrap.Alert(alertEl);
      setTimeout(() => bsAlert.close(), 4000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new PatientManager());
