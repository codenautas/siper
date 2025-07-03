set search_path = siper;
set role siper_muleto_owner;

alter table "personas_importadas" add constraint "personas_importadas agrupamientos REL" foreign key ("agrupamiento") references "agrupamientos" ("agrupamiento")  on update cascade;
alter table "nov_per_importado" add constraint "nov_per_importado annios REL" foreign key ("annio") references "annios" ("annio") on update cascade;

alter table "per_nov_cant" add constraint "per_nov_cant annios REL" foreign key ("annio") references "annios" ("annio") on update cascade;
alter table "per_nov_cant" add constraint "per_nov_cant personas REL" foreign key ("idper") references "personas" ("idper") on update cascade;

alter table "personas_importadas" add constraint "personas_importadas categorias REL" foreign key ("categoria") references "categorias" ("categoria")  on update cascade;
alter table "nov_per_importado" add constraint "nov_per_importado categorias REL" foreign key ("categoria") references "categorias" ("categoria")  on update cascade;

alter table "per_nov_cant" add constraint "per_nov_cant cod_novedades REL" foreign key ("cod_nov") references "cod_novedades" ("cod_nov") on update cascade;
alter table "nov_per_importado" add constraint "nov_per_importado cod_novedades REL" foreign key ("novedad") references "cod_novedades" ("cod_nov") on update cascade;

alter table "fichadas" add constraint "fichadas fechas REL" foreign key ("fecha") references "fechas" ("fecha") on update cascade;
alter table "parametros" add constraint "parametros fechas REL" foreign key ("fecha_actual") references "fechas" ("fecha") on update cascade;
alter table "per_nov_cant" add constraint "per_nov_cant fechas comienzo REL" foreign key ("comienzo") references "fechas" ("fecha") on update cascade;
alter table "per_nov_cant" add constraint "per_nov_cant fechas vencimiento REL" foreign key ("vencimiento") references "fechas" ("fecha") on update cascade;

alter table "personas_importadas" add constraint "personas_importadas grados REL" foreign key ("tramo","grado") references "grados" ("tramo","grado")  on update cascade;
alter table "personas_importadas" add constraint "personas_importadas situacion_revista REL" foreign key ("situacion_revista") references "situacion_revista" ("situacion_revista")  on update cascade;

alter table "horarios" add constraint "horarios fechas desde REL" foreign key ("desde") references "fechas" ("fecha") on update cascade;
alter table "horarios" add constraint "horarios fechas hasta REL" foreign key ("hasta") references "fechas" ("fecha") on update cascade;

alter table "personas" add constraint "personas agrupamientos REL" foreign key ("agrupamiento") references "agrupamientos" ("agrupamiento") on update cascade;
