# StellarAIO Websocket Server

A websocket server made for StellarAIO monitors.

![Websocket Server Diagram](https://downloads.intercomcdn.com/i/o/358650507/5736fe64720f4995529dfa68/ws-traffic.png)

## Example payload

```javascript
let productInfo = {
  site: '', // Required
  sku: '', // Required
  asin: '', // Required for the time being (same as sku)
  offerId: '', // Only required for certain sites / modes
  details: {
    region: '', // Required (USA, CA, EU, etc)
    offerId: '', // Only required for certain sites / modes
    productPrice: '', // Optional
    productTitle: '', // Optional
    productImage: '' // Optional
  }
}