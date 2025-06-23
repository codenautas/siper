set search_pah = cvp;

update grados set grado = '0'||grado where grado <= 9;

alter table "personas" add constraint "personas grados REL" foreign key ("grados") references "grados" ("tramo", "grado")  on update cascade;
