# Two templates to create in WhatsApp Manager

**Nothing existing gets touched.** Do not open Edit on `order_confirmation`, `ecom_*` or
`otp_verification` — editing sends a template back for review and would break whatever your CRM
uses it for. We're only adding new ones, prefixed `site_` so it's obvious they belong to the website.

Go to **WhatsApp Manager → Message templates → Create template**.

For each one: choose category **Utility** (not Marketing — Marketing costs more and some people have
those muted, so order alerts can silently fail to arrive), language **English**, and paste the body
below.

Where you see `{{1}}`, use the **Add variable** button rather than typing the braces by hand — Meta
numbers them for you. Then fill in the sample values so the review team can see what it looks like.

---

## Template 1 — `rf_site_new_order`

Goes to the boutique. Category **Utility**.

**Body:**

```
New order received on quppayam.com

Order: #{{1}}
Customer: {{2}}
Phone: {{3}}

Items: {{4}}
Total: {{5}}

Deliver to: {{6}}

Measurements: {{7}}

Open the admin panel to confirm and pack this order.
```

**Sample values** (paste these into the sample boxes):

| Variable | Sample |
| --- | --- |
| {{1}} | `1042` |
| {{2}} | `Anjali Sureshkumar` |
| {{3}} | `+91 98470 12345` |
| {{4}} | `Sarika Silk Saree — Size M × 1` |
| {{5}} | `₹5,000` |
| {{6}} | `12 Vivekananda Road, Adimali, Kerala — 685561` |
| {{7}} | `Sarika Silk Saree: M — Bust 38" · Waist 32" · Length 42"` |

---

## Template 2 — `rf_site_order_confirmed`

Goes to the customer. Category **Utility**.

**Body:**

```
Hi {{1}}, thank you for shopping with Quppayam Boutique.

Your order #{{2}} is confirmed. Total: {{3}}

We will message you again as soon as it ships. For custom stitching, reply to this message with your measurements.
```

**Sample values:**

| Variable | Sample |
| --- | --- |
| {{1}} | `Anjali` |
| {{2}} | `1042` |
| {{3}} | `₹5,000` |

---

## Then add the credentials

On the server:

```bash
cd /var/www/quppayam-next/quppayam
nano .env
```

Add these lines:

```env
WHATSAPP_TOKEN=EAAG...permanent-token...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ADMIN_NUMBERS=919746386125
WHATSAPP_TEMPLATE_ADMIN=rf_site_new_order
WHATSAPP_TEMPLATE_CUSTOMER=rf_site_order_confirmed
WHATSAPP_TEMPLATE_LANG=en
NEXT_PUBLIC_SITE_URL=https://quppayam.com
```

`WHATSAPP_ADMIN_NUMBERS` takes a comma-separated list — add the stitching unit's number too if they
should see every order.

Save with `Ctrl+O`, `Enter`, `Ctrl+X`, then:

```bash
pm2 restart quppayam-next --update-env
```

The `--update-env` matters. Without it pm2 keeps the old environment and ignores the new lines.

---

## Getting it wrong is cheap, but here's what to check

Watch the log while a test order goes through:

```bash
pm2 logs quppayam-next --lines 50
```

| What you see | What it means |
| --- | --- |
| `[whatsapp:mock]` | Credentials not being read. Check `.env` and that you restarted with `--update-env`. |
| `132000` / "number of parameters does not match" | The template body doesn't have exactly 7 (or 3) variables. Count them. |
| `132001` / "template name does not exist" | Name or language code is wrong. If the template shows as `en_US` in Meta, set `WHATSAPP_TEMPLATE_LANG=en_US`. |
| `401` | Token wrong or expired. Make sure it's a permanent System User token, not the 24-hour one. |
| No error, no message | Recipient may have blocked the business number, or the number in `WHATSAPP_ADMIN_NUMBERS` is missing its country code. |

**The language code catches almost everyone.** In WhatsApp Manager the template list shows
"English", but the underlying code is either `en`, `en_US` or `en_GB`. If you get error 132001 and
the name is definitely right, that's what it is.

---

## If you ever change a template's wording

Adding or removing a `{{n}}` means the code has to change too — it sends exactly 7 values for
`rf_site_new_order` and 3 for `rf_site_order_confirmed`. Changing the wording *around* the variables is
free; changing the *number* of variables is not. Tell me and it's a one-line fix.
