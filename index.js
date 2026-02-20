require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   Google Sheets Setup
================================ */

const auth = new google.auth.GoogleAuth({
  credentials: "service-account.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const GOOGLE_SHEET_ID = "1Ag2Gh-eI_fS5lqg_2AERg2Rky3rz7iZrq9T1Wb8mEgI"

/* ===============================
   Mail Transporter
================================ */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ===============================
   API Route
================================ */

app.post("/api/book-demo", async (req, res) => {
  try {
    const data = req.body;

    console.log("Incoming Data:", data);

    /* Save to Google Sheets */
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.firstName,
            data.lastName,
            data.email,
            data.company,
            data.phone,
            data.employees,
            data.volume,
            new Date().toLocaleString(),
          ],
        ],
      },
    });

    /* Mail to Admin */
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_MAIL,
      subject: "New Demo Booking 🚀",
      html: `<h3>New Employer Demo Request</h3>`,
    });

    /* Auto Reply */
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: "Demo Scheduled — QualScore",
      html: `
        <p>Hi ${data.firstName},</p>
        <p>Thanks for scheduling a demo.</p>
      `,
    });

    res.status(200).json({ message: "Saved to Google Sheets + Mail Sent" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===============================
   Server Start
================================ */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
