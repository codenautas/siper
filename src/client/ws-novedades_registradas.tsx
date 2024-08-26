import * as React from "react";

import { 
    CardEditorConnected,
    ComboBox,
    Connector,
    ifNotNullApply,
    renderConnectedApp, 
    RowType,
    TableDefinition,
} from "frontend-plus";

import {
    // Alert, 
    // Button, 
    Checkbox, 
    // FormControl, 
    FormControlLabel,
    // IconButton,
    // SvgIcon
    TextField, // Typography,
} from "@mui/material";

import * as BestGlobals from "best-globals";

import { Persona } from "../common/contracts"
import { FieldDefinition } from "backend-plus";

// @ts-ignore 
var my=myOwn;

/* Dos líneas para incluir contracts: */
var persona: Persona | null = null;
console.log(persona)

function GenericField(props:{
    fd:FieldDefinition, value:any, forEdit:boolean, originalValue:any, isValueUpdated:boolean,
    mobile:boolean, makeChange:(value:any)=>void, getOptions:()=>any[]
}){
    const variant = "standard";
    var {fd, value, originalValue, isValueUpdated, mobile, makeChange} = props;
    const {name, typeName, title, allow} = fd;
    const editable = !!allow?.update && props.forEdit;
    const key = "renglon-" + name;
    const toolTip = isValueUpdated ? 'ANTES: ' + originalValue : '';
    const classUpdated = isValueUpdated ? "bp-field-changed" : "bp-field-unchanged"
    switch(typeName){
        case 'boolean':
            return <FormControlLabel control={
                <Checkbox 
                    key={key} 
                    checked={!!value}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        makeChange(event.target.checked);
                    }}
                    disabled={!editable}
                    name={title} 
                />
            } label={name}
            className={classUpdated}
            />;
        case 'date':
            return <TextField 
                key={key} 
                value={value == null ? '' : (value as BestGlobals.RealDate)?.toYmd?.()}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    makeChange(ifNotNullApply(event.target.value, BestGlobals.date.iso));
                }}
                type="date" 
                InputLabelProps={{ shrink: true }} 
                label={title} 
                disabled={!editable}
                title={toolTip}
                variant={variant} 
                className={classUpdated}
            />
        case 'decimal':
        case 'bigint':
            return <TextField 
                key={key} 
                // value={ifNotNullApply(value, Number)}
                value={value == null ? '' : value}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    makeChange(ifNotNullApply(event.target.value, Number));
                }}
                type="number" 
                InputLabelProps={{ shrink: value != null }} 
                label={title} 
                disabled={!editable}
                title={toolTip}
                variant={variant} 
                className={classUpdated}
            />
        default: 
            const options = props.getOptions()
            if (value != null && !options.includes(value)) { options.unshift(value) }
            return <ComboBox 
                key={key}
                value={value as string}
                onChange={(value: string|null) => {
                    makeChange(value);
                }}
                valueOfNull={!fd.nullable && fd.allowEmptyText ? '' : null}
                options={options}
                label={title!}
                disabled={!editable}
                freeSolo={!fd.references}
                variant={variant}
                title={toolTip}
                className={classUpdated}
                mobile={mobile}
            />
    }
}

function RegistrarNovedades(props:{updatesToRow:RowType, originalRow:RowType, onRowChange: (row:RowType)=>void, tableDef:TableDefinition, lists:(name:string, row:RowType)=>string[], forEdit:boolean,
    mobile:boolean
}){
    const {updatesToRow, originalRow, tableDef, lists, mobile, forEdit} = props;
    const fieldsDef = tableDef.fields; 
    const newRow = {...originalRow, ...updatesToRow};
    console.log('=============')
    console.log(JSON.stringify(newRow))
    var fieldsProps = fieldsDef.map((fd) => { 
        var {name} = fd;
        const makeChange = (newValue: any) => {
            var newUpdatesToRow = {...updatesToRow}
            if (BestGlobals.sameValue(newValue, originalRow[name] ?? null)){
                delete newUpdatesToRow[name];
            } else {
                newUpdatesToRow[name] = newValue;
            }
            props.onRowChange(newUpdatesToRow);
        }
        const isValueUpdated = name in updatesToRow;
        const value = (isValueUpdated ? updatesToRow[name] : originalRow[name]) ?? null;
        const originalValue = originalRow[name] ?? null;
        return {fd, value, forEdit, originalValue, isValueUpdated, mobile, makeChange, getOptions:()=>lists(name, newRow) ?? []}
    });
    return <>
        {fieldsProps.map(props =>
            <GenericField {...props}/>
        )}
    </>
}


// @ts-ignore
myOwn.wScreens.registroNovedades = function registroNovedades(addrParams:any){
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams, table: 'novedades_registradas' },
        document.getElementById('total-layout')!,
        ({table, fixedFields, conn}) => CardEditorConnected({table, fixedFields, conn, CardEditor:RegistrarNovedades})
    )
}

