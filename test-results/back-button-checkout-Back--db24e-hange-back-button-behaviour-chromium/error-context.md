# Page snapshot

```yaml
- main [ref=e2]:
  - heading "Checkout" [level=1] [ref=e3]
  - region "Order summary" [ref=e4]:
    - heading "Order summary" [level=2] [ref=e5]
    - generic [ref=e6]:
      - list [ref=e7]:
        - listitem [ref=e8]:
          - generic [ref=e9]: Chamomile
          - generic [ref=e10]: 2 × 4.50
          - generic [ref=e11]: "9.00"
        - listitem [ref=e12]:
          - generic [ref=e13]: Peppermint
          - generic [ref=e14]: 1 × 3.50
          - generic [ref=e15]: "3.50"
      - paragraph [ref=e16]:
        - text: "Total:"
        - strong [ref=e17]: "12.50"
    - paragraph [ref=e18]: "You will be redirected to PayPal to complete payment (currency: AUD)."
  - button "Pay with PayPal" [ref=e21] [cursor=pointer]
```