import puppeteer from "puppeteer";
import invoiceModel from "../models/invoiceModel.js";

const pdfService = {
  async generateInvoicePDF(invoiceId, userId) {
    try {
      const invoice = await invoiceModel.findOne({
        _id: invoiceId,
        user: userId,
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Generate HTML template
      const html = this.generateInvoiceHTML(invoice);

      // Launch puppeteer and generate PDF
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "40px",
          right: "40px",
          bottom: "40px",
          left: "40px",
        },
      });

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      console.error("PDF Generation Error:", error);
      throw error;
    }
  },

  generateInvoiceHTML(invoice) {
    const client = invoice.client || {};
    const items = invoice.lineItems || [];
    const totals = invoice.totals || {};

    const formatCurrency = (amount) => {
      return `${invoice.currency || "$"}${parseFloat(amount || 0).toFixed(2)}`;
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', Arial, sans-serif;
      font-size: 10pt;
      color: #333;
      line-height: 1.4;
    }
    
    .container {
      max-width: 794px; /* A4 width at 96 DPI */
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }
    
    .invoice-title {
      font-size: 32pt;
      font-weight: bold;
      letter-spacing: 1px;
    }
    
    .invoice-number {
      font-size: 11pt;
      margin-top: 8px;
      color: #333;
    }
    
    .logo {
      font-size: 24pt;
      font-weight: bold;
    }
    
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    
    .info-column {
      flex: 1;
    }
    
    .label {
      font-weight: bold;
      margin-bottom: 4px;
      font-size: 10pt;
    }
    
    .value {
      margin-bottom: 12px;
      color: #333;
    }
    
    .balance-due {
      margin: 20px 0 30px 0;
    }
    
    .balance-due .label {
      font-size: 11pt;
      margin-bottom: 5px;
    }
    
    .balance-due .amount {
      font-size: 24pt;
      font-weight: bold;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    thead {
      border-bottom: 2px solid #000;
    }
    
    th {
      text-align: left;
      padding: 8px 0;
      font-weight: bold;
      font-size: 10pt;
    }
    
    th.right, td.right {
      text-align: right;
    }
    
    th.center, td.center {
      text-align: center;
    }
    
    tbody tr {
      border-bottom: 1px solid #E5E5E5;
    }
    
    td {
      padding: 12px 0;
      font-size: 10pt;
    }
    
    td.description {
      font-weight: bold;
    }
    
    .terms-section {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
    }
    
    .terms-left {
      width: 55%;
    }
    
    .terms-right {
      width: 40%;
    }
    
    .terms-title {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .terms-text {
      font-size: 9pt;
      line-height: 1.5;
      margin-bottom: 6px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      margin-bottom: 6px;
    }
    
    .summary-total {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      margin-top: 8px;
      border-top: 1px solid #E5E5E5;
      font-weight: bold;
      font-size: 11pt;
    }
    
    .footer {
      position: absolute;
      bottom: 40px;
      left: 40px;
      right: 40px;
      font-size: 8pt;
      color: #666;
      line-height: 1.4;
    }
    
    .footer p {
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">#${invoice.invoiceNumber}</div>
      </div>
      <div class="logo">theBoat</div>
    </div>
    
    <!-- Invoice Info and Bill To -->
    <div class="info-section">
      <div class="info-column">
        <div>
          <div class="label">Date</div>
          <div class="value">${formatDate(invoice.invoiceDate)}</div>
        </div>
        <div>
          <div class="label">Due Date</div>
          <div class="value">${formatDate(invoice.dueDate)}</div>
        </div>
        <div>
          <div class="label">Payment Terms</div>
          <div class="value">${invoice.paymentTerms || "Due Upon Receipt"}</div>
        </div>
      </div>
      <div class="info-column">
        <div class="label">Bill To</div>
        ${client.name ? `<div class="value">${client.name}</div>` : ""}
        ${client.email ? `<div class="value">${client.email}</div>` : ""}
        ${client.address ? `<div class="value">${client.address}</div>` : ""}
        ${client.phone ? `<div class="value">${client.phone}</div>` : ""}
      </div>
    </div>
    
    <!-- Balance Due -->
    <div class="balance-due">
      <div class="label">Balance Due</div>
      <div class="amount">${formatCurrency(totals.grandTotal - (invoice.amountPaid || 0))}</div>
    </div>
    
    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 35%">Description</th>
          <th class="center" style="width: 10%">Qty</th>
          <th class="right" style="width: 13%">Unit price</th>
          <th class="right" style="width: 13%">Discount</th>
          <th class="right" style="width: 13%">Tax</th>
          <th class="right" style="width: 16%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map((item) => {
            const baseAmount = (item.quantity || 0) * (item.unitPrice || 0);
            let discountAmount = 0;

            if (item.discount && item.discount.value > 0) {
              if (item.discount.type === "percentage") {
                discountAmount = (baseAmount * item.discount.value) / 100;
              } else {
                discountAmount = item.discount.value;
              }
            }

            const afterDiscount = baseAmount - discountAmount;
            const taxAmount = (afterDiscount * (item.tax || 0)) / 100;

            const discountDisplay =
              item.discount && item.discount.value > 0
                ? item.discount.type === "percentage"
                  ? `${item.discount.value}%`
                  : formatCurrency(item.discount.value)
                : "-";

            const taxDisplay = item.tax && item.tax > 0 ? `${item.tax}%` : "-";

            return `
          <tr>
            <td class="description">${item.description || item.name || ""}</td>
            <td class="center">${item.quantity || "N/A"}</td>
            <td class="right">${formatCurrency(item.unitPrice || item.price)}</td>
            <td class="right">${discountDisplay}</td>
            <td class="right">${taxDisplay}</td>
            <td class="right">${formatCurrency(item.lineTotal || baseAmount)}</td>
          </tr>
        `;
          })
          .join("")}
      </tbody>
    </table>
    
    <!-- Terms and Summary -->
    <div class="terms-section">
      <div class="terms-left">
        <div class="terms-title">Terms</div>
        <p class="terms-text">Payment is due within 15 days of the invoice date.</p>
        <p class="terms-text">Only Bank Transfers will be accepted as Payment Methods</p>
        
        <p class="terms-text" style="margin-top: 10px; font-weight: bold;">Account Details:</p>
        <p class="terms-text">155020134399</p>
        <p class="terms-text">The Boat Ceylon (Pvt.) Ltd</p>
        <p class="terms-text">Hatton National Bank</p>
        <p class="terms-text">Kochchikaae</p>
      </div>
      <div class="terms-right">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${formatCurrency(totals.subtotal)}</span>
        </div>
        ${
          totals.totalDiscount > 0
            ? `
        <div class="summary-row" style="color: #059669;">
          <span>Discount</span>
          <span>-${formatCurrency(totals.totalDiscount)}</span>
        </div>
        `
            : ""
        }
        ${
          totals.totalTax > 0
            ? `
        <div class="summary-row">
          <span>Tax</span>
          <span>+${formatCurrency(totals.totalTax)}</span>
        </div>
        `
            : ""
        }
        <div class="summary-row">
          <span>Total</span>
          <span>${formatCurrency(totals.grandTotal)}</span>
        </div>
        <div class="summary-row">
          <span>Amount Paid:</span>
          <span>${formatCurrency(invoice.amountPaid || 0)}</span>
        </div>
        <div class="summary-total">
          <span>Balance Due:</span>
          <span>${formatCurrency(totals.grandTotal - (invoice.amountPaid || 0))}</span>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>This invoice reflects services rendered remotely as per prior agreement.</p>
      <p>If you have any questions regarding this invoice, please contact us.</p>
      <p>Thank you for your business.</p>
    </div>
  </div>
</body>
</html>
    `;
  },
};

export default pdfService;
