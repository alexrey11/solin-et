import { createClient } from '@/lib/supabase/client';
import { db, Driver, Solinera, Reservation } from './db';

// ===== HELPER: OBTENER supabaseUserId =====

async function getSupabaseUserId(): Promise<string | null> {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
}

// ===== DRIVER PROFILE =====

export async function getDriverProfile(userId: number): Promise<Driver | null> {
    // 1. Buscar por userId local
    let driver = await db.drivers.where('userId').equals(userId).first();
    if (driver) return driver;

    // 2. Buscar por supabaseUserId
    const supabaseUserId = await getSupabaseUserId();
    if (supabaseUserId) {
        driver = await db.drivers
            .where('supabaseUserId')
            .equals(supabaseUserId)
            .first();
        if (driver) {
            // Asignar userId local para futuras búsquedas
            if (driver.id && !driver.userId) {
                await db.drivers.update(driver.id, { userId });
                driver.userId = userId;
            }
            return driver;
        }
    }

    return null;
}

export async function saveDriverProfile(
    userId: number,
    data: Partial<Driver>
): Promise<number> {
    const supabaseUserId = await getSupabaseUserId();

    // 1. Buscar por userId local
    let existing = await db.drivers.where('userId').equals(userId).first();

    // 2. Buscar por supabaseUserId
    if (!existing && supabaseUserId) {
        existing = await db.drivers
            .where('supabaseUserId')
            .equals(supabaseUserId)
            .first();
    }

    // 3. Buscar por supabaseId remoto
    if (!existing && supabaseUserId) {
        const supa = createClient();
        const { data } = await supa
            .from('driver_profiles')
            .select('id')
            .eq('user_id', supabaseUserId)
            .maybeSingle();

        if (data?.id) {
            existing = await db.drivers.where('supabaseId').equals(data.id).first();
        }
    }

    if (existing && existing.id) {
        await db.drivers.update(existing.id, {
            ...data,
            userId,
            supabaseUserId: supabaseUserId || existing.supabaseUserId,
            syncStatus: 'pending',
        });
        return existing.id;
    } else {
        return await db.drivers.add({
            userId,
            supabaseUserId: supabaseUserId || undefined,
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
    // 1. Buscar por userId local
    let solinera = await db.solineras.where('userId').equals(userId).first();
    if (solinera) return solinera;

    // 2. Buscar por supabaseUserId
    const supabaseUserId = await getSupabaseUserId();
    if (supabaseUserId) {
        solinera = await db.solineras
            .where('supabaseUserId')
            .equals(supabaseUserId)
            .first();
        if (solinera) {
            if (solinera.id && !solinera.userId) {
                await db.solineras.update(solinera.id, { userId });
                solinera.userId = userId;
            }
            return solinera;
        }
    }

    return null;
}

export async function saveBusinessProfile(
    userId: number,
    data: Partial<Solinera>
): Promise<number> {
    const supabaseUserId = await getSupabaseUserId();

    let existing = await db.solineras.where('userId').equals(userId).first();

    if (!existing && supabaseUserId) {
        existing = await db.solineras
            .where('supabaseUserId')
            .equals(supabaseUserId)
            .first();
    }

    if (!existing && supabaseUserId) {
        const supa = createClient();
        const { data: supaData } = await supa
            .from('solineras')
            .select('id')
            .eq('user_id', supabaseUserId)
            .maybeSingle();

        if (supaData?.id) {
            existing = await db.solineras
                .where('supabaseId')
                .equals(supaData.id)
                .first();
        }
    }

    if (existing && existing.id) {
        await db.solineras.update(existing.id, {
            ...data,
            userId,
            supabaseUserId: supabaseUserId || existing.supabaseUserId,
            syncStatus: 'pending',
            updatedAt: Date.now(),
        });
        return existing.id;
    } else {
        return await db.solineras.add({
            userId,
            supabaseUserId: supabaseUserId || undefined,
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
    const list = await db.reservations
        .where('driverId')
        .equals(driverId)
        .toArray();
    return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function cancelReservation(id: number): Promise<void> {
    await db.reservations.update(id, {
        status: 'cancelled',
        syncStatus: 'pending',
    });
}