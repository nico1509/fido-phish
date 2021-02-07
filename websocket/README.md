# Websocket Yubico-Login

Yubico-Demo Anfragen über eine Websocket auslösen.

## Benutzung
### lokal
- Vor dem ersten Start: `npm install`
- Zum starten: `npm start`, dann verbinden mit `ws://localhost:8081` (z.B. mit wscat)
### Web
- Verbinden mit `wss://websocket.nico-assfalg.de/ws`

## Beispielanfrage
- Mit `_action` die gewünschte Aktion angeben (`login`, `auth-begin`, `auth-finish`)
- Mit `_cookie` beliebige Cookies mitsenden (`"demo_website_session=[SESSIONID]"` notwendig für `auth-begin` und `auth-finish`)
- Restliche Parameter analog zur Yubico-Demo (siehe Protokoll) 
```jsonc
{"_action":"login", "username": "kitfido", "password": "kitfido"}
```
&rightarrow; Antwort kommt bei korrekter Anfrage direkt von Yubico (siehe Protokoll)
