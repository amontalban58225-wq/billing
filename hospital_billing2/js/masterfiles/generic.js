class GenericMedicineManager {
  constructor() {
    this.baseApiUrl = 'http://localhost/hospital_billing2/api/generic_medicine.php';
    this.genericMedicines = [];
    this.init();
  }

  async init() {
    await this.loadGenericMedicines();
    this.setupEventListeners();
    this.setupSearchFilter();
  }

  setupSearchFilter() {
    const input = document.getElementById('genericMedicineSearch');
    if (!input) return;

    input.addEventListener('input', () => {
      const filter = input.value.toLowerCase();
      const tbody = document.getElementById('genericMedicineTableBody');
      if (!tbody) return;

      Array.from(tbody.rows).forEach(row =>
        row.style.display = row.textContent.toLowerCase().includes(filter) ? '' : 'none'
      );
    });
  }

  setupEventListeners() {
    document.getElementById('addGenericMedicineBtn')?.addEventListener('click', () => this.openModal('add'));
    document.getElementById('genericMedicineTableBody')?.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (!id || !action) return;
      const genericMedicine = this.genericMedicines.find(g => String(g.genericid) === id);
      if (!genericMedicine && action !== 'add') {
        this.showAlert('Generic medicine not found', 'danger');
        return;
      }
      this.openModal(action, genericMedicine);
    });
  }

  async loadGenericMedicines() {
    const tbody = document.getElementById('genericMedicineTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr><td colspan="2" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">Loading generic medicines...</p>
      </td></tr>`;

    try {
      const res = await axios.get(this.baseApiUrl, { params: { operation: 'getAllGenericMedicines' } });
      if (!res.data.success) throw new Error(res.data.error || 'Failed to load generic medicines');
      this.genericMedicines = Array.isArray(res.data.data) ? res.data.data : [];
      this.renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-danger text-center py-4">Failed to load: ${err.message}</td></tr>`;
    }
  }

  renderTable() {
    const tbody = document.getElementById('genericMedicineTableBody');
    if (!tbody) return;

    if (this.genericMedicines.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-muted text-center py-4">No generic medicines found</td></tr>`;
      return;
    }

    tbody.innerHTML = this.genericMedicines.map(generic => `
      <tr>
        <td><strong>${generic.generic_name}</strong></td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-info" data-id="${generic.genericid}" data-action="view" title="View"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-warning" data-id="${generic.genericid}" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger" data-id="${generic.genericid}" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  openModal(mode, genericMedicine=null) {
    document.querySelectorAll('#genericMedicineModal').forEach(m => m.remove());

    let title = mode === 'add' ? 'Add New Generic Medicine' :
                mode === 'edit' ? 'Edit Generic Medicine' :
                'View Generic Medicine';
    let body = '';

    if (mode === 'view') {
      body = `<p><strong>Generic Name:</strong> ${genericMedicine.generic_name}</p>`;
    } else if (mode === 'delete') {
      title = 'Confirm Delete Generic Medicine';
      body = `<p>Are you sure you want to delete generic medicine <strong>${genericMedicine.generic_name}</strong>?<br>
              <small class="text-muted">This will be <b>permanently hidden</b> (soft deleted).</small></p>`;
    } else {
      body = `
        <form id="genericMedicineForm" class="needs-validation" novalidate>
          <div id="formAlertContainer"></div>
          <input type="hidden" id="genericId" value="${genericMedicine ? genericMedicine.genericid : ''}" />
          <div class="mb-3">
            <label for="genericName" class="form-label">Generic Name</label>
            <input type="text" id="genericName" class="form-control" value="${genericMedicine ? genericMedicine.generic_name : ''}" required />
            <div class="invalid-feedback">Generic name is required.</div>
          </div>
        </form>`;
    }

    const modalHtml = `
      <div class="modal fade" id="genericMedicineModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header ${mode === 'delete' ? 'bg-danger text-white' : 'bg-primary text-white'}">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${(mode === 'add' || mode === 'edit') ? `<button type="button" id="saveGenericMedicineBtn" class="btn btn-primary">${mode === 'add' ? 'Add' : 'Update'}</button>` : ''}
              ${mode === 'delete' ? `<button type="button" id="confirmDeleteGenericMedicineBtn" class="btn btn-danger">Delete</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById('genericMedicineModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());

    if (mode === 'add' || mode === 'edit') {
      document.getElementById('saveGenericMedicineBtn').addEventListener('click', () => {
        const form = document.getElementById('genericMedicineForm');
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }
        this.saveGenericMedicine(mode, modal);
      });
    } else if (mode === 'delete') {
      document.getElementById('confirmDeleteGenericMedicineBtn').addEventListener('click', () => {
        this.deleteGenericMedicine(genericMedicine.genericid, modal);
      });
    }
  }

  async saveGenericMedicine(mode, modal) {
    const form = document.getElementById('genericMedicineForm');
    const alertContainer = document.getElementById('formAlertContainer');
    alertContainer.innerHTML = '';

    const genericName = form.querySelector('#genericName').value.trim();
    if (!genericName) {
      alertContainer.innerHTML = `<div class="alert alert-danger">Generic name is required.</div>`;
      return;
    }

    const data = { generic_name: genericName };
    if (mode === 'edit') {
      data.genericid = parseInt(form.querySelector('#genericId').value, 10);
      if (isNaN(data.genericid)) {
        alertContainer.innerHTML = `<div class="alert alert-danger">Invalid generic ID.</div>`;
        return;
      }
    }

    const formData = new FormData();
    formData.append('operation', mode === 'edit' ? 'updateGenericMedicine' : 'insertGenericMedicine');
    formData.append('json', JSON.stringify(data));

    try {
      const res = await axios.post(this.baseApiUrl, formData);
      if (!res.data.success) {
        alertContainer.innerHTML = `<div class="alert alert-danger">${res.data.error || 'Unknown error'}</div>`;
        return;
      }
      this.showAlert(`Generic medicine ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      modal.hide();
      await this.loadGenericMedicines();
    } catch (err) {
      alertContainer.innerHTML = `<div class="alert alert-danger">Failed to ${mode === 'edit' ? 'update' : 'add'} generic medicine: ${err.message}</div>`;
    }
  }

  async deleteGenericMedicine(genericid, modal) {
    if (!genericid || isNaN(parseInt(genericid, 10))) {
      this.showAlert('Invalid generic medicine ID for deletion.', 'danger');
      return;
    }

    const formData = new FormData();
    formData.append('operation', 'deleteGenericMedicine');
    formData.append('genericid', genericid);

    try {
      const res = await axios.post(this.baseApiUrl, formData);
      if (!res.data.success) throw new Error(res.data.error || 'Unknown error');
      this.showAlert('Generic medicine has been permanently hidden (soft deleted).', 'success');
      modal.hide();
      await this.loadGenericMedicines();
    } catch (err) {
      this.showAlert(`Failed to delete generic medicine: ${err.message}`, 'danger');
    }
  }

  showAlert(message, type='info') {
    document.querySelectorAll('.alert.position-fixed').forEach(el => el.remove());
    const icon = type === 'success' ? 'check-circle' : (type === 'danger' ? 'exclamation-triangle' : 'info-circle');
    const alertHTML = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed"
           style="top:20px; right:20px; min-width:350px; z-index:1055;">
        <i class="bi bi-${icon} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', alertHTML);
    setTimeout(() => document.querySelector('.alert.position-fixed')?.remove(), 4000);
  }
}

document.addEventListener('DOMContentLoaded', () => { new GenericMedicineManager(); });
