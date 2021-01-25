import util from './util.js'
import u2f from './u2fhid.js'
import webauth from './webauth.js'

const devicesContainer = document.querySelector('.devices_container')
const btn_request = document.getElementById('btn_request')
const btn_requestandgo = document.getElementById('btn_requestandgo')
const btn_sendhex = document.getElementById('btn_sendhex')
const input_sendhex = document.getElementById('input_sendhex')
const btn_closedevice = document.getElementById('btn_closedevice')
const btn_usb_register = document.getElementById('btn_usb_register')
const btn_usb_get = document.getElementById('btn_usb_get')
const btn_webauth_register = document.getElementById('btn_webauth_register')
const btn_webauth_get = document.getElementById('btn_webauth_get')
const btn_clearlogs = document.getElementById('btn_clearlogs')


window.DEVICE_TYPES = {
    'security-key': {
        vendorId: 0x1050,
        productId: 0x0120,
        configurationValue: 1,
        interfaceNumber: 0,
        alternateSetting: 0,
        endpointNumberIn: 4,
        endpointNumberOut: 4,
    },
    'yubi-key': {
        vendorId: 0x1050,
        productId: 0x0407,
        configurationValue: 1,
        interfaceNumber: 2,
        alternateSetting: 0,
        endpointNumberIn: 2,
        endpointNumberOut: 2,
    },
}

window.CURRENT_DEVICE_TYPE = {}

async function requestDevice() {
    let device
    try {
        util.writeToLogSection('Request Devices')
        device = await navigator.usb.requestDevice({
            filters: [
                {
                    // Filter for Touch U2F Security Key
                    vendorId: window.DEVICE_TYPES['security-key'].vendorId,
                    productId: window.DEVICE_TYPES['security-key'].productId,
                },
                {
                    // Filter for Yubikey
                    vendorId: window.DEVICE_TYPES['yubi-key'].vendorId,
                    productId: window.DEVICE_TYPES['yubi-key'].productId,
                },
            ]
        })
    } catch (err) {
        util.writeToLogSection('Request failed: ' + err, 'error')
        return
    }

    if (device === undefined) {
        util.writeToLogSection('No Device', 'error')
        return
    }

    switch (device.productId) {
        case 288:
            window.CURRENT_DEVICE_TYPE = window.DEVICE_TYPES['security-key']
            break

        case 1031:
            window.CURRENT_DEVICE_TYPE = window.DEVICE_TYPES['yubi-key']
            break

        default:
            util.writeToLogSection('Error: Device is neither a Security Key nor YubiKey. Demo will not work.', 'error')
            break
    }

    window.YubiKey = device

    util.writeToLogSection('Request permitted')
    showDeviceModal(device)

}

/**
 * @param {USBDevice} device 
 */
async function showDeviceModal(device) {
    util.clearDeviceSection()
    modal_device.style.display = ''
    modal_device.getElementsByClassName('modal_title')[0].innerHTML = device.productName
    claimDevice(device).then(async () => {
        util.writeToDeviceSection('Device claimed')
    })
}

/**
 * @param {USBDevice} device 
 */
async function claimDevice(device) {
    util.writeToLogSection('Attempting Device Claim')

    try {
        await device.open().then(() => {
            return device.controlTransferIn({
                //GET_DESCRIPTOR always uses bmRequestType 10000000B = requestType:"standard",recipient: "device"
                requestType: "standard",  //"standard","class","vendor"
                recipient: "device",      //"device","interface","endpoint","other"
                request: 0x06,            //0x06 GET_DESCRIPTOR
                value: 0x0200,            //descriptor type,descriptor index.
                //Types:1:device,2:configuration,4:interface,5:endpoint.
                //Word length, little endian order of bytes.
                //Avoid decimals, because of different byte order.
                index: 0x0000             //zero or language id
            }, 4096).then((inResult) => {
                console.log(inResult)
            })
        })
        await device.selectConfiguration(window.CURRENT_DEVICE_TYPE.configurationValue).then(() => { //almost always 1. Windows takes first configuration only.
            return device.claimInterface(window.CURRENT_DEVICE_TYPE.interfaceNumber).then(() => { //contine after either .then or .error
                //failing claim indicates interface in use
                return device.selectAlternateInterface(
                    window.CURRENT_DEVICE_TYPE.interfaceNumber,
                    window.CURRENT_DEVICE_TYPE.alternateSetting
                ).then(() => {
                    return device.reset()
                })
            })
        })
        util.writeToLogSection('Claim Successful' + (device.opened ? ', device opened' : ''), 'success')
    } catch (e) {
        util.writeToLogSection('Cannot claim device: ' + e, 'error')
        console.error(e)
    } finally {
        console.log(device)
        return Promise.resolve()
        //device.close();
        //util.writeToLogSection('Logged device to console, closing device');
    }
}

/**
 * @param {USBDevice} device 
 */
async function closeDevice(device) {
    util.hideDeviceModal()
    device.close().then(() => {
        util.writeToLogSection('Device closed')
    }).catch(e => {
        console.error(e)
        util.writeToLogSection('Cannot close device: ' + e, 'error')
    })

    delete window.YubiKey
}

function initialize() {
    // Show error in unsupported browsers
    if (!navigator.usb) {
        util.writeToLogSection('This browser does not support WebUSB, use a chromium-based browser instead.', 'error')
        //navigator.usb = {};
    }

    // Buttons
    btn_request.addEventListener('click', async () => {
        if (window.YubiKey) {
            closeDevice(window.YubiKey)
        }
        requestDevice()
    })

    btn_requestandgo.addEventListener('click', async () => {
        // FIXME: Some trick needed?
        setTimeout(() => {
            window.location.href = 'https://www.google.com'
        }, 50)
    })


    btn_sendhex.addEventListener('click', e => {
        if (!window.YubiKey) return

        input_sendhex.value = input_sendhex.value.replace(/\s/g, '')
        util.writeToDeviceSection(`You wrote: ${input_sendhex.value} (${util.hex2ascii(input_sendhex.value)})`)
        u2f.talkToDevice(window.YubiKey, input_sendhex.value).then(hexList => {
            hexList.forEach(hex => {
                util.writeToDeviceSection(`Device wrote: ${hex} (${util.hex2ascii(hex)})`)
            })
        })
    })

    btn_closedevice.addEventListener('click', async (event) => {
        if (window.YubiKey) {
            closeDevice(window.YubiKey)
        }
    })

    btn_usb_register.addEventListener('click', async (event) => {
        if (!window.YubiKey) return
        u2f.u2f_msg_register(window.YubiKey).then(hexList => {
            hexList.forEach(hex => {
                util.writeToDeviceSection('Register Response: ' + hex)
            })
        })
    })

    btn_usb_get.addEventListener('click', async (event) => {
        if (!window.YubiKey) return
        u2f.u2f_msg_authenticate(window.YubiKey).then(hexList => {
            hexList.forEach(hex => {
                util.writeToDeviceSection('Authenticate Response: ' + hex)
            })
        })
    })

    btn_webauth_get.addEventListener('click', async (e) => {
        util.writeToLogSection('Request Key Authentication...')
        webauth.get().then(() => {
            util.writeToLogSection('Key authenticated', 'success')
        }).catch(e => {
            util.writeToLogSection(e, 'error')
        })
    })

    btn_webauth_register.addEventListener('click', async (e) => {
        util.writeToLogSection('Request Key Registration...')
        webauth.register().then(id => {
            util.writeToLogSection('Key registered, ID: ' + id, 'success')
        }).catch(e => {
            util.writeToLogSection(e, 'error')
        })
    })

    btn_clearlogs.addEventListener('click', async (event) => {
        util.clearLogs()
    })



    // Events
    navigator.usb.addEventListener('connect', async ({ device }) => {
        util.writeToLogSection(`Connected ${device.productName}`)
    })
    navigator.usb.addEventListener('disconnect', async ({ device }) => {
        util.writeToLogSection(`Disconnected ${device.productName}`)
        util.hideDeviceModal()
    })

    util.clearLogs()
}

export default {
    initialize: initialize,
}
