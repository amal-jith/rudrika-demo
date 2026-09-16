# WhatsApp order notifications — setup

When an order is confirmed the site sends two WhatsApp messages:

| To | Contains |
| --- | --- |
| The boutique | Order number, customer name and phone, every item with size and quantity, total, full delivery address |
| The customer | A short confirmation with the order number and total |

A third message goes to the customer the first time an order is marked **SHIPPED** in the admin panel.

**Until credentials are added nothing is sent** — the messages are written to the server log instead, so
you can see exactly what would have gone out. Orders are never blocked by a messaging failure.

---

## 1. Create the Meta app (about 20 minutes)

1. Go to <https://developers.facebook.com> → **My Apps** → **Create App** → type **Business**.
2. In the app dashboard add the **WhatsApp** product.
3. Under **WhatsApp → API Setup** you'll see:
   - **Phone number ID** — a long number. This is `WHATSAPP_PHONE_NUMBER_ID`. It is *not* the phone number.
   - **Temporary access token** — valid 24 hours, fine for testing.
4. Add the boutique's number under **Add phone number** and verify it by OTP.

> The number must not be registered on the normal WhatsApp or WhatsApp Business app.
> If +91 97463 86125 is currently in use there, either delete that account first or use a separate SIM for the API.

## 2. Get a permanent token

Temporary tokens expire daily. For a live shop:

1. **Business Settings → Users → System Users** → add a system user with the **Admin** role.
2. **Add Assets** → your app → enable **Manage app**.
3. **Generate New Token** → select the app → tick `whatsapp_business_messaging` and `whatsapp_business_management`.
4. Choose **Never** for expiry. Copy the token — it is shown only once. This is `WHATSAPP_TOKEN`.

## 3. Submit the message templates

Meta requires an approved template for any message a business starts. Under
**WhatsApp Manager → Message templates → Create template**, add these three. Approval usually takes a few minutes to a few hours.

### Template 1 — `quppayam_new_order`
Category: **Utility** · Language: **English**

```
New order #{{1}} received.

Customer: {{2}}
Total: {{3}}
Items: {{4}}
Phone: {{5}}
Deliver to: {{6}}

Open the admin panel to confirm and pack.
```

### Template 2 — `quppayam_order_confirmed`
Category: **Utility** · Language: **English**

```
Hi {{1}}, thank you for shopping with Quppayam Boutique.

Your order #{{2}} is confirmed. Total: {{3}}

We will message you again the moment it ships. For custom stitching, reply here with your measurements.
```

### Template 3 — `quppayam_order_shipped`
Category: **Utility** · Language: **English**

```
Good news {{1}}! Your Quppayam order #{{2}} has shipped.

Sign in to your account on our website to track it.
```

Tips that avoid rejection: keep the category **Utility** (not Marketing), don't start or end the body with a
variable, and don't add promotional wording.

## 4. Add the credentials on the server

SSH in, then from the app folder open the environment file:

```bash
cd /var/www/quppayam-next/quppayam
nano .env
```

Add:

```env
WHATSAPP_TOKEN=EAAG...your-permanent-token...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ADMIN_NUMBERS=919746386125,918281438152
WHATSAPP_TEMPLATE_ADMIN=quppayam_new_order
WHATSAPP_TEMPLATE_CUSTOMER=quppayam_order_confirmed
WHATSAPP_TEMPLATE_SHIPPED=quppayam_order_shipped
WHATSAPP_TEMPLATE_LANG=en
NEXT_PUBLIC_SITE_URL=https://quppayam.com
```

`WHATSAPP_ADMIN_NUMBERS` takes a comma-separated list — add as many staff numbers as you like.
Numbers may be written any way (`+91 97463 86125`, `9746386125`, `09746386125`); they are normalised
automatically. Save with `Ctrl+O`, `Enter`, then `Ctrl+X`.

Restart:

```bash
pm2 restart quppayam-next --update-env
```

The `--update-env` matters — without it pm2 keeps the old environment and the new keys are ignored.

## 5. Test

Place a real ₹1 order, or watch the log while a test order goes through:

```bash
pm2 logs quppayam-next --lines 50
```

- `[whatsapp:mock]` means the credentials aren't being read — check the `.env` and that you restarted with `--update-env`.
- `WhatsApp API 400` with `template name does not exist` means the template name or language code doesn't match.
- `WhatsApp API 401` means the token is wrong or has expired.
- No error and no message received: check the recipient hasn't blocked the business number, and that the
  number in `WHATSAPP_ADMIN_NUMBERS` includes the country code.

## Costs

Meta gives 1,000 free service conversations per month. Beyond that, utility conversations in India are
priced per 24-hour conversation window — currently well under ₹1 each. A shop doing a few hundred orders a
month will typically stay inside the free tier or spend very little.

## If you'd rather not wait for approval

Leave `WHATSAPP_TEMPLATE_ADMIN` and `WHATSAPP_TEMPLATE_CUSTOMER` blank. The site then sends plain text
messages, which WhatsApp only delivers to people who have messaged your business number in the last 24
hours. Useful for testing; not enough for live customers.
