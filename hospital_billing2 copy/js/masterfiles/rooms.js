class RoomManager {
  constructor() {
    this.baseApiUrl = 'http://localhost/hospital_billing2/api/rooms.php';
    this.categoryApiUrl = 'http://localhost/hospital_billing2/api/room_category.php';
    this.floorApiUrl = 'http://localhost/hospital_billing2/api/floor.php';
    this.roomsData = [];
    this.categoriesData = [];
    this.floorsData = [];
    this.init();
  }

  async init() {
    await Promise.all([this.loadCategories(), this.loadFloors()]);
    this.loadRooms();
    this.setupEventListeners();
    this.setupSearchFilter();
  }

  setupSearchFilter() {
    const input = document.getElementById('roomSearchInput');
    if (!input) return;

    input.addEventListener('input', () => {
      const filter = input.value.toLowerCase();
      const tbody = document.getElementById('roomTableBody');
      if (!tbody) return;
      Array.from(tbody.rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    });
  }

  setupEventListeners() {
    document.getElementById('addRoomBtn')?.addEventListener('click', () => this.openModal('add'));
    document.getElementById('roomTableBody')?.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (!id || !action) return;

      const room = this.roomsData.find(r => r.room_no === id);
      if (!room) return;

      this.openModal(action, room);
    });
  }

  async loadCategories() {
    try {
      const res = await axios.get(this.categoryApiUrl, {
        params: { operation: 'getAllCategories' },
      });
      if (res.data.error) throw new Error(res.data.error);
      this.categoriesData = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Failed to load room categories:', err);
      this.categoriesData = [];
    }
  }

  async loadFloors() {
    try {
      const res = await axios.get(this.floorApiUrl, {
        params: { operation: 'getAllFloors' },
      });
      if (res.data.error) throw new Error(res.data.error);
      this.floorsData = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Failed to load floors:', err);
      this.floorsData = [];
    }
  }

  async loadRooms() {
    const tbody = document.getElementById('roomTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Loading rooms...</p>
    </td></tr>`;

    try {
      const res = await axios.get(this.baseApiUrl, { params: { operation: 'getAllRooms' } });
      if (res.data.error) throw new Error(res.data.error);
      this.roomsData = Array.isArray(res.data) ? res.data : [];
      this.renderRoomsTable();
    } catch (err) {
      console.error('Error loading rooms:', err);
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">
        <i class="bi bi-exclamation-triangle me-2"></i>Failed to load rooms: ${err.message}
      </td></tr>`;
    }
  }

  renderRoomsTable() {
    const tbody = document.getElementById('roomTableBody');
    if (!tbody) return;

    if (!this.roomsData.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
        <i class="bi bi-inbox me-2"></i>No rooms found
      </td></tr>`;
      return;
    }

    tbody.innerHTML = this.roomsData.map(room => `
      <tr>
        <td><strong>${room.room_no}</strong></td>
        <td><span class="badge bg-info">${room.category_name ?? ''}</span></td>
        <td><span class="badge bg-secondary">${room.floor_name ?? ''}</span></td>
        <td><span class="badge bg-${room.status === 'Available' ? 'success' : 'warning'}">${room.status}</span></td>
        <td>
        <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
          <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0;" data-id="${room.room_no}" data-action="view" title="View Details"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-warning me-1" style="flex-shrink: 0;" data-id="${room.room_no}" data-action="edit" title="Edit Room"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" style="flex-shrink: 0;" data-id="${room.room_no}" data-action="delete" title="Delete Room"><i class="bi bi-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
  }

  openModal(mode, room = null) {
    document.querySelectorAll('#roomModal').forEach(m => m.remove());

    const categoryOptions = this.categoriesData.map(cat => `
      <option value="${cat.categoryid}" ${room && room.categoryid == cat.categoryid ? 'selected' : ''}>${cat.name}</option>
    `).join('');

    const floorOptions = this.floorsData.map(f => `
      <option value="${f.floorid}" ${room && room.floorid == f.floorid ? 'selected' : ''}>${f.name}</option>
    `).join('');

    let body, title;

    if (mode === 'view') {
      title = 'View Room Details';
      body = `
        <p><strong>Room Number:</strong> ${room.room_no}</p>
        <p><strong>Category:</strong> ${room.category_name ?? ''}</p>
        <p><strong>Floor:</strong> ${room.floor_name ?? ''}</p>
        <p><strong>Status:</strong> ${room.status}</p>`;
    } else if (mode === 'delete') {
      title = 'Confirm Delete Room';
      body = `<p>Are you sure you want to delete room <strong>${room.room_no}</strong>?</p>`;
    } else {
      title = mode === 'add' ? 'Add New Room' : 'Edit Room';

      const statusSelectHtml = mode === 'add'
        ? `<input type="hidden" id="status" value="Available">`
        : `<select id="status" class="form-select" required>
             <option value="Available" ${room && room.status === 'Available' ? 'selected' : ''}>Available</option>
             <option value="Occupied" ${room && room.status === 'Occupied' ? 'selected' : ''}>Occupied</option>
           </select>
           <div class="invalid-feedback">Status is required.</div>`;

      body = `
        <form id="roomForm" class="needs-validation" novalidate>
          <div id="formAlertContainer"></div>
          <input type="hidden" id="roomNo" value="${room ? room.room_no : ''}">
          <div class="mb-3">
            <label for="roomNumber" class="form-label">Room Number</label>
            <input type="text" class="form-control" id="roomNumber" value="${room ? room.room_no : ''}" required>
            <div class="invalid-feedback">Room number is required.</div>
          </div>
          <div class="mb-3">
            <label for="categorySelect" class="form-label">Category</label>
            <select id="categorySelect" class="form-select" required>
              <option value="" disabled ${room ? '' : 'selected'}>Select a category</option>
              ${categoryOptions}
            </select>
            <div class="invalid-feedback">Category is required.</div>
          </div>
          <div class="mb-3">
            <label for="floor" class="form-label">Floor</label>
            <select id="floor" class="form-select" required>
              <option value="" disabled ${room ? '' : 'selected'}>Select floor</option>
              ${floorOptions}
            </select>
            <div class="invalid-feedback">Floor is required.</div>
          </div>
          <div class="mb-3">
            <label for="status" class="form-label">Status</label>
            ${statusSelectHtml}
          </div>
        </form>`;
    }

    const modalHtml = `
      <div class="modal fade" id="roomModal" tabindex="-1" aria-labelledby="roomModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered ${mode === 'view' ? 'modal-md' : 'modal-lg'}">
          <div class="modal-content">
            <div class="modal-header ${mode === 'delete' ? 'bg-danger text-white' : 'bg-primary text-white'}">
              <h5 class="modal-title" id="roomModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${(mode === 'add' || mode === 'edit') ? `<button type="button" class="btn btn-primary" id="saveRoomBtn">${mode === 'add' ? 'Add Room' : 'Update Room'}</button>` : ''}
              ${mode === 'delete' ? `<button type="button" class="btn btn-danger" id="confirmDeleteRoomBtn">Delete</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById('roomModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());

    if (mode === 'add' || mode === 'edit') {
      const form = document.getElementById('roomForm');
      form.classList.remove('was-validated');

      document.getElementById('saveRoomBtn').addEventListener('click', () => {
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }
        this.saveRoom(mode, modal);
      });
    } else if (mode === 'delete') {
      document.getElementById('confirmDeleteRoomBtn').addEventListener('click', () => this.deleteRoom(room.room_no, modal));
    }
  }

  async saveRoom(mode, modal) {
    const form = document.getElementById('roomForm');
    const alertContainer = document.getElementById('formAlertContainer');
    alertContainer.innerHTML = '';

    const data = {
      room_no: form.querySelector('#roomNumber').value.trim(),
      categoryid: form.querySelector('#categorySelect').value,
      floorid: form.querySelector('#floor').value,
      status: form.querySelector('#status').value || 'Available',
    };

    if (mode === 'edit') {
      data.room_no = form.querySelector('#roomNo').value || data.room_no;
    }

    const formData = new FormData();
    formData.append('operation', mode === 'edit' ? 'updateRoom' : 'insertRoom');
    formData.append('json', JSON.stringify(data));

    try {
      const res = await axios.post(this.baseApiUrl, formData);

      if (res.data.error) throw new Error(res.data.error);
      if (res.data.success === false) {
        alertContainer.innerHTML = `<div class="alert alert-danger">${res.data.error}</div>`;
        return;
      }

      this.showAlert(`Room ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      modal.hide();
      this.loadRooms();
    } catch (err) {
      console.error('Error saving room:', err);
      alertContainer.innerHTML = `<div class="alert alert-danger">Failed to ${mode === 'edit' ? 'update' : 'add'} room: ${err.message}</div>`;
    }
  }

 async deleteRoom(room_no, modal) {
  const formData = new FormData();
  formData.append('operation', 'deleteRoom');
  formData.append('room_no', room_no); // ✅ FIXED (was roomid)

  try {
    const res = await axios.post(this.baseApiUrl, formData);

    if (res.data.error) throw new Error(res.data.error);
    if (res.data.success === false) throw new Error(res.data.error);

    this.showAlert('Room deleted successfully!', 'success');
    modal.hide();
    this.loadRooms();
  } catch (err) {
    console.error('Error deleting room:', err);
    this.showAlert('Failed to delete room. Please try again.', 'danger');
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

document.addEventListener('DOMContentLoaded', () => new RoomManager());
