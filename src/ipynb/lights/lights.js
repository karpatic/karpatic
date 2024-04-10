//todo: handle: lights.js:66 Uncaught (in promise) DOMException: GATT operation failed for unknown reason.

// Initialize variables
window.charac = false;
window.notificationsActive = false;
window.queued = false;
window.processing = false;

// Define data configuration
window.myData = {
  lightmode: 'swipe',
  colorone: '255,0,203',
  colortwo: '255,0,0',
  colorthree: '0,0,255',
  animationdelay: 100
};

window.getRandomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `${r},${g},${b}`;
}

// Asynchronous function for Bluetooth write
window.bleWrite = async () => {
  if (window.processing) {
    window.queued = true;
  } else {
    window.queued = false;
    window.processing = true;
    // json stringify and encode
    const encoded = new TextEncoder().encode(JSON.stringify(window.myData));
    console.log(`Ble Write`, window.myData, { encoded });
    await window.charac.writeValue(encoded).then(() => {
      window.processing = false;
      window.queued && window.bleWrite();
    });
  }
};

// Asynchronous function for Bluetooth read
window.bleRead = async ({ target: { value } }) => {
  let message = new TextDecoder().decode(await value);
  window.myData = JSON.parse(message);
  console.log('fromBle: ', window.myData);
};

// Function to set up Bluetooth connection
window.ble = async () => {
  console.log('BLE', window.btDash);
  window.btDash.style.display = 'inline-block';
  const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c3319123';
  const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b2623';
  const ESPNAME = 'Music Strip';

  if (window.charac) {
    console.log('Read:', (await window.charac.readValue()).getUint8(0));
  } else {
    console.log("Setting up!");
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ name: ESPNAME }],
      optionalServices: [SERVICE_UUID]
    });
    const service = await device.gatt.connect().then(server => server.getPrimaryService(SERVICE_UUID));
    window.charac = await service.getCharacteristic(CHARACTERISTIC_UUID);
    console.log('Characteristic');
    if (!window.notificationsActive) {
      await window.charac.startNotifications();
      window.notificationsActive = true;
      window.charac.addEventListener('characteristicvaluechanged', window.bleRead);
    }
    document.getElementById('btConnect').insertAdjacentHTML('afterend',
      "<button onclick=\"window.bleWrite('TestEvent')\">TestEvent</button>");
  }
}

// Function to update color settings
function updateColor() {
  let color = this.value.slice(1);
  let r = parseInt(color.substr(2, 2), 16);
  let g = parseInt(color.substr(0, 2), 16);
  let b = parseInt(color.substr(4, 2), 16);
  window.myData[this.id.toLowerCase()] = `${r},${g},${b}`;
  console.log('Got color', this.value, window.myData[this.id.toLowerCase()]);
  window.bleWrite();
}

document.getElementById('colorOne').addEventListener('input', updateColor);
document.getElementById('colorTwo').addEventListener('input', updateColor);
document.getElementById('colorThree').addEventListener('input', updateColor);

// Custom event handling (commented out)
/*
const lightsLoadedEvent = new CustomEvent('lightsLoaded', {
  bubbles: true,
  cancelable: false,
});

document.dispatchEvent(lightsLoadedEvent);
*/
