const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");
const Order = require("../../models/orderSchema");

const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({ orderId }).populate("userId");
    if (!order) return res.status(404).send("Order not found");

    const filePath = path.join(__dirname, "../../views/user/invoice.ejs");
    const html = await ejs.renderFile(filePath, { order });

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "load",
      timeout: 0
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice-${orderId}.pdf"`,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).send("PDF Generation Failed");
  }
};

module.exports = { downloadInvoice };
