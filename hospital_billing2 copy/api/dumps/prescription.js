/* global axios, bootstrap */

const BASE_API_URL = 'http://localhost/hospital_billing2/api/';
const TRANSACTIONS_API_URL = BASE_API_URL + 'transactions/';

class PrescriptionManager {
  constructor() {
    this.apiUrl = TRANSACTIONS_API_URL + 'prescription.php';
    this.prescriptions = [];
    this.admissions = [];  // active admissions for selection
    this.medicines = [];
    this.doctors = [];
    this.init();
  }

  async init() {
    await Promise.all([
      this.loadPrescriptions(),
      this.loadAdmissions(),
      this.loadMedicines(),
      this.loadDoctors()
    ]);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add prescription button
    document.getElementById('addPrescriptionBtn')?.addEventListener('click', () => this.openModal('add'));

    // Event delegation for table action buttons
    const tbody = document.getElementById('prescriptionTableBody');
    if (tbody) {
      tbody.removeEventListener('click', this.handleTableClick);
      tbody.addEventListener('click', this.handleTableClick.bind(this));
    }
  }

  handleTableClick(event) {
    const btn = event.target.closest('button');
    if (!btn) return;

    const id = this.escape(btn.dataset.id);
    const action = this.escape(btn.dataset.action);
    const prescription = this.prescriptions.find(p => String(p.prescriptionid) === String(id));
    if (!prescription) return;

    this.openModal(action, prescription);
  }

  async loadPrescriptions() {
    const tbody = document.getElementById('prescriptionTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.loadingRow(7, 'Loading prescriptions...');

    try {
      const response = await axios.get(this.apiUrl, { params: { operation: 'getAllPrescriptions' } });
      this.prescriptions = Array.isArray(response.data) ? response.data : [];
      this.renderTable();
    } catch (error) {
      tbody.innerHTML = this.errorRow(7, error.message);
    }
  }

  async loadAdmissions() {
    try {
      const response = await axios.get(TRANSACTIONS_API_URL + 'admission.php', { params: { operation: 'getActiveAdmissions' } });
      this.admissions = Array.isArray(response.data) ? response.data : [];
    } catch {
      this.admissions = [];
    }
  }

  async loadMedicines() {
    try {
      const response = await axios.get(BASE_API_URL + 'medicine.php', { params: { operation: 'getAllMedicines' } });
      this.medicines = Array.isArray(response.data) ? response.data : (response.data.data || []);
    } catch {
      this.medicines = [];
    }
  }

  async loadDoctors() {
    try {
      const response = await axios.get(BASE_API_URL + 'doctors.php', { params: { operation: 'getAllDoctors' } });
      this.doctors = Array.isArray(response.data) ? response.data : (response.data.data || []);
    } catch {
      this.doctors = [];
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
      <tr class="fade-row">
        <td><strong>${this.escape(p.patient_name || '')}</strong></td>
        <td>${this.escape(p.medicine_name || '')}</td>
        <td>${this.escape(p.doctor_name || '')}</td>
        <td>${this.escape(p.quantity ?? '')}</td>
        <td><span class="${this.escape(p.status_class || 'badge bg-secondary')}">${this.escape(p.status_label || p.status || '')}</span></td>
        <td>${this.escape(p.prescription_date || '')}</td>
        <td>
          <div style="display:flex; gap:8px; flex-wrap: nowrap;">
            <button title="View" class="btn btn-sm btn-info" data-id="${this.escape(p.prescriptionid)}" data-action="view">
              <i class="bi bi-eye"></i>
            </button>
            <button title="Edit" class="btn btn-sm btn-warning" data-id="${this.escape(p.prescriptionid)}" data-action="edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button title="Delete" class="btn btn-sm btn-danger" data-id="${this.escape(p.prescriptionid)}" data-action="delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  loadingRow(colspan, message) {
    return `<tr><td colspan="${colspan}" class="text-center py-4">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">${message}</p>
    </td></tr>`;
  }

  errorRow(colspan, message) {
    return `<tr><td colspan="${colspan}" class="text-center text-danger py-4">${this.escape(message)}</td></tr>`;
  }

  openModal(mode, item = null) {
    document.querySelectorAll('#prescriptionModal').forEach(modal => modal.remove());

    let title, body;

    if (mode === 'view') {
      title = 'View Prescription';
      body = `
        <p><strong>Patient:</strong> ${this.escape(item.patient_name)}</p>
        <p><strong>Medicine:</strong> ${this.escape(item.medicine_name)}</p>
        <p><strong>Doctor:</strong> ${this.escape(item.doctor_name)}</p>
        <p><strong>Quantity:</strong> ${this.escape(item.quantity)}</p>
        <p><strong>Status:</strong> ${this.escape(item.status)}</p>
        <p><strong>Date:</strong> ${this.escape(item.prescription_date)}</p>
      `;
    } else if (mode === 'delete') {
      title = 'Confirm Delete Prescription';
      body = `<p>Are you sure you want to delete the prescription for <strong>${this.escape(item.patient_name)}</strong> - <strong>${this.escape(item.medicine_name)}</strong>?</p>`;
    } else {
      title = mode === 'add' ? 'Add Prescription' : 'Edit Prescription';
      body = `
        <form id="prescriptionForm" class="needs-validation" novalidate>
          <input type="hidden" id="prescriptionId" value="${item ? this.escape(item.prescriptionid) : ''}" />

          <div class="mb-3">
            <label class="form-label">Admission / Patient</label>
            ${mode === 'add' ? `
              <select id="admissionId" class="form-select" required>
                <option value="">Select Admission</option>
                ${this.admissions.map(a => `
                  <option value="${this.escape(a.admissionid)}">${this.escape(a.patient_name)} (Adm #${this.escape(a.admissionid)})</option>`).join('')}
              </select>
              <div class="invalid-feedback">Please select an admission/patient.</div>
            ` : `
              <input type="text" id="admissionDisplay" class="form-control" readonly value="${this.escape(item.patient_name)} (Adm #${this.escape(item.admissionid)})" />
            `}
          </div>

          <div class="mb-3">
            <label class="form-label">Medicine</label>
            <select id="medicineId" class="form-select" required>
              <option value="">Select Medicine</option>
              ${this.medicines.map(m => `
                <option value="${this.escape(m.medicineid)}" ${item && item.medicineid == m.medicineid ? 'selected' : ''}>${this.escape(m.brand_name || m.name || '')}</option>`).join('')}
            </select>
            <div class="invalid-feedback">Please select a medicine.</div>
          </div>

          <div class="mb-3">
            <label class="form-label">Doctor</label>
            <select id="doctorId" class="form-select" required>
              <option value="">Select Doctor</option>
              ${this.doctors.map(d => `
                <option value="${this.escape(d.doctorid)}" ${item && item.doctorid == d.doctorid ? 'selected' : ''}>${this.escape(d.fullname || '')}</option>`).join('')}
            </select>
            <div class="invalid-feedback">Please select a doctor.</div>
          </div>

          <div class="mb-3">
            <label class="form-label">Quantity</label>
            <input type="number" id="quantity" class="form-control" min="1" value="${item ? this.escape(item.quantity) : 1}" required />
            <div class="invalid-feedback">Quantity must be at least 1.</div>
          </div>

          ${mode === 'edit' ? `
          <div class="mb-3">
            <label class="form-label">Status</label>
            <select id="prescriptionStatus" class="form-select" required>
              <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Dispensed" ${item.status === 'Dispensed' ? 'selected' : ''}>Dispensed</option>
              <option value="Canceled" ${item.status === 'Canceled' ? 'selected' : ''}>Canceled</option>
            </select>
            <div class="invalid-feedback">Please select a status.</div>
          </div>` : ''}
        </form>
      `;
    }

    const headerClass = mode === 'add' ? 'bg-success' : mode === 'edit' ? 'bg-warning' : mode === 'delete' ? 'bg-danger' : 'bg-primary';

    const modalHtml = `
      <div class="modal fade" id="prescriptionModal" tabindex="-1" aria-labelledby="prescriptionModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header ${headerClass} text-white">
              <h5 class="modal-title" id="prescriptionModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${(mode === 'add' || mode === 'edit') ? `<button type="button" class="btn btn-primary" id="savePrescriptionBtn">${mode === 'add' ? 'Add' : 'Update'}</button>` : ''}
              ${mode === 'delete' ? `<button type="button" class="btn btn-danger" id="confirmDeletePrescriptionBtn">Delete</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById('prescriptionModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    if (mode === 'add' || mode === 'edit') {
      document.getElementById('savePrescriptionBtn').addEventListener('click', () => this.savePrescription(mode, bsModal));
      document.getElementById('prescriptionForm').addEventListener('submit', e => e.preventDefault());
    } else if (mode === 'delete') {
      document.getElementById('confirmDeletePrescriptionBtn').addEventListener('click', () => this.deletePrescription(item.prescriptionid, bsModal));
    }

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
  }

  async savePrescription(mode, modal) {
    const form = document.getElementById('prescriptionForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const prescriptionId = this.escape(form.querySelector('#prescriptionId').value) || null;

    const data = {
      prescriptionid: prescriptionId,
      admissionid: mode === 'add' ? this.escape(form.querySelector('#admissionId').value)
        : this.prescriptions.find(p => String(p.prescriptionid) === String(prescriptionId))?.admissionid,
      medicineid: this.escape(form.querySelector('#medicineId').value),
      doctorid: this.escape(form.querySelector('#doctorId').value),
      quantity: this.escape(form.querySelector('#quantity').value),
      status: mode === 'add' ? 'Pending' : this.escape(form.querySelector('#prescriptionStatus').value)
    };

    try {
      const res = await axios.post(this.apiUrl, {
        operation: mode === 'add' ? 'insertPrescription' : 'updatePrescription',
        ...data
      });

      if (res.data.success === false) throw new Error(res.data.error);

      this.showAlert(`Prescription ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      modal.hide();
      this.loadPrescriptions();
    } catch (err) {
      this.showAlert(`Failed to save prescription: ${err.message}`, 'danger');
    }
  }

  async deletePrescription(id, modal) {
    try {
      const res = await axios.post(this.apiUrl, {
        operation: 'deletePrescription',
        prescriptionid: this.escape(id)
      });

      if (res.data.success === false) throw new Error(res.data.error);

      this.showAlert('Prescription deleted successfully!', 'success');
      modal.hide();
      this.loadPrescriptions();
    } catch (err) {
      this.showAlert(`Failed to delete prescription: ${err.message}`, 'danger');
    }
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert.position-fixed').forEach(e => e.remove());
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
      const bsAlert = new bootstrap.Alert(alertEl);
      setTimeout(() => bsAlert.close(), 4000);
    }
  }

  escape(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

document.addEventListener('DOMContentLoaded', () => new PrescriptionManager());
