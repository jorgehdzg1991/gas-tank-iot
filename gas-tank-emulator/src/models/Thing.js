import AWS from 'aws-sdk';
import DeviceShadow from '../utils/DeviceShadow';
import {
  AttachCertificateToThingException,
  CreateThingException
} from '../exceptions/IoTExceptions';

export default class Thing {
  static iot = new AWS.Iot({ region: process.env.AWS_REGION });

  name = '';

  type = '';

  credentials = null;

  constructor(name, type, credentials) {
    this.name = name;
    this.type = type;
    this.credentials = credentials;
  }

  static async create(name, type) {
    try {
      const request = {
        thingName: name,
        thingTypeName: type
      };
      await Thing.iot.createThing(request).promise();
      return new Thing(name, type);
    } catch (e) {
      console.error(e);
      throw new CreateThingException('Failed to create thing', e);
    }
  }

  async attachCertificate(certificateName) {
    try {
      const request = {
        principal: certificateName,
        thingName: this.name
      };

      await Thing.iot.attachThingPrincipal(request).promise();
    } catch (e) {
      console.error(e);
      throw new AttachCertificateToThingException(
        'Failed to attach certificate to thing',
        e
      );
    }
  }

  async updateShadow(newState) {
    const deviceShadow = new DeviceShadow(
      this.name,
      this.credentials.certificate,
      this.credentials.privateKey
    );

    await deviceShadow.connect();

    await deviceShadow.update(newState);

    deviceShadow.disconnect();
  }
}
