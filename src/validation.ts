import got from 'got';
import jwkToPem from 'jwk-to-pem';
import cfg from './envalid.js';

const jwksCache = new Map();

async function getJWKS() {
  if (jwksCache.has('keys')) {
    return jwksCache.get('keys');
  }

  const response = await got
    .get(`${cfg.AUTH0_DOMAIN}.well-known/jwks.json`)
    .json();

  const keys = response.keys.map((key) => ({
    ...key,
    publicKey: jwkToPem(key),
  }));

  jwksCache.set('keys', keys);
  return keys;
}

export const jwtValidationObject = {
  decode: { complete: true },
  secret: async (request, token) => {
    const decoded = token.header;
    const keys = await getJWKS();
    const key = keys.find((k) => k.kid === decoded.kid);

    if (!key) {
      throw new Error('Unknown key');
    }

    return key.publicKey || key;
  },
  verify: {
    allowedAud: cfg.AUTH0_AUDIENCE,
    allowedIss: cfg.AUTH0_DOMAIN,
    algorithms: ['RS256'],
  },
};
