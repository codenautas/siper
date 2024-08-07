import { Constraint, PostInputOptions } from "backend-plus";
import { AppSiper } from "./app-principal";

// exposes APIs from this package
export * from "backend-plus";
export * from "pg-promise-strict";

declare module "backend-plus"{
    interface Context {
        forDump?:boolean
        es:{admin:boolean, oficina:boolean, puedePares:boolean}
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
}

export const soloDigitosPostConfig = 'soloDigitos' as PostInputOptions

export function soloDigitosCons(fieldName: string):Constraint{
    return {
        constraintType:'check', 
        consName:`solo digitos sin ceros a la izqueirda en ${fieldName}`, 
        expr: `${fieldName} similar to '[1-9][0-9]*|0'`
    }
}

export function soloCodigo(fieldName: string):Constraint{
    return {
        constraintType:'check', 
        consName:`palabra corta y solo mayusculas en ${fieldName}`, 
        expr: `${fieldName} similar to '[A-Z][A-Z0-9]{0,9}'`
    }
}

export type Constructor<T> = new(...args: any[]) => T;