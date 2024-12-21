import express from 'express';
import cors from 'cors';
import { expressjwt } from 'express-jwt';
import jwks from 'jwks-rsa';
import cfg from './envalid.js';

const app = express();

app.use(cors({
  origin: cfg.DASHBOARD_URL || 'http://localhost:3000',
  credentials: true,
}));

const verifyJWT = expressjwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: false,
    jwksUri: `${cfg.AUTH0_DOMAIN}.well-known/jwks.json`,
  }),
  audience: cfg.AUTH0_AUDIENCE,
  issuer: cfg.AUTH0_DOMAIN,
  algorithms: ['RS256'],
});

app.get('/profile', verifyJWT, (req, res) => {
  const token = req.headers.authorization;
  res.json({ token });
});

const port = cfg.SERVICE_PORT;
app.listen(port, () => {
  console.log(`Flying on ${port}`);
});
