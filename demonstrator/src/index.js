const devicesContainer = document.querySelector('.devices_container');
const btn_request = document.getElementById('btn_request');
const btn_requestandgo = document.getElementById('btn_requestandgo');
const device_response_container = document.querySelector('.device_response_container');
const btn_sendhex = document.getElementById('btn_sendhex');
const input_sendhex = document.getElementById('input_sendhex');

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
};

window.CURRENT_DEVICE_TYPE = {};

// Show error in unsupported browsers
if (!navigator.usb) {
    writeToLogSection('This browser does not support WebUSB, use a chromium-based browser instead.', 'error');
    //navigator.usb = {};
}


// Request device access
[ btn_request, btn_requestandgo ].forEach( btn => {
    btn.addEventListener('click', async () => {
        let device;
        try {
            writeToLogSection('Request Devices');
            device = await navigator.usb.requestDevice({filters: [
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
            ]});
        } catch (err) {
            writeToLogSection('Request failed: ' + err, 'error');
            return;
        }
    
        if (device === undefined) {
            writeToLogSection('No Device', 'error');
            return;
        }

        switch (device.productId) {
            case 288:
                window.CURRENT_DEVICE_TYPE = window.DEVICE_TYPES['security-key'];
                break;

            case 1031:
                window.CURRENT_DEVICE_TYPE = window.DEVICE_TYPES['yubi-key'];
                break;
            
            default:
                writeToLogSection('Error: Device is neither a Security Key nor YubiKey. Demo will not work.', 'error')
                break;
        }
    
        writeToLogSection('Request permitted');
        listDevices();
    })
});
// Show UI Race Condition
btn_requestandgo.addEventListener('click', async () => {
    // FIXME: Some trick needed?
    setTimeout(() => {
        window.location.href = 'https://www.google.com';
    }, 50);
});

// List accesible devices
devicesContainer.innerHTML = '';
async function listDevices() {
    if (!navigator.usb) return;

    let devices = await navigator.usb.getDevices();
    devicesContainer.innerHTML = '';
    devices.forEach(device => {
        devicesContainer.innerHTML += `<div class="device btn btn--borderless">${device.manufacturerName} :: ${device.productName}</div>`;
        devicesContainer.lastChild.addEventListener('click', e => {
            showDeviceModal(device);
        });
        btn_sendhex.addEventListener('click', e => {    
            input_sendhex.value = input_sendhex.value.replace(/\s/g, '');
            talkToDevice(device, input_sendhex.value);      
        });
        [ btn_closedevice, modal_device ].forEach(element => {
            element.addEventListener('click', async (event) => {
                device.close().then(() => {
                    writeToLogSection('Device closed');
                }).catch(e => {
                    console.error(e);
                    writeToLogSection('Cannot close device: ' + e, 'error');
                });
            });
        });
    });    
}

// Show Details Modal
async function showDeviceModal(device) {
    modal_device.style.display = '';
    modal_device.getElementsByClassName('modal_title')[0].innerHTML = device.productName;
    claimDevice(device).then(async () => {
        device_response_container.innerHTML += '<p class="device_response">Device claimed</p>';
        while (true) {
            let result = await device.transferIn(window.CURRENT_DEVICE_TYPE.endpointNumberIn, 65); // FIXME: 65 is just a guess...
            if (result.data) {
                const hexResult = uint8array2hex(new Uint8Array(result.data.buffer));
                const asciiResult = hex2ascii(hexResult);
                device_response_container.innerHTML +=`<p class="device_response">Device wrote: ${asciiResult} (${hexResult})</p>`;
            }
            if (result.status === 'stall') {
                console.warn('Endpoint stalled. Clearing.');
                await device.clearHalt(1);
            }
        }
    });
}

async function talkToDevice(device, hex) {
    const message = hex2uint8array(hex);
    device_response_container.innerHTML +=`<p class="device_response">You wrote: ${hex2ascii(hex)} (${hex})</p>`;
    let outResult = await device.transferOut(window.CURRENT_DEVICE_TYPE.endpointNumberOut, message);
    window.YubiKeyOutResult = outResult;
}

// Mess with the device
async function claimDevice(device) {
    writeToLogSection('Attempting Device Claim');
    
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
                console.log(inResult);
	    });
	});
	await device.selectConfiguration(window.CURRENT_DEVICE_TYPE.configurationValue).then(()=>{ //almost always 1. Windows takes first configuration only.
            return device.claimInterface(window.CURRENT_DEVICE_TYPE.interfaceNumber).then(() => { //contine after either .then or .error
              //failing claim indicates interface in use
              return device.selectAlternateInterface(
                  window.CURRENT_DEVICE_TYPE.interfaceNumber,
                  window.CURRENT_DEVICE_TYPE.alternateSetting
              ).then(()=>{
                  return device.reset();
              });
            });
          });
	writeToLogSection('Claim Successful' + (device.opened ? ', device opened' : ''), 'success');
    } catch (e) {
        writeToLogSection('Cannot claim device: ' + e, 'error');
	console.error(e);
    } finally {
        console.log(device);
	window.YubiKey = device;
	return Promise.resolve();
        //device.close();
        //writeToLogSection('Logged device to console, closing device');
    }
}

// Events
navigator.usb.addEventListener('connect', async ({device}) => {
    writeToLogSection(`Connected ${device.productName}`);
    listDevices();
});
navigator.usb.addEventListener('disconnect', async ({device}) => {
    writeToLogSection(`Disconnected ${device.productName}`);
    listDevices();
});


// Initialize
clearLogs();
listDevices();
