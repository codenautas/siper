"use strict";

import { AppSiper } from '../server/app-principal';

// import { date } from "best-globals";
// import * as pg from 'pg-promise-strict';

import { startServer, EmulatedSession } from "./probador-serial";

import { Persona/*, personaDescriptor*/ } from "../common/contracts"

import { date } from "best-globals";
import { expected } from "cast-error";

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

const DESDE_AÑO = `2000`;
const HASTA_AÑO = `2009`;
const AÑOS_DE_PRUEBA = `annio BETWEEN ${DESDE_AÑO} AND ${HASTA_AÑO}`;
const CUIL_DE_PRUEBA = `cuil like '1_3300_____'`;

const COD_VACACIONES = "1";
const COD_TELETRABAJO = "106";
const COD_TRAMITE = "121";
const COD_DIAGRAMADO = "101";

describe("connected", function(){
    var server: AppSiper;
    var rrhhSession: EmulatedSession<AppSiper>;
    before(async function(){
        this.timeout(4000);
        server = await startServer(AppSiper);
        // @ts-expect-error: todavía no está en el config tests-can-delete-db
        if (server.config.devel['tests-can-delete-db']) {
            await server.inDbClient(null, async client=>{
                await client.executeSentences([
                    `delete from nov_gru where ${AÑOS_DE_PRUEBA}`,
                    `delete from novedades_vigentes where ${AÑOS_DE_PRUEBA} and ${CUIL_DE_PRUEBA}`,
                    `delete from novedades_registradas where ${AÑOS_DE_PRUEBA} and ${CUIL_DE_PRUEBA}`,
                    `delete from usuarios where ${CUIL_DE_PRUEBA}`,
                    `delete from personal where ${CUIL_DE_PRUEBA}`,
                    `delete from grupos where ${CUIL_DE_PRUEBA.replace('cuil', 'grupo')}`,
                    `delete from fechas where ${AÑOS_DE_PRUEBA}`,
                    `delete from annios where ${AÑOS_DE_PRUEBA}`,
                    `insert into annios (annio) select * from generate_series(${DESDE_AÑO}, ${HASTA_AÑO}) d`,
                    `insert into fechas (fecha) select date_trunc('day', d) from generate_series(cast('${DESDE_AÑO}-01-01' as timestamp), cast('${HASTA_AÑO}-12-31' as timestamp), cast('1 day' as interval)) d`,
                    `update fechas set laborable = false, repite = false, inamovible = false where fecha in (
                        '2000-03-06', 
                        '2000-03-07',
                        '2000-03-24',
                        '2000-04-20',
                        '2000-04-21');
                    `
                ])
            })
            console.log("Borrado y listo!")
        } else {
            throw new Error("no se puede probar sin setear devel: tests-can-delete-db: true")
        }
        rrhhSession = new EmulatedSession(server, PORT || server.config.server.port);
        await rrhhSession.login({
            username: 'perry',
            password: 'white',
        });
    })
    after(async function(){
        this.timeout(3000);
        await server.shutdownBackend()
        console.log('server down!');
        server = null as unknown as AppSiper;
        setTimeout(()=>{
            console.log('FORCE EXIT');
            process.exit(0);
        }, 1000);
    })
    async function crearUsuario(usuario: {username:string, password:string, rol:string, cuil:string}){
        await server.inDbClient(null, async client => {
            await client.query(
                `INSERT INTO usuarios (usuario, md5clave, rol, cuil, activo) values ($1, md5($2), $3, $4, true)`,
                [usuario.username, usuario.password+usuario.username, usuario.rol, usuario.cuil]
            ).execute();
        })
    }
    it("verifica que exista la tabla de parámetros", async function(){
        await rrhhSession.tableDataTest('parametros',[
            {unico_registro:true},
        ], 'all')
    })
    async function enNuevaPersona(
        numero: number, 
        options: {vacaciones?: number, tramites?: number},
        probar: (persona: Persona) => Promise<void>
    ){
        var haciendo = 'inicializando';
        try {
            var {vacaciones, tramites} = options;
            var persona: Persona = {
                cuil: (10330010005 + numero*11).toString(),
                nomyape: "Persona de prueba " + numero,
                idmeta4: null,
                ficha: null,
                categoria: null,
                sector: null
            }
            await rrhhSession.saveRecord(
                'personal',
                persona,
                'new'
            )
            await rrhhSession.saveRecord('grupos' , {clase: 'I', grupo: persona.cuil}, 'new');
            await rrhhSession.saveRecord('per_gru', {cuil: persona.cuil, clase: 'I', grupo: persona.cuil}, 'new');
            await rrhhSession.saveRecord('per_gru', {cuil: persona.cuil, clase: 'U', grupo: 'T'}, 'new');
            if (vacaciones) await rrhhSession.saveRecord('nov_gru', {annio:2000, cod_nov: COD_VACACIONES, clase: 'I', grupo: persona.cuil, maximo: vacaciones }, 'new')
            if (tramites) await rrhhSession.saveRecord('nov_gru', {annio:2000, cod_nov: COD_TRAMITE, clase: 'U', grupo: 'T', maximo: 4 }, 'new')
            haciendo = 'probando'
            await probar(persona);
        } catch (err) {
            console.error("Test falla", haciendo)
            console.log({numero})
            console.log(persona!)
            throw err;
        }
    } 
    describe("registro de novedades", function(){
        var basicoSession: EmulatedSession<AppSiper>
        before(async function(){
            await enNuevaPersona(5, {}, async (personaComun) => {
                const credentials = {
                    username: 'test_basico',
                    password: 'basico1234',
                }
                await crearUsuario({...credentials, cuil: personaComun.cuil, rol:'basico'});
                basicoSession = new EmulatedSession(server, PORT || server.config.server.port);
                await basicoSession.login(credentials);
            });
        })
        it("insertar una semana de vacaciones como primera novedad", async function(){
            await enNuevaPersona(1, {vacaciones: 20}, async (persona) => {
                await rrhhSession.saveRecord(
                    'novedades_registradas', 
                    {desde:'2000-01-01', hasta:'2000-01-07', cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    'new'
                );
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
                await rrhhSession.saveRecord(
                    'novedades_registradas', 
                    {desde:'2000-03-06', hasta:'2000-03-12', cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    'new'
                );
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
            await enNuevaPersona(3, {vacaciones: 20, tramites: 4}, async (persona) => {
                await rrhhSession.saveRecord(
                    'novedades_registradas', 
                    {desde:'2000-05-02', hasta:'2000-05-12', cod_nov:COD_VACACIONES, cuil: persona.cuil},
                    'new'
                );
                await rrhhSession.saveRecord(
                    'novedades_registradas', 
                    {desde:'2000-05-08', hasta:'2000-05-12', cod_nov:COD_TELETRABAJO, cuil: persona.cuil},
                    'new'
                );
                await rrhhSession.saveRecord(
                    'novedades_registradas', 
                    {desde:'2000-05-11', hasta:'2000-05-11', cod_nov:COD_TRAMITE, cuil: persona.cuil},
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
                    'novedades_registradas', 
                    {desde:'2000-01-01', hasta:'2000-01-07', cod_nov:COD_DIAGRAMADO, cuil: persona.cuil, 
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
        it.skip("intento de cargar novedades sin permiso", async function(){
            await enNuevaPersona(6, {}, async (persona) => {
                try {
                    await basicoSession.saveRecord(
                        'novedades_registradas', 
                        {desde:'2000-01-01', hasta:'2000-01-07', cod_nov:COD_VACACIONES, cuil: persona.cuil},
                        'new'
                    );
                    throw new Error("Se esperaba un error 42501")
                } catch (err) {
                    const error = expected(err);
                    if (error.code != '42501') {
                        console.log("no se esperaba este error", error.code, error);
                        throw error;
                    }
                }
            })
        })
        it.skip("intento ver novedades de otra persona", async function(){
            await enNuevaPersona(7, {}, async (persona) => {
                await rrhhSession.saveRecord(
                    'novedades_registradas', 
                    {desde:'2000-01-03', hasta:'2000-01-03', cod_nov:COD_TRAMITE, cuil: persona.cuil},
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
    })
})

