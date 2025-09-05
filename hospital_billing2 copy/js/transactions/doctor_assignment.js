class DoctorAssignmentManager {
  constructor() {
    this.apiUrl = 'http://localhost/hospital_billing2/api/transactions/doctor_assignment.php';
    this.assignments = [];
    this.doctors = [];
    this.admissions = [];
    this.init();
  }

  async init() {
    await Promise.all([this.loadDoctors(), this.loadAdmissions()]);
    await this.loadAssignments();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('addAssignmentBtn').addEventListener('click', () => this.openModal('add'));

    document.getElementById('doctorAssignmentTableBody').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const assignment = this.assignments.find(a => String(a.assignmentid) === String(id));
      if (action === 'view') this.openModal('view', assignment);
      else if (action === 'edit') this.openModal('edit', assignment);
      else if (action === 'delete') this.softDeleteAssignment(id);
    });
  }

  async loadDoctors() {
    try {
      const res = await axios.get('http://localhost/hospital_billing2/api/doctors.php', { params: { operation: 'getAllDoctors' } });
      this.doctors = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error('Failed to load doctors', e);
      this.doctors = [];
    }
  }

  async loadAdmissions() {
    try {
      const res = await axios.get('http://localhost/hospital_billing2/api/transactions/admission.php', { params: { operation: 'getActiveAdmissions' } });
      this.admissions = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error('Failed to load admissions', e);
      this.admissions = [];
    }
  }

  async loadAssignments() {
    try {
      const res = await axios.get(this.apiUrl, { params: { operation: 'getAssignments' } });
      if (res.data.success) {
        this.assignments = res.data.data;
        this.renderTable();
      } else {
        this.renderEmpty('Failed to load assignments: ' + (res.data.error || 'Unknown error'));
      }
    } catch (error) {
      this.renderEmpty('Error loading assignments.');
      console.error(error);
    }
  }

  renderEmpty(message) {
    const tbody = document.getElementById('doctorAssignmentTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">${message}</td></tr>`;
  }

  renderTable() {
    const tbody = document.getElementById('doctorAssignmentTableBody');
    if (!tbody) return;
    if (!this.assignments.length) {
      this.renderEmpty('No doctor assignments found.');
      return;
    }
    tbody.innerHTML = this.assignments.map(a => `
      <tr>
        <td><strong>${this.escape(a.patient_name || 'Unknown')}</strong></td>
        <td><strong>${this.escape(a.doctor_name || 'Unknown')}</strong></td>
        <td><strong>${this.escape(a.role || '')}</strong></td>
        <td><span class="badge bg-info"><strong>₱ ${parseFloat(a.pf_override ?? a.default_pf ?? 0).toFixed(2)}</strong></span></td>
        <td><strong>${this.escape(a.notes || '')}</strong></td>
        <td>
          <div class="d-flex gap-2 flex-nowrap">
            <button class="btn btn-info btn-sm me-1" data-id="${a.assignmentid}" data-action="view" title="View"><i class="bi bi-eye"></i></button>
            <button class="btn btn-warning btn-sm me-1" data-id="${a.assignmentid}" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-danger btn-sm" data-id="${a.assignmentid}" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  openModal(mode, assignment = null) {
    document.getElementById('doctorAssignmentModal')?.remove();

    const editing = mode === 'edit';
    const viewing = mode === 'view';
    const a = assignment || {};

    const admissionOptions = this.admissions.map(adm => `
      <option value="${adm.admissionid}" ${adm.admissionid === a.admissionid ? 'selected' : ''}>
        ${this.escape(adm.patient_name)} - ${new Date(adm.admission_date).toLocaleDateString()}
      </option>`).join('');

    const doctorOptions = this.doctors.map(doc => `
      <option value="${doc.doctorid}" ${doc.doctorid === a.doctorid ? 'selected' : ''}>
        ${this.escape(doc.fullname)}${doc.specialty_name ? ' - ' + this.escape(doc.specialty_name) : ''}
      </option>`).join('');

    const modalHtml = `
      <div class="modal fade" id="doctorAssignmentModal" tabindex="-1" aria-labelledby="modalTitle" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <form id="doctorAssignmentForm" class="needs-validation" novalidate>
            <div class="modal-content">

              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="modalTitle">${viewing ? 'View' : editing ? 'Edit' : 'Add'} Doctor Assignment</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <div class="modal-body">

                ${(editing || !viewing) ? `<input type="hidden" id="assignmentId" value="${a.assignmentid || ''}">` : ''}

                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="admissionSelect" class="form-label">Admission</label>
                    <select id="admissionSelect" class="form-select" ${viewing ? 'disabled' : 'required'}>
                      <option value="">Select admission</option>
                      ${admissionOptions}
                    </select>
                    <div class="invalid-feedback">Please select an admission.</div>
                  </div>

                  <div class="col-md-6">
                    <label for="doctorSelect" class="form-label">Doctor</label>
                    <select id="doctorSelect" class="form-select" ${viewing ? 'disabled' : 'required'}>
                      <option value="">Select doctor</option>
                      ${doctorOptions}
                    </select>
                    <div class="invalid-feedback">Please select a doctor.</div>
                  </div>
                </div>

                <div class="mb-3 mt-3">
                  <label for="roleInput" class="form-label">Role</label>
                  <input type="text" id="roleInput" class="form-control" value="${a.role || ''}" ${viewing ? 'readonly' : 'required'}>
                  <div class="invalid-feedback">Role is required.</div>
                </div>

                <div class="mb-3">
                  <label for="pfOverrideInput" class="form-label">Professional Fee Override (₱)</label>
                  <input type="number" step="0.01" id="pfOverrideInput" class="form-control" value="${a.pf_override || ''}" ${viewing ? 'readonly' : ''}>
                  <div class="form-text">Leave blank to use doctor’s default PF.</div>
                </div>

                <div class="mb-3">
                  <label for="notesTextarea" class="form-label">Notes</label>
                  <textarea id="notesTextarea" class="form-control" rows="3" ${viewing ? 'readonly' : ''}>${a.notes || ''}</textarea>
                </div>

                <div id="formAlert" class="alert alert-danger d-none"></div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                ${!viewing ? `<button type="submit" class="btn btn-primary">${editing ? 'Update' : 'Add'}</button>` : ''}
              </div>

            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalElem = document.getElementById('doctorAssignmentModal');
    const modal = new bootstrap.Modal(modalElem);
    modal.show();

    if (!viewing) {
      const form = document.getElementById('doctorAssignmentForm');
      form.addEventListener('submit', e => {
        e.preventDefault();
        this.saveAssignment();
      });
    }

    modalElem.addEventListener('hidden.bs.modal', () => {
      modalElem.remove();
    });
  }

  async saveAssignment() {
    const form = document.getElementById('doctorAssignmentForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const id = document.getElementById('assignmentId')?.value || null;
    const admissionId = document.getElementById('admissionSelect').value;
    const doctorId = document.getElementById('doctorSelect').value;
    const role = document.getElementById('roleInput').value.trim();
    const pf_override = document.getElementById('pfOverrideInput').value.trim() || null;
    const notes = document.getElementById('notesTextarea').value.trim();

    // Client-side duplicate check
    const duplicate = this.assignments.find(a =>
      a.doctorid === doctorId &&
      a.admissionid === admissionId &&
      (id === null || a.assignmentid !== id)
    );
    if (duplicate) {
      this.showFormAlert('This doctor is already assigned to this admission.');
      return;
    }

    try {
      const operation = id ? 'updateAssignment' : 'insertAssignment';
      const payload = { assignmentid: id, admissionid: admissionId, doctorid: doctorId, role, pf_override, notes };
      const res = await axios.post(this.apiUrl, { operation, json: JSON.stringify(payload) });

      if (!res.data.success) throw new Error(res.data.error || 'Failed to save assignment.');

      bootstrap.Modal.getInstance(document.getElementById('doctorAssignmentModal')).hide();

      await this.loadAssignments();
      this.showAlert('Assignment saved successfully.', 'success');

    } catch (err) {
      this.showFormAlert(err.message || 'Failed to save assignment.');
    }
  }

  async softDeleteAssignment(id) {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const res = await axios.post(this.apiUrl, { operation: 'deleteAssignment', assignmentid: id });
      if (!res.data.success) throw new Error(res.data.error || 'Delete failed');
      await this.loadAssignments();
      this.showAlert('Assignment deleted successfully.', 'success');
    } catch (err) {
      this.showAlert(err.message || 'Failed to delete.', 'danger');
    }
  }

  showFormAlert(message) {
    const alertBox = document.getElementById('formAlert');
    if (!alertBox) return;
    alertBox.classList.remove('d-none');
    alertBox.textContent = message;
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert-floating').forEach(a => a.remove());

    const iconMap = { info: 'info-circle', success: 'check-circle', danger: 'exclamation-triangle' };
    const icon = iconMap[type] || 'info-circle';

    const html = `
      <div class="alert alert-${type} alert-dismissible fade show alert-floating position-fixed top-0 end-0 m-3" style="min-width: 250px; z-index: 1060;">
        <i class="bi bi-${icon} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(() => {
      const alert = document.querySelector('.alert-floating');
      if (alert) bootstrap.Alert.getOrCreateInstance(alert).close();
    }, 4000);
  }

  escape(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.doctorAssignmentManager = new DoctorAssignmentManager();
});
