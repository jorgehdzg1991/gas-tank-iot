global.fetch = require('node-fetch');
const AWS = require('aws-sdk');
const express = require('express');
const {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool
} = require('amazon-cognito-identity-js');
const {
  OK,
  FORBIDDEN,
  METHOD_NOT_ALLOWED,
  INTERNAL_SERVER_ERROR
} = require('http-status-codes');
const jwtDecode = require('jwt-decode');

const router = express.Router();
const userPool = new CognitoUserPool({
  UserPoolId: process.env.USER_POOL_ID,
  ClientId: process.env.APP_CLIENT_ID
});

function getAuthDetails(email, password) {
  return new AuthenticationDetails({
    Username: email,
    Password: password
  });
}

function getCognitoUser(email) {
  return new CognitoUser({
    Username: email,
    Pool: userPool
  });
}

function getCredentialsObject(poolId, region, userpoolId, jwt) {
  const credentials = new AWS.CognitoIdentityCredentials(
    {
      IdentityPoolId: poolId,
      Logins: {
        [`cognito-idp.${region}.amazonaws.com/${userpoolId}`]: jwt
      }
    },
    {
      region
    }
  );
  return credentials;
}

function dateToSeconds(date) {
  return Math.floor(date.getTime() / 1000);
}

function loginResponseBody(creds, jwt, refresh) {
  const seconds = dateToSeconds(new Date());
  return {
    time: seconds,
    aws: {
      accessKey: creds.accessKeyId,
      secretKey: creds.secretAccessKey,
      token: creds.sessionToken,
      exp: dateToSeconds(creds.expireTime)
    },
    jwt: {
      token: jwt,
      exp: jwtDecode(jwt).exp
    },
    refresh: {
      token: refresh
    },
    userId: creds.identityId
  };
}

function getAwsCredentials(user) {
  return new Promise((resolve, reject) => {
    user.getSession((sessionErrMsg, data) => {
      if (sessionErrMsg) {
        reject(sessionErrMsg);
      }
      const jwt = data.getIdToken().getJwtToken();
      const refresh = data.getRefreshToken().getToken();
      const creds = getCredentialsObject(
        process.env.IDENTITY_POOL_ID,
        process.env.AWS_REGION,
        process.env.USER_POOL_ID,
        jwt
      );

      creds.get(errMsg => {
        if (!errMsg) {
          resolve(loginResponseBody(creds, jwt, refresh));
        } else {
          reject(errMsg);
        }
      });
    });
  });
}

function respond(res, status, data, contentType = 'application/json') {
  res.writeHead(status, {
    'Content-Type': contentType
  });
  res.end(JSON.stringify(data));
}

router.post('/', (req, res) => {
  const { email, password } = req.body;
  const cognitoUser = getCognitoUser(email, userPool);
  cognitoUser.authenticateUser(getAuthDetails(email, password), {
    onSuccess: () => {
      getAwsCredentials(cognitoUser).then(
        credentials => {
          console.log(`Successful Login for: ${email}`);
          respond(res, OK, credentials);
        },
        error => {
          console.log(error);
          respond(res, FORBIDDEN, 'Invalid username or password');
        }
      );
    },
    onFailure: error => {
      if (error.code === 'UserNotConfirmedException') {
        respond(res, METHOD_NOT_ALLOWED, 'User needs to confirm email address');
      } else if (error.code === 'PasswordResetRequiredException') {
        respond(res, METHOD_NOT_ALLOWED, 'User needs to reset password');
      } else if (
        error.code === 'NotAuthorizedException' ||
        error.code === 'ResourceNotFoundException' ||
        error.code === 'UserNotFoundException'
      ) {
        respond(res, FORBIDDEN, 'Invalid username or password');
      } else {
        respond(res, INTERNAL_SERVER_ERROR, 'Unknown Error');
      }
    }
  });
});

module.exports = router;
