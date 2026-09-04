# Resend email setup

The backend sends transactional email through Resend. Email content is rendered
by the application, so there are no provider-side template IDs to migrate or
maintain.

## What you need from Resend

1. Add and verify a sending domain in Resend. Publish the DNS records Resend
   provides and wait for the domain to show as verified.
2. Create an API key with sending access.
3. Choose a sender on the verified domain, for example
   `Medusa B2B <noreply@example.com>`.

Set these values locally in `backend/.env` and in every deployed backend
environment:

```dotenv
RESEND_API_KEY=re_...
RESEND_FROM=Medusa B2B <noreply@example.com>
# Optional; defaults to the sender when omitted.
RESEND_REPLY_TO=support@example.com
MEDUSA_BACKEND_URL=https://api.example.com
MEDUSA_STOREFRONT_URL=https://www.example.com
```

`MEDUSA_BACKEND_URL` and `MEDUSA_STOREFRONT_URL` must be public URLs for the
matching environment. They are used to build links in transactional messages.
Do not expose `RESEND_API_KEY` to the storefront or any variable prefixed with
`NEXT_PUBLIC_`.

Order confirmations, welcome messages, and approval messages also support the
optional `EMAIL_ORDER_BCC`, `EMAIL_WELCOME_BCC`, and `EMAIL_APPROVAL_BCC`
variables. Each accepts a comma-separated list of email addresses; set a value
to an empty string to disable that BCC list. The application defaults preserve
the existing recipients: order and welcome messages BCC `info@bntbng.com` and
`bntwarehouse@rogers.com`, while approval messages BCC only `info@bntbng.com`.

## Cutover checklist

1. Keep the current SendGrid configuration available during the initial Resend
   deployment so rollback remains possible.
2. Deploy the backend with the Resend variables above.
3. Exercise welcome, company approval, order confirmation, shipment,
   password-reset, payment-reminder, and invoice messages in a non-production
   environment. Confirm links, recipient addresses, and reply behavior.
4. Check Resend delivery events for rejects or bounces, then perform a small
   production smoke test.
5. After the cutover is stable, revoke the SendGrid API key and remove the old
   `SENDGRID_*` variables from local and hosted environments.

For production deliverability, publish a DMARC policy for the sending domain
and use a monitored reply-to or support address where customers may respond.
