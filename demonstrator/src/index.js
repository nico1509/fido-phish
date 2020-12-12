const devicesContainer = document.querySelector('.devices_container');
const logContainer = document.querySelector('.log_container');
const btn_request = document.getElementById('btn_request');
const btn_requestandgo = document.getElementById('btn_requestandgo');
const btn_clearlogs = document.getElementById('btn_clearlogs');
const modal_device = document.getElementById('modal_device');
const btn_closedevice = document.getElementById('btn_closedevice');

// Request device access
[ btn_request, btn_requestandgo ].forEach( btn => {
    btn.addEventListener('click', async () => {
        let device;
        try {
            writeToLogSection('Request Devices');
            device = await navigator.usb.requestDevice({filters: [{
                // Filter for our Yubikey (Yubikey Touch U2F Security Key)
                vendorId: 0x1050,
                productId: 0x0120,
            }]});
        } catch (err) {
            writeToLogSection('Request failed: ' + err, true);
            return;
        }
    
        if (device === undefined) {
            writeToLogSection('No Device', true);
            return;
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
    let devices = await navigator.usb.getDevices();
    devicesContainer.innerHTML = '';
    devices.forEach(device => {
        devicesContainer.innerHTML += `<div class="device btn btn--borderless">${device.manufacturerName} :: ${device.productName}</div>`;
        devicesContainer.lastChild.addEventListener('click', e => {
            showDeviceModal(device);
        });
    });    
}

// Show Details Modal
async function showDeviceModal(device) {
    modal_device.style.display = '';
    modal_device.getElementsByClassName('modal_title')[0].innerHTML = device.productName;
    modal_device.getElementsByClassName('modal_content')[0].innerHTML = `
        <pre>${JSON.stringify(device.configurations)}</pre>
    `;
    messWithDevice(device);
}

// Mess with the device
async function messWithDevice(device) {
    
    device.controlTransferOut({
        requestType: 'standard',
        recipient: 'device',
        request: 0x06,
        value: 0x0100,
        index: 0x0000}
    ).then(result => {
        console.log(result);
    });

    writeToLogSection('Attempting Device Claim');
    
    try {
        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);
        await device.selectAlternateInterface(0, 0);
    } catch (e) {
        writeToLogSection('Cannot claim device: ' + e, true);
    } finally {
        writeToLogSection('Logged device to console');
        console.log(device);
    }
}

// Log
function clearLogs() {
    logContainer.innerHTML = '';
}
function writeToLogSection(message = '', error = false) {
    const classes = error ? 'log error' : 'log';
    logContainer.innerHTML += `<div class="${classes}">${new Date()} <br> &rightarrow; ${message}</div>`;
}
if (!navigator.usb) {
    writeToLogSection('This browser does not support WebUSB, use a chromium-based browser instead.', true)
}
btn_clearlogs.addEventListener('click', async () => {
    clearLogs();
})
clearLogs();

// Events
navigator.usb.addEventListener('connect', async ({device}) => {
    writeToLogSection(`Connected ${device.productName}`);
    listDevices();
});
navigator.usb.addEventListener('disconnect', async ({device}) => {
    writeToLogSection(`Disconnected ${device.productName}`);
    listDevices();
});


// Initialize: List Devices
listDevices();


/*
    UI STUFF
    just plain UI code without relevant device logic
*/
function addDeviceModalBehaviour() {
    [ btn_closedevice, modal_device ].forEach(element => {
        element.addEventListener('click', async (event) => {
            modal_device.style.display = 'none';
        });
        element.childNodes.forEach(child => {
            child.addEventListener('click', (childEvent) => {
                childEvent.stopPropagation();
            });
        });
    });
}
addDeviceModalBehaviour();