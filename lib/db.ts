import Dexie, { Table } from 'dexie';

// ===== TIPOS =====

export interface User {
    id?: number;
    supabaseId?: string;
    role: 'driver' | 'business';
    name: string;
    email: string;
    phone?: string;
    passwordHash: string;
    createdAt: number;
    syncStatus?: 'pending' | 'synced';
}

export interface Session {
    id?: number;
    userId: number;
    role: 'driver' | 'business';
    createdAt: number;
}

export interface QueueItem {
    id?: number;
    name: string;
    car: string;
    plate: string;
    waitTime: number;
    chargeTime: number;
    chargingDuration?: number;
    chargingStartedAt?: number;
    status: 'waiting' | 'charging' | 'done';
    amount: number;
    point?: string;
    createdAt: number;
    finishedAt?: number;
}

export interface Transaction {
    id?: number;
    queueItemId?: number;
    driverName: string;
    plate: string;
    durationMin: number;
    amount: number;
    method: 'transfermovil' | 'enzona' | 'efectivo';
    createdAt: number;
    synced: 0 | 1;
}

export interface ChargePointConfig {
    id: string;
    label: string;
    power: number;
    pricePerKwh: number;
}

export interface Solinera {
    id?: number;
    supabaseId?: string;
    clientUuid?: string;
    userId?: number;
    supabaseUserId?: string;
    name: string;
    owner?: string;
    email?: string;
    address: string;
    phone?: string;
    openingHours?: string;
    closingHours?: string;
    lat: number;
    lng: number;
    pricePerKwh: number;
    reservationFee?: number;
    points: number;
    pointsConfig?: ChargePointConfig[];
    updatedAt: number;
    syncStatus?: 'pending' | 'synced';
}

export interface Driver {
    id?: number;
    supabaseId?: string;
    clientUuid?: string;
    userId?: number;
    supabaseUserId?: string;
    name: string;
    phone: string;
    plate: string;
    car: string;
    createdAt: number;
    syncStatus?: 'pending' | 'synced';
}

export interface Reservation {
    id?: number;
    supabaseId?: string;
    clientUuid?: string;
    driverId: number;
    solineraId: number;
    solineraName: string;
    slot: string;
    amount: number;
    method: 'transfermovil' | 'enzona';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    shortCode: string;
    createdAt: number;
    confirmedAt?: number;
    finishedAt?: number;
    syncStatus?: 'pending' | 'synced';
}

// ===== BASE DE DATOS =====

export class SoliNetDB extends Dexie {
    users!: Table<User, number>;
    session!: Table<Session, number>;
    queue!: Table<QueueItem, number>;
    transactions!: Table<Transaction, number>;
    solineras!: Table<Solinera, number>;
    drivers!: Table<Driver, number>;
    reservations!: Table<Reservation, number>;

    constructor() {
        super('SoliNetDB');
        this.version(12).stores({
            users: '++id, email, role, syncStatus, supabaseId',
            session: '++id, userId, role',
            queue: '++id, status, plate, createdAt',
            transactions: '++id, queueItemId, createdAt, synced',
            solineras:
                '++id, userId, supabaseUserId, clientUuid, name, syncStatus, supabaseId, updatedAt',
            drivers:
                '++id, userId, supabaseUserId, clientUuid, plate, syncStatus, supabaseId',
            reservations:
                '++id, driverId, solineraId, clientUuid, status, syncStatus, supabaseId, shortCode, createdAt',
        });
    }
}

export const db = new SoliNetDB();

// ===== HELPERS =====

export const POWER_OPTIONS = [
    { power: 3.7, label: '3.7 kW · Carga básica', multiplier: 1.0 },
    { power: 7.4, label: '7.4 kW · Carga lenta', multiplier: 1.0 },
    { power: 11, label: '11 kW · Carga media', multiplier: 1.2 },
    { power: 22, label: '22 kW · Carga rápida', multiplier: 1.5 },
    { power: 50, label: '50 kW · Carga ultra rápida', multiplier: 2.0 },
];

export function getPointType(power: number): 'lento' | 'rápido' | 'ultra' {
    if (power < 10) return 'lento';
    if (power < 30) return 'rápido';
    return 'ultra';
}

export function getMultiplier(power: number): number {
    const opt = POWER_OPTIONS.find((o) => o.power === power);
    return opt?.multiplier || 1.0;
}