import * as openpgp from 'openpgp';

// Toggle: set ENCRYPT_EMAILS=false in Vercel env vars to disable encryption
const ENCRYPT = process.env.ENCRYPT_EMAILS !== 'false';

// Your PGP public key. Generate with:
//   gpg --full-generate-key
//   gpg --armor --export your@email.com
// Paste the output (including the header/footer lines) here.
const PUBLIC_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
=FrJy
-----END PGP PUBLIC KEY BLOCK-----`;

async function encryptText(plaintext) {
  const publicKey = await openpgp.readKey({ armoredKey: PUBLIC_KEY });
  return openpgp.encrypt({
    message: await openpgp.createMessage({ text: plaintext }),
    encryptionKeys: publicKey,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const plaintext = `From: ${name} <${email}>\nCompany: ${company || '—'}\n\n${message}`;

  let body;
  if (ENCRYPT) {
    try {
      body = await encryptText(plaintext);
    } catch (err) {
      console.error('Encryption error:', err);
      return res.status(500).json({ error: 'Encryption failed' });
    }
  } else {
    body = plaintext;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Change to e.g. "noreply@tenetindustries.com" after verifying your domain in Resend
      from: 'Tenet Contact Form <noreply@tenetindustries.com>',
      to: ['founders@tenetindustries.com'],
      reply_to: email,
      subject: subject ? `[Contact] ${subject}` : `[Contact] Message from ${name}`,
      text: body,
    }),
  });

  if (!response.ok) {
    const resBody = await response.json().catch(() => ({}));
    console.error('Resend error:', resBody);
    return res.status(500).json({ error: 'Failed to send message' });
  }

  return res.status(200).json({ success: true });
}
