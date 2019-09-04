import Thing from './Thing';
import Credentials from './Credentials';

export default class GasTank extends Thing {
  totalCapacity = 0;

  remainingCapacity = 0;

  constructor(tankName, credentials, totalCapacity, remainingCapacity) {
    super(tankName, process.env.GAS_TANK_TYPE, credentials);
    this.totalCapacity = totalCapacity;
    this.remainingCapacity = remainingCapacity;
  }

  static fromObj({ name, totalCapacity, remainingCapacity, credentials }) {
    return new GasTank(
      name,
      Credentials.fromObj(credentials),
      totalCapacity,
      remainingCapacity
    );
  }

  static async create(tankName, credentials) {
    const gasTank = await Thing.create(tankName, process.env.GAS_TANK_TYPE);
    return new GasTank(gasTank.name, credentials);
  }

  async updateGasMeasurement() {
    const newState = {
      totalCapacity: this.totalCapacity,
      remainingCapacity: this.remainingCapacity,
      lastUpdate: new Date()
    };
    this.updateShadow(newState);
  }
}
