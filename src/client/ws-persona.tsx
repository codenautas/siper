import * as React from "react";

import { 
    CardEditorConnected,
    Connector,
    GenericField,
    GenericFieldProperties,
    OptionsInfo,
    renderConnectedApp, 
} from "frontend-plus";

import {
    Box,
    Card, 
    Typography
} from "@mui/material";

// @ts-ignore
import { strict as likear, createIndex } from "like-ar";

// @ts-ignore 
var my=myOwn;

function PersonaDisplay(props:{fieldsProps:GenericFieldProperties[], optionsInfo:OptionsInfo}){
    const {fieldsProps, optionsInfo} = props;
    const f = createIndex(fieldsProps, f => f.fd.name)
    const rowsSectores = optionsInfo.tables!.sectores;
    if (f.idper == null) return <Card> <Typography>Cargando...</Typography> </Card>

    console.log(rowsSectores);

    return <Card style={{ width: 'auto' }}>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <Box>
        detalle general persona
        <Box>
            <GenericField {...f.idper} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <GenericField {...f.apellido} />
            <GenericField {...f.nombres} />
            <GenericField {...f.ficha} />
            <GenericField {...f.idmeta4} />
            <GenericField {...f.cuil} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <GenericField {...f.sector} />
            <GenericField {...f.sectores__nombre_sector} />
        </Box>
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
