// Dashboard Navigation and Module Loader
const modules = {
  dashboard: { name: "Dashboard", icon: "bi-house", html: "pages/dashboard.html", js: null },

  doctors: { name: "Doctors", icon: "bi-person-badge", html: "pages/masterfiles/doctors.html", js: "js/masterfiles/doctors.js", hasCRUD: true },

  specialty: { name: "Specialties", icon: "bi-heart-pulse", html: "pages/masterfiles/specialty.html", js: "js/masterfiles/specialty.js", hasCRUD: true },

  floor: { name: "Floors", icon: "bi-building", html: "pages/masterfiles/floor.html", js: "js/masterfiles/floor.js", hasCRUD: true },

  generic_medicine: { name: "Generic Medicines", icon: "bi-capsule", html: "pages/masterfiles/generic.html", js: "js/masterfiles/generic.js", hasCRUD: true },

  lab_test_category: { name: "Lab Test Category", icon: "bi-diagram-3", html: "pages/masterfiles/lab_test_category.html", js: "js/masterfiles/lab_test_category.js", hasCRUD: true },

  lab_test: { name: "Lab Test", icon: "bi-flask", html: "pages/masterfiles/lab_test.html", js: "js/masterfiles/lab_test.js", hasCRUD: true },

  medicine: { name: "Medicine", icon: "bi-capsule", html: "pages/masterfiles/medicine.html", js: "js/masterfiles/medicine.js", hasCRUD: true },

  insurance_provider: { name: "Insurance Provider", icon: "bi-shield-check", html: "pages/masterfiles/insurance_provider.html", js: "js/masterfiles/insurance_provider.js", hasCRUD: true },

  patient: { name: "Patient", icon: "bi-person", html: "pages/masterfiles/patient.html", js: "js/masterfiles/patients.js", hasCRUD: true },

  role: { name: "Role", icon: "bi-people", html: "pages/masterfiles/role.html", js: "js/masterfiles/roles.js", hasCRUD: true },

  room_category: { name: "Room Category", icon: "bi-door-open", html: "pages/masterfiles/room_category.html", js: "js/masterfiles/room_category.js", hasCRUD: true },

  room: { name: "Room", icon: "bi-house-door", html: "pages/masterfiles/room.html", js: "js/masterfiles/rooms.js", hasCRUD: true },

  user: { name: "User", icon: "bi-person-circle", html: "pages/masterfiles/user.html", js: "js/masterfiles/users.js", hasCRUD: true },

  billing_category: { name: "Billing Category", icon: "bi-file-earmark-text", html: "pages/masterfiles/billing_category.html", js: "js/masterfiles/billing_category.js", hasCRUD: true },

  //TRANSACTIONS

  admission: { name: "Admission", icon: "bi-box-arrow-in-right", html: "pages/transactions/admission.html", js: "js/transactions/admission.js", hasCRUD: true },

  billing: { name: "Billing", icon: "bi-receipt", html: "pages/transactions/billing.html", js: "js/transactions/billing.js", hasCRUD: true },

  payment: { name: "Payment", icon: "bi-credit-card", html: "pages/transactions/payment.html", js: "js/transactions/payment.js", hasCRUD: true },

prescription: {
  name: "Prescription",
  icon: "bi-file-medical",
  html: "pages/transactions/prescription.html",
  js: "js/transactions/prescription.js",
  hasCRUD: true
},


  doctor_assignment: { name: "Doctor Assignment", icon: "bi-person-check", html: "pages/transactions/doctor_assignment.html", js: "js/transactions/doctor_assignment.js", hasCRUD: true },

  room_assignment: { name: "Room Assignment", icon: "bi-building-check", html: "pages/transactions/room_assignment.html", js: "js/transactions/room_assignment.js", hasCRUD: true },

  lab_request: { name: "Lab Request", icon: "bi-clipboard-data", html: "pages/transactions/lab_request.html", js: "js/transactions/lab_request.js", hasCRUD: true }
};

// Sidebar navigation event listener
const sidebarLinks = document.querySelectorAll(".sidebar .nav-link[data-module]");
sidebarLinks.forEach(link => {
  link.addEventListener("click", function(e) {
    e.preventDefault();
    sidebarLinks.forEach(l => l.classList.remove("active"));
    this.classList.add("active");

    const masterfilesCollapse = document.getElementById("masterfilesMenu");
    const transactionsCollapse = document.getElementById("transactionsMenu");

    if (masterfilesCollapse && masterfilesCollapse.classList.contains('show') && window.innerWidth < 992) {
      const bsCollapse = bootstrap.Collapse.getOrCreateInstance(masterfilesCollapse);
      bsCollapse.hide();
    }
    if (transactionsCollapse && transactionsCollapse.classList.contains('show') && window.innerWidth < 992) {
      const bsCollapse = bootstrap.Collapse.getOrCreateInstance(transactionsCollapse);
      bsCollapse.hide();
    }

    const moduleKey = this.getAttribute("data-module");
    loadModule(moduleKey);
  });
});

// Chevron rotation handling for sidebar collapsibles
const masterfilesToggle = document.getElementById("masterfilesToggle");
const masterfilesMenu = document.getElementById("masterfilesMenu");
const masterfilesChevron = document.getElementById("masterfilesChevron");
if (masterfilesToggle && masterfilesMenu && masterfilesChevron) {
  masterfilesMenu.addEventListener("show.bs.collapse", () => {
    masterfilesChevron.style.transform = "rotate(180deg)";
  });
  masterfilesMenu.addEventListener("hide.bs.collapse", () => {
    masterfilesChevron.style.transform = "";
  });
}

const transactionsToggle = document.getElementById("transactionsToggle");
const transactionsMenu = document.getElementById("transactionsMenu");
const transactionsChevron = document.getElementById("transactionsChevron");
if (transactionsToggle && transactionsMenu && transactionsChevron) {
  transactionsMenu.addEventListener("show.bs.collapse", () => {
    transactionsChevron.style.transform = "rotate(180deg)";
  });
  transactionsMenu.addEventListener("hide.bs.collapse", () => {
    transactionsChevron.style.transform = "";
  });
}

// Settings modal handler
const settingsLink = document.getElementById("sidebarSettings");
if (settingsLink) {
  settingsLink.addEventListener("click", function(e) {
    e.preventDefault();
    showSettingsModal();
  });
}

function showSettingsModal() {
  document.querySelectorAll(".modal").forEach(m => m.remove());
  const modalHtml = `
    <div class="modal fade" id="settingsModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-gear me-2"></i>Settings</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">Settings and profile features coming soon.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  new bootstrap.Modal(document.getElementById("settingsModal")).show();
}

function loadModule(moduleKey, params = {}) {
  const module = modules[moduleKey];
  if (!module) {
    console.error("Module not found:", moduleKey);
    return;
  }

  window.moduleParams = params;

  document.getElementById("mainContent").innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3">Loading ${module.name}...</p>
    </div>`;

  fetch(module.html)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then(html => {
      document.getElementById("mainContent").innerHTML = html;

      if (module.hasCRUD && module.js) {
        const existingScript = document.querySelector(`script[src="${module.js}"]`);
        if (existingScript) existingScript.remove();

        const script = document.createElement("script");
        script.src = module.js;
        script.onload = () => {
          console.log(`${module.name} JS loaded`);
          setTimeout(() => initializeModule(moduleKey, params), 300);
        };
        document.body.appendChild(script);
      }
    })
    .catch(err => {
      console.error("Error loading module:", err);
      document.getElementById("mainContent").innerHTML = `
        <div class="alert alert-danger m-4">
          <h4>Error Loading ${module.name}</h4>
          <p>${err.message}</p>
        </div>`;
    });
}

function initializeModule(moduleKey, params = {}) {
  switch (moduleKey) {
    case "admission":
      if (typeof AdmissionManager !== "undefined") {
        if (window.admissionInstance) delete window.admissionInstance;
        window.admissionInstance = new AdmissionManager();
      }
      break;
    case "doctor_assignment":
      if (typeof DoctorAssignmentManager !== "undefined") {
        if (window.doctorAssignmentInstance) delete window.doctorAssignmentInstance;
        const admissionId = params.admissionId || (document.getElementById("admissionId")?.value);
        window.doctorAssignmentInstance = new DoctorAssignmentManager(admissionId);
      }
      break;
    case "doctors":
      if (typeof DoctorsManager !== "undefined") {
        if (window.doctorsInstance) delete window.doctorsInstance;
        window.doctorsInstance = new DoctorsManager();
      }
      break;
    case "specialty":
      if (typeof SpecialtyManager !== "undefined") {
        if (window.specialtyInstance) delete window.specialtyInstance;
        window.specialtyInstance = new SpecialtyManager();
      }
      break;
    case "floor":
      if (typeof FloorManager !== "undefined") {
        if (window.floorInstance) delete window.floorInstance;
        window.floorInstance = new FloorManager();
      }
      break;
    case "generic_medicine":
      if (typeof GenericMedicineManager !== "undefined") {
        if (window.genericMedicineInstance) delete window.genericMedicineInstance;
        window.genericMedicineInstance = new GenericMedicineManager();
      }
      break;
    case "lab_test_category":
      if (typeof LabTestCategoryManager !== "undefined") {
        if (window.labCategoryInstance) delete window.labCategoryInstance;
        window.labCategoryInstance = new LabTestCategoryManager();
      }
      break;
    case "lab_test":
      if (typeof LabTestManager !== "undefined") {
        if (window.labTestInstance) delete window.labTestInstance;
        window.labTestInstance = new LabTestManager();
      }
      break;
    case "patient":
      if (typeof PatientManager !== "undefined") {
        if (window.patientInstance) delete window.patientInstance;
        window.patientInstance = new PatientManager();
      }
      break;
    case "insurance_provider":
      if (typeof InsuranceProviderManager !== "undefined") {
        if (window.insuranceProviderInstance) delete window.insuranceProviderInstance;
        window.insuranceProviderInstance = new InsuranceProviderManager();
      }
      break;
    case "role":
      if (typeof RoleManager !== "undefined") {
        if (window.roleInstance) delete window.roleInstance;
        window.roleInstance = new RoleManager();
      }
      break;
    case "user":
      if (typeof UserManager !== "undefined") {
        if (window.userInstance) delete window.userInstance;
        window.userInstance = new UserManager();
      }
      break;
    case "room_category":
      if (typeof RoomCategoryManager !== "undefined") {
        if (window.roomCategoryInstance) delete window.roomCategoryInstance;
        window.roomCategoryInstance = new RoomCategoryManager();
      }
      break;
    case "room":
      if (typeof RoomManager !== "undefined") {
        if (window.roomInstance) delete window.roomInstance;
        window.roomInstance = new RoomManager();
      }
      break;
    case "medicine":
      if (typeof MedicineManager !== "undefined") {
        if (window.medicineInstance) delete window.medicineInstance;
        window.medicineInstance = new MedicineManager();
      }
      break;
    case "billing_category":
      if (typeof BillingCategoryManager !== "undefined") {
        if (window.billingCategoryInstance) delete window.billingCategoryInstance;
        window.billingCategoryInstance = new BillingCategoryManager();
      }
      break;
    case "billing":
      if (typeof BillingManager !== "undefined") {
        if (window.billingInstance) delete window.billingInstance;
        window.billingInstance = new BillingManager();
      }
      break;
    case "payment":
      if (typeof PaymentManager !== "undefined") {
        if (window.paymentInstance) delete window.paymentInstance;
        window.paymentInstance = new PaymentManager();
      }
      break;
    case "prescription":
      if (typeof PrescriptionManager !== "undefined") {
        if (window.prescriptionInstance) delete window.prescriptionInstance;
        window.prescriptionInstance = new PrescriptionManager();
      }
      break;
    case "room_assignment":
      if (typeof RoomAssignmentManager !== "undefined") {
        if (window.roomAssignmentInstance) delete window.roomAssignmentInstance;
        window.roomAssignmentInstance = new RoomAssignmentManager();
      }
      break;
    case "lab_request":
      if (typeof LabRequestManager !== "undefined") {
        if (window.labRequestInstance) delete window.labRequestInstance;
        window.labRequestInstance = new LabRequestManager();
      }
      break;
    default:
      console.log(`No initialization needed for module '${moduleKey}'`);
  }
}

// Default: load dashboard on page load
window.addEventListener("DOMContentLoaded", () => {
  loadModule("dashboard");
});
