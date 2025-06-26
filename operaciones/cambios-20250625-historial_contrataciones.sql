set search_path = siper;
SET ROLE siper_muleto_owner;

update grados set grado = '0'||grado where grado::integer <= 9;


drop table if exists "historial_contrataciones"; 
create table "historial_contrataciones" (
  "idper" text, 
  "desde" date, 
  "hasta" date, 
  "lapso_fechas" "daterange" generated always as (daterange(desde, hasta)) stored, 
  "computa_antiguedad" boolean, 
  "organismo" text, 
  "observaciones" text, 
  "situacion_revista" text, 
  "expediente" text, 
  "funcion" text, 
  "jerarquia" text, 
  "nivel_grado" text, 
  "tarea" text, 
  "motivo_egreso" text, 
  "agrupamiento" text, 
  "tramo" text, 
  "grado" text, 
  "categoria" text, 
  "fecha_nombramiento" date, 
  "resolucion" text
, primary key ("idper", "desde")
);
grant select, insert, update, delete on "historial_contrataciones" to siper_muleto_admin;
grant all on "historial_contrataciones" to siper_muleto_owner;

alter table "historial_contrataciones" add constraint "idper<>''" check ("idper"<>'');
alter table "historial_contrataciones" add constraint "organismo<>''" check ("organismo"<>'');
alter table "historial_contrataciones" add constraint "observaciones<>''" check ("observaciones"<>'');
alter table "historial_contrataciones" add constraint "situacion_revista<>''" check ("situacion_revista"<>'');
alter table "historial_contrataciones" add constraint "expediente<>''" check ("expediente"<>'');
alter table "historial_contrataciones" add constraint "funcion<>''" check ("funcion"<>'');
alter table "historial_contrataciones" add constraint "jerarquia<>''" check ("jerarquia"<>'');
alter table "historial_contrataciones" add constraint "nivel_grado<>''" check ("nivel_grado"<>'');
alter table "historial_contrataciones" add constraint "tarea<>''" check ("tarea"<>'');
alter table "historial_contrataciones" add constraint "motivo_egreso<>''" check ("motivo_egreso"<>'');
alter table "historial_contrataciones" add constraint "agrupamiento<>''" check ("agrupamiento"<>'');
alter table "historial_contrataciones" add constraint "tramo<>''" check ("tramo"<>'');
alter table "historial_contrataciones" add constraint "grado<>''" check ("grado"<>'');
alter table "historial_contrataciones" add constraint "categoria<>''" check ("categoria"<>'');
alter table "historial_contrataciones" add constraint "resolucion<>''" check ("resolucion"<>'');
alter table "historial_contrataciones" add constraint "sin superponer fechas contratación" exclude using GIST (idper WITH =, lapso_fechas WITH &&) WHERE (computa_antiguedad);
alter table "historial_contrataciones" add constraint "computa_antiguedad si o vacio" check (computa_antiguedad is not false);
alter table "historial_contrataciones" add constraint "Solo mayusculas en situacion_revista" check (situacion_revista similar to '[A-Z][A-Z0-9 ]*');
alter table "historial_contrataciones" add constraint "Solo mayusculas en expediente" check (expediente similar to '[A-Z][A-Z0-9 ]*');
alter table "historial_contrataciones" add constraint "Solo mayusculas en jerarquia" check (jerarquia similar to '[A-Z][A-Z0-9 ]*');
alter table "historial_contrataciones" add constraint "Solo mayusculas en nivel_grado" check (nivel_grado similar to '[A-Z][A-Z0-9 ]*');
alter table "historial_contrataciones" add constraint "Solo mayusculas en motivo_egreso" check (motivo_egreso similar to '[A-Z][A-Z0-9 ]*');


alter table "historial_contrataciones" add constraint "historial_contrataciones personas REL" foreign key ("idper") references "personas" ("idper")  on delete cascade on update cascade;
alter table "historial_contrataciones" add constraint "historial_contrataciones situacion_revista REL" foreign key ("situacion_revista") references "situacion_revista" ("situacion_revista")  on update cascade;
--alter table "historial_contrataciones" add constraint "historial_contrataciones expedientes REL" foreign key ("expediente") references "expedientes" ("expediente")  on update cascade;
--alter table "historial_contrataciones" add constraint "historial_contrataciones funciones REL" foreign key ("funcion") references "funciones" ("funcion")  on update cascade;
alter table "historial_contrataciones" add constraint "historial_contrataciones jerarquias REL" foreign key ("jerarquia") references "jerarquias" ("jerarquia")  on update cascade;
--alter table "historial_contrataciones" add constraint "historial_contrataciones nivel_grado REL" foreign key ("nivel_grado") references "nivel_grado" ("nivel_grado")  on update cascade;
--alter table "historial_contrataciones" add constraint "historial_contrataciones tareas REL" foreign key ("tarea") references "tareas" ("tarea")  on update cascade;
alter table "historial_contrataciones" add constraint "historial_contrataciones motivos_egreso REL" foreign key ("motivo_egreso") references "motivos_egreso" ("motivo_egreso")  on update cascade;
alter table "historial_contrataciones" add constraint "historial_contrataciones agrupamientos REL" foreign key ("agrupamiento") references "agrupamientos" ("agrupamiento")  on update cascade;
alter table "historial_contrataciones" add constraint "historial_contrataciones tramos REL" foreign key ("tramo") references "tramos" ("tramo")  on update cascade;
alter table "historial_contrataciones" add constraint "historial_contrataciones grados REL" foreign key ("tramo", "grado") references "grados" ("tramo", "grado")  on update cascade;
alter table "historial_contrataciones" add constraint "historial_contrataciones categorias REL" foreign key ("categoria") references "categorias" ("categoria")  on update cascade;

create index "idper 4 historial_contrataciones IDX" ON "historial_contrataciones" ("idper");
create index "situacion_revista 4 historial_contrataciones IDX" ON "historial_contrataciones" ("situacion_revista");
create index "jerarquia 4 historial_contrataciones IDX" ON "historial_contrataciones" ("jerarquia");
create index "motivo_egreso 4 historial_contrataciones IDX" ON "historial_contrataciones" ("motivo_egreso");
create index "agrupamiento 4 historial_contrataciones IDX" ON "historial_contrataciones" ("agrupamiento");
create index "tramo 4 historial_contrataciones IDX" ON "historial_contrataciones" ("tramo");
create index "tramo,grado 4 historial_contrataciones IDX" ON "historial_contrataciones" ("tramo", "grado");
create index "categoria 4 historial_contrataciones IDX" ON "historial_contrataciones" ("categoria");

--alter table "personas" add constraint "personas jerarquias REL" foreign key ("jerarquia") references "jerarquias" ("jerarquia")  on update cascade;



create table "expedientes" (
  "expediente" text, 
  "cod_2024" integer
, primary key ("expediente")
);
grant select, insert, update, delete on "expedientes" to siper_muleto_admin;
grant all on "expedientes" to siper_muleto_owner;

-- table data: ..\siper-data\version2\expedientes.tab
insert into "expedientes" ("expediente", "cod_2024") values
('SIN EXPEDIENTE', '0'),
('DECRETO', '1'),
('CARPETA', '3'),
('DISPOSICION', '4'),
('REGISTRO', '5'),
('NOTA', '6'),
('EXPEDIENTE', '7'),
('RESOLUCION', '8');

alter table "expedientes" add constraint "expediente<>''" check ("expediente"<>'');
alter table "expedientes" add constraint "Solo mayusculas en expediente" check (expediente similar to '[A-Z][A-Z0-9 ]*');

alter table "historial_contrataciones" add constraint "historial_contrataciones expedientes REL" foreign key ("expediente") references "expedientes" ("expediente")  on update cascade;

--------------------------------------------
create table "funciones" (
  "funcion" text, 
  "descripcion" text, 
  "cod_2024" integer
, primary key ("funcion")
);
grant select, insert, update, delete on "funciones" to siper_muleto_admin;
grant all on "funciones" to siper_muleto_owner;

-- table data: ..\siper-data\version2\funciones.tab
insert into "funciones" ("funcion", "descripcion", "cod_2024") values
('0', 'Sin funcion  definida', '0'),
('1', 'REALIZAR TAREAS ADMINISTRATIVAS GENERICAS', '1'),
('5', 'Guardar / archivar / almacenar documentación en forma manual, en base a criterios taxativos y simples. (Ej. Sistemas alfabéticos, cronológicos, numéricos, etc.)', '5'),
('15', 'Buscar Información o información de Archivo', '15'),
('20', 'Buscar o consultar información de fuentes externas en base a criterios propios para investigaciones o analisis relacionados con los objetivos del Area', '20'),
('30', 'Fotocopiar, fotoduplicar , escanear o reproducir documentos utilizando diversas técnicas, sin realizar tareas de archivo', '30'),
('40', 'Ingresar o volcar datos en forma manual o informatizada en planillas, libros, formularios prediseñados o en sistemas informaticos, independientemente de la naturaleza de los datos, en base a criterios taxativos y simples.', '40'),
('45', 'Despachar, entregar, recibir documentación, notas formularios, recibos, fichas, remitos, cartas, artículos, boletines oficiales, prensa, y otros', '45'),
('50', 'Inventariar o controlar stocks de bienes muebles o materiales', '50'),
('60', 'Registrar y/o actualizar información internao externa en una base de datos para el funcionamiento del área', '60'),
('65', 'Seleccionar y/o clasificar documentación, tal como notas, formularios, fichas, remitos, cartas, artículos, boletines oficiales, etc., en base a criterios definidos por el agente.', '65'),
('70', 'Clasifiar la documentación de archivos temáticos sobre la base de un conocimiento específico.', '70'),
('75', 'Revisar y/o corregir los aspectos formales en la realización de determinados documentos. (Ej. Ortografía, puntuación, gramñatica, margenes, etc.)', '75'),
('80', 'Revisar documentos a fin de verificar su exactitud, complejidad y sujeción a normas. Puede incluir corrección de los mismos. (Ej. Contratos, pliegos licitatorios, documentos contables, etc.)', '80'),
('85', 'Realizar estudios estadisticos', '85'),
('95', 'Orientar al público externo sobre algún área o aspecto del GCABA o de la repartición en forma personalizada a través de una mesa o ventanilla.', '95'),
('100', 'Orientar al público externo sobre algun área o aspecto del GCABA o de la repartición a través de una línea telefónica y/o derivar la consulta al área correspondiente.', '100'),
('105', 'Atender reclamos o servicios de urgencia del público externo que no impliquen contención profesional a través de una mesa, ventanilla y/o línea telefónica específicamente constituidas para tal fin.', '105'),
('115', 'Atender al público interno: Transmitir información o responder rutinariamente consultas o reclamos que requieran de información que se encuentra disponible.', '115'),
('135', 'Desarrollar contenidos de cualquier tipo cuyo fin sea la información pública institucional, interna o externa.', '135'),
('140', 'Redactar y/o documentación tal como notas sencilas o sus equivalentes, dictámenes, notificaciones, comunicaciones, pases internos, informes, a partir de modelos tipificados o respuestas de uso frecuente.', '140'),
('145', 'Redactar documentos originales (sin modelos estandarizados) tales como proyectos de normativa, disposiciones, resoluciones, decretos, leyes, notas, plegos, dictámenes, actas formales, respuestas no tipificadas a expedientes u oficios judiciales, etc).', '145'),
('150', 'Efectuar cálculos contables y/o financieros de prestaciones que requieran del juicio, iniciativa y conocimiento básico de prácticas contables: (Ej. Conciliaciones bancarias, liquidación de sueldos, órdenes de compra, etc.)', '150'),
('155', 'Manejar dinero y/o valores para efectuar pagos y/o recibir cobros, en contacto con público externo y/o recaudar o reponer efectivo en las cajas GCBA.', '155'),
('160', 'ADMINISTRADOR DE CAJA CHICA', '160'),
('165', 'Programar: Diseñar y codificar programas, realizar mantenimiento de software. No realiza análisis de sistemas. Realiza relevamiento, desarrollo e implementación de páginas web y aplicaciones web.', '165'),
('170', 'Realizar soporte técnico: responder consultas, desarrollar guías de ayuda, entrenar a personal. Instalar hardware y software, realizar mantenimiento, corregir fallas en los sistemas, equipos y redes. Administrar cuentas de correo. Administrar usuarios.', '170'),
('172', 'Ejecutar operaciones del centro de cómputos. Operar servidores. Operar sistemas de control de calidad. Operar sistemas cintoteca. Monotorear el estado y verificar la disponibilidad de servidores, redes y bases de datos y operar los equipos perifèricos', '172'),
('175', 'Analizar sistemas, traducir requerimientos informaticos, diseños de sistemas. Diseñar la lógica y probar los códigos y prepararlos para operación. Probar la operación y preparar la documentación respectiva. Definir pautas para Auditoria.', '175'),
('180', 'Auditar sistemas informáticos. No incluye las tareas auxiliares.', '180'),
('200', 'Instruir o capacitar a otros agentes del GCBA para la adquisición o mejoramiento de habilidades, conocimientos o aptitudes específicos, a partir de actividades o programas definidos a tal fin. No incluye asesoramiento puntuales o de rutina.', '200'),
('203', 'ARQUITECTO', '203'),
('207', 'CONTADOR', '207'),
('215', 'Administrar la agenda del funcionario. (Ej. Coordinar reuniones, planificar entrevistas, etc.)', '215'),
('216', 'Realizar análisis, estudios diseños, controles, informes, investigaciones o asistencias que impliquen calificada idoneidad.', '216'),
('220', 'Representar a su unidad y/o vincularla con otras organizaciones en función de la competencia de su área. (Ej. Integrar la comisión de preadjudicaciones, programas interjuridiccionales.)', '220'),
('221', 'Diligenciar trámites o asuntos de la repartición tomando contacto con otras áreas para agilizarlos, promoverlos y activarlos.', '221'),
('222', 'Vincular en forma permanente a sectores del gobierno con instituciones, servicios, programas u otras instancias similares externas, para articular políticas y acciones conjuntas.', '222'),
('225', 'Ejecutar tareas de inspección, tanto interna como externa', '225'),
('230', 'Efectuar tareas de auditoría legal económica, de procesos o de resultados. No incluye las tareas auxiliares de auditoría.', '230'),
('235', 'Certificar / autentificar documentación de cualquier tipo', '235'),
('240', 'Supervisar el cumplimiento de las tareas asignadas a otros agentes', '240'),
('241', 'LICENCIADO EN SISTEMAS', '241'),
('245', 'Controlar el cumplimiento de procesos de trabajo y procedimientos establecidos.', '245'),
('250', 'Controlar el producto o el resultado del trabajo realizado por otros agentes.', '250'),
('255', 'Coordinar, definir el ritmo de la ejecución de diferentes tareas con el objeto de lograr sincronía.', '255'),
('260', 'Emitir instrucciones, asignar tareas, hacer cumplir las reglas y/o procedimientos.', '260'),
('265', 'Planificar, definir estrategias, establecer metas, elaborar programas, pronósticos y estimaciones.', '265'),
('270', 'Realizar análisis, estudios, diseños, controles, informes, investigaciones o asistencias propias de una función profesional', '270'),
('275', 'ELABORAR PROYECTOS, PROGRAMAS, NORMAS O PROCEDIMIE', '275'),
('280', 'Ser responsable primario de proyectos o programas exclusivamente a su cargo', '280'),
('285', 'Dirigir o coordinar proyectos, programas o áreas relativos a la temática de su profesión (implica tener personal profesional a cargo)', '285'),
('290', 'Realizar tareas, análisis, estudios, diseños, controles, informes, investigaciones o asistencias propias de una función técnica', '290'),
('300', 'SER RESPONBLE PRIMARIO DE PROYECTOS O PROGRAMAS EX', '300'),
('305', 'Dirigir o coordinar proyectos, programas o áreas relativos a la temática de su profesión (implica tener personal técnico a cargo)', '305'),
('308', 'SISTEMAS', '308'),
('347', 'BACHILLER', '347'),
('480', 'Electricista de equipos de electrónica, grabación, videograbación y TV', '480'),
('565', 'OPERARIO DE LIMPIEZA', '565'),
('666', 'Restaurador', '666'),
('685', 'OPERARIO DE DESINFECCION Y DESRRATIZACION', '685'),
('775', 'Ascensorista, correo y/u ordenanza', '775'),
('800', 'Auxiliar de portería', '800'),
('915', 'AGENTE DE SEGURIDAD / VIGILANCIA', '915'),
('920', 'Casero / sereno', '920'),
('950', 'Conductor de automotores', '950'),
('985', 'Pañolero / encargado de depósito, almacén o garage.', '985'),
('987', '203', '987');

alter table "funciones" add constraint "funcion<>''" check ("funcion"<>'');
alter table "funciones" add constraint "descripcion<>''" check ("descripcion"<>'');

alter table "historial_contrataciones" add constraint "historial_contrataciones funciones REL" foreign key ("funcion") references "funciones" ("funcion")  on update cascade;

create table "nivel_grado" (
  "nivel_grado" text, 
  "cod_2024" integer
, primary key ("nivel_grado")
);
grant select, insert, update, delete on "nivel_grado" to siper_muleto_admin;
grant all on "nivel_grado" to siper_muleto_owner;

-- table data: ..\siper-data\version2\nivel_grado.tab
insert into "nivel_grado" ("nivel_grado", "cod_2024") values
('A', '67'),
('A001', '71'),
('A02', '63'),
('A031', '72'),
('A046', '73'),
('A051', '74'),
('A054', '75'),
('A060', '76'),
('A071', '77'),
('A079', '78'),
('A086', '79'),
('A087', '80'),
('A130', '81'),
('A154', '82'),
('AA01', '1'),
('AA02', '2'),
('AA03', '3'),
('AA04', '4'),
('AA05', '5'),
('AA06', '6'),
('AA07', '7'),
('AA08', '8'),
('AB01', '9'),
('AB02', '10'),
('AB03', '11'),
('AB04', '12'),
('AB05', '13'),
('AB06', '14'),
('AB07', '15'),
('AB08', '16'),
('B00', '62'),
('D00', '65'),
('E03', '66'),
('H00', '110'),
('H09', '103'),
('K000', '99'),
('K017', '106'),
('K035', '105'),
('K053', '98'),
('K060', '104'),
('K090', '107'),
('K124', '101'),
('K159', '108'),
('K235', '109'),
('K236', '102'),
('K240', '100'),
('M05', '112'),
('M06', '97'),
('M07', '111'),
('M08', '95'),
('M12', '113'),
('P', '68'),
('P001', '83'),
('P074', '84'),
('P075', '85'),
('P111', '86'),
('PA01', '17'),
('PA02', '18'),
('PA03', '19'),
('PA04', '20'),
('PA05', '21'),
('PA06', '22'),
('PA07', '23'),
('PA08', '24'),
('PB01', '25'),
('PB02', '26'),
('PB03', '27'),
('PB04', '28'),
('PB05', '29'),
('PB06', '30'),
('Q064', '87'),
('Q093', '88'),
('S', '70'),
('S001', '89'),
('SA01', '31'),
('SA02', '32'),
('SA03', '33'),
('SA04', '34'),
('SA05', '35'),
('SA06', '36'),
('SA07', '37'),
('SA08', '38'),
('SB01', '39'),
('SB02', '40'),
('SB03', '41'),
('SB04', '42'),
('SB05', '43'),
('SB06', '44'),
('SB07', '45'),
('SB08', '46'),
('SIN', '0'),
('T', '69'),
('T001', '90'),
('T079', '91'),
('T118', '92'),
('T136', '93'),
('TA01', '47'),
('TA02', '48'),
('TA03', '49'),
('TA04', '50'),
('TA05', '51'),
('TA06', '52'),
('TA07', '53'),
('TA08', '54'),
('TB01', '55'),
('TB02', '56'),
('TB03', '57'),
('TB04', '58'),
('TB05', '59'),
('TB06', '60'),
('W05', '94'),
('W06', '96');

alter table "nivel_grado" add constraint "nivel_grado<>''" check ("nivel_grado"<>'');
alter table "nivel_grado" add constraint "palabra corta y solo mayusculas en nivel_grado" check (nivel_grado similar to '[A-Z][A-Z0-9]{0,9}|[1-9]\d{0,10}');

--alter table "historial_contrataciones" add constraint "nivel_grado<>''" check ("nivel_grado"<>'');
--alter table "historial_contrataciones" add constraint "Solo mayusculas en nivel_grado" check (nivel_grado similar to '[A-Z][A-Z0-9 ]*');
alter table "historial_contrataciones" add constraint "historial_contrataciones nivel_grado REL" foreign key ("nivel_grado") references "nivel_grado" ("nivel_grado")  on update cascade;
create index "nivel_grado 4 historial_contrataciones IDX" ON "historial_contrataciones" ("nivel_grado");


create table "tareas" (
  "tarea" text, 
  "descripcion" text, 
  "horas_semanales" integer, 
  "horas_dia" integer, 
  "minimo_horas_por_dia" integer, 
  "maximo_horas_por_dia" integer, 
  "nocturno" boolean, 
  "fin_semana" boolean, 
  "guardia" boolean, 
  "hora_entrada_desde" time, 
  "hora_salida_hasta" time, 
  "horario_flexible" boolean, 
  "cod_2024" integer
, primary key ("tarea")
);
grant select, insert, update, delete on "tareas" to siper_muleto_admin;
grant all on "tareas" to siper_muleto_owner;

-- table data: ..\siper-data\version2\tareas.tab
insert into "tareas" ("tarea", "descripcion", "horas_semanales", "horas_dia", "minimo_horas_por_dia", "maximo_horas_por_dia", "nocturno", "fin_semana", "guardia", "hora_entrada_desde", "hora_salida_hasta", "horario_flexible", "cod_2024") values
('1', 'General', '35', '0', '1', '10', 'false', 'false', 'false', '07:00', '19:00', 'true', '1'),
('10', 'Pasante 5 hs', '25', '0', '1', '7', 'false', 'false', 'false', '08:00', '18:00', 'true', '10'),
('11', 'Rotativo', '36', '12', '12', '12', 'true', 'true', 'false', '07:00', '23:00', 'true', '11'),
('13', 'Jornada  4 hs decreto 7171/90', '20', '4', '4', '4', 'false', 'false', 'false', '08:00', '18:00', 'true', '13'),
('14', 'Lactancia 5 hs decreto827', '25', '5', '5', '5', 'false', 'false', 'false', '08:00', '18:00', 'true', '14'),
('15', 'Pasante 4 hs', '20', '0', '1', '6', 'false', 'false', 'false', '08:00', '18:00', 'true', '15'),
('2', 'Chofer', '24', '12', '12', '12', 'true', 'true', 'false', '07:00', '23:00', 'true', '2'),
('3', 'Correo/Ordenanza', '35', '0', '1', '10', 'false', 'false', 'true', '08:00', '18:00', 'true', '3'),
('4', 'Franquero', '24', '12', '12', '12', 'false', 'true', 'false', '06:00', '23:00', 'true', '4'),
('5', 'Franquero nocturno', '24', '12', '12', '12', 'true', 'true', 'false', '23:00', '06:00', 'true', '5'),
('6', 'Res 393 Art. 5', '35', '0', '0', '10', 'false', 'false', 'false', '00:00', '23:59', 'true', '6'),
('7', 'Res 393 Art. 5 (6 horas)', '30', '6', '0', '10', 'false', 'false', 'false', '00:00', '23:59', 'true', '7'),
('81', 'Prestador 1 hs', '1', '0', '0', '1', 'false', 'false', 'false', '08:00', '18:00', 'true', '81'),
('82', 'Profesional 4 hs', '4', '0', '0', '4', 'false', 'false', 'false', '08:00', '18:00', 'true', '82'),
('83', 'Inspector', '35', '0', '1', '14', 'false', 'false', 'true', '08:00', '18:00', 'false', '83'),
('84', 'Verificador', '35', '0', '1', '14', 'false', 'false', 'true', '08:00', '18:00', 'false', '84'),
('86', 'Notificador', '35', '0', '1', '14', 'false', 'false', 'true', '08:00', '18:00', 'false', '86'),
('87', 'Censista', '35', '0', '1', '14', 'false', 'false', 'true', '08:00', '18:00', 'false', '87'),
('88', 'Valuador', '35', '0', '1', '14', 'false', 'false', 'true', '08:00', '18:00', 'false', '88'),
('89', 'General 6 hs', '30', '0', '1', '8', 'false', 'false', 'false', '08:00', '18:00', 'true', '89'),
('9', 'Riesgoso/Insalubre', '30', '6', '6', '6', 'true', 'false', 'false', '08:00', '19:30', 'true', '9'),
('90', 'Lactancia-Inspect. 5 hs decr. 827', '25', '5', '5', '5', 'false', 'false', 'false', '08:00', '18:00', 'true', '90'),
('91', 'Riesgoso/Insalubre', '30', '6', '6', '6', 'true', 'true', 'false', '08:00', '19:30', 'true', '91');

alter table "tareas" add constraint "tarea<>''" check ("tarea"<>'');
alter table "tareas" add constraint "descripcion<>''" check ("descripcion"<>'');

alter table "historial_contrataciones" add constraint "historial_contrataciones tareas REL" foreign key ("tarea") references "tareas" ("tarea")  on update cascade;


alter table "personas" add constraint "personas agrupamientos REL" foreign key ("agrupamiento") references "agrupamientos" ("agrupamiento")  on update cascade;
--alter table "historial_contrataciones" add constraint "historial_contrataciones agrupamientos REL" foreign key ("agrupamiento") references "agrupamientos" ("agrupamiento")  on update cascade;

--alter table "historial_contrataciones" add constraint "historial_contrataciones categorias REL" foreign key ("categoria") references "categorias" ("categoria")  on update cascade;

alter table "personas" add constraint "personas grados REL" foreign key ("tramo", "grado") references "grados" ("tramo", "grado")  on update cascade;
--alter table "historial_contrataciones" add constraint "historial_contrataciones grados REL" foreign key ("tramo", "grado") references "grados" ("tramo", "grado")  on update cascade;

create index "expediente 4 historial_contrataciones IDX" ON "historial_contrataciones" ("expediente");
create index "funcion 4 historial_contrataciones IDX" ON "historial_contrataciones" ("funcion");
create index "tarea 4 historial_contrataciones IDX" ON "historial_contrataciones" ("tarea");


do $SQL_ENANCE$
 begin
 PERFORM enance_table('expedientes','expediente');
 PERFORM enance_table('funciones','funcion');
 PERFORM enance_table('nivel_grado','nivel_grado');
 PERFORM enance_table('tareas','tarea');
 PERFORM enance_table('historial_contrataciones','idper,desde');

 end
$SQL_ENANCE$;


ALTER TABLE "historial_contrataciones" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "historial_contrataciones" AS PERMISSIVE FOR all TO siper_muleto_admin USING ( true );
CREATE POLICY "bp select" ON "historial_contrataciones" AS RESTRICTIVE FOR select TO siper_muleto_admin USING ( ( -- PUEDE TODO:
                SELECT puede_ver_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_ver_propio FROM roles WHERE rol = get_app_user('rol') AND historial_contrataciones.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_ver_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = historial_contrataciones.idper),
                        get_app_user('sector')
                    )
                )
            )
         );
CREATE POLICY "bp insert" ON "historial_contrataciones" AS RESTRICTIVE FOR insert TO siper_muleto_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND historial_contrataciones.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = historial_contrataciones.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (desde 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp update" ON "historial_contrataciones" AS RESTRICTIVE FOR update TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND historial_contrataciones.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = historial_contrataciones.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (desde 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp delete" ON "historial_contrataciones" AS RESTRICTIVE FOR delete TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND historial_contrataciones.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = historial_contrataciones.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (desde 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );