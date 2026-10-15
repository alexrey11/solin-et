'use client';

import * as React from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

const CURRENT_VERSION = '1.0.0';

export function VersionCheck() {
    React.useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const check = async () => {
            try {
                const res = await fetch(
                    `https://www.solinet.de5.net/version.json?t=${Date.now()}`
                );
                const data = await res.json();

                if (data.version && data.version !== CURRENT_VERSION) {
                    toast.info(
                        `Nueva versión ${data.version} disponible. Actualiza desde Apklis.`,
                        {
                            duration: 15000,
                            action: {
                                label: 'Abrir Apklis',
                                onClick: () => window.open(data.url, '_blank'),
                            },
                        }
                    );
                }
            } catch (e) {
                // Silencioso si falla
            }
        };

        check();
    }, []);

    return null;
}