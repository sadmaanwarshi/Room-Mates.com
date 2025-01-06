import sendMail from "./emailSend.js";

async function sendBookingRejection(email, userName, pgName, rejectionReason) {
    const recipient = email;
    const subject = "Booking Request Rejected - PG Finder";
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Booking Request Rejected</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f8f9fa;
                color: #333;
            }
            table {
                width: 100%;
                max-width: 600px;
                margin: 20px auto;
                border: 1px solid #ddd;
                border-radius: 5px;
                background-color: #ffffff;
                padding: 20px;
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
            }
            .header h2 {
                color: #dc3545;
            }
            .header p {
                margin: 0;
                color: #6c757d;
            }
            .content h4 {
                color: #343a40;
            }
            .cta-button {
                text-align: center;
                margin: 20px 0;
            }
            .cta-button a {
                display: inline-block;
                padding: 10px 20px;
                font-size: 16px;
                color: #fff;
                background-color: #007bff;
                text-decoration: none;
                border-radius: 5px;
            }
            .footer {
                text-align: center;
                padding: 10px;
                background-color: #f8f9fa;
                font-size: 12px;
                color: #6c757d;
            }
        </style>
    </head>
    <body>
        <table>
            <tr>
                <td class="header">
                    <h2>Booking Rejected</h2>
                    <p>We regret to inform you</p>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <h4>Dear ${userName},</h4>
                    <p>Unfortunately, your booking request for the PG <b>${pgName}</b> could not be accepted. Below is the reason provided:</p>
                    <blockquote style="background-color: #f8f9fa; padding: 10px; border-left: 5px solid #dc3545; color: #6c757d;">
                        ${rejectionReason}
                    </blockquote>
                    <p>We understand this may be disappointing, but we encourage you to explore other PGs available on our platform.</p>
                    <div class="cta-button">
                        <a href="https://yourwebsite.com/search" style="background-color: #007bff;">Explore Other PGs</a>
                    </div>
                    <p style="color: #6c757d;">Thank you for using PG Finder. We hope to assist you in finding the perfect accommodation.</p>
                </td>
            </tr>
            <tr>
                <td class="footer">
                    &copy; 2024 PG Finder. All rights reserved.
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        await sendMail(recipient, subject, htmlContent);
        console.log("Booking rejection email sent successfully to the user.");
    } catch (error) {
        console.error("Error while sending booking rejection email: ", error);
    }
}

export default sendBookingRejection;
