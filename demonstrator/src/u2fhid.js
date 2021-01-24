import util from './util.js'

const HEX_U2F_INIT = nonce => 'ffffffff' + '86' + '0008' + nonce + '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
const HEX_U2F_MSG_AUTHENTICATE = (channel, challengeHash, applicationHash, keyHandleLength, keyHandle) => channel + '83' + '0042' + '00' + '02' + '0300' + '03' + challengeHash + applicationHash + keyHandleLength + keyHandle + '4a'
const HEX_U2F_MSG_REGISTER = (channel, challengeHash, applicationHash) => channel + '83' + '0040' + '00' + '01' + '0000' + challengeHash + applicationHash + '4a'

const CHALLENGE = '{"typ":"navigator.id.getAssertion","challenge":"Brz9Cf+1VITbPF20TGkK8k5EfHH6OjTHRbSu8O5kulI=","origin":"nico-assfalg.de"}'
const APPLICATION = 'https://nico-assfalg.de'

export default {
    /**
     * @param {USBDevice} device 
     * @returns {Promise<string>} channel
     */
    async u2f_init(device) {
        const initResponse = await this.talkToDevice(device, HEX_U2F_INIT('ddf69cc410cd664e'))
        const channel = initResponse.substr(30, 8)
        return channel
    },

    /**
     * @param {USBDevice} device 
     */
    async u2f_msg_register(device) {
        const channel = await this.u2f_init(device)
        console.log(channel)

        const challengeHash = await util.string2SHA_256(CHALLENGE)
        const applicationHash = await util.string2SHA_256(APPLICATION)
        const registerResponse = await this.talkToDevice(device, HEX_U2F_MSG_REGISTER(channel, challengeHash, applicationHash))

        return Promise.resolve(registerResponse)
    },

    /**
     * @param {USBDevice} device 
     */
    async u2f_msg_authenticate(device) {
        const channel = await this.u2f_init(device)
        console.log(channel)

        const challengeHash = await util.string2SHA_256(CHALLENGE)
        const applicationHash = await util.string2SHA_256(APPLICATION)
        const keyHandle = '' // TODO: acquire through registration
        const keyHandleLength = '00' // TODO: calculate (util -> dec to hex)
        const authenticateResponse = await this.talkToDevice(device, HEX_U2F_MSG_AUTHENTICATE(channel, challengeHash, applicationHash, keyHandleLength, keyHandle))

        return Promise.resolve(authenticateResponse)
    },

    /**
     * @param {USBDevice} device 
     * @param {string} hex 
     * @returns {Promise<string>}
     */
    async talkToDevice(device, hex) {
        const message = util.hex2uint8array(hex)

        let inPromise = device.transferIn(window.CURRENT_DEVICE_TYPE.endpointNumberIn, 64)
        let outPromise = device.transferOut(window.CURRENT_DEVICE_TYPE.endpointNumberOut, message)
        const results = await Promise.all([inPromise, outPromise])

        return util.uint8array2hex(new Uint8Array(results[0].data.buffer))
    },
}
