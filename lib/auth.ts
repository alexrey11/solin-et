import { createClient } from '@/lib/supabase/client';
import { db, User } from './db';

// ===== TIPOS =====

export interface AuthResult {
    success: boolean;
    user?: User;
    error?: string;
}

// ===== REGISTRO =====

export async function registerUser(data: {
    role: 'driver' | 'business';
    name: string;
    email: string;
    phone?: string;
    password: string;
}): Promise<AuthResult> {
    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
            data: {
                role: data.role,
                name: data.name.trim(),
                phone: data.phone?.trim() || '',
            },
        },
    });

    if (error) {
        return { success: false, error: error.message };
    }

    if (!authData.user) {
        return { success: false, error: 'No se pudo crear el usuario' };
    }

    // Crear usuario local en Dexie también
    const userId = await db.users.add({
        supabaseId: authData.user.id,
        role: data.role,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim(),
        passwordHash: '', // Ya no usamos hash local
        createdAt: Date.now(),
        syncStatus: 'synced',
    });

    const localUser: User = {
        id: userId,
        supabaseId: authData.user.id,
        role: data.role,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim(),
        passwordHash: '',
        createdAt: Date.now(),
    };

    return { success: true, user: localUser };
}

// ===== LOGIN =====

export async function loginUser(
    email: string,
    password: string
): Promise<AuthResult> {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    if (!data.user) {
        return { success: false, error: 'Credenciales incorrectas' };
    }

    // Buscar o crear usuario local
    let localUser = await db.users
        .where('supabaseId')
        .equals(data.user.id)
        .first();

    if (!localUser) {
        // Crear usuario local si no existe (por si limpiaron IndexedDB)
        const id = await db.users.add({
            supabaseId: data.user.id,
            role: (data.user.user_metadata?.role as 'driver' | 'business') || 'driver',
            name: data.user.user_metadata?.name || 'Usuario',
            email: data.user.email || email,
            phone: data.user.user_metadata?.phone || '',
            passwordHash: '',
            createdAt: Date.now(),
            syncStatus: 'synced',
        });
        localUser = await db.users.get(id);
    }

    return { success: true, user: localUser! };
}

// ===== LOGOUT =====

export async function logoutUser(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();

    // Limpiar sesión local
    await db.session.clear();
    if (typeof window !== 'undefined') {
        localStorage.removeItem('solinet_mode');
    }
}

// ===== SESIÓN ACTUAL =====

export async function getCurrentUser(): Promise<User | null> {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        // Limpiar cualquier usuario local que quede
        await db.users.clear();
        return null;
    }

    // Buscar o crear usuario local
    let localUser = await db.users
        .where('supabaseId')
        .equals(user.id)
        .first();

    if (!localUser) {
        const id = await db.users.add({
            supabaseId: user.id,
            role: (user.user_metadata?.role as 'driver' | 'business') || 'driver',
            name: user.user_metadata?.name || 'Usuario',
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
            passwordHash: '',
            createdAt: Date.now(),
            syncStatus: 'synced',
        });
        localUser = await db.users.get(id);
    }

    return localUser || null;
}

// ===== ACTUALIZAR USUARIO =====

export async function updateUser(
    userId: number,
    data: Partial<User>
): Promise<void> {
    await db.users.update(userId, data);
}