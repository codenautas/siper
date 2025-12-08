type DetalleMultiorigenEsquema = {
    cantidad: number
    usados: number
    pendientes: number
    saldo: number
}

type DetalleMultiorigen = {
    esquema: string
    usados: number
    pendientes: number
    inconsistencia: DetalleMultiorigenEsquema
    detalle_multiorigen: any
}

export function obtenerDetalleMultiorigen(row:DetalleMultiorigen){
    return [...row.detalle_multiorigen.detalle, ...(row.detalle_multiorigen.detalle.error ?? [])] as unknown as string
}