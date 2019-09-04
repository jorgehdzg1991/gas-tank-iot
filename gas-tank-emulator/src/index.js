import fs from 'fs';
import path from 'path';
import uuid from 'uuid';
import ThingType from './utils/ThingType';
import GasTankRegistration from './utils/GasTankRegistration';
import log from './utils/Logging';
import GasTank from './models/GasTank';

const gasTankDataPath = path.join(__dirname, '../gasTank.json');

function fileExists(filePath) {
  return new Promise(resolve => {
    fs.access(filePath, fs.F_OK, err => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function registerThingType() {
  log('Registering thing type');
  await ThingType.create(
    process.env.GAS_TANK_TYPE,
    'A tank... of gas..... do you really need more explanation?'
  );
  log('Succesfully registered thing type');
}

async function registerGasTank() {
  const tankName = uuid();
  const gasTank = await GasTankRegistration.register(tankName);
  fs.writeFileSync(gasTankDataPath, JSON.stringify(gasTank, null, 2));
  return gasTank;
}

async function getGasTank() {
  if (!(await fileExists(gasTankDataPath))) {
    log('Gas tank is not registered. Registering on AWS IoT');
    const gasTank = await registerGasTank();
    return gasTank;
  }
  log('Gas tank is registered. Retrieving device data.');
  const gasTankData = JSON.parse(
    fs.readFileSync(gasTankDataPath, { encoding: 'utf8' })
  );
  return GasTank.fromObj(gasTankData);
}

(async function init() {
  await registerThingType();
  const gasTank = await getGasTank();
  gasTank.totalCapacity = 100;
  gasTank.remainingCapacity = 80;
  gasTank.updateGasMeasurement();
})();
