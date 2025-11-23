import { Constraint, FieldDefinition, PostInputOptions } from "backend-plus";
import { AppSiper } from "./app-principal";

// exposes APIs from this package
export * from "backend-plus";
export * from "serial-tester";
export * from "pg-promise-strict";

declare module "backend-plus"{
    interface Context {
        forDump?:boolean
        es:{admin:boolean, administrador:boolean, superior:boolean, rrhh:boolean, registra:boolean}
    }
    interface ProcedureContext {
        be:AppSiper
    }
    interface ClientSetup {
        tableData:Record<string, Record<string, Record<string, any>>> // tableName -> json(pk) -> fieldName -> value
    }
    interface User {
        usuario:string
        rol:string
    }
    interface AppConfigClientSetup {
        es:{admin:boolean, superior:boolean, rrhh:boolean, registra:boolean}
    }

    interface AppConfig {
        test?:{
            "only-in-db"?: string
        }
        destres?:{
            minutos: number
        }
    }

    interface FieldDefinition {
        grupo?:string
    }
}

declare module "serial-tester"{
    interface ClientConfig{
        username:string
    }
}

export const soloDigitosPostConfig = 'soloDigitos' as PostInputOptions
export const sinMinusculasNiAcentos = 'sinMinusculasNiAcentos' as PostInputOptions
export const sinMinusculas = 'sinMinusculas' as PostInputOptions

export function soloDigitosCons(fieldName: string):Constraint{
    return {
        constraintType:'check', 
        consName:`solo digitos sin ceros a la izquierda en ${fieldName}`, 
        expr: `${fieldName} similar to '[1-9][0-9]*|0'`
    }
}

export function soloCodigo(fieldName: string):Constraint{
    return {
        constraintType:'check', 
        consName:`palabra corta y solo mayusculas en ${fieldName}`, 
        expr: `${fieldName} similar to '[A-Z][A-Z0-9]{0,9}|[1-9]\\d{0,10}'`
    }
}

export function soloMayusculas(fieldName: string):Constraint{
    return {
        constraintType:'check', 
        consName:`Solo mayusculas en ${fieldName}`, 
        expr: `${fieldName} similar to '[A-Z][A-Z0-9 ]*'`
    }
}

export function sinEspaciosMail(fieldName: string):Constraint{
    return {
        constraintType:'check', 
        consName:`Sin espacios ni saltos en ${fieldName}`, 
        expr: `${fieldName} similar to '[^[:space:]]+@[^[:space:]]+'`
    }
}

export type Time = `${number}:${number}` | `${number}:${number}:${number}` 

export type Constructor<T> = new(...args: any[]) => T;

export const idImportacion:FieldDefinition = {name: 'id_importacion', typeName: 'bigint', nullable:true, editable:false, // @ts-ignore */ 
    sequence:{}
}
