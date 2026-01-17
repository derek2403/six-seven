import type { NextApiRequest, NextApiResponse } from 'next';

const TEE_URL = 'http://100.24.10.33:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Support dynamic endpoint: process_data, resolve, health_check, positions, etc.
        const endpoint = req.body.endpoint || 'process_data';
        const payload = req.body.payload || req.body;

        // GET endpoints: health_check, positions, get_attestation
        const isGetEndpoint = ['health_check', 'positions', 'get_attestation'].includes(endpoint);

        let url = `${TEE_URL}/${endpoint}`;

        // Add query params for GET endpoints that need them
        if (endpoint === 'positions' && payload?.pool_id !== undefined) {
            url += `?pool_id=${payload.pool_id}`;
        }

        const response = await fetch(url, {
            method: isGetEndpoint ? 'GET' : 'POST',
            headers: isGetEndpoint ? {} : { 'Content-Type': 'application/json' },
            body: isGetEndpoint ? undefined : JSON.stringify({ payload }),
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return res.status(200).json(data);
        } catch {
            return res.status(200).json({ raw: text });
        }
    } catch (error: any) {
        console.error('TEE proxy error:', error);
        return res.status(500).json({ error: 'Failed to connect to TEE', details: error.message });
    }
}
