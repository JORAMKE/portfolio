const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 5500;

// Enable CORS
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only PDF, DOC, and DOCX are allowed.'));
  }
};

// Set file size limit (e.g., 5MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

app.post('/submit-form', upload.single('cv'), (req, res) => {
  try {
    const { fullname, email, message } = req.body;
    const cvPath = req.file ? req.file.path : null;

    console.log('Form submission received:', { fullname, email, message, cvPath });

    // Send email using nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptionsToRecipient = {
      from: process.env.EMAIL_USER,
      to: 'jorammusau25@gmail.com', // Replace with your email address
      subject: 'New Contact Form Submission',
      text: `Name: ${fullname}\nEmail: ${email}\nMessage: ${message}`,
      attachments: cvPath ? [{ path: cvPath }] : []
    };

    const mailOptionsToUser = {
      from: process.env.EMAIL_USER,
      to: email, // User's email address from the form
      subject: 'Thank you for your submission',
      text: `Dear ${fullname},\n\nThank you for reaching out. We have received your message and will get back to you shortly.\n\nBest regards,\nJoram Musau,\nSoftware Developer.`
    };

    // Send email to the recipient
    transporter.sendMail(mailOptionsToRecipient, (error, info) => {
      if (error) {
        console.error('Error sending email to recipient:', error);
        return res.status(500).json({ error: 'Error sending email to recipient' });
      }
      console.log('Email sent to recipient:', info.response);

      // Send confirmation email to the user
      transporter.sendMail(mailOptionsToUser, (error, info) => {
        if (error) {
          console.error('Error sending confirmation email to user:', error);
          return res.status(500).json({ error: 'Error sending confirmation email to user' });
        }
        console.log('Confirmation email sent to user:', info.response);
        res.status(200).json({ success: 'Emails sent successfully' });
      });
    });
  } catch (error) {
    console.error('Error handling form submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});
