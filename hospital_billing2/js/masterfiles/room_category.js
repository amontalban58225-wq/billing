class RoomCategoryManager {
  constructor() {
    this.baseApiUrl = 'http://localhost/hospital_billing2/api/room_category.php';
    this.categoriesData = [];
    this.init();
  }

  init() {
    this.loadCategories();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById('addRoomCategoryBtn')?.addEventListener('click', () => this.openModal('add'));

    document.getElementById('roomCategoryTableBody')?.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      const category = this.categoriesData.find(c => String(c.categoryid) === String(id));

      if (!action || !category) return;

      this.openModal(action, category);
    });
  }

  async loadCategories() {
    const tbody = document.getElementById('roomCategoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-5">
          <div class="smooth-loader">
            <span></span><span></span><span></span>
          </div>
          <p class="mt-3 text-muted fw-semibold">Loading categories...</p>
        </td>
      </tr>`;

    try {
      const res = await axios.get(this.baseApiUrl);
      if (res.data.error) throw new Error(res.data.error);
      this.categoriesData = Array.isArray(res.data) ? res.data : [];
      this.renderTable();
    } catch (error) {
      console.error(error);
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle me-2"></i>Failed to load categories
          </td>
        </tr>`;
    }
  }

  renderTable() {
    const tbody = document.getElementById('roomCategoryTableBody');
    if (!tbody) return;

    if (this.categoriesData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted">
            <i class="bi bi-inbox me-2"></i>No room categories found
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = this.categoriesData.map(cat => {
      const rateFormatted = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
      }).format(cat.rate_per_day ?? 0);

      return `
      <tr>
        <td><strong>${cat.name}</strong></td>
        <td>${cat.description || ''}</td>
        <td><span class="badge bg-success">${rateFormatted}</span></td>
        <td>
        <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
          <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0;" data-id="${cat.categoryid}" data-action="view" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-warning me-1" style="flex-shrink: 0;" data-id="${cat.categoryid}" data-action="edit" title="Edit Category">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${cat.categoryid}" data-action="delete" title="Delete Category">
            <i class="bi bi-trash"></i>
          </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  openModal(mode, category = null) {
    document.querySelectorAll('#categoryModal').forEach(m => m.remove());

    let modalHtml = '';
    if (mode === 'delete') {
      modalHtml = `
        <div class="modal fade" id="categoryModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-light border-bottom text-danger">
                <h5 class="modal-title">
                  <i class="bi bi-exclamation-triangle me-2"></i>Delete Room Category
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body text-center pt-4">
                <p>Are you sure you want to delete <strong>${category.name}</strong>?</p>
              </div>
              <div class="modal-footer bg-light border-top">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteBtn" data-id="${category.categoryid}">
                  <i class="bi bi-trash me-2"></i>Delete
                </button>
              </div>
            </div>
          </div>
        </div>`;
    } else if (mode === 'view') {
      modalHtml = this.getViewModalHtml(category);
    } else if (mode === 'add' || mode === 'edit') {
      modalHtml = this.getFormModalHtml(mode, category);
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById('categoryModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());

    if (mode === 'delete') {
      modalEl.querySelector('#confirmDeleteBtn').addEventListener('click', async () => {
        await this.deleteCategory(category.categoryid, bsModal);
      });
    } else if (mode === 'add' || mode === 'edit') {
      const form = modalEl.querySelector('#categoryForm');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        await this.handleFormSave(mode, bsModal);
      });
    }
  }

  getViewModalHtml(category) {
    return `
    <div class="modal fade" id="categoryModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-eye me-2"></i>View Room Category</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p><strong>Name:</strong> ${category.name}</p>
            <p><strong>Description:</strong><br/>${category.description || '(No description)'}</p>
            <p><strong>Daily Rate:</strong> ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(category.rate_per_day ?? 0)}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  getFormModalHtml(mode, category) {
    const isEdit = mode === 'edit';
    const title = `${isEdit ? 'Edit' : 'Add'} Room Category`;
    const icon = isEdit ? 'pencil-square' : 'plus-circle';

    return `
    <div class="modal fade" id="categoryModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <form id="categoryForm" novalidate>
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-${icon} me-2"></i>${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <input type="hidden" id="categoryId" value="${category?.categoryid || ''}">
              <div class="mb-3">
                <label for="categoryName" class="form-label">Category Name</label>
                <input type="text" id="categoryName" class="form-control" value="${category?.name || ''}" required>
              </div>
              <div class="mb-3">
                <label for="categoryDescription" class="form-label">Description</label>
                <textarea id="categoryDescription" class="form-control" rows="3">${category?.description || ''}</textarea>
              </div>
              <div class="mb-3">
                <label for="ratePerDay" class="form-label">Daily Rate</label>
                <input type="number" id="ratePerDay" class="form-control" step="0.01" min="0" value="${category?.rate_per_day ?? ''}" required>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  async handleFormSave(mode, modal) {
    const form = document.getElementById('categoryForm');
    const id = form.querySelector('#categoryId').value;
    const name = form.querySelector('#categoryName').value.trim();
    const description = form.querySelector('#categoryDescription').value.trim();
    const rate_per_day = parseFloat(form.querySelector('#ratePerDay').value);

    if (!name || isNaN(rate_per_day) || rate_per_day < 0) {
      this.showAlert("Invalid input", "danger");
      return;
    }

    try {
      if (mode === 'add') {
        await axios.post(this.baseApiUrl, { name, description, rate_per_day });
      } else {
        await axios.put(`${this.baseApiUrl}?id=${id}`, { name, description, rate_per_day });
      }

      this.showAlert(`Category ${mode === 'add' ? 'added' : 'updated'} successfully!`, 'success');
      modal.hide();
      this.loadCategories();
    } catch (error) {
      console.error(error);
      this.showAlert(error.response?.data?.error || 'Failed to save category.', 'danger');
    }
  }

  async deleteCategory(id, modal) {
    try {
      await axios.delete(`${this.baseApiUrl}?id=${id}`);
      this.showAlert('Category deleted successfully!', 'success');
      modal.hide();
      this.loadCategories();
    } catch (error) {
      console.error(error);
      this.showAlert('Failed to delete category.', 'danger');
    }
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert.position-fixed').forEach(e => e.remove());

    const icon = type === 'success' ? 'check-circle' :
      type === 'danger' ? 'exclamation-triangle' :
      type === 'warning' ? 'exclamation-circle' : 'info-circle';

    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed"
           style="top: 20px; right: 20px; z-index: 1055; min-width: 350px;">
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

document.addEventListener('DOMContentLoaded', () => new RoomCategoryManager());
