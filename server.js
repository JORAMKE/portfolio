const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 5500;

// Enable CORS
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post('/submit-form', upload.single('cv'), (req, res) => {
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

  // Email to the recipient (your email)
  const mailOptionsToRecipient = {
    from: process.env.EMAIL_USER,
    to: 'jorammusau25@gmail.com',  // Replace with your email address
    subject: 'New Contact Form Submission',
    text: `Name: ${fullname}\nEmail: ${email}\nMessage: ${message}`,
    attachments: cvPath ? [{ path: cvPath }] : []
  };

  // Email to the user (confirmation email)
  const mailOptionsToUser = {
    from: process.env.EMAIL_USER,
    to: email,  // User's email address from the form
    subject: 'Thank you for your submission',
    text: `Dear ${fullname},\n\nThank you for reaching out. We have received your message and will get back to you shortly.\n\nBest regards,\nJoram Musau,\nSoftware Developer.`
  };

  // Send email to the recipient
  transporter.sendMail(mailOptionsToRecipient, (error, info) => {
    if (error) {
      console.error('Error sending email to recipient:', error);
      return res.status(500).send('Error sending email to recipient');
    }
    console.log('Email sent to recipient:', info.response);

    // Send confirmation email to the user
    transporter.sendMail(mailOptionsToUser, (error, info) => {
      if (error) {
        console.error('Error sending confirmation email to user:', error);
        return res.status(500).send('Error sending confirmation email to user');
      }
      console.log('Confirmation email sent to user:', info.response);
      res.status(200).send({ success: 'Email sent successfully!' });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});