const cbor = require('cbor')
const crypto = require('crypto')

const FIDO_CBOR = '90'
const FIDO_ASSERT = '02'

/**
 * @param {string} channel - e.g. ffffffff
 * @param {any} clientData - client data object
 * @param {string} publicKey - base64 key id
 * 
 * @returns {string[]} Request as continuation packets
 */
module.exports.buildAuthRequest = (channel, clientData, publicKey) => {
    const clientDataJson = JSON.stringify(clientData)
    const clientDataHash = crypto.createHash('sha256')
        .update(clientDataJson)
        .digest('hex')

    const publicKeyHex = Buffer.from(publicKey, 'base64')
        .toString('hex')

    const requestMap = new Map()
        .set(1, 'demo.yubico.com')
        .set(2, Buffer.from(clientDataHash, 'hex'))
        .set(3, [
            {
                id: Buffer.from(publicKeyHex, 'hex'),
                type: 'public-key'
            }
        ])
        .set(5, {
            up: true
        })

    const requestCbor = FIDO_ASSERT + cbor.encode(requestMap).toString('hex')

    const requestLength = requestCbor.length / 2
    const requestLengthHex = '00' + requestLength.toString(16)

    const fullRequest = channel + FIDO_CBOR + requestLengthHex + requestCbor

    return [
        fullRequest.slice(0, 64 * 2),
        channel + '00' + fullRequest.slice(64 * 2, 123 * 2),
        channel + '01' + fullRequest.slice(123 * 2) + '00'.repeat((fullRequest.length / 2) - (2*64))
    ]
}

/**
 * @param {string} fullResponse
 * 
 * @returns credentialId, authenticatorData, signature as base64
 */
module.exports.readAuthResponse = (fullResponse) => {
    const responseCbor = fullResponse.slice(16)
        .replace(/(00)+$/g, '')
    /** @type {Map} */
    const responseMap = cbor.decode(responseCbor)

    const credentialIdHex = responseMap.get(1).id
    const authenticatorDataHex = responseMap.get(2)
    const signatureHex = responseMap.get(3)

    return {
        credentialId: Buffer.from(credentialIdHex, 'hex').toString('base64'),
        authenticatorData: Buffer.from(authenticatorDataHex, 'hex').toString('base64'),
        signature: Buffer.from(signatureHex, 'hex').toString('base64')
    }
}
