const devicesContainer = document.querySelector('.devices_container');
const logContainer = document.querySelector('.log_container');
const btn_request = document.getElementById('btn_request');
const btn_list = document.getElementById('btn_list');

// Request device access
btn_request.addEventListener('click', async () => {
    let device;
    try {
        writeToLogSection('Request Devices');
        device = await navigator.usb.requestDevice({filters: []});
    } catch (err) {
        writeToLogSection('Request denied', true);
        return;
    }

    if (device === undefined) {
        writeToLogSection('No Device', true);
        return;
    }

    writeToLogSection('Request permitted');
    listDevices();
});

// List accesible devices
devicesContainer.innerHTML = '';
async function listDevices() {
    let devices = await navigator.usb.getDevices();
    devicesContainer.innerHTML = '';
    devices.forEach(device => {
        devicesContainer.innerHTML += `<div class="device">${device.manufacturerName} :: ${device.productName}</div>`;
    });    
}
btn_list.addEventListener('click', async () => {
    writeToLogSection('List Devices');
    listDevices();
});

// Log
logContainer.innerHTML = '';
function writeToLogSection(message = '', error = false) {
    const classes = error ? 'log error' : 'log';
    logContainer.innerHTML += `<div class="${classes}">${new Date()} <br> &rightarrow; ${message}</div>`;
}
if (!navigator.usb) {
    writeToLogSection('This browser does not support WebUSB, use a chromium-based browser instead.', true)
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
