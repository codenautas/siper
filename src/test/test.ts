"use strict";

// @ts-ignore 
import * as assert from "assert";

import { AppSiper } from '../server/app-principal';

import {promises as fs} from 'fs'

import { startServer, EmulatedSession, expectError, loadLocalFile, saveLocalFile, benchmarksSave, someTestFails} from "./probador-serial";

import * as ctts from "../common/contracts"

import { date } from "best-globals";

import * as discrepances from 'discrepances';

const TIMEOUT_SPEED = 1000 * (process.env.BP_TIMEOUT_SPEED as unknown as number ?? 1);

/*
 * Para debuguear el servidor por separado hay abrir dos ventanas, en una corren los test (normalmente) 
 * y en la otra corre el servidor (para poner breakpoints elegir cuál se corre en visual studio code).
 * antes de npm start (el servidor) hay que poner 
 * 
 *      set BACKEND_PLUS_LOCAL_CONFIG=config-adicionar-para-test.yaml
 * 
 * y antes de correr los tests hay que comentar con // la próxima línea (para qu se descomente el PORT = 3333)
 */
const PORT:number|null = null; /*
const PORT = 3333;
// */

function console_log<T>(x:T){
    console.log('____________',x)
    return x;
}

if (!console_log) console.log('dummy');

// /*
declare global {
    // var fetch: typeof import("node-fetch").default;
    // var FormData: typeof import("form-data");
}
// */

/*
import * as from "node-fetch";
// var fetch: typeof import("node-fetch").default;
import * as FormData from "form-data";
*/

const FECHA_ACTUAL = date.iso('2000-01-31');
const DESDE_AÑO = `2000`;
const HASTA_AÑO = `2001`;
const AÑOS_DE_PRUEBA = `annio BETWEEN ${DESDE_AÑO} AND ${HASTA_AÑO}`;
const FECHAS_DE_PRUEBA = `extract(year from fecha) BETWEEN ${DESDE_AÑO} AND ${DESDE_AÑO}`;
const IDPER_DE_PRUEBA = `idper like 'XX%'`;
const SECTOR = 'M';
const SITUACION_REVISTA = "XX";

const COD_VACACIONES = "1";
const COD_TRAMITE = "121";
const COD_DIAGRAMADO = "101";
const COD_ENF_FAMILIAR = "12";
const COD_ENFERMEDAD = "13";
const COD_MUDANZA = "124";
const COD_COMISION = "10";
const COD_PRED_PAS: string|null = '999'; // es el código predeterminado para un día laborable en el pasado y presente
const COD_PRED_FUT: string|null = null; // es el código predeterminado para un día laborable en el futuro, por ahora null

const ADMIN_REQ = {user:{usuario:'perry', rol:''}};
const TEXTO_PRUEBA = "un texto de prueba...";
const HASTA_HORA = "14:00";
const DESDE_HORA = "12:00";

const PAUTA_CORRIDOS = "CORRIDOS";
const PAUTA_ANTCOMVSRE = "ANTCOMVSRE";

const NOVEDADES_TEST = `('10001','10002','10003')`;

const sqlCalcularNovedades = `CALL actualizar_novedades_vigentes('${DESDE_AÑO}-01-01'::date,'${DESDE_AÑO}-12-31'::date)`;

var autoNumero = 1;

type Credenciales = {username: string, password: string};
type UsuarioConCredenciales = ctts.Usuario & {credenciales: Credenciales};

describe("connected", function(){
    var server: AppSiper;
    var rrhhSession: EmulatedSession<AppSiper>;
    var rrhhAdminSession: EmulatedSession<AppSiper>; // no cualquier rrhh
    var borradoExitoso: boolean = false;
    var fallaEnLaQueQuieroOmitirElBorrado: boolean = false;
    before(async function(){
        try{
            server = await startServer(AppSiper);
            rrhhAdminSession = new EmulatedSession(server, PORT || server.config.server.port);
            await rrhhAdminSession.login({
                username: 'perry',
                password: 'white',
            });
            rrhhSession = new EmulatedSession(server, PORT || server.config.server.port);
            await rrhhSession.login({
                username: 'jimmi',
                password: 'olsen',
            });
        } catch(err) {
            console.log(err);
            throw err;
        }
    })
    beforeEach(async function(){
        await server.inDbClient(ADMIN_REQ, async client=>{
            await client.executeSentences([
                `update fechas set laborable=null, repite=null, inamovible=null where fecha in ('2000-01-10','2000-01-11')`,
                `update fechas set cod_nov_pred_fecha=null where cod_nov_pred_fecha in ${NOVEDADES_TEST}`,
                `delete from novedades_registradas where cod_nov in ${NOVEDADES_TEST}`,
                `delete from cod_novedades where cod_nov in ${NOVEDADES_TEST}`,
            ]);
        });
    })
    it("borra todo y prepara para el control de tiempos", async function(){
        try{
            this.timeout(TIMEOUT_SPEED * 30);
            console.log('/// comienzo del borrado', new Date())
            if (server.config.devel['tests-can-delete-db']) {
                await server.inDbClient(ADMIN_REQ, async client=>{
                    console.log('/// comienzo del borrado efectivo', new Date())
                    await client.executeSentences([
                        `delete from per_nov_cant where ${AÑOS_DE_PRUEBA}`,
                        `delete from nov_gru where ${AÑOS_DE_PRUEBA}`,
                        `delete from novedades_vigentes where (${AÑOS_DE_PRUEBA} OR ${IDPER_DE_PRUEBA})`,
                        `delete from horarios where ${IDPER_DE_PRUEBA}`,
                        `delete from novedades_registradas where (${AÑOS_DE_PRUEBA} OR ${IDPER_DE_PRUEBA})`,
                        `delete from novedades_horarias where ${IDPER_DE_PRUEBA}`,
                        `delete from novedades_vigentes where (${AÑOS_DE_PRUEBA} OR ${IDPER_DE_PRUEBA})`,
                        `delete from usuarios where ${IDPER_DE_PRUEBA}`,
                        `delete from personas where ${IDPER_DE_PRUEBA}`,
                        `delete from situacion_revista where situacion_revista = '${SITUACION_REVISTA}'`,
                        `delete from grupos where ${IDPER_DE_PRUEBA.replace('idper', 'grupo')}`,
                        `delete from fechas where ${AÑOS_DE_PRUEBA}`,
                        `delete from annios where ${AÑOS_DE_PRUEBA}`,
                        `delete from cod_novedades where novedad like 'PRUEBA AUTOM_TICA%'`,
                        `delete from sectores where nombre_sector like 'PRUEBA AUTOM_TICA%'`,
                        `select annio_preparar(d) from generate_series(${DESDE_AÑO}, ${HASTA_AÑO}) d`,
                        `update fechas set laborable = false, repite = false, inamovible = false, leyenda = 'feriado '||fecha where fecha in (
                            '2000-03-06', 
                            '2000-03-07',
                            '2000-03-24',
                            '2000-04-20',
                            '2000-04-21');
                        `,
                        `update fechas set laborable = false, repite = true, inamovible = true where fecha in (
                            '2000-04-02',
                            '2000-05-01');
                        `,
                        `update fechas set cod_nov_pred_fecha = '${COD_PRED_PAS}' where extract(dow from fecha) between 1 and 5 and fecha <= '${FECHA_ACTUAL.toYmd()}'`,
                        `update annios set horario_habitual_desde = '10:00', horario_habitual_hasta = '17:00' where annio = '${DESDE_AÑO}'`,
                        `select annio_abrir('${DESDE_AÑO}')`,
                        `update parametros set fecha_actual = '${FECHA_ACTUAL.toYmd()}', cod_nov_habitual = 999 where unico_registro`,
                        `insert into sectores (sector, nombre_sector, pertenece_a, tipo_sec) values
                            ('M'      , 'PRUEBA AUTOMATICA M'      , null    ,'DG'),
                            ('PRA1'   , 'PRUEBA AUTOMATICA 1'      , null    ,'DG'),
                            ('PRA11'  , 'PRUEBA AUTOMATICA 1.1'    , 'PRA1'  ,'SDG'),
                            ('PRA111' , 'PRUEBA AUTOMATICA 1.1.1'  , 'PRA11' ,'DIR'),
                            ('PRA1111', 'PRUEBA AUTOMATICA 1.1.1.1', 'PRA111','DEP'),
                            ('PRA12'  , 'PRUEBA AUTOMATICA 1.2'    , 'PRA1'  ,'SDG');
                        `,
                        `insert into situacion_revista (situacion_revista, con_novedad) values ('${SITUACION_REVISTA}', true)`,
                    ])
                })
                console.log("Borrado y listo!")
                borradoExitoso = true;
            } else {
                throw new Error("no se puede probar sin setear devel: tests-can-delete-db: true")
            }
            console.log('/// fin del borrado', new Date())
        } catch(err) {
            console.log(err);
            throw err;
        }
    })
    async function crearUsuario(nuevoUsuario: {rol:string, idper:string}){
        const {rol, idper} = nuevoUsuario;
        var usuario = 'usuario_prueba_' + idper.toLocaleLowerCase();
        var password = 'clave_prueba_' + Math.random();
        await server.inDbClient(ADMIN_REQ, async client => {
            return await client.query(
                `INSERT INTO usuarios (usuario, md5clave, rol, idper, activo) values ($1, md5($2), $3, $4, true) returning *`,
                [usuario, password+usuario, rol, idper]
            ).fetchUniqueRow();
        })
        return {usuario, password, rol, idper, credenciales:{username:usuario, password}};
    }
    describe("configuraciones", function(){
        it("verifica que exista la tabla de parámetros", async function(){
            await rrhhSession.tableDataTest('parametros',[
                {unico_registro:true, fecha_actual: FECHA_ACTUAL},
            ], 'all')
        })
        it("verifica que un rrhh se considere registra también", async function(){
            discrepances.showAndThrow(rrhhSession.config.config.es, {mantenimiento:false, admin:false, rrhh:true, registra:true});
        })
    })
    async function crearNuevaPersona(nombre:string, opts:{registra_novedades_desde?:Date, para_antiguedad_relativa?:Date}): Promise<ctts.Persona>{
        var numero = autoNumero++;
        var persona = {
            cuil: (10330010005 + numero*11).toString(),
            apellido: "XX Prueba " + numero,
            nombres: nombre + (borradoExitoso ? '' : ' ' + Math.random()),
            activo: true,
            registra_novedades_desde: opts.registra_novedades_desde ?? date.iso(`${DESDE_AÑO}-01-01`),
            para_antiguedad_relativa: opts.para_antiguedad_relativa ?? date.iso(`${DESDE_AÑO}-01-01`),
            sector: SECTOR,
            situacion_revista: SITUACION_REVISTA,
        } satisfies Partial<ctts.Persona>;
        var personaGrabada = await rrhhSession.saveRecord(
            ctts.personas,
            persona as ctts.Persona,
            'new',
        )
        return personaGrabada;
    }
    var cacheSesionDeUsuario:Record<string, EmulatedSession<AppSiper>>={}
    async function sesionDeUsuario(usuario:UsuarioConCredenciales){
        if (usuario.usuario in cacheSesionDeUsuario) {
            return cacheSesionDeUsuario[usuario.usuario];
        }
        const nuevaSession = new EmulatedSession(server, PORT || server.config.server.port);
        await nuevaSession.login(usuario.credenciales);
        return nuevaSession
    }
    async function enNuevaPersona(
        nombre: string, 
        opciones: {
            vacaciones?: number, tramites?: number, usuario?:{rol?:string, sector?:string, sesion?:boolean}, hoy?:Date, 
            registra_novedades_desde?:Date, para_antiguedad_relativa?:Date
        },
        probar: (persona: ctts.Persona, mas:{usuario: UsuarioConCredenciales, sesion:EmulatedSession<AppSiper>}) => Promise<void>
    ){
        var haciendo = 'inicializando';
        try {
            var persona = await crearNuevaPersona(nombre, {registra_novedades_desde: opciones.registra_novedades_desde, para_antiguedad_relativa: opciones.para_antiguedad_relativa});
            var {vacaciones, tramites, hoy} = opciones;
            await rrhhAdminSession.saveRecord(ctts.per_gru, {idper: persona.idper, clase: 'U', grupo: 'T'}, 'new');
            var usuario = null as unknown as UsuarioConCredenciales;
            var sesion = null as unknown as EmulatedSession<AppSiper>;
            if (opciones.usuario) {
                usuario = await crearUsuario({rol:'basico', idper:persona.idper, ...opciones.usuario})
                if (opciones.usuario.sesion) {
                    var sesion = await sesionDeUsuario(usuario);
                }
                if (opciones.usuario.sector) await rrhhSession.saveRecord(ctts.personas,{idper:persona.idper,sector:opciones.usuario.sector}, 'update')
            }
            if (vacaciones) await rrhhAdminSession.saveRecord(ctts.per_nov_cant, {annio:2000, origen:'2000', cod_nov: COD_VACACIONES, idper: persona.idper, cantidad: vacaciones }, 'new')
            if (tramites) await rrhhAdminSession.saveRecord(ctts.per_nov_cant, {annio:2000, origen:'2000', cod_nov: COD_TRAMITE, idper:persona.idper, cantidad: 4 }, 'new')
            if (hoy) {
                await server.inDbClient(ADMIN_REQ, async client => client.query("update parametros set fecha_actual = $1", [hoy]).execute())
            }
            haciendo = 'probando'
            await probar(persona, {usuario, sesion});
        } catch (err) {
            console.error("Test enNuevaPersona falla", haciendo)
            console.log({numero: nombre})
            console.log(persona!)
            console.log(err)
            throw err;
        } finally {
            if (hoy) {
                await server.inDbClient(ADMIN_REQ, async client =>{
                    await client.query(
                        "update fechas set cod_nov_pred_fecha = $1 where cod_nov_pred_fecha = $2 and fecha between $3 and $4", 
                        [COD_PRED_FUT, COD_PRED_PAS, FECHA_ACTUAL, hoy]
                    ).execute();
                    await client.query("update parametros set fecha_actual = $1", [FECHA_ACTUAL]).execute();
                })
            }
        }
    }
    async function enDosNuevasPersonasConFeriado10EneroFeriadoy11No(
        numero:string, 
        cod_nov:string,
        probar:(persona1: ctts.Persona, pesona2: ctts.Persona, cod_nov:string) => Promise<void>
        
    ){
        var haciendo = 'Creando personas'
        try {
            var persona1 = await crearNuevaPersona(numero, {});
            var persona2 = await crearNuevaPersona(numero + " segunda persona", {});
            await rrhhAdminSession.saveRecord(ctts.cod_nov, {cod_nov, novedad: 'PRUEBA AUTOMÁTICA agregar feriado', total:true }, 'new')
            haciendo = 'poniendo el feriado'
            await rrhhAdminSession.saveRecord(
                ctts.fecha, 
                {fecha:date.iso('2000-01-10'), laborable:false, repite:false, inamovible:false, leyenda:'PRUEBA AUTOMÁTICA agregar feriado'}, 
                'update'
            )
            haciendo = 'registrando los movimientos'
            await rrhhSession.saveRecord(
                ctts.novedades_registradas, 
                {desde:date.iso('2000-01-10'), hasta:date.iso('2000-01-11'), cod_nov, idper: persona1.idper},
                'new'
            );
            await rrhhSession.saveRecord(
                ctts.novedades_registradas, 
                {desde:date.iso('2000-01-10'), hasta:date.iso('2000-01-11'), cod_nov, idper: persona2.idper},
                'new'
            );
            haciendo = 'probando'
            await probar(persona1, persona2, cod_nov);
        } catch(err) {
            console.error("Test enDosNuevasPersonasConFeriado10EneroFeriadoy11No falla", haciendo)
            console.log({numero, cod_nov})
            throw err;
        }
    }
    describe("registro de novedades", function(){
        this.timeout(TIMEOUT_SPEED * 7);
        var basicoSession: EmulatedSession<AppSiper>
        var jefe11Session: EmulatedSession<AppSiper>
        before(async function(){
            await enNuevaPersona("persona para usuario básico de sesión", {usuario:{sesion:true}}, async (_, {sesion}) => {
                basicoSession = sesion;
            });
            await enNuevaPersona("persona para usuario jefe de sector 11", {usuario:{sesion:true, rol:'registra', sector:'PRA11'}}, async (_, {sesion}) => {
                jefe11Session = sesion;
            });
        })
        it("insertar una semana de vacaciones como primera novedad", async function(){
            this.timeout(TIMEOUT_SPEED * 7);
            await enNuevaPersona(this.test?.title!, {vacaciones: 20}, async ({idper}) => {
                var novedadRegistradaPorCargar = {desde:date.iso('2000-01-01'), hasta:date.iso('2000-01-07'), cod_nov:COD_VACACIONES, idper};
                // TODO: volver a calcular el informe de coincidencias
                // var informe = await rrhhSession.callProcedure(ctts.si_cargara_novedad, novedadRegistradaPorCargar);
                // discrepances.showAndThrow(informe, {dias_corridos:7, dias_habiles:5, dias_coincidentes:0})
                await rrhhSession.saveRecord(ctts.novedades_registradas, novedadRegistradaPorCargar, 'new');
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-01'), cod_nov:null          , idper, trabajable: false},
                    {fecha:date.iso('2000-01-02'), cod_nov:null          , idper, trabajable: false},
                    {fecha:date.iso('2000-01-03'), cod_nov:COD_VACACIONES, idper, trabajable: true },
                    {fecha:date.iso('2000-01-04'), cod_nov:COD_VACACIONES, idper, trabajable: true },
                    {fecha:date.iso('2000-01-05'), cod_nov:COD_VACACIONES, idper, trabajable: true },
                    {fecha:date.iso('2000-01-06'), cod_nov:COD_VACACIONES, idper, trabajable: true },
                    {fecha:date.iso('2000-01-07'), cod_nov:COD_VACACIONES, idper, trabajable: true },
                ], 'all', {fixedFields:{idper, fecha:['2000-01-01', '2000-01-07']}})
                // LÍMIES:
                await rrhhSession.tableDataTest('nov_per', [
                    {annio:2000, cod_nov:COD_VACACIONES, cantidad:20, usados:5, pendientes:0, saldo:15},
                    {annio:2000, cod_nov:COD_PRED_PAS, cantidad:null, usados:16, pendientes:0, saldo:null},
                ], 'all', {fixedFields:{idper}})
            })
        })
        it("insertar una semana de vacaciones en una semana con feriados", async function(){
            // https://argentina.workingdays.org/dias_laborables_calendario_2000.htm
            await enNuevaPersona(this.test?.title!, {vacaciones: 15}, async (persona) => {
                const {idper} = persona;
                var novedadRegistradaPorCargar = {desde:date.iso('2000-03-06'), hasta:date.iso('2000-03-12'), cod_nov:COD_VACACIONES, idper: persona.idper}
                var informe = await rrhhSession.callProcedure(ctts.si_cargara_novedad, novedadRegistradaPorCargar);
                discrepances.showAndThrow(informe, {dias_corridos:7, dias_habiles:3, dias_coincidentes:0, con_detalles:null, c_dds:null,
                    mensaje: discrepances.test((x:string) => /confirma/.test(x)) as string,
                })
                await rrhhSession.saveRecord(ctts.novedades_registradas, novedadRegistradaPorCargar, 'new');
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-03-07'), cod_nov:null          , idper, trabajable:false},
                    {fecha:date.iso('2000-03-08'), cod_nov:COD_VACACIONES, idper, trabajable:true },
                    {fecha:date.iso('2000-03-09'), cod_nov:COD_VACACIONES, idper, trabajable:true },
                    {fecha:date.iso('2000-03-10'), cod_nov:COD_VACACIONES, idper, trabajable:true },
                    {fecha:date.iso('2000-03-11'), cod_nov:null          , idper, trabajable:false},
                ], 'all', {fixedFields:{idper, fecha:['2000-03-07','2000-03-11']}})
                // LÍMIES:
                await rrhhSession.tableDataTest('nov_per', [
                    {annio:2000, cod_nov:COD_VACACIONES, cantidad:15, usados:0, pendientes:3, saldo:12},
                    {annio:2000, cod_nov:COD_PRED_PAS, cantidad:null, usados:21, pendientes:0, saldo:null}, // días hábiles hasta el 31 de enero
                ], 'all', {fixedFields:{idper}})
            })
        })
        it("pide dos semanas de vacaciones, luego las corta y después pide trámite", async function(){
            this.timeout(TIMEOUT_SPEED * 8);
            await enNuevaPersona(this.test?.title!, {vacaciones: 20, tramites: 4}, async ({idper}) => {
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-05-01'), hasta:date.iso('2000-05-12'), cod_nov:COD_VACACIONES, idper},
                    'new'
                );
                var novedadRegistradaPorCargar = {desde:date.iso('2000-05-08'), hasta:date.iso('2000-05-12'), cancela:true, idper}
                var informe = await rrhhSession.callProcedure(ctts.si_cargara_novedad, novedadRegistradaPorCargar);
                discrepances.showAndThrow(informe, {dias_corridos:5, dias_habiles:5, dias_coincidentes:5, con_detalles: null, c_dds: null,
                    mensaje: discrepances.test((x:string) => /confirma/.test(x)) as string,
                })
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    novedadRegistradaPorCargar,
                    'new'
                );
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-05-11'), hasta:date.iso('2000-05-11'), cod_nov:COD_TRAMITE, idper},
                    'new'
                );
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-05-01'), cod_nov:null           , idper},
                    {fecha:date.iso('2000-05-02'), cod_nov:COD_VACACIONES , idper},
                    {fecha:date.iso('2000-05-03'), cod_nov:COD_VACACIONES , idper},
                    {fecha:date.iso('2000-05-04'), cod_nov:COD_VACACIONES , idper},
                    {fecha:date.iso('2000-05-05'), cod_nov:COD_VACACIONES , idper},
                    {fecha:date.iso('2000-05-06'), cod_nov:null           , idper},
                    {fecha:date.iso('2000-05-07'), cod_nov:null           , idper},
                    {fecha:date.iso('2000-05-08'), cod_nov:COD_PRED_FUT   , idper},
                    {fecha:date.iso('2000-05-09'), cod_nov:COD_PRED_FUT   , idper},
                    {fecha:date.iso('2000-05-10'), cod_nov:COD_PRED_FUT   , idper},
                    {fecha:date.iso('2000-05-11'), cod_nov:COD_TRAMITE    , idper},
                    {fecha:date.iso('2000-05-12'), cod_nov:COD_PRED_FUT   , idper},
                ], 'all', {fixedFields:{idper, fecha:['2000-05-01', '2000-05-12']}})
                // LÍMIES:
                await rrhhSession.tableDataTest('nov_per', [
                    {annio:2000, cod_nov:COD_VACACIONES, cantidad:20, usados:0, pendientes:4, saldo:16},
                    {annio:2000, cod_nov:COD_TRAMITE   , cantidad:4 , usados:0, pendientes:1, saldo:3 },
                    {annio:2000, cod_nov:COD_PRED_PAS, cantidad:null, usados:21, pendientes:0, saldo:null}, // días hábiles hasta el 31 de enero
                ], 'all', {fixedFields:{idper}})
            })
        })
        it("cargo un día de trámite", async function(){
            fallaEnLaQueQuieroOmitirElBorrado = true;
            await enNuevaPersona(this.test?.title!, {}, async ({idper}) => {
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-01-06'), hasta:date.iso('2000-01-06'), cod_nov:COD_TRAMITE, idper},
                    'new'
                );
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-05'), cod_nov:COD_PRED_PAS, idper, trabajable:true},
                    {fecha:date.iso('2000-01-06'), cod_nov:COD_TRAMITE , idper, trabajable:true},
                    {fecha:date.iso('2000-01-07'), cod_nov:COD_PRED_PAS, idper, trabajable:true},
                ], 'all', {fixedFields:{idper, fecha:['2000-01-05','2000-01-07']}})
            })
            fallaEnLaQueQuieroOmitirElBorrado = false;
        })
        it("intento de cargar novedades sin permiso", async function(){
            await enNuevaPersona(this.test?.title!, {}, async (persona) => {
                await expectError( async () => {
                    await basicoSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-01-01'), hasta:date.iso('2000-01-07'), cod_nov:COD_VACACIONES, idper: persona.idper},
                        'new'
                    );
                }, ctts.insufficient_privilege);
            })
        })
        it("intento de cargar novedades en el pasado", async function(){
            await enNuevaPersona(this.test?.title!, {}, async ({idper}) => {
                // TODO ESPERAR EL ERROR
                //await expectError( async () => {
                    await rrhhSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-01-01'), hasta:date.iso('2000-01-07'), cod_nov:COD_VACACIONES, idper},
                        'new'
                    );
                //}, ctts.ERROR_NO_SE_PUEDE_CARGAR_EN_EL_PASADO);
            })
        })
        it("intento ver novedades de otra persona", async function(){
            await enNuevaPersona(this.test?.title!, {}, async ({idper}) => {
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-01-03'), hasta:date.iso('2000-01-03'), cod_nov:COD_TRAMITE, idper},
                    'new'
                );
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-03'), cod_nov:COD_TRAMITE, idper},
                ], 'all', {fixedFields:{idper, fecha:'2000-01-03'}})
                // el usuario básico no debería ver los datos de otra persona:
                await basicoSession.tableDataTest('novedades_vigentes', [
                ], 'all', {fixedFields:{idper, fecha:'2000-01-03'}})
            })
        })
        it("quito un feriado y veo que hay más novedades", async function(){
            await enDosNuevasPersonasConFeriado10EneroFeriadoy11No(this.test?.title!, '10001', async (persona1, persona2, cod_nov) => {
                /* Verifico que ese día tenga 2 novedades cargadas */
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-11'), cod_nov, idper: persona1.idper},
                    {fecha:date.iso('2000-01-11'), cod_nov, idper: persona2.idper},
                ], 'all', {fixedFields:[{fieldName:'cod_nov', value:cod_nov}]})
                /* quito el feriado */
                await rrhhAdminSession.saveRecord(
                    ctts.fecha, 
                    {fecha:date.iso('2000-01-10'), laborable:null, repite:null, inamovible:null, leyenda:'PRUEBA AUTOMÁTICA agregar feriado'}, 
                    'update'
                )
                /* Verifico que esos días tengan 4 novedades vigentes */
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-10'), cod_nov, idper: persona1.idper},
                    {fecha:date.iso('2000-01-11'), cod_nov, idper: persona1.idper},
                    {fecha:date.iso('2000-01-10'), cod_nov, idper: persona2.idper},
                    {fecha:date.iso('2000-01-11'), cod_nov, idper: persona2.idper},
                ], 'all', {fixedFields:{cod_nov}})
           })
        })
        // agrego delete en calcular_novedades_vigentes e incorporo este test
        it("agrego un feriado y veo que hay menos novedades", async function(){
            await enDosNuevasPersonasConFeriado10EneroFeriadoy11No(this.test?.title!, '10002', async (persona1, persona2, cod_nov) => {
                /* Verifico que ese día tenga 2 novedades cargadas */
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-11'), cod_nov, idper: persona1.idper},
                    {fecha:date.iso('2000-01-11'), cod_nov, idper: persona2.idper},
                ], 'all', {fixedFields:[{fieldName:'cod_nov', value:cod_nov}]})
                /* agrego otro feriado */
                await rrhhAdminSession.saveRecord(
                    ctts.fecha, 
                    {fecha:date.iso('2000-01-11'), laborable:false, repite:false, inamovible:false, leyenda:'PRUEBA AUTOMÁTICA agregar feriado'}, 
                    'update'
                )
                /* Verifico que esos días no tengan novedades vigentes */
                await rrhhSession.tableDataTest('novedades_vigentes', [
                ], 'all', {fixedFields:{cod_nov}})
           })
        })
        it("un usuario común puede ver sus novedades pasadas (y rrhh las puede cargar)", async function(){
            await enNuevaPersona(this.test?.title!, {usuario:{sesion:true}, hoy:date.iso('2000-02-02')}, async ({idper}, {sesion}) => {
                await rrhhAdminSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, idper},
                    'new'
                );
                await sesion.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-02-01'), cod_nov:COD_VACACIONES, idper},
                    {fecha:date.iso('2000-02-02'), cod_nov:COD_VACACIONES, idper},
                    {fecha:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, idper},
                ], 'all', {fixedFields:{idper, fecha:['2000-02-01', '2000-02-03']}})
            })
        })
        it("un usuario común no puede cargar novedades pasadas", async function(){
            await enNuevaPersona(this.test?.title!, {usuario:{sesion:true}, hoy:date.iso('2000-02-02')}, async (persona, {sesion}) => {
                await expectError( async () => {
                    await sesion.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, idper: persona.idper},
                        'new'
                    );
                }, ctts.insufficient_privilege)
            })
        })
        it("un jefe puede cargar a alguien de su equipo", async function(){
            this.timeout(TIMEOUT_SPEED * 10);
            // fallaEnLaQueQuieroOmitirElBorrado = true;
            await enNuevaPersona(this.test?.title!, {usuario:{sector:'PRA11'}}, async ({idper}) => {
                await jefe11Session.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, idper},
                    'new'
                );
                await jefe11Session.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-02-01'), cod_nov:COD_VACACIONES, idper},
                    {fecha:date.iso('2000-02-02'), cod_nov:COD_VACACIONES, idper},
                    {fecha:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, idper},
                ], 'all', {fixedFields:{idper, fecha:['2000-02-01','2000-02-03']}})
            })
            fallaEnLaQueQuieroOmitirElBorrado = false;
        })
        it("un jefe puede cargar a alguien de un equipo perteneciente", async function(){
            await enNuevaPersona(this.test?.title!, {usuario:{sector:'PRA1111'}}, async ({idper}) => {
                await jefe11Session.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, idper},
                    'new'
                );
                await jefe11Session.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-02-01'), cod_nov:COD_VACACIONES, idper},
                    {fecha:date.iso('2000-02-02'), cod_nov:COD_VACACIONES, idper},
                    {fecha:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, idper},
                ], 'all', {fixedFields:{idper, fecha:['2000-02-01','2000-02-03']}})
            })
        })
        it("un jefe no puede cargar a alguien de un equipo no perteneciente", async function(){
            await enNuevaPersona(this.test?.title!, {usuario:{sector:'PRA12'}}, async (persona) => {
                await expectError( async () => {
                    await jefe11Session.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, idper: persona.idper},
                        'new'
                    );
                }, ctts.insufficient_privilege);
            })
        })
        it("no puede cargarse una novedad sin detalles cuando el codigo de novedad indica con detalles", async function(){
            await enNuevaPersona(this.test?.title!, {}, async (persona, {}) => {
                await expectError( async () => {
                    await rrhhAdminSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-09'), hasta:date.iso('2000-02-09'), cod_nov:COD_ENF_FAMILIAR, idper: persona.idper},
                        'new'
                    );
                }, ctts.ERROR_COD_NOVEDAD_INDICA_CON_DETALLES);
            })
        })
        it("no puede cargarse una novedad con detalles cuando el codigo de novedad indica sin detalles", async function(){
            await enNuevaPersona(this.test?.title!, {}, async (persona, {}) => {
                await expectError( async () => {
                    await rrhhAdminSession.saveRecord(
                        ctts.cod_nov, 
                        {cod_nov:COD_MUDANZA, con_detalles:false}, 
                        'update'
                    );
                    await rrhhAdminSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-09'), hasta:date.iso('2000-02-09'), cod_nov:COD_MUDANZA, idper: persona.idper, detalles:TEXTO_PRUEBA},
                        'new'
                    );
                    await rrhhAdminSession.saveRecord(
                        ctts.cod_nov, 
                        {cod_nov:COD_MUDANZA, con_detalles:null}, 
                        'update'
                    );
                }, ctts.ERROR_COD_NOVEDAD_INDICA_SIN_DETALLES);
            })
        })
        it("un detalle para una novedad se copia en novedades_vigentes", async function(){
            await enNuevaPersona(this.test?.title!, {}, async ({idper}) => {
                    await rrhhAdminSession.saveRecord(ctts.cod_nov, {cod_nov:COD_MUDANZA, con_detalles:null}, 'update');
                    await rrhhAdminSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-02-10'), hasta:date.iso('2000-02-10'), cod_nov:COD_MUDANZA, idper, detalles:TEXTO_PRUEBA},
                    'new'
                );
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-02-10'), cod_nov:COD_MUDANZA, idper, detalles:TEXTO_PRUEBA},
                ], 'all', {fixedFields:{idper, fecha:'2000-02-10'}})
            })
        })
        it("un usuario común puede ver SOLO SUS novedades pasadas", async function(){
            await enNuevaPersona(this.test?.title!,
                {usuario:{sector:'PRA11',sesion:true}, hoy:date.iso('2000-02-02')},
                async (persona, {sesion}
            ) => {
                var otrapersona = await crearNuevaPersona("segunda persona en test "+this.test?.title!, {});
                await rrhhSession.saveRecord(ctts.personas,{idper:otrapersona.idper,sector:'PRA11'}, 'update')
                await rrhhAdminSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, idper: otrapersona.idper},
                    'new'
                );
                await sesion.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-02-01'), cod_nov:COD_PRED_PAS, idper: persona.idper},
                ], 'all', {fixedFields:{fecha:'2000-02-01'}})
            })
        })
        it("un usuario no puede cargarse novedades a sí mismo", async function(){
            await enNuevaPersona(this.test?.title!, {usuario:{sector:'PRA12', sesion:true}}, async ({idper}, {sesion}) => {
                await expectError( async () => {
                    await sesion.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, idper},
                        'new'
                    );
                }, ctts.insufficient_privilege);
            })
        })
        it("no puede cargarse una novedad horaria con superposición", async function(){
            await enNuevaPersona(this.test?.title!, {}, async (persona, {}) => {
                await expectError( async () => {
                    await rrhhAdminSession.saveRecord(ctts.cod_nov, {cod_nov:COD_COMISION, parcial:true}, 'update');
                    await rrhhAdminSession.saveRecord(
                        ctts.novedades_horarias, 
                        {idper:persona.idper, fecha:date.iso('2000-03-05'), hasta_hora:HASTA_HORA ,cod_nov:COD_COMISION}, 
                        'new'
                    );
                    await rrhhAdminSession.saveRecord(
                        ctts.novedades_horarias, 
                        {idper:persona.idper, fecha:date.iso('2000-03-05'), desde_hora:DESDE_HORA ,cod_nov:COD_COMISION}, 
                        'new'
                    );
                }, ctts.check_sin_superponer);
            })
        })
        it("no puede cargarse una novedad horaria cuando el codigo de novedad NO indica PARCIAL", async function(){
            await enNuevaPersona(this.test?.title!, {}, async (persona, {}) => {
                await expectError( async () => {
                    await rrhhAdminSession.saveRecord(
                        ctts.novedades_horarias, 
                        {idper: persona.idper, fecha:date.iso('2000-02-09'),hasta_hora:HASTA_HORA, cod_nov:COD_MUDANZA},
                        'new'
                    );
                }, ctts.ERROR_COD_NOVEDAD_NO_INDICA_PARCIAL);
            })
        })
        it("no puede cargarse una novedad (registrada) cuando el codigo de novedad NO indica TOTAL", async function(){
            await enNuevaPersona(this.test?.title!, {}, async (persona, {}) => {
                await expectError( async () => {
                    const cod_nov = '10003';
                    await rrhhAdminSession.saveRecord(ctts.cod_nov, {cod_nov, novedad: 'PRUEBA AUTOMÁTICA intengo agregar no total', total: false}, 'new')
                    await rrhhAdminSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov, idper: persona.idper},
                        'new'
                    );
                }, ctts.ERROR_COD_NOVEDAD_NO_INDICA_TOTAL);
            })
        })
        it("genera novedades desde registra_novedades_desde", async function(){
            await enNuevaPersona(this.test?.title!, {registra_novedades_desde: date.iso('2000-01-04')}, async ({idper}) => {
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-04'), cod_nov:COD_PRED_PAS, idper},
                ], 'all', {fixedFields:{idper, fecha:['2000-01-01','2000-01-04']}})
            })
        })
        describe("días corridos", function(){
            it("se generan novedades en los fines de semana", async function(){
                await enNuevaPersona(this.test?.title!, {}, async ({idper}, {}) => {
                    await rrhhSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-04'), hasta:date.iso('2000-02-07'), cod_nov: COD_ENFERMEDAD, idper},
                        'new'
                    );
                    await rrhhSession.tableDataTest('novedades_vigentes', [
                        {fecha:date.iso('2000-02-04'), cod_nov:COD_ENFERMEDAD, idper},
                        {fecha:date.iso('2000-02-05'), cod_nov:COD_ENFERMEDAD, idper},
                        {fecha:date.iso('2000-02-06'), cod_nov:COD_ENFERMEDAD, idper},
                        {fecha:date.iso('2000-02-07'), cod_nov:COD_ENFERMEDAD, idper},
                    ], 'all', {fixedFields:{idper, fecha:['2000-02-04', '2000-02-07']}})
                })
            })
            it.skip("se ve una inconsistencia si se cargan partidas", async function(){
                await enNuevaPersona(this.test?.title!, {}, async (persona, {}) => {
                    await rrhhSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-04'), hasta:date.iso('2000-02-04'), cod_nov: COD_ENFERMEDAD, idper: persona.idper},
                        'new'
                    );
                    await rrhhSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-07'), hasta:date.iso('2000-02-07'), cod_nov: COD_ENFERMEDAD, idper: persona.idper},
                        'new'
                    );
                    await rrhhSession.tableDataTest('novedades_vigentes', [
                        {fecha:date.iso('2000-02-04'), cod_nov:COD_ENFERMEDAD, idper: persona.idper},
                        {fecha:date.iso('2000-02-07'), cod_nov:COD_ENFERMEDAD, idper: persona.idper},
                    ], 'all', {fixedFields:[{fieldName:'idper', value:persona.idper}]})
                    await rrhhSession.tableDataTest('inconsistencias', [
                        {idper: persona.idper, cod_nov:COD_ENFERMEDAD, pauta:PAUTA_CORRIDOS},
                    ], 'all', {fixedFields:[{fieldName:'idper', value:persona.idper}]})
                })
            })
            it.skip("se ve una inconsistencia si se cargan partidas (solo primero incompleto)", async function(){
                await enNuevaPersona(this.test?.title!, {}, async (persona, {}) => {
                    await rrhhSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-04'), hasta:date.iso('2000-02-04'), cod_nov: COD_ENFERMEDAD, idper: persona.idper},
                        'new'
                    );
                    await rrhhSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-06'), hasta:date.iso('2000-02-07'), cod_nov: COD_ENFERMEDAD, idper: persona.idper},
                        'new'
                    );
                    await rrhhSession.tableDataTest('novedades_vigentes', [
                        {fecha:date.iso('2000-02-04'), cod_nov:COD_ENFERMEDAD, idper: persona.idper},
                        {fecha:date.iso('2000-02-06'), cod_nov:COD_ENFERMEDAD, idper: persona.idper},
                        {fecha:date.iso('2000-02-07'), cod_nov:COD_ENFERMEDAD, idper: persona.idper},
                    ], 'all', {fixedFields:[{fieldName:'idper', value:persona.idper}]})
                    await rrhhSession.tableDataTest('inconsistencias', [
                        {idper: persona.idper, cod_nov:COD_ENFERMEDAD, pauta:PAUTA_CORRIDOS},
                    ], 'all', {fixedFields:[{fieldName:'idper', value:persona.idper}]})
                })
            })
            it.skip("se ve una inconsistencia si se cargan partidas (solo segundo incompleto)", async function(){
                await enNuevaPersona(this.test?.title!, {}, async (persona, {}) => {
                    await rrhhSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-04'), hasta:date.iso('2000-02-05'), cod_nov: COD_ENFERMEDAD, idper: persona.idper},
                        'new'
                    );
                    await rrhhSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-07'), hasta:date.iso('2000-02-07'), cod_nov: COD_ENFERMEDAD, idper: persona.idper},
                        'new'
                    );
                    await rrhhSession.tableDataTest('novedades_vigentes', [
                        {fecha:date.iso('2000-02-04'), cod_nov:COD_ENFERMEDAD, idper: persona.idper},
                        {fecha:date.iso('2000-02-05'), cod_nov:COD_ENFERMEDAD, idper: persona.idper},
                        {fecha:date.iso('2000-02-07'), cod_nov:COD_ENFERMEDAD, idper: persona.idper},
                    ], 'all', {fixedFields:[{fieldName:'idper', value:persona.idper}]})
                    await rrhhSession.tableDataTest('inconsistencias', [
                        {idper: persona.idper, cod_nov:COD_ENFERMEDAD, pauta:PAUTA_CORRIDOS},
                    ], 'all', {fixedFields:[{fieldName:'idper', value:persona.idper}]})
                })
            })
            it("mezclo teletrabajo con presencial", async function(){
                var cod_nov = COD_DIAGRAMADO;
                await enNuevaPersona(this.test?.title!, {hoy: FECHA_ACTUAL}, async ({idper}) => {
                    await rrhhAdminSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-01-17'), hasta:date.iso('2000-01-29'), idper, cod_nov,
                            dds1:true, dds3:true, dds4:true
                        },
                        'new',
                    );
                    await rrhhSession.tableDataTest('novedades_vigentes', [
                        {fecha:date.iso('2000-01-17'), cod_nov:COD_DIAGRAMADO, idper},
                        {fecha:date.iso('2000-01-18'), cod_nov:COD_PRED_PAS  , idper},
                        {fecha:date.iso('2000-01-19'), cod_nov:COD_DIAGRAMADO, idper},
                        {fecha:date.iso('2000-01-20'), cod_nov:COD_DIAGRAMADO, idper},
                        {fecha:date.iso('2000-01-21'), cod_nov:COD_PRED_PAS  , idper},
                        {fecha:date.iso('2000-01-22'), cod_nov:null          , idper},
                        {fecha:date.iso('2000-01-23'), cod_nov:null          , idper},
                        {fecha:date.iso('2000-01-24'), cod_nov:COD_DIAGRAMADO, idper},
                        {fecha:date.iso('2000-01-25'), cod_nov:COD_PRED_PAS  , idper},
                        {fecha:date.iso('2000-01-26'), cod_nov:COD_DIAGRAMADO, idper},
                        {fecha:date.iso('2000-01-27'), cod_nov:COD_DIAGRAMADO, idper},
                        {fecha:date.iso('2000-01-28'), cod_nov:COD_PRED_PAS  , idper},
                        {fecha:date.iso('2000-01-29'), cod_nov:null          , idper},
                        {fecha:date.iso('2000-01-30'), cod_nov:null          , idper},
                        {fecha:date.iso('2000-01-31'), cod_nov:COD_PRED_PAS  , idper},
                        {fecha:date.iso('2000-02-01'), cod_nov:COD_PRED_FUT  , idper},
                        {fecha:date.iso('2000-02-02'), cod_nov:COD_PRED_FUT  , idper},
                        {fecha:date.iso('2000-02-03'), cod_nov:COD_PRED_FUT  , idper},
                        {fecha:date.iso('2000-02-04'), cod_nov:COD_PRED_FUT  , idper},
                    ], 'all', {fixedFields:{idper, fecha:['2000-01-17','2000-02-04']}})
                })
            })
            it("superponer teletrabajo programado sobre vacaciones", async function(){
                await enNuevaPersona(this.test?.title!, {}, async ({idper}) => {
                    await rrhhAdminSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-01-19'), hasta:date.iso('2000-01-21'), idper, cod_nov: COD_VACACIONES},
                        'new',
                    );
                    await rrhhAdminSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-01-17'), hasta:date.iso('2000-01-21'), idper, cod_nov: COD_DIAGRAMADO,
                            dds1:true, dds3:true, dds4:true
                        },
                        'new',
                    );
                    await rrhhSession.tableDataTest('novedades_vigentes', [
                        {fecha:date.iso('2000-01-17'), cod_nov:COD_DIAGRAMADO, idper},
                        {fecha:date.iso('2000-01-18'), cod_nov:COD_PRED_PAS  , idper},
                        {fecha:date.iso('2000-01-19'), cod_nov:COD_DIAGRAMADO, idper},
                        {fecha:date.iso('2000-01-20'), cod_nov:COD_DIAGRAMADO, idper},
                        {fecha:date.iso('2000-01-21'), cod_nov:COD_PRED_PAS  , idper},
                    ], 'all', {fixedFields:{idper, fecha:['2000-01-17','2000-01-21']}})
                })
            })
        });
        describe("cod_nov_pred_fecha", function(){
            it("sin nada cargado está la novedad predeterminada pasada", async function(){
                await enNuevaPersona(this.test?.title!, {}, async ({idper}) => {
                    await rrhhSession.tableDataTest('novedades_vigentes', [
                        {fecha:date.iso('2000-01-03'), cod_nov:COD_PRED_PAS  , idper},
                        {fecha:date.iso('2000-01-04'), cod_nov:COD_PRED_PAS  , idper},
                    ], 'all', {fixedFields:{idper, fecha:['2000-01-03','2000-01-04']}})
                });
            })
            it("actualizo una fecha y se actualizan los predeterminados", async function(){
                await enNuevaPersona(this.test?.title!, {}, async ({idper}) => {
                    await server.inDbClient(ADMIN_REQ, async client => client.query("update fechas set cod_nov_pred_fecha = '22' where fecha = '2000-01-04'").execute())
                    await rrhhSession.tableDataTest('novedades_vigentes', [
                        {fecha:date.iso('2000-01-03'), cod_nov:COD_PRED_PAS  , idper},
                        {fecha:date.iso('2000-01-04'), cod_nov:'22'          , idper},
                        {fecha:date.iso('2000-01-05'), cod_nov:COD_PRED_PAS  , idper},
                    ], 'all', {fixedFields:{idper, fecha:['2000-01-03','2000-01-05']}})
                    await server.inDbClient(ADMIN_REQ, async client => client.query(`update fechas set cod_nov_pred_fecha = '${COD_PRED_PAS}' where fecha = '2000-01-04'`).execute())
                    await rrhhSession.tableDataTest('novedades_vigentes', [
                        {fecha:date.iso('2000-01-03'), cod_nov:COD_PRED_PAS  , idper},
                        {fecha:date.iso('2000-01-04'), cod_nov:COD_PRED_PAS  , idper},
                        {fecha:date.iso('2000-01-05'), cod_nov:COD_PRED_PAS  , idper},
                    ], 'all', {fixedFields:{idper, fecha:['2000-01-03','2000-01-05']}})
                });
            })
        })
        describe("inconsistencias de personas", function(){
            it.skip("Activos, antiguedad por suma de rangos no coincide con días desde para_antiguedad_relativa hasta hoy", async function(){
                await enNuevaPersona(this.test?.title!, {hoy:date.iso('2024-11-20'), para_antiguedad_relativa: date.iso('2021-10-31')}, async (persona, {}) => {
                    await rrhhSession.saveRecord(
                        ctts.historial_contrataciones,
                        {idper:persona.idper, desde:date.iso('2015-05-05'), hasta:date.iso('2017-05-05'), computa_antiguedad:true},
                        'new'
                    );
                    await rrhhSession.saveRecord(
                        ctts.historial_contrataciones,
                        {idper:persona.idper, desde:date.iso('2024-01-01'), computa_antiguedad:true},
                        'new'
                    );
                    await rrhhSession.tableDataTest('inconsistencias', [
                        {idper: persona.idper, pauta:PAUTA_ANTCOMVSRE},
                    ], 'all', {fixedFields:[{fieldName:'idper', value:persona.idper}]})
                })
            })
        })
    })
    describe("jerarquía de sectores", function(){
        async function pertenceceSector(sector:string, perteneceA:string){
            return (await server.inDbClient(ADMIN_REQ, client => client.query(
                'select sector_pertenece($1, $2)',
                [sector, perteneceA]
            ).fetchUniqueValue())).value
        }
        it("detecta que PRA111 pertenece a PRA11", async function(){
            var result = await pertenceceSector('PRA111','PRA11')
            discrepances.showAndThrow(result, true);
        })
        it("detecta que PRA1111 pertenece a PRA1 (salto de 3 niveles)", async function(){
            var result = await pertenceceSector('PRA1111','PRA1')
            discrepances.showAndThrow(result, true);
        })
        it("detecta que PRA1 no pertenece a PRA11 (invertido)", async function(){
            var result = await pertenceceSector('PRA1','PRA11')
            discrepances.showAndThrow(result, false);
            
        })
        it("detecta que PRA111 no pertenece a PRA12 (otra rama)", async function(){
            var result = await pertenceceSector('PRA111','PRA12')
            discrepances.showAndThrow(result, false);
        })
        describe("controla las referencias circulares", async function(){
            async function verifcaImpedirReferenciaCircular(sector:string, nuevoPertenceA:string){
                await expectError( async () => {
                    await rrhhAdminSession.saveRecord(ctts.sectores, {sector, pertenece_a: nuevoPertenceA}, 'update');
                    throw new Error("se esperaba un error para impedir la referencia circular")
                }, ctts.ERROR_REFERENCIA_CIRCULAR_EN_SECTORES);
            }
            it("permite cambia de quién depende", async function(){
                await rrhhAdminSession.saveRecord(ctts.sectores, {sector: 'PRA12', pertenece_a:'PRA1111'}, 'update');
                await rrhhAdminSession.tableDataTest('sectores', [
                    {sector: 'PRA12', pertenece_a:'PRA1111'}
                ], 'all', {fixedFields:[{fieldName:'sector', value:'PRA12'}]})
                await rrhhAdminSession.saveRecord(ctts.sectores, {sector: 'PRA12', pertenece_a:'PRA1'}, 'update');
            })
            it("impiede una referencia circular corta", async function(){
                await verifcaImpedirReferenciaCircular('PRA11', 'PRA111');
            })
            it("impiede una referencia circular larga", async function(){
                await verifcaImpedirReferenciaCircular('PRA1', 'PRA1111');
            })
            it("impiede una referencia a sí mismo", async function(){
                await verifcaImpedirReferenciaCircular('PRA11', 'PRA11');
            })
        })
    })
    describe("pantallas", function(){
        it("tiene que ver un solo renglón de vacaciones", async function(){
            await enNuevaPersona(this.test?.title!, {vacaciones: 20}, async ({idper}) => {
                await rrhhAdminSession.saveRecord(ctts.per_nov_cant, {annio:2000, origen:'1999', cod_nov: COD_VACACIONES, idper, cantidad: 1 }, 'new')
                await rrhhAdminSession.saveRecord(ctts.per_nov_cant, {annio:2001, origen:'2000', cod_nov: COD_VACACIONES, idper, cantidad: 10 }, 'new')
                var novedadRegistradaPorCargar = {desde:date.iso('2000-03-01'), hasta:date.iso('2000-03-07'), cod_nov:COD_VACACIONES, idper};
                await rrhhSession.saveRecord(ctts.novedades_registradas, novedadRegistradaPorCargar, 'new');
                var novedadRegistradaPorCargar2 = {desde:date.iso('2001-03-01'), hasta:date.iso('2001-03-07'), cod_nov:COD_VACACIONES, idper};
                await rrhhSession.saveRecord(ctts.novedades_registradas, novedadRegistradaPorCargar2, 'new');
                var expectedResult: ctts.NovedadesDisponiblesResult = {
                    cod_nov: COD_VACACIONES,
                    novedad: "Art. 18 Descanso anual remunerado",
                    con_detalles: false, 
                    con_disponibilidad: true, 
                    con_info_nov: true,
                    puede_cargar: true,
                    prioritario: true,
                    c_dds: null,
                    cantidad:21, 
                    usados: 0,
                    pendientes: 3,
                    saldo: 18,
                };
                var result = await rrhhSession.callProcedure(ctts.novedades_disponibles, {idper, annio: Number(DESDE_AÑO)})
                var resultVacaciones = result.filter(x => x.cod_nov == COD_VACACIONES)
                assert.deepEqual(resultVacaciones, [expectedResult]);
                discrepances.showAndThrow(resultVacaciones, [expectedResult])
                // LÍMIES:
                await rrhhSession.tableDataTest('nov_per', [
                    {annio:2000, cod_nov:COD_VACACIONES, cantidad:21  , usados:0 , pendientes:3, saldo:18  },
                    {annio:2000, cod_nov:COD_PRED_PAS  , cantidad:null, usados:21, pendientes:0, saldo:null},
                    {annio:2001, cod_nov:COD_VACACIONES, cantidad:10  , usados:0 , pendientes:5, saldo:5   },
                ], 'all', {fixedFields:{idper}})
            })
        })
    })
    after(async function(){
        var error: Error|null = null;
        if (!borradoExitoso || fallaEnLaQueQuieroOmitirElBorrado || someTestFails(this)) {
            console.log('se saltea la comprobación final porque no se pudo borrar las pruebas de la corrida anterior')
            // console.log('test', this.test)
            // console.log('this', this)
        } else {
            this.timeout(TIMEOUT_SPEED * 40);
            try {
                /**
                 * Podría ocurrir que haya algún problema al recalcular. 
                 * 
                 * Además queremos tener registro de cuánto demoran los tests en las máquinas locales
                 * Para incluir una máquina de desarrollo en el cálculo de tiempos hay que setear
                 * la variable de ambiente BP_TEST_BENCHMARKS a un nombre de máquina.
                 * 
                 * Esta secuencia saca una foto del resultado de todos los test y vuelve a recalcular
                 * sobre lo ya calculado, luego borrando todo 3 veces en cada una de esas 3 veces
                 * primero calcula todo junto, luego fecha por fecha y finalmente persona por persona
                 */
                const sqlTraerNovedades = `SELECT string_agg(concat_ws(' ',fecha,idper,cod_nov), chr(10) order by fecha, idper) FROM novedades_vigentes WHERE ${FECHAS_DE_PRUEBA} AND ${IDPER_DE_PRUEBA}`
                const emptyBenchmarkDay = {
                    date: date.today(),
                    tiempos: [] as {tamannio:any, duracion: number|null}[]
                };
                var benchmarkDelDia = await loadLocalFile(emptyBenchmarkDay);
                if (benchmarkDelDia.date != emptyBenchmarkDay.date) {
                    benchmarkDelDia = emptyBenchmarkDay;
                }
                const comienzo = new Date();
                async function avisarDiferencias(data:Record<string, string>){
                    const DIR_NAME = "local-test-results";
                    await fs.mkdir(DIR_NAME, {recursive:true});
                    var nombres = Object.keys(data);
                    if (nombres.length != 2) {
                        throw new Error("avisarDiferencias usado con un objeto que no tiene exactamente dos atributos");
                    }
                    if (data[nombres[0]] != data[nombres[1]]) {
                        console.error('ERROR DIFERENCIA DE DATOS ENTRE ',nombres.join(' y '));
                        await Promise.all(nombres.map(n =>
                            fs.writeFile(`${DIR_NAME}/${n}.txt`,data[n],'utf8')
                        ))
                    }
                }
                await server.inDbClient(ADMIN_REQ, async client => {
                    const {row: tamannio} = await client.query(`select count(*) as personas from personas where ${IDPER_DE_PRUEBA}`).fetchUniqueRow();
                    const benchmark = {
                        tamannio,
                        duracion: null as number|null
                    }
                    const todasLasNovedadesGeneradas = (await client.query(sqlTraerNovedades).fetchUniqueValue()).value;
                    await client.query(sqlCalcularNovedades).execute();
                    console.log('calculando novedadesRecalculadasEncima')
                    const novedadesRecalculadasEncima = (await client.query(sqlTraerNovedades).fetchUniqueValue()).value;
                    avisarDiferencias({novedadesRecalculadasEncima, todasLasNovedadesGeneradas});
                    console.log('calculando novedadesRecalculadasEnBlanco')
                    await client.query(`delete from novedades_vigentes where ${FECHAS_DE_PRUEBA}`).execute();
                    await client.query(sqlCalcularNovedades).execute();
                    const novedadesRecalculadasEnBlanco = (await client.query(sqlTraerNovedades).fetchUniqueValue()).value;
                    avisarDiferencias({novedadesRecalculadasEnBlanco, todasLasNovedadesGeneradas})
                    console.log('calculando novedadesRecalculadasPorFecha')
                    var fechas = (await client.query(`select distinct fecha from novedades_vigentes where ${FECHAS_DE_PRUEBA}`).fetchAll()).rows;
                    await client.query(`delete from novedades_vigentes where ${FECHAS_DE_PRUEBA}`).execute();
                    for(var row of fechas) {
                        await client.query(`CALL actualizar_novedades_vigentes($1::date, $2::date)`, [row.fecha, row.fecha]).execute();
                    }
                    const novedadesRecalculadasPorFecha = (await client.query(sqlTraerNovedades).fetchUniqueValue()).value;
                    avisarDiferencias({novedadesRecalculadasPorFecha, todasLasNovedadesGeneradas});
                    console.log('calculando novedadesRecalculadasPorCuit')
                    var cuits = (await client.query(`select distinct idper from novedades_vigentes where ${FECHAS_DE_PRUEBA}`).fetchAll()).rows;
                    await client.query(`delete from novedades_vigentes where ${FECHAS_DE_PRUEBA}`).execute();
                    for(var row of cuits) {
                        await client.query(`CALL actualizar_novedades_vigentes_idper('${DESDE_AÑO}-01-01'::date, '${DESDE_AÑO}-12-31'::date, $1)`, [row.idper]).execute();
                    }
                    const novedadesRecalculadasPorCuit = (await client.query(sqlTraerNovedades).fetchUniqueValue()).value;
                    benchmark.duracion = Number(
                        new Date().getTime() - comienzo.getTime()
                    );
                    benchmarkDelDia.tiempos.push(benchmark); 
                    await saveLocalFile(benchmarkDelDia);
                    await benchmarksSave(benchmarkDelDia);
                    avisarDiferencias({novedadesRecalculadasPorCuit, todasLasNovedadesGeneradas})
                })
            } catch(err) {
                console.log("****************** ERROR AL FINAL VERIFICANDO QUE SE PUEDA REGENERAR *******************")
                console_log(err);
                error = err as Error;
            }
        }
        await server.shutdownBackend()
        console.log('server down!');
        server = null as unknown as AppSiper;
        setTimeout(()=>{
            console.log('FORCE EXIT');
            process.exit(0);
        }, 1000);
        if (error != null) throw error;
    })
})

