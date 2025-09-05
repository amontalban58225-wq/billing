// Doctors Module JavaScript - with Doctor PF
class DoctorsManager {
  constructor() {
    this.baseApiUrl = "http://localhost/hospital_billing2/api";
    this.doctorsData = [];
    this.init();
  }

  init() {
    this.loadDoctors();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const addBtn = document.getElementById("addDoctorBtn");
    if (addBtn) {
      addBtn.onclick = () => this.openModal("add");
    }

    const tbody = document.querySelector("#doctorsTable tbody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const id = btn.getAttribute("data-id");
        const action = btn.classList.contains("view-doctor")
          ? "view"
          : btn.classList.contains("edit-doctor")
          ? "edit"
          : btn.classList.contains("delete-doctor")
          ? "delete"
          : null;

        if (!action) return;
        const doctor = this.doctorsData.find((d) => d.doctorid == id);
        if (doctor) this.openModal(action, doctor);
      });
    }
  }

  async loadDoctors() {
    const tbody = document.querySelector("#doctorsTable tbody");
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="smooth-loader">
            <span></span><span></span><span></span>
          </div>
          <p class="mt-3 text-muted fw-semibold">Loading doctors...</p>
        </td>
      </tr>`;

    try {
      const res = await axios.get(`${this.baseApiUrl}/doctors.php`, {
        params: { operation: "getAllDoctors" },
      });

      if (res.data.error) throw new Error(res.data.error);
      this.doctorsData = Array.isArray(res.data) ? res.data : [];
      this.renderDoctorsTable();
    } catch (err) {
      console.error("Error loading doctors:", err);
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle me-2"></i>Failed to load doctors
          </td>
        </tr>`;
    }
  }

  renderDoctorsTable() {
    const tbody = document.querySelector("#doctorsTable tbody");
    if (!tbody) return;

    if (!this.doctorsData.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="bi bi-inbox me-2"></i>No doctors found
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = this.doctorsData
      .map(
        (doc) => `
        <tr class="fade-row">
          <td><strong>${doc.fullname}</strong></td>
          <td>${doc.specialty_name || "Not Assigned"}</td>
          <td>${doc.contact_no}</td>
          <td>₱ ${parseFloat(doc.professional_fee || 0).toFixed(2)}</td>
          <td>
           <span class="badge bg-${
             doc.status === "Active"
               ? "success"
               : doc.status === "Inactive"
               ? "secondary"
               : doc.status === "On Leave"
               ? "info"
               : doc.status === "Suspended"
               ? "danger"
               : "warning"
           }">${doc.status}</span>
          </td>
          <td>
            <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
              <button class="btn btn-sm btn-info me-1 view-doctor" style="flex-shrink: 0;" data-id="${doc.doctorid}" title="View Doctor Details">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-warning me-1 edit-doctor" style="flex-shrink: 0;" data-id="${doc.doctorid}" title="Edit Doctor">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger delete-doctor" style="flex-shrink: 0;" data-id="${doc.doctorid}" title="Delete Doctor">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>`
      )
      .join("");
  }

  async loadSpecialties() {
    try {
      const res = await axios.get(`${this.baseApiUrl}/specialty.php`, {
        params: { operation: "getAllSpecialties" },
      });

      if (res.data.error) throw new Error(res.data.error);
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error("Error loading specialties:", err);
      return [];
    }
  }

  async openModal(mode = "add", doctor = null) {
    const existingModal = document.getElementById("doctorModal");
    if (existingModal) existingModal.remove();

    const specialties = await this.loadSpecialties();

    const specialtyOptions = specialties
      .map(
        (spec) =>
          `<option value="${spec.specialtyid}" ${
            doctor && doctor.specialtyid == spec.specialtyid ? "selected" : ""
          }>${spec.name}</option>`
      )
      .join("");

    let modalHtml = "";

    if (mode === "delete") {
      modalHtml = `
        <div class="modal fade" id="doctorModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-danger text-white">
                <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Confirm Delete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <p>Are you sure you want to delete <strong>${doctor.fullname}</strong>?</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteDoctorBtn" data-id="${doctor.doctorid}">
                  <i class="bi bi-trash me-2"></i>Delete
                </button>
              </div>
            </div>
          </div>
        </div>`;
    } else {
      modalHtml = `
        <div class="modal fade" id="doctorModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">
                  <i class="bi bi-person-badge me-2"></i>
                  ${mode === "add" ? "Add Doctor" : mode === "edit" ? "Edit Doctor" : "Doctor Details"}
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body p-4">
                <form id="doctorForm" novalidate style="display: ${mode === "view" ? "none" : "block"};">
                  <input type="hidden" id="doctorId" value="${doctor ? doctor.doctorid : ""}">
                  ${mode === "add" ? `<input type="hidden" id="statusHidden" value="Active">` : ""}

                  <div class="mb-3">
                    <label class="form-label" for="fullName">Full Name</label>
                    <input type="text" id="fullName" class="form-control" value="${doctor ? doctor.fullname : ""}" required>
                    <div class="invalid-feedback">Full name is required.</div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label" for="specialtySelect">Specialty</label>
                    <select id="specialtySelect" class="form-select" required>
                      <option value="" disabled ${!doctor ? "selected" : ""}>Select Specialty</option>
                      ${specialtyOptions}
                    </select>
                    <div class="invalid-feedback">Specialty is required.</div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label" for="contactNo">Contact No</label>
                    <input type="text" id="contactNo" class="form-control" value="${doctor ? doctor.contact_no : ""}" required>
                    <div class="invalid-feedback">Contact number is required.</div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label" for="professionalFee">Professional Fee (₱)</label>
                    <input type="number" step="0.01" id="professionalFee" class="form-control" value="${doctor ? doctor.professional_fee || "" : ""}" required>
                    <div class="invalid-feedback">Professional fee is required.</div>
                  </div>

                  ${mode !== "add" ? `
                    <div class="mb-3">
                      <label class="form-label" for="status">Status</label>
                      <select id="status" class="form-select" required>
                        <option value="Active" ${doctor?.status === "Active" ? "selected" : ""}>Active</option>
                        <option value="Inactive" ${doctor?.status === "Inactive" ? "selected" : ""}>Inactive</option>
                      </select>
                    </div>` : ""}
                </form>
                <div id="doctorDetails" style="display: ${mode === "view" ? "block" : "none"};">
                  <p><strong>Full Name:</strong> ${doctor ? doctor.fullname : ""}</p>
                  <p><strong>Specialty:</strong> ${doctor ? doctor.specialty_name || "Not Assigned" : ""}</p>
                  <p><strong>Contact No:</strong> ${doctor ? doctor.contact_no : ""}</p>
                  <p><strong>Professional Fee:</strong> ₱ ${doctor ? parseFloat(doctor.professional_fee || 0).toFixed(2) : ""}</p>
                  <p><strong>Status:</strong> ${doctor ? doctor.status : ""}</p>
                </div>
              </div>
              <div class="modal-footer bg-light border-top">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                ${
                  mode !== "view"
                    ? `<button type="button" class="btn btn-primary" id="saveDoctorBtn">
                         <i class="bi bi-check-circle me-2"></i>${mode === "edit" ? "Update" : "Save"}
                       </button>`
                    : ""
                }
              </div>
            </div>
          </div>
        </div>`;
    }

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = new bootstrap.Modal(document.getElementById("doctorModal"));
    modal.show();

    if (mode === "delete") {
      document.getElementById("confirmDeleteDoctorBtn")
        .addEventListener("click", () => this.deleteDoctor(doctor.doctorid, modal));
    } else if (mode !== "view") {
      document.getElementById("saveDoctorBtn")
        .addEventListener("click", () => this.saveDoctor(mode, modal));
    }
  }

  async saveDoctor(mode, modal) {
    const form = document.getElementById("doctorForm");
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const saveBtn = document.getElementById("saveDoctorBtn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Saving...`;

    const data = {
      fullname: document.getElementById("fullName").value.trim(),
      specialtyid: document.getElementById("specialtySelect").value,
      contact_no: document.getElementById("contactNo").value.trim(),
      professional_fee: document.getElementById("professionalFee").value.trim(),
      status:
        mode === "add"
          ? document.getElementById("statusHidden").value
          : document.getElementById("status").value,
    };

    if (mode === "edit") data.doctorid = document.getElementById("doctorId").value;

    try {
      const res = await axios.post(
        `${this.baseApiUrl}/doctors.php?operation=${
          mode === "add" ? "insertDoctor" : "updateDoctor"
        }`,
        data
      );

      if (res.data.success) {
        this.showAlert(`Doctor ${mode === "add" ? "added" : "updated"} successfully`, "success");
        modal.hide();
        this.loadDoctors();
      } else {
        throw new Error(res.data.error || "Operation failed");
      }
    } catch (err) {
      console.error("Error saving doctor:", err);
      this.showAlert(`Failed to ${mode === "add" ? "add" : "update"} doctor`, "danger");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="bi bi-check-circle me-2"></i>${mode === "edit" ? "Update" : "Save"}`;
    }
  }

  async deleteDoctor(doctorId, modal) {
    const deleteBtn = document.getElementById("confirmDeleteDoctorBtn");
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Deleting...`;

    try {
      const res = await axios.post(
        `${this.baseApiUrl}/doctors.php?operation=deleteDoctor`,
        { doctorid: doctorId }
      );

      if (res.data.success) {
        this.showAlert("Doctor deleted successfully", "success");
        modal.hide();
        this.loadDoctors();
      } else {
        throw new Error(res.data.error || "Delete failed");
      }
    } catch (err) {
      console.error("Error deleting doctor:", err);
      this.showAlert("Failed to delete doctor", "danger");
    } finally {
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = `<i class="bi bi-trash me-2"></i>Delete`;
    }
  }

  showAlert(message, type) {
    const oldAlert = document.getElementById("doctorAlert");
    if (oldAlert) oldAlert.remove();

    const alertHtml = `
      <div id="doctorAlert" class="alert alert-${type} alert-dismissible fade show position-fixed"
           style="top: 20px; right: 20px; z-index: 9999; min-width: 350px;">
        <i class="bi bi-${
          type === "success"
            ? "check-circle"
            : type === "danger"
            ? "exclamation-triangle"
            : "info-circle"
        } me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;

    document.body.insertAdjacentHTML("beforeend", alertHtml);

    setTimeout(() => {
      const alert = document.getElementById("doctorAlert");
      if (alert) bootstrap.Alert.getOrCreateInstance(alert).close();
    }, 4000);
  }
}

document.addEventListener("DOMContentLoaded", () => new DoctorsManager());
