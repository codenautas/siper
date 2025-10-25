import { DefinedType, Description, is } from 'guarantee-type'

type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

type CommonEntityDefinition = {
    table: string
    description: Description
}

export const cod_nov = {
    table: 'cod_novedades',
    description: is.object({
        cod_nov: is.string,
        novedad: is.string,
        con_detalles: is.nullable.boolean,
        total: is.nullable.boolean,
        parcial: is.nullable.boolean,
        comun: is.nullable.boolean,
    })
}
export type CodNovedades = DefinedType<typeof cod_nov.description>

export const fecha = {
    table: 'fechas',
    description: is.object({
        fecha: is.Date,
        laborable: is.nullable.boolean,
        repite: is.nullable.boolean,
        inamovible: is.nullable.boolean,
        leyenda: is.string
    })
}

export const grupos = {
    table: 'grupos',
    description: is.object({
        clase: is.string,
        grupo: is.string
    })
} satisfies CommonEntityDefinition

export type Grupo = DefinedType<typeof grupos.description>

export const nov_gru = {
    table: 'nov_gru',
    description: is.object({
        annio: is.number,
        clase: is.string,
        grupo: is.string,
        cod_nov: is.string,
        maximo: is.number,
    })
} satisfies CommonEntityDefinition

export type NovGru = DefinedType<typeof nov_gru.description>

export const nov_per = {
    table: 'nov_per',
    description: is.object({
        año: is.number,
        cod_nov: is.string,
        idper: is.string,
        cantidad: is.number,
        limite: is.number,
        saldo: is.number,
    })
} satisfies CommonEntityDefinition

export type NovPer = DefinedType<typeof nov_per.description>

export const per_nov_cant = {
    table: 'per_nov_cant',
    description: is.object({
        annio: is.number,
        cod_nov: is.string,
        idper: is.string,
        origen: is.string,
        cantidad: is.number,
    })
} satisfies CommonEntityDefinition

export type PerNovCant = DefinedType<typeof per_nov_cant.description>

export const novedades_registradas = {
    table: 'novedades_registradas',
    description: is.object({
        idper: is.string,
        desde: is.Date,
        hasta: is.Date,
        cod_nov: is.nullable.string,
        cancela: is.nullable.boolean,
        dds0: is.nullable.boolean,
        dds1: is.nullable.boolean,
        dds2: is.nullable.boolean,
        dds3: is.nullable.boolean,
        dds4: is.nullable.boolean,
        dds5: is.nullable.boolean,
        dds6: is.nullable.boolean,
        detalles: is.nullable.string,
        fecha: is.nullable.Date,
        usuario: is.nullable.string
    })
} satisfies CommonEntityDefinition

export type NovedadRegistrada = DefinedType<typeof novedades_registradas.description>

export const novedades_horarias = {
    table: 'novedades_horarias',
    description: is.object({
        idper: is.string,
        fecha: is.Date,
        desde_hora: is.nullable.string,
        hasta_hora: is.nullable.string,
        cod_nov: is.string,
        detalles: is.nullable.string,
    })
} satisfies CommonEntityDefinition

export type NovedadHoraria = DefinedType<typeof novedades_horarias.description>

export const horarios = {
    table: 'horarios',
    description: is.object({
        idper: is.string,
        dds: is.number,
        desde: is.Date,
        hora_desde: is.string,
        hora_hasta: is.string,
        trabaja: is.boolean,
        hasta: is.Date,
    })
} satisfies CommonEntityDefinition

export type Horarios = DefinedType<typeof horarios.description>

export const horarios_per = {
    table: 'horarios_per',
    description: is.object({
        idper     : is.string,
        horario   : is.string,
        annio     : is.number,
        desde     : is.Date,
        hasta     : is.nullable.Date,
    })
} satisfies CommonEntityDefinition

export const personas = {
    table: 'personas',
    description: is.object({
        idper:     is.string,
        ficha:     is.nullable.string,
        cuil:      is.string,
        idmeta4:   is.nullable.string,
        apellido:  is.string,
        nombres:   is.string,
        sector:    is.nullable.string,
        registra_novedades_desde: is.nullable.Date,
        para_antiguedad_relativa: is.nullable.Date,
        activo:    is.nullable.boolean,
        fecha_ingreso: is.nullable.Date,
        fecha_egreso : is.nullable.Date,
        es_jefe      : is.nullable.boolean,
        horario      : is.nullable.string
    })
} satisfies CommonEntityDefinition

export type Persona = DefinedType<typeof personas.description>

export const per_gru = {
    table: 'per_gru',
    description: is.object({
        clase: is.string,
        grupo: is.string,
        idper: is.string
    })
} satisfies CommonEntityDefinition

export type PerGru = DefinedType<typeof per_gru.description>

export const sectores = {
    table: 'sectores',
    description: is.object({
        sector: is.string,
        nombre_sector: is.string,
        tipo_sec: is.nullable.string,
        pertenece_a: is.nullable.string,
        nivel: is.number,
        activo: is.boolean
    })
}

export type Sectores = DefinedType<typeof sectores.description>

export const usuarios = {
    table: 'usuarios',
    description: is.object({
        usuario: is.string,
        rol: is.string,
        idper: is.string
    })
}

export type Usuario = DefinedType<typeof usuarios.description>

export const roles = {
    table: 'roles',
    description: is.object({
        rol: is.string,
    })
}

export type Rol = DefinedType<typeof roles.description>

export const capacitaciones = {
    table: 'capacitaciones',
    description: is.object({
        editable: is.boolean,
        capacitacion: is.nullable.string,
        modalidad: is.nullable.string,
        tipo: is.nullable.string,
        puntos: is.nullable.number,
        duracion: is.nullable.string,
        dictado_por: is.nullable.string,
        fecha_inicio: is.nullable.Date,
        fecha_fin: is.nullable.Date
    })
}

export const per_capa = {
    table: 'per_capa',
    description: is.object({
        idper:      is.string,
        //año: is.number,
        editable: is.boolean,
        capacitacion: is.nullable.string,
        modalidad: is.nullable.string,
        tipo: is.nullable.string,
        fecha_inicio: is.nullable.Date,
        fecha_fin: is.nullable.Date,
        inscripcion: is.nullable.string,
        calificacion: is.nullable.string,
    })
}

export const trayectoria_laboral = {
    table: 'trayectoria_laboral',
    description: is.object({
        idper: is.string,
        desde: is.Date,
        idt: is.number,
        hasta: is.nullable.Date,
        computa_antiguedad: is.nullable.boolean,
        propio: is.nullable.boolean,
        organismo: is.nullable.string,
        observaciones: is.nullable.string,
        situacion_revista: is.nullable.string,
        expediente: is.nullable.string,
        funcion: is.nullable.string,
        jerarquia: is.nullable.string,
        nivel_grado: is.nullable.string,
        tarea: is.nullable.string,
        agrupamiento: is.nullable.string,
        motivo_egreso: is.nullable.string,
        tramo: is.nullable.string,
        grado: is.nullable.string,
        categoria: is.nullable.string,
        fecha_nombramiento: is.nullable.Date,
        resolucion: is.nullable.string,
    })
} satisfies CommonEntityDefinition

export type Trayectoria_laboral = DefinedType<typeof trayectoria_laboral.description>

////////////// PROCEDIMEINTOS

export const si_cargara_novedad = {
    procedure: 'si_cargara_novedad',
    parameters: is.object({
        idper: is.nullable.string,
        cod_nov: is.nullable.string,
        desde: is.Date,
        hasta: is.Date,
        cancela: is.nullable.boolean
    }),
    result: is.object({
        mensaje: is.string,
        dias_corridos: is.number,
        dias_habiles: is.number,
        dias_coincidentes: is.number,
        con_detalles: is.nullable.boolean,
        c_dds: is.nullable.boolean,
        saldo: is.nullable.number,
    })
}

export const novedades_disponibles = {
    procedure: 'novedades_disponibles',
    parameters: is.object({
        idper: is.string,
        annio: is.number,
    }),
    result: is.array.object({
        cod_nov: is.string,
        novedad: is.nullable.string,
        con_detalles: is.nullable.boolean,
        cantidad: is.nullable.number,
        usados: is.nullable.number,
        pendientes: is.nullable.number,
        saldo: is.nullable.number,
        con_info_nov: is.nullable.boolean,
        con_disponibilidad: is.nullable.boolean,
        c_dds: is.nullable.boolean,
        prioritario: is.nullable.boolean,
        puede_cargar: is.nullable.boolean,
    })
}

export type NovedadesDisponiblesResult = ArrayElement<DefinedType<typeof novedades_disponibles.result>>

export const personas_novedad_actual = {
    procedure: 'personas_novedad_actual',
    result: is.object({
        cod_nov: is.string,
        novedad: is.nullable.string,
        idper: is.string,
        cuil: is.string,
        ficha: is.nullable.string,
        idmeta4: is.nullable.string,
        apellido: is.string,
        nombres: is.string,
        sector: is.string,
        nombre_sector: is.string,
        cargable: is.boolean,
        es_jefe: is.nullable.boolean,
    })
}

export type PersonasNovedadActualResult = DefinedType<typeof personas_novedad_actual.result>

export const calendario_persona = {
    procedure: 'calendario_persona',
    parameters: is.object({
        idper: is.string,
        annio: is.number,
        mes: is.number
    }),
    result: is.object({
        fecha: is.Date,
        dia: is.number,
        dds: is.number,
        semana: is.number,
        cod_nov: is.string,
        tipo_dia: is.string,
        novedad: is.string,
        mismo_mes: is.boolean,
    })
}

export type CalendarioResult = DefinedType<typeof calendario_persona.result>

export const horario_semana_vigente = {
    procedure: 'horario_semana_vigente',
    parameters: is.object({
        idper: is.string,
        fecha: is.string,
    }),
    result: is.object({
        dds: is.number,
        trabaja: is.boolean,
        desde: is.Date,
        hasta: is.Date,
        hora_desde: is.nullable.string,
        hora_hasta: is.nullable.string,
        cod_nov: is.nullable.string,
    }),
};

export const historico_persona = {
    procedure: 'historico_persona',
    parameters: is.object({
        idper: is.string,
        annio: is.number,
        mes: is.number
    }),
    result: is.object({
        fecha: is.Date,
        cod_nov: is.string,
        novedad: is.string,
    })
}

export type HistoricoResult = DefinedType<typeof historico_persona.result>

export const info_usuario = {
    procedure: 'info_usuario',
    result: is.object({
        fecha_actual: is.Date,
        sector: is.string, 
        sector_nivel: is.number,
        idper: is.string, 
        apellido: is.string, 
        nombres: is.string, 
        cuil: is.nullable.string, 
        ficha: is.nullable.string, 
        idmeta4: is.nullable.string, 
        cargable: is.nullable.boolean,
        usuario: is.string,
        rol: is.string,
        puede_cargar_todo: is.nullable.boolean,
        puede_cargar_propio: is.nullable.boolean,
        puede_cargar_dependientes: is.nullable.boolean,
        puede_corregir_el_pasado: is.nullable.boolean,
    })
}

export type InfoUsuario = DefinedType<typeof info_usuario.result>

export const parametros = {
    procedure : 'parametros',
    result: is.object({
        fecha_actual: is.Date
    })
}

export type ParametrosResult = DefinedType<typeof parametros.result>

export const registrar_novedad = {
    procedure: 'registrar_novedad',
    parameters: novedades_registradas.description,
    result: novedades_registradas.description
}

export const annio = {
    table: 'annio',
    description: is.object({
        annio: is.number,
        cerrado: is.boolean
    })
} satisfies CommonEntityDefinition

export type Annio = DefinedType<typeof annio.description>

export const tipos_doc = {
    table: 'tipos_doc',
    description: is.object({
        tipo_doc: is.string,
        documento: is.string
    })
} satisfies CommonEntityDefinition

export type Tipos_doc = DefinedType<typeof tipos_doc.description>
export const adjuntos = {
    table: 'adjuntos',
    description: is.object({
        idper: is.string,
        numero_adjunto: is.nullable.number,
        tipo_adjunto: is.string,
        timestamp: is.Date,
        subir: is.nullable.string,
        archivo_nombre: is.nullable.string,
        archivo_nombre_fisico: is.nullable.string,
        bajar: is.nullable.string,
    }),
} satisfies CommonEntityDefinition;

export type Adjuntos = DefinedType<typeof adjuntos.description>;

export const tipos_adjunto = {
    table: 'tipos_adjunto',
    description: is.object({
        tipo_adjunto: is.string,
        descripcion: is.string
    })
} satisfies CommonEntityDefinition

export type Tipos_adjunto = DefinedType<typeof tipos_adjunto.description>

export const tipos_adjunto_atributos = {
    table: 'tipos_adjunto_atributos',
    description: is.object({
        tipo_adjunto: is.string,
        atributo: is.string,
        orden: is.number,
        columna: is.number
    })
} satisfies CommonEntityDefinition

export type tipos_adjunto_atributos = DefinedType<typeof tipos_adjunto_atributos.description>

export const archivos_borrar = {
    table: 'archivos_borrar',
    description: is.object({
        ruta_archivo: is.string,
    })
} satisfies CommonEntityDefinition

export type Archivos_borrar = DefinedType<typeof archivos_borrar.description>

export const adjuntos_atributos = {
    table: 'adjuntos_atributos',
    description: is.object({
        idper: is.string,
        tipo_adjunto: is.string,
        atributo: is.string,
    })
} satisfies CommonEntityDefinition

export type Adjuntos_atributos = DefinedType<typeof adjuntos_atributos.description>

export const paises = {
    table : 'paises',
    description: is.object({
        pais: is.string,
        cod_2024: is.string,
        nombre_pais: is.string,
        gentilicio: is.string,
        orden: is.number
    })
}

export type Paises = DefinedType<typeof paises.description>

export const sexos = {
    table : 'sexos',
    description: is.object({
        sexo: is.string,
        descripcion: is.string
    })
}

export type sexos = DefinedType<typeof sexos.description>

export const estados_civiles = {
    table : 'estado_civil',
    description : is.object({
        estado_civil: is.string,
        cod_2024: is.number,
        descripcion: is.string
    })
}

export type estados_civiles = DefinedType<typeof estados_civiles.description>

export const agrupamientos = {
    table : 'agrupamientos',
    description : is.object({
        agrupamiento: is.string,
        descripcion: is.string
    })
}

export type agrupamientos = DefinedType<typeof agrupamientos.description>

export const tramos = {
    table : 'tramos',
    description : is.object({
        tramo: is.string,
        descripcion: is.string
    })
}

export type tramos = DefinedType<typeof tramos.description>

export const grados = {
    table : 'grados',
    description : is.object({
        tramo: is.string,
        grado: is.string,
        descripcion: is.string
    })
}

export type grados = DefinedType<typeof grados.description>

export const categorias = {
    table : 'categorias',
    description : is.object({
        categoria: is.string,
        descripcion: is.string
    })
}

export type categorias = DefinedType<typeof categorias.description>

export const situacion_revista = {
    table : 'situacion_revista',
    description : is.object({
        situacion_revista: is.string,
        cod_2024: is.number,
        con_novedad: is.boolean
    })
}

export type situacion_revista = DefinedType<typeof situacion_revista.description>

export const expedientes = {
    table : 'expedientes',
    description : is.object({
        expediente: is.string,
        cod_2024: is.number
    })
}

export type expedientes = DefinedType<typeof expedientes.description>

export const funciones = {
    table : 'funciones',
    description : is.object({
        funcion: is.string,
        descripcion: is.string,
        cod_2024: is.number
    })
}

export type funciones = DefinedType<typeof funciones.description>

export const nivel_grado = {
    table : 'nivel_grado',
    description : is.object({
        nivel_grado: is.string,
        cod_2024: is.number
    })
}

export type nivel_grado = DefinedType<typeof nivel_grado.description>

export const tareas = {
    table : 'tareas',
    description : is.object({
        tarea: is.string,
        horas_semanales: is.number,
        horas_dia: is.number,
        minimo_horas_por_dia: is.number,
        maximo_horas_por_dia: is.number,
        nocturno: is.boolean,
        fin_semana: is.boolean,
        guardia: is.boolean,
        hora_entrada_desde: is.string,
        hora_salida_hasta: is.string,
        horario_flexible: is.boolean,
        cod_2024: is.number
    })
}

export type tareas = DefinedType<typeof tareas.description>

export const motivos_egreso = {
    table : 'motivos_egreso',
    description : is.object({
        cod_2024 : is.number,
        motivo_egreso : is.string,
        descripcion : is.string
    })
}

export type motivos_egreso = DefinedType<typeof motivos_egreso.description>

export const jerarquias = {
    table : 'jerarquias',
    description : is.object({
        cod_2024 : is.string,
        jerarquia : is.string,
        descripcion : is.string
    })
}

export type jerarquias = DefinedType<typeof jerarquias.description>

export const provincias = {
    table : 'provincias',
    description: is.object({
        provincia: is.string,
        nombre_provincia: is.string,
        cod_2024: is.string,
    })
}

export type Provincias = DefinedType<typeof provincias.description>

export const barrios = {
    table : 'barrios',
    description: is.object({
        provincia: is.string,
        barrio: is.string,
        nombre_barrio: is.string,
        cod_2024: is.string,
    })
}

export type Barrios = DefinedType<typeof barrios.description>

export const localidades = {
    table : 'localidades',
    description: is.object({
        provincia: is.string,
        localidad: is.string,
        nombre_localidad: is.string,
        cod_2024: is.string,
    })
}

export type Localidades = DefinedType<typeof localidades.description>

export const calles = {
    table : 'calles',
    description: is.object({
        provincia: is.string,
        calle: is.string,
        nombre_calle: is.string,
        cod_2024: is.string,
    })
}

export type Calles = DefinedType<typeof calles.description>

export const tipos_domicilio = {
    table: 'tipos_domicilio',
    description: is.object({
        tipo_domicilio: is.string,
        descripcion: is.string,
        orden: is.number
    })
} satisfies CommonEntityDefinition

export type Tipos_domicilio = DefinedType<typeof tipos_domicilio.description>

export const tipos_telefono = {
    table: 'tipos_telefono',
    description: is.object({
        tipo_telefono: is.string,
        descripcion: is.string,
        orden: is.number
    })
} satisfies CommonEntityDefinition

export type Tipos_telefono = DefinedType<typeof tipos_telefono.description>

export const per_domicilios = {
    table: 'per_domicilios',
    description: is.object({
        idper:           is.string,
        nro_item:        is.bigint,
        tipo_domicilio:  is.string,
        provincia:       is.string,
        localidad:       is.string,
        barrio:          is.string,
        codigo_postal:   is.string,
        calle:           is.string,
        nombre_calle:    is.string,
        altura:          is.string,
        piso:            is.string,
        depto:           is.string,
        escalera:        is.string,
        torre:           is.string,
        nudo:            is.string,
        ala:             is.string,
        confirmado:      is.boolean,
        fecha_confirmado:is.Date,
        observaciones:   is.string,
    })
}
export const perfiles_sgc = {
    table : 'perfiles_sgc',
    description : is.object({
        perfil_sgc: is.number,
        nombre: is.string,
        objetivo: is.string
    })
}

export type perfiles_sgc = DefinedType<typeof perfiles_sgc.description>

export const niveles_educativos = {
    table : 'niveles_educativos',
    description : is.object({
        nivel_educativo: is.number,
        nombre: is.string
    })
}

export type niveles_educativos = DefinedType<typeof niveles_educativos.description>

export const per_telefonos = {
    table: 'per_telefonos',
    description: is.object({
        idper:           is.string,
        nro_item:        is.bigint,
        tipo_telefono:   is.string,
        telefono:        is.string,
        observaciones:   is.string,
    })
}

export const bandas_horarias = {
    table: 'bandas_horarias',
    description: is.object({
        banda_horaria: is.string,
        descripcion: is.string,
        hora_desde: is.string,
        hora_hasta: is.string,
    })
} satisfies CommonEntityDefinition

export type bandas_horarias = DefinedType<typeof bandas_horarias.description>

export const meses = [
    {  value:1, name:'enero' },
    {  value:2, name:'febrero' },
    {  value:3, name:'marzo' },
    {  value:4, name:'abril' },
    {  value:5, name:'mayo' },
    {  value:6, name:'junio' },
    {  value:7, name:'julio' },
    {  value:8, name:'agosto' },
    {  value:9, name:'septiembre' },
    {  value:10, name:'octubre' },
    {  value:11, name:'noviembre' },
    {  value:12, name:'diciembre' }]

export const info_nov_numeros = [
    { name: 'cantidad'  , abr: 'cant'  , minAbr: 'c', title: 'cantidad inicial'},
    { name: 'usados'    , abr: 'usad'  , minAbr: 'u', title: 'usados'          },
    { name: 'pendientes', abr: 'pend'  , minAbr: 'p', title: 'pendientes'      },
    { name: 'saldo'     , abr: 'saldo' , minAbr: 's', title: 'saldo'           },
] satisfies {name:'cantidad'|'usados'|'pendientes'|'saldo', abr:string, minAbr:string, title:string}[]

//////////// ERRORES POSTGRES PROPIOS:
export const ERROR_REFERENCIA_CIRCULAR_EN_SECTORES = 'P1001';
export const ERROR_NO_SE_PUEDE_CARGAR_EN_EL_PASADO = 'P1002';
export const ERROR_COD_NOVEDAD_INDICA_CON_DETALLES = 'P1003';
export const ERROR_COD_NOVEDAD_INDICA_SIN_DETALLES = 'P1004';
export const ERROR_COD_NOVEDAD_NO_INDICA_TOTAL     = 'P1005';
export const ERROR_COD_NOVEDAD_NO_INDICA_PARCIAL   = 'P1006';
export const ERROR_COD_NOVEDAD_NO_INDICA_CON_HORARIO= 'P1007';
export const ERROR_COD_NOVEDAD_NO_INDICA_CON_NOVEDAD= 'P1008';
export const ERROR_SECTORES_DESNIVELADOS            = 'P1009';
export const ERROR_SECTOR_HUERFANO_NO_TOPE          = 'P1010';

//////////// ERRORES PROPIOS DEL BACKEND:
export const ERROR_EXCEDIDA_CANTIDAD_DE_NOVEDADES   = 'B9001';

//////////// ERRORES POSTGRES: https://www.postgresql.org/docs/current/errcodes-appendix.html
export const insufficient_privilege = '42501';
export const exclusion_violation = '23P01';
export const unique_violation = '23505';
export const check_violation = '23514';
