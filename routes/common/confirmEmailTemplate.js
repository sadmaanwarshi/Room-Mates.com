import sendMail from "./emailSend.js";

async function sendBookingConfirmation(email, userName, pgName, bookingReference, checkInDate, ownerName, ownerPhone) {
    const recipient = email;
    const subject = "Booking Confirmation - PG Finder";
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Booking Confirmation</title>
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
                color: #28a745;
            }
            .header p {
                margin: 0;
                color: #6c757d;
            }
            .content h4 {
                color: #343a40;
            }
            .details-table td {
                padding: 8px;
                border: 1px solid #ddd;
                background-color: #f8f9fa;
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
                background-color: #28a745;
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
                    <h2>Booking Confirmed!</h2>
                    <p>Your stay is confirmed with PG Finder</p>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <h4>Dear ${userName},</h4>
                    <p>We are pleased to inform you that your booking request for the PG <b>${pgName}</b> has been accepted. Below are your booking details:</p>
                    <table class="details-table" style="width: 100%; margin: 10px 0; border-collapse: collapse;">
                        <tr>
                            <td><b>Booking Reference</b></td>
                            <td>${bookingReference}</td>
                        </tr>
                        <tr>
                            <td><b>Check-In Date</b></td>
                            <td>${checkInDate}</td>
                        </tr>
                        <tr>
                            <td><b>PG Name</b></td>
                            <td>${pgName}</td>
                        </tr>
                        <tr>
                            <td><b>Owner Name</b></td>
                            <td>${ownerName}</td>
                        </tr>
                        <tr>
                            <td><b>Owner Contact</b></td>
                            <td>${ownerPhone}</td>
                        </tr>
                    </table>
                    <p>Please keep this reference number safe as it will be required for check-in and future communications.</p>
                    <div class="cta-button">
                        <a href="https://yourwebsite.com/mybookings">View My Bookings</a>
                    </div>
                    <p style="color: #6c757d;">Thank you for choosing PG Finder! We hope you have a pleasant stay.</p>
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
        console.log("Booking confirmation email sent successfully to the user.");
    } catch (error) {
        console.error("Error while sending booking confirmation email: ", error);
    }
}

export default sendBookingConfirmation;
