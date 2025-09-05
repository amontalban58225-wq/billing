class MedicineManager {
  constructor() {
    this.baseApiUrl = 'http://localhost/hospital_billing2/api/medicine.php';
    this.genericMedicineApiUrl = 'http://localhost/hospital_billing2/api/generic_medicine.php';
    this.medicines = [];
    this.genericMedicines = [];
    this.init();
  }

  async init() {
    await this.loadGenericMedicines();
    await this.loadMedicines();
    this.setupEventListeners();
    this.setupSearchFilter();
  }

  setupSearchFilter() {
    const input = document.getElementById('medicineSearch');
    if (!input) return;

    input.addEventListener('input', () => {
      const filter = input.value.toLowerCase();
      const tbody = document.getElementById('medicineTableBody');
      if (!tbody) return;

      // Filter visible rows by text content
      Array.from(tbody.rows).forEach(row =>
        row.style.display = row.textContent.toLowerCase().includes(filter) ? '' : 'none'
      );
    });
  }

  setupEventListeners() {
    document.getElementById('addMedicineBtn')?.addEventListener('click', () => this.openModal('add'));
    document.getElementById('medicineTableBody')?.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (!id || !action) return;

      const medicine = this.medicines.find(m => String(m.medicineid) === id);
      if (!medicine) {
        this.showAlert('Selected medicine not found.', 'danger');
        return;
      }

      this.openModal(action, medicine);
    });
  }

  async loadGenericMedicines() {
    try {
      const res = await axios.get(this.genericMedicineApiUrl, { params: { operation: 'getAllGenericMedicines' } });
      if (!res.data.success) throw new Error(res.data.error || 'Failed to load generic medicines');
      this.genericMedicines = Array.isArray(res.data.data) ? res.data.data : [];
    } catch (err) {
      this.genericMedicines = [];
      this.showAlert('Error loading generic medicines: ' + err.message, 'danger');
    }
  }

  async loadMedicines() {
    const tbody = document.getElementById('medicineTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading medicines...</p></td></tr>`;

    try {
      const res = await axios.get(this.baseApiUrl, { params: { operation: 'getAllMedicines' } });
      if (!res.data.success) throw new Error(res.data.error || 'Failed to load medicines');
      this.medicines = Array.isArray(res.data.data) ? res.data.data : [];
      this.renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-danger text-center py-4">Failed to load medicines: ${err.message}</td></tr>`;
    }
  }

  renderTable() {
    const tbody = document.getElementById('medicineTableBody');
    if (!tbody) return;

    if (this.medicines.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-muted text-center py-4">No medicines found</td></tr>`;
      return;
    }

    tbody.innerHTML = this.medicines.map(m => `
      <tr>
        <td><strong>${m.brand_name}</strong></td>
        <td>${m.description ?? ''}</td>
        <td><span class="badge bg-success">₱${parseFloat(m.price).toFixed(2)}</span></td>
        <td>
          <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
            <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0;" data-id="${m.medicineid}" data-action="view" title="View"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-warning me-1" style="flex-shrink: 0;" data-id="${m.medicineid}" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${m.medicineid}" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  openModal(mode, medicine = null) {
    document.querySelectorAll('#medicineModal').forEach(modal => modal.remove());

    const genericOptions = this.genericMedicines.map(gm =>
      `<option value="${gm.genericid}" ${medicine && String(medicine.genericid) === String(gm.genericid) ? 'selected' : ''}>${gm.generic_name}</option>`
    ).join('');

    let title = '';
    let body = '';

    if (mode === 'view') {
      title = 'View Medicine Details';
      body = `
        <p><strong>Name:</strong> ${medicine.brand_name}</p>
        <p><strong>Generic Name:</strong> ${medicine.generic_name ?? ''}</p>
        <p><strong>Description:</strong> ${medicine.description ?? ''}</p>
        <p><strong>Price:</strong> ₱${parseFloat(medicine.price).toFixed(2)}</p>`;
    } else if (mode === 'delete') {
      title = 'Confirm Delete Medicine';
      body = `<p>Are you sure you want to delete medicine <strong>${medicine.brand_name}</strong>?</p>`;
    } else {
      title = mode === 'add' ? 'Add New Medicine' : 'Edit Medicine';
      body = `
        <form id="medicineForm" novalidate class="needs-validation">
          <input type="hidden" id="medicineId" value="${medicine ? medicine.medicineid : ''}" />
          <div class="mb-3">
            <label for="medName" class="form-label">Medicine Name</label>
            <input type="text" id="medName" class="form-control" value="${medicine ? medicine.brand_name : ''}" required />
            <div class="invalid-feedback">Medicine name is required.</div>
          </div>
          <div class="mb-3">
            <label for="medGeneric" class="form-label">Generic Name</label>
            <select id="medGeneric" class="form-select" required>
              <option value="">Select Generic Medicine</option>
              ${genericOptions}
            </select>
            <div class="invalid-feedback">Generic name is required.</div>
          </div>
          <div class="mb-3">
            <label for="medDescription" class="form-label">Description</label>
            <input type="text" id="medDescription" class="form-control" value="${medicine ? medicine.description ?? '' : ''}" />
          </div>
          <div class="mb-3">
            <label for="medPrice" class="form-label">Price (₱)</label>
            <input type="number" id="medPrice" class="form-control" value="${medicine ? medicine.price : ''}" step="0.01" min="0" required />
            <div class="invalid-feedback">Valid price is required.</div>
          </div>
          <div id="formAlertContainer"></div>
        </form>`;
    }

    const modalHtml = `
      <div class="modal fade" id="medicineModal" tabindex="-1" aria-labelledby="medicineModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header ${mode === 'delete' ? 'bg-danger text-white' : 'bg-primary text-white'}">
              <h5 class="modal-title" id="medicineModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${(mode === 'add' || mode === 'edit') ? `<button type="button" class="btn btn-primary" id="saveMedicineBtn">${mode === 'add' ? 'Add' : 'Update'}</button>` : ''}
              ${mode === 'delete' ? `<button type="button" class="btn btn-danger" id="confirmDeleteMedicineBtn">Delete</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById('medicineModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());

    if (mode === 'add' || mode === 'edit') {
      const form = document.getElementById('medicineForm');
      form.classList.remove('was-validated');
      document.getElementById('saveMedicineBtn').addEventListener('click', () => {
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }
        this.saveMedicine(mode, modal);
      });
    } else if (mode === 'delete') {
      document.getElementById('confirmDeleteMedicineBtn').addEventListener('click', () => {
        this.deleteMedicine(medicine.medicineid, modal);
      });
    }
  }

  async saveMedicine(mode, modal) {
    const form = document.getElementById('medicineForm');
    const alertContainer = form.querySelector('#formAlertContainer');
    alertContainer.innerHTML = '';

    const data = {
      medicineid: form.querySelector('#medicineId').value || null,
      brand_name: form.querySelector('#medName').value.trim(),
      genericid: form.querySelector('#medGeneric').value,
      description: form.querySelector('#medDescription').value.trim() || '',
      price: parseFloat(form.querySelector('#medPrice').value),
    };

    if (!data.genericid) {
      alertContainer.innerHTML = `<div class="alert alert-danger">Please select a generic medicine.</div>`;
      return;
    }

    if (isNaN(data.price) || data.price < 0) {
      alertContainer.innerHTML = `<div class="alert alert-danger">Please enter a valid non-negative price.</div>`;
      return;
    }

    const formData = new FormData();
    formData.append('operation', mode === 'edit' ? 'updateMedicine' : 'insertMedicine');
    formData.append('json', JSON.stringify(data));

    try {
      const res = await axios.post(this.baseApiUrl, formData);
      if (!res.data.success) {
        alertContainer.innerHTML = `<div class="alert alert-danger">${res.data.error || 'Unknown error'}</div>`;
        return;
      }
      this.showAlert(`Medicine ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      modal.hide();
      await this.loadMedicines();
    } catch (err) {
      alertContainer.innerHTML = `<div class="alert alert-danger">Failed to ${mode === 'edit' ? 'update' : 'add'} medicine: ${err.message}</div>`;
    }
  }

  async deleteMedicine(medicineid, modal) {
    if (!medicineid || isNaN(parseInt(medicineid, 10))) {
      this.showAlert('Invalid medicine ID for deletion.', 'danger');
      return;
    }

    const formData = new FormData();
    formData.append('operation', 'deleteMedicine');
    formData.append('medicineid', medicineid);

    try {
      const res = await axios.post(this.baseApiUrl, formData);
      if (!res.data.success) {
        throw new Error(res.data.error || 'Unknown error');
      }
      this.showAlert('Medicine deleted successfully!', 'success');
      modal.hide();
      await this.loadMedicines();
    } catch (err) {
      this.showAlert(`Failed to delete medicine: ${err.message}`, 'danger');
    }
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert.position-fixed').forEach(el => el.remove());
    const icon = type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle';

    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed"
           style="top: 20px; right: 20px; min-width: 350px; z-index: 1055;">
        <i class="bi bi-${icon} me-2"></i>${message}
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

document.addEventListener('DOMContentLoaded', () => { new MedicineManager(); });
