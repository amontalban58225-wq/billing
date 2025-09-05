class InsuranceProviderManager {
  constructor() {
    this.baseApiUrl = "http://localhost/hospital_billing2/api/insurance_provider.php";
    this.providersData = [];
    this.showInactive = false;
    this.init();
  }

  init() {
    this.loadProviders();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const addBtn = document.getElementById("addInsuranceBtn");
    if (addBtn) addBtn.onclick = () => this.openModal("add");

    const toggleInactiveBtn = document.getElementById("toggleInactiveBtn");
    if (toggleInactiveBtn) {
      toggleInactiveBtn.onclick = () => {
        this.showInactive = !this.showInactive;
        toggleInactiveBtn.textContent = this.showInactive ? "Hide Inactive" : "Show Inactive";
        this.loadProviders();
      };
    }

    const tbody = document.querySelector("#insuranceTableBody");
    if (tbody) {
      tbody.addEventListener("click", e => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        if (!id || !action) return;
        const provider = this.providersData.find(p => String(p.insuranceid) === String(id));
        if (!provider) return;
        this.openModal(action, provider);
      });
    }
  }

  async loadProviders() {
    const tbody = document.querySelector("#insuranceTableBody");
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5">
          <div class="smooth-loader">
            <span></span><span></span><span></span>
          </div>
          <p class="mt-3 text-muted fw-semibold">Loading insurance providers...</p>
        </td>
      </tr>`;

    try {
      const url = `${this.baseApiUrl}?operation=getAll${this.showInactive ? "&showInactive=1" : ""}`;
      const res = await axios.get(url);
      if (res.data.error) throw new Error(res.data.error);
      this.providersData = Array.isArray(res.data) ? res.data : [];
      this.renderProvidersTable();
    } catch (e) {
      console.error("Error loading providers:", e);
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle me-2"></i>Failed to load insurance providers
          </td>
        </tr>`;
    }
  }

  renderProvidersTable() {
    const tbody = document.querySelector("#insuranceTableBody");
    if (!tbody) return;

    if (this.providersData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-muted">
            <i class="bi bi-inbox me-2"></i>No insurance providers found
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = this.providersData.map(p => `
      <tr class="${p.is_active == 1 ? "" : "table-danger"} fade-row">
        <td><strong>${p.name}</strong></td>
        <td>${p.coverage_percent}%</td>
        <td>
        <div style="display: flex; flex-direction: row; gap: 8px; flex-wrap: nowrap;">
          <button class="btn btn-sm btn-info me-1" style="flex-shrink: 0;data-id="${p.insuranceid}" data-action="view" title="View Details">
            <i class="bi bi-eye"></i>
          </button>
          ${p.is_active == 1 ? `
            <button class="btn btn-sm btn-warning me-1" style="flex-shrink: 0;" data-id="${p.insuranceid}" data-action="edit" title="Edit Provider">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger me-1" style="flex-shrink: 0;" data-id="${p.insuranceid}" data-action="delete" title="Deactivate Provider">
              <i class="bi bi-trash"></i>
            </button>` : `
            <button class="btn btn-sm btn-success" data-id="${p.insuranceid}" data-action="restore" title="Restore Provider">
              <i class="bi bi-arrow-counterclockwise"></i> Restore
            </button>`}
            </div>
        </td>
      </tr>
    `).join("");
  }

  openModal(mode, provider = null) {
    // Remove existing modal if any
    const existingModal = document.getElementById("insuranceModal");
    if (existingModal) existingModal.remove();

    let modalHtml = "";

    if (mode === "delete") {
      modalHtml = this.getDeleteModalHtml(provider);
    } else if (mode === "restore") {
      modalHtml = this.getRestoreModalHtml(provider);
    } else {
      modalHtml = this.getFormModalHtml(mode, provider);
    }

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modalEl = document.getElementById("insuranceModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());

    if (mode === "delete") {
      modalEl.querySelector("#confirmDeleteBtn").addEventListener("click", async () => {
        await this.deleteProvider(provider.insuranceid);
        modal.hide();
      });
    } else if (mode === "restore") {
      modalEl.querySelector("#confirmRestoreBtn").addEventListener("click", async () => {
        await this.restoreProvider(provider.insuranceid);
        modal.hide();
      });
    } else {
      const form = modalEl.querySelector("#insuranceForm");
      const saveBtn = modalEl.querySelector("#saveProviderBtn");

      if (mode !== "view") {
        saveBtn.addEventListener("click", async () => {
          if (this.validateForm(form)) {
            await this.saveProvider(mode, modal);
          }
        });

        form.addEventListener("submit", async e => {
          e.preventDefault();
          if (this.validateForm(form)) {
            await this.saveProvider(mode, modal);
          }
        });
      }
    }
  }

  getFormModalHtml(mode, provider) {
    const isEdit = mode === "edit";
    const isView = mode === "view";

    return `
    <div class="modal fade" id="insuranceModal" tabindex="-1" aria-labelledby="insuranceModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-light border-bottom">
            <h5 class="modal-title text-primary fw-bold" id="insuranceModalLabel">
              <i class="bi bi-shield-${mode === "add" ? "plus" : mode === "edit" ? "pencil" : "eye"} me-2"></i>
              ${mode === "add" ? "Add Insurance Provider" : mode === "edit" ? "Edit Insurance Provider" : "Insurance Provider Details"}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <form id="insuranceForm" novalidate style="display: ${isView ? "none" : "block"}">
              <input type="hidden" id="insuranceId" value="${provider ? provider.insuranceid : ""}">
              <div class="mb-3">
                <label for="name" class="form-label">Provider Name</label>
                <input type="text" id="name" class="form-control" value="${provider ? provider.name : ""}" ${isView ? "readonly" : "required"}>
                <div class="invalid-feedback">Provider name is required.</div>
              </div>
              <div class="mb-3">
                <label for="coverage_percent" class="form-label">Coverage Percent</label>
                <input type="number" id="coverage_percent" class="form-control" min="0" max="100" step="1" value="${provider ? provider.coverage_percent : 0}" ${isView ? "readonly" : "required"}>
                <div class="invalid-feedback">Coverage percent must be between 0 and 100.</div>
              </div>
              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea id="description" class="form-control" rows="3" ${isView ? "readonly" : ""}>${provider ? (provider.description || "") : ""}</textarea>
              </div>
            </form>
            <div id="insuranceDetails" style="display: ${isView ? "block" : "none"}">

              <p><strong>Name:</strong> ${provider ? provider.name : ""}</p>
              <p><strong>Coverage Percent:</strong> ${provider ? provider.coverage_percent : ""}%</p>
              <p><strong>Description:</strong><br/>${provider ? (provider.description || "<em>(No description)</em>") : ""}</p>
            </div>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            ${!isView ? `
              <button type="button" class="btn btn-primary" id="saveProviderBtn">
                <i class="bi bi-check-circle me-2"></i>${isEdit ? "Update" : "Save"}
              </button>
            ` : ""}
          </div>
        </div>
      </div>
    </div>`;
  }

  getDeleteModalHtml(provider) {
    return `
    <div class="modal fade" id="insuranceModal" tabindex="-1" aria-labelledby="insuranceModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-light border-bottom text-danger">
            <h5 class="modal-title" id="insuranceModalLabel">
              <i class="bi bi-exclamation-triangle me-2"></i>Deactivate Insurance Provider
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center pt-4">
            <p>Are you sure you want to deactivate <strong>${provider.name}</strong>?</p>
            <div class="alert alert-warning mt-3 d-flex align-items-center justify-content-center">
              <i class="bi bi-info-circle me-2"></i>
              <strong>Warning:</strong> This will hide the provider but not delete permanently.
            </div>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" id="confirmDeleteBtn" data-id="${provider.insuranceid}">
              <i class="bi bi-trash me-2"></i>Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }

  getRestoreModalHtml(provider) {
    return `
    <div class="modal fade" id="insuranceModal" tabindex="-1" aria-labelledby="insuranceModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-light border-bottom text-success">
            <h5 class="modal-title" id="insuranceModalLabel">
              <i class="bi bi-arrow-counterclockwise me-2"></i>Restore Insurance Provider
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center pt-4">
            <p>Do you want to restore <strong>${provider.name}</strong>?</p>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-success" id="confirmRestoreBtn" data-id="${provider.insuranceid}">
              <i class="bi bi-arrow-counterclockwise me-2"></i>Restore
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }

  validateForm(form) {
    let valid = true;

    const nameInput = form.querySelector("#name");
    if (!nameInput.value.trim()) {
      nameInput.classList.add("is-invalid");
      valid = false;
    } else {
      nameInput.classList.remove("is-invalid");
    }

    const coverageInput = form.querySelector("#coverage_percent");
    const val = Number(coverageInput.value);
    if (isNaN(val) || val < 0 || val > 100) {
      coverageInput.classList.add("is-invalid");
      valid = false;
    } else {
      coverageInput.classList.remove("is-invalid");
    }

    return valid;
  }

  async saveProvider(mode, modal) {
    const modalEl = document.getElementById("insuranceModal");
    const form = modalEl.querySelector("#insuranceForm");

    const data = {
      insuranceid: form.querySelector("#insuranceId").value,
      name: form.querySelector("#name").value.trim(),
      coverage_percent: Number(form.querySelector("#coverage_percent").value),
      description: form.querySelector("#description").value.trim(),
    };

    try {
      const formData = new FormData();
      formData.append("operation", mode === "edit" ? "update" : "insert");
      formData.append("json", JSON.stringify(data));

      const res = await axios.post(this.baseApiUrl, formData);
      if (res.data.error) throw new Error(res.data.error);

      this.showAlert(`Provider ${mode === "edit" ? "updated" : "added"} successfully!`, "success");
      modal.hide();
      this.loadProviders();
    } catch (e) {
      console.error("Error saving provider:", e);
      const msg = e.response?.data?.error || "Error saving provider.";
      this.showAlert(msg, "danger");
    }
  }

  async deleteProvider(id) {
    try {
      const formData = new FormData();
      formData.append("operation", "delete");
      formData.append("insuranceid", id);

      const res = await axios.post(this.baseApiUrl, formData);
      if (res.data.error) throw new Error(res.data.error);

      this.showAlert("Provider deactivated successfully!", "success");
      this.loadProviders();
    } catch (e) {
      console.error("Error deactivating provider:", e);
      const msg = e.response?.data?.error || "Error deactivating provider.";
      this.showAlert(msg, "danger");
    }
  }

  async restoreProvider(id) {
    try {
      const formData = new FormData();
      formData.append("operation", "restore");
      formData.append("insuranceid", id);

      const res = await axios.post(this.baseApiUrl, formData);
      if (res.data.error) throw new Error(res.data.error);

      this.showAlert("Provider restored successfully!", "success");
      this.loadProviders();
    } catch (e) {
      console.error("Error restoring provider:", e);
      const msg = e.response?.data?.error || "Error restoring provider.";
      this.showAlert(msg, "danger");
    }
  }

  showAlert(message, type = "info") {
    document.querySelectorAll(".alert.position-fixed").forEach(a => a.remove());
    const icon = type === "success"
      ? "check-circle"
      : type === "danger"
      ? "exclamation-triangle"
      : "info-circle";

    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed"
           style="top: 20px; right: 20px; z-index: 1055; min-width: 350px;">
        <i class="bi bi-${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", alertHtml);

    const alertEl = document.querySelector(".alert.position-fixed");
    if (alertEl && window.bootstrap?.Alert) {
      const bsAlert = new bootstrap.Alert(alertEl);
      setTimeout(() => bsAlert.close(), 4000);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => new InsuranceProviderManager());
