class UserManager {
  constructor() {
    this.usersData = [];
    this.rolesData = [];
    this.baseApiUrl = 'http://localhost/hospital_billing2/api';
    this.init();
  }

  init() {
    this.loadRoles();
    this.loadUsers();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addUserBtn');
    if (addBtn) addBtn.onclick = () => this.openModal('add');

    const tbody = document.getElementById('usersTableBody');
    if (tbody) {
      tbody.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const id = button.getAttribute('data-id');
        const user = this.usersData.find(u => u.userid == id);

        if (action && user) {
          this.openModal(action, user);
        }
      });
    }
  }

  async loadRoles() {
    try {
      const response = await axios.get(`${this.baseApiUrl}/roles.php?operation=getAllRoles`);
      this.rolesData = response.data || [];
    } catch (error) {
      console.error('Failed to load roles:', error);
      this.rolesData = [];
    }
  }

  async loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">
      <div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading users...</p></td></tr>`;

    try {
      const response = await axios.get(`${this.baseApiUrl}/users.php?operation=getAllUsers`);
      this.usersData = Array.isArray(response.data) ? response.data : [];
      this.renderUsersTable();
    } catch (error) {
      console.error('Failed to load users:', error);
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">
        <i class="bi bi-exclamation-triangle me-2"></i>Failed to load users</td></tr>`;
    }
  }

  renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!this.usersData.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">
        <i class="bi bi-inbox me-2"></i>No users found</td></tr>`;
      return;
    }

    tbody.innerHTML = this.usersData.map(user => {
      const roleName = this.rolesData.find(r => r.roleid == user.roleid)?.name || 'N/A';
      const statusBadge = user.status === 'Active'
        ? '<span class="badge bg-success">Active</span>'
        : '<span class="badge bg-danger">Inactive</span>';
      return `
        <tr>
          <td><strong>${user.username}</strong></td>
          <td><strong>${roleName}</strong></td>
          <td>${statusBadge}</td>
          <td>
          <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
            <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0;" data-id="${user.userid}" data-action="view" title="View">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning me-1"style="flex-shrink: 0;" data-id="${user.userid}" data-action="edit" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${user.userid}" data-action="delete" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
          </td>
        </tr>`;
    }).join('');
  }

  openModal(mode = 'add', user = null) {
    document.querySelectorAll('#userModal').forEach(m => m.remove());

    let statusField = '';
    if (mode !== 'add') {
      statusField = `
      <div class="mb-3">
        <label for="userStatus" class="form-label">Status</label>
        <select id="userStatus" class="form-select" ${mode === 'view' ? 'disabled' : ''} required>
          <option value="Active" ${user && user.status === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Inactive" ${user && user.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
        </select>
        <div class="invalid-feedback">Please select a status.</div>
      </div>`;
    }

    let modalHtml = '';

    if (mode === 'delete') {
      // Updated delete modal with consistent plain theme
      modalHtml = `
        <div class="modal fade" id="userModal" tabindex="-1" aria-labelledby="userModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-light border-bottom text-danger">
                <h5 class="modal-title" id="userModalLabel">
                  <i class="bi bi-exclamation-triangle me-2"></i>Delete User
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body text-center pt-4">
                <i class="bi bi-exclamation-triangle display-4 text-danger mb-3"></i>
                <p>Are you sure you want to delete <strong>${user.username}</strong>?</p>
                <div class="alert alert-warning mt-3 d-flex align-items-center justify-content-center">
                  <i class="bi bi-info-circle me-2"></i>
                  <strong>Warning:</strong> This action cannot be undone.
                </div>
              </div>
              <div class="modal-footer bg-light border-top">
                <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button class="btn btn-danger" id="confirmDeleteUser">Delete</button>
              </div>
            </div>
          </div>
        </div>`;
    } else {
      const passwordField = mode === 'view' ? '' : `
      <div class="mb-3">
        <label for="password" class="form-label">${mode === 'edit' ? 'New Password (optional)' : 'Password'}</label>
        <input type="password" id="password" class="form-control" ${mode === 'add' ? 'required' : ''}>
        <div class="invalid-feedback">Please enter a password.</div>
      </div>`;

      modalHtml = `
        <div class="modal fade" id="userModal" tabindex="-1" aria-labelledby="userModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-light border-bottom">
                <h5 class="modal-title text-primary fw-bold" id="userModalLabel">
                  <i class="bi bi-${mode === 'edit' ? 'pencil-square' : mode === 'view' ? 'eye' : 'person-plus'} me-2"></i>
                  ${mode === 'edit' ? 'Edit' : mode === 'view' ? 'View' : 'Add'} User
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body p-4">
                <form id="userForm" novalidate>
                  <input type="hidden" id="userId" value="${user ? user.userid : ''}">

                  <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" id="username" class="form-control" value="${user ? user.username : ''}" ${mode === 'view' ? 'readonly' : ''} required>
                    <div class="invalid-feedback">Please enter a username.</div>
                  </div>

                  <div class="mb-3">
                    <label for="roleSelect" class="form-label">Role</label>
                    <select id="roleSelect" class="form-select" ${mode === 'view' ? 'disabled' : ''} required>
                      <option value="">-- Select Role --</option>
                      ${this.rolesData.map(role => `<option value="${role.roleid}" ${user && user.roleid == role.roleid ? 'selected' : ''}>${role.name}</option>`).join('')}
                    </select>
                    <div class="invalid-feedback">Please select a role.</div>
                  </div>

                  ${statusField}
                  ${passwordField}
                </form>
              </div>
              <div class="modal-footer bg-light border-top d-flex justify-content-end gap-2">
                <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                ${mode === 'view' ? '' : `<button class="btn btn-primary" id="saveUserBtn">${mode === 'edit' ? 'Update' : 'Save'}</button>`}
              </div>
            </div>
          </div>
        </div>`;
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalElement = document.getElementById('userModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    if (mode === 'delete') {
      document.getElementById('confirmDeleteUser').onclick = () => this.deleteUser(user.userid, modal);
    } else if (mode !== 'view') {
      document.getElementById('saveUserBtn').onclick = () => this.saveUser(mode, modal);
      this.setupFormValidation();
    }
  }

  setupFormValidation() {
    const form = document.getElementById('userForm');
    if (!form) return;
    [...form.querySelectorAll('[required]')].forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldValidation(input));
    });
  }

  validateField(field) {
    if (!field.value.trim() && !field.disabled) {
      field.classList.add('is-invalid');
      return false;
    }
    field.classList.remove('is-invalid');
    return true;
  }

  clearFieldValidation(field) {
    field.classList.remove('is-invalid');
  }

  async saveUser(mode, modal) {
    const form = document.getElementById('userForm');
    if (!form) return;

    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    requiredFields.forEach(f => { if (!this.validateField(f)) isValid = false; });

    if (!isValid) {
      this.showAlert('Please fill in required fields correctly.', 'warning');
      return;
    }

    const data = {
      userid: document.getElementById('userId').value,
      username: document.getElementById('username').value.trim(),
      roleid: document.getElementById('roleSelect').value,
      password: document.getElementById('password') ? document.getElementById('password').value : ''
    };

    if (mode === 'edit') {
      data.status = document.getElementById('userStatus').value;
      if (!data.password) delete data.password;
    }

    if (mode === 'add') {
      delete data.status; // Let backend default to Active
    }

    const formData = new FormData();
    formData.append('operation', mode === 'edit' ? 'updateUser' : 'insertUser');
    formData.append('json', JSON.stringify(data));

    const saveBtn = document.getElementById('saveUserBtn');
    const originalText = saveBtn.innerHTML;

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

      const res = await axios.post(`${this.baseApiUrl}/users.php`, formData);
      if (res.data.success) {
        this.showAlert(`User ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
        modal.hide();
        this.loadUsers();
      } else {
        throw new Error(res.data.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      this.showAlert('Error saving user, please try again.', 'danger');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }

  async deleteUser(id, modal) {
    const deleteBtn = document.getElementById('confirmDeleteUser');
    const originalText = deleteBtn.innerHTML;

    try {
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';

      const formData = new FormData();
      formData.append('operation', 'deleteUser');
      formData.append('userid', id);

      const res = await axios.post(`${this.baseApiUrl}/users.php`, formData);
      if (res.data.success) {
        this.showAlert('User deleted successfully', 'success');
        modal.hide();
        this.loadUsers();
      } else {
        throw new Error(res.data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      this.showAlert('Error deleting user, please try again.', 'danger');
    } finally {
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = originalText;
    }
  }

  showAlert(message, type) {
    const existingAlert = document.getElementById('userAlert');
    if (existingAlert) existingAlert.remove();

    const alertHtml = `
      <div id="userAlert" class="alert alert-${type} alert-dismissible fade show position-fixed"
           style="top:20px; right:20px; z-index:1050; min-width:300px;">
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', alertHtml);

    setTimeout(() => {
      const alert = document.getElementById('userAlert');
      if (alert) bootstrap.Alert.getOrCreateInstance(alert).close();
    }, 4000);
  }
}

document.addEventListener('DOMContentLoaded', () => new UserManager());
