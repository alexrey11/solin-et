import Dexie, { Table } from 'dexie';

// ===== TIPOS DE DATOS =====

export interface QueueItem {
    id?: number;
    name: string;
    car: string;
    plate: string;
    waitTime: number;
    chargeTime: number;
    status: 'waiting' | 'charging' | 'done';
    amount: number;
    point?: string;
    createdAt: number;
    finishedAt?: number;
}

export interface Transaction {
    id?: number;
    queueItemId: number;
    amount: number;
    method: 'transfermovil' | 'enzona' | 'efectivo';
    createdAt: number;
    synced: 0 | 1;
}

export interface Solinera {
    id?: number;
    name: string;
    address: string;
    lat: number;
    lng: number;
    pricePerKwh: number;
    points: number;
    phone?: string;
    updatedAt: number;
}

// ===== BASE DE DATOS =====

export class SoliNetDB extends Dexie {
    queue!: Table<QueueItem, number>;
    transactions!: Table<Transaction, number>;
    solineras!: Table<Solinera, number>;

    constructor() {
        super('SoliNetDB');
        this.version(1).stores({
            queue: '++id, status, plate, createdAt',
            transactions: '++id, queueItemId, synced, createdAt',
            solineras: '++id, name, updatedAt'
        });
    }
}

export const db = new SoliNetDB();

// ===== HELPERS =====

export async function seedIfEmpty() {
    const count = await db.queue.count();
    if (count === 0) {
        await db.queue.bulkAdd([
            {
                name: 'Carlos M.',
                car: 'Triciclo Eléctrico',
                plate: 'T-123456',
                waitTime: 0,
                chargeTime: 0,
                status: 'waiting',
                amount: 300,
                createdAt: Date.now()
            },
            {
                name: 'Yordan P.',
                car: 'Motorina',
                plate: 'M-789012',
                waitTime: 0,
                chargeTime: 0,
                status: 'waiting',
                amount: 250,
                createdAt: Date.now()
            }
        ]);
    }
}