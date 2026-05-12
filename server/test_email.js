const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { 
        user: 'aaswin43554@gmail.com', 
        pass: 'svzl rilo qxsq rpxi'.replace(/\s/g, '') 
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Email Auth Error:", error.message);
  } else {
    console.log("✅ SUCCESS! Server is ready to take our messages");
    
    // Test sending an email
    transporter.sendMail({
        from: '"Soil Monitor" <aaswin43554@gmail.com>',
        to: 'aaswin43554@gmail.com',
        subject: 'Test Email',
        text: 'If you get this, your Render credentials are 100% correct!'
    }).then(() => console.log("Test email sent!")).catch(console.error);
  }
});
