import fs from 'fs';
import path from 'path';
import uuid from 'uuid';
import ThingType from './utils/ThingType';
import GasTankRegistration from './utils/GasTankRegistration';
import log from './utils/Logging';
import GasTank from './models/GasTank';
// import setupListener from './utils/CognitoShadowListener';

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

  if (process.argv[2] === 'register') {
    await registerGasTank();
  } else if (process.argv[2] === 'send-status') {
    let totalCapacity;
    let remainingCapacity;

    for (let i = 3; i < process.argv.length; i += 1) {
      const option = process.argv[i];
      if (option.startsWith('--total')) {
        totalCapacity = parseInt(option.split(':')[1], 10);
      } else if (option.startsWith('--remaining')) {
        remainingCapacity = parseInt(option.split(':')[1], 10);
      }
    }

    if (!totalCapacity || !remainingCapacity) {
      throw new Error('Missing total or remaining capacity options.');
    }

    gasTank.totalCapacity = totalCapacity;
    gasTank.remainingCapacity = remainingCapacity;
    // await setupListener('edgar@mail.com', '12345678', gasTank.name);
    await gasTank.updateGasMeasurement();
  } else {
    throw new Error('unknown operation');
  }
})();
