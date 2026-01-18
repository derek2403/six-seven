'use client';

import { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import {
    generateEphemeralKeyPair,
    getGoogleAuthURL,
    storage
} from '@/lib/zklogin/utils';

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            // 1. Generate ephemeral key pair
            const { ephemeralKeyPair, randomness, nonce, maxEpoch } = await generateEphemeralKeyPair();

            // 2. Save to storage
            storage.saveEphemeralKeyPair(ephemeralKeyPair);
            storage.saveRandomness(randomness);
            storage.saveMaxEpoch(maxEpoch);

            // 3. Redirect to Google
            const authUrl = getGoogleAuthURL(nonce);
            window.location.href = authUrl;
        } catch (error) {
            console.error('zkLogin initialization failed:', error);
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6 m-4 animate-in zoom-in-95 duration-200 relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl font-bold text-center mb-2">Connect Wallet</h2>
                <p className="text-zinc-500 text-center text-sm mb-8">
                    Choose how you want to connect to Phōcast
                </p>

                <div className="space-y-4">
                    {/* Option 1: Existing Wallet */}
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group relative overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">I have a wallet</h3>
                                <p className="text-xs text-zinc-500">Connect Slush, Phantom, etc.</p>
                            </div>

                            {/* Overlay ConnectButton that fills the container but is invisible-ish or positioned to capture clicks? 
                                Actually, dapp-kit ConnectButton renders a button. We can hide it with opacity 0 and position absolute full width/height
                                OR we can style it to look like this card?
                                The transparent overlay approach is trickier with shadow DOM or button events.
                                
                                Better approach: Just render the ConnectButton here as the primary action.
                            */}
                            <div className="absolute inset-0 opacity-0 cursor-pointer">
                                <ConnectButton className="!w-full !h-full" />
                            </div>
                        </div>
                    </div>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                        <span className="flex-shrink-0 mx-4 text-zinc-300 text-sm">OR</span>
                        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                    </div>

                    {/* Option 2: zkLogin (Google) */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-500 transition-colors flex items-center gap-4 group"
                    >
                        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold">I don't have a wallet</h3>
                            <p className="text-xs text-zinc-500">Sign in with Google (zkLogin)</p>
                        </div>
                        {isLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-500 border-t-transparent"></div>
                        )}
                    </button>
                </div>

                <div className="mt-6 text-center text-xs text-zinc-400">
                    By connecting, you agree to our Terms of Service & Privacy Policy.
                </div>
            </div>
        </div>
    );
}
