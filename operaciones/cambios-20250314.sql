-- ticket 132
set search_path = siper;
alter table "personas" alter column "activo" set not null;
alter table "personas" alter column "activo" set default false;
