set search_path = siper, public;

do $do$
declare
  v_actualizados integer;
begin
  if (select 1 from information_schema.table_constraints where constraint_name='personas grados REL') is null then
    update personas set grado = substr(grado, 2) where grado like '0%' and length(grado) > 1;
    get diagnostics v_actualizados = row_count;
    raise notice 'HUBO QUE corregir los grados que comienzan con 0 en % personas', v_actualizados;
  else
    raise notice 'No es necesario corregir los grados que comienzan con 0';
  end if;
end;
$do$;