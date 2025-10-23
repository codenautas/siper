set search_path = siper;

alter table parametros add column permite_cargar_fichadas boolean default true;
alter table "parametros" add check (permite_cargar_fichadas is not false);
