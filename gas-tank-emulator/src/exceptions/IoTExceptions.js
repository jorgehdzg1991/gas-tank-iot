export default class IoTException extends Error {
  originalError = null;

  constructor(msg, originalError) {
    super(msg);
    this.originalError = originalError;
  }
}

export class CreateThingException extends IoTException {}
export class AttachCertificateToThingException extends IoTException {}
export class CreateKeysAndCertificateException extends IoTException {}
export class AttachPolicyException extends IoTException {}
export class CreateThingTypeException extends IoTException {}
