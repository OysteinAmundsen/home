export interface VerifyTokenResponseDto {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  exp?: number; // Token expiration timestamp
  iat?: number; // Token issued at timestamp
}
