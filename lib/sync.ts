import { createClient } from '@/lib/supabase/client';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// ===== TIPOS =====

export interface SyncResult {
    pushed: number;
    pulled: number;
    errors: string[];
}

// ===== UTILIDADES =====

function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
}

function log(msg: string) {
    console.log(`[Sync] ${msg}`);
}

function error(msg: string, err?: any) {
    console.error(`[Sync] ${msg}`, err);
}

// ===== PUSH: Enviar cambios locales a Supabase =====

async function pushToSupabase(): Promise<{ count: number; errors: string[] }> {
    const supabase = createClient();
    const errors: string[] = [];
    let pushed = 0;

    // 1. Sync solineras
    try {
        const pendingSolineras = await db.solineras
            .where('syncStatus')
            .equals('pending')
            .toArray();

        log(`Solineras pendientes: ${pendingSolineras.length}`);

        for (const solinera of pendingSolineras) {
            const { id, syncStatus, supabaseId, userId, ...rest } = solinera;

            log(`Procesando solinera local ID=${id}, supabaseId=${supabaseId || 'NINGUNO'}`);

            const payload: any = {
                name: rest.name,
                address: rest.address,
                lat: rest.lat,
                lng: rest.lng,
                price_per_kwh: rest.pricePerKwh,
                points: rest.points,
                opening_hours: rest.openingHours,
                closing_hours: rest.closingHours,
                phone: rest.phone,
            };

            let result;
            if (supabaseId) {
                log(`→ UPDATE en Supabase id=${supabaseId}`);
                result = await supabase
                    .from('solineras')
                    .update(payload)
                    .eq('id', supabaseId)
                    .select()
                    .single();
            } else {
                log(`→ INSERT en Supabase (nueva)`);
                result = await supabase
                    .from('solineras')
                    .insert(payload)
                    .select()
                    .single();
            }

            if (result.error) {
                console.error('[Sync] Error solinera:', result.error);
                errors.push(`Solinera ${id}: ${result.error.message}`);
                continue;
            }

            await db.solineras.update(id!, {
                supabaseId: result.data.id,
                syncStatus: 'synced',
            });

            const check = await db.solineras.get(id!);
            log(`→ Verificación: supabaseId=${check?.supabaseId}, syncStatus=${check?.syncStatus}`);

            pushed++;
        }
    } catch (err: any) {
        console.error('[Sync] Exception solineras:', err);
        errors.push(`Exception solineras: ${err.message}`);
    }

    // 2. Sync drivers
    try {
        const pendingDrivers = await db.drivers
            .where('syncStatus')
            .equals('pending')
            .toArray();

        log(`Drivers pendientes: ${pendingDrivers.length}`);

        for (const driver of pendingDrivers) {
            const { id, syncStatus, supabaseId, userId, ...rest } = driver;

            const payload: any = {
                plate: rest.plate,
                car: rest.car,
            };

            let result;
            if (supabaseId) {
                result = await supabase
                    .from('driver_profiles')
                    .update(payload)
                    .eq('id', supabaseId)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('driver_profiles')
                    .insert(payload)
                    .select()
                    .single();
            }

            if (result.error) {
                console.error('[Sync] Error driver:', result.error);
                errors.push(`Driver ${id}: ${result.error.message}`);
                continue;
            }

            await db.drivers.update(id!, {
                supabaseId: result.data.id,
                syncStatus: 'synced',
            });
            pushed++;
            log(`Driver ${id} sincronizado → ${result.data.id}`);
        }
    } catch (err: any) {
        console.error('[Sync] Exception drivers:', err);
        errors.push(`Exception drivers: ${err.message}`);
    }

    // 3. Sync reservations
    try {
        const pendingReservations = await db.reservations
            .where('syncStatus')
            .equals('pending')
            .toArray();

        log(`Reservas pendientes: ${pendingReservations.length}`);

        for (const reservation of pendingReservations) {
            const { id, syncStatus, supabaseId, driverId, solineraId, ...rest } = reservation;

            const driver = await db.drivers.get(driverId);
            const solinera = await db.solineras.get(solineraId);

            if (!driver?.supabaseId) {
                errors.push(`Reserva ${id}: driver sin supabaseId`);
                continue;
            }
            if (!solinera?.supabaseId) {
                errors.push(`Reserva ${id}: solinera sin supabaseId`);
                continue;
            }

            const payload: any = {
                driver_id: driver.supabaseId,
                solinera_id: solinera.supabaseId,
                slot: rest.slot,
                amount: rest.amount,
                payment_method: rest.method,
                status: rest.status,
            };

            let result;
            if (supabaseId) {
                result = await supabase
                    .from('charge_requests')
                    .update(payload)
                    .eq('id', supabaseId)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('charge_requests')
                    .insert(payload)
                    .select()
                    .single();
            }

            if (result.error) {
                console.error('[Sync] Error reserva:', result.error);
                errors.push(`Reserva ${id}: ${result.error.message}`);
                continue;
            }

            await db.reservations.update(id!, {
                supabaseId: result.data.id,
                syncStatus: 'synced',
            });
            pushed++;
            log(`Reserva ${id} sincronizada → ${result.data.id}`);
        }
    } catch (err: any) {
        console.error('[Sync] Exception reservations:', err);
        errors.push(`Exception reservations: ${err.message}`);
    }

    return { count: pushed, errors };
}

// ===== PULL: Traer cambios de Supabase a Dexie =====

async function pullFromSupabase(): Promise<{ count: number; errors: string[] }> {
    const supabase = createClient();
    const errors: string[] = [];
    let pulled = 0;

    // 1. Pull solineras
    try {
        const { data: solineras, error: solinerasError } = await supabase
            .from('solineras')
            .select('*');

        if (solinerasError) {
            errors.push(`Pull solineras: ${solinerasError.message}`);
        } else if (solineras) {
            log(`Pull: ${solineras.length} solineras en Supabase`);

            for (const remote of solineras) {
                const existingBySupabaseId = await db.solineras
                    .where('supabaseId')
                    .equals(remote.id)
                    .first();

                if (existingBySupabaseId && existingBySupabaseId.id) {
                    if (existingBySupabaseId.syncStatus === 'pending') {
                        log(`Solinera ${remote.id}: local pendiente, se omite pull`);
                        continue;
                    }

                    await db.solineras.update(existingBySupabaseId.id, {
                        name: remote.name,
                        address: remote.address,
                        lat: remote.lat,
                        lng: remote.lng,
                        pricePerKwh: remote.price_per_kwh,
                        points: remote.points,
                        openingHours: remote.opening_hours,
                        closingHours: remote.closing_hours,
                        phone: remote.phone,
                        updatedAt: new Date(remote.updated_at).getTime(),
                        syncStatus: 'synced',
                    });
                    pulled++;
                } else {
                    await db.solineras.add({
                        supabaseId: remote.id,
                        name: remote.name,
                        address: remote.address,
                        lat: remote.lat,
                        lng: remote.lng,
                        pricePerKwh: remote.price_per_kwh,
                        points: remote.points,
                        openingHours: remote.opening_hours,
                        closingHours: remote.closing_hours,
                        phone: remote.phone,
                        updatedAt: new Date(remote.updated_at).getTime(),
                        syncStatus: 'synced',
                    });
                    pulled++;
                    log(`Solinera ${remote.id}: nueva local (bajada)`);
                }
            }
        }
    } catch (err: any) {
        error('Error pulling solineras', err);
        errors.push(`Exception pull solineras: ${err.message}`);
    }

    // 2. Pull driver_profiles
    try {
        const { data: drivers, error: driversError } = await supabase
            .from('driver_profiles')
            .select('*');

        if (driversError) {
            errors.push(`Pull drivers: ${driversError.message}`);
        } else if (drivers) {
            log(`Pull: ${drivers.length} drivers en Supabase`);

            for (const remote of drivers) {
                const existing = await db.drivers
                    .where('supabaseId')
                    .equals(remote.id)
                    .first();

                if (existing && existing.id) {
                    if (existing.syncStatus === 'pending') continue;

                    await db.drivers.update(existing.id, {
                        plate: remote.plate,
                        car: remote.car,
                        syncStatus: 'synced',
                    });
                    pulled++;
                } else {
                    await db.drivers.add({
                        supabaseId: remote.id,
                        name: '',
                        phone: '',
                        plate: remote.plate,
                        car: remote.car,
                        createdAt: new Date(remote.updated_at).getTime(),
                        syncStatus: 'synced',
                    });
                    pulled++;
                }
            }
        }
    } catch (err: any) {
        error('Error pulling drivers', err);
        errors.push(`Exception pull drivers: ${err.message}`);
    }

    // 3. Pull charge_requests
    try {
        const { data: requests, error: requestsError } = await supabase
            .from('charge_requests')
            .select('*');

        if (requestsError) {
            errors.push(`Pull reservations: ${requestsError.message}`);
        } else if (requests) {
            log(`Pull: ${requests.length} reservas en Supabase`);

            for (const remote of requests) {
                const driver = await db.drivers
                    .where('supabaseId')
                    .equals(remote.driver_id)
                    .first();

                const solinera = await db.solineras
                    .where('supabaseId')
                    .equals(remote.solinera_id)
                    .first();

                const existing = await db.reservations
                    .where('supabaseId')
                    .equals(remote.id)
                    .first();

                const localData = {
                    supabaseId: remote.id,
                    driverId: driver?.id || 0,
                    solineraId: solinera?.id || 0,
                    solineraName: solinera?.name || '',
                    slot: remote.slot,
                    amount: remote.amount,
                    method: remote.payment_method,
                    status: remote.status,
                    createdAt: new Date(remote.created_at).getTime(),
                    syncStatus: 'synced' as const,
                };

                if (existing && existing.id) {
                    if (existing.syncStatus === 'pending') continue;
                    await db.reservations.update(existing.id, localData);
                } else {
                    await db.reservations.add(localData);
                }
                pulled++;
            }
        }
    } catch (err: any) {
        error('Error pulling reservations', err);
        errors.push(`Exception pull reservations: ${err.message}`);
    }

    return { count: pulled, errors };
}

// ===== SYNC COMPLETO =====

export async function runSync(): Promise<SyncResult> {
    const result: SyncResult = { pushed: 0, pulled: 0, errors: [] };

    if (!isOnline()) {
        log('Sin conexión, saltando sincronización');
        return result;
    }

    const user = await getCurrentUser();
    if (!user) {
        log('Sin usuario, saltando sincronización');
        return result;
    }

    log('Iniciando sincronización...');

    try {
        const pushResult = await pushToSupabase();
        result.pushed = pushResult.count;
        result.errors.push(...pushResult.errors);

        const pullResult = await pullFromSupabase();
        result.pulled = pullResult.count;
        result.errors.push(...pullResult.errors);

        if (result.errors.length > 0) {
            console.error('[Sync] ERRORES DETECTADOS:');
            result.errors.forEach((e) => console.error('  →', e));
        }

        log(
            `Sync completo: ${result.pushed} subidos, ${result.pulled} bajados, ${result.errors.length} errores`
        );
    } catch (err) {
        error('Error general en sync', err);
        result.errors.push('Error general');
    }

    return result;
}