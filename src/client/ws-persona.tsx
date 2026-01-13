import * as React from "react";

import { 
    CardEditorConnected,
    Connector,
    GenericField,
    GenericFieldProperties,
    OptionsInfo,
    renderConnectedApp, 
} from "frontend-plus";

declare module "frontend-plus" {
  interface FieldDefinition{
    grupo?:string
    ancho?:number
  }
}

import {
    Box,
    Card, 
    Typography
} from "@mui/material";

import { createIndex } from "like-ar";

// @ts-ignore
var my=myOwn;

function GrupoPeronas(props:{idGrupo:string, nombreGrupo:string, fieldsProps:GenericFieldProperties[], optionsInfo:OptionsInfo}){
  return <Box>
    <div className="personal-title-seccion">{props.nombreGrupo}</div>
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
      {props.fieldsProps.filter(f => f.fd.grupo == props.idGrupo).map(f => <GenericField key={f.fd.name} {...f} />)}
    </Box>
  </Box>
}

function PersonaDisplay(props:{fieldsProps:GenericFieldProperties[], optionsInfo:OptionsInfo}){
    const {fieldsProps, optionsInfo} = props;
    const f = createIndex(fieldsProps, f => f.fd.name)
    // const rowsSectores = optionsInfo.tables!.sectores;
    if (f.idper == null) return <Card> <Typography>Cargando...</Typography> </Card>
    return <Card style={{ width: 'auto' }} className="ficha-personas">
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '80vh',
      }}
    >
      <Box>
        datos personales
        <GrupoPeronas idGrupo='identif' fieldsProps={fieldsProps} optionsInfo={optionsInfo} nombreGrupo=""/>
        <GrupoPeronas idGrupo='funcion' fieldsProps={fieldsProps} optionsInfo={optionsInfo} nombreGrupo="funcional"/>
        <GrupoPeronas idGrupo='persona' fieldsProps={fieldsProps} optionsInfo={optionsInfo} nombreGrupo="datos personales"/>
      </Box>
    </Box>
  </Card>
  
}

// @ts-ignore
myOwn.wScreens.registroPersona = function registroPersona(addrParams:any){
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams, table: 'personas' },
        document.getElementById('total-layout')!,
        ({table, fixedFields, conn}) => CardEditorConnected({table, fixedFields, conn, withMenu: true, CardDisplay: PersonaDisplay})
    )
}
