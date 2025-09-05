const BASE_API = 'http://localhost/hospital_billing2/api/';
const PRESCRIPTION_API = `${BASE_API}transactions/prescription.php`;
const ADMISSION_API = `${BASE_API}transactions/admission.php`;
const MEDICINE_API = `${BASE_API}medicine.php`;
const DOCTOR_API = `${BASE_API}doctors.php`;

class PrescriptionManager {
  constructor() {
    this.prescriptions = [];
    this.admissions = [];
    this.medicines = [];
    this.doctors = [];
    this.init();
  }

  async init() {
    try {
      await this.loadAdmissions();
      await this.loadMedicines();
      await this.loadDoctors();
      await this.loadPrescriptions();
      this.setupEvents();
    } catch (err) {
      console.error("Initialization failed:", err);
    }
  }

  setupEvents() {
    document.getElementById('addPrescriptionBtn')?.addEventListener('click', () => this.openModal('add'));
    document.getElementById('addBatchPrescriptionBtn')?.addEventListener('click', () => this.openBatchAddModal());

    const tbody = document.getElementById('prescriptionTableBody');
    if (tbody) {
      tbody.addEventListener('click', event => {
        const btn = event.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const prescription = this.prescriptions.find(p => String(p.prescriptionid) === String(id));
        if (!prescription) return;

        this.openModal(action, prescription);
      });
    }
  }

  async loadPrescriptions() {
    const tbody = document.getElementById('prescriptionTableBody');
    if (!tbody) return;
    tbody.innerHTML = this.loadingRow(7, 'Loading prescriptions...');
    try {
      const res = await axios.get(PRESCRIPTION_API, { params: { operation: 'getAllPrescriptions' } });
      if (Array.isArray(res.data)) {
        this.prescriptions = res.data;
        this.renderTable();
      } else if (res.data.success === false) {
        tbody.innerHTML = this.errorRow(7, 'Failed to load prescriptions: ' + res.data.error);
        console.error('API error:', res.data.error);
      } else {
        tbody.innerHTML = this.errorRow(7, 'Unexpected response from server');
        console.error('Unexpected response:', res.data);
      }
    } catch (error) {
      tbody.innerHTML = this.errorRow(7, 'Failed to load prescriptions');
      console.error("Network error while loading prescriptions:", error);
    }
  }

  async loadAdmissions() {
    try {
      const res = await axios.get(ADMISSION_API, { params: { operation: 'getAllAdmissions' } });
      this.admissions = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      this.admissions = [];
      console.error("Failed to load admissions:", err);
    }
  }

  async loadMedicines() {
    try {
      const res = await axios.get(MEDICINE_API, { params: { operation: 'getAllMedicines' } });
      this.medicines = Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (err) {
      this.medicines = [];
      console.error("Failed to load medicines:", err);
    }
  }

  async loadDoctors() {
    try {
      const res = await axios.get(DOCTOR_API, { params: { operation: 'getAllDoctors' } });
      this.doctors = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      this.doctors = [];
      console.error("Failed to load doctors:", err);
    }
  }

  renderTable() {
    const tbody = document.getElementById('prescriptionTableBody');
    if (!tbody) return;

    if (this.prescriptions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No prescriptions found.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.prescriptions.map(p => `
      <tr>
        <td><strong>${this.escape(p.patient_name)}</strong></td>
        <td><strong>${this.escape(p.medicine_name)}</strong></td>
        <td><strong>${this.escape(p.doctor_name)}</strong></td>
        <td><strong>${this.escape(p.quantity)}</strong></td>
        <td><span class="${this.escape(p.status_class)}">${this.escape(p.status_label)}</span></td>
        <td><strong>${this.escape(p.prescription_date)}</strong></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-info" data-id="${p.prescriptionid}" data-action="view">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning" data-id="${p.prescriptionid}" data-action="edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" data-id="${p.prescriptionid}" data-action="delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  loadingRow(colspan, message) {
    return `<tr><td colspan="${colspan}" class="text-center py-3">
      <div class="spinner-border text-primary"></div>
      <p class="mt-2">${message}</p>
    </td></tr>`;
  }

  errorRow(colspan, message) {
    return `<tr><td colspan="${colspan}" class="text-center text-danger">${this.escape(message)}</td></tr>`;
  }

  openModal(mode, prescription = null) {
    document.getElementById('prescriptionModal')?.remove();

    let title = '';
    let body = '';

    if (mode === 'view') {
      title = 'View Prescription';
      body = `
        <p><strong>Patient:</strong> ${this.escape(prescription.patient_name)}</p>
        <p><strong>Medicine:</strong> ${this.escape(prescription.medicine_name)}</p>
        <p><strong>Doctor:</strong> ${this.escape(prescription.doctor_name)}</p>
        <p><strong>Quantity:</strong> ${this.escape(prescription.quantity)}</p>
        <p><strong>Status:</strong> ${this.escape(prescription.status_label)}</p>
      `;
    } else if (mode === 'delete') {
      title = 'Delete Prescription';
      body = `<p>Are you sure you want to delete this prescription for <strong>${this.escape(prescription.patient_name)}</strong>?</p>`;
    } else {
      title = mode === 'add' ? 'Add Prescription' : 'Edit Prescription';

      body = `
        <form id="prescriptionForm" novalidate>
          <input type="hidden" id="prescriptionId" value="${prescription ? this.escape(prescription.prescriptionid) : ''}" />
          <div class="mb-3">
            <label for="admissionId" class="form-label">Admission</label>
            <select id="admissionId" class="form-select" required>
              <option value="">Select Admission</option>
              ${this.admissions.map(a => `<option value="${a.admissionid}" ${prescription && a.admissionid == prescription.admissionid ? 'selected' : ''}>${this.escape(a.patient_name)}</option>`).join('')}
            </select>
            <div class="invalid-feedback">Please select an admission.</div>
          </div>

          <div class="mb-3">
            <label for="medicineId" class="form-label">Medicine</label>
            <select id="medicineId" class="form-select" required>
              <option value="">Select Medicine</option>
              ${this.medicines.map(m => `<option value="${m.medicineid}" ${prescription && m.medicineid == prescription.medicineid ? 'selected' : ''}>${this.escape(m.brand_name)}</option>`).join('')}
            </select>
            <div class="invalid-feedback">Please select a medicine.</div>
          </div>

          <div class="mb-3">
            <label for="doctorId" class="form-label">Doctor</label>
            <select id="doctorId" class="form-select" required>
              <option value="">Select Doctor</option>
              ${this.doctors.map(d => `<option value="${d.doctorid}" ${prescription && d.doctorid == prescription.doctorid ? 'selected' : ''}>${this.escape(d.fullname)}</option>`).join('')}
            </select>
            <div class="invalid-feedback">Please select a doctor.</div>
          </div>

          <div class="mb-3">
            <label for="quantity" class="form-label">Quantity</label>
            <input id="quantity" type="number" min="1" class="form-control" value="${prescription ? this.escape(prescription.quantity) : '1'}" required />
            <div class="invalid-feedback">Please enter quantity</div>
          </div>

          ${mode === 'edit' ? `
            <div class="mb-3">
              <label for="status" class="form-label">Status</label>
              <select id="status" class="form-select" required>
                <option value="Pending" ${prescription.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Dispensed" ${prescription.status === 'Dispensed' ? 'selected' : ''}>Dispensed</option>
                <option value="Canceled" ${prescription.status === 'Canceled' ? 'selected' : ''}>Canceled</option>
              </select>
            </div>` : ''}
        </form>
      `;
    }

    const modalHtml = `
      <div class="modal fade" id="prescriptionModal" tabindex="-1" aria-hidden="true" aria-labelledby="prescriptionModalLabel">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title" id="prescriptionModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${mode === 'add' || mode === 'edit' ? `<button type="button" class="btn btn-primary" id="savePrescriptionBtn">${mode === 'add' ? 'Add' : 'Update'}</button>` : ''}
              ${mode === 'delete' ? `<button type="button" class="btn btn-danger" id="confirmDeletePrescriptionBtn">Delete</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('prescriptionModal');
    const modal = new bootstrap.Modal(modalEl);

    modal.show();

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });

    if (mode === 'add' || mode === 'edit') {
      document.getElementById('savePrescriptionBtn').addEventListener('click', () => this.savePrescription(mode, modal));
    }
    if (mode === 'delete') {
      document.getElementById('confirmDeletePrescriptionBtn').addEventListener('click', () => this.deletePrescription(prescription.prescriptionid, modal));
    }
  }

  async savePrescription(mode, modal) {
    const form = document.getElementById('prescriptionForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    const data = {
      prescriptionid: form.querySelector('#prescriptionId').value,
      admissionid: form.querySelector('#admissionId').value,
      medicineid: form.querySelector('#medicineId').value,
      doctorid: form.querySelector('#doctorId').value,
      quantity: form.querySelector('#quantity').value,
      status: mode === 'add' ? 'Pending' : form.querySelector('#status').value
    };

    try {
      const res = await axios.post(PRESCRIPTION_API,
        { operation: mode === 'add' ? 'insertPrescription' : 'updatePrescription', ...data },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.data.success === false) throw new Error(res.data.error);
      this.showAlert(`Prescription ${mode === 'add' ? 'added' : 'updated'} successfully!`, 'success');
      modal.hide();
      await this.loadPrescriptions();
    } catch (error) {
      this.showAlert(`Failed to save prescription: ${error.message}`, 'danger');
    }
  }

  async deletePrescription(id, modal) {
    try {
      const res = await axios.post(PRESCRIPTION_API,
        { operation: 'deletePrescription', prescriptionid: id },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.data.success === false) throw new Error(res.data.error);
      this.showAlert('Prescription deleted successfully!', 'success');
      modal.hide();
      await this.loadPrescriptions();
    } catch (error) {
      this.showAlert(`Failed to delete prescription: ${error.message}`, 'danger');
    }
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert.position-fixed').forEach(el => el.remove());
    const icons = {
      success: 'check-circle',
      danger: 'exclamation-triangle',
      warning: 'exclamation-circle',
      info: 'info-circle'
    };
    const icon = icons[type] || icons.info;
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed"
        style="top: 20px; right: 20px; z-index: 1055; min-width: 350px;">
        <i class="bi bi-${icon} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    const alertEl = document.querySelector('.alert.position-fixed');
    if (alertEl && window.bootstrap?.Alert) {
      new bootstrap.Alert(alertEl);
      setTimeout(() => bootstrap.Alert.getInstance(alertEl)?.close(), 4000);
    }
  }

  escape(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[c] || c));
  }
}

document.addEventListener('DOMContentLoaded', () => new PrescriptionManager());


////----------------------------
