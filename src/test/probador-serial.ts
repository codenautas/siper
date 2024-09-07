/* 
 * ATENCIÓN
 * ESTE ARCHIVO SE VA A IR A UNA LIBRERÍA 
 * No hay que poner acá nada que conozca la aplicación
 */

import { AppBackend, TableDefinition } from 'backend-plus';
import * as MiniTools from 'mini-tools';
import { expected } from "cast-error";
import { promises as fs } from 'fs';
import { strict as LikeAr } from 'like-ar';
import { Description, guarantee, is, DefinedType } from "guarantee-type";
import * as JSON4all from 'json4all';

import * as discrepances from 'discrepances';

export type Constructor<T> = new(...args: any[]) => T;

export async function startServer<T extends AppBackend>(AppConstructor: Constructor<T>):Promise<T>{
    var server = new AppConstructor();
    var config = await MiniTools.readConfig(
        [server.config],
        {whenNotExist:'ignore'}
    );
    // var client = await pg.connect(config.db);
    // await client.executeSqlScript('test/fixtures/dump-4test.sql');
    console.log('servidor configurado',config);
    await server.start();
    try {
        fs.unlink('local-log-all.sql')
    } catch (err) {
        if (expected(err).code != 'ENOENT') throw err;
    }
    server.setLog({until:'5m'});
    return server;
}

export type Row = Record<string, any>

export type Credentials = {username:string, password:string}

export class EmulatedSession<TApp extends AppBackend>{
    private connstr:string
    public tableDefs: Record<string, TableDefinition> = {}
    private cookies:string[] = []
    constructor(private server:TApp, port:number){
        this.connstr = `http://localhost:${port}${this.server.config.server["base-url"]}`;
    }
    async request(params:{path:string, payload:any, onlyHeaders:boolean}):ReturnType<typeof fetch>;
    async request<T = any>(params:{path:string, payload:any}):Promise<T>;
    async request({path, payload, onlyHeaders}:{path:string, payload:any, onlyHeaders?:boolean}){
        var body = new URLSearchParams(payload);
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        } as Record<string, string>
        if (this.cookies.length) {
            headers.Cookie = this.cookies[0].split(';')[0];
        }
        var request = await fetch(this.connstr+path, {method:'post', headers, body, redirect: 'manual'});
        if (onlyHeaders) {
            return request;
        } else {
            return this.getResult(request);
        }
    }
    // @ts-ignore se queja de infinito
    async callProcedure<T extends Description, U extends Description>(
        target:{procedure:string, parameters:T, result:U}, 
        params:DefinedType<NoInfer<T>>
    ):Promise<DefinedType<NoInfer<U>>>{
        // @ts-ignore
        var mandatoryParameters = target.parameters.optionals;
        var result = await this.request({
            path: '/'+target.procedure,
            payload: {
                ...(LikeAr(mandatoryParameters).map(_ => null).plain()),
                ...(LikeAr(params).map(value => JSON4all.stringify(value)).plain())
            }
        })
        return result;
        // return guarantee(target.result, result);
    }
    async getResult(request:Awaited<ReturnType<typeof fetch>>){
        var result = await request.text();
        var lines = result.split(/\r?\n/);
        var notices:string[] = []
        do {
            var line = lines.shift();
            if (line == '--') return JSON4all.parse( lines.shift() || 'null')
            try{
                var obj = JSON4all.parse( line || '{}' ) as {error:{message:string, code:string}};
            }catch(err){
                console.log('Json error:',line)
                throw err; 
            }
            if (obj.error) {
                const error = expected(new Error("Backend error: " + obj.error.message));
                error.code = obj.error.code;
                throw error;
            }
            if (line != null) notices.push(line);
        } while (lines.length);
        console.log("notices")
        console.log(notices)
        throw new Error('result not received')
    }
    async login(credentials: Credentials) {
        var payload = credentials;
        var request = await this.request({path:'/login', payload, onlyHeaders:true});
        this.cookies = request.headers.getSetCookie();
        if (request.status != 302) throw new Error("se esperaba una redirección");
        var result = request.headers.get('location');
        discrepances.showAndThrow(result, './menu');
        return result;
    }
    // @ts-ignore
    async saveRecord<T extends Description>(target: {table: string, description:T}, rowToSave:DefinedType<NoInfer<T>>, status:'new'):Promise<DefinedType<T>>
    async saveRecord<T extends Description>(target: {table: string, description:T}, rowToSave:Partial<DefinedType<NoInfer<T>>>, status:'update'):Promise<DefinedType<T>>
    async saveRecord<T extends Description>(target: {table: string, description:T}, rowToSave:DefinedType<NoInfer<T>>, status:'new'|'update'):Promise<DefinedType<T>>{
        var context = this.server.getContextForDump();
        const {table, description} = target
        var tableDef = this.server.tableStructures[table](context);
        var result = await this.request({
            path:'/table_record_save',
            payload:{
                table,
                primaryKeyValues: JSON4all.stringify(tableDef.primaryKey.map(f => rowToSave[f])),
                newRow: JSON4all.stringify(rowToSave),
                oldRow: JSON4all.stringify({}),
                status
            }
        })
        var {command, row} = guarantee(is.object({command: is.string, row:description}), result);
        discrepances.showAndThrow(command, discrepances.test(x => x=='INSERT' || x=='UPDATE'));
        return row;
    }
    async tableDataTest(table:string, rows:Row[], compare:'all',opts?:{fixedFields?:{fieldName:string, value:any}[]}){
        var result = await this.request({
            path:'/table_data',
            payload:{
                table,
                paramFun:'{}',
                ...opts,
                fixedFields:JSON.stringify(opts?.fixedFields??[])
            }
        })
        var response = guarantee({array:is.object({},{})}, result);
        var existColumn = LikeAr(rows[0]).map(_ => true).plain();
        var filteredReponseRows = response.map(row => LikeAr(row).filter((_,k) => existColumn[k]).plain());
        switch(compare){
            case 'all': discrepances.showAndThrow(filteredReponseRows, rows);
            break;
            default:
                throw new Error('mode not recognized '+compare);
        }
    }
    async tableDataSaveAndTest(table:string, rows:Row[], compare:'all', status:'new'|'update'){
        for (var row of rows) {
            // @ts-ignore
            await this.saveRecord({table, description:is.object({})}, row, status);
        }
        return this.tableDataTest(table, rows, compare);
    }
}
