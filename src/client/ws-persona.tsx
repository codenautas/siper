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
    const {fieldsProps} = props;
    const f = createIndex(fieldsProps, f => f.fd.name)
    if (f.idper == null) return <Card> <Typography>Cargando...</Typography> </Card>

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
        <Box>
            <GenericField {...f.apellido} />
            <GenericField {...f.nombres} />
            <GenericField {...f.ficha} />
            <GenericField {...f.idmeta4} />
            <GenericField {...f.cuil} />
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
        ({table, fixedFields, conn}) => CardEditorConnected({table, fixedFields, conn, CardDisplay: PersonaDisplay})
    )
}
