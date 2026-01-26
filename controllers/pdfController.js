import pdfService from "../services/pdfService.js";

// Download PDF
export const generateInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const pdfBuffer = await pdfService.generateInvoicePDF(id, req.user._id);

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Invoice-.pdf`);
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF...",
      error: error.message,
    });
  }
};

// Preview invoice PDF
export const previewInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const pdfBuffer = await pdfService.generateInvoicePDF(id, req.user._id);

    // Set headers for inline display
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Preview Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to preview PDF",
      error: error.message,
    });
  }
};
