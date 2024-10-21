import * as React from "react";

import {
    useEffect, useState, 
} from "react";

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
    Typography, 
    Select, 
    MenuItem, 
    Button, 
    Drawer,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper
} from "@mui/material";

import { date } from "best-globals";
import { strict as likear, createIndex } from "like-ar";
import * as json4all from "json4all";

import { NovedadRegistrada, CalendarioResult, Annio, meses, HistoricoResult } from "../common/contracts"

// @ts-ignore 
var my=myOwn;

function DiasHabiles(props:{novedad:Partial<NovedadRegistrada>}){
    const {novedad} = props;
    const leyendaVacia = {leyenda:"ingrese desde hasta para calcular días hábiles"}; 
    const leyendaCalculando = {leyenda:"calculando..."};
    const [leyenda, setLeyenda] = useState({leyenda:"..."})
    const grabado = true;
    useEffect(()=>{
        if (novedad.desde == null || novedad.hasta == null) {
            setLeyenda(leyendaVacia);
        } else {
            setLeyenda(leyendaCalculando);
            my.ajax.si_cargara_novedad(novedad).then(
                info => {
                    setLeyenda({leyenda: `${info.dias_habiles} días hábiles (${info.dias_corridos} días corridos)${
                        !grabado && info.dias_coincidentes?` Atención hay ${info.dias_coincidentes} días que coinciden con una carga anterior`:``
                    }.`})
                },
                err => {
                    setLeyenda({leyenda: err.message})
                }
            )
        }
    },[json4all.toUrl(novedad)]);
    return <Typography>{leyenda.leyenda}</Typography>
}

function Historico(props:{idper:string}){
    const {idper} = props;
    const [annios, setAnnios] = useState<Annio[]>([]);
    const [periodo, setPeriodo] = useState({mes:date.today().getMonth()+1, annio:date.today().getFullYear()});
    const [historico, setHistorico] = useState<HistoricoResult[]>([]);
    useEffect(function(){
        setHistorico([]);
        my.ajax.table_data({table: 'annios', fixedFields: [],paramfun:{} }).then(_annios => {
            setAnnios(_annios);
        });
        if (idper != null) my.ajax.historico_persona({idper, ...periodo}).then(_historico => {
            setHistorico(_historico)
            console.log(_historico)
        })
    },[idper, periodo.mes, periodo.annio])
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

function Calendario(props:{idper:string}){
    const {idper} = props;
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
        if (idper != null) my.ajax.calendario_persona({idper, ...periodo}).then(dias => {
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

    },[idper, periodo.mes, periodo.annio])
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

function NovedadesDisplay(props:{fieldsProps:GenericFieldProperties[], optionsInfo:OptionsInfo}){
    const {fieldsProps, optionsInfo} = props;
    const f = createIndex(fieldsProps, f => f.fd.name)
    const rowsCodNov = optionsInfo.tables!.cod_novedades;
    if (f.idper == null) return <Card> <Typography>Cargando...</Typography> </Card>
    const novedad = likear(f).filter((_, name) => !(/__/.test(name as string))).map(f => f.value).plain() as Partial<NovedadRegistrada>
    const c_dds = !!rowsCodNov?.[f.cod_nov.value]?.c_dds;

    const [isCalendarioOpen, setIsCalendarioOpen] = useState(false);
    const toggleCalendario = (open: boolean) => {
        setIsCalendarioOpen(open);
    };
    const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
    const toggleHistorico = (open: boolean) => {
        setIsHistoricoOpen(open);
    };

    return <Card style={{ width: 'auto' }}>
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
          height: '100px',
        }}
      >
        detalle general persona
        <Box>
            <GenericField {...f.idper} />
            <GenericField {...f.personas__apellido} />
            <GenericField {...f.personas__nombres} />
            <GenericField {...f.personas__ficha} />
            <GenericField {...f.personas__idmeta4} />
            <GenericField {...f.personas__cuil} />
        </Box>
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
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
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
          </Box>
  
          <Box>
            <DiasHabiles novedad={novedad} />
          </Box>
  
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
        </Box>
      </Box>
    </Box>
  
    <Drawer anchor="right" open={isCalendarioOpen} onClose={() => toggleCalendario(false)}>
      <Calendario idper={f.idper.value} />
    </Drawer>
    <Drawer anchor="right" open={isHistoricoOpen} onClose={() => toggleHistorico(false)}>
      <Historico idper={f.idper.value} />
    </Drawer>
  </Card>
  
}

// @ts-ignore
myOwn.wScreens.registroNovedades = function registroNovedades(addrParams:any){
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams, table: 'novedades_registradas' },
        document.getElementById('total-layout')!,
        ({table, fixedFields, conn}) => CardEditorConnected({table, fixedFields, conn, CardDisplay: NovedadesDisplay})
    )
}

