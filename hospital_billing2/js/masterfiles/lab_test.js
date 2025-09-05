// Lab Test Module JavaScript - Dashboard Integration
class LabTestManager {
  constructor() {
    this.testsData = [];
    this.categoriesData = [];
    this.baseApiUrl = 'http://localhost/hospital_billing2/api';
    this.init();
  }

  init() {
    this.loadCategories();
    this.loadTests();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addTestBtn');
    if (addBtn) addBtn.onclick = () => this.openModal('add');

    const tbody = document.getElementById('testsTableBody');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const id = button.getAttribute('data-id');
        const test = this.testsData.find(t => t.testid == id);

        if (action && test) {
          this.openModal(action, test);
        }
      });
    }
  }

  async loadCategories() {
    try {
      const response = await axios.get(`${this.baseApiUrl}/lab_test_category.php?operation=getAllCategories`);
      if (response.data && Array.isArray(response.data)) {
        // Only show active categories
        this.categoriesData = response.data.filter(cat => cat.is_active == 1);
      } else {
        this.categoriesData = [];
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      this.categoriesData = [];
    }
  }

  async loadTests() {
    const tbody = document.getElementById('testsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-2">Loading tests...</p>
        </td>
      </tr>`;

    try {
      const response = await axios.get(`${this.baseApiUrl}/lab_test.php?operation=getAllTests`);
      this.testsData = (response.data && Array.isArray(response.data)) ? response.data : [];
      this.renderTestsTable();
    } catch (error) {
      console.error('Error loading tests:', error);
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle me-2"></i>Failed to load tests
          </td>
        </tr>`;
    }
  }

  renderTestsTable() {
    const tbody = document.getElementById('testsTableBody');
    if (!tbody) return;

    if (!this.testsData.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-inbox me-2"></i>No tests found
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = this.testsData.map(test => `
      <tr>
        <td><strong>${test.name}</strong></td>
        <td><span class="badge bg-info">${test.category_name || 'Unknown'}</span></td>
        <td><span class="badge bg-success">₱${parseFloat(test.price).toFixed(2)}</span></td>
        <td>
        <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
          <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0; " data-id="${test.testid}" data-action="view">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-warning me-1" style="flex-shrink: 0;" data-id="${test.testid}" data-action="edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${test.testid}" data-action="delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

  openModal(mode = 'add', test = null) {
    document.querySelectorAll('#testModal').forEach(m => m.remove());
    let modalHtml = '';

    if (mode === 'delete') {
      modalHtml = `
        <div class="modal fade" id="testModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header text-danger">
                <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Delete Test</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-center">
                <i class="bi bi-exclamation-triangle display-4 text-danger mb-3"></i>
                <p>Are you sure you want to delete <strong>${test.name}</strong>?</p>
                <div class="alert alert-warning mt-3">
                  <i class="bi bi-info-circle me-2"></i>
                  <strong>Warning:</strong> This action cannot be undone.
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteTest">Delete</button>
              </div>
            </div>
          </div>
        </div>`;
    } else {
      const categoryOptions = this.categoriesData.map(cat =>
        `<option value="${cat.labtestcatid}" ${test && test.categoryid == cat.labtestcatid ? 'selected' : ''}>${cat.name}</option>`
      ).join('');

      modalHtml = `
        <div class="modal fade" id="testModal" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="bi bi-${mode === 'edit' ? 'pencil-square' : mode === 'view' ? 'eye' : 'flask'} me-2"></i>
                  ${mode === 'edit' ? 'Edit' : mode === 'view' ? 'View' : 'Add'} Test
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form id="testForm" novalidate>
                  <input type="hidden" id="testId" value="${test ? test.testid : ''}" />

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="testName" class="form-label">Test Name</label>
                      <input type="text" class="form-control" id="testName"
                             value="${test ? test.name : ''}"
                             ${mode === 'view' ? 'readonly' : ''} required>
                      <div class="invalid-feedback">Please enter the test name.</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="testCategory" class="form-label">Category</label>
                      <select class="form-select" id="testCategory" ${mode === 'view' ? 'disabled' : ''} required>
                        <option value="">-- Select Category --</option>
                        ${categoryOptions}
                      </select>
                      <div class="invalid-feedback">Please select a category.</div>
                    </div>
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="testPrice" class="form-label">Price</label>
                      <div class="input-group">
                        <span class="input-group-text">₱</span>
                        <input type="number" class="form-control" id="testPrice"
                               step="0.01" min="0"
                               value="${test ? test.price : ''}"
                               ${mode === 'view' ? 'readonly' : ''} required>
                        <div class="invalid-feedback">Please enter a valid price.</div>
                      </div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="testDescription" class="form-label">Description</label>
                      <textarea class="form-control" id="testDescription" rows="3"
                                ${mode === 'view' ? 'readonly' : ''}>${test ? test.description : ''}</textarea>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                ${mode === 'view' ? '' : `
                  <button type="button" class="btn btn-primary" id="saveTestBtn">
                    ${mode === 'edit' ? 'Update' : 'Save'}
                  </button>`}
              </div>
            </div>
          </div>
        </div>`;
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalElement = document.getElementById('testModal');
    if (modalElement && bootstrap?.Modal) {
      const modal = new bootstrap.Modal(modalElement, { backdrop: true });
      modal.show();

      if (mode === 'delete') {
        const confirmBtn = document.getElementById('confirmDeleteTest');
        if (confirmBtn) confirmBtn.onclick = () => this.deleteTest(test.testid, modal);
      } else if (mode !== 'view') {
        const saveBtn = document.getElementById('saveTestBtn');
        if (saveBtn) saveBtn.onclick = () => this.saveTest(mode, modal);
      }

      if (mode !== 'view' && mode !== 'delete') this.setupFormValidation();
    }
  }

  setupFormValidation() {
    const form = document.getElementById('testForm');
    const inputs = form.querySelectorAll('[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldValidation(input));
    });
  }

  validateField(field) {
    if (!field.value.trim() || (field.type === 'number' && field.value < field.min)) {
      field.classList.add('is-invalid');
      return false;
    }
    field.classList.remove('is-invalid');
    return true;
  }

  clearFieldValidation(field) {
    field.classList.remove('is-invalid');
  }

  async saveTest(mode, modal) {
    const form = document.getElementById('testForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    requiredFields.forEach(field => { if (!this.validateField(field)) isValid = false; });
    if (!isValid) {
      this.showAlert('Please fill in all required fields correctly.', 'warning');
      return;
    }

    const data = {
      name: document.getElementById('testName').value.trim(),
      categoryid: document.getElementById('testCategory').value,
      price: parseFloat(document.getElementById('testPrice').value),
      description: document.getElementById('testDescription').value.trim()
    };
    if (mode === 'edit') data.testid = document.getElementById('testId').value;

    const formData = new FormData();
    formData.append('operation', mode === 'edit' ? 'updateTest' : 'insertTest');
    formData.append('json', JSON.stringify(data));

    const saveBtn = document.getElementById('saveTestBtn');
    const originalText = saveBtn.innerHTML;

    try {
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
      saveBtn.disabled = true;

      await axios.post(`${this.baseApiUrl}/lab_test.php`, formData);
      this.showAlert(`Test ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');

      setTimeout(() => {
        if (modal) modal.hide();
        this.loadTests();
      }, 2000);

    } catch (error) {
      console.error('Error saving test:', error);
      this.showAlert('Error saving test. Please try again.', 'danger');
    } finally {
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
      }, 2000);
    }
  }

  async deleteTest(id, modal) {
    const deleteBtn = document.getElementById('confirmDeleteTest');
    const originalText = deleteBtn.innerHTML;

    try {
      deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';
      deleteBtn.disabled = true;

      const formData = new FormData();
      formData.append('operation', 'deleteTest');
      formData.append('testid', id);

      await axios.post(`${this.baseApiUrl}/lab_test.php`, formData);
      this.showAlert('Test deleted successfully!', 'success');

      setTimeout(() => {
        if (modal) modal.hide();
        this.loadTests();
      }, 2000);

    } catch (error) {
      console.error('Error deleting test:', error);
      this.showAlert('Error deleting test. Please try again.', 'danger');
    } finally {
      setTimeout(() => {
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
      }, 2000);
    }
  }

  showAlert(message, type) {
    document.querySelectorAll('.alert').forEach(a => a.remove());
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed"
           style="top:20px; right:20px; z-index:9999; min-width:350px;">
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    setTimeout(() => {
      const alert = document.querySelector('.alert');
      if (alert) new bootstrap.Alert(alert).close();
    }, 4000);
  }
}

document.addEventListener('DOMContentLoaded', () => new LabTestManager());
