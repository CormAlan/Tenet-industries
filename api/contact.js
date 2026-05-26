export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Change to e.g. "noreply@tenetindustries.com" after verifying your domain in Resend
      from: 'Tenet Contact Form <onboarding@resend.dev>',
      to: ['founders@tenetindustries.com'],
      reply_to: email,
      subject: subject ? `[Contact] ${subject}` : `[Contact] Message from ${name}`,
      text: `From: ${name} <${email}>\nCompany: ${company || '—'}\n\n${message}`,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.error('Resend error:', body);
    return res.status(500).json({ error: 'Failed to send message' });
  }

  return res.status(200).json({ success: true });
}
