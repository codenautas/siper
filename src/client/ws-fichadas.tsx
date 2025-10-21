import * as React from "react";
import * as ReactDOM from "react-dom";

import {
    FormEvent,
    useCallback,
    useEffect, useState, 
} from "react";

import { 
    Connector,
    FixedFields,
    ICON,
    renderConnectedApp,
} from "frontend-plus";

import {
    AppBar,
    Box, Button, 
    CircularProgress,
    IconButton,
    MenuItem, 
    Paper,
    Select,
    Toolbar, Typography, TextField,
    FormControl,
    InputLabel,
    Alert
} from "@mui/material";

// Importaciones de íconos de MUI estándar para usar si ICON.Save/Check falla
//import SaveIcon from '@mui/icons-material/Save'; 
//import GpsFixedIcon from '@mui/icons-material/GpsFixed'; 

// Ajusta estas importaciones según la ubicación real en tu proyecto
import { logError, renderRol } from "./ws-componentes";
import { InfoUsuario, Tipos_fichada } from "../common/contracts";
import { tipos_fichada } from "../server/table-tipos_fichada";

// Declaración asumida para 'myOwn' si no está globalmente definido en este archivo
declare const myOwn: any;

const GPS_ERROR = 'GPS_ERROR';

// -------------------------------------------------------------------
// 1. INTERFACES DE TYPESCRIPT
// -------------------------------------------------------------------

interface FichadaData {
    idper: string;
    nombres: string;
    apellido: string;
    tipo_fichada: 'ENTRADA' | 'SALIDA' | 'OTROS' | null;
    fecha: string;
    hora: string;
    observaciones: string;
    punto: string;
    tipo_dispositivo: string;
    id_original: string;
}

interface FichadaPayload {
    fichadas: FichadaData[];
    machine_id: string;
    navigator: string;
}

// -------------------------------------------------------------------
// 2. COMPONENTE FICHADA FORM
// -------------------------------------------------------------------

function FichadaForm(props: { infoUsuario: InfoUsuario, conn:Connector, tiposFichada:Tipos_fichada[] }) {
    const {infoUsuario, conn, tiposFichada} = props;
    // Estado inicial de la FichadaData
    const initialFormData: FichadaData = {
        idper: infoUsuario.idper,
        nombres: infoUsuario.nombres,
        apellido: infoUsuario.apellido,
        tipo_fichada: null,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        observaciones: '',
        punto: '',
        tipo_dispositivo: 'WEB',
        id_original: '',
    };
    
    // 1. Estado para los campos del formulario
    const [formData, setFormData] = useState<FichadaData>(initialFormData);
    
    // 2. Estado para la geolocalización y carga
    const [geolocationStatus, setGeolocationStatus] = useState<string>('GPS no capturado.');
    const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
    
    // Variable de control para deshabilitar el botón de envío
    //const isSubmitDisabled: boolean = !formData.idper || !formData.tipo_fichada;

    // 3. Función para obtener la geoposición
    const getGeolocation = useCallback(() => {
        if (!navigator.geolocation) {
            setGeolocationStatus("Geolocalización no soportada por este navegador.");
            setFormData(prevData => ({ ...prevData, punto: 'NO_SUPPORT' }));
            return;
        }

        setIsGpsLoading(true);
        setGeolocationStatus('Buscando ubicación...');
        
        const successCallback = (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            const gpsPoint = `${latitude},${longitude}`;
            
            setFormData(prevData => ({
                ...prevData,
                punto: gpsPoint
            }));
            setGeolocationStatus(`Ubicación capturada!`);
            setIsGpsLoading(false);
        };

        const errorCallback = (error: GeolocationPositionError) => {
            let message: string;
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = "Permiso de geolocalización denegado. Active el GPS y conceda permisos.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = "Información de ubicación no disponible. Intente de nuevo.";
                    break;
                case error.TIMEOUT:
                    message = "Tiempo de espera agotado para la ubicación.";
                    break;
                default:
                    message = `Error de geolocalización: ${error.message}`;
                    break;
            }
            setGeolocationStatus(message);
            setFormData(prevData => ({ ...prevData, punto: GPS_ERROR }));
            setIsGpsLoading(false);
        };

        navigator.geolocation.getCurrentPosition(
            successCallback,
            errorCallback,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);
    
    useEffect(() => {
        getGeolocation();
    }, [getGeolocation]);

    // 4. Manejo de cambios genérico
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        const name = e.target.name as keyof FichadaData;
        let value = e.target.value || null;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // 5. Manejo del envío del formulario (CORREGIDO con llamado a fetch)
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const payload: FichadaPayload = {
            fichadas: [formData], 
            machine_id: "CLIENT_MACHINE_INFO", 
            navigator: navigator.userAgent
        };
        
        try {
            const result = await conn.ajax.fichada_registrar({
                fichada: formData
            })
            
            alert(result)

            if (!result.ok || result.code >= 400) {
                const errorMessage = result.message || `Error ${result.code}: Fallo en el servidor o SP.`;
                alert(`Fallo en el registro. Estado: ${result.status} (Código: ${result.code}). Mensaje: ${errorMessage}`);
                if (logError) logError(new Error(errorMessage));
                return;
            }
            setFormData(initialFormData); 
            //getGeolocation(); 

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido al comunicarse con el servidor.";
            console.error('Error al enviar la fichada:', error);
            alert('Error de conexión al servidor: ' + errorMessage);
            if (logError) logError(error as Error);
        }
    };
    if(!infoUsuario.idper){
        return (
            <Alert 
                severity={"error"} 
                sx={{ mt: 1, mb: 1 }}
            >
                EL USUARIO NO TIENE IDPER: CONTACTESÉ CON PERSONAL
            </Alert>
        )
    }
    return (
        <Box
            sx={{
                maxWidth: '600px', // Limitar el ancho del formulario
                margin: '0 auto', // Centrar horizontalmente
                
                // Estilos de card
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 3,
                boxShadow: 3,
                borderRadius: 2,
                backgroundColor: 'white',
                minHeight: '80vh', // Para que se vea mejor incluso con scroll
            }}
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%'}}>
                <TextField
                    margin="dense"
                    required
                    fullWidth
                    id="idper"
                    label="ID Personal (idper)"
                    name="idper"
                    value={formData.idper}
                    contentEditable={false}
                    disabled={true}
                    size="small"
                />
                <TextField
                    margin="dense"
                    required
                    fullWidth
                    id="nombres"
                    label="nombres"
                    name="nombres"
                    value={formData.nombres}
                    contentEditable={false}
                    disabled={true}
                    size="small"
                />
                <TextField
                    margin="dense"
                    required
                    fullWidth
                    id="apellido"
                    label="apellido"
                    name="apellido"
                    value={formData.apellido}
                    contentEditable={false}
                    disabled={true}
                    size="small"
                />

                {/* Tipo de Fichada */}
                <FormControl fullWidth margin="dense" size="small" required>
                    <InputLabel id="tipo-fichada-label">Tipo de Fichada</InputLabel>
                    <Select
                        labelId="tipo-fichada-label"
                        id="tipo_fichada"
                        name="tipo_fichada"
                        value={formData.tipo_fichada}
                        label="Tipo de Fichada"
                        onChange={handleChange}
                        autoFocus={true}
                    >
                        {tiposFichada.map(tf=>
                            <MenuItem value={tf.tipo_fichada}>{tf.nombre}</MenuItem>
                        )}

                    </Select>
                </FormControl>
                
                {/* Observaciones */}
                <TextField
                    margin="dense"
                    fullWidth
                    id="observaciones"
                    label="Observaciones (Opcional)"
                    name="observaciones"
                    multiline
                    rows={2}
                    value={formData.observaciones}
                    onChange={handleChange}
                    size="small"
                />

                {/* Botón para Obtener el Punto GPS */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1 }}>
                    <Button
                        variant="contained"
                        onClick={getGeolocation}
                        disabled={isGpsLoading}
                        startIcon={isGpsLoading ? <CircularProgress size={15} color="inherit" /> : <ICON.LocaltionOn />}
                        size="small"
                    >
                        {isGpsLoading ? 'Buscando...' : 'Obtener Punto GPS'}
                    </Button>
                </Box>

                {/* Campo Punto GPS (Lectura) */}
                <TextField
                    margin="dense"
                    fullWidth
                    id="punto"
                    label="Coordenadas GPS (Latitud, Longitud)"
                    name="punto"
                    value={formData.punto}
                    InputProps={{
                        readOnly: true,
                        sx: { backgroundColor: '#f5f5f5' }
                    }}
                    required
                    color={formData.punto == GPS_ERROR?'warning':undefined}
                    focused
                    helperText={formData.punto == GPS_ERROR ? "El punto GPS no pudo ser capturado." : ""}
                    size="small"
                />
                
                {/* Estado GPS */}
                <Alert 
                    severity={formData.punto == GPS_ERROR ? "warning" : "success"} 
                    sx={{ mt: 1, mb: 1 }}
                >
                    {geolocationStatus}
                </Alert>

                {/* Botón de Registrar Fichada */}
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1, mb: 1 }}
                    //disabled={isSubmitDisabled}
                    startIcon={<ICON.Save />}
                >
                    Registrar Fichada
                </Button>
            </Box>
        </Box>
    );
};

// -------------------------------------------------------------------
// 3. PANTALLA PRINCIPAL (Solución de SCROLL y Layout)
// -------------------------------------------------------------------

function PantallaFichadas(props: { conn: Connector, fixedFields: FixedFields, infoUsuario: InfoUsuario, tiposFichada: Tipos_fichada[] }) {
    useEffect(() => {
        document.body.style.backgroundImage = `url('${myOwn.config.config["background-img"]}')`;
        if (props.infoUsuario.usuario) {
            renderRol( props.infoUsuario );
        }
    }, []);

    return (
        <Paper 
            className="paper-principal"
            // ESTILOS CLAVE PARA EL SCROLL: Ocupar 100% de la altura y usar flex
            sx={{
                display: 'flex',              // Habilita Flexbox
                flexDirection: 'column',      // Apila el AppBar y el contenido
                height: '100vh',              // Ocupa toda la altura del viewport
                maxHeight: '100vh',
                boxSizing: 'border-box'
            }}
        >
            <AppBar position="static" className="app-bar-bg" sx={{ backgroundImage: `url('${myOwn.config.config["background-img"]}')` }}>
                <Toolbar>
                    <IconButton color="inherit" onClick={()=>{
                        var root = document.getElementById('total-layout');
                        if (root != null ) ReactDOM.unmountComponentAtNode(root)
                        location.hash="";
                    }}><ICON.Menu/></IconButton>
                    <Typography flexGrow={2}>
                        SiPer - Registro de fichada
                    </Typography>
                </Toolbar>
            </AppBar>
            
            {/* Box que contiene el formulario. Ocupa el espacio restante y permite scroll. */}
            <Box 
                sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', // Permite el scroll vertical si el contenido es muy grande
                    padding: 2 
                }}
            >
                <FichadaForm infoUsuario={props.infoUsuario} conn={props.conn} tiposFichada={props.tiposFichada}/>
            </Box>
        </Paper>

    )

}

// -------------------------------------------------------------------
// 4. PUNTO DE ENTRADA
// -------------------------------------------------------------------

// @ts-ignore
myOwn.wScreens.fichar = async function principal(addrParams:any){
    try{
        const infoUsuario: InfoUsuario = await myOwn.ajax.info_usuario();
        const tiposFichadas:Tipos_fichada[]  = await myOwn.ajax.table_data({table:'tipos_fichada'});
        renderConnectedApp(
            myOwn as never as Connector,
            { ...addrParams },
            document.getElementById('total-layout')!,
            ({ conn, fixedFields }) => (<PantallaFichadas conn={conn} fixedFields={fixedFields} infoUsuario={infoUsuario} tiposFichada={tiposFichadas} />
            )
        );
    }catch(err){
        logError(err as Error);
    }
}