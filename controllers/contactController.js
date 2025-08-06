// controllers/contactController.js
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

exports.getContactForm = (req, res) => {
  res.render('contact', { user: req.session.user });
};

exports.submitContactForm = async (req, res) => {
  const { name, email, message } = req.body;

  const contact = new Contact({ name, email, message });
  await contact.save();

  // Email admin
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.ADMIN_EMAIL,
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.render('contact', { user: req.session.user, success: 'Message sent!' });
  } catch (err) {
    console.error(err);
    res.render('contact', { user: req.session.user, error: 'Failed to send message.' });
  }
};
