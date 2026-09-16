-- HASS Studio. Run once through Supabase SQL editor / migrations.
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, role text not null default 'CLIENT' check(role in ('ADMIN','CLIENT')), created_at timestamptz not null default now());
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='ADMIN'); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;
create table public.site_settings(id int primary key check(id=1),data jsonb not null,updated_at timestamptz default now());
create table public.categories(id text primary key,title jsonb not null,description jsonb not null,image text not null default '',kind text not null check(kind in ('website','dashboard','mobile')),services jsonb not null,sort_order int not null default 0);
create table public.clients(id uuid primary key default gen_random_uuid(),name text not null,email text not null,company text not null default '',created_at timestamptz default now());
create table public.projects(id uuid primary key default gen_random_uuid(),client_id uuid references public.clients(id),name text not null,description text not null default '',status text not null default 'PLANNING' check(status in ('PLANNING','IN_PROGRESS','REVIEW','PAUSED','COMPLETED','CANCELLED')),progress int not null default 0 check(progress between 0 and 100),start_date date,estimated_delivery_date date,archived boolean not null default false,created_at timestamptz default now(),updated_at timestamptz default now());
create table public.milestones(id uuid primary key default gen_random_uuid(),project_id uuid not null references public.projects(id) on delete cascade,title text not null,due_date date,completed boolean not null default false,created_at timestamptz default now());
create table public.portfolio_entries(id uuid primary key default gen_random_uuid(),slug text not null unique,title text not null,category_id text references public.categories(id),year int not null,cover text not null default '',video text not null default '',url text not null default '',description jsonb not null,challenge jsonb not null,approach jsonb not null,services jsonb not null default '[]',gallery jsonb not null default '[]',featured boolean not null default false,published boolean not null default false,concept boolean not null default false,kind text not null default 'website' check(kind in ('website','dashboard','mobile')),sort_order int not null default 0);
create table public.project_updates(id uuid primary key default gen_random_uuid(),project_id uuid not null references public.projects(id),title text not null,message text not null,progress int not null check(progress between 0 and 100),preview_url text not null default '',attachments jsonb not null default '[]',language text not null default 'en' check(language in ('en','es')),status text not null default 'DRAFT' check(status in ('DRAFT','PENDING','SENT','FAILED')),email_payload jsonb,provider_id text,email_error text,sent_at timestamptz,first_attempt_at timestamptz,locked_at timestamptz,created_at timestamptz not null default now());
create index on public.projects(client_id);
create index on public.milestones(project_id);
create index on public.project_updates(project_id,created_at desc);
create index on public.portfolio_entries(published,sort_order);

alter table public.profiles enable row level security;
create policy profile_self_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profile_admin on public.profiles for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.site_settings enable row level security;
create policy admin_all on public.site_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.categories enable row level security;
create policy admin_all on public.categories for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.clients enable row level security;
create policy admin_all on public.clients for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.projects enable row level security;
create policy admin_all on public.projects for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.milestones enable row level security;
create policy admin_all on public.milestones for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.portfolio_entries enable row level security;
create policy admin_all on public.portfolio_entries for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.project_updates enable row level security;
create policy admin_all on public.project_updates for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy public_settings on public.site_settings for select to anon,authenticated using(true);
create policy public_categories on public.categories for select to anon,authenticated using(true);
create policy published_portfolio on public.portfolio_entries for select to anon,authenticated using(published=true);
-- No automatic signup trigger grants administrator privileges.
-- Explicit grants: this also works when automatic table exposure is disabled.
grant usage on schema public to anon, authenticated;
revoke all on public.profiles, public.clients, public.projects, public.milestones, public.project_updates from anon;
grant select on public.site_settings, public.categories, public.portfolio_entries to anon;
grant select, insert, update, delete on public.profiles, public.site_settings, public.categories, public.clients, public.projects, public.milestones, public.portfolio_entries, public.project_updates to authenticated;

create or replace function public.claim_update(update_id uuid) returns setof public.project_updates
language plpgsql security invoker set search_path=public as $$
begin
 if not public.is_admin() then raise exception 'Unauthorized'; end if;
 return query update public.project_updates set status='PENDING',locked_at=now(),first_attempt_at=coalesce(first_attempt_at,now()),email_error=null
 where id=update_id and (
 status in ('DRAFT','FAILED') or (status='PENDING' and locked_at<now()-interval '2 minutes' and first_attempt_at>now()-interval '23 hours')
 ) returning *;
end; $$;
revoke all on function public.claim_update(uuid) from public;
grant execute on function public.claim_update(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('public-media','public-media',true,52428800,array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
('client-files','client-files',false,52428800,array['image/jpeg','image/png','image/webp','image/avif','application/pdf','video/mp4','video/webm'])
on conflict(id) do nothing;
create policy admin_storage on storage.objects for all to authenticated using(bucket_id in ('public-media','client-files') and public.is_admin()) with check(bucket_id in ('public-media','client-files') and public.is_admin());

insert into public.site_settings(id,data) values(1,'{"brand":"HASS Studio","name":"Alexis Huamani Rivera","email":"","whatsapp":"","logo":"","portrait":"","heroImage":"/images/coast.webp","heroMobileImage":"/images/coast-mobile.webp","detailImage":"/images/olive.webp","studioImage":"/images/courtyard.webp","availability":{"en":"Independent design & development","es":"Diseño y desarrollo independiente"},"heroEyebrow":{"en":"Thoughtfully designed. Carefully built.","es":"Diseñado con intención. Creado con cuidado."},"heroTitle":{"en":"A feeling.\nMade digital.","es":"Una sensación.\nHecha digital."},"heroDescription":{"en":"Distinctive websites and digital experiences.\nWhere thoughtful design meets considered engineering.","es":"Webs y experiencias digitales con carácter.\nDonde el diseño se une a la ingeniería."},"introEyebrow":{"en":"The art of making it feel right","es":"El arte de hacerlo sentir bien"},"introTitle":{"en":"Good design is seen.\nGreat design is felt.","es":"El buen diseño se ve.\nEl gran diseño se siente."},"introText":{"en":"HASS is an independent digital studio by Alexis Huamani Rivera. I bring a design-first perspective to websites, internal systems and mobile experiences — making the complex feel beautifully simple.","es":"HASS es el estudio digital independiente de Alexis Huamani Rivera. El diseño guía cada web, sistema interno y aplicación móvil que construyo: hacer que lo complejo se sienta simple."},"workTitle":{"en":"Digital worlds,\nwith a human touch.","es":"Mundos digitales,\ncon un toque humano."},"studioTitle":{"en":"A curious mind.\nA considered approach.","es":"Una mente curiosa.\nUna mirada cuidadosa."},"studioText":{"en":"I''m Alexis. Designer in spirit, developer by craft. My work moves between websites, internal tools and mobile applications, always beginning with how an experience should feel.\n\nI care about the details people notice — and the ones they simply feel. The space around a word. The rhythm of a transition. An interface that makes sense from the first touch.","es":"Soy Alexis. Diseñador de espíritu, desarrollador de oficio. Mi trabajo conecta páginas web, herramientas internas y aplicaciones móviles, siempre empezando por cómo debe sentirse una experiencia.\n\nMe importan los detalles que se ven y los que se sienten. El espacio alrededor de una palabra. El ritmo de una transición. Una interfaz que se entiende al primer toque."},"contactTitle":{"en":"Something good\nstarts with a hello.","es":"Algo bueno\nempieza con un hola."},"contactText":{"en":"Have an idea, a challenge, or a world to bring to life? Let''s make something worth experiencing.","es":"¿Tienes una idea, un reto o un mundo por crear? Hagamos algo que merezca ser vivido."},"socials":[],"seoTitle":{"en":"HASS Studio — Design with feeling.","es":"HASS Studio — Diseño que se siente."},"seoDescription":{"en":"Independent design and development by Alexis Huamani Rivera. Thoughtful websites, internal systems and mobile experiences.","es":"Diseño y desarrollo independiente por Alexis Huamani Rivera. Webs, sistemas internos y aplicaciones móviles con intención."}}'::jsonb);
insert into public.categories(id,title,description,image,kind,services,sort_order) values('websites','{"en":"Web experiences","es":"Experiencias web"}','{"en":"A first impression.\nA lasting feeling.","es":"Una primera impresión.\nUna sensación que permanece."}','/images/courtyard.webp','website','{"en":"Art direction · UI/UX · Development","es":"Dirección de arte · UI/UX · Desarrollo"}',0);
insert into public.categories(id,title,description,image,kind,services,sort_order) values('systems','{"en":"Internal systems","es":"Sistemas internos"}','{"en":"Complex behind the scenes.\nEffortless in your hands.","es":"Complejos por dentro.\nSimples en tus manos."}','/images/olive.webp','dashboard','{"en":"Product design · Workflows · Engineering","es":"Diseño de producto · Procesos · Ingeniería"}',1);
insert into public.categories(id,title,description,image,kind,services,sort_order) values('mobile','{"en":"Mobile applications","es":"Aplicaciones móviles"}','{"en":"Small screen.\nEndless possibilities.","es":"Una pequeña pantalla.\nPosibilidades infinitas."}','/images/coast.webp','mobile','{"en":"Interaction design · Mobile development","es":"Diseño de interacción · Desarrollo móvil"}',2);
-- Visual studies are marked as concepts. Replace them with real work through Portfolio.
insert into public.portfolio_entries(id,slug,title,category_id,year,cover,video,url,description,challenge,approach,services,gallery,featured,published,concept,kind,sort_order) values('11111111-1111-4111-8111-111111111111','casa-oliva','Casa Oliva','websites',2026,'/images/courtyard.webp','','','{"en":"An exploration of quiet hospitality. An editorial website concept inspired by natural materials, soft light and a slower pace.","es":"Una exploración de la hospitalidad serena. Un concepto web editorial inspirado en materiales naturales, luz suave y un ritmo pausado."}','{"en":"Translate the atmosphere of a place into a digital experience that invites you to stay.","es":"Traducir la atmósfera de un lugar a una experiencia digital que invite a quedarse."}','{"en":"Generous typography, tactile imagery and a considered visual rhythm. A study in how little an interface needs to say when the composition speaks.","es":"Tipografía amplia, imágenes con textura y un ritmo visual cuidado. Un estudio de lo poco que necesita decir una interfaz cuando la composición comunica."}','["Art direction","UI/UX design","Creative development"]','["/images/coast.webp","/images/olive.webp"]',true,true,true,'website',0);
insert into public.portfolio_entries(id,slug,title,category_id,year,cover,video,url,description,challenge,approach,services,gallery,featured,published,concept,kind,sort_order) values('22222222-2222-4222-8222-222222222222','forma','Forma','systems',2026,'/images/olive.webp','','','{"en":"A visual study for a calmer workspace. Clear information, considered interactions and room to focus.","es":"Un estudio visual para trabajar con calma. Información clara, interacciones cuidadas y espacio para concentrarse."}','{"en":"Give everyday work the same attention to design as a public-facing website.","es":"Dar al trabajo diario la misma atención de diseño que a una web pública."}','{"en":"A restrained palette, precise hierarchy and a focused overview. Every element has a clear purpose.","es":"Una paleta contenida, jerarquía precisa y una vista general enfocada. Cada elemento tiene un propósito."}','["Product design","UI/UX","Design systems"]','["/images/courtyard.webp"]',true,true,true,'dashboard',1);
insert into public.portfolio_entries(id,slug,title,category_id,year,cover,video,url,description,challenge,approach,services,gallery,featured,published,concept,kind,sort_order) values('33333333-3333-4333-8333-333333333333','savia','Savia','mobile',2026,'/images/coast.webp','','','{"en":"A mobile interface study shaped by nature. A little space to pause, discover and reconnect.","es":"Un estudio de interfaz móvil inspirado en la naturaleza. Un espacio para pausar, descubrir y reconectar."}','{"en":"Bring a feeling of openness and calm into a compact mobile experience.","es":"Llevar una sensación de apertura y calma a una experiencia móvil compacta."}','{"en":"Immersive photography, accessible controls and simple navigation form a gentle everyday companion.","es":"Fotografía inmersiva, controles accesibles y navegación simple para una experiencia cotidiana amable."}','["Mobile design","Interaction design"]','["/images/olive.webp"]',true,true,true,'mobile',2);


create or replace function public.sync_project_progress() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 update public.projects set progress=NEW.progress,updated_at=now() where id=NEW.project_id;
 return NEW;
end; $$;
create trigger sync_progress after insert or update of progress on public.project_updates for each row execute function public.sync_project_progress();

update public.site_settings set data=data || '{"interludeTitle": {"en": "Every detail.\nA little more feeling.", "es": "Cada detalle.\nUn poco más de emoción."}, "interludeRibbon": {"en": "Thoughtfully designed. Carefully built.", "es": "Diseñado con intención. Creado con cuidado."}}'::jsonb where id=1;
