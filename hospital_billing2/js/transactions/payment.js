/**
 * Payment Management Module
 */
class PaymentManager {
  constructor() {
    // API URLs
    this.apiUrl = 'api/payment.php';
    this.admissionApiUrl = 'api/admission.php';
    
    // Data storage
    this.admissions = [];
    this.payments = [];
    this.selectedAdmission = null;
    
    // Initialize the module
    this.init();
  }
  
  async init() {
    try {
      // Load data and setup UI
      await this.loadAdmissions();
      await this.loadAllPayments();
      this.populateAdmissionSelect();
      this.populatePatientFilter();
      this.setupEventListeners();
      this.setupFilters();
      this.filterPayments();
    } catch (error) {
      console.error('Initialization error:', error);
      toastr.error('Failed to initialize payment module');
    }
  }
  
  setupEventListeners() {
    // Admission selection change
    const admissionSelect = document.getElementById('admissionSelect');
    if (admissionSelect) {
      admissionSelect.addEventListener('change', () => this.handleAdmissionChange());
    }
    
    // Add payment button
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    if (addPaymentBtn) {
      addPaymentBtn.addEventListener('click', () => this.openAddPaymentModal());
    }
    
    // Search button
    const searchBtn = document.getElementById('searchPaymentsBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.filterPayments());
    }
    
    // Payment table actions
    const paymentTableBody = document.getElementById('paymentTableBody');
    if (paymentTableBody) {
      paymentTableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button[data-action]');
        if (!target) return;
        
        const paymentId = target.dataset.id;
        const action = target.dataset.action;
        
        if (action === 'view') {
          this.viewPaymentDetails(paymentId);
        } else if (action === 'edit') {
          this.editPayment(paymentId);
        } else if (action === 'delete') {
          this.confirmDeletePayment(paymentId);
        }
      });
    }
  }
  
  setupFilters() {
    // Add filter section to the Payment Records card
    const paymentRecordsCard = document.querySelector('.card:last-child .card-header');
    if (paymentRecordsCard) {
      const filterSection = document.createElement('div');
      filterSection.className = 'filter-section mt-3';
      filterSection.innerHTML = `
        <div class="row g-3">
          <div class="col-md-3">
            <label for="patientFilter" class="form-label">Patient</label>
            <select id="patientFilter" class="form-select form-select-sm">
              <option value="">All Patients</option>
            </select>
          </div>
          <div class="col-md-2">
            <label for="paymentMethodFilter" class="form-label">Payment Method</label>
            <select id="paymentMethodFilter" class="form-select form-select-sm">
              <option value="">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Insurance">Insurance</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Date Range</label>
            <div class="d-flex gap-2">
              <div class="flex-grow-1">
                <input type="date" id="dateFromFilter" class="form-control form-control-sm">
              </div>
              <div class="flex-grow-1">
                <input type="date" id="dateToFilter" class="form-control form-control-sm">
              </div>
            </div>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button id="searchPaymentsBtn" class="btn btn-primary btn-sm w-100">
              <i class="bi bi-search me-1"></i> Search
            </button>
          </div>
        </div>
      `;
      paymentRecordsCard.appendChild(filterSection);
      
      // Set default date range (last 30 days)
      this.setDefaultDateRange();
    }
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
  
  async loadAdmissions() {
    try {
      const res = await axios.get(this.admissionApiUrl, {
        params: { operation: 'getAllAdmissions' }
      });
      
      if (res.data.status === 'success') {
        this.admissions = res.data.data;
      } else {
        console.error('Failed to load admissions:', res.data.message);
      }
    } catch (error) {
      console.error('Error loading admissions:', error);
      toastr.error('Failed to load admissions');
    }
  }
  
  async loadAllPayments() {
    try {
      const res = await axios.get(this.apiUrl, {
        params: { operation: 'getAllPayments' }
      });
      
      if (res.data.status === 'success') {
        this.payments = res.data.data || [];
      } else {
        console.error('Failed to load payments:', res.data.message);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toastr.error('Failed to load payments');
    }
  }
  
  populateAdmissionSelect() {
    const admissionSelect = document.getElementById('admissionSelect');
    if (!admissionSelect || !this.admissions.length) return;
    
    const options = this.admissions.map(admission => {
      return `<option value="${admission.admissionid}">
        ${this.escapeHtml(admission.patient_name)} - ${this.formatDate(admission.admission_date)}
      </option>`;
    });
    
    admissionSelect.innerHTML = '<option value="">-- Select Admission --</option>' + options.join('');
  }
  
  populatePatientFilter() {
    const patientFilter = document.getElementById('patientFilter');
    if (!patientFilter || !this.admissions.length) return;
    
    // Get unique patients from admissions
    const uniquePatients = [];
    const patientIds = new Set();
    
    this.admissions.forEach(admission => {
      if (admission.patientid && !patientIds.has(admission.patientid)) {
        patientIds.add(admission.patientid);
        uniquePatients.push({
          id: admission.patientid,
          name: admission.patient_name
        });
      }
    });
    
    // Sort patients by name
    uniquePatients.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create options
    const options = uniquePatients.map(patient => {
      return `<option value="${patient.id}">${this.escapeHtml(patient.name)}</option>`;
    });
    
    patientFilter.innerHTML = '<option value="">All Patients</option>' + options.join('');
  }
  
  handleAdmissionChange() {
    const admissionSelect = document.getElementById('admissionSelect');
    if (!admissionSelect) return;
    
    const admissionId = admissionSelect.value;
    if (!admissionId) {
      this.selectedAdmission = null;
      this.updatePatientInfo(null);
      this.loadPaymentSummary([]);
      return;
    }
    
    this.selectedAdmission = this.admissions.find(a => a.admissionid === admissionId);
    this.updatePatientInfo(this.selectedAdmission);
    
    // Load payments for this admission
    const admissionPayments = this.payments.filter(p => p.admission_id === admissionId);
    this.loadPaymentSummary(admissionPayments);
  }
  
  updatePatientInfo(admission) {
    const patientInfo = document.getElementById('patientInfo');
    if (!patientInfo) return;
    
    if (!admission) {
      patientInfo.innerHTML = '<p class="text-muted">Select an admission to view patient details</p>';
      return;
    }
    
    patientInfo.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="avatar-sm bg-primary-subtle rounded-circle me-3 d-flex align-items-center justify-content-center">
          <i class="bi bi-person text-primary fs-4"></i>
        </div>
        <div>
          <h6 class="mb-0">${this.escapeHtml(admission.patient_name)}</h6>
          <small class="text-muted">
            <i class="bi bi-calendar-event me-1"></i>${this.formatDate(admission.admission_date)}
          </small>
        </div>
      </div>
    `;
  }
  
  loadPaymentSummary(payments) {
    const summaryTableBody = document.getElementById('paymentSummaryTableBody');
    const totalPaidElement = document.getElementById('totalPaid');
    const remainingBalanceElement = document.getElementById('remainingBalance');
    
    if (!summaryTableBody) return;
    
    if (!payments || payments.length === 0) {
      summaryTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-3">No payments found for this admission</td></tr>';
      if (totalPaidElement) totalPaidElement.textContent = 'Total Paid: ₱0.00';
      if (remainingBalanceElement) remainingBalanceElement.textContent = 'Remaining: ₱0.00';
      return;
    }
    
    // Calculate totals
    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const totalBill = this.selectedAdmission ? parseFloat(this.selectedAdmission.total_amount || 0) : 0;
    const remainingBalance = Math.max(0, totalBill - totalPaid);
    
    // Update summary elements
    if (totalPaidElement) totalPaidElement.textContent = `Total Paid: ₱${totalPaid.toFixed(2)}`;
    if (remainingBalanceElement) remainingBalanceElement.textContent = `Remaining: ₱${remainingBalance.toFixed(2)}`;
    
    // Render payment summary table
    summaryTableBody.innerHTML = payments.map(payment => {
      return `
        <tr>
          <td>${this.formatDate(payment.payment_date)}</td>
          <td>₱${parseFloat(payment.amount).toFixed(2)}</td>
          <td>${this.escapeHtml(payment.payment_method || 'N/A')}</td>
          <td>${this.escapeHtml(payment.insurance_provider || 'N/A')}</td>
          <td>${payment.insurance_coverage ? `₱${parseFloat(payment.insurance_coverage).toFixed(2)}` : 'N/A'}</td>
          <td>${this.escapeHtml(payment.remarks || '')}</td>
        </tr>
      `;
    }).join('');
  }
  
  filterPayments() {
    const patientId = document.getElementById('patientFilter')?.value;
    const paymentMethod = document.getElementById('paymentMethodFilter')?.value;
    const dateFromFilter = document.getElementById('dateFromFilter')?.value;
    const dateToFilter = document.getElementById('dateToFilter')?.value;
    
    let filtered = this.payments;
    
    // Filter by patient
    if (patientId) {
      filtered = filtered.filter(payment => {
        const admission = this.admissions.find(a => a.admissionid === payment.admission_id);
        return admission && String(admission.patientid) === String(patientId);
      });
    }
    
    // Filter by payment method
    if (paymentMethod) {
      filtered = filtered.filter(payment => payment.payment_method === paymentMethod);
    }
    
    // Filter by date range
    if (dateFromFilter || dateToFilter) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          if (paymentDate < fromDate) {
            return false;
          }
        }
        
        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999); // End of the day
          if (paymentDate > toDate) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    this.renderPaymentTable(filtered);
  }
  
  renderPaymentTable(payments) {
    const tbody = document.getElementById('paymentTableBody');
    if (!tbody) return;
    
    if (!payments || payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-3">No matching payments found</td></tr>';
      return;
    }
    
    tbody.innerHTML = payments.map(payment => {
      // Find admission for this payment
      const admission = this.admissions.find(a => a.admissionid === payment.admission_id);
      const patientName = admission ? admission.patient_name : 'Unknown Patient';
      
      return `
        <tr>
          <td>${payment.payment_id}</td>
          <td>${this.formatDate(payment.payment_date)}</td>
          <td><strong>₱${parseFloat(payment.amount).toFixed(2)}</strong></td>
          <td>${this.escapeHtml(payment.payment_method || 'N/A')}</td>
          <td>${this.escapeHtml(payment.insurance_provider || 'N/A')}</td>
          <td>${payment.insurance_coverage ? `₱${parseFloat(payment.insurance_coverage).toFixed(2)}` : 'N/A'}</td>
          <td>${this.escapeHtml(payment.remarks || '')}</td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-info" data-id="${payment.payment_id}" data-action="view" title="View Details">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-warning" data-id="${payment.payment_id}" data-action="edit" title="Edit">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger" data-id="${payment.payment_id}" data-action="delete" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  openAddPaymentModal() {
    // Implementation for adding a new payment
    console.log('Open add payment modal');
  }
  
  viewPaymentDetails(paymentId) {
    // Implementation for viewing payment details
    console.log('View payment details:', paymentId);
  }
  
  editPayment(paymentId) {
    // Implementation for editing a payment
    console.log('Edit payment:', paymentId);
  }
  
  confirmDeletePayment(paymentId) {
    // Implementation for confirming payment deletion
    console.log('Confirm delete payment:', paymentId);
  }
  
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  
  escapeHtml(text) {
    if (!text) return '';
    return text
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}