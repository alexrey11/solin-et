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
    supabaseId?: string;
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
    updatedAt: number;
    syncStatus?: 'pending' | 'synced';
}

export interface Driver {
    id?: number;
    supabaseId?: string;
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
        this.version(9).stores({
            users: '++id, email, role, syncStatus, supabaseId',
            session: '++id, userId, role',
            queue: '++id, status, plate, createdAt',
            transactions: '++id, queueItemId, synced, createdAt',
            solineras:
                '++id, userId, supabaseUserId, name, syncStatus, supabaseId, updatedAt',
            drivers:
                '++id, userId, supabaseUserId, plate, syncStatus, supabaseId',
            reservations:
                '++id, driverId, solineraId, status, syncStatus, supabaseId, shortCode, createdAt',
        });
    }
}

export const db = new SoliNetDB();

// ✅ seedIfEmpty ELIMINADO: no más vehículos de prueba