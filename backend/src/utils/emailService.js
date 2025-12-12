import nodemailer from 'nodemailer';

// 1. Configure the transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  // This MUST be the 16-char App Password
    },
    tls: {
        rejectUnauthorized: false // Fixes the "ETIMEDOUT" or connection issues on Render
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
        from: '"The Celestia Hotel" <hotel.thecelestia@gmail.com>', // ✅ FIXED THIS
        to: clientEmail,
        subject: `Receipt for Order #${orderId}`,
        html: emailHtml
    });
};