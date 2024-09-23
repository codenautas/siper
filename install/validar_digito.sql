set search_path = siper;

create or replace function digito_verificador(p_digitos integer[], p_modulo integer, p_sumador integer, p_codigo text) returns integer
  language plpgsql immutable /*leakproof*/ strict parallel safe
as
$BODY$
declare
  v_dim integer;
  v_digito integer;
  v_multiplicador integer;
  v_verificador integer;
begin
  if array_length(p_digitos, 1) = length(p_codigo) then
    v_dim := length(p_codigo);
    for i in 1..v_dim loop
      v_digito := substr(p_codigo, v_dim - i + 1, 1)::integer;
      v_multiplicador := p_digitos[i];
      p_sumador := p_sumador + v_digito * v_multiplicador;
    end loop;
    v_verificador := p_sumador % p_modulo;
    if v_verificador = 0 then 
      return 0;
    end if;
    if p_modulo - v_verificador > 9 then
      return -2;
    end if;
    return p_modulo - v_verificador;
  else
    return -1;
  end if;
end;
$BODY$;
  
create or replace function validar_cuit(p_codigo text) returns boolean
  language sql immutable
as
$SQL$
  select digito_verificador(array[2,3,4,5,6,7,2,3,4,5], 11, 0, substr(p_codigo,1,length(p_codigo)-1)) = substr(p_codigo,length(p_codigo))::integer;
$SQL$;

create or replace function validar_cbu(p_codigo text) returns boolean
  language sql immutable
as
$SQL$
  select length(p_codigo) = 22
    and digito_verificador(array[3,1,7,9,3,1,7], 10, 0, substr(p_codigo,1,7)) = substr(p_codigo,8,1)::integer
    and digito_verificador(array[3,1,7,9,3,1,7,9,3,1,7,9,3], 10, 0, substr(p_codigo,9,13)) = substr(p_codigo,22,1)::integer
$SQL$;

DO
$TESTS$
declare
  rta boolean;
begin
  select validar_cuit('34999032089') into rta;
  if rta is not true then
    raise 'se esperaba true para el cuit de la ciudad y se obtuvo %',rta;
  end if;
  select validar_cuit('34999032087') into rta;
  if rta is not false then
    raise 'se esperaba false para el cuit cambiado de la ciudad y se obtuvo %',rta;
  end if;
  select validar_cbu('0110221740022101519362') into rta;
  if rta is not true then
    raise 'se esperaba true para el cbu de los bomberos de corrientes y se obtuvo %',rta;
  end if;
  select validar_cbu('0940021430008385450019') into rta;
  if rta is not true then
    raise 'se esperaba true para el cbu de los bomberos de san miguel y se obtuvo %',rta;
  end if;
  select validar_cbu('094002143000838545001') into rta;
  if rta is not false then
    raise 'se esperaba false para el cbu incompleto y se obtuvo %',rta;
  end if;
  select validar_cbu('0940021430008385450011') into rta;
  if rta is not false then
    raise 'se esperaba false para el cbu erroneo y se obtuvo %',rta;
  end if;
  select validar_cbu(null) into rta;
  if rta is not null then
    raise 'se esperaba null para el cbu null y se obtuvo %',rta;
  end if;
end;
$TESTS$;



