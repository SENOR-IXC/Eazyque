# Page snapshot

```yaml
- alert
- heading "EazyQue" [level=1]
- paragraph: Sign in to your retail dashboard
- text: Email Address
- textbox "Email Address"
- text: Password
- textbox "Password"
- button "Sign In"
- text: Demo Accounts
- button "Admin Account admin@eazyque.com ADMIN":
  - paragraph: Admin Account
  - paragraph: admin@eazyque.com
  - text: ADMIN
- button "Shop Owner owner@demoshop.com OWNER":
  - paragraph: Shop Owner
  - paragraph: owner@demoshop.com
  - text: OWNER
- button "Cashier cashier@demoshop.com CASHIER":
  - paragraph: Cashier
  - paragraph: cashier@demoshop.com
  - text: CASHIER
- paragraph:
  - text: Need help? Contact support at
  - link "support@eazyque.com":
    - /url: mailto:support@eazyque.com
- link "← Back to Home":
  - /url: /
```