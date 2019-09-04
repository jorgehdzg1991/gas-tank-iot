import AWS from 'aws-sdk';
import {
  AttachPolicyException,
  CreateKeysAndCertificateException
} from '../exceptions/IoTExceptions';

export default class Credentials {
  static iot = new AWS.Iot({ region: process.env.AWS_REGION });

  id = '';

  arn = '';

  certificate = '';

  publicKey = '';

  privateKey = '';

  constructor(id, arn, certificate, publicKey, privateKey) {
    this.id = id;
    this.arn = arn;
    this.certificate = certificate;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  static fromObj({ id, arn, certificate, publicKey, privateKey }) {
    return new Credentials(id, arn, certificate, publicKey, privateKey);
  }

  static async create() {
    try {
      const certificate = await Credentials.iot
        .createKeysAndCertificate({ setAsActive: true })
        .promise();
      return new Credentials(
        certificate.certificateId,
        certificate.certificateArn,
        certificate.certificatePem,
        certificate.keyPair.PublicKey,
        certificate.keyPair.PrivateKey
      );
    } catch (e) {
      console.error(e);
      throw new CreateKeysAndCertificateException(
        'Failed to create keys and certificate',
        e
      );
    }
  }

  async attachPolicy(policyName) {
    try {
      const request = {
        policyName,
        target: this.arn
      };
      await Credentials.iot.attachPolicy(request).promise();
    } catch (e) {
      console.error(e);
      throw new AttachPolicyException(
        'Failed to attach the policy to the certificate',
        e
      );
    }
  }
}
