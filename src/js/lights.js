window.charac = false;
// JavaScript

window.myData = {
  lightmode: 'colorWipe',
  colorone: '255,0,203',
  colortwo: '255,0,0',
  colorthree: '0,0,255',
  animationdelay: 100
};

window.bleWrite = async () => { 
  let event = window.myData;
  let encoder = new TextEncoder('utf-8'); 
  let toBle = encoder.encode(JSON.stringify(event)); 
  console.log( 'Sending to ESP: ', { 'raw':event, 'encoded': toBle}) 
  window.charac.writeValue(toBle); 
}

window.timer = null;
function updateUpdateTimeout() {
  window.timer && clearTimeout(window.timer);
  window.timer = setTimeout(function() {
    window.bleWrite();
  }, 1000);
}

window.bleRead = async (event) => { 
  // window.charac.readValue();
  // console.log('bleRead', event.target.value.getUint8(0) ); 
  let value = await event.target.value
  let decoder = new TextDecoder('utf-8');
  let message = decoder.decode(event.target.value)
  console.log('ESP32 Current Value: ' + message); 
}

window.ble = async(bleWrite=false, bleRead=false) => {
  bleClick();
}

export async function bleClick(){
  let SERVICE_UUID        = '4fafc201-1fb5-459e-8fcc-c5c9c3319123';
  let CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b2623';
  let ESPNAME = 'Music Strip'; 
  if(!window.charac){ // 1st Click Connect
    console.log("Setting up!")

    let bluetoothDevice = await navigator.bluetooth.requestDevice(
      { filters: [{ name: ESPNAME }], optionalServices: [SERVICE_UUID] } )
    const server = await bluetoothDevice.gatt.connect()
    const service = await server.getPrimaryService(SERVICE_UUID);
    window.charac = await service.getCharacteristic(CHARACTERISTIC_UUID);

    // Start Read Notifications.
    console.log('characteristic'); 
    window.charac.startNotifications()
    window.charac.addEventListener('characteristicvaluechanged', window.bleRead) 

    // Add Write Event Listeners.
    let createEventListener = (eventId) => {
      // Create Button
      let btn = document.getElementById('btConnect')
      console.log({btn});
      btn.insertAdjacentHTML('afterend', "<button onclick=\"window.myData.lightmode = 'colorWipe'; window.bleWrite()\"> colorWipe </button>" );
      btn.insertAdjacentHTML('afterend', "<button onclick=\"window.myData.lightmode = 'theaterChase'; window.bleWrite()\"> theaterChase </button>" );
      btn.insertAdjacentHTML('afterend', "<button onclick=\"window.myData.lightmode = 'rainbow'; window.bleWrite()\"> rainbow </button>" );
      btn.insertAdjacentHTML('afterend', "<button onclick=\"window.myData.lightmode = 'theaterChaseRainbow'; window.bleWrite()\"> theaterChaseRainbow </button>" );
      btn.insertAdjacentHTML('afterend', "<button onclick=\"window.myData.lightmode = 'multiColorSizzle'; window.bleWrite()\"> multiColorSizzle </button>" );
      btn.insertAdjacentHTML('afterend', "<button onclick=\"window.myData.lightmode = 'multiColorWipe'; window.bleWrite()\"> multiColorWipe </button>" );
      btn.insertAdjacentHTML('afterend', "<button onclick=\"window.myData.lightmode = 'multiTheaterSizzle'; window.bleWrite()\"> multiTheaterSizzle </button>" );
      btn.insertAdjacentHTML('afterend', "<button onclick=\"window.myData.lightmode = 'multiTheaterWipe'; window.bleWrite()\"> multiTheaterWipe </button>" );
      
      btn.insertAdjacentHTML('afterend', "<div>Animation Delay: <input type='number'min='0' step='5' id='animationDelay' value='100' style='width: 100px; clip: auto;'/></div>");
      btn.insertAdjacentHTML('afterend', "<div>Brightness: <input type='number' step='5' min='0'  max='256' id='brightness' value='100' style='width: 100px; clip: auto;'/></div>");
      document.getElementById('animationDelay').addEventListener('input', function() { window.myData.animationdelay = parseInt(this.value, 10); updateUpdateTimeout(); });
      document.getElementById('brightness').addEventListener('input', function() { window.myData.brightness = parseInt(this.value, 10); updateUpdateTimeout(); });

      btn.insertAdjacentHTML('afterend', "<div>Color One: <input style='width: 100px; clip: auto;' type='color' id='colorOne' value='#ff00cb' /></div>");
      btn.insertAdjacentHTML('afterend', "<div>Color Two: <input style='width: 100px; clip: auto;' type='color' id='colorTwo' value='#00ffcb' /></div>");
      btn.insertAdjacentHTML('afterend', "<div>Color Three: <input style='width: 100px; clip: auto;' type='color' id='colorThree' value='#cb00ff' /></div>");
      document.getElementById('colorOne').addEventListener('input', updateColor);
      document.getElementById('colorTwo').addEventListener('input', updateColor);
      document.getElementById('colorThree').addEventListener('input', updateColor);

      function updateColor() {
        let color = this.value.slice(1);
        let r = parseInt(color.substr(2, 2), 16);
        let g = parseInt(color.substr(0, 2), 16);
        let b = parseInt(color.substr(4, 2), 16);
        window.myData[this.id.toLowerCase()] = `${r},${g},${b}`;
        console.log('got color', this.value, window.myData[this.id.toLowerCase()]);
        updateUpdateTimeout();
      }
    }
    createEventListener();
  }
  else{ // 2nd Click Read value.
    let dataView = await window.charac.readValue()
    let uint = await dataView.getUint8(0)
    // console.log('Read:', uint);
  }
}



export function getContent(){
    return `<button id="btConnect" onclick="ble()">BT Connect</button>`
}

/*
// Create a custom event
const lightsLoadedEvent = new CustomEvent('lightsLoaded', {
  bubbles: true,
  cancelable: false,
});

// Dispatch the event when the module has finished loading
document.dispatchEvent(lightsLoadedEvent);
*/