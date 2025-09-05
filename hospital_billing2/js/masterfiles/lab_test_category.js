class LabTestCategoryManager {
  constructor() {
    this.categoriesData = [];
    this.baseApiUrl = 'http://localhost/hospital_billing2/api';
    this.init();
  }

  init() {
    // inject minimal CSS for smooth loader + fade-in once
    if (!document.getElementById('labcatStyles')) {
      const css = `
        .smooth-loader{display:inline-block}
        .smooth-loader span{
          display:inline-block;width:8px;height:8px;margin:0 3px;border-radius:50%;
          background: currentColor; opacity:.4; animation: lc-bounce 1s infinite ease-in-out;
        }
        .smooth-loader span:nth-child(2){animation-delay:.15s}
        .smooth-loader span:nth-child(3){animation-delay:.3s}
        @keyframes lc-bounce{0%,80%,100%{transform:scale(0.8);opacity:.3}40%{transform:scale(1);opacity:1}}
        .fade-row{animation: lc-fade .25s ease-out}
        @keyframes lc-fade{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:none}}
      `;
      const style = document.createElement('style');
      style.id = 'labcatStyles';
      style.textContent = css;
      document.head.appendChild(style);
    }

    this.loadCategories();       // load active by default
    this.setupEventListeners();  // wire events (delegated)
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addCategoryBtn');
    if (addBtn) addBtn.onclick = () => this.openModal('add');

    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

    // Event delegation for dynamic table buttons
    tbody.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;

      const action = button.getAttribute('data-action');
      const id = button.getAttribute('data-id');
      const category = this.categoriesData.find(c => String(c.labtestcatid) === String(id));
      if (!action) return;

      if (['view','edit','delete','restore'].includes(action)) {
        this.openModal(action, category || { labtestcatid: id });
      }
    });
  }

  async loadCategories(showInactive = false) {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

    // Smooth loader
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5">
          <div class="smooth-loader"><span></span><span></span><span></span></div>
          <p class="mt-3 text-muted fw-semibold">Loading categories...</p>
        </td>
      </tr>`;

    try {
      const url = `${this.baseApiUrl}/lab_test_category.php?operation=getAllCategories${showInactive ? '&showInactive=1' : ''}`;
      const response = await axios.get(url);
      const data = response?.data;

      if (Array.isArray(data)) {
        // If API doesn’t include is_active (older version), assume active
        this.categoriesData = data.map(d => ({ is_active: d.is_active ?? 1, ...d }));
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        this.categoriesData = [];
      }
      this.renderCategoriesTable();
    } catch (error) {
      console.error('Error loading categories:', error);
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle me-2"></i>Failed to load categories
          </td>
        </tr>`;
    }
  }

  renderCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

    if (!this.categoriesData.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-inbox me-2"></i>No categories found
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = this.categoriesData.map(category => `
      <tr class="fade-row ${Number(category.is_active) === 0 ? 'table-danger' : ''}">
        <td><strong>${category.name}</strong></td>
        <td><span class="badge bg-success">₱${Number(category.handling_fee ?? 0).toFixed(2)}</span></td>
        <td><span class="badge bg-info">${Number(category.turnaround_days ?? 0)} days</span></td>
        <td>
        <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
          ${Number(category.is_active) === 1
            ? `
              <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0;" data-id="${category.labtestcatid}" data-action="view"><i class="bi bi-eye"></i></button>
              <button class="btn btn-sm btn-warning me-1" style="flex-shrink: 0;" data-id="${category.labtestcatid}" data-action="edit"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${category.labtestcatid}" data-action="delete"><i class="bi bi-trash"></i></button>
            `
            : `
              <button class="btn btn-sm btn-success" data-id="${category.labtestcatid}" data-action="restore">
                <i class="bi bi-arrow-counterclockwise"></i> Restore
              </button>
            `}
          </div>
        </td>
      </tr>
    `).join('');
  }

  openModal(mode = 'add', category = null) {
    // Remove any existing modal
    document.querySelectorAll('#categoryModal').forEach(m => m.remove());

    // Build modal HTML
    let modalHtml = '';

    if (mode === 'delete') {
      modalHtml = `
        <div class="modal fade" id="categoryModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header text-danger">
                <h5 class="modal-title">
                  <i class="bi bi-exclamation-triangle me-2"></i>Deactivate Category
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-center">
                <p>Are you sure you want to deactivate <strong>${this.escape(category?.name ?? '')}</strong>?</p>
                <div class="alert alert-warning">
                  <i class="bi bi-info-circle me-2"></i>This will hide the category but not permanently delete it.
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  <i class="bi bi-x-circle me-2"></i>Cancel
                </button>
                <button type="button" class="btn btn-danger" id="confirmDeleteCategory">
                  <i class="bi bi-trash me-2"></i>Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>`;
    } else if (mode === 'restore') {
      modalHtml = `
        <div class="modal fade" id="categoryModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header text-success">
                <h5 class="modal-title">
                  <i class="bi bi-arrow-counterclockwise me-2"></i>Restore Category
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-center">
                <p>Restore category <strong>${this.escape(category?.name ?? '')}</strong>?</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  <i class="bi bi-x-circle me-2"></i>Cancel
                </button>
                <button type="button" class="btn btn-success" id="confirmRestoreCategory">
                  <i class="bi bi-arrow-counterclockwise me-2"></i>Restore
                </button>
              </div>
            </div>
          </div>
        </div>`;
    } else {
      // add / edit / view form
      const isView = mode === 'view';
      modalHtml = `
        <div class="modal fade" id="categoryModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="bi bi-${mode === 'edit' ? 'pencil-square' : isView ? 'eye' : 'diagram-3'} me-2"></i>
                  ${mode === 'edit' ? 'Edit' : isView ? 'View' : 'Add'} Category
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form id="categoryForm" novalidate>
                  <input type="hidden" id="categoryId" value="${category ? category.labtestcatid : ''}" />

                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label for="categoryName" class="form-label">
                          <i class="bi bi-tag me-1"></i>Category Name
                        </label>
                        <input type="text" class="form-control" id="categoryName"
                               value="${category ? this.escape(category.name) : ''}"
                               ${isView ? 'readonly' : ''}
                               placeholder="e.g., Blood Tests, Imaging" required>
                        <div class="invalid-feedback">Please enter the category name.</div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label for="handlingFee" class="form-label">
                          <i class="bi bi-currency-dollar me-1"></i>Handling Fee
                        </label>
                        <div class="input-group">
                          <span class="input-group-text">₱</span>
                          <input type="number" class="form-control" id="handlingFee"
                                 step="0.01" min="0"
                                 value="${category ? Number(category.handling_fee ?? 0).toFixed(2) : ''}"
                                 ${isView ? 'readonly' : ''}
                                 placeholder="0.00" required>
                        </div>
                        <div class="invalid-feedback">Please enter a valid handling fee.</div>
                      </div>
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label for="turnaroundDays" class="form-label">
                          <i class="bi bi-calendar-check me-1"></i>Turnaround Days
                        </label>
                        <input type="number" class="form-control" id="turnaroundDays"
                               min="1"
                               value="${category ? Number(category.turnaround_days ?? 1) : ''}"
                               ${isView ? 'readonly' : ''}
                               placeholder="e.g., 3" required>
                        <div class="invalid-feedback">Please enter the turnaround days.</div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label for="categoryDescription" class="form-label">
                          <i class="bi bi-text-paragraph me-1"></i>Description
                        </label>
                        <textarea class="form-control" id="categoryDescription" rows="3"
                                  ${isView ? 'readonly' : ''}
                                  placeholder="Optional description of the category">${category ? this.escape(category.description ?? '') : ''}</textarea>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  <i class="bi bi-x-circle me-2"></i>Close
                </button>
                ${isView ? '' : `
                  <button type="button" class="btn btn-primary" id="saveCategoryBtn">
                    <i class="bi bi-check-circle me-2"></i>${mode === 'edit' ? 'Update' : 'Save'}
                  </button>`}
              </div>
            </div>
          </div>
        </div>`;
    }

    // Render + wire
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalElement = document.getElementById('categoryModal');
    if (!modalElement) return;

    const modal = new bootstrap.Modal(modalElement, { backdrop: true });
    modal.show();

    if (mode === 'delete') {
      const confirmBtn = document.getElementById('confirmDeleteCategory');
      if (confirmBtn) confirmBtn.onclick = () => this.deleteCategory(category.labtestcatid, modal);
    } else if (mode === 'restore') {
      const confirmBtn = document.getElementById('confirmRestoreCategory');
      if (confirmBtn) confirmBtn.onclick = () => this.restoreCategory(category.labtestcatid, modal);
    } else if (mode !== 'view') {
      const saveBtn = document.getElementById('saveCategoryBtn');
      if (saveBtn) saveBtn.onclick = () => this.saveCategory(mode, modal);
      this.setupFormValidation();
    }
  }

  setupFormValidation() {
    const form = document.getElementById('categoryForm');
    if (!form) return;
    const inputs = form.querySelectorAll('.form-control[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldValidation(input));
    });
  }

  validateField(field) {
    if (field.hasAttribute('required') && !String(field.value).trim()) {
      field.classList.add('is-invalid');
      return false;
    }
    if (field.type === 'number' && field.value !== '' && Number(field.value) < Number(field.min || 0)) {
      field.classList.add('is-invalid');
      return false;
    }
    field.classList.remove('is-invalid');
    return true;
  }

  clearFieldValidation(field) {
    field.classList.remove('is-invalid');
  }

  async saveCategory(mode, modal) {
    const form = document.getElementById('categoryForm');
    if (!form) return;

    const requiredFields = form.querySelectorAll('.form-control[required]');
    let isValid = true;
    requiredFields.forEach(field => { if (!this.validateField(field)) isValid = false; });
    if (!isValid) {
      this.showAlert('Please fill in all required fields correctly.', 'warning');
      return;
    }

    const data = {
      name: document.getElementById('categoryName').value.trim(),
      description: document.getElementById('categoryDescription').value.trim(),
      handling_fee: parseFloat(document.getElementById('handlingFee').value),
      turnaround_days: parseInt(document.getElementById('turnaroundDays').value, 10)
    };
    if (mode === 'edit') data.labtestcatid = document.getElementById('categoryId').value;

    const formData = new FormData();
    formData.append('operation', mode === 'edit' ? 'updateCategory' : 'insertCategory');
    formData.append('json', JSON.stringify(data));

    const saveBtn = document.getElementById('saveCategoryBtn');
    const originalText = saveBtn ? saveBtn.innerHTML : '';

    try {
      if (saveBtn) { saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...'; saveBtn.disabled = true; }
      const res = await axios.post(`${this.baseApiUrl}/lab_test_category.php`, formData);
      if (res?.data?.success === false) throw new Error(res.data.error || 'Save failed');

      this.showAlert(`Category ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      modal?.hide();
      this.loadCategories(); // reload active list
    } catch (error) {
      console.error('Error saving category:', error);
      this.showAlert('Error saving category. Please try again.', 'danger');
    } finally {
      if (saveBtn) { saveBtn.innerHTML = originalText; saveBtn.disabled = false; }
    }
  }

  async deleteCategory(id, modal) {
    const btn = document.getElementById('confirmDeleteCategory');
    const original = btn ? btn.innerHTML : '';
    try {
      if (btn) { btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deactivating...'; btn.disabled = true; }

      const formData = new FormData();
      formData.append('operation', 'deleteCategory'); // soft-delete on API
      formData.append('labtestcatid', id);

      const res = await axios.post(`${this.baseApiUrl}/lab_test_category.php`, formData);
      if (res?.data?.success === false) throw new Error(res.data.error || 'Deactivate failed');

      this.showAlert('Category deactivated successfully!', 'success');
      modal?.hide();
      this.loadCategories(true); // show the deactivated row with Restore
    } catch (error) {
      console.error('Error deactivating category:', error);
      this.showAlert('Error deactivating category. Please try again.', 'danger');
    } finally {
      if (btn) { btn.innerHTML = original; btn.disabled = false; }
    }
  }

  async restoreCategory(id, modal) {
    const btn = document.getElementById('confirmRestoreCategory');
    const original = btn ? btn.innerHTML : '';
    try {
      if (btn) { btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Restoring...'; btn.disabled = true; }

      const formData = new FormData();
      formData.append('operation', 'restoreCategory');
      formData.append('labtestcatid', id);

      const res = await axios.post(`${this.baseApiUrl}/lab_test_category.php`, formData);
      if (res?.data?.success === false) throw new Error(res.data.error || 'Restore failed');

      this.showAlert('Category restored successfully!', 'success');
      modal?.hide();
      this.loadCategories(); // back to active list
    } catch (error) {
      console.error('Error restoring category:', error);
      this.showAlert('Error restoring category. Please try again.', 'danger');
    } finally {
      if (btn) { btn.innerHTML = original; btn.disabled = false; }
    }
  }

  showAlert(message, type) {
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed"
           style="top:20px; right:20px; z-index:9999; min-width:350px;">
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${this.escape(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    setTimeout(() => {
      const alert = document.querySelector('.alert');
      if (alert && window.bootstrap?.Alert) new bootstrap.Alert(alert).close();
    }, 4000);
  }

  // simple HTML escaper for injected text content
  escape(str) {
    return String(str ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }
}

// Init immediately on DOM ready
document.addEventListener('DOMContentLoaded', () => new LabTestCategoryManager());
