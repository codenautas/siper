import * as React from "react";

import {
    useEffect, useState, 
} from "react";
//@ts-ignore
import { CardEditorConnected, Connector, GenericField, GenericFieldProperties, MenuH, OptionsInfo, renderConnectedApp, RowType } from "frontend-plus";

import { 
    Card, 
    Typography,
    Box,
    Select,
    MenuItem,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Drawer,
    Button,
    CardContent,
    Divider
 } from "@mui/material"

import { date } from "best-globals";
//@ts-ignore
import { strict as likear, createIndex } from "like-ar";
//@ts-ignore
import { CalendarioResult, Annio, meses, HistoricoResult, Persona, NovedadRegistrada, NovPer } from "../common/contracts"

// @ts-ignore 
var my=myOwn;

function Historico(props:{cuil:string}){
    const {cuil} = props;
    const [annios, setAnnios] = useState<Annio[]>([]);
    const [periodo, setPeriodo] = useState({mes:date.today().getMonth()+1, annio:date.today().getFullYear()});
    const [historico, setHistorico] = useState<HistoricoResult[]>([]);
    useEffect(function(){
        setHistorico([]);
        my.ajax.table_data({table: 'annios', fixedFields: [],paramfun:{} }).then(_annios => {
            setAnnios(_annios);
        });
        if (cuil != null) my.ajax.historico_persona({cuil, ...periodo}).then(_historico => {
            setHistorico(_historico)
            console.log(_historico)
        })
    },[cuil, periodo.mes, periodo.annio])
    return <Card>
        <Box style={{ flex:1}}>
            <Box>
                <Select 
                    value={periodo.mes}
                    onChange={(event) => { // buscar el tipo correcto
                        setPeriodo({mes:Number(event.target.value), annio:periodo.annio});
                    }}
                >
                    {meses.map((mes) => (
                        <MenuItem key={mes.value} value={mes.value}>
                            {mes.name}
                        </MenuItem>
                    ))}
                </Select>
                <Select 
                    value={periodo.annio}
                    onChange={(event) => { // buscar el tipo correcto
                        setPeriodo({mes:periodo.mes, annio:Number(event.target.value)});
                    }}
                >
                    {
                        // @ts-ignore
                        annios.map((annio:Annio) => (
                        <MenuItem key={annio.annio} value={annio.annio}>
                            {annio.annio.toString()}
                        </MenuItem>
                    ))
                        }
                </Select>
            </Box>
            <Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Novedad</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                            {historico.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.fecha.toString()}</TableCell>
                                    <TableCell>{item.cod_nov} - {item.novedad}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
            </Box>
        </Box>
    </Card>
}

function Calendario(props:{cuil:string}){
    const {cuil} = props;
    const [annios, setAnnios] = useState<Annio[]>([]);
    const [periodo, setPeriodo] = useState({mes:date.today().getMonth()+1, annio:date.today().getFullYear()});
    const [calendario, setCalendario] = useState<CalendarioResult[][]>([]);
    const [diaSeleccionado, setDiaSeleccionado] = useState<{ dia: number | null, mes: number | null, annio: number | null, cod_nov?: string }>({ dia: null, mes: null, annio: null });
    useEffect(function(){
        setCalendario([]);
        // ver async
        my.ajax.table_data({table: 'annios', fixedFields: [],paramfun:{} }).then(_annios => {
            setAnnios(_annios);
        });
        if (cuil != null) my.ajax.calendario_persona({cuil, ...periodo}).then(dias => {
            var semanas = [];
            var semana = [];
            for(var i = 0; i < dias[0].dds; i++) {
                semana.push({});
            }
            for(var dia of dias){
                semana.push(dia);
                if (dia.dds == 6) {
                    semanas.push(semana);   
                    semana = []
                }
            }
            if (dia.dds != 6) {
                for(var j = dias[0].dds + 1; j < 6; j++) {
                    semana.push({});
                }
                semanas.push(semana);
            }
            setCalendario(semanas)
        })

    },[cuil, periodo.mes, periodo.annio])
    return <Card className="calendario-mes">
        <Box style={{ flex:1}}>
        <Box>
            <Select 
                value={periodo.mes}
                onChange={(event) => { // buscar el tipo correcto
                    setPeriodo({mes:Number(event.target.value), annio:periodo.annio});
                }}
            >
                {meses.map((mes) => (
                    <MenuItem key={mes.value} value={mes.value}>
                        {mes.name}
                    </MenuItem>
                ))}
            </Select>
            <Select 
                value={periodo.annio}
                onChange={(event) => { // buscar el tipo correcto
                    setPeriodo({mes:periodo.mes, annio:Number(event.target.value)});
                }}
            >
                {
                    // @ts-ignore
                    annios.map((annio:Annio) => (
                    <MenuItem key={annio.annio} value={annio.annio}>
                        {annio.annio.toString()}
                    </MenuItem>
                ))
                    }
            </Select>
        </Box>
        <Box className="calendario-semana">
            <div className="calendario-nombre-dia tipo-dia-no-laborable">dom</div>
            <div className="calendario-nombre-dia">lun</div>
            <div className="calendario-nombre-dia">mar</div>
            <div className="calendario-nombre-dia">mié</div>
            <div className="calendario-nombre-dia">jue</div>
            <div className="calendario-nombre-dia">vie</div>
            <div className="calendario-nombre-dia tipo-dia-no-laborable">sáb</div>
        </Box>
        {calendario.map(semana => <Box className="calendario-semana">
            {semana.map(dia => <div className={`calendario-dia tipo-dia-${dia.tipo_dia} ${
                diaSeleccionado.dia === dia.dia && diaSeleccionado.mes === periodo.mes && diaSeleccionado.annio === periodo.annio? 'calendario-dia-seleccionado' : ''
              }`}
              onClick={() => setDiaSeleccionado({ dia: dia.dia, mes: periodo.mes, annio: periodo.annio, cod_nov: dia.cod_nov })}
              >
                <span className="calendario-dia-numero">{dia.dia ?? ''}</span>
                <span className="calendario-dia-contenido">{dia.cod_nov ?? ''}</span>
            </div>)}
        </Box>)}
        </Box>
        <Box>
        {diaSeleccionado.cod_nov && (
          <div>
            <p><strong>Codigo:</strong> {diaSeleccionado.cod_nov}</p>
          </div>
        )}
      </Box>
    </Card>
}

function LicenciaResumenPersona(props:{cuil:string}){
    const {cuil} = props;
    //@ts-ignore
    const [resumen, setResumen] = useState<NovPer[]>([]);
    useEffect(function(){
        setResumen([]);
    },[cuil])

    const mockresumen = [{año: '2024', cod_nov:'1', cuil: '10330010016', cantidad: 20, limite: 30, saldo: 10}
                        ,{año: '2023', cod_nov:'1', cuil: '10330010016', cantidad: 29, limite: 30, saldo: 1}]

    // ver como traer data de una tabla calculada (nov_per)
    return <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
    {mockresumen.map((item, index) => (
      <Card key={index} sx={{ display: 'flex', alignItems: 'center', padding: 2, width: 'auto', maxWidth: '300px', boxShadow: 3 }}>
        <Box sx={{ backgroundColor: '#003b79', color: 'white', padding: 2, borderRadius: 2, textAlign: 'center', minWidth: '80px' }}>
          <Typography variant="h4">{item.saldo}</Typography>
          <Typography variant="body2">saldo</Typography>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ margin: '0 16px' }} />
        <CardContent sx={{ padding: 0 }}>
          <Typography variant="h6" component="div">
            Licencias {item.año}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Período: 01/01/{item.año} - 31/12/{item.año === '2024' ? '2025' : item.año}
          </Typography>
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="body1" color="primary">
              {item.cantidad.toString().padStart(2, '0')} tomados
            </Typography>
            <Typography variant="body1" color="primary">
              {item.limite} totales
            </Typography>
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
}

function NovedadesPendientes(props:{cuil:string}){
    const {cuil} = props;
    //@ts-ignore
    const [pendientes, setPendientes] = useState<NovedadRegistrada[]>([]);
    useEffect(function(){
        setPendientes([]);
        if (cuil != null) my.ajax.novedades_pendientes({cuil}).then(_pendientes => {
            setPendientes(_pendientes)
        })
    },[cuil])
    return <Card>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Desde</TableCell>
                        <TableCell>Hasta</TableCell>
                        <TableCell>Codigo</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                        {pendientes.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.desde.toString()}</TableCell>
                                <TableCell>{item.hasta.toString()}</TableCell>
                                <TableCell>{item.cod_nov}</TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Card>
}

function StatusPersonalDisplay(props: { table: string, fixedFields: RowType, conn: Connector }) {
    //@ts-ignore
    const {table, fixedFields, conn} = props;
    const cuil = Array.isArray(fixedFields) ? fixedFields.find(f => f.fieldName === 'cuil') ?? null : null;
    if (cuil == null) return <Card> <Typography>Cargando...</Typography> </Card>

    const [mobile, setMobile] = useState(window.navigator.maxTouchPoints > 2);
    const [isCalendarioOpen, setIsCalendarioOpen] = useState(false);
    const toggleCalendario = (open: boolean) => {
        setIsCalendarioOpen(open);
    };

    const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
    const toggleHistorico = (open: boolean) => {
        setIsHistoricoOpen(open);
    };


    return <> 
        <MenuH title="Renglón" rightTitle={(0 || '').toString()} mobile={mobile} onMobile={setMobile}/>
        <Card style={{ width: 'auto' }}>
        <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '200px',
        }}
      >
        detalle general persona
        <LicenciaResumenPersona cuil={cuil.value}/>
      </Box>
  
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',

          }}
        >
            solicitar novedad
            {/* generar un componente form asociado a una tabla?  */}
            {/* <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                <GenericField {...f.cod_nov} />
                <GenericField {...f.cod_novedades__novedad} />
            </Box>
    
            <Box>
                <GenericField {...f.desde} />
                <GenericField {...f.hasta} />
                {c_dds ? (
                <>
                    <GenericField {...f.dds1} />
                    <GenericField {...f.dds2} />
                    <GenericField {...f.dds3} />
                    <GenericField {...f.dds4} />
                    <GenericField {...f.dds5} />
                </>
                ) : null}
            </Box> */}
    
            {/* <Box>
                <DiasHabiles novedad={novedad} />
            </Box> */}
    
            <Button variant="contained" onClick={() => toggleCalendario(true)}>
                Calendario
            </Button>
            <Button variant="contained" onClick={() => toggleHistorico(true)}>
                Historico
            </Button>
        </Box>
  
        <Box
          sx={{
            flex: 2,
          }}
        >
          solicitudes/novedades
          <NovedadesPendientes cuil={cuil.value} />
        </Box>
      </Box>
    </Box>
  
    <Drawer anchor="right" open={isCalendarioOpen} onClose={() => toggleCalendario(false)}>
      <Calendario cuil={cuil.value} />
    </Drawer>
    <Drawer anchor="right" open={isHistoricoOpen} onClose={() => toggleHistorico(false)}>
      <Historico cuil={cuil.value} />
    </Drawer>
    </Card>
    </>
}

// @ts-ignore
myOwn.wScreens.statusPersona = function statusPersona(addrParams: any){
    //uso el cardeditor para probar, veo de crear un contenedor generico en frontendplus despues?
    //http://localhost:3000/siper/menu#i=novedades,status&ff=,cuil:10330010016
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams, table: 'personal' },
        document.getElementById('total-layout')!,
        ({ table, fixedFields, conn }) => <StatusPersonalDisplay table={table} fixedFields={fixedFields} conn={conn} />

    )
}