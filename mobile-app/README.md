# Finding Moto Buyer Mobile App

This is the buyer-only Expo mobile app. It connects to the same centralized backend used by the management web app.

## Run

```powershell
npm install
npm start
```

## Backend URL

Set the API URL in `app.json` under `expo.extra.apiUrl`.

For Android emulator, use `http://10.0.2.2:5000/api` instead of `http://127.0.0.1:5000/api`.

## Role separation

- Buyer uses this mobile app.
- Seller, mechanic, delivery agent, and admin use the `frontend` web app.
