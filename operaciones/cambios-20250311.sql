set search_path = "siper"

-- ticket 119
alter table "personas" add constraint "idper<>''" check ("idper"<>'');

-- ticket 120
alter table "personas" add constraint "personas paises REL" foreign key ("nacionalidad") references "paises" ("pais")  on update cascade;
alter table "personas" add constraint "personas categorias REL" foreign key ("categoria") references "categorias" ("categoria")  on update cascade;
