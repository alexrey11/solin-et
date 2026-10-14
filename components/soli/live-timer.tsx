'use client';

import * as React from 'react';

export function LiveTimer({ startTime }: { startTime: number }) {
    const [elapsed, setElapsed] = React.useState(0);

    React.useEffect(() => {
        const update = () => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    return (
        <span className="font-mono font-semibold">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
    );
}