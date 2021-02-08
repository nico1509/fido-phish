# yubikey-webusb
Demonstrator code written for the KASTEL Security Seminar @ KIT in 2021.

We show that it was possible to phish a login with a YubiKey using WebUSB until Google denied HID access on WebUSB.
Of course, [this was not our idea](https://www.offensivecon.org/speakers/2018/markus-and-michele.html), but it was a nice challenge to reproduce it.

## Setup

1. Serve the files in `demonstrator` with a static HTTP-Server, e.g. http-server for nodejs
2. Run the app in `websocket` with `npm start` (`npm install` before first run)

## Usage
- Use an old chrome version e.g. 61 and start it as an Administrator on Windows (yeah...)
- Use a Yubico Security Key or adapt the code to a different HID-capable key
- Create an account on https://demo.yubico.com using your key as 2nd factor
- Enter your credentials on the `demonstrator` website you set up earlier and click Login
- Copy the _cookie at the end of the log and log in by pasting it into your favorite web browser on https://demo.yubico.com
