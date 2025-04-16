import * as jwt from 'jsonwebtoken';
import { StringValue } from 'ms';

export enum JwtAge {
  SHORT = '5m',
  MEDIUM = '1h',
  LONG = '1y',
}

export class JWTHandler {
  private readonly hostname = process.env.DOMAIN || 'localhost';
  private readonly secret = process.env.JWT_SECRET || 'secret';

  verify(
    tokenData: string,
    tokenKey: jwt.Secret | jwt.PublicKey,
    options: jwt.VerifyOptions & {
      complete: true;
    },
  ) {
    // Assign defaults
    options = Object.assign({ issuer: this.hostname, audience: this.hostname, maxAge: JwtAge.SHORT }, options);
    return new Promise((resolve, reject) => {
      try {
        const result = jwt.verify(tokenData, tokenKey, options);
        resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }

  sign(tokenData: object, expiration: StringValue | number): Promise<string> {
    return new Promise((resolve, reject) => {
      tokenData = Object.assign({ iss: this.hostname, aud: this.hostname }, tokenData);
      jwt.sign(tokenData, this.secret, { expiresIn: expiration }, (err: Error | null, jwtData: string | undefined) => {
        if (err) return reject(err);
        resolve(jwtData as string);
      });
    });
  }

  decode(tokenData: string, options: jwt.DecodeOptions & { complete: true }): Promise<null | jwt.Jwt> {
    options = Object.assign({}, options);
    return new Promise((resolve, reject) => {
      try {
        const result = jwt.decode(tokenData, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
}
