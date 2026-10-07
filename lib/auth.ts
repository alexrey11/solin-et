import { db, User, Session } from './db';

// ===== HASHING =====
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'solinet-salt-2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ===== REGISTRO =====
export async function registerUser(data: {
    role: 'driver' | 'business';
    name: string;
    email: string;
    phone?: string;
    password: string;
}): Promise<User> {
    const email = data.email.trim().toLowerCase();

    // Verificar que no exista
    const existing = await db.users.where('email').equals(email).first();
    if (existing) {
        throw new Error('Ya existe una cuenta con ese correo');
    }

    const passwordHash = await hashPassword(data.password);

    const userId = await db.users.add({
        role: data.role,
        name: data.name.trim(),
        email,
        phone: data.phone?.trim(),
        passwordHash,
        createdAt: Date.now(),
    });

    // Crear sesión
    await db.session.clear();
    await db.session.add({
        userId,
        role: data.role,
        createdAt: Date.now(),
    });

    const user = await db.users.get(userId);
    return user!;
}

// ===== LOGIN =====
export async function loginUser(
    email: string,
    password: string
): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.users.where('email').equals(normalizedEmail).first();

    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
        throw new Error('Contraseña incorrecta');
    }

    // Crear sesión
    await db.session.clear();
    await db.session.add({
        userId: user.id!,
        role: user.role,
        createdAt: Date.now(),
    });

    return user;
}

// ===== SESIÓN =====
export async function getCurrentUser(): Promise<User | null> {
    const session = await db.session.toArray();
    if (session.length === 0) return null;
    const current = session[0];
    const user = await db.users.get(current.userId);
    return user || null;
}

export async function getSession(): Promise<Session | null> {
    const sessions = await db.session.toArray();
    return sessions[0] || null;
}

export async function logoutUser(): Promise<void> {
    await db.session.clear();
    if (typeof window !== 'undefined') {
        localStorage.removeItem('solinet_mode');
    }
}

// ===== ACTUALIZAR USUARIO =====
export async function updateUser(
    userId: number,
    data: Partial<User>
): Promise<void> {
    await db.users.update(userId, data);
}