class BillingCategoryManager {
  constructor() {
    this.apiUrl = 'http://localhost/hospital_billing2/api/billing_category.php';
    this.categories = [];
    this.init();
  }

  init() {
    this.loadCategories();
    this.setupEventListeners();
    this.setupSearchFilter();
  }

  setupEventListeners() {
    document.getElementById('addCategoryBtn').addEventListener('click', () => this.openModal('add'));
    document.getElementById('categoryTableBody').addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (!id || !action) return;

      const category = this.categories.find(c => String(c.billing_categoryid) === String(id));
      if (!category) return;

      this.openModal(action, category);
    });
  }

  setupSearchFilter() {
    const input = document.getElementById('categorySearch');
    if (!input) return;

    input.addEventListener('input', () => {
      const filter = input.value.toLowerCase();
      const tbody = document.getElementById('categoryTableBody');
      Array.from(tbody.rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    });
  }

  async loadCategories() {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Loading categories...</p>
    </td></tr>`;

    try {
      const res = await axios.get(this.apiUrl, { params: { operation: 'getAllCategories' }});
      if (res.data.success === false) throw new Error(res.data.error);
      this.categories = res.data.data || [];
      this.renderTable();
    } catch(err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">${err.message}</td></tr>`;
    }
  }

  renderTable() {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;

    if (this.categories.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No categories found.</td></tr>`;
      return;
    }
    tbody.innerHTML = this.categories.map(category => `
      <tr>
        <td>
          <strong>${this.escape(category.name)}</strong>
          ${category.source_table ? `<div class="small text-muted">Source: ${this.escape(category.source_table)}</div>` : ''}
        </td>
        <td>$${parseFloat(category.default_unit_price || 0).toFixed(2)}</td>
        <td>${category.tax_rate ? category.tax_rate + '%' : '0%'}</td>
        <td><span class="badge ${category.is_active ? 'bg-success' : 'bg-secondary'}">${ category.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
            <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0;" data-id="${category.billing_categoryid}" data-action="view" title="View Category"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-warning me-1" style="flex-shrink: 0;" data-id="${category.billing_categoryid}" data-action="edit" title="Edit Category"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${category.billing_categoryid}" data-action="delete" title="Delete Category"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');}
  }

  openModal(mode, category = null) {
    // Remove existing modal
    const existingModal = document.getElementById('categoryModal');
    if (existingModal) existingModal.remove();

    let title = '';
    let body = '';

    if (mode === 'view') {
      title = 'View Billing Category';
      body = `
        <p><strong>Name:</strong> ${this.escape(category.name)}</p>
        <p><strong>Default Unit Price:</strong> $${parseFloat(category.default_unit_price || 0).toFixed(2)}</p>
        <p><strong>Tax Rate:</strong> ${category.tax_rate || 0}%</p>
        <p><strong>Discount Eligible:</strong> ${category.discount_eligible ? 'Yes' : 'No'}</p>
        <p><strong>Status:</strong> ${category.is_active ? 'Active' : 'Inactive'}</p>
        <p><strong>Source Table:</strong> ${category.source_table || 'None'}</p>
        <p><strong>Source Field:</strong> ${category.source_field || 'None'}</p>
        <p><strong>Source Condition:</strong> ${category.source_condition || 'None'}</p>
      `;
    } else if (mode === 'delete') {
      title = 'Confirm Delete Category';
      body = `<p>Are you sure you want to delete category <strong>${this.escape(category.name)}</strong>?</p>`;
    } else {
      title = mode === 'add' ? 'Add New Category' : 'Edit Category';
      body = `
        <form id="categoryForm" class="needs-validation" novalidate>
          <input type="hidden" id="categoryId" value="${category ? category.billing_categoryid : ''}" />
          <div class="mb-3">
            <label for="categoryName" class="form-label">Category Name</label>
            <input type="text" id="categoryName" class="form-control" value="${category ? this.escape(category.name) : ''}" required />
            <div class="invalid-feedback">Category name is required.</div>
          </div>
          <div class="mb-3">
            <label for="defaultUnitPrice" class="form-label">Default Unit Price</label>
            <input type="number" step="0.01" min="0" id="defaultUnitPrice" class="form-control" value="${category ? category.default_unit_price || 0 : 0}" required />
            <div class="invalid-feedback">Default unit price is required.</div>
          </div>
          <div class="mb-3">
            <label for="taxRate" class="form-label">Tax Rate (%)</label>
            <input type="number" step="0.01" min="0" max="100" id="taxRate" class="form-control" value="${category ? category.tax_rate || 0 : 0}" />
          </div>
          <hr>
          <h6 class="mb-3">Automated Billing Source</h6>
          <div class="mb-3">
            <label for="sourceTable" class="form-label">Source Table</label>
            <select id="sourceTable" class="form-select">
              <option value="" ${!category?.source_table ? 'selected' : ''}>None</option>
              <option value="Room" ${category?.source_table === 'Room' ? 'selected' : ''}>Room</option>
              <option value="Lab_Test" ${category?.source_table === 'Lab_Test' ? 'selected' : ''}>Laboratory Test</option>
              <option value="Medicine" ${category?.source_table === 'Medicine' ? 'selected' : ''}>Medicine</option>
            </select>
            <div class="form-text">Select the source table for automated billing items</div>
          </div>
          <div class="mb-3">
            <label for="sourceField" class="form-label">Source Field (Price/Rate)</label>
            <input type="text" id="sourceField" class="form-control" value="${category ? this.escape(category.source_field || '') : ''}" />
            <div class="form-text">Field name containing the price/rate in the source table</div>
          </div>
          <div class="mb-3">
            <label for="sourceCondition" class="form-label">Source Condition (Optional)</label>
            <input type="text" id="sourceCondition" class="form-control" value="${category ? this.escape(category.source_condition || '') : ''}" />
            <div class="form-text">SQL WHERE condition to filter source items (e.g. is_active=1)</div>
          </div>
          <hr>
          <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="discountEligible" ${category && category.discount_eligible ? 'checked' : ''} />
            <label class="form-check-label" for="discountEligible">Eligible for Discount</label>
          </div>
          <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="isActive" ${category && category.is_active ? 'checked' : ''} checked />
            <label class="form-check-label" for="isActive">Active</label>
          </div>
        </form>
      `;
    }

    const modalHtml = `
      <div class="modal fade" id="categoryModal" tabindex="-1" aria-labelledby="categoryModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header ${mode === 'delete' ? 'bg-danger text-white' : 'bg-primary text-white'}">
              <h5 class="modal-title" id="categoryModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${(mode === 'add' || mode === 'edit') ? `<button type="button" class="btn btn-primary" id="saveCategoryBtn">${mode === 'add' ? 'Add' : 'Update'}</button>` : ''}
              ${mode === 'delete' ? `<button type="button" class="btn btn-danger" id="confirmDeleteCategoryBtn">Delete</button>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('categoryModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());

    if (mode === 'add' || mode === 'edit') {
      document.getElementById('saveCategoryBtn').addEventListener('click', () => this.saveCategory(mode, modal));
      const form = document.getElementById('categoryForm');
      form.classList.remove('was-validated');
      form.addEventListener('submit', e => e.preventDefault());
    } else if (mode === 'delete') {
      document.getElementById('confirmDeleteCategoryBtn').addEventListener('click', () => this.deleteCategory(category.billing_categoryid, modal));
    }
  }

  async saveCategory(mode, modal) {
    const form = document.getElementById('categoryForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const data = {
      billing_categoryid: form.querySelector('#categoryId').value || null,
      name: form.querySelector('#categoryName').value.trim(),
      default_unit_price: parseFloat(form.querySelector('#defaultUnitPrice').value) || 0,
      tax_rate: parseFloat(form.querySelector('#taxRate').value) || 0,
      source_table: form.querySelector('#sourceTable').value,
      source_field: form.querySelector('#sourceField').value.trim(),
      source_condition: form.querySelector('#sourceCondition').value.trim(),
      discount_eligible: form.querySelector('#discountEligible').checked ? 1 : 0,
      is_active: form.querySelector('#isActive').checked ? 1 : 0
    };

    try {
      const res = await axios.post(this.apiUrl, {
        operation: mode === 'edit' ? 'updateCategory' : 'insertCategory',
        json: data
      });
      if (res.data.success === false) {
        this.showAlert(res.data.error, 'danger');
        return;
      }
      this.showAlert(`Category ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      modal.hide();
      this.loadCategories();
    } catch (err) {
      this.showAlert(`Failed to ${mode === 'edit' ? 'update' : 'add'} category: ${err.message}`, 'danger');
    }
  }

  async deleteCategory(id, modal) {
    try {
      const res = await axios.post(this.apiUrl, null, {
        params: { operation: 'deleteCategory', billing_categoryid: id }
      });
      if (res.data.success === false) throw new Error(res.data.error);
      this.showAlert('Category deleted successfully!', 'success');
      modal.hide();
      this.loadCategories();
    } catch (err) {
      this.showAlert('Failed to delete category: ' + err.message, 'danger');
    }
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert.position-fixed').forEach(el => el.remove());

    const icon = type === 'success' ? 'check-circle' : (type === 'danger' ? 'exclamation-triangle' : 'info-circle');
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
      setTimeout(() => bsAlert.close(), 3000);
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

document.addEventListener('DOMContentLoaded', () => new BillingCategoryManager());
