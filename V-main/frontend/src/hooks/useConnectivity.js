import { useState, useEffect } from 'react';

export const useConnectivity = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [latency, setLatency] = useState(0);
    const [status, setStatus] = useState('Checking...'); // Excellent, Good, Poor, Offline

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => {
            setIsOnline(false);
            setStatus('Offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const checkLatency = async () => {
            if (!navigator.onLine) {
                setStatus('Offline');
                setLatency(0);
                return;
            }

            const endpoints = [
                'https://www.google.com/favicon.ico',
                'https://www.cloudflare.com/favicon.ico',
                'https://8.8.8.8' // Ping-like check
            ];

            const start = Date.now();
            let success = false;

            for (const url of endpoints) {
                try {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 3000);

                    await fetch(url, {
                        mode: 'no-cors',
                        cache: 'no-store',
                        signal: controller.signal
                    });

                    clearTimeout(id);
                    success = true;
                    break;
                } catch (err) {
                    continue;
                }
            }

            if (success) {
                const ping = Date.now() - start;
                setLatency(ping);
                if (ping < 200) setStatus('Excellent');
                else if (ping < 500) setStatus('Good');
                else setStatus('Poor');
            } else {
                setLatency(0);
                setStatus(navigator.onLine ? 'Poor' : 'Offline');
            }
        };

        const interval = setInterval(checkLatency, 15000); // Check every 15s
        checkLatency();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    return { isOnline, latency, status };
};
