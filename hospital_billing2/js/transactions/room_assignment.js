class RoomAssignmentManager {
  constructor() {
    this.apiUrl = "http://localhost/hospital_billing2/api/transactions/room_assignment.php";
    this.assignments = [];
    this.admissions = [];
    this.rooms = [];
    this.init();
  }

  async init() {
    try {
      await Promise.all([
        this.loadAssignments(),
        this.loadAdmissions(),
        this.loadRooms(),
      ]);
      this.setupEventListeners();
      this.populateFilters();
    } catch (e) {
      console.error("Initialization failed:", e);
    }
  }

  setupEventListeners() {
    const addBtn = document.getElementById("addAssignmentBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        this.openModal('add');
      });
    }

    const searchBtn = document.getElementById("searchAssignmentBtn");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        this.filterAssignments();
      });
    }

    const form = document.getElementById("assignmentForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.saveAssignment();
      });
    }

    const tbody = document.getElementById("assignmentTableBody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        if (!id || !action) return;

        if (action === "edit") {
          this.editAssignment(Number(id));
        } else if (action === "delete") {
          this.deleteAssignment(Number(id));
        } else if (action === "view") {
          this.viewAssignment(Number(id));
        }
      });
    }
  }

  async loadAssignments() {
    try {
      const res = await axios.get(this.apiUrl);
      this.assignments = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      this.renderTable();
    } catch (err) {
      console.error("Failed to load assignments:", err);
      this.assignments = [];
      this.renderTable();
    }
  }

  async loadAdmissions() {
    try {
      const res = await axios.get("http://localhost/hospital_billing2/api/transactions/admission.php", {
        params: { operation: "getAllAdmissions" },
      });
      this.admissions = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      const admissionSelect = document.getElementById("admissionSelect");
      if (admissionSelect) {
        admissionSelect.innerHTML =
          `<option value="">-- Select Admission --</option>` +
          this.admissions
            .map(
              (a) =>
                `<option value="${this.escape(a.admissionid)}">#${this.escape(a.admissionid)} - ${this.escape(a.patient_name)}</option>`
            )
            .join("");
      }
    } catch (err) {
      console.error("Failed to load admissions:", err);
    }
  }

  // This is the first loadRooms method that should be kept
  async loadRooms() {
    try {
      const res = await axios.get("http://localhost/hospital_billing2/api/rooms.php", {
        params: { operation: "getAllRooms" },
      });
      this.rooms = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      const roomSelect = document.getElementById("roomSelect");
      if (roomSelect) {
        // Disable occupied rooms in select
        roomSelect.innerHTML =
          `<option value="">-- Select Room --</option>` +
          this.rooms
            .map((r) => {
              const disabled = String(r.status).toLowerCase() === "occupied" ? "disabled" : "";
              const note = String(r.status).toLowerCase() === "occupied" ? " — Occupied" : "";
              const categoryDisplay = r.category_name ? ` - ${this.escape(r.category_name)}` : '';
              const floorDisplay = r.floor_name ? ` (${this.escape(r.floor_name)})` : '';
              return `<option value="${this.escape(r.room_no)}" ${disabled}>${this.escape(r.room_no)}${categoryDisplay}${floorDisplay}${this.escape(note)}</option>`;
            })
            .join("");
      }
    } catch (err) {
      console.error("Failed to load rooms:", err);
    }
  }

  populateFilters() {
    // Populate patient filter from admissions
    const patientFilter = document.getElementById('patientFilter');
    if (patientFilter) {
      patientFilter.innerHTML = '<option value="">All Patients</option>';
      const uniquePatients = new Map();

      this.assignments.forEach(assignment => {
        const admission = this.admissions.find(a => String(a.admissionid) === String(assignment.admissionid));
        if (admission && admission.patientid && admission.patient_name && !uniquePatients.has(admission.patientid)) {
          uniquePatients.set(admission.patientid, admission.patient_name);
        }
      });

      uniquePatients.forEach((name, id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        patientFilter.appendChild(option);
      });
    }

    // Populate room filter
    const roomFilter = document.getElementById('roomFilter');
    if (roomFilter) {
      roomFilter.innerHTML = '<option value="">All Rooms</option>';

      this.rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.roomid;
        option.textContent = room.category_name ? `${room.room_no} - ${room.category_name}` : room.room_no;
        roomFilter.appendChild(option);
      });
    }

    // Set default date range (last 30 days)
    this.setDefaultDateRange();
  }

  setDefaultDateRange() {
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');

    if (dateFromFilter && dateToFilter) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      dateFromFilter.valueAsDate = thirtyDaysAgo;
      dateToFilter.valueAsDate = today;
    }
  }

  filterAssignments() {
    const patientId = document.getElementById('patientFilter')?.value;
    const roomId = document.getElementById('roomFilter')?.value;
    const status = document.getElementById('statusFilter')?.value;
    const dateFromFilter = document.getElementById('dateFromFilter')?.value;
    const dateToFilter = document.getElementById('dateToFilter')?.value;

    let filtered = this.assignments;

    // Filter by patient
    if (patientId) {
      filtered = filtered.filter(assignment => {
        const admission = this.admissions.find(a => String(a.admissionid) === String(assignment.admissionid));
        return admission && String(admission.patientid) === String(patientId);
      });
    }

    // Filter by room
    if (roomId) {
      filtered = filtered.filter(assignment => String(assignment.roomid) === String(roomId));
    }

    // Filter by status
    if (status) {
      if (status === 'Active') {
        filtered = filtered.filter(assignment => !assignment.end_date);
      } else if (status === 'Completed') {
        filtered = filtered.filter(assignment => assignment.end_date);
      }
    }

    // Filter by date range
    if (dateFromFilter || dateToFilter) {
      filtered = filtered.filter(assignment => {
        const assignedDate = new Date(assignment.assigned_date);

        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          if (assignedDate < fromDate) {
            return false;
          }
        }

        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999); // End of the day
          if (assignedDate > toDate) {
            return false;
          }
        }

        return true;
      });
    }

    this.renderFilteredTable(filtered);
  }

  renderFilteredTable(data) {
    const tbody = document.getElementById("assignmentTableBody");
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No matching room assignments found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data
      .map((assignment) => {
        const room = this.rooms.find(r => String(r.roomid) === String(assignment.roomid)) || {};
        const admission = this.admissions.find(a => String(a.admissionid) === String(assignment.admissionid)) || {};
        const isActive = !assignment.end_date;

        return `
          <tr class="${isActive ? 'table-active' : ''}">
            <td>
              <div class="d-flex flex-column">
                <span class="fw-bold">${this.escape(admission.patient_name || 'Unknown')}</span>
                <small class="text-muted">Admission #${this.escape(assignment.admissionid || '')}</small>
              </div>
            </td>
            <td>
              <div class="d-flex flex-column">
                <span class="fw-bold">${this.escape(room.room_no || 'Unknown')}</span>
                <small class="text-muted">${this.escape(room.category_name || '')}</small>
              </div>
            </td>
            <td>${this.formatDate(assignment.assigned_date)}</td>
            <td>${assignment.end_date ? this.formatDate(assignment.end_date) : '<span class="badge bg-success">Active</span>'}</td>
            <td>
              ${isActive ?
                '<span class="badge bg-success">Active</span>' :
                '<span class="badge bg-secondary">Completed</span>'}
            </td>
            <td>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-info" data-id="${assignment.assignmentid}" data-action="view" title="View Details">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" data-id="${assignment.assignmentid}" data-action="edit" title="Edit Assignment">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" data-id="${assignment.assignmentid}" data-action="delete" title="Delete Assignment">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  renderTable() {
    const tbody = document.getElementById("assignmentTableBody");
    if (!tbody) return;

    if (!this.assignments.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No assignments found.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.assignments
      .map(
        (a) => {
          // Determine status based on end_date
          const status = a.end_date ? 'Completed' : 'Active';
          const statusClass = a.end_date ? 'bg-secondary' : 'bg-success';

          return `
      <tr class="fade-row">
        <td><strong>${this.escape(a.patient_name || "Unknown")}</strong></td>
        <td><strong>${this.escape(a.room_no)}</strong> ${a.category_name ? `(${this.escape(a.category_name)})` : ''}</td>
        <td>${this.formatDate(a.start_date)}</td>
        <td>${a.end_date ? this.formatDate(a.end_date) : '<span class="text-muted">—</span>'}</td>
        <td><span class="badge ${statusClass}">${status}</span></td>
        <td>
          <div class="d-flex gap-2 flex-nowrap">
            <button class="btn btn-sm btn-info" title="View Assignment" data-id="${this.escape(a.assignmentid)}" data-action="view">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning" title="Edit Assignment" data-id="${this.escape(a.assignmentid)}" data-action="edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" title="Delete Assignment" data-id="${this.escape(a.assignmentid)}" data-action="delete" data-room="${this.escape(a.room_no)}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
        }
      )
      .join("");
  }

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  openModal(mode, item = null) {
    const form = document.getElementById("assignmentForm");
    form.reset();
    form.classList.remove("was-validated");

    // Set modal header color based on mode
    const modalHeader = document.querySelector('#assignmentModal .modal-header');
    if (modalHeader) {
      // Remove existing background classes
      modalHeader.classList.remove('bg-primary', 'bg-success', 'bg-warning');

      // Add appropriate class based on mode
      if (mode === 'add') {
        modalHeader.classList.add('bg-success');
        document.querySelector('#assignmentModal .modal-title').innerHTML = '<i class="bi bi-plus-circle"></i> Add Room Assignment';
        document.getElementById('saveBtn').textContent = 'Add Assignment';
      } else if (mode === 'edit') {
        modalHeader.classList.add('bg-warning');
        document.querySelector('#assignmentModal .modal-title').innerHTML = '<i class="bi bi-pencil-square"></i> Edit Room Assignment';
        document.getElementById('saveBtn').textContent = 'Update Assignment';
      }
    }

    // If editing, populate form with item data
    if (mode === 'edit' && item) {
      document.getElementById("assignmentId").value = item.assignmentid;
      document.getElementById("admissionSelect").value = item.admissionid;
      document.getElementById("roomSelect").value = item.room_no;

      const startDate = item.start_date ? String(item.start_date).split(" ")[0] : "";
      document.getElementById("assignedDate").value = startDate;

      const endDate = item.end_date ? String(item.end_date).split(" ")[0] : "";
      document.getElementById("endDate").value = endDate;
    } else {
      document.getElementById("assignmentId").value = "";
    }

    new bootstrap.Modal(document.getElementById("assignmentModal")).show();
  }

  async saveAssignment() {
    const form = document.getElementById("assignmentForm");
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    // Validate that end date is after start date if both are provided
    const startDateInput = document.getElementById("assignedDate").value;
    const endDateInput = document.getElementById("endDate").value;

    if (startDateInput && endDateInput && new Date(endDateInput) < new Date(startDateInput)) {
      document.getElementById("endDate").setCustomValidity("End date must be after start date");
      form.classList.add("was-validated");
      return;
    } else {
      document.getElementById("endDate").setCustomValidity("");
    }

    const assignmentId = document.getElementById("assignmentId").value;
    const startDate = startDateInput ? `${startDateInput} 00:00:00` : null;
    const endDate = endDateInput ? `${endDateInput} 23:59:59` : null;

    const data = {
      assignmentid: assignmentId || null,
      admissionid: document.getElementById("admissionSelect").value,
      room_no: document.getElementById("roomSelect").value,
      start_date: startDate,
      end_date: endDate
    };

    if (!data.admissionid || !data.room_no) {
      alert("Please select both admission and room.");
      return;
    }

    try {
      if (assignmentId) {
        await axios.put(this.apiUrl, data, { headers: { "Content-Type": "application/json" } });
      } else {
        await axios.post(this.apiUrl, data, { headers: { "Content-Type": "application/json" } });
      }

      const modalEl = document.getElementById("assignmentModal");
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.hide();

      form.classList.remove("was-validated");
      form.reset();
      await Promise.all([this.loadAssignments(), this.loadRooms()]);

      // Show success message
      this.showAlert(`Room assignment ${assignmentId ? 'updated' : 'added'} successfully!`, 'success');
    } catch (err) {
      console.error("Save failed:", err?.response?.data || err.message);
      const serverMsg = err?.response?.data?.error || err?.response?.data || err.message;
      this.showAlert("Error saving assignment: " + JSON.stringify(serverMsg), 'danger');
    }
  }

  editAssignment(id) {
    const assignment = this.assignments.find((a) => a.assignmentid == id);
    if (!assignment) return;
    this.openModal('edit', assignment);
  }

  async deleteAssignment(id) {
    // Create a confirmation modal instead of using confirm()
    const assignment = this.assignments.find((a) => a.assignmentid == id);
    if (!assignment) return;

    // Remove any existing delete modal
    document.querySelectorAll('#deleteModal').forEach(m => m.remove());

    const modalHtml = `
      <div class="modal fade" id="deleteModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content animate__animated animate__fadeIn">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title"><i class="bi bi-trash"></i> Confirm Delete</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete the room assignment for:</p>
              <p><strong>Patient:</strong> ${this.escape(assignment.patient_name || 'Unknown')}</p>
              <p><strong>Room:</strong> ${this.escape(assignment.room_no)} (${this.escape(assignment.category_name || 'Unknown')})</p>
              <p><strong>Start Date:</strong> ${this.formatDate(assignment.start_date)}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete Assignment</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('deleteModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
      try {
        await axios.delete(this.apiUrl, {
          data: { assignmentid: id },
          headers: { "Content-Type": "application/json" },
        });

        modal.hide();
        await Promise.all([this.loadAssignments(), this.loadRooms()]);
        this.showAlert('Room assignment deleted successfully!', 'success');
      } catch (err) {
        console.error("Delete failed:", err?.response?.data || err.message);
        const serverMsg = err?.response?.data?.error || err?.response?.data || err.message;
        this.showAlert("Error deleting assignment: " + JSON.stringify(serverMsg), 'danger');
      }
    });

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
  }

  viewAssignment(id) {
    const assignment = this.assignments.find((a) => a.assignmentid == id);
    if (!assignment) return;

    // Determine status based on end_date
    const status = assignment.end_date ? 'Completed' : 'Active';
    const statusClass = assignment.end_date ? 'bg-secondary' : 'bg-success';

    const details = `
      <div class="p-3">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">Assignment #${this.escape(assignment.assignmentid)}</h5>
          <span class="badge ${statusClass}">${status}</span>
        </div>
        <hr>
        <div class="row">
          <div class="col-md-6">
            <p><strong>Patient:</strong> ${this.escape(assignment.patient_name)}</p>
            <p><strong>Admission ID:</strong> #${this.escape(assignment.admissionid)}</p>
            <p><strong>Room:</strong> ${this.escape(assignment.room_no)}</p>
            <p><strong>Room Type:</strong> ${this.escape(assignment.category_name || "Unknown")}</p>
          </div>
          <div class="col-md-6">
            <p><strong>Floor:</strong> ${this.escape(assignment.floor_name || "N/A")}</p>
            <p><strong>Start Date:</strong> ${this.formatDate(assignment.start_date)}</p>
            <p><strong>End Date:</strong> ${assignment.end_date ? this.formatDate(assignment.end_date) : 'Active'}</p>
            <p><strong>Room Status:</strong> ${this.escape(assignment.room_status || "N/A")}</p>
          </div>
        </div>
      </div>
    `;

    const modalEl = document.getElementById("viewModal");
    if (modalEl) {
      modalEl.querySelector(".modal-body").innerHTML = details;
      new bootstrap.Modal(modalEl).show();
    } else {
      alert(details.replace(/<[^>]+>/g, ""));
    }
  }

  escape(text) {
    if (text === null || typeof text === 'undefined') return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert.position-fixed').forEach(e => e.remove());
    const icons = { success: 'check-circle', danger: 'exclamation-triangle', warning: 'exclamation-circle', info: 'info-circle' };
    const icon = icons[type] || icons.info;

    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed animate__animated animate__fadeIn"
           style="top: 20px; right: 20px; z-index: 1055; min-width: 350px;">
        <i class="bi bi-${icon} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', alertHtml);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const alert = document.querySelector('.alert.position-fixed');
      if (alert) {
        alert.classList.add('animate__fadeOut');
        setTimeout(() => alert.remove(), 500);
      }
    }, 5000);
  }
}

document.addEventListener("DOMContentLoaded", () => new RoomAssignmentManager());
