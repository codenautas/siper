"use strict";

import { AppSiper } from '../server/app-principal';

// import { date } from "best-globals";
// import * as pg from 'pg-promise-strict';

import { startServer, Wrap } from "./probador-serial";

import { Persona/*, personaDescriptor*/ } from "../common/contracts"

import { date } from "best-globals";

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

describe("connected", function(){
    var server: AppSiper;
    var wrap: Wrap<AppSiper>;
    before(async function(){
        this.timeout(4000);
        server = await startServer(AppSiper);
        // @ts-expect-error: todavía no está en el config tests-can-delete-db
        if (server.config.devel['tests-can-delete-db']) {
            await server.inDbClient(null, async client=>{
                await client.executeSentences([
                    `delete from novedades_vigentes where ${AÑOS_DE_PRUEBA} and ${CUIL_DE_PRUEBA}`,
                    `delete from novedades_registradas where ${AÑOS_DE_PRUEBA} and ${CUIL_DE_PRUEBA}`,
                    `delete from personal where ${CUIL_DE_PRUEBA}`,
                    `delete from fechas where ${AÑOS_DE_PRUEBA}`,
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
        wrap = new Wrap(server, PORT || server.config.server.port);
        await wrap.login();
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
    it("verifica que exista la tabla de parámetros", async function(){
        await wrap.tableDataTest('parametros',[
            {unico_registro:true},
        ], 'all')
    })
    describe("registro de novedades", function(){
        var persona: Persona
        var contador: number = 0;
        beforeEach(async function(){
            contador++; 
            persona = {
                cuil: (10330010005 + contador*11).toString(),
                nomyape: "Persona de prueba " + contador,
                idmeta4: null,
                ficha: null,
                categoria: null,
                sector: null
            }
            console.log('*********************************',persona.cuil,'*')
            await wrap.saveRecord(
                'personal',
                persona,
                'new'
            )
        }) 
        it("insertar una semana de vacaciones como primera novedad", async function(){
            await wrap.saveRecord(
                'novedades_registradas', 
                {desde:'2000-01-01', hasta:'2000-01-07', cod_nov:COD_VACACIONES, cuil: persona.cuil},
                'new'
            );
            await wrap.tableDataTest('novedades_vigentes', [
                {fecha:date.iso('2000-01-03'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                {fecha:date.iso('2000-01-04'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                {fecha:date.iso('2000-01-05'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                {fecha:date.iso('2000-01-06'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
                {fecha:date.iso('2000-01-07'), cod_nov:COD_VACACIONES, cuil: persona.cuil},
            ], 'all', {fixedFields:[{fieldName:'cuil', value:persona.cuil}]})
        })
    })
})

