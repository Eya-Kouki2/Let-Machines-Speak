async function sendPasswordResetEmail(user, temporaryPassword) {
  const serviceId = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS credentials are missing. Temporary password email was not sent. Configure EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY.');
    return false;
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: user.email,
      to_name: user.firstName || user.name || 'LABES User',
      temporary_password: temporaryPassword,
      app_name: 'LABES',
    },
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`EmailJS request failed: ${response.status} ${errorBody}`);
  }

  return true;
}

module.exports = {
  sendPasswordResetEmail,
};
