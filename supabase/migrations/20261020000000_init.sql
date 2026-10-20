-- PhotoDay schema: profiles, friend groups, one selfie per user per day.
-- A selfie is visible to its author and to everyone sharing a group with them.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 8)),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.selfies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  taken_on date not null,
  storage_path text not null,
  width int not null,
  height int not null,
  -- Eye centers in image pixels, null when no face was detected.
  left_eye_x real,
  left_eye_y real,
  right_eye_x real,
  right_eye_y real,
  created_at timestamptz not null default now(),
  unique (user_id, taken_on)
);

create index selfies_user_day on public.selfies (user_id, taken_on);
create index group_members_user on public.group_members (user_id);

-- Helpers (security definer to avoid recursive RLS on group_members).
create function public.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid());
$$;

create function public.shares_group(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select other = auth.uid() or exists (
    select 1 from group_members a
    join group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create function public.create_group(group_name text) returns public.groups
language plpgsql security definer set search_path = public as $$
declare g groups;
begin
  insert into groups (name, created_by) values (group_name, auth.uid()) returning * into g;
  insert into group_members (group_id, user_id) values (g.id, auth.uid());
  return g;
end;
$$;

create function public.join_group(code text) returns public.groups
language plpgsql security definer set search_path = public as $$
declare g groups;
begin
  select * into g from groups where invite_code = upper(trim(code));
  if g.id is null then
    raise exception 'Code invalide';
  end if;
  insert into group_members (group_id, user_id) values (g.id, auth.uid()) on conflict do nothing;
  return g;
end;
$$;

-- Create a profile for every new account.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Row level security
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.selfies enable row level security;

create policy "profiles readable by group mates" on public.profiles
  for select using (public.shares_group(id));
create policy "profiles editable by owner" on public.profiles
  for update using (id = auth.uid());

create policy "groups readable by members" on public.groups
  for select using (public.is_group_member(id));

create policy "members readable by members" on public.group_members
  for select using (public.is_group_member(group_id));
create policy "members can leave" on public.group_members
  for delete using (user_id = auth.uid());

create policy "selfies readable by group mates" on public.selfies
  for select using (public.shares_group(user_id));
create policy "selfies inserted by owner" on public.selfies
  for insert with check (user_id = auth.uid());
create policy "selfies updated by owner" on public.selfies
  for update using (user_id = auth.uid());
create policy "selfies deleted by owner" on public.selfies
  for delete using (user_id = auth.uid());

-- Storage: private bucket, files at "<user_id>/<YYYY-MM-DD>.jpg".
insert into storage.buckets (id, name, public) values ('selfies', 'selfies', false);

create policy "selfie files readable by group mates" on storage.objects
  for select using (
    bucket_id = 'selfies' and public.shares_group(((storage.foldername(name))[1])::uuid)
  );
create policy "selfie files written by owner" on storage.objects
  for insert with check (
    bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "selfie files replaced by owner" on storage.objects
  for update using (
    bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text
  );
