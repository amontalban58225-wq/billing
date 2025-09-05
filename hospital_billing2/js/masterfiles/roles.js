class RoleManager {
  constructor() {
    this.rolesData = [];
    this.baseApiUrl = 'http://localhost/hospital_billing2/api';

    this.allPermissions = [
      "ALL",
      "Manage Billing",
      "Manage Lab Tests",
      "Manage Rooms",
      "Manage Roles",
      "Manage Patients",
      "Manage Doctors",
      "Manage Users",
      "Manage Admissions",
      "Manage Payments",
      "Manage Prescriptions",
      "Manage Doctor Assignments",
      "Manage Room Assignments",
      "Manage Lab Requests"
    ];

    this.init();
  }

  init() {
    this.loadRoles();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addRoleBtn');
    if (addBtn) addBtn.onclick = () => this.openModal('add');

    const tbody = document.getElementById('rolesTableBody');
    if (!tbody) return;

    tbody.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;

      const action = button.getAttribute('data-action');
      const id = button.getAttribute('data-id');
      const role = this.rolesData.find(r => String(r.roleid) === String(id));

      if (!action) return;

      if (action === 'delete') {
        this.confirmDeleteRole(role || { roleid: id });
      } else if (action === 'restore') {
        this.confirmRestoreRole(role || { roleid: id });
      } else if (['view', 'edit'].includes(action)) {
        this.openModal(action, role || { roleid: id });
      }
    });
  }

  async loadRoles(showInactive = false) {
    const tbody = document.getElementById('rolesTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-2 text-muted fw-semibold">Loading roles...</p>
        </td>
      </tr>`;

    try {
      const url = `${this.baseApiUrl}/roles.php?operation=getAllRoles${showInactive ? '&showInactive=1' : ''}`;
      const response = await axios.get(url);
      const data = response?.data;

      if (Array.isArray(data)) {
        this.rolesData = data.map(d => ({ status: d.status ?? 'Active', ...d }));
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        this.rolesData = [];
      }
      this.renderRolesTable();
    } catch (error) {
      console.error('Error loading roles:', error);
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle me-2"></i>Failed to load roles
          </td>
        </tr>`;
    }
  }

  renderRolesTable() {
    const tbody = document.getElementById('rolesTableBody');
    if (!tbody) return;

    if (!this.rolesData.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-muted">
            <i class="bi bi-inbox me-2"></i>No roles found
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = this.rolesData.map(role => {
      const perms = role.permissions
        ? role.permissions.split(',').map(p => `<span class="badge bg-info text-dark me-1">${p.trim()}</span>`).join('')
        : '<span class="text-muted">No permissions</span>';

      const isActive = role.status === 'Active';
      return `
        <tr class="fade-row ${!isActive ? 'table-danger' : ''}">
          <td><strong>${this.escape(role.name)}</strong></td>
          <td><span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">${this.escape(role.status)}</span></td>
          <td>${perms}</td>
          <td>
          <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
            ${isActive
              ? `
                <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0;" data-id="${role.roleid}" data-action="view"><i class="bi bi-eye"></i></button>
                <button class="btn btn-sm btn-warning me-1" style="flex-shrink: 0;" data-id="${role.roleid}" data-action="edit"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${role.roleid}" data-action="delete"><i class="bi bi-trash"></i></button>
              `
              : `
                <button class="btn btn-sm btn-success" data-id="${role.roleid}" data-action="restore">
                  <i class="bi bi-arrow-counterclockwise"></i> Restore
                </button>
              `}
              </div>
          </td>
        </tr>`;
    }).join('');
  }

  openModal(mode = 'add', role = null) {
    // remove existing modal
    this.removeOldModal('roleModal');

    const isView = mode === 'view';
    let modalHtml = `
      <div class="modal fade" id="roleModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-light">
              <h5 class="modal-title text-primary fw-bold">
                <i class="bi bi-${mode === 'edit' ? 'pencil-square' : isView ? 'eye' : 'shield-lock'} me-2"></i>
                ${mode === 'edit' ? 'Edit' : isView ? 'View' : 'Add'} Role
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="roleForm" novalidate>
                <input type="hidden" id="roleId" value="${role?.roleid ?? ''}" />

                <div class="mb-3">
                  <label for="roleName" class="form-label">Role Name</label>
                  <input type="text" class="form-control" id="roleName"
                    value="${role ? this.escape(role.name) : ''}" ${isView ? 'readonly' : ''} required>
                  <div class="invalid-feedback">Please enter the role name.</div>
                </div>

                <!-- Permissions Section -->
                <div class="mb-3">
                  <label class="form-label fw-bold">Permissions</label>
                  <div id="permissionsCheckboxes" class="row g-3"></div>
                  <div class="invalid-feedback d-block mt-2" id="permissionError" style="display:none;">
                    Please select at least one permission.
                  </div>
                </div>

                ${mode === 'add' ? '' : `
                <div class="mb-3">
                  <label for="roleStatus" class="form-label">Status</label>
                  <select class="form-select" id="roleStatus" ${isView ? 'disabled' : ''} required>
                    <option value="Active" ${role?.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Inactive" ${role?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                  </select>
                  <div class="invalid-feedback">Please select a status.</div>
                </div>`}
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
              ${isView ? '' : `<button class="btn btn-primary" id="saveRoleBtn">${mode === 'edit' ? 'Update' : 'Save'}</button>`}
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalElement = document.getElementById('roleModal');
    if (!modalElement || !bootstrap?.Modal) return;
    const modal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
    modal.show();

    if (!isView) {
      document.getElementById('saveRoleBtn').onclick = () => this.saveRole(mode, modal);
      this.setupFormValidation();
    }

    // Render grouped permissions
    const categories = {
      "General": ["ALL", "Manage Roles", "Manage Users"],
      "Patients & Doctors": ["Manage Patients", "Manage Doctors", "Manage Admissions"],
      "Billing": ["Manage Billing", "Manage Payments"],
      "Rooms & Labs": ["Manage Rooms", "Manage Room Assignments", "Manage Lab Tests", "Manage Lab Requests"],
      "Prescriptions": ["Manage Prescriptions", "Manage Doctor Assignments"]
    };

    const selectedPerms = role?.permissions ? role.permissions.split(',').map(p => p.trim()) : [];
    const permContainer = document.getElementById('permissionsCheckboxes');

    permContainer.innerHTML = Object.entries(categories).map(([cat, perms]) => {
      const color = cat === "General" ? "primary" :
                    cat === "Patients & Doctors" ? "success" :
                    cat === "Billing" ? "danger" :
                    cat === "Rooms & Labs" ? "warning" : "info";

      return `
        <div class="col-md-6">
          <div class="border rounded p-3 h-100">
            <h6 class="text-${color} mb-2"><i class="bi bi-dot"></i> ${cat}</h6>
            ${perms.map(p => {
              const safeId = p.replace(/\s+/g, '_');
              const checked = selectedPerms.includes(p) ? 'checked' : '';
              const disabled = isView ? 'disabled' : '';
              return `
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" value="${p}" id="perm_${safeId}" ${checked} ${disabled}>
                  <label class="form-check-label" for="perm_${safeId}">${p}</label>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    // Add event listener for ALL checkbox to toggle label text
    const allCheckbox = document.querySelector('#permissionsCheckboxes input[value="ALL"]');
    const allLabel = allCheckbox ? allCheckbox.nextElementSibling : null;

    if (allCheckbox && allLabel) {
      allCheckbox.addEventListener('change', function () {
        if (this.checked) {
          allLabel.textContent = 'Select All';
        } else {
          allLabel.textContent = 'ALL';
        }
      });
    }
  }

  confirmDeleteRole(role) {
    this.removeOldModal('confirmDeleteModal');
    const modalHtml = `
      <div class="modal fade" id="confirmDeleteModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title text-danger">Confirm Delete Role</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              Are you sure you want to delete the role <strong>${this.escape(role.name || '')}</strong>?
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmDeleteRoleBtn">Delete</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalElement = document.getElementById('confirmDeleteModal');
    const modal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
    modal.show();

    document.getElementById('confirmDeleteRoleBtn').onclick = () => {
      this.deleteRole(role.roleid, modal);
    };
  }

  confirmRestoreRole(role) {
    this.removeOldModal('confirmRestoreModal');
    const modalHtml = `
      <div class="modal fade" id="confirmRestoreModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title text-success">Confirm Restore Role</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              Are you sure you want to restore the role <strong>${this.escape(role.name || '')}</strong>?
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-success" id="confirmRestoreRoleBtn">Restore</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalElement = document.getElementById('confirmRestoreModal');
    const modal = new bootstrap.Modal(modalElement, { backdrop: 'static' });
    modal.show();

    document.getElementById('confirmRestoreRoleBtn').onclick = () => {
      this.restoreRole(role.roleid, modal);
    };
  }

  removeOldModal(modalId) {
    const oldModal = document.getElementById(modalId);
    if (oldModal) oldModal.remove();
  }

  setupFormValidation() {
    const form = document.getElementById('roleForm');
    if (!form) return;

    const requiredFields = [...form.querySelectorAll('[required]')];
    requiredFields.push({ id: 'permissionsCheckboxes' });

    requiredFields.forEach(field => {
      if (field.id === 'permissionsCheckboxes') {
        const permContainer = document.getElementById('permissionsCheckboxes');
        permContainer.addEventListener('change', () => this.validatePermissions());
      } else {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', () => this.clearFieldValidation(field));
      }
    });
  }

  validatePermissions() {
    const checkedBoxes = document.querySelectorAll('#permissionsCheckboxes input[type=checkbox]:checked');
    const errorDiv = document.getElementById('permissionError');
    if (checkedBoxes.length === 0) {
      errorDiv.style.display = 'block';
      return false;
    } else {
      errorDiv.style.display = 'none';
      return true;
    }
  }

  validateField(field) {
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
      return false;
    }
    field.classList.remove('is-invalid');
    return true;
  }

  clearFieldValidation(field) {
    field.classList.remove('is-invalid');
  }

  async saveRole(mode, modal) {
    const form = document.getElementById('roleForm');
    if (!form) return;

    const requiredFields = [...form.querySelectorAll('[required]')];
    let isValid = true;
    requiredFields.forEach(field => { if (!this.validateField(field)) isValid = false; });

    if (!this.validatePermissions()) isValid = false;

    if (!isValid) {
      this.showAlert('Please fill in all required fields correctly.', 'warning');
      return;
    }

    const checkedBoxes = document.querySelectorAll('#permissionsCheckboxes input[type=checkbox]:checked');
    const permissions = Array.from(checkedBoxes).map(cb => cb.value).join(',');

    const data = {
      name: document.getElementById('roleName').value.trim(),
      permissions
    };
    if (mode === 'edit') {
      data.roleid = document.getElementById('roleId').value;
      data.status = document.getElementById('roleStatus').value;
    }

    const formData = new FormData();
    formData.append('operation', mode === 'edit' ? 'updateRole' : 'insertRole');
    formData.append('json', JSON.stringify(data));

    const saveBtn = document.getElementById('saveRoleBtn');
    const originalText = saveBtn ? saveBtn.innerHTML : '';

    try {
      if (saveBtn) {
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
        saveBtn.disabled = true;
      }
      await axios.post(`${this.baseApiUrl}/roles.php`, formData);
      this.showAlert(`Role ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      if (modal) modal.hide();
      this.loadRoles();

    } catch (error) {
      console.error('Error saving role:', error);
      this.showAlert('Error saving role. Please try again.', 'danger');
    } finally {
      if (saveBtn) {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
      }
    }
  }

  async deleteRole(id, modal) {
    const deleteBtn = document.getElementById('confirmDeleteRoleBtn');
    const originalText = deleteBtn ? deleteBtn.innerHTML : '';

    try {
      if (deleteBtn) {
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deactivating...';
        deleteBtn.disabled = true;
      }

      const formData = new FormData();
      formData.append('operation', 'deleteRole');
      formData.append('roleid', id);

      await axios.post(`${this.baseApiUrl}/roles.php`, formData);
      this.showAlert('Role deactivated successfully!', 'success');
      if (modal) modal.hide();
      this.loadRoles(true);
    } catch (error) {
      console.error('Error deactivating role:', error);
      this.showAlert('Error deactivating role. Please try again.', 'danger');
    } finally {
      if (deleteBtn) {
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
      }
    }
  }

  async restoreRole(id, modal) {
    const restoreBtn = document.getElementById('confirmRestoreRoleBtn');
    const originalText = restoreBtn ? restoreBtn.innerHTML : '';

    try {
      if (restoreBtn) {
        restoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Restoring...';
        restoreBtn.disabled = true;
      }

      const formData = new FormData();
      formData.append('operation', 'restoreRole');
      formData.append('roleid', id);

      await axios.post(`${this.baseApiUrl}/roles.php`, formData);
      this.showAlert('Role restored successfully!', 'success');
      if (modal) modal.hide();
      this.loadRoles();
    } catch (error) {
      console.error('Error restoring role:', error);
      this.showAlert('Error restoring role. Please try again.', 'danger');
    } finally {
      if (restoreBtn) {
        restoreBtn.innerHTML = originalText;
        restoreBtn.disabled = false;
      }
    }
  }

  showAlert(message, type) {
    document.querySelectorAll('.alert').forEach(a => a.remove());
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
      if (alert && bootstrap?.Alert) new bootstrap.Alert(alert).close();
    }, 4000);
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

document.addEventListener("DOMContentLoaded", () => new RoleManager());
