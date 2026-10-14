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

// ===== ASEGURAR PERFIL EN SUPABASE =====

async function ensureSupabaseProfile(supabaseUserId: string): Promise<boolean> {
    const supabase = createClient();
    try {
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', supabaseUserId)
            .maybeSingle();

        if (existing) return true;

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase.from('profiles').insert({
            id: supabaseUserId,
            role: user.user_metadata?.role || 'driver',
            name: user.user_metadata?.name || 'Usuario',
            email: user.email,
            phone: user.user_metadata?.phone || null,
        });

        if (error) {
            console.error('[profile] Error creando perfil:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('[profile] Exception ensureSupabaseProfile:', e);
        return false;
    }
}

// ===== DRIVER PROFILE =====

export async function getDriverProfile(userId: number): Promise<Driver | null> {
    const supabaseUserId = await getSupabaseUserId();

    if (supabaseUserId) {
        const bySupabase = await db.drivers
            .where('supabaseUserId')
            .equals(supabaseUserId)
            .first();
        if (bySupabase) {
            if (bySupabase.id && bySupabase.userId !== userId) {
                await db.drivers.update(bySupabase.id, { userId });
                bySupabase.userId = userId;
            }
            return bySupabase;
        }
    }

    const byUserId = await db.drivers.where('userId').equals(userId).first();
    if (byUserId) return byUserId;

    return null;
}

export async function saveDriverProfile(
    userId: number,
    data: Partial<Driver>,
    explicitSupabaseUserId?: string
): Promise<number> {
    const supabaseUserId =
        explicitSupabaseUserId || (await getSupabaseUserId());

    if (supabaseUserId) {
        await ensureSupabaseProfile(supabaseUserId);
    }

    // Buscar existente
    let existing: Driver | undefined;
    if (supabaseUserId) {
        existing = await db.drivers
            .where('supabaseUserId')
            .equals(supabaseUserId)
            .first();
    }
    if (!existing) {
        existing = await db.drivers.where('userId').equals(userId).first();
    }

    let localId: number;
    if (existing && existing.id) {
        await db.drivers.update(existing.id, {
            ...data,
            userId,
            supabaseUserId: supabaseUserId || existing.supabaseUserId,
            syncStatus: 'pending',
        });
        localId = existing.id;
    } else {
        localId = await db.drivers.add({
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

    // ✅ PUSH INMEDIATO a Supabase (evita race condition con el sync)
    if (supabaseUserId) {
        try {
            const supabase = createClient();
            const driver = await db.drivers.get(localId);
            if (driver) {
                const payload = {
                    user_id: supabaseUserId,
                    plate: driver.plate || '',
                    car: driver.car || '',
                };

                const { data: remoteExisting } = await supabase
                    .from('driver_profiles')
                    .select('id')
                    .eq('user_id', supabaseUserId)
                    .maybeSingle();

                let result;
                if (remoteExisting && remoteExisting.id) {
                    result = await supabase
                        .from('driver_profiles')
                        .update(payload)
                        .eq('id', remoteExisting.id)
                        .select()
                        .single();
                } else {
                    result = await supabase
                        .from('driver_profiles')
                        .insert(payload)
                        .select()
                        .single();
                }

                if (result.data) {
                    await db.drivers.update(localId, {
                        supabaseId: result.data.id,
                        supabaseUserId: supabaseUserId,
                        syncStatus: 'synced',
                    });
                }
            }
        } catch (e) {
            console.warn('[saveDriverProfile] Push inmediato falló:', e);
        }
    }

    return localId;
}

// ===== BUSINESS PROFILE =====

export async function getBusinessProfile(
    userId: number
): Promise<Solinera | null> {
    const supabaseUserId = await getSupabaseUserId();

    if (supabaseUserId) {
        const bySupabase = await db.solineras
            .where('supabaseUserId')
            .equals(supabaseUserId)
            .first();
        if (bySupabase) {
            if (bySupabase.id && bySupabase.userId !== userId) {
                await db.solineras.update(bySupabase.id, { userId });
                bySupabase.userId = userId;
            }
            return bySupabase;
        }
    }

    const byUserId = await db.solineras.where('userId').equals(userId).first();
    if (byUserId) return byUserId;

    return null;
}

export async function saveBusinessProfile(
    userId: number,
    data: Partial<Solinera>,
    explicitSupabaseUserId?: string
): Promise<number> {
    const supabaseUserId =
        explicitSupabaseUserId || (await getSupabaseUserId());

    if (supabaseUserId) {
        await ensureSupabaseProfile(supabaseUserId);
    }

    let existing: Solinera | undefined;
    if (supabaseUserId) {
        existing = await db.solineras
            .where('supabaseUserId')
            .equals(supabaseUserId)
            .first();
    }
    if (!existing) {
        existing = await db.solineras.where('userId').equals(userId).first();
    }

    let localId: number;
    if (existing && existing.id) {
        await db.solineras.update(existing.id, {
            ...data,
            userId,
            supabaseUserId: supabaseUserId || existing.supabaseUserId,
            syncStatus: 'pending',
            updatedAt: Date.now(),
        });
        localId = existing.id;
    } else {
        localId = await db.solineras.add({
            userId,
            supabaseUserId: supabaseUserId || undefined,
            name: data.name || 'Mi Solinera',
            address: data.address || 'Sin dirección',
            lat: data.lat || 23.1136,
            lng: data.lng || -82.3666,
            pricePerKwh: data.pricePerKwh || 5,
            reservationFee: data.reservationFee || 10,
            points: data.points || 4,
            pointsConfig: data.pointsConfig,
            openingHours: data.openingHours || '06:00',
            closingHours: data.closingHours || '22:00',
            updatedAt: Date.now(),
            syncStatus: 'pending',
            ...data,
        } as Solinera);
    }

    // ✅ PUSH INMEDIATO a Supabase
    if (supabaseUserId) {
        try {
            const supabase = createClient();
            const solinera = await db.solineras.get(localId);
            if (solinera) {
                const payload = {
                    user_id: supabaseUserId,
                    name: solinera.name,
                    address: solinera.address,
                    lat: solinera.lat,
                    lng: solinera.lng,
                    price_per_kwh: solinera.pricePerKwh,
                    points: solinera.points,
                    opening_hours: solinera.openingHours,
                    closing_hours: solinera.closingHours,
                    phone: solinera.phone,
                };

                const { data: remoteExisting } = await supabase
                    .from('solineras')
                    .select('id')
                    .eq('user_id', supabaseUserId)
                    .maybeSingle();

                let result;
                if (remoteExisting && remoteExisting.id) {
                    result = await supabase
                        .from('solineras')
                        .update(payload)
                        .eq('id', remoteExisting.id)
                        .select()
                        .single();
                } else {
                    result = await supabase
                        .from('solineras')
                        .insert(payload)
                        .select()
                        .single();
                }

                if (result.data) {
                    await db.solineras.update(localId, {
                        supabaseId: result.data.id,
                        supabaseUserId: supabaseUserId,
                        syncStatus: 'synced',
                    });
                }
            }
        } catch (e) {
            console.warn('[saveBusinessProfile] Push inmediato falló:', e);
        }
    }

    return localId;
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