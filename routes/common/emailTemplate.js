import sendMail from "./emailSend.js"; // Ensure the path is correct

async function sendTemplateMessage(email, ownerName, userName, userEmail, userPhone, date) {
    const recipient = email;
    const subject = "New Booking Request";
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>New Booking Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8f9fa; color: #333;">
      <table style="width: 100%; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 5px; background-color: #ffffff; padding: 20px;">
        <tr>
          <td style="text-align: center; padding-bottom: 20px;">
            <h2 style="color: #007bff;">PG Finder</h2>
            <p style="margin: 0; color: #6c757d;">Helping you find the best PGs</p>
          </td>
        </tr>
        <tr>
          <td>
            <h4 style="color: #343a40;">New Booking Request</h4>
            <p>Dear <b>${ownerName}</b>,</p>
            <p>You have received a new booking request for your PG listing:</p>
            <table style="width: 100%; margin: 10px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;"><b>Name</b></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;"><b>Email</b></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;"><b>Phone</b></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${userPhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background-color: #f8f9fa;"><b>Requested Check-In Date</b></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
              </tr>
            </table>
            <p>Please log in to your dashboard to review and take action on this request.</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://roomiessfinder.vercel.app/auth/page/login/owner" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
                Go to Dashboard
              </a>
            </div>
            <p style="color: #6c757d;">Thank you,<br><b>PG Finder Team</b></p>
          </td>
        </tr>
        <tr>
          <td style="text-align: center; padding: 10px; background-color: #f8f9fa; font-size: 12px; color: #6c757d;">
            &copy; 2025 Roomiess-Finder. All rights reserved.
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    try {
        await sendMail(recipient, subject, htmlContent);
        console.log("Booking email sent successfully to the owner.");
    } catch (error) {
        console.error("Error while sending booking email: ", error);
    }
}

export default sendTemplateMessage;
