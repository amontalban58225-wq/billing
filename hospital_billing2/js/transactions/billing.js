/* global axios, bootstrap */

class BillingManager {
  constructor() {
    this.apiUrl = 'http://localhost/hospital_billing2/api/transactions/billing.php';
    this.billings = [];
    this.patients = [];
    this.init();
  }

  async init() {
    await Promise.all([this.loadBillings(), this.loadPatients()]);
    this.setupEventListeners();
    this.populatePatientFilter();
  }

  setupEventListeners() {
    document.getElementById('searchBillingBtn').addEventListener('click', () => this.filterBillings());
    document.getElementById('addBillingBtn').addEventListener('click', () => alert('Add Manual Billing form logic to be implemented'));

    document.getElementById('billingTableBody').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (!id || !action) return;

      const billing = this.billings.find(b => String(b.billingid) === String(id));
      if (!billing) return;

      if (action === 'view') this.openModal('view', billing);
      else if (action === 'edit') this.openModal('edit', billing);
      else if (action === 'delete') this.openModal('delete', billing);
    });
  }

  async loadBillings() {
    try {
      const response = await axios.get(this.apiUrl, { params: { operation: 'getBillings' } });
      this.billings = response.data.success ? response.data.data : [];
      this.renderTable(this.billings);
    } catch (error) {
      document.getElementById('billingTableBody').innerHTML = `<tr><td colspan="8" class="text-danger text-center py-3">${error.message}</td></tr>`;
    }
  }

  async loadPatients() {
    try {
      const res = await axios.get('http://localhost/hospital_billing2/api/patients.php', { params: { operation: 'getAll' } });
      this.patients = Array.isArray(res.data) ? res.data : [];
    } catch {
      this.patients = [];
      // Fallback: static list or empty
    }
  }

  populatePatientFilter() {
    const filter = document.getElementById('patientFilter');
    filter.innerHTML = '<option value="">All Patients</option>';
    this.patients.forEach(p => {
      const option = document.createElement('option');
      option.value = p.patientid;
      option.textContent = `${p.firstname} ${p.lastname}`;
      filter.appendChild(option);
    });
    
    // Set default dates for date filters (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    
    if (dateFromFilter) {
      dateFromFilter.value = thirtyDaysAgo.toISOString().split('T')[0];
    }
    
    if (dateToFilter) {
      dateToFilter.value = today.toISOString().split('T')[0];
    }
  }

  filterBillings() {
    const patientId = document.getElementById('patientFilter').value;
    const status = document.getElementById('statusFilter').value;
    const dateFromFilter = document.getElementById('dateFromFilter')?.value;
    const dateToFilter = document.getElementById('dateToFilter')?.value;

    let filtered = this.billings;

    // Filter by patient
    if (patientId) {
      filtered = filtered.filter(b => String(b.patientid) === String(patientId));
    }
    
    // Filter by status
    if (status) {
      filtered = filtered.filter(b => b.status_label?.toLowerCase() === status.toLowerCase());
    }
    
    // Filter by date range
    if (dateFromFilter || dateToFilter) {
      filtered = filtered.filter(b => {
        const billingDate = new Date(b.billing_date);
        
        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter);
          if (billingDate < fromDate) {
            return false;
          }
        }
        
        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999); // End of the day
          if (billingDate > toDate) {
            return false;
          }
        }
        
        return true;
      });
    }

    this.renderTable(filtered);
  }

  renderTable(data) {
    const tbody = document.getElementById('billingTableBody');
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No billing records found.</td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(b => {
      // Format monetary values
      const totalAmount = parseFloat(b.total_amount || 0).toFixed(2);
      const netAmount = parseFloat(b.net_amount || b.total_amount || 0).toFixed(2);
      const patientResponsibility = parseFloat(b.patient_responsibility || b.total_amount || 0).toFixed(2);
      
      // Determine status class
      const statusClass = b.status_class || 'info';
      const status = b.status || b.status_label || 'Pending';
      
      return `
      <tr>
        <td>${this.escape(b.patient_name)}</td>
        <td>${this.escape(b.admissionid)}</td>
        <td>${this.escape(b.category_name || 'N/A')}</td>
        <td>$${totalAmount}</td>
        <td>$${netAmount}</td>
        <td>${this.escape(b.formatted_date || b.billing_date)}</td>
        <td><span class="status-badge status-${statusClass}">${this.escape(status)}</span></td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view" data-id="${b.billingid}" data-action="view" title="View Details"><i class="bi bi-eye"></i></button>
            <button class="action-btn edit" data-id="${b.billingid}" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="action-btn delete" data-id="${b.billingid}" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `}).join('');
  }

  openModal(mode, billing) {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = '';

    let title = '';
    if (mode === 'view') title = 'View Billing Details';
    else if (mode === 'edit') title = 'Edit Billing';
    else if (mode === 'delete') title = 'Confirm Delete Billing';

    // Format monetary values
    const totalAmount = parseFloat(billing.total_amount || 0).toFixed(2);
    const netAmount = parseFloat(billing.net_amount || billing.total_amount || 0).toFixed(2);
    const discountAmount = parseFloat(billing.discount_amount || 0).toFixed(2);
    const taxAmount = parseFloat(billing.tax_amount || 0).toFixed(2);
    const insuranceCoveredAmount = parseFloat(billing.insurance_covered_amount || 0).toFixed(2);
    const patientResponsibility = parseFloat(billing.patient_responsibility || billing.total_amount || 0).toFixed(2);
    
    // Get status
    const status = billing.status || billing.status_label || 'Pending';

    let body = `
      <p><strong>Admission ID:</strong> ${this.escape(billing.admissionid)}</p>
      <p><strong>Patient:</strong> ${this.escape(billing.patient_name)}</p>
      <p><strong>Service Type:</strong> ${this.escape(billing.category_name || 'N/A')}</p>
      <p><strong>Gross Amount:</strong> $${totalAmount}</p>
      <p><strong>Discount Amount:</strong> $${discountAmount}</p>
      <p><strong>Tax Amount:</strong> $${taxAmount}</p>
      <p><strong>Net Amount:</strong> $${netAmount}</p>
      <p><strong>Insurance Coverage:</strong> $${insuranceCoveredAmount}</p>
      <p><strong>Patient Responsibility:</strong> $${patientResponsibility}</p>
      <p><strong>Status:</strong> ${this.escape(status)}</p>
      <p><strong>Billing Date:</strong> ${this.escape(billing.formatted_date || billing.billing_date)}</p>`;

    if (mode === 'delete') {
      body += `<p>Are you sure you want to delete this billing?</p>`;
    } else if (mode === 'edit') {
      body = `
        <form id="billingEditForm">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="editQuantity" class="form-label">Quantity</label>
              <input type="number" step="1" min="1" class="form-control" id="editQuantity" value="${this.escape(billing.quantity || 1)}" />
            </div>
            <div class="col-md-6 mb-3">
              <label for="editUnitPrice" class="form-label">Unit Price</label>
              <input type="number" step="0.01" min="0" class="form-control" id="editUnitPrice" value="${this.escape(billing.unit_price || billing.total_amount || 0)}" />
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="editDiscountAmount" class="form-label">Discount Amount</label>
              <input type="number" step="0.01" min="0" class="form-control" id="editDiscountAmount" value="${this.escape(billing.discount_amount || 0)}" />
            </div>
            <div class="col-md-6 mb-3">
              <label for="editTaxAmount" class="form-label">Tax Amount</label>
              <input type="number" step="0.01" min="0" class="form-control" id="editTaxAmount" value="${this.escape(billing.tax_amount || 0)}" />
            </div>
          </div>
          <div class="mb-3">
            <label for="editInsuranceCoverage" class="form-label">Insurance Coverage (%)</label>
            <input type="number" step="0.01" min="0" max="100" class="form-control" id="editInsuranceCoverage" value="${this.escape(billing.insurance_coverage_percent || 0)}" />
          </div>
          <div class="mb-3">
            <label for="editStatus" class="form-label">Status</label>
            <select class="form-select" id="editStatus">
              <option value="paid" ${status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="partial" ${status === 'partial' ? 'selected' : ''}>Partial</option>
              <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </form>`;
    }

    modalContainer.insertAdjacentHTML('beforeend', `
    <div class="modal fade" id="billingModal" tabindex="-1" aria-labelledby="billingModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="billingModalLabel">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">${body}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            ${mode === 'edit' ? `<button type="button" class="btn btn-primary" id="modalSaveBtn">Save</button>` : ''}
            ${mode === 'delete' ? `<button type="button" class="btn btn-danger" id="modalDeleteBtn">Delete</button>` : ''}
          </div>
        </div>
      </div>
    </div>
    `);

    const modalEl = document.getElementById('billingModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    if (mode === 'edit') {
      document.getElementById('modalSaveBtn').addEventListener('click', () => this.saveBilling(billing.billingid));
    } else if (mode === 'delete') {
      document.getElementById('modalDeleteBtn').addEventListener('click', () => this.deleteBilling(billing.billingid));
    }

    modalEl.addEventListener('hidden.bs.modal', () => {
      bsModal.dispose();
      modalEl.remove();
    }, { once: true });
  }

  async saveBilling(billingid) {
    const quantity = parseInt(document.getElementById('editQuantity').value, 10);
    const unitPrice = parseFloat(document.getElementById('editUnitPrice').value);
    const discountAmount = parseFloat(document.getElementById('editDiscountAmount').value);
    const taxAmount = parseFloat(document.getElementById('editTaxAmount').value);
    const insuranceCoveragePercent = parseFloat(document.getElementById('editInsuranceCoverage').value);
    const status = document.getElementById('editStatus').value;

    // Validate inputs
    if (isNaN(quantity) || quantity < 1) {
      alert('Please enter a valid quantity');
      return;
    }

    if (isNaN(unitPrice) || unitPrice < 0) {
      alert('Please enter a valid unit price');
      return;
    }

    // Calculate total amount
    const amount = quantity * unitPrice;

    try {
      await axios.post(this.apiUrl, {
        operation: 'updateBilling',
        billingid: billingid,
        quantity: quantity,
        unit_price: unitPrice,
        amount: amount,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        insurance_coverage_percent: insuranceCoveragePercent,
        status: status
      });
      alert('Billing updated successfully');
      const modalEl = document.getElementById('billingModal');
      bootstrap.Modal.getInstance(modalEl).hide();
      await this.loadBillings();
    } catch (err) {
      alert('Failed to update billing: ' + err.message);
    }
  }

  async deleteBilling(billingid) {
    if (!confirm('Are you sure you want to delete this billing?')) return;
    try {
      await axios.post(this.apiUrl, {
        operation: 'deleteBilling',
        billingid: billingid
      });
      alert('Billing deleted successfully');
      const modalEl = document.getElementById('billingModal');
      bootstrap.Modal.getInstance(modalEl).hide();
      await this.loadBillings();
    } catch (err) {
      alert('Failed to delete billing: ' + err.message);
    }
  }

  escape(html) {
    return String(html ?? '').replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[match]);
  }
}

document.addEventListener('DOMContentLoaded', () => new BillingManager());
