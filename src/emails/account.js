const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'test@gmail.com',
    subject: 'Thanks for joining',
    text: `Welcome to the app, ${name}.`,
  });
};

module.exports = {
  sendWelcomeEmail,
};
