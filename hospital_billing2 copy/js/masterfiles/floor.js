class FloorManager {
  constructor() {
    this.baseApiUrl = 'http://localhost/hospital_billing2/api/floor.php';
    this.floorsData = [];
    this.init();
  }

  init() {
    this.loadFloors();
    this.setupEventListeners();
    this.setupSearchFilter();
  }

  setupSearchFilter() {
    const input = document.getElementById('floorSearch');
    if (!input) return;

    input.addEventListener('input', () => {
      const filter = input.value.toLowerCase();
      const tbody = document.getElementById('floorTableBody');
      if (!tbody) return;
      Array.from(tbody.rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    });
  }

  setupEventListeners() {
    document.getElementById('addFloorBtn')?.addEventListener('click', () => this.openModal('add'));
    document.getElementById('floorTableBody')?.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (!id || !action) return;

      const floor = this.floorsData.find(f => String(f.floorid) === String(id));
      if (!floor) return;

      if (action === 'restore') {
        this.restoreFloor(floor.floorid);
      } else {
        this.openModal(action, floor);
      }
    });
  }

  async loadFloors() {
    const tbody = document.getElementById('floorTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="2" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Loading floors...</p>
    </td></tr>`;

    try {
      const res = await axios.get(this.baseApiUrl, { params: { operation: 'getAllFloors' } });
      if (res.data.error) throw new Error(res.data.error);
      this.floorsData = Array.isArray(res.data) ? res.data : [];
      this.renderFloorsTable();
    } catch (err) {
      console.error('Error loading floors:', err);
      tbody.innerHTML = `<tr><td colspan="2" class="text-center text-danger py-4">
        <i class="bi bi-exclamation-triangle me-2"></i>Failed to load floors: ${err.message}
      </td></tr>`;
    }
  }

  renderFloorsTable() {
    const tbody = document.getElementById('floorTableBody');
    if (!tbody) return;

    if (!this.floorsData.length) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-muted">
        <i class="bi bi-inbox me-2"></i>No floors found
      </td></tr>`;
      return;
    }

    tbody.innerHTML = this.floorsData.map(floor => `
      <tr class="${floor.is_deleted == 1 ? 'table-danger text-muted' : ''}">
        <td>
          <strong>${floor.name}</strong>
          ${floor.is_deleted == 1 ? '<span class="badge bg-danger ms-2">Deleted</span>' : ''}
        </td>
        <td>
        <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
          ${floor.is_deleted == 1
            ? `<button class="btn btn-sm btn-outline-success me-1" style="flex-shrink: 0;" data-id="${floor.floorid}" data-action="restore" title="Restore Floor"><i class="bi bi-arrow-counterclockwise"></i></button>`
            : `
              <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0;" data-id="${floor.floorid}" data-action="view" title="View Details"><i class="bi bi-eye"></i></button>
              <button class="btn btn-sm btn-warning me-1" style="flex-shrink: 0;" data-id="${floor.floorid}" data-action="edit" title="Edit Floor"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${floor.floorid}" data-action="delete" title="Delete Floor"><i class="bi bi-trash"></i></button>
            `}
            </div>
        </td>
      </tr>`).join('');
  }

  openModal(mode, floor = null) {
    document.querySelectorAll('#floorModal').forEach(m => m.remove());

    let body, title;

    if (mode === 'view') {
      title = 'View Floor Details';
      body = `<p><strong>Floor Name:</strong> ${floor.name}</p>`;
    } else if (mode === 'delete') {
      title = 'Confirm Delete Floor';
      body = `<p>Are you sure you want to delete floor <strong>${floor.name}</strong>?</p>`;
    } else {
      title = mode === 'add' ? 'Add New Floor' : 'Edit Floor';
      body = `
        <form id="floorForm" class="needs-validation" novalidate>
          <div id="formAlertContainer"></div>
          <input type="hidden" id="floorId" value="${floor ? floor.floorid : ''}">
          <div class="mb-3">
            <label for="floorName" class="form-label">Floor Name</label>
            <input type="text" class="form-control" id="floorName" value="${floor ? floor.name : ''}" required>
            <div class="invalid-feedback">Floor name is required.</div>
          </div>
        </form>`;
    }

    const modalHtml = `
      <div class="modal fade" id="floorModal" tabindex="-1" aria-labelledby="floorModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header ${mode === 'delete' ? 'bg-danger text-white' : 'bg-primary text-white'}">
              <h5 class="modal-title" id="floorModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${(mode === 'add' || mode === 'edit') ? `<button type="button" class="btn btn-primary" id="saveFloorBtn">${mode === 'add' ? 'Add Floor' : 'Update Floor'}</button>` : ''}
              ${mode === 'delete' ? `<button type="button" class="btn btn-danger" id="confirmDeleteFloorBtn">Delete</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById('floorModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());

    if (mode === 'add' || mode === 'edit') {
      const form = document.getElementById('floorForm');
      form.classList.remove('was-validated');

      document.getElementById('saveFloorBtn').addEventListener('click', () => {
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }
        this.saveFloor(mode, modal);
      });
    } else if (mode === 'delete') {
      document.getElementById('confirmDeleteFloorBtn').addEventListener('click', () => this.deleteFloor(floor.floorid, modal));
    }
  }

  async saveFloor(mode, modal) {
    const form = document.getElementById('floorForm');
    const alertContainer = document.getElementById('formAlertContainer');
    alertContainer.innerHTML = '';

    const data = {
      name: form.querySelector('#floorName').value.trim()
    };

    if (mode === 'edit') {
      data.floorid = form.querySelector('#floorId').value;
    }

    const formData = new FormData();
    formData.append('operation', mode === 'edit' ? 'updateFloor' : 'insertFloor');
    formData.append('json', JSON.stringify(data));

    try {
      const res = await axios.post(this.baseApiUrl, formData);

      if (res.data.error) throw new Error(res.data.error);
      if (res.data.success === false) {
        alertContainer.innerHTML = `<div class="alert alert-danger">${res.data.error}</div>`;
        return;
      }

      this.showAlert(`Floor ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      modal.hide();
      this.loadFloors();
    } catch (err) {
      console.error('Error saving floor:', err);
      alertContainer.innerHTML = `<div class="alert alert-danger">Failed to ${mode === 'edit' ? 'update' : 'add'} floor: ${err.message}</div>`;
    }
  }

  async deleteFloor(floorid, modal) {
    const formData = new FormData();
    formData.append('operation', 'deleteFloor');
    formData.append('floorid', floorid);

    try {
      const res = await axios.post(this.baseApiUrl, formData);

      if (res.data.error) throw new Error(res.data.error);
      if (res.data.success === false) throw new Error(res.data.error);

      this.showAlert('Floor deleted successfully!', 'success');
      modal.hide();
      this.loadFloors();
    } catch (err) {
      console.error('Error deleting floor:', err);
      this.showAlert(`Failed to delete floor: ${err.message}`, 'danger');
    }
  }

  async restoreFloor(floorid) {
    const formData = new FormData();
    formData.append('operation', 'restoreFloor');
    formData.append('floorid', floorid);

    try {
      const res = await axios.post(this.baseApiUrl, formData);
      if (res.data.error) throw new Error(res.data.error);
      if (res.data.success === false) throw new Error(res.data.error);

      this.showAlert('Floor restored successfully!', 'success');
      this.loadFloors();
    } catch (err) {
      console.error('Error restoring floor:', err);
      this.showAlert(`Failed to restore floor: ${err.message}`, 'danger');
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

document.addEventListener('DOMContentLoaded', () => new FloorManager());
