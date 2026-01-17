import type { NextApiRequest, NextApiResponse } from 'next';

const TEE_URL = 'http://44.211.226.223:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Support dynamic endpoint: process_data, resolve, health_check, etc.
        const endpoint = req.body.endpoint || 'process_data';
        const payload = req.body.payload || req.body;

        // health_check is a GET endpoint, others are POST
        const isHealthCheck = endpoint === 'health_check';

        const response = await fetch(`${TEE_URL}/${endpoint}`, {
            method: isHealthCheck ? 'GET' : 'POST',
            headers: isHealthCheck ? {} : { 'Content-Type': 'application/json' },
            body: isHealthCheck ? undefined : JSON.stringify({ payload }),
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error: any) {
        console.error('TEE proxy error:', error);
        return res.status(500).json({ error: 'Failed to connect to TEE', details: error.message });
    }
}
