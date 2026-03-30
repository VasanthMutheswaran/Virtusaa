import React, { useEffect, useRef, useState } from 'react';
import { createStompClient, disconnectStomp } from '../../services/websocket';
import { Monitor } from 'lucide-react';

/**
 * Subscribes to /topic/screen/{sessionId} via WebSocket and renders
 * the latest received screen frame as a live JPEG image.
 */
export default function LiveScreenFeed({ sessionId, candidateName }) {
    const [latestFrame, setLatestFrame] = useState(null);
    const [connected, setConnected] = useState(false);
    const stompClientRef = useRef(null);

    useEffect(() => {
        if (!sessionId) return;

        const client = createStompClient((connectedClient) => {
            setConnected(true);
            connectedClient.subscribe(`/topic/screen/${sessionId}`, (message) => {
                setLatestFrame(message.body);
            });
        });

        stompClientRef.current = client;

        return () => {
            disconnectStomp(stompClientRef.current);
            setConnected(false);
        };
    }, [sessionId]);

    return (
        <div className="w-full aspect-video bg-gray-900 rounded-md overflow-hidden relative flex items-center justify-center group">
            {latestFrame ? (
                <>
                    <img
                        src={latestFrame}
                        alt={`${candidateName}'s screen`}
                        className="w-full h-full object-contain"
                    />
                    {/* Live badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                        Live
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <Monitor size={28} className="text-gray-600" />
                    <p className="text-[11px] font-semibold text-center px-2">
                        {connected ? 'Waiting for screen share…' : 'Connecting…'}
                    </p>
                </div>
            )}
        </div>
    );
}
