let _keyId = '';

export default {
    async get() {
        if (_keyId === '') {
            return Promise.reject('Key is not registered');
        }
        
        try {
            const response = await navigator.credentials.get({
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
            });
            console.log(response)
            return Promise.resolve();
        } catch (e) {
            console.error(e)
            return Promise.reject(e);
        }
    },
    
    async register() {
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

        try {
            let response = await navigator.credentials.create(request);
            _keyId = response.rawId;
            console.log(_keyId);
            return Promise.resolve(response.id);
        } catch (e) {
            return Promise.reject(e);
        }
    },
    
};
