import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const {
  RESEND_API_KEY,
  TO_EMAIL,
  // The "from" address. Must be on a domain you've verified in Resend.
  // Until you verify a domain, use Resend's shared sender `onboarding@resend.dev`,
  // which can only deliver to the email you signed up to Resend with.
  FROM_EMAIL = 'Yeehaul Website <onboarding@resend.dev>',
  ALLOWED_ORIGIN,
  PORT = 3000,
} = process.env;

// Fail fast if email isn't configured — otherwise the server would start fine
// but silently fail to send every quote.
for (const key of ['RESEND_API_KEY', 'TO_EMAIL']) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();

// Lock this down to your real site in production by setting ALLOWED_ORIGIN
// (e.g. https://yeehauljunkremoval.com). If unset, all origins are allowed —
// fine for testing, but set it once you have a domain.
app.use(cors({ origin: ALLOWED_ORIGIN || true }));

// Photos arrive as multipart/form-data. Keep them in memory (we attach and
// forward them immediately, never to disk). Images only, max 5, 10 MB each.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
});

const resend = new Resend(RESEND_API_KEY);

// Escape user input before dropping it into the HTML email body.
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// The date field arrives as "YYYY-MM-DD". Show it as "June 30, 2026" instead.
// Parse the parts by hand so a timezone offset can't shift the day.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const formatDate = (s = '') => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (!m) return s; // not the expected format — leave it untouched
  const [, y, mo, d] = m;
  return `${MONTHS[Number(mo) - 1]} ${Number(d)}, ${y}`;
};

app.get('/', (req, res) => res.send('Yeehaul quote server is running.'));
app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/quote', upload.array('photos', 5), async (req, res) => {
  try {
    const { name, phone, address, date, window, details } = req.body;

    if (!name || !phone || !address) {
      return res
        .status(400)
        .json({ ok: false, error: 'Name, phone, and address are required.' });
    }

    const photos = req.files || [];
    const rows = [
      ['Name', name],
      ['Phone', phone],
      ['Pickup address', address],
      ['Preferred date', formatDate(date)],
      ['Preferred window', window],
      ['Details', details],
    ];

    const html = `
      <h2 style="font-family:sans-serif;margin:0 0 12px">New quote request</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="font-weight:700;vertical-align:top;white-space:nowrap">${esc(
                k
              )}</td><td>${esc(v) || '—'}</td></tr>`
          )
          .join('')}
      </table>
      <p style="font-family:sans-serif;font-size:13px;color:#555">${photos.length} photo(s) attached.</p>
    `;

    const text =
      rows.map(([k, v]) => `${k}: ${v || '—'}`).join('\n') +
      `\n\nPhotos attached: ${photos.length}`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `New quote request — ${name}`,
      text,
      html,
      attachments: photos.map((f) => ({
        filename: f.originalname,
        content: f.buffer,
      })),
    });

    if (error) {
      throw new Error(error.message || 'Resend rejected the email.');
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Quote send failed:', err);
    res.status(500).json({
      ok: false,
      error: 'Could not send your request. Please call us instead.',
    });
  }
});

// Catches multer limit/file-type errors and anything else thrown above.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ ok: false, error: err.message || 'Upload error.' });
});

app.listen(PORT, () => console.log(`Yeehaul quote server listening on port ${PORT}`));
