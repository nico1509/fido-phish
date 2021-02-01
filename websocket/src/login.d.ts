type ResponseStatus = 'success' | 'error'

interface WebauthCredential {
    "id": string,
    "type": string
}

interface YubicoResponse {
    data: any,
    status: ResponseStatus
}

interface YubicoUser {
    "authenticators": string[],
    "disabled": boolean,
    "displayName": string,
    "username": string,
    "uuid": string,
}

interface LoginRequest {
    "username": string,
    "password": string,
    "namespace": string,
}

interface LoginResponse extends YubicoResponse {
    "data": {
        "user": YubicoUser,
    },
}

interface AuthBeginRequest {
    "uuid": string,
    "namespace": string,
}

interface AuthBeginResponse {
    "data": {
        "publicKey": {
            "allowCredentials": WebauthCredential[],
            "challenge": string,
            "rpId": string,
            "timeout": number,
            "userVerification": string
        },
        "requestId": string
    },
}

interface AuthFinishRequest {
    "requestId": string,
    "assertion": {
        "credentialId": string,
        "authenticatorData": string,
        "clientDataJSON": string,
        "signature": string,
    },
    "uuid": string,
    "namespace": string,
}

interface AuthFinishResponse {
    "data": {
        "authenticatorAttachment": string,
        "deviceId": string,
        "user": YubicoUser,
    },
}
