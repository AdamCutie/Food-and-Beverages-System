const nodemailer = require('nodemailer');

// Configure your email provider (Gmail, Outlook, SMTP, SendGrid, etc.)
const transporter = nodemailer.createTransport({
    service: 'gmail', // or use 'host' and 'port' for custom SMTP
    auth: {
        user: 'hotel.thecelestia@gmail.com',
        pass: 'Password@101' // Use an App Password, not your real password
    }
});

// Helper function to generate HTML and send email
export const sendReceiptEmail = async (clientEmail, clientName, orderData, orderId) => {
    
    // 1. Build the Items HTML list
    const itemsHtml = orderData.order_items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity} x Item #${item.item_id}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₱${(item.quantity * item.price_on_purchase).toFixed(2)}</td>
        </tr>
    `).join('');

    // 2. Build the Full Email HTML
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #333;">Thank you for your order, ${clientName}!</h2>
            <p>Here is the receipt for your recent payment.</p>
            
            <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px;">Order #${orderId}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    ${itemsHtml}
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Subtotal</td>
                        <td style="padding: 8px; text-align: right;">₱${orderData.items_total}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; color: #777;">VAT (12%)</td>
                        <td style="padding: 8px; text-align: right; color: #777;">₱${orderData.vat_amount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; color: #777;">Service Charge (10%)</td>
                        <td style="padding: 8px; text-align: right; color: #777;">₱${orderData.service_charge_amount}</td>
                    </tr>
                    <tr>
                        <td style="padding: 15px 8px; font-size: 18px; font-weight: bold;">TOTAL PAID</td>
                        <td style="padding: 15px 8px; font-size: 18px; font-weight: bold; text-align: right;">₱${orderData.total_amount}</td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 12px; color: #999;">If you have questions, reply to this email.</p>
        </div>
    `;

    // 3. Send the email
    await transporter.sendMail({
        from: '"My Restaurant" <your-email@gmail.com>',
        to: clientEmail,
        subject: `Receipt for Order #${orderId}`,
        html: emailHtml
    });
};