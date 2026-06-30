# Yeehaul Quote Server

A tiny backend that receives the "Get a Quote" form from the website and emails
it (with the customer's photos attached) to your inbox using [Resend](https://resend.com).

```
book.html form ──POST──► this server (on Render) ──Resend API──► your inbox
```

---

## 1. Get a Resend API key (one time, ~2 min)

1. Sign up at https://resend.com (the free plan sends 3,000 emails/month,
   100/day — plenty for quote requests).
2. Go to **API Keys** → **Create API Key**: https://resend.com/api-keys
3. Name it `Yeehaul website`, give it **Sending access**, and **Create**.
4. Copy the key (starts with `re_`). You'll paste it into Render as
   `RESEND_API_KEY`. You can't view it again later, so keep it safe.

### About the "From" address

Resend only sends from addresses on a **verified domain**. You have two options:

- **Start fast (no domain needed):** leave `FROM_EMAIL` as
  `Yeehaul Website <onboarding@resend.dev>`. This shared sender works
  immediately, but can **only deliver to the email you signed up to Resend
  with** — so set `TO_EMAIL` to that same address.
- **Use your own domain (recommended once live):** add and verify your domain at
  https://resend.com/domains (add the DNS records they give you), then set
  `FROM_EMAIL` to something like `Yeehaul <quotes@yourdomain.com>`. Now it can
  deliver to any inbox.

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

   | Key              | Value                                                       |
   | ---------------- | ----------------------------------------------------------- |
   | `RESEND_API_KEY` | the `re_…` key from step 1                                   |
   | `FROM_EMAIL`     | `Yeehaul Website <onboarding@resend.dev>` (or your domain)  |
   | `TO_EMAIL`       | where quotes land (your Resend signup email to start)       |
   | `ALLOWED_ORIGIN` | leave blank for now; set to your domain later               |

5. Click **Create Web Service**. After it builds, Render gives you a URL like
   `https://yeehaul-quote-server.onrender.com`.

> **Free plan note:** the server "sleeps" after ~15 min idle, so the first quote
> after a quiet spell takes ~30–50 sec to go through. The form shows "Sending…"
> the whole time, so it still works — just slower on that first hit. Upgrade to a
> paid plan later if that bothers you.

---

## 3. Point the website at your server

In `book.html`, find this line near the bottom:

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

Quick smoke test without the website:

```bash
curl -F "name=Test" -F "phone=555-1212" -F "address=123 Main St" \
  http://localhost:3000/api/quote
```

You should get `{"ok":true}` and an email in your inbox.

---

## Why Resend over Gmail?

Resend is an email API built for sending app/transactional mail. Compared to the
old Gmail + app-password setup it has higher sending limits, better
deliverability (less likely to land in spam), and a dashboard showing every
email's delivery status — no Google "less secure app" hoops. The form fields and
photo attachments work exactly the same.
