-- ================================================================
-- SOLINET — ESQUEMA COMPLETO DE SUPABASE
-- Última actualización: 2026-10-14
-- ================================================================

-- ================================================================
-- 1. TABLA: profiles
-- ================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text not null check (role in ('driver', 'business')),
  name text,
  email text,
  phone text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- ================================================================
-- 2. TABLA: solineras
-- ================================================================
create table if not exists public.solineras (
  id bigint primary key generated always as identity,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_uuid uuid unique not null default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  price_per_kwh numeric default 5.0,
  points int default 4,
  points_config jsonb,
  opening_hours text,
  closing_hours text,
  phone text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.solineras enable row level security;

-- ================================================================
-- 3. TABLA: driver_profiles
-- ================================================================
create table if not exists public.driver_profiles (
  id bigint primary key generated always as identity,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  client_uuid uuid unique not null default gen_random_uuid(),
  plate text,
  car text,
  name text,
  phone text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.driver_profiles enable row level security;

-- ================================================================
-- 4. TABLA: charge_requests
-- ================================================================
create table if not exists public.charge_requests (
  id uuid primary key default gen_random_uuid(),
  client_uuid uuid unique not null default gen_random_uuid(),
  driver_id bigint references public.driver_profiles(id) on delete cascade,
  solinera_id bigint references public.solineras(id) on delete cascade,
  slot text not null,
  amount numeric not null,
  payment_method text check (payment_method in ('transfermovil', 'enzona')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
  short_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  confirmed_at timestamp with time zone,
  completed_at timestamp with time zone
);

alter table public.charge_requests enable row level security;

-- ================================================================
-- 5. TABLA: queue_events (NUEVA — reemplaza queue)
-- ================================================================
create table if not exists public.queue_events (
  id uuid primary key default gen_random_uuid(),
  client_uuid uuid unique not null default gen_random_uuid(),
  solinera_id bigint references public.solineras(id) on delete cascade not null,
  event_type text not null check (event_type in ('added', 'started', 'completed', 'cancelled')),
  driver_name text,
  plate text,
  car text,
  amount numeric,
  point_id text,
  duration_min int,
  method text check (method in ('transfermovil', 'enzona', 'efectivo')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.queue_events enable row level security;

-- ================================================================
-- 6. TRIGGER: handle_new_user
-- ================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'driver'),
    coalesce(new.raw_user_meta_data->>'name', 'Usuario'),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do update set
    role = excluded.role,
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================================
-- 7. POLÍTICAS RLS (permisivas para desarrollo)
-- ================================================================

-- PROFILES
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles for select to authenticated using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id) with check (auth.uid() = id);

-- SOLINERAS
drop policy if exists "Anyone can view solineras" on public.solineras;
create policy "Anyone can view solineras"
on public.solineras for select to authenticated using (true);

drop policy if exists "Owners can insert their solinera" on public.solineras;
create policy "Owners can insert their solinera"
on public.solineras for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Owners can update their solinera" on public.solineras;
create policy "Owners can update their solinera"
on public.solineras for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- DRIVER PROFILES
drop policy if exists "Anyone can view driver profiles" on public.driver_profiles;
create policy "Anyone can view driver profiles"
on public.driver_profiles for select to authenticated using (true);

drop policy if exists "Drivers can insert their profile" on public.driver_profiles;
create policy "Drivers can insert their profile"
on public.driver_profiles for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Drivers can update their profile" on public.driver_profiles;
create policy "Drivers can update their profile"
on public.driver_profiles for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CHARGE REQUESTS
drop policy if exists "Authenticated can view requests" on public.charge_requests;
create policy "Authenticated can view requests"
on public.charge_requests for select to authenticated using (true);

drop policy if exists "Authenticated can insert requests" on public.charge_requests;
create policy "Authenticated can insert requests"
on public.charge_requests for insert to authenticated with check (true);

drop policy if exists "Authenticated can update requests" on public.charge_requests;
create policy "Authenticated can update requests"
on public.charge_requests for update to authenticated using (true);

-- QUEUE EVENTS
drop policy if exists "Anyone can view queue events" on public.queue_events;
create policy "Anyone can view queue events"
on public.queue_events for select to authenticated using (true);

drop policy if exists "Authenticated can insert queue events" on public.queue_events;
create policy "Authenticated can insert queue events"
on public.queue_events for insert to authenticated with check (true);

-- ================================================================
-- 8. ÍNDICES
-- ================================================================
create index if not exists idx_solineras_user_id on public.solineras(user_id);
create index if not exists idx_driver_profiles_user_id on public.driver_profiles(user_id);
create index if not exists idx_charge_requests_solinera on public.charge_requests(solinera_id);
create index if not exists idx_charge_requests_status on public.charge_requests(status);
create index if not exists idx_charge_requests_client_uuid on public.charge_requests(client_uuid);
create index if not exists idx_queue_events_solinera on public.queue_events(solinera_id);
create index if not exists idx_queue_events_client_uuid on public.queue_events(client_uuid);

-- ================================================================
-- 9. HABILITAR REALTIME
-- ================================================================
alter publication supabase_realtime add table public.charge_requests;
alter publication supabase_realtime add table public.queue_events;
alter publication supabase_realtime add table public.solineras;

-- ================================================================
-- FIN
-- ================================================================