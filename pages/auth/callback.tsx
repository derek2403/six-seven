import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    storage,
    decodeJwt,
    getUserSalt,
    getZkLoginAddress,
    getZkProof
} from '@/lib/zklogin/utils';

export default function AuthCallback() {
    const router = useRouter();
    const [status, setStatus] = useState<string>('Processing authentication...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Step 1: Extract JWT from URL fragment
                setStatus('Extracting JWT token...');
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const idToken = params.get('id_token');

                if (!idToken) {
                    throw new Error('No JWT token found in callback URL');
                }

                // Step 2: Decode JWT
                setStatus('Decoding JWT...');
                const decodedJwt = decodeJwt(idToken);
                console.log('Decoded JWT:', decodedJwt);

                // Step 3: Load ephemeral key pair from session storage
                setStatus('Loading ephemeral key pair...');
                const ephemeralKeyPair = storage.loadEphemeralKeyPair();
                const randomness = storage.loadRandomness();
                const maxEpoch = storage.loadMaxEpoch();

                if (!ephemeralKeyPair || !randomness || maxEpoch === null) {
                    throw new Error('Missing ephemeral key pair data. Please try logging in again.');
                }

                // Step 4: Get or create user salt
                setStatus('Getting user salt...');
                let userSalt = storage.loadUserSalt();

                if (!userSalt) {
                    // First time login - get salt (will use fallback if server unavailable)
                    console.log('🔐 First time login - generating user salt...');
                    userSalt = await getUserSalt(idToken);
                    storage.saveUserSalt(userSalt);
                    console.log('✅ User salt saved to localStorage');
                } else {
                    console.log('✅ Using existing user salt from localStorage');
                }

                // Step 5: Derive zkLogin address
                setStatus('Deriving zkLogin address...');
                const zkLoginAddress = getZkLoginAddress(idToken, userSalt);
                console.log('✅ zkLogin address derived:', zkLoginAddress);

                // Step 6: Get zero-knowledge proof
                // Note: For "just show login" we mainly need the address. 
                // Generatng the proof can be skipped/deferred or done here.
                // We'll attempt it but not block login on it heavily to keep it snappy if key is valid.
                setStatus('Generating zero-knowledge proof (this may take 3-10 seconds)...');
                try {
                    console.log('🔄 Requesting zero-knowledge proof from prover service...');
                    const zkProof = await getZkProof(
                        idToken,
                        ephemeralKeyPair,
                        maxEpoch,
                        randomness,
                        userSalt
                    );
                    console.log('✅ Zero-knowledge proof obtained successfully');

                    // Store the proof in session storage for later use
                    sessionStorage.setItem('zk_proof', JSON.stringify(zkProof));
                } catch (proofError) {
                    console.error('❌ Error getting ZK proof:', proofError);
                    console.warn('⚠️ Continuing without ZK proof - will generate on first transaction');
                }

                // Step 7: Save authentication data
                storage.saveJwtToken(idToken);
                storage.saveZkLoginAddress(zkLoginAddress);

                // Step 8: Redirect to home
                setStatus('Authentication successful! Redirecting...');
                setTimeout(() => {
                    router.push('/');
                }, 1000);

            } catch (err) {
                console.error('Authentication error:', err);
                setError(err instanceof Error ? err.message : 'Authentication failed');

                // Clear potentially corrupted data
                storage.clearAll();

                // Redirect back to home after showing error
                setTimeout(() => {
                    router.push('/');
                }, 3000);
            }
        };

        // Only run if window exists and hash is present
        if (typeof window !== 'undefined' && window.location.hash) {
            processCallback();
        }
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="max-w-md w-full p-8 bg-zinc-900 rounded-lg border border-zinc-800">
                <div className="flex flex-col items-center gap-4">
                    {error ? (
                        <>
                            <div className="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-white">Authentication Failed</h2>
                            <p className="text-red-400 text-center">{error}</p>
                            <p className="text-zinc-500 text-sm text-center">Redirecting to home page...</p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h2 className="text-xl font-semibold text-white">Processing Authentication</h2>
                            <p className="text-zinc-400 text-center">{status}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
