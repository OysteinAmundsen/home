import * as jwt from 'jsonwebtoken';
import { StringValue } from 'ms';

export enum JwtAge {
  SHORT = '5m',
  MEDIUM = '1h',
  LONG = '1y',
}

export class JWTHandler {
  hostname = process.env.DOMAIN || 'localhost';

  verify(
    tokenData: string,
    tokenKey: jwt.Secret | jwt.PublicKey,
    options: jwt.VerifyOptions & {
      complete: true;
    },
  ) {
    // Assign defaults
    options = Object.assign(
      {
        issuer: this.hostname,
        audience: this.hostname,
        maxAge: JwtAge.SHORT,
      },
      options,
    );
    return new Promise((resolve, reject) => {
      try {
        const result = jwt.verify(tokenData, tokenKey, options);
        resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }

  sign(
    tokenData: object,
    tokenKey: jwt.Secret | jwt.PrivateKey,
    expiration: StringValue | number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      tokenData = Object.assign(
        {
          iss: this.hostname,
          aud: this.hostname,
        },
        tokenData,
      );

      jwt.sign(
        tokenData,
        tokenKey,
        {
          expiresIn: expiration,
        },
        (err: Error | null, jwtData: string | undefined) => {
          if (err) return reject(err);
          resolve(jwtData as string);
        },
      );
    });
  }

  decode(
    tokenData: string,
    options: jwt.DecodeOptions & {
      complete: true;
    },
  ): Promise<null | jwt.Jwt> {
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
