import AWS from 'aws-sdk';
import { CreateThingTypeException } from '../exceptions/IoTExceptions';

export default class ThingType {
  static iot = new AWS.Iot({ region: process.env.AWS_REGION });

  static async create(name, description) {
    try {
      const request = {
        thingTypeName: name,
        thingTypeProperties: {
          thingTypeDescription: description
        }
      };

      return await ThingType.iot.createThingType(request).promise();
    } catch (e) {
      console.error(e);
      throw new CreateThingTypeException(
        `Failed to create thing type, ${e.message}`
      );
    }
  }
}
