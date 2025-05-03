set search_path = "siper"

alter table "personas"
  add constraint "personas tipos_doc REL" foreign key ("tipo_doc") 
    references "tipos_doc" ("tipo_doc")  on update cascade;