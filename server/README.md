# Yeehaul Quote Server

A tiny backend that receives the "Get a Quote" form from the website and emails
it (with the customer's photos attached) to your inbox using Gmail.

```
book.html form ──POST──► this server (on Render) ──email──► your Gmail inbox
```

---

## 1. Get a Gmail App Password (one time, ~2 min)

Gmail won't let an app log in with your normal password, so you make a special
16-character one:

1. Turn on **2-Step Verification**: https://myaccount.google.com/security
2. Go to **App passwords**: https://myaccount.google.com/apppasswords
3. Type a name like `Yeehaul website` and click **Create**.
4. Copy the 16-character code (looks like `abcd efgh ijkl mnop`). **Remove the
   spaces** when you paste it later → `abcdefghijklmnop`.

Keep this somewhere safe — you'll paste it into Render as `EMAIL_PASS`.

---

## 2. Deploy to Render

Your code needs to be pushed to GitHub first (Render deploys from a repo).

1. Go to https://dashboard.render.com → **New +** → **Web Service**.
2. Connect this GitHub repo.
3. Render should auto-detect the settings from `render.yaml`. If it asks, use:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. Open the **Environment** tab and add these variables:

   | Key             | Value                                                |
   | --------------- | ---------------------------------------------------- |
   | `EMAIL_USER`    | `yeehauljunkremoval26@gmail.com`                     |
   | `EMAIL_PASS`    | the 16-char app password from step 1 (no spaces)     |
   | `TO_EMAIL`      | `yeehauljunkremoval26@gmail.com`                     |
   | `ALLOWED_ORIGIN`| leave blank for now; set to your domain later        |

5. Click **Create Web Service**. After it builds, Render gives you a URL like
   `https://yeehaul-quote-server.onrender.com`.

> **Free plan note:** the server "sleeps" after ~15 min idle, so the first quote
> after a quiet spell takes ~30–50 sec to go through. The form shows "Sending…"
> the whole time, so it still works — just slower on that first hit. Upgrade to a
> paid plan later if that bothers you.

---

## 3. Point the website at your server

In `Design 1 - Warm/book.html`, find this line near the bottom:

```js
const QUOTE_ENDPOINT = 'https://YOUR-SERVICE.onrender.com/api/quote';
```

Replace it with your real Render URL, keeping `/api/quote` on the end:

```js
const QUOTE_ENDPOINT = 'https://yeehaul-quote-server.onrender.com/api/quote';
```

Then send a test quote through the live form and check your inbox.

---

## Running it locally (optional)

```bash
cd server
npm install
cp .env.example .env     # then fill in your real values in .env
npm run dev
```

The server runs at http://localhost:3000. Set `QUOTE_ENDPOINT` in `book.html` to
`http://localhost:3000/api/quote` while testing locally.

---

## Switching to SendGrid / Resend later

Gmail is fine to start, but caps at ~500 emails/day and can occasionally land in
spam. To switch, you'd replace the `nodemailer.createTransport({ service: 'gmail', ... })`
block in `index.js` with that provider's SMTP/API settings and swap the env vars.
The rest of the code (photos, fields) stays the same.
