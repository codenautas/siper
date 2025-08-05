set search_path = siper;
SET ROLE siper_muleto_owner;

alter table personas add column puesto integer;

create table "puestos" (
  "puesto" integer, 
  "nombre" text, 
  "objetivo" text
, primary key ("puesto")
);
grant select, insert, update, delete on "puestos" to siper_admin;
grant all on "puestos" to siper_owner;


-- table data: ..\siper-data\version2\puestos.tab
insert into "puestos" ("puesto", "nombre", "objetivo") values
('1', 'Analista Administrativo', 'Planear, organizar, dirigir, supervisar, controlar y evaluar las actividades administrativas de la organización. Establecer y proponer los procedimientos que permitan optimizar la administración de los recursos humanos, materiales, financieros y de servicios generales, para atender las necesidades de las áreas.'),
('2', 'Analista en cartografía', 'Realizar y coordinar las actividades de actualización y procesamiento de la información cartográfica digital, georeferenciada y espacial que garantice el levantamiento de información en las diferentes investigaciones estadísticas.'),
('3', 'Analista en comunicación y diseño', 'Realizar los procesos de diseño, difusión y comunicación de los proyectos, programas y publicaciones que realiza la organización, manteniendo un contacto fluido con el GCBA y los medios masivos de comunicación con la finalidad de impulsar el desarrollo de una cultura estadística en la CABA.'),
('4', 'Analista en estadística', 'Planificar, realizar y controlar la producción estadística confiable y oportuna que permita valorar y cuantificar las principales características estructurales y el acontecer coyuntural de la Ciudad de Buenos Aires. Generar bases de datos, cuadros, informes, estimaciones, estudios comparativos en base a otras jurisdicciones nacionales y otros países. Analizar técnicas estadísticas establecidas por organismos internacionales y confeccionar bases de datos.'),
('5', 'Analista de Relaciones Institucionales', 'Vincular al IDECBA con otros organismos del GCABA y/o instituciones externas tanto públicas como privadas, nacionales o internacionales con el objeto de acordar y articular políticas y acciones conjuntas para impulsar el desarrollo de una cultura estadística en la CABA.'),
('6', 'Analista en soporte informático', 'Mantener y monitorear la infraestructura de servidores, equipamiento informático y redes internas. Solucionar incidentes sobre hardware, software y conectividad. Generar y controlar copias de resguardo (backup)'),
('7', 'Analista en Gestión de la calidad', 'Dirigir, planificar, organizar y controlar los procesos, procedimientos y actividades relacionadas con la gestión de la calidad, con el fin de garantizar el cumplimiento de sus estándares y normas, así como promover la mejora continua.'),
('8', 'Analista en Información y Documentación', 'Organizar, supervisar y evaluar el servicio de atención al usuario y gestionar  la información documental almacenada en el banco de datos y el catálogo bibliográfico para satisfacer los requerimientos de información de los usuarios externos  e internos.'),
('9', 'Analista Legal y contable', 'Ejercer profesionalmente la defensa jurídica de la organización, así como controlar los procesos judiciales y administrativos en los que la entidad esté involucrada. Ejercer profesionalmente las tareas referentes a la contabilidad y control interno de la entidad.'),
('10', 'Analista en Logística', 'Coordinar los requerimientos internos, en lo relativo a la logística de operativos de campo regulares y especiales. Coordinar el transporte de los recursos humanos y físicos relacionados con las actividades de IDECBA. Gestionar los pedidos de mantenimiento ante la intendencia del edificio.'),
('11', 'Analista en muestreo', 'Realizar el diseño de muestras a partir de los marcos muestrales para garantizar el levantamiento de información en los diferentes operativos estadísticos.'),
('12', 'Analista en Programación Informática', 'Diseñar y desarrollar nuevas aplicaciones informáticas o mejorar las existentes en función de las necesidades y especificaciones requeridas por la organización.'),
('13', 'Analista en Recursos Humanos', 'Planear, coordinar y controlar los recursos humanos de la organización. Gestionar la capacitación y propiciar un ambiente laboral favorable para alcanzar el logro de los objetivos institucionales.'),
('14', 'Asistente Administrativo', 'Apoyar el desarrollo de las actividades administrativas y secretariales del servicio para concretar de forma oportuna los objetivos planificados, respetando los procedimientos internos y las normas establecidas.'),
('15', 'Asistente en Cartografía', 'Asistir en las actividades de recolección, actualización y procesamiento de la información cartográfica estadística y aplicaciones georeferenciales para concretar de forma oportuna los objetivos planificados'),
('16', 'Asistente en comunicación y diseño', 'Asistir y colaborar en las acciones de comunicación, gestión y edición editorial. Colaborar en el la realización de las publicaciones institucionales para concretar de forma oportuna los objetivos planificados'),
('17', 'Asistente en estadística', 'Realizar actividades de apoyo en la planificación y análisis de los procesos estadísticos  (sociodemográficos,  económicos, fiscales, etc.)'),
('18', 'Asistente en  Relaciones Institucionales', 'Brindar asistencia en la promoción de vínculos institucionales  con otros organismos del GCBA y/o instituciones externas tanto públicas como privadas, nacionales o internacionales.'),
('19', 'Asistente en Soporte informático', 'Mantener y monitorear la infraestructura de servidores, equipamiento informático y redes internas. Solucionar incidentes sobre hardware, software y conectividad. Generar y controlar copias de resguardo (backup)'),
('20', 'Asistente en gestión de calidad', 'Asistir en la coordinación del sistema de gestión de calidad de la organización para concretar de forma oportuna los objetivos planificados.'),
('21', 'Asistente en Información y Documentación', 'Asistir en la gestión y tratamiento de información documental y en las actividades del servicio de atención para satisfacer los requerimientos de información al usuario interno y externo.'),
('22', 'Asistente Legal y contable', 'Realizar actividades de apoyo en las diligencias legales, judiciales y contables. Preparación de trámites institucionales: administrativos, contables y jurídicos para concretar de forma oportuna los objetivos planificados.'),
('23', 'Asistente en Logística', 'Brindar asistencia logística en la realización de operativos de campo (encuestas y censos) y eventos (capacitaciones, presentaciones, ceremonias, etc.).'),
('24', 'Asistente en Muestreo', 'Asistir en el diseño de muestras a partir de los marcos muestrales para concretar de forma oportuna los objetivos planificados.'),
('25', 'Asistente Programación Informática', 'Colaborar en el desarrollo y/o adaptación de aplicaciones informáticas para concretar de forma oportuna los objetivos planificados.'),
('26', 'Asistente en Recursos Humanos', 'Asistir en la gestión de los recursos humanos, realización de la capacitación y en las acciones que propicien un ambiente laboral favorable para alcanzar el logro de los objetivos institucionales.'),
('27', 'Auxiliar Administrativo', 'Realizar tareas administrativas sencillas que se le asignen, para concretar de forma oportuna los objetivos planificados.'),
('28', 'Auxiliar en Logística', 'Ejecutar las tareas de logística para operativos de campo (censos/encuestas) y eventos (capacitaciones, presentaciones, ceremonias, etc.)'),
('29', 'Auxiliar Especializado', 'Apoyar el desarrollo de las actividades técnico administrativas en el sector de trabajo para la concreción oportuna de los resultados esperados según los objetivos marcados, respetando los procedimientos internos y las normas establecidas.'),
('30', 'Encuestador', 'Recolectar datos de forma veraz y acorde con los objetivos definidos en el operativo, con la finalidad de obtener datos primarios consistentes y actuales. Asegurándose de tratarlos con discreción, reserva, confiabilidad y rigor técnico.'),
('31', 'Chofer', 'Prestar servicio de transporte a los funcionarios y personal de la organización tanto en las actividades diarias como en las extraordinarias que se programen.');

alter table "puestos" add constraint "nombre<>''" check ("nombre"<>'');
alter table "puestos" add constraint "objetivo<>''" check ("objetivo"<>'');

create index "puesto 4 personas IDX" ON "personas" ("puesto");

alter table "personas" add constraint "personas puestos REL" foreign key ("puesto") references "puestos" ("puesto")  on update cascade;


do $SQL_ENANCE$
 begin
 PERFORM enance_table('puestos','puesto');
 end
$SQL_ENANCE$;