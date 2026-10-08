import { db, Driver, Solinera, Reservation } from './db';

// ===== DRIVER PROFILE =====

export async function getDriverProfile(userId: number): Promise<Driver | null> {
    const driver = await db.drivers.where('userId').equals(userId).first();
    return driver || null;
}

export async function saveDriverProfile(
    userId: number,
    data: Partial<Driver>
): Promise<number> {
    const existing = await getDriverProfile(userId);

    if (existing && existing.id) {
        await db.drivers.update(existing.id, {
            ...data,
            syncStatus: 'pending',
        });
        return existing.id;
    } else {
        return await db.drivers.add({
            userId,
            name: data.name || '',
            phone: data.phone || '',
            plate: data.plate || '',
            car: data.car || 'Triciclo Eléctrico',
            createdAt: Date.now(),
            syncStatus: 'pending',
        } as Driver);
    }
}

// ===== BUSINESS PROFILE =====

export async function getBusinessProfile(
    userId: number
): Promise<Solinera | null> {
    const solinera = await db.solineras.where('userId').equals(userId).first();
    return solinera || null;
}

export async function saveBusinessProfile(
    userId: number,
    data: Partial<Solinera>
): Promise<number> {
    const existing = await getBusinessProfile(userId);

    if (existing && existing.id) {
        await db.solineras.update(existing.id, {
            ...data,
            syncStatus: 'pending',
            updatedAt: Date.now(),
        });
        return existing.id;
    } else {
        return await db.solineras.add({
            userId,
            name: data.name || 'Mi Solinera',
            address: data.address || 'Sin dirección',
            lat: data.lat || 23.1136,
            lng: data.lng || -82.3666,
            pricePerKwh: data.pricePerKwh || 5,
            reservationFee: data.reservationFee || 10,
            points: data.points || 4,
            openingHours: data.openingHours || '06:00',
            closingHours: data.closingHours || '22:00',
            updatedAt: Date.now(),
            syncStatus: 'pending',
            ...data,
        } as Solinera);
    }
}

// ===== RESERVATIONS =====

// Genera un código corto único, fácil de leer
// Sin caracteres ambiguos: sin O, 0, I, 1, L
function generateShortCode(): string {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
}

export async function createReservation(
    data: Omit<
        Reservation,
        'id' | 'createdAt' | 'status' | 'syncStatus' | 'shortCode'
    >
): Promise<number> {
    // Generar código único (reintentar si ya existe)
    let shortCode = generateShortCode();
    let attempts = 0;
    while (attempts < 10) {
        const existing = await db.reservations
            .where('shortCode')
            .equals(shortCode)
            .first();
        if (!existing) break;
        shortCode = generateShortCode();
        attempts++;
    }

    return await db.reservations.add({
        ...data,
        shortCode,
        status: 'pending',
        createdAt: Date.now(),
        syncStatus: 'pending',
    } as Reservation);
}

export async function getReservationsByDriver(
    driverId: number
): Promise<Reservation[]> {
    const list = await db.reservations.where('driverId').equals(driverId).toArray();
    return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function cancelReservation(id: number): Promise<void> {
    await db.reservations.update(id, {
        status: 'cancelled',
        syncStatus: 'pending',
    });
}