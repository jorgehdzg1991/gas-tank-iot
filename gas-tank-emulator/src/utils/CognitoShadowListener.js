import axios from 'axios';
import awsIot from 'aws-iot-device-sdk';

const ThingShadow = awsIot.thingShadow;

function getCredentials(email, password) {
  return axios.post(process.env.COGNITO_API_ENDPOINT, { email, password });
}

export default async function setupListener(email, password, deviceName) {
  const response = await getCredentials(email, password);
  const { accessKey, secretKey, token } = response.data.aws;

  const shadowConnection = new ThingShadow({
    clientId: deviceName,
    host: process.env.IOT_ENDPOINT,
    protocol: 'wss',
    accessKeyId: accessKey,
    secretKey,
    sessionToken: token
  });

  shadowConnection.on('connect', () => {
    console.log('connected');
  });
  shadowConnection.on('error', e => {
    console.log('error', e);
  });
  shadowConnection.on('close', () => {
    console.log('closed');
  });
  shadowConnection.on('reconnect', () => {
    console.log('reconnected');
  });
  shadowConnection.on('offline', () => {
    console.log('offline');
  });
}
