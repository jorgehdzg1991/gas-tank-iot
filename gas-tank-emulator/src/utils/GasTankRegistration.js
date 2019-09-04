import GasTank from '../models/GasTank';
import Credentials from '../models/Credentials';

export default class GasTankRegistration {
  static async register(tankName) {
    // create new IoT credentials
    const credentials = await Credentials.create();

    // attach the gas tank policy to the certificate
    credentials.attachPolicy(process.env.GAS_TANK_POLICY);

    // create a new gas tank and pass it the credentials
    const gasTank = await GasTank.create(tankName, credentials);

    // attach the certificate to the new gas tank
    gasTank.attachCertificate(credentials.arn);

    return gasTank;
  }
}
