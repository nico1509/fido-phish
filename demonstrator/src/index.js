const devicesContainer = document.querySelector('.devices_container');
const btn_request = document.getElementById('btn_request');
const btn_requestandgo = document.getElementById('btn_requestandgo');

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
                    vendorId: 0x1050, productId: 0x0120,
                },
                {
                    // Filter for Yubikey
                    vendorId: 0x1050, productId: 0x0407,
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
    
    

    writeToLogSection('Attempting Device Claim');
    
    try {
        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);
        await device.selectAlternateInterface(0, 0);
        writeToLogSection('Claim Successful' + (device.opened ? ', device opened' : ''), 'success');
    } catch (e) {
        writeToLogSection('Cannot claim device: ' + e, 'error');
    } finally {
        console.log(device);
        device.close();
        writeToLogSection('Logged device to console, closing device');
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
