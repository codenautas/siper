"use strict";

import { AppSiper } from '../server/app-principal';

import { startServer, EmulatedSession, expectError, loadLocalFile, saveLocalFile, benchmarksSave } from "./probador-serial";

import * as ctts from "../common/contracts"

import { date } from "best-globals";

import * as discrepances from 'discrepances';


/*
 * Para debuguear el servidor por separado hay abrir dos ventanas, en una corren los test (normalmente) 
 * y en la otra corre el servidor (para poner breakpoints elegir cuál se corre en visual studio code).
 * antes de npm start (el servidor) hay que poner 
 * 
 *      set BACKEND_PLUS_LOCAL_CONFIG=config-adicionar-para-test.yaml
 * 
 * y antes de correr los tests hay que comentar con // la próxima línea (para qu se descomente el PORT = 3333)
 */
const PORT = null; /*
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

const FECHA_ACTUAL = date.iso('2000-01-01');
const DESDE_AÑO = `2000`;
const HASTA_AÑO = `2009`;
const AÑOS_DE_PRUEBA = `annio BETWEEN ${DESDE_AÑO} AND ${HASTA_AÑO}`;
const FECHAS_DE_PRUEBA = `extract(year from fecha) BETWEEN ${DESDE_AÑO} AND ${HASTA_AÑO}`;
const CUIL_DE_PRUEBA = `cuil like '1_3300_____'`;

const COD_VACACIONES = "1";
const COD_TELETRABAJO = "106";
const COD_TRAMITE = "121";
const COD_DIAGRAMADO = "101";
const ADMIN_REQ = {user:{usuario:'perry', rol:''}};

type Credenciales = {username: string, password: string};
type UsuarioConCredenciales = ctts.Usuario & {credenciales: Credenciales};

describe("connected", function(){
    var server: AppSiper;
    var rrhhSession: EmulatedSession<AppSiper>;
    var rrhhAdminSession: EmulatedSession<AppSiper>; // no cualquier rrhh
    before(async function(){
        this.timeout(7000);
        server = await startServer(AppSiper);
        // @ts-expect-error: todavía no está en el config tests-can-delete-db
        if (server.config.devel['tests-can-delete-db']) {
            await server.inDbClient(ADMIN_REQ, async client=>{
                await client.executeSentences([
                    `delete from nov_gru where ${AÑOS_DE_PRUEBA}`,
                    `delete from novedades_vigentes where ${AÑOS_DE_PRUEBA} and ${CUIL_DE_PRUEBA}`,
                    `delete from novedades_registradas where ${AÑOS_DE_PRUEBA} and ${CUIL_DE_PRUEBA}`,
                    `delete from usuarios where ${CUIL_DE_PRUEBA}`,
                    `delete from horarios where ${CUIL_DE_PRUEBA}`,
                    `delete from personal where ${CUIL_DE_PRUEBA}`,
                    `delete from grupos where ${CUIL_DE_PRUEBA.replace('cuil', 'grupo')}`,
                    `delete from fechas where ${AÑOS_DE_PRUEBA}`,
                    `delete from annios where ${AÑOS_DE_PRUEBA}`,
                    `delete from cod_novedades where novedad like 'PRUEBA AUTOM_TICA%'`,
                    `update parametros set fecha_actual = '${FECHA_ACTUAL.toYmd()}' where unico_registro`,
                    `insert into annios (annio) select * from generate_series(${DESDE_AÑO}, ${HASTA_AÑO}) d`,
                    `insert into fechas (fecha) select date_trunc('day', d) from generate_series(cast('${DESDE_AÑO}-01-01' as timestamp), cast('${HASTA_AÑO}-12-31' as timestamp), cast('1 day' as interval)) d`,
                    `update fechas set laborable = false, repite = false, inamovible = false where fecha in (
                        '2000-03-06', 
                        '2000-03-07',
                        '2000-03-24',
                        '2000-04-20',
                        '2000-04-21');
                    `,
                    `delete from sectores where nombre_sector like 'PRUEBA AUTOM_TICA%'`,
                    `insert into sectores (sector, nombre_sector, pertenece_a) values
                        ('PRA1'   , 'PRUEBA AUTOMATICA 1'      , null    ),
                        ('PRA11'  , 'PRUEBA AUTOMATICA 1.1'    , 'PRA1'  ),
                        ('PRA111' , 'PRUEBA AUTOMATICA 1.1.1'  , 'PRA11' ),
                        ('PRA1111', 'PRUEBA AUTOMATICA 1.1.1.1', 'PRA111'),
                        ('PRA12'  , 'PRUEBA AUTOMATICA 1.2'    , 'PRA1'  );
                    `
                ])
            })
            console.log("Borrado y listo!")
        } else {
            throw new Error("no se puede probar sin setear devel: tests-can-delete-db: true")
        }
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
    })
    async function crearUsuario(nuevoUsuario: {numero:number, rol:string, cuil:string}){
        const {numero, rol, cuil} = nuevoUsuario;
        var usuario = 'usuario_prueba_' + numero;
        var password = 'clave_prueba_' + Math.random();
        await server.inDbClient(ADMIN_REQ, async client => {
            return await client.query(
                `INSERT INTO usuarios (usuario, md5clave, rol, cuil, activo) values ($1, md5($2), $3, $4, true) returning *`,
                [usuario, password+usuario, rol, cuil]
            ).fetchUniqueRow();
        })
        return {usuario, password, rol, cuil, credenciales:{username:usuario, password}};
    }
    it("verifica que exista la tabla de parámetros", async function(){
        await rrhhSession.tableDataTest('parametros',[
            {unico_registro:true},
        ], 'all')
    })
    async function crearNuevaPersona(numero:number): Promise<ctts.Persona>{
        var persona: ctts.Persona = {
            cuil: (10330010005 + numero*11).toString(),
            nomyape: "Persona de prueba " + numero,
        }
        var personaGrabada = await rrhhSession.saveRecord(
            ctts.personas,
            persona,
            'new',
        )
        return personaGrabada;
    }
    var cacheSesionDeUsuario:Record<string, EmulatedSession<AppSiper>>={}
    async function sesionDeUsuario(usuario:UsuarioConCredenciales){
        if (usuario.usuario in cacheSesionDeUsuario) {
            return cacheSesionDeUsuario[usuario.usuario];
        }
        const nuevaSession =  new EmulatedSession(server, PORT || server.config.server.port);
        await nuevaSession.login(usuario.credenciales);
        return nuevaSession
    }
    async function enNuevaPersona(
        numero: number, 
        opciones: {vacaciones?: number, tramites?: number, usuario?:{rol?:string, sector?:string, sesion?:boolean}, hoy?:Date},
        probar: (persona: ctts.Persona, mas:{usuario: UsuarioConCredenciales, sesion:EmulatedSession<AppSiper>}) => Promise<void>
    ){
        var haciendo = 'inicializando';
        try {
            var persona = await crearNuevaPersona(numero);
            var {vacaciones, tramites, hoy} = opciones;
            await rrhhAdminSession.saveRecord(ctts.grupos, {clase: 'I', grupo: persona.cuil}, 'new');
            await rrhhAdminSession.saveRecord(ctts.per_gru, {cuil: persona.cuil, clase: 'I', grupo: persona.cuil}, 'new');
            await rrhhAdminSession.saveRecord(ctts.per_gru, {cuil: persona.cuil, clase: 'U', grupo: 'T'}, 'new');
            var usuario = null as unknown as UsuarioConCredenciales;
            var sesion = null as unknown as EmulatedSession<AppSiper>;
            if (opciones.usuario) {
                usuario = await crearUsuario({numero, rol:'basico', cuil:persona.cuil, ...opciones.usuario})
                if (opciones.usuario.sesion) {
                    var sesion = await sesionDeUsuario(usuario);
                }
                if (opciones.usuario.sector) await rrhhSession.saveRecord(ctts.personas,{cuil:persona.cuil,sector:opciones.usuario.sector}, 'update')
            }
            if (vacaciones) await rrhhAdminSession.saveRecord(ctts.nov_gru, {annio:2000, cod_nov: COD_VACACIONES, clase: 'I', grupo: persona.cuil, maximo: vacaciones }, 'new')
            if (tramites) await rrhhAdminSession.saveRecord(ctts.nov_gru, {annio:2000, cod_nov: COD_TRAMITE, clase: 'U', grupo: 'T', maximo: 4 }, 'new')
            if (hoy) {
                await server.inDbClient(ADMIN_REQ, client => client.query("update parametros set fecha_actual = $1", [hoy]).execute())
            }
            haciendo = 'probando'
            await probar(persona, {usuario, sesion});
        } catch (err) {
            console.error("Test enNuevaPersona falla", haciendo)
            console.log({numero})
            console.log(persona!)
            console.log(err)
            throw err;
        } finally {
            if (hoy) {
                await server.inDbClient(ADMIN_REQ, client => client.query("update parametros set fecha_actual = $1", [FECHA_ACTUAL]).execute())
            }
        }
    }
    async function enDosNuevasPersonasConFeriado10EneroFeriadoy11No(
        numero1:number, 
        numero2:number, 
        cod_nov:string,
        probar:(persona1: ctts.Persona, pesona2: ctts.Persona, cod_nov:string) => Promise<void>
        
    ){
        var haciendo = 'Creando personas'
        try {
            var persona1 = await crearNuevaPersona(numero1);
            var persona2 = await crearNuevaPersona(numero2);
            await rrhhAdminSession.saveRecord(ctts.cod_nov, {cod_nov, novedad: 'PRUEBA AUTOMÁTICA agregar feriado' }, 'new')
            haciendo = 'poniendo el feriado'
            await rrhhAdminSession.saveRecord(
                ctts.fecha, 
                {fecha:date.iso('2000-01-10'), laborable:false, repite:false, inamovible:false, leyenda:'PRUEBA AUTOMÁTICA agregar feriado'}, 
                'update'
            )
            haciendo = 'registrando los movimientos'
            await rrhhSession.saveRecord(
                ctts.novedades_registradas, 
                {desde:date.iso('2000-01-10'), hasta:date.iso('2000-01-11'), cod_nov, cuil: persona1.cuil},
                'new'
            );
            await rrhhSession.saveRecord(
                ctts.novedades_registradas, 
                {desde:date.iso('2000-01-10'), hasta:date.iso('2000-01-11'), cod_nov, cuil: persona2.cuil},
                'new'
            );
            haciendo = 'probando'
            await probar(persona1, persona2, cod_nov);
        } catch(err) {
            console.error("Test enDosNuevasPersonasConFeriado10EneroFeriadoy11No falla", haciendo)
            console.log({numero1, numero2, cod_nov})
            throw err;
        }
    }
    describe("registro de novedades", function(){
        this.timeout(7000);
        var basicoSession: EmulatedSession<AppSiper>
        var jefe11Session: EmulatedSession<AppSiper>
        before(async function(){
            await enNuevaPersona(0, {usuario:{sesion:true}}, async (_, {sesion}) => {
                basicoSession = sesion;
            });
            await enNuevaPersona(14, {usuario:{sesion:true, rol:'jefe', sector:'PRA11'}}, async (_, {sesion}) => {
                jefe11Session = sesion;
            });
        })
        it("insertar una semana de vacaciones como primera novedad", async function(){
            this.timeout(7000);
            await enNuevaPersona(1, {vacaciones: 20}, async (persona) => {
                var novedadRegistradaPorCargar = {desde:date.iso('2000-01-01'), hasta:date.iso('2000-01-07'), cod_nov:COD_VACACIONES, cuil: persona.cuil};
                var informe = await rrhhSession.callProcedure(ctts.si_cargara_novedad, novedadRegistradaPorCargar);
                discrepances.showAndThrow(informe, {dias_corridos:7, dias_habiles:5, dias_coincidentes:0})
                await rrhhSession.saveRecord(ctts.novedades_registradas, novedadRegistradaPorCargar, 'new');
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-01-04'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-01-05'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-01-06'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-01-07'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
                // LÍMIES:
                await rrhhSession.tableDataTest('nov_per', [
                    {annio:2000, cod_nov:COD_VACACIONES, limite:20, cantidad:5, saldo:15},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
            })
        })
        it("insertar una semana de vacaciones en una semana con feriados", async function(){
            // https://argentina.workingdays.org/dias_laborables_calendario_2000.htm
            await enNuevaPersona(2, {vacaciones: 15}, async (persona) => {
                var novedadRegistradaPorCargar = {desde:date.iso('2000-03-06'), hasta:date.iso('2000-03-12'), cod_nov:COD_VACACIONES, cuil: persona.cuil}
                var informe = await rrhhSession.callProcedure(ctts.si_cargara_novedad, novedadRegistradaPorCargar);
                discrepances.showAndThrow(informe, {dias_corridos:7, dias_habiles:3, dias_coincidentes:0})
                await rrhhSession.saveRecord(ctts.novedades_registradas, novedadRegistradaPorCargar, 'new');
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-03-08'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-03-09'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-03-10'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
                // LÍMIES:
                await rrhhSession.tableDataTest('nov_per', [
                    {annio:2000, cod_nov:COD_VACACIONES, limite:15, cantidad:3, saldo:12},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
            })
        })
        it("pide dos semanas de vacaciones, luego las corta y después pide trámite", async function(){
            this.timeout(8000);
            await enNuevaPersona(3, {vacaciones: 20, tramites: 4}, async (persona) => {
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-05-02'), hasta:date.iso('2000-05-12'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    'new'
                );
                var novedadRegistradaPorCargar = {desde:date.iso('2000-05-08'), hasta:date.iso('2000-05-12'), cod_nov:COD_TELETRABAJO, cuil: persona.cuil}
                var informe = await rrhhSession.callProcedure(ctts.si_cargara_novedad, novedadRegistradaPorCargar);
                discrepances.showAndThrow(informe, {dias_corridos:5, dias_habiles:5, dias_coincidentes:5})
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    novedadRegistradaPorCargar,
                    'new'
                );
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-05-11'), hasta:date.iso('2000-05-11'), cod_nov:COD_TRAMITE, cuil: persona.cuil},
                    'new'
                );
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-05-02'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-05-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-05-04'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-05-05'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-05-08'), cod_nov:COD_TELETRABAJO, cuil: persona.cuil},
                    {fecha:date.iso('2000-05-09'), cod_nov:COD_TELETRABAJO, cuil: persona.cuil},
                    {fecha:date.iso('2000-05-10'), cod_nov:COD_TELETRABAJO, cuil: persona.cuil},
                    {fecha:date.iso('2000-05-11'), cod_nov:COD_TRAMITE, cuil: persona.cuil},
                    {fecha:date.iso('2000-05-12'), cod_nov:COD_TELETRABAJO, cuil: persona.cuil},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
                // LÍMIES:
                await rrhhSession.tableDataTest('nov_per', [
                    {annio:2000, cod_nov:COD_VACACIONES, limite:20, cantidad:4, saldo:16},
                    {annio:2000, cod_nov:COD_TELETRABAJO, limite:null, cantidad:4, saldo:null},
                    {annio:2000, cod_nov:COD_TRAMITE, limite:4, cantidad:1, saldo:3},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
            })
        })
        it("cargo teletrabajo diagramado", async function(){
            await enNuevaPersona(4, {}, async (persona) => {
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-01-01'), hasta:date.iso('2000-01-07'), cod_nov:COD_DIAGRAMADO, cuil: persona.cuil, 
                        dds1:true, dds2:false, dds3:true, dds4:true, dds5:false},
                    'new'
                );
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-03'), cod_nov:COD_DIAGRAMADO, cuil: persona.cuil},
                    {fecha:date.iso('2000-01-05'), cod_nov:COD_DIAGRAMADO, cuil: persona.cuil},
                    {fecha:date.iso('2000-01-06'), cod_nov:COD_DIAGRAMADO, cuil: persona.cuil},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
                // LÍMIES:
                await rrhhSession.tableDataTest('nov_per', [
                    {annio:2000, cod_nov:COD_DIAGRAMADO, limite:null, cantidad:3, saldo:null},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
            })
        })
        it("cargo un día de trámite", async function(){
            await enNuevaPersona(5, {}, async (persona) => {
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-01-06'), hasta:date.iso('2000-01-06'), cod_nov:COD_TRAMITE, cuil: persona.cuil, 
                        dds1:true, dds2:false, dds3:true, dds4:true, dds5:false},
                    'new'
                );
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-06'), cod_nov:COD_TRAMITE, cuil: persona.cuil},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
            })
        })
        it("intento de cargar novedades sin permiso", async function(){
            await enNuevaPersona(6, {}, async (persona) => {
                await expectError( async () => {
                    await basicoSession.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-01-01'), hasta:date.iso('2000-01-07'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                        'new'
                    );
                }, ctts.insufficient_privilege);
            })
        })
        it("intento ver novedades de otra persona", async function(){
            await enNuevaPersona(7, {}, async (persona) => {
                await rrhhSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-01-03'), hasta:date.iso('2000-01-03'), cod_nov:COD_TRAMITE, cuil: persona.cuil},
                    'new'
                );
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-03'), cod_nov:COD_TRAMITE, cuil: persona.cuil},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
                // el usuario básico no debería ver los datos de otra persona:
                await basicoSession.tableDataTest('novedades_vigentes', [
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
            })
        })
        it.skip("quito un feriado y veo que hay más novedades", async function(){
            await enDosNuevasPersonasConFeriado10EneroFeriadoy11No(8, 9, '10001', async (persona1, persona2, cod_nov) => {
                /* Verifico que ese día tenga 2 novedades cargadas */
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-11'), cod_nov, cuil: persona1.cuil},
                    {fecha:date.iso('2000-01-11'), cod_nov, cuil: persona2.cuil},
                ], 'all', {fixedFields:[{fieldName:'cod_nov', value:cod_nov}]})
                /* quito el feriado */
                await rrhhAdminSession.saveRecord(
                    ctts.fecha, 
                    {fecha:date.iso('2000-01-10'), laborable:null, repite:null, inamovible:null, leyenda:'PRUEBA AUTOMÁTICA agregar feriado'}, 
                    'update'
                )
                /* Verifico que esos días tengan 4 novedades vigentes */
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-10'), cod_nov, cuil: persona1.cuil},
                    {fecha:date.iso('2000-01-11'), cod_nov, cuil: persona1.cuil},
                    {fecha:date.iso('2000-01-10'), cod_nov, cuil: persona2.cuil},
                    {fecha:date.iso('2000-01-11'), cod_nov, cuil: persona2.cuil},
                ], 'all', {fixedFields:[{fieldName:'cod_nov', value:cod_nov}]})
           })
        })
        // agrego delete en calcular_novedades_vigentes e incorporo este test
        it.skip("agrego un feriado y veo que hay menos novedades", async function(){
            await enDosNuevasPersonasConFeriado10EneroFeriadoy11No(10, 11, '10002', async (persona1, persona2, cod_nov) => {
                /* Verifico que ese día tenga 2 novedades cargadas */
                await rrhhSession.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-01-11'), cod_nov, cuil: persona1.cuil},
                    {fecha:date.iso('2000-01-11'), cod_nov, cuil: persona2.cuil},
                ], 'all', {fixedFields:[{fieldName:'cod_nov', value:cod_nov}]})
                /* agrego otro feriado */
                await rrhhAdminSession.saveRecord(
                    ctts.fecha, 
                    {fecha:date.iso('2000-01-11'), laborable:false, repite:false, inamovible:false, leyenda:'PRUEBA AUTOMÁTICA agregar feriado'}, 
                    'update'
                )
                /* Verifico que esos días no tengan novedades vigentes */
                await rrhhSession.tableDataTest('novedades_vigentes', [
                ], 'all', {fixedFields:[{fieldName:'cod_nov', value:cod_nov}]})
           })
        })
        it("un usuario común puede ver sus novedades pasadas (y rrhh las puede cargar)", async function(){
            await enNuevaPersona(12, {usuario:{sesion:true}, hoy:date.iso('2000-02-02')}, async (persona, {sesion}) => {
                await rrhhAdminSession.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    'new'
                );
                await sesion.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-02-01'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-02-02'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
            })
        })
        it("un usuario común no puede cargar novedades pasadas", async function(){
            await expectError( async () => {
                await enNuevaPersona(13, {usuario:{sesion:true}, hoy:date.iso('2000-02-02')}, async (persona, {sesion}) => {
                    await sesion.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                        'new'
                    );
                })
            }, ctts.insufficient_privilege)
        })
        it("un jefe puede cargar a alguien de su equipo", async function(){
            await enNuevaPersona(15, {usuario:{sector:'PRA11'}}, async (persona) => {
                await jefe11Session.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    'new'
                );
                await jefe11Session.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-02-01'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-02-02'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
            })
        })
        it("un jefe puede cargar a alguien de un equipo perteneciente", async function(){
            await enNuevaPersona(16, {usuario:{sector:'PRA1111'}}, async (persona) => {
                await jefe11Session.saveRecord(
                    ctts.novedades_registradas, 
                    {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    'new'
                );
                await jefe11Session.tableDataTest('novedades_vigentes', [
                    {fecha:date.iso('2000-02-01'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-02-02'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    {fecha:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
            })
        })
        it("un jefe no puede cargar a alguien de un equipo no perteneciente", async function(){
            await expectError( async () => {
                await enNuevaPersona(17, {usuario:{sector:'PRA12'}}, async (persona) => {
                    await jefe11Session.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                        'new'
                    );
                })
            }, ctts.insufficient_privilege);
        })
        it("un usuario no puede cargarse novedades a sí mismo", async function(){
            await expectError( async () => {
                await enNuevaPersona(18, {usuario:{sector:'PRA12', sesion:true}}, async (persona, {sesion}) => {
                    await sesion.saveRecord(
                        ctts.novedades_registradas, 
                        {desde:date.iso('2000-02-01'), hasta:date.iso('2000-02-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                        'new'
                    );
                })
            }, ctts.insufficient_privilege);
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
    after(async function(){
        this.timeout(20000);
        var error: Error|null = null;
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
            const sqlTraerNovedades = `SELECT array_agg(concat_ws(' ',fecha,cuil,cod_nov) order by fecha, cuil) FROM novedades_vigentes WHERE ${FECHAS_DE_PRUEBA}`
            const sqlCalcularNovedades = `SELECT calcular_novedades_vigentes('${DESDE_AÑO}-01-01','${HASTA_AÑO}-12-31',null)`;
            const emptyBenchmarkDay = {
                date: date.today(),
                tiempos: []
            }
            var benchmarkDelDia = await loadLocalFile(emptyBenchmarkDay);
            if (benchmarkDelDia.date != emptyBenchmarkDay.date) {
                benchmarkDelDia = emptyBenchmarkDay;
            }
            const comienzo = new Date();
            await server.inDbClient(ADMIN_REQ, async client => {
                const {row: tamannio} = await client.query(`select count(*) as personal from personal where ${CUIL_DE_PRUEBA}`).fetchUniqueRow();
                const benchmark = {
                    tamannio,
                    duracion: null as number|null
                }
                const todasLasNovedadesGeneradas = (await client.query(sqlTraerNovedades).fetchUniqueValue()).value;
                await client.query(sqlCalcularNovedades).execute();
                console.log('calculando novedadesRecalculadasEncima')
                const novedadesRecalculadasEncima = (await client.query(sqlTraerNovedades).fetchUniqueValue()).value;
                discrepances.showAndThrow(novedadesRecalculadasEncima, todasLasNovedadesGeneradas);
                console.log('calculando novedadesRecalculadasEnBlanco')
                await client.query(`delete from novedades_vigentes where ${FECHAS_DE_PRUEBA}`).execute();
                await client.query(sqlCalcularNovedades).execute();
                const novedadesRecalculadasEnBlanco = (await client.query(sqlTraerNovedades).fetchUniqueValue()).value;
                discrepances.showAndThrow(novedadesRecalculadasEnBlanco, todasLasNovedadesGeneradas)
                console.log('calculando novedadesRecalculadasPorFecha')
                var fechas = (await client.query(`select distinct fecha from novedades_vigentes where ${FECHAS_DE_PRUEBA}`).fetchAll()).rows;
                await client.query(`delete from novedades_vigentes where ${FECHAS_DE_PRUEBA}`).execute();
                for(var row of fechas) {
                    await client.query(`SELECT calcular_novedades_vigentes($1, $2, null)`, [row.fecha, row.fecha]).execute();
                }
                const novedadesRecalculadasPorFecha = (await client.query(sqlTraerNovedades).fetchUniqueValue()).value;
                discrepances.showAndThrow(novedadesRecalculadasPorFecha, todasLasNovedadesGeneradas);
                console.log('calculando novedadesRecalculadasPorCuit')
                var cuits = (await client.query(`select distinct cuil from novedades_vigentes where ${FECHAS_DE_PRUEBA}`).fetchAll()).rows;
                await client.query(`delete from novedades_vigentes where ${FECHAS_DE_PRUEBA}`).execute();
                for(var row of cuits) {
                    await client.query(`SELECT calcular_novedades_vigentes('${DESDE_AÑO}-01-01', '${HASTA_AÑO}-12-31', $1)`, [row.cuil]).execute();
                }
                const novedadesRecalculadasPorCuit = (await client.query(sqlTraerNovedades).fetchUniqueValue()).value;
                benchmark.duracion = Number(
                    // @ts-ignore   
                    new Date() - comienzo
                );
                // @ts-ignore
                benchmarkDelDia.tiempos.push(benchmark); 
                await saveLocalFile(benchmarkDelDia);
                await benchmarksSave(benchmarkDelDia);
                discrepances.showAndThrow(novedadesRecalculadasPorCuit, todasLasNovedadesGeneradas)
            })
        } catch(err) {
            console.log("****************** ERROR AL FINAL VERIFICANDO QUE SE PUEDA REGENERAR *******************")
            console_log(err);
            error = err as Error;
        }
        this.timeout(3000);
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

