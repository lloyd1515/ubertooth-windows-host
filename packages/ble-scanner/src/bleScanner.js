import noble from '@abandonware/noble';

export function scan({ durationSeconds = 10, onDiscover = null } = {}) {
  return new Promise((resolve, reject) => {
    const devices = [];

    const handleDiscover = (peripheral) => {
      const device = {
        id: peripheral.id,
        uuid: peripheral.uuid,
        address: peripheral.address,
        addressType: peripheral.addressType,
        connectable: peripheral.connectable,
        rssi: peripheral.rssi,
        localName: peripheral.advertisement.localName,
        txPowerLevel: peripheral.advertisement.txPowerLevel,
        serviceUuids: peripheral.advertisement.serviceUuids
      };
      devices.push(device);
      if (onDiscover) {
        onDiscover(device);
      }
    };

    const stopScan = () => {
      noble.removeListener('discover', handleDiscover);
      noble.stopScanning(() => resolve(devices));
    };

    const onStateChange = (state) => {
      if (state === 'poweredOn') {
        noble.startScanning([], true); // true = allow duplicates to get RSSI updates? Maybe not for simple scan.
        setTimeout(stopScan, durationSeconds * 1000);
      } else {
        noble.stopScanning();
        reject(new Error(`Bluetooth state changed to ${state}`));
      }
    };

    noble.on('stateChange', onStateChange);
    noble.on('discover', handleDiscover);

    if (noble.state === 'poweredOn') {
      noble.startScanning([], true);
      setTimeout(stopScan, durationSeconds * 1000);
    }
  });
}

export function follow(targetId, { onData = null } = {}) {
  // Connection follow on Windows using noble
  return new Promise((resolve, reject) => {
    noble.on('stateChange', (state) => {
      if (state !== 'poweredOn') {
        reject(new Error(`Bluetooth state is ${state}`));
      }
    });

    const onDiscover = (peripheral) => {
      if (peripheral.id === targetId || peripheral.address === targetId) {
        noble.stopScanning();
        connect(peripheral);
      }
    };

    const connect = (peripheral) => {
      peripheral.connect((error) => {
        if (error) {
          reject(error);
          return;
        }

        peripheral.discoverAllServicesAndCharacteristics((error, services, characteristics) => {
           if (error) {
             reject(error);
             return;
           }
           if (onData) {
             onData({ services, characteristics });
           }
           // For parity, we might want to stay connected or just prove we can follow.
           // In this prototype, we'll just resolve after discovery.
           resolve({ peripheral, services, characteristics });
        });
      });
    };

    noble.on('discover', onDiscover);
    noble.startScanning();
  });
}
