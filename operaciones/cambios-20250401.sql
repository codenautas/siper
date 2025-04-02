set search_path=siper;

alter table "personas" add constraint "jerarquia<>''" check ("jerarquia"<>'');
alter table "personas" add constraint "personas jerarquias REL" foreign key ("jerarquia") references "jerarquias" ("jerarquia")  on update cascade;
create index "jerarquia 4 personas IDX" ON "personas" ("jerarquia");

alter table "per_domicilios" add constraint "per_domicilios tipos_domicilio REL" foreign key ("tipo_domicilio") references "tipos_domicilio" ("tipo_domicilio")  on update cascade;
