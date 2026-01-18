/**
 * zkLogin Configuration
 */

export const ZKLOGIN_CONFIG = {
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  REDIRECT_URI: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  FULLNODE_URL: process.env.NEXT_PUBLIC_FULLNODE_URL || 'https://fullnode.testnet.sui.io',
  PROVER_URL: process.env.NEXT_PUBLIC_PROVER_URL || 'https://prover-dev.mystenlabs.com/v1',
  SALT_SERVER_URL: process.env.NEXT_PUBLIC_SALT_SERVER_URL || 'https://salt.api.mystenlabs.com/get_salt',
};

export const STORAGE_KEYS = {
  EPHEMERAL_KEY_PAIR: 'ephemeral_key_pair',
  RANDOMNESS: 'randomness',
  MAX_EPOCH: 'max_epoch',
  USER_SALT: 'user_salt',
  JWT_TOKEN: 'jwt_token',
  ZKLOGIN_ADDRESS: 'zklogin_address',
};

