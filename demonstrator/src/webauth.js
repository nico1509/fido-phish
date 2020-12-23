const btn_webauth_register = document.getElementById('btn_webauth_register')
const btn_webauth_get = document.getElementById('btn_webauth_get')

let _keyId = '';


btn_webauth_get.addEventListener('click', async (e) => {

    if (_keyId === '') {
        writeToLogSection('Key is not registered', 'error');
        return;
    }

    writeToLogSection('Request Key Authentication...');

    navigator.credentials.get({
        publicKey: {
            allowCredentials: [
                {
                    id: _keyId,
                    type: "public-key"
                }
            ],
            challenge: Uint8Array.from("Brz9Cf+1VITbPF20TGkK8k5EfHH6OjTHRbSu8O5kulI=", c => c.charCodeAt(0)),
            timeout: 5000,
            userVerification: "discouraged",
        }
    })
        .then((v) => {
            console.log(v)
            writeToLogSection('Key authenticated', 'success');
        })
        .catch((e) => {
            console.error(e)
            writeToLogSection('Cannot authenticate: ' + e, 'error');
        });

})

btn_webauth_register.addEventListener('click', async (e) => {
    let request = {
        "publicKey": {
            "attestation": "direct",
            "authenticatorSelection": {
                "requireResidentKey": false,
                "userVerification": "discouraged"
            },
            "challenge": Uint8Array.from("Brz9Cf+1VITbPF20TGkK8k5EfHH6OjTHRbSu8O5kulI=", c => c.charCodeAt(0)),
            "excludeCredentials": [],
            "pubKeyCredParams": [
                {
                    "alg": -7,
                    "type": "public-key"
                },
                {
                    "alg": -257,
                    "type": "public-key"
                }
            ],
            "rp": {
                "id": "nico-assfalg.de",
                "name": "NicoDemo"
            },
            "timeout": 90000,
            "user": {
                "displayName": "Yubico demo user",
                "id": Uint8Array.from("zLupZW9EpBQ/lHmOhdz1G0HmExpaYmP0c7g9b51sa+E=", c => c.charCodeAt(0)),
                "name": "Yubico demo user"
            }
        }
    }

    writeToLogSection('Request Key Registration...');

    try {
        let response = await navigator.credentials.create(request);
        _keyId = response.rawId;
        console.log(_keyId);
        writeToLogSection('Key registered, ID: ' + response.id, 'success');
    } catch (e) {
        writeToLogSection('Cannot register key: ' + e, 'error');
    }

});
