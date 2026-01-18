/**
 * zkLogin Type Definitions
 */

export interface JwtPayload {
  iss?: string;
  sub?: string; // Subject ID
  aud?: string[] | string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
}

export interface PartialZkLoginSignature {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
}

export interface ZkLoginState {
  ephemeralKeyPair: string | null; // Serialized Ed25519Keypair
  randomness: string | null;
  maxEpoch: number | null;
  userSalt: string | null;
  jwtToken: string | null;
  zkLoginAddress: string | null;
}

