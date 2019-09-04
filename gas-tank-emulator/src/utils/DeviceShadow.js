import awsIot from 'aws-iot-device-sdk';
import log from './Logging';

const ThingShadow = awsIot.thingShadow;

export default class DeviceShadow {
  iotConnection = null;

  deviceName = '';

  certificate = '';

  privateKey = '';

  updateResolve = () => {
    throw new Error('updateResolve is not yet implemented.');
  };

  updateReject = () => {
    throw new Error('updateReject is not yet implemented.');
  };

  constructor(deviceName, certificate, privateKey) {
    this.deviceName = deviceName;
    this.certificate = certificate;
    this.privateKey = privateKey;
  }

  connect() {
    return new Promise(resolve => {
      this.iotConnection = new ThingShadow({
        host: process.env.IOT_ENDPOINT,
        clientId: this.deviceName,
        clientCert: Buffer.from(this.certificate),
        privateKey: Buffer.from(this.privateKey),
        caCert: Buffer.from(process.env.IOT_CA_CERTIFICATE)
      });

      this.iotConnection.on('connect', () => {
        this.iotConnection.register(this.deviceName, {}, () => {
          log('IoT connection established');
          resolve();
        });
      });

      this.iotConnection.on('status', (thingName, statusType) => {
        if (statusType === 'accepted') {
          log(`Device "${thingName}" shadow updated successfully`);
          this.updateResolve();
          this.updateResolve = () => {
            throw new Error('updateResolve is not yet implemented.');
          };
          this.updateReject = () => {
            throw new Error('updateReject is not yet implemented.');
          };
        } else {
          this.updateReject(`Failed to update device "${thingName}" shadow`);
        }
      });

      this.iotConnection.on('timeout', (thingName, clientToken) => {
        this.updateReject(
          `Received a timeout on "${thingName}" with token "${clientToken}"`
        );
      });
    });
  }

  disconnect() {
    this.iotConnection = null;
  }

  setUpdateResolveAndReject(resolve, reject) {
    this.updateResolve = resolve;
    this.updateReject = reject;
  }

  update(newState) {
    return new Promise((resolve, reject) => {
      this.setUpdateResolveAndReject(resolve, reject);
      const token = this.iotConnection.update(this.deviceName, {
        state: {
          reported: newState
        }
      });
      if (!token) {
        reject(
          `Failed to update device "${this.deviceName}" shadow with token "${token}"`
        );
      }
    });
  }
}
