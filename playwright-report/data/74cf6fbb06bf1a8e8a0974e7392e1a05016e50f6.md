# Page snapshot

```yaml
- main [ref=e2]:
  - heading "Checkout" [level=1] [ref=e3]
  - region "Order summary" [ref=e4]:
    - heading "Order summary" [level=2] [ref=e5]
    - generic [ref=e6]:
      - list [ref=e7]:
        - listitem [ref=e8]:
          - generic [ref=e9]: Test Item
          - generic [ref=e10]: 2 × 4.99
          - generic [ref=e11]: "9.98"
      - paragraph [ref=e12]:
        - text: "Total:"
        - strong [ref=e13]: "9.98"
    - paragraph [ref=e14]: "You will be redirected to PayPal to complete payment (currency: AUD)."
  - button "Pay with PayPal" [ref=e17] [cursor=pointer]
```