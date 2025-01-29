export type RegisterRequestBody = {
  credential: RegisterRequestCredential;
};

export interface RegisterRequestCredential {
  rawId: string;
  response: RegisterRequestCredentialResponse;
}

export interface RegisterRequestCredentialResponse {
  attestationObject: string;
  clientDataJSON: string;
}
