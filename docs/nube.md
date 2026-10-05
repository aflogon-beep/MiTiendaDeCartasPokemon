# Partida en la nube (Supabase)

La partida se guarda también en internet, con **usuario y contraseña**. Así se puede jugar en el móvil y seguir en otro dispositivo, y si el móvil borra sus datos, la partida sigue en la nube.

- **Cuenta:** solo usuario (3–20 letras o números) y contraseña (mínimo 6). Supabase pide un correo, así que el juego usa `usuario@aflogon-beep.github.io` por dentro (nunca se manda nada a esa dirección). **Sin correo no se puede recuperar la contraseña**: apúntala.
- **Qué se sube:** al terminar cada día y con «☁️ Subir ahora» (Más → Partida → ☁️ Nube), la partida de la ranura en la que juegas, comprimida (de ~2 MB a unos cientos de KB).
- **Las otras ranuras:** al entrar en una partida (o con la cuenta recién abierta) se suben también las demás ranuras de este dispositivo que la nube no tiene al día. Si en la nube hay una copia de una ranura que salió de otro dispositivo, no se pisa: se pregunta al entrar en ella.
- **Recordatorio de copia:** con la cuenta abierta y una subida de hace menos de 7 días, no sale el aviso de exportar la copia (`backupDue`, `core/alerts.js`).
- **Copias:** en la nube se quedan **las 7 últimas de cada ranura**. Desde ☁️ Nube se puede cargar cualquiera.
- **Al entrar en una partida:** si en la nube hay una copia que no salió de este dispositivo (p. ej. has jugado en otro), pregunta: «Cargar la de la nube» o «Seguir con esta». Nunca se borra nada sin preguntar.
- **Sin red:** el juego va igual. Lo que no se pudo subir queda pendiente y se sube al volver la conexión.
- **Registro de errores:** con la cuenta abierta, los errores del juego y los cierres de la app (`ui/diag.js`) se apuntan en la tabla `logs` (como mucho 20 por sesión). Se ven en Supabase → Table Editor → `logs`.

Código: `src/core/cloud.js` (acceso, subir, bajar, registro), `src/ui/cloud.js` (pantalla ☁️ Nube y sincronización). Tests: `tests/unit/nube.test.js` y `tests/e2e/22-nube.spec.js`, contra un Supabase simulado (`tests/fixtures/supa.js`).

## Montarlo (lo hace Alberto una vez, ~15 minutos)

1. Crea una cuenta en <https://supabase.com> y un proyecto nuevo (plan **Free**, región **West EU** o la más cercana). Apunta la contraseña de la base de datos (no hace falta para el juego).
2. **Authentication → Sign In / Providers** (menú de la izquierda, en CONFIGURATION). En la lista de proveedores pulsa **Email**: déjalo activado y **desactiva «Confirm email»**. Guarda. (Arriba, en «User Signups», «Allow new users to sign up» tiene que estar activado.)
3. **SQL Editor → New query**: pega el SQL de abajo y pulsa **Run**.
4. Botón verde **Connect** de arriba: copia la **Project URL** (`https://<id>.supabase.co`) y la clave **publishable** (`sb_publishable_…`; en proyectos antiguos, «anon») y pásaselas a Claude. La clave también está en **Project Settings → API Keys**. Van dentro del juego (`CLOUD_URL` y `CLOUD_ANON` en `src/core/cloud.js`); son públicas, la seguridad la ponen las reglas del SQL. **No pases nunca la clave secret (`sb_secret_…`) ni la `service_role`.**
5. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**: `SUPABASE_URL` (la Project URL) y `SUPABASE_ANON` (la clave anon). Los usa el aviso diario.

## SQL

```sql
-- Partidas: una fila por copia subida. Cada usuario solo ve, sube y borra las suyas.
create table public.saves (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  mode text not null,
  slot smallint not null check (slot between 1 and 3),
  day int not null default 0,
  name text,
  ver text,
  size int,
  data text not null,
  created_at timestamptz not null default now()
);
create index saves_user_slot on public.saves (user_id, mode, slot, id desc);
alter table public.saves enable row level security;
create policy "partidas: ver las mías" on public.saves for select to authenticated using (auth.uid() = user_id);
create policy "partidas: subir las mías" on public.saves for insert to authenticated with check (auth.uid() = user_id);
create policy "partidas: borrar las mías" on public.saves for delete to authenticated using (auth.uid() = user_id);

-- Se quedan las 7 últimas de cada ranura
create function public.saves_keep7() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.saves s
  where s.user_id = new.user_id and s.mode = new.mode and s.slot = new.slot
    and s.id not in (
      select id from public.saves
      where user_id = new.user_id and mode = new.mode and slot = new.slot
      order by id desc limit 7);
  return null;
end $$;
create trigger saves_keep7 after insert on public.saves for each row execute function public.saves_keep7();

-- Registro de errores: el juego solo puede escribir; se lee desde el panel de Supabase.
create table public.logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null,
  ver text,
  data jsonb,
  created_at timestamptz not null default now()
);
alter table public.logs enable row level security;
create policy "registro: escribir" on public.logs for insert to authenticated with check (auth.uid() = user_id);

-- Se quedan los 300 últimos de cada usuario
create function public.logs_keep() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.logs l
  where l.user_id = new.user_id
    and l.id not in (select id from public.logs where user_id = new.user_id order by id desc limit 300);
  return null;
end $$;
create trigger logs_keep after insert on public.logs for each row execute function public.logs_keep();
```

## Que no se duerma

En el plan gratuito, Supabase pausa el proyecto si pasa **una semana sin uso** (habría que reactivarlo a mano en su web). Para evitarlo, `.github/workflows/nube.yml` hace una consulta pequeña **cada día** con los secretos `SUPABASE_URL` y `SUPABASE_ANON`. Si los secretos no están, usa la dirección y la clave publishable que ya van en el juego (son públicas).

## Límites del plan gratuito

500 MB de base de datos (cada copia ocupa unos cientos de KB: 3 ranuras × 7 copias ≈ 10 MB por jugador), 5 GB de tráfico al mes y 50.000 usuarios. De sobra para la familia.
