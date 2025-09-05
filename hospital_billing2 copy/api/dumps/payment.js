class PaymentManager {
  constructor() {
    this.admissions = [];
    this.insuranceProviders = [];
    this.payments = [];
    this.billings = [];
    this.selectedAdmissionId = null;

    this.init();
  }

  init() {
    this.loadAdmissions();
    this.loadInsuranceProviders();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Admission selection change
    document.getElementById('admissionSelect')?.addEventListener('change', (e) => {
      this.selectedAdmissionId = e.target.value;
      if (this.selectedAdmissionId) {
        this.loadPayments();
        this.loadBillings();
        this.displayPatientInfo();
        this.calculatePaymentSummary();
      } else {
        this.payments = [];
        this.billings = [];
        this.renderPaymentsTable();
        this.renderPaymentSummary();
        document.getElementById('patientInfo').innerHTML = '';
        document.getElementById('totalPaid').textContent = 'Total Paid: ₱0.00';
        document.getElementById('remainingBalance').textContent = 'Remaining: ₱0.00';
      }
    });

    // Add payment button
    document.getElementById('addPaymentBtn')?.addEventListener('click', () => {
      if (!this.selectedAdmissionId) {
        this.showAlert('Please select an admission first', 'warning');
        return;
      }
      this.openModal('add');
    });

    // Table actions (edit/delete)
    document.getElementById('paymentTableBody')?.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      const action = target.getAttribute('data-action');
      const id = target.getAttribute('data-id');

      if (!action || !id) return;

      if (action === 'edit') {
        this.openModal('edit', id);
      } else if (action === 'delete') {
        this.openDeleteModal(id);
      }
    });
  }

  async loadAdmissions() {
    try {
      const res = await axios.get(this.admissionApiUrl, {
        params: { operation: 'getAllAdmissions' }
      });

      if (res.data.error) throw new Error(res.data.error);

      this.admissions = Array.isArray(res.data) ? res.data : [];
      const selectEl = document.getElementById('admissionSelect');

      if (this.admissions.length === 0) {
        selectEl.innerHTML = '<option value="">No admissions found</option>';
        return;
      }

      selectEl.innerHTML = '<option value="">-- Select Admission --</option>' +
        this.admissions.map(a => `
          <option value="${a.admissionid}">
            #${a.admissionid} - ${a.patient_name} (${new Date(a.admission_date).toLocaleDateString()})
          </option>
        `).join('');
    } catch (err) {
      console.error('Error loading admissions:', err);
      this.showAlert('Failed to load admissions. Please try again.', 'danger');
    }
  }

  async loadInsuranceProviders() {
    try {
      const res = await axios.get(this.insuranceApiUrl, {
        params: { operation: 'getAll' }
      });

      if (res.data.error) throw new Error(res.data.error);

      this.insuranceProviders = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Error loading insurance providers:', err);
      this.insuranceProviders = [];
    }
  }

  async loadPayments() {
    if (!this.selectedAdmissionId) return;

    try {
      const res = await axios.get(this.baseApiUrl, {
        params: {
          operation: 'getPaymentsByAdmission',
          admissionid: this.selectedAdmissionId
        }
      });

      if (res.data.error) throw new Error(res.data.error);

      this.payments = Array.isArray(res.data) ? res.data : [];
      this.renderPaymentsTable();
    } catch (err) {
      console.error('Error loading payments:', err);
      this.payments = [];
      this.renderPaymentsTable();
    }
  }

  async loadBillings() {
    if (!this.selectedAdmissionId) return;

    try {
      const res = await axios.get(this.billingApiUrl, {
        params: {
          operation: 'getAllBillings',
          admissionid: this.selectedAdmissionId
        }
      });

      if (res.data.error) throw new Error(res.data.error);

      this.billings = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Error loading billings:', err);
      this.billings = [];
    }
  }

  renderPaymentsTable() {
    const tbody = document.getElementById('paymentTableBody');
    if (!tbody) return;

    if (!this.payments.length) {
      tbody.innerHTML = `
        <tr><td colspan="8" class="text-center text-muted py-3">No payment records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.payments.map(p => `
      <tr class="fade-row">
        <td>${p.paymentid}</td>
        <td>${new Date(p.date).toLocaleDateString()}</td>
        <td class="text-end">₱${this.formatCurrency(p.amount)}</td>
        <td>${p.method || '-'}</td>
        <td>${p.insurance_name || 'Cash'}</td>
        <td class="text-end">${p.insurance_coverage ? '₱' + this.formatCurrency(p.insurance_coverage) : '-'}</td>
        <td>${p.remarks || '-'}</td>
        <td>
          <div style="display:flex; gap:8px; flex-wrap:nowrap;">
            <button title="Edit" class="btn btn-sm btn-warning" data-id="${p.paymentid}" data-action="edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button title="Delete" class="btn btn-sm btn-danger" data-id="${p.paymentid}" data-action="delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>`).join('');
  }

  renderPaymentSummary() {
    const tbody = document.getElementById('paymentSummaryTableBody');
    if (!tbody) return;

    if (!this.payments || !this.payments.length) {
      tbody.innerHTML = `
        <tr><td colspan="6" class="text-center text-muted py-3">No payment data available.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.payments.map(p => `
      <tr>
        <td>${new Date(p.date).toLocaleDateString()}</td>
        <td class="text-end">₱${this.formatCurrency(p.amount)}</td>
        <td>${p.method || '-'}</td>
        <td>${p.insurance_name || 'Cash'}</td>
        <td class="text-end">${p.insurance_coverage ? '₱' + this.formatCurrency(p.insurance_coverage) : '-'}</td>
        <td>${p.remarks || '-'}</td>
      </tr>`).join('');
  }

  calculatePaymentSummary() {
    const totalBilling = this.billings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const totalPaid = this.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const remaining = totalBilling - totalPaid;

    document.getElementById('totalPaid').textContent = `Total Paid: ₱${this.formatCurrency(totalPaid)}`;

    // Update badge colors based on remaining balance
    const remainingBadge = document.getElementById('remainingBalance');
    if (remaining <= 0) {
      remainingBadge.className = 'badge bg-success fs-6 ms-2';
      remainingBadge.textContent = 'Fully Paid';
    } else if (remaining <= totalBilling * 0.5) {
      remainingBadge.className = 'badge bg-warning fs-6 ms-2';
      remainingBadge.textContent = `Remaining: ₱${this.formatCurrency(remaining)}`;
    } else {
      remainingBadge.className = 'badge bg-danger fs-6 ms-2';
      remainingBadge.textContent = `Remaining: ₱${this.formatCurrency(remaining)}`;
    }
  }

  displayPatientInfo() {
    if (!this.selectedAdmissionId) {
      document.getElementById('patientInfo').innerHTML = '';
      return;
    }

    const admission = this.admissions.find(a => a.admissionid == this.selectedAdmissionId);
    if (!admission) return;

    document.getElementById('patientInfo').innerHTML = `
      <strong>Patient:</strong> ${admission.patient_name}<br>
      <strong>Admission Date:</strong> ${new Date(admission.admission_date).toLocaleDateString()}<br>
      <strong>Status:</strong> <span class="badge ${admission.status === 'Admitted' ? 'bg-success' : 'bg-secondary'}">${admission.status}</span>
    `;
  }

  openModal(mode, paymentId = null) {
    document.querySelectorAll('#paymentModal').forEach(m => m.remove());

    let title, body;

    if (mode === 'view') {
      const payment = this.payments.find(p => String(p.paymentid) === String(paymentId));
      if (!payment) return;

      title = 'View Payment';
      body = `
        <p><strong>Amount:</strong> ₱${this.formatCurrency(payment.amount)}</p>
        <p><strong>Date:</strong> ${new Date(payment.date).toLocaleDateString()}</p>
        <p><strong>Method:</strong> ${payment.method || '-'}</p>
        <p><strong>Insurance:</strong> ${payment.insurance_name || 'Cash'}</p>
        <p><strong>Remarks:</strong> ${payment.remarks || '-'}</p>
      `;
    } else {
      title = mode === 'add' ? 'Add Payment' : 'Edit Payment';
      body = `
        <form id="paymentForm" class="needs-validation" novalidate>
          <input type="hidden" id="paymentId" value="${paymentId || ''}" />
          <input type="hidden" id="modalAdmissionId" value="${this.selectedAdmissionId}" />

          <div class="mb-3">
            <label class="form-label">Amount</label>
            <div class="input-group">
              <span class="input-group-text">₱</span>
              <input type="number" id="amount" class="form-control" step="0.01" min="0.01" required
                     value="${paymentId ? this.payments.find(p => String(p.paymentid) === String(paymentId))?.amount || '' : ''}" />
            </div>
            <div class="invalid-feedback">Please enter a valid amount.</div>
          </div>

          <div class="mb-3">
            <label class="form-label">Payment Method</label>
            <select id="paymentMethod" class="form-select" required>
              <option value="">Select Method</option>
              <option value="Cash" ${paymentId && this.payments.find(p => String(p.paymentid) === String(paymentId))?.method === 'Cash' ? 'selected' : ''}>Cash</option>
              <option value="Credit Card" ${paymentId && this.payments.find(p => String(p.paymentid) === String(paymentId))?.method === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
              <option value="Debit Card" ${paymentId && this.payments.find(p => String(p.paymentid) === String(paymentId))?.method === 'Debit Card' ? 'selected' : ''}>Debit Card</option>
              <option value="Bank Transfer" ${paymentId && this.payments.find(p => String(p.paymentid) === String(paymentId))?.method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
              <option value="Check" ${paymentId && this.payments.find(p => String(p.paymentid) === String(paymentId))?.method === 'Check' ? 'selected' : ''}>Check</option>
            </select>
            <div class="invalid-feedback">Please select a payment method.</div>
          </div>

          <div class="mb-3">
            <label class="form-label">Insurance Provider (Optional)</label>
            <select id="insuranceId" class="form-select">
              <option value="">No Insurance (Cash Payment)</option>
              ${this.insuranceProviders.map(ins => `
                <option value="${ins.insuranceid}" ${paymentId && this.payments.find(p => String(p.paymentid) === String(paymentId))?.insuranceid == ins.insuranceid ? 'selected' : ''}>
                  ${ins.name} (${ins.coverage_percent}% coverage)
                </option>`).join('')}
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Remarks</label>
            <textarea id="remarks" class="form-control" rows="2" placeholder="Additional notes...">${paymentId ? this.payments.find(p => String(p.paymentid) === String(paymentId))?.remarks || '' : ''}</textarea>
          </div>
        </form>
      `;
    }

    const headerColor = mode === 'add' ? 'bg-success' : mode === 'edit' ? 'bg-warning' : 'bg-primary';

    const modalHtml = `
      <div class="modal fade" id="paymentModal" tabindex="-1" aria-labelledby="paymentModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header ${headerColor} text-white">
              <h5 class="modal-title" id="paymentModalLabel">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              ${(mode === 'add' || mode === 'edit') ? `<button type="button" class="btn btn-primary" id="savePaymentBtn">${mode === 'add' ? 'Add' : 'Update'}</button>` : ''}
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('paymentModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    if (mode === 'add' || mode === 'edit') {
      document.getElementById('savePaymentBtn').addEventListener('click', () => this.savePayment(mode, bsModal));
      document.getElementById('paymentForm').addEventListener('submit', e => e.preventDefault());
    }

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
  }

  openDeleteModal(paymentId) {
    document.querySelectorAll('#deletePaymentModal').forEach(m => m.remove());

    const payment = this.payments.find(p => String(p.paymentid) === String(paymentId));
    if (!payment) return;

    const modalHtml = `
      <div class="modal fade" id="deletePaymentModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">Confirm Delete Payment</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete the payment of <strong>₱${this.formatCurrency(payment.amount)}</strong> made on <strong>${new Date(payment.date).toLocaleDateString()}</strong>?</p>
              <p class="text-danger"><small>This action cannot be undone.</small></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmDeletePaymentBtn">Delete Payment</button>
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('deletePaymentModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    document.getElementById('confirmDeletePaymentBtn').addEventListener('click', () => this.deletePayment(paymentId, bsModal));
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
  }

  async savePayment(mode, modal) {
    const form = document.getElementById('paymentForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    // Get insurance provider if selected
    const insuranceId = document.getElementById('insuranceId').value || null;
    let insuranceProvider = null;
    let coverageAmount = 0;
    let patientAmount = 0;

    // Calculate insurance coverage if applicable
    if (insuranceId) {
      insuranceProvider = this.insuranceProviders.find(ins => ins.insuranceid == insuranceId);

      if (insuranceProvider) {
        // Get total billing amount for this admission
        const totalBilling = this.billings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

        // Calculate coverage amount based on percentage
        const coveragePercent = parseFloat(insuranceProvider.coverage_percent) || 0;
        coverageAmount = totalBilling * (coveragePercent / 100);

        // Calculate remaining amount to be paid by patient
        const totalPaid = this.payments.reduce((sum, p) => {
          // Don't include the current payment if we're editing
          if (mode === 'edit' && p.paymentid == paymentId) return sum;
          return sum + parseFloat(p.amount || 0);
        }, 0);

        patientAmount = totalBilling - coverageAmount - totalPaid;

        // Ensure we don't overpay
        if (patientAmount < 0) patientAmount = 0;

        // Auto-fill the amount field with the calculated patient amount
        document.getElementById('amount').value = patientAmount.toFixed(2);
      }
    }

    const paymentId = document.getElementById('paymentId').value || null;
    const data = {
      paymentid: paymentId,
      admissionid: this.selectedAdmissionId,
      amount: document.getElementById('amount').value,
      method: document.getElementById('paymentMethod').value,
      insuranceid: insuranceId,
      remarks: document.getElementById('remarks').value,
      insurance_coverage: insuranceId ? coverageAmount.toFixed(2) : null
    };

    try {
      const res = await axios.post(this.baseApiUrl, {
        operation: mode === 'add' ? 'insertPayment' : 'updatePayment',
        ...data
      });

      if (res.data.success === false) throw new Error(res.data.error);

      this.showAlert(`Payment ${mode === 'edit' ? 'updated' : 'added'} successfully!`, 'success');
      modal.hide();
      await this.loadPayments();
      this.calculatePaymentSummary();
    } catch (err) {
      this.showAlert(`Failed to save payment: ${err.message}`, 'danger');
    }
  }

  async deletePayment(paymentId, modal) {
    try {
      const res = await axios.post(this.baseApiUrl, {
        operation: 'deletePayment',
        paymentid: paymentId
      });

      if (res.data.success === false) throw new Error(res.data.error);

      this.showAlert('Payment deleted successfully!', 'success');
      modal.hide();
      await this.loadPayments();
      this.calculatePaymentSummary();
    } catch (err) {
      this.showAlert(`Failed to delete payment: ${err.message}`, 'danger');
    }
  }

  showAlert(message, type = 'info') {
    document.querySelectorAll('.alert.position-fixed').forEach(e => e.remove());
    const icons = { success: 'check-circle', danger: 'exclamation-triangle', warning: 'exclamation-circle', info: 'info-circle' };
    const icon = icons[type] || icons.info;

    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show position-fixed"
           style="top: 20px; right: 20px; z-index: 1055; min-width: 350px;">
        <i class="bi bi-${icon} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', alertHtml);

    const alertEl = document.querySelector('.alert.position-fixed');
    if (alertEl && window.bootstrap?.Alert) {
      const bsAlert = new bootstrap.Alert(alertEl);
      setTimeout(() => bsAlert.close(), 4000);
    }
  }

  formatCurrency(value) {
    return parseFloat(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

document.addEventListener('DOMContentLoaded', () => new PaymentManager());
