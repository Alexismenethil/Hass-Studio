import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("PostgreSQL migration enforces public/private boundaries and atomic sends", async () => {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key,bucket_id text);alter table storage.objects enable row level security;`);
  await db.exec(
    await readFile(
      new URL(
        "../../../../supabase/migrations/001_studio.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(`grant usage on schema auth,storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;
 insert into auth.users values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 insert into public.profiles(id,role) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ADMIN'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','CLIENT');
 insert into clients(id,name,email) values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Private client','private@example.com');
 insert into projects(id,client_id,name) values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','cccccccc-cccc-4ccc-8ccc-cccccccccccc','Private project');`);
  await db.exec("set role anon");
  await assert.rejects(db.query("select * from clients"));
  await assert.rejects(db.query("select * from projects"));
  await assert.rejects(db.query("select * from project_updates"));
  assert.equal(
    (await db.query("select * from portfolio_entries")).rows.length,
    3,
  );
  assert.equal((await db.query("select * from site_settings")).rows.length, 1);
  await assert.rejects(
    db.exec(
      "insert into clients(name,email) values('Attacker','x@example.com')",
    ),
  );
  await db.exec(
    "reset role;set role authenticated;set request.jwt.claim.sub='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'",
  );
  assert.equal((await db.query("select * from clients")).rows.length, 0);
  await db.exec("update profiles set role='ADMIN' where id=auth.uid()");
  assert.equal(
    (
      await db.query<{ role: string }>(
        "select role from profiles where id=auth.uid()",
      )
    ).rows[0].role,
    "CLIENT",
  );
  await assert.rejects(
    db.query(
      "select * from claim_update('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')",
    ),
  );
  await db.exec(
    "set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'",
  );
  assert.equal((await db.query("select * from clients")).rows.length, 1);
  await db.exec(
    `insert into project_updates(id,project_id,title,message,progress) values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','dddddddd-dddd-4ddd-8ddd-dddddddddddd','Homepage ready','All done',65)`,
  );
  assert.equal(
    (await db.query<{ progress: number }>("select progress from projects"))
      .rows[0].progress,
    65,
  );
  assert.equal(
    (
      await db.query(
        "select * from claim_update('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')",
      )
    ).rows.length,
    1,
  );
  assert.equal(
    (
      await db.query(
        "select * from claim_update('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')",
      )
    ).rows.length,
    0,
  );
  await db.exec(
    "update project_updates set locked_at=now()-interval '3 minutes'",
  );
  assert.equal(
    (
      await db.query(
        "select * from claim_update('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')",
      )
    ).rows.length,
    1,
  );
  await db.exec("update project_updates set status='SENT'");
  assert.equal(
    (
      await db.query(
        "select * from claim_update('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')",
      )
    ).rows.length,
    0,
  );
  await db.exec(
    "update project_updates set status='PENDING',first_attempt_at=now()-interval '24 hours',locked_at=now()-interval '3 minutes'",
  );
  assert.equal(
    (
      await db.query(
        "select * from claim_update('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')",
      )
    ).rows.length,
    0,
  );
  await db.close();
});

test("only the administrator deletes and reorders public work; services with work stay protected", async () => {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key,bucket_id text);alter table storage.objects enable row level security;`);
  await db.exec(
    await readFile(
      new URL("../../../../supabase/migrations/001_studio.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(`insert into auth.users values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 insert into public.profiles(id,role) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','ADMIN');`);
  const work = "11111111-1111-4111-8111-111111111111";
  await db.exec("set role anon");
  await assert.rejects(db.exec(`delete from portfolio_entries where id='${work}'`));
  await assert.rejects(db.exec(`update portfolio_entries set sort_order=9 where id='${work}'`));
  await db.exec(
    "reset role;set role authenticated;set request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'",
  );
  await assert.rejects(
    db.exec("delete from categories where id='websites'"),
    /foreign key/,
  );
  await db.exec(`update portfolio_entries set sort_order=5 where id='${work}'`);
  await db.exec(`delete from portfolio_entries where id='${work}'`);
  await db.exec("delete from categories where id='websites'");
  assert.equal((await db.query("select * from portfolio_entries")).rows.length, 2);
  assert.equal((await db.query("select * from categories")).rows.length, 2);
  await db.close();
});
