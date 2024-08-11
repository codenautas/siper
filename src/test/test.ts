"use strict";

import { AppSiper } from '../server/app-principal';

// import { date } from "best-globals";
// import * as pg from 'pg-promise-strict';

import { startServer, Wrap } from "./probador-serial";

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

const AÑOS_DE_PRUEBA = 'annio BETWEEN 2000 AND 2009';
const CUIL1 = '201234567890';

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
                    `delete from novedades_vigentes where ${AÑOS_DE_PRUEBA}`,
                    `delete from novedades_registradas where ${AÑOS_DE_PRUEBA}`,
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
    describe("primer registro", function(){
        it("insertar", async function(){
            await wrap.saveRecord(
                'novedades_registradas', 
                {desde:'2000-01-01', hasta:'2000-01-07', cod_nov:1, cuil: CUIL1},
                'new'
            );
            await wrap.tableDataTest('novedaes_vigentes', [
                {fecha:'2000-01-03', cod_nov:1, cuil: CUIL1},
                {fecha:'2000-01-04', cod_nov:1, cuil: CUIL1},
                {fecha:'2000-01-05', cod_nov:1, cuil: CUIL1},
                {fecha:'2000-01-06', cod_nov:1, cuil: CUIL1},
                {fecha:'2000-01-07', cod_nov:1, cuil: CUIL1},
            ], 'all', {fixedFields:[{fieldName:'cuil', value:CUIL1}]})
        })
    })
})

