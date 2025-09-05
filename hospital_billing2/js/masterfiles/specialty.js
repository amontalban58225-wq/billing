class SpecialtyManager {
  constructor() {
    this.baseApiUrl = 'http://localhost/hospital_billing2/api/specialty.php';
    this.specialtiesData = [];
    this.init();
  }

  init() {
    this.loadSpecialties();
    this.setupEventListeners();
    this.setupSearchFilter();
  }

  setupSearchFilter() {
    const input = document.getElementById('specialtySearch');
    if (!input) return;

    input.addEventListener('input', () => {
      const filter = input.value.toLowerCase();
      const tbody = document.getElementById('specialtyTableBody');
      if (!tbody) return;
      Array.from(tbody.rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    });
  }

  setupEventListeners() {
    document.getElementById('addSpecialtyBtn')?.addEventListener('click', () => this.openModal('add'));
    document.getElementById('specialtyTableBody')?.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (!id || !action) return;

      const specialty = this.specialtiesData.find(s => String(s.specialtyid) === String(id));
      if (!specialty) return;

      this.openModal(action, specialty);
    });
  }

  async loadSpecialties() {
    const tbody = document.getElementById('specialtyTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="2" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Loading specialties...</p>
    </td></tr>`;

    try {
      const res = await axios.get(this.baseApiUrl, { params: { operation: 'getAllSpecialties' } });
      if (res.data.error) throw new Error(res.data.error);
      this.specialtiesData = Array.isArray(res.data) ? res.data : [];
      this.renderSpecialtiesTable();
    } catch (err) {
      console.error('Error loading specialties:', err);
      tbody.innerHTML = `<tr><td colspan="2" class="text-center text-danger py-4">
        <i class="bi bi-exclamation-triangle me-2"></i>Failed to load specialties: ${err.message}
      </td></tr>`;
    }
  }

  renderSpecialtiesTable() {
    const tbody = document.getElementById('specialtyTableBody');
    if (!tbody) return;

    if (!this.specialtiesData.length) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-muted">
        <i class="bi bi-inbox me-2"></i>No specialties found
      </td></tr>`;
      return;
    }

    tbody.innerHTML = this.specialtiesData.map(specialty => `
      <tr>
        <td><strong>${specialty.name}</strong></td>
        <td>
        <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
          <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0;" data-id="${specialty.specialtyid}" data-action="view" title="View Details"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-warning me-1" style="flex-shrink: 0;" data-id="${specialty.specialtyid}" data-action="edit" title="Edit Specialty"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${specialty.specialtyid}" data-action="delete" title="Delete Specialty"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  openModal(mode, specialty = null) {
    document.querySelectorAll('#specialtyModal').forEach(m => m.remove());

    let body, title;

    if (mode === 'view') {
      title = 'View Specialty Details';
      body = `<p><strong>Specialty Name:</strong> ${specialty.name}</p>`;
    } else if (mode === 'delete') {
      title = 'Confirm Delete Specialty';
      body = `<p>Are you sure you want to delete specialty <strong>${specialty.name}</strong>?</p>`;
    } else {
      title = mode === 'add' ? 'Add New Specialty' : 'Edit Specialty';
      body = `
        <form id="specialtyForm" class="needs-validation" novalidate>
          <div id="formAlertContainer"></div>
          <input type="hidden" id="specialtyId" value="${specialty ? specialty.specialtyid : ''}">
          <div class="mb-3">
            <label for="specialtyName" class="form-label">Specialty Name</label>
            <input type="text" class="form-control" id="specialtyName" value="${specialty ? specialty.name : ''}" required>
            <div class="invalid-feedback">Specialty name is required.</div>
          </div>
        </form>`;
    }

    const modalHtml = `
      <div class="modal fade" id="specialtyModal" tabindex="-1" aria-labelledby="specialtyModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header ${mode === 'delete' ? 'bg-danger text-white' : 'bg-primary text-white'}">
              <h5 class="modal-title" id="specialtyModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${(mode === 'add' || mode === 'edit') ? `<button type="button" class="btn btn-primary" id="saveSpecialtyBtn">${mode === 'add' ? 'Add Specialty' : 'Update Specialty'}</button>` : ''}
              ${mode === 'delete' ? `<button type="button" class="btn btn-danger" id="confirmDeleteSpecialtyBtn">Delete</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById('specialtyModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());

    if (mode === 'add' || mode === 'edit') {
      const form = document.getElementById('specialtyForm');
      form.classList.remove('was-validated');

      document.getElementById('saveSpecialtyBtn').addEventListener('click', () => {
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }
        this.saveSpecialty(mode, modal);
      });
    } else if (mode === 'delete') {
      document.getElementById('confirmDeleteSpecialtyBtn').addEventListener('click', () => this.deleteSpecialty(specialty.specialtyid, modal));
    }
  }

  async saveSpecialty(mode, modal) {
    const form = document.getElementById('specialtyForm');
    const alertContainer = document.getElementById('formAlertContainer');
    alertContainer.innerHTML = '';

    const data = {
      name: form.querySelector('#specialtyName').value.trim()
    };

    if (mode === 'edit') {
      data.specialtyid = form.querySelector('#specialtyId').value;
    }

    const formData = new FormData();
    formData.append('operation', mode === 'edit' ? 'updateSpecialty' : 'insertSpecialty');
    formData.append('json', JSON.stringify(data));

    try {
      const res = await axios.post(this.baseApiUrl, formData);

      if (res.data.error) throw new Error(res.data.error);
      if (res.data.success === false) {
        alertContainer.innerHTML = `<div class="alert alert-danger">${res.data.error}</div>`;
        return;
      }

      this.showAlert(`Specialty ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      modal.hide();
      this.loadSpecialties();
    } catch (err) {
      console.error('Error saving specialty:', err);
      alertContainer.innerHTML = `<div class="alert alert-danger">Failed to ${mode === 'edit' ? 'update' : 'add'} specialty: ${err.message}</div>`;
    }
  }

  async deleteSpecialty(specialtyid, modal) {
    const formData = new FormData();
    formData.append('operation', 'deleteSpecialty');
    formData.append('specialtyid', specialtyid);

    try {
      const res = await axios.post(this.baseApiUrl, formData);

      if (res.data.error) throw new Error(res.data.error);
      if (res.data.success === false) throw new Error(res.data.error);

      this.showAlert('Specialty deleted successfully!', 'success');
      modal.hide();
      this.loadSpecialties();
    } catch (err) {
      console.error('Error deleting specialty:', err);
      this.showAlert(`Failed to delete specialty: ${err.message}`, 'danger');
    }
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert.position-fixed').forEach(el => el.remove());
    const icon =
      type === 'success' ? 'check-circle' :
      type === 'danger' ? 'exclamation-triangle' : 'info-circle';
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

document.addEventListener('DOMContentLoaded', () => new SpecialtyManager());
