import util from './util.js'

const HEX_U2F_INIT = nonce => 'ffffffff' + '86' + '0008' + nonce + '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
const HEX_U2F_MSG_AUTHENTICATE = (channel, challengeHash, applicationHash, keyHandleLength, keyHandle) => channel + '83' + '0042' + '00' + '02' + '0300' + '03' + challengeHash + applicationHash + keyHandleLength + keyHandle + '4a'
const HEX_U2F_MSG_REGISTER = (channel, challengeHash, applicationHash) => channel + '83' + '0040' + '00' + '01' + '0000' + challengeHash + applicationHash + '4a'

const CHALLENGE = '{"typ":"navigator.id.getAssertion","challenge":"Brz9Cf+1VITbPF20TGkK8k5EfHH6OjTHRbSu8O5kulI=","origin":"nico-assfalg.de"}'
const APPLICATION = 'https://nico-assfalg.de'
const MAX_MESSAGE_LENGTH = 64 * 2
const U2FHID_INIT_PREFIX_LENGTH = (4 + 1 + 2) * 2
const U2FHID_CONT_PREFIX_LENGTH = (4 + 1) * 2

/**
 * // STOP: Erst manuell zum Laufen bringen
 * 
 * @param {string} hex - valid hex assumed
 * @returns {Uint8Array}
 */
function prepareHexForTransfer(hex) {
    let hexes = []
    if (hex.length <= MAX_MESSAGE_LENGTH) {
        // Fall: Hex ist kürzer als Maximallänge -> Auffüllen mit 0
        hexes.push(hex += '0'.repeat(MAX_MESSAGE_LENGTH - hex.length))
    }
    let continuation = -1
    // FIXME: if length > max UND DANN while length > 0 UND auffüllen
    while (hex.length > MAX_MESSAGE_LENGTH) {
        // Fall: Hex ist länger als Maximallänge -> in continuation packets aufteilen
        hexSubstring = hex.substr(0, MAX_MESSAGE_LENGTH)
        if (continuation >= 0) {
            // TODO: change cmd byte to continuation byte
        }
        hexes.push()
        hex = hex.substr(MAX_MESSAGE_LENGTH)
    }

    const message = util.hex2uint8array(hex)
}

export default {
    /**
     * @param {USBDevice} device 
     * @returns {Promise<string>} channel
     */
    async u2f_init(device) {
        await this.deviceOut(device, HEX_U2F_INIT('ddf69cc410cd664e'))
        const initResponse = await this.deviceIn(device)
        const channel = initResponse[0].substr(30, 8)
        return channel
    },

    /**
     * // STOP: Brauchen wir vsl. nicht
     * @param {USBDevice} device 
     */
    async u2f_msg_register(device) {
        const channel = await this.u2f_init(device)
        console.log(channel)

        const challengeHash = await util.string2SHA_256(CHALLENGE)
        const applicationHash = await util.string2SHA_256(APPLICATION)
        await this.deviceOut(device, HEX_U2F_MSG_REGISTER(channel, challengeHash, applicationHash))
        const registerResponse = await this.deviceIn(device)

        return Promise.resolve(registerResponse)
    },

    /**
     * @param {USBDevice} device 
     */
    async u2f_msg_authenticate(device) {
        const channel = await this.u2f_init(device)
        console.log(channel)

        // const challengeHash = await util.string2SHA_256(CHALLENGE)
        // const applicationHash = await util.string2SHA_256(APPLICATION)
        // const keyHandle = '' // TODO: acquire through registration
        // const keyHandleLength = '00' // TODO: calculate (util -> dec to hex)
        // await this.deviceOut(device, HEX_U2F_MSG_AUTHENTICATE(channel, challengeHash, applicationHash, keyHandleLength, keyHandle))
        
        // 0104
        await this.deviceOut(device, channel + '900001040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
        (await this.deviceIn(device)).forEach(hex => {
            util.writeToDeviceSection(hex)
        })

        // AUTH
        await this.deviceOut(device, channel + '90009402A4016F64656D6F2E79756269636F2E636F6D025820A9BB4875A46C1D8202C7BC94F376FD0890DE197E3400E01E950F633DC538F8E00381A2');
        await this.deviceOut(device, channel + '006269645840BE1100C35FF0D5C1969DF758D78D84E5BD1852E7ABFB436DEF3895B0F0F4F4366BB458B0EF7660E661CD7C99D1DB53A14C26FE4E953E');
        await this.deviceOut(device, channel + '01F593A3E2F0677A024DD564747970656A7075626C69632D6B657905A1627570F4000000000000000000000000000000000000000000000000000000');

        return Promise.resolve()
    },

    /**
     * @param {USBDevice} device 
     * @param {string} hex 
     */
    async deviceOut(device, hex) {
        await device.transferOut(window.CURRENT_DEVICE_TYPE.endpointNumberOut, util.hex2uint8array(hex))
    },
      
    /**
     * @param {USBDevice} device 
     * @returns {Promise<string[]>}
     */
    async deviceIn(device) {
        let result = await device.transferIn(window.CURRENT_DEVICE_TYPE.endpointNumberIn, 64)
        const inResultHex = util.uint8array2hex(new Uint8Array(result.data.buffer))
        let inResultParts = [inResultHex]
        const payloadLengthParts = { hi: '0x' + inResultHex.substr(10, 2), lo: '0x' + inResultHex.substr(12, 2) }
        // https://stackoverflow.com/a/6090641
        const payloadLength = (payloadLengthParts.lo | (payloadLengthParts.hi << 8)) * 2
        if ((payloadLength + U2FHID_INIT_PREFIX_LENGTH) > MAX_MESSAGE_LENGTH) {
            const payloadLengthToCome = payloadLength - MAX_MESSAGE_LENGTH + U2FHID_INIT_PREFIX_LENGTH
            const numberOfInRequired = Math.floor(payloadLengthToCome / (MAX_MESSAGE_LENGTH - U2FHID_CONT_PREFIX_LENGTH)) + 1
            for (let i = 0; i < numberOfInRequired; i++) {
                const continuedResult = await device.transferIn(window.CURRENT_DEVICE_TYPE.endpointNumberIn, 64)
                inResultParts[0] += util.uint8array2hex(new Uint8Array(continuedResult.data.buffer)).slice(10)
            }
        }

        return inResultParts
    },
}
