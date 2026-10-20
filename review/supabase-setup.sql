-- Portfolio review mode: database setup for Supabase.
-- Paste this whole file into Supabase > SQL Editor and press Run, once.
-- The last statement prints your owner review code. Keep it private.
--
-- Security model: the tables are closed to the public API (row level
-- security on, no policies). Browsers can only call the review_* functions
-- below, and every function checks the caller's review code first.

-- ---------- Tables ----------

create table if not exists public.review_reviewers (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text,                         -- null = shared link; reviewer types a name
  is_owner      boolean not null default false,
  sees_all      boolean not null default true, -- false = sees only their own threads
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

create table if not exists public.review_comments (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid references public.review_comments(id) on delete cascade, -- null on the first comment of a thread
  reviewer_id  uuid not null references public.review_reviewers(id) on delete cascade,
  author_name  text not null,
  body         text not null check (char_length(body) between 1 and 4000),
  anchor       jsonb,                          -- where the pin sits (first comment only)
  page         text,
  resolved     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists review_comments_thread_idx on public.review_comments(thread_id);
create index if not exists review_comments_reviewer_idx on public.review_comments(reviewer_id, created_at);

alter table public.review_reviewers enable row level security;
alter table public.review_comments  enable row level security;
revoke all on public.review_reviewers from anon, authenticated;
revoke all on public.review_comments  from anon, authenticated;

-- ---------- Internal helper ----------

create or replace function public._review_me(p_code text)
returns public.review_reviewers
language plpgsql security definer set search_path = public as $$
declare me public.review_reviewers;
begin
  select * into me from review_reviewers where code = p_code and active;
  if not found then raise exception 'invalid_code' using errcode = '28000'; end if;
  update review_reviewers set last_seen_at = now() where id = me.id
    and (last_seen_at is null or last_seen_at < now() - interval '5 minutes');
  return me;
end $$;

revoke all on function public._review_me(text) from public, anon, authenticated;

-- Can this reviewer see the thread whose first comment is p_root?
create or replace function public._review_can_see(me public.review_reviewers, p_root uuid)
returns boolean
language sql security definer set search_path = public as $$
  select me.is_owner or me.sees_all
      or exists (select 1 from review_comments c where c.id = p_root and c.reviewer_id = me.id);
$$;

revoke all on function public._review_can_see(public.review_reviewers, uuid) from public, anon, authenticated;

-- ---------- Public functions (called from the site) ----------

create or replace function public.review_session(p_code text)
returns json
language plpgsql security definer set search_path = public as $$
declare me review_reviewers := _review_me(p_code);
begin
  return json_build_object('name', me.name, 'is_owner', me.is_owner, 'needs_name', me.name is null);
end $$;

create or replace function public.review_list(p_code text)
returns json
language plpgsql security definer set search_path = public as $$
declare me review_reviewers := _review_me(p_code);
begin
  return coalesce((
    select json_agg(t order by t.created_at)
    from (
      select r.id, r.anchor, r.page, r.resolved, r.created_at,
             (r.reviewer_id = me.id) as mine,
             (r.reviewer_id = me.id or me.is_owner) as can_resolve,
             (
               select json_agg(json_build_object(
                        'id', c.id, 'author', c.author_name, 'body', c.body,
                        'created_at', c.created_at,
                        'mine', c.reviewer_id = me.id,
                        'can_delete', c.reviewer_id = me.id or me.is_owner)
                      order by c.created_at)
               from review_comments c
               where c.id = r.id or c.thread_id = r.id
             ) as comments
      from review_comments r
      where r.thread_id is null and _review_can_see(me, r.id)
    ) t
  ), '[]'::json);
end $$;

create or replace function public.review_add(
  p_code text, p_body text, p_thread uuid default null,
  p_anchor jsonb default null, p_page text default null, p_name text default null)
returns json
language plpgsql security definer set search_path = public as $$
declare
  me review_reviewers := _review_me(p_code);
  v_name text := coalesce(me.name, nullif(btrim(left(p_name, 80)), ''));
  v_body text := btrim(p_body);
  v_id uuid;
begin
  if v_name is null then raise exception 'name_required'; end if;
  if v_body is null or v_body = '' then raise exception 'empty_comment'; end if;
  if char_length(v_body) > 4000 then raise exception 'comment_too_long'; end if;
  if (select count(*) from review_comments where reviewer_id = me.id
        and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited';
  end if;

  if p_thread is not null then
    if not exists (select 1 from review_comments where id = p_thread and thread_id is null)
       or not _review_can_see(me, p_thread) then
      raise exception 'thread_not_found';
    end if;
    insert into review_comments (thread_id, reviewer_id, author_name, body)
      values (p_thread, me.id, v_name, v_body) returning id into v_id;
    update review_comments set resolved = false where id = p_thread and resolved;
  else
    if p_anchor is null or octet_length(p_anchor::text) > 4000 then raise exception 'bad_anchor'; end if;
    insert into review_comments (reviewer_id, author_name, body, anchor, page)
      values (me.id, v_name, v_body, p_anchor, left(p_page, 300)) returning id into v_id;
  end if;
  return json_build_object('id', v_id);
end $$;

create or replace function public.review_resolve(p_code text, p_thread uuid, p_resolved boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare me review_reviewers := _review_me(p_code);
begin
  update review_comments set resolved = p_resolved
   where id = p_thread and thread_id is null and (me.is_owner or reviewer_id = me.id);
  if not found then raise exception 'not_allowed'; end if;
end $$;

create or replace function public.review_delete(p_code text, p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare me review_reviewers := _review_me(p_code);
begin
  delete from review_comments where id = p_id and (me.is_owner or reviewer_id = me.id);
  if not found then raise exception 'not_allowed'; end if;
end $$;

-- ---------- Owner-only: managing reviewers ----------

create or replace function public.review_invite(p_code text, p_name text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  me review_reviewers := _review_me(p_code);
  v_code text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
  v_name text := nullif(btrim(left(p_name, 80)), '');
  v_id uuid;
begin
  if not me.is_owner then raise exception 'not_allowed'; end if;
  insert into review_reviewers (code, name) values (v_code, v_name) returning id into v_id;
  return json_build_object('id', v_id, 'code', v_code, 'name', v_name);
end $$;

create or replace function public.review_reviewers_list(p_code text)
returns json
language plpgsql security definer set search_path = public as $$
declare me review_reviewers := _review_me(p_code);
begin
  if not me.is_owner then raise exception 'not_allowed'; end if;
  return coalesce((
    select json_agg(json_build_object(
             'id', r.id, 'code', r.code, 'name', r.name, 'active', r.active,
             'is_owner', r.is_owner, 'last_seen_at', r.last_seen_at,
             'comments', (select count(*) from review_comments c where c.reviewer_id = r.id))
           order by r.is_owner desc, r.created_at)
    from review_reviewers r
  ), '[]'::json);
end $$;

create or replace function public.review_set_active(p_code text, p_id uuid, p_active boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare me review_reviewers := _review_me(p_code);
begin
  if not me.is_owner then raise exception 'not_allowed'; end if;
  update review_reviewers set active = p_active where id = p_id and not is_owner;
end $$;

revoke all on function public.review_session(text) from public;
revoke all on function public.review_list(text) from public;
revoke all on function public.review_add(text, text, uuid, jsonb, text, text) from public;
revoke all on function public.review_resolve(text, uuid, boolean) from public;
revoke all on function public.review_delete(text, uuid) from public;
revoke all on function public.review_invite(text, text) from public;
revoke all on function public.review_reviewers_list(text) from public;
revoke all on function public.review_set_active(text, uuid, boolean) from public;

grant execute on function public.review_session(text) to anon;
grant execute on function public.review_list(text) to anon;
grant execute on function public.review_add(text, text, uuid, jsonb, text, text) to anon;
grant execute on function public.review_resolve(text, uuid, boolean) to anon;
grant execute on function public.review_delete(text, uuid) to anon;
grant execute on function public.review_invite(text, text) to anon;
grant execute on function public.review_reviewers_list(text) to anon;
grant execute on function public.review_set_active(text, uuid, boolean) to anon;

-- ---------- Your owner code ----------
-- Creates the owner reviewer once and shows its code. Running the file
-- again just shows the existing code.

insert into public.review_reviewers (code, name, is_owner)
select substr(replace(gen_random_uuid()::text, '-', ''), 1, 16), 'Tucker', true
where not exists (select 1 from public.review_reviewers where is_owner);

select code as your_owner_code from public.review_reviewers where is_owner;
