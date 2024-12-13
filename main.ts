

type Filters = {
  [key: string]: ($: any, p: string, v: any) => any
}

type httpParams = { [key: string]: any };



function whereBuilder(filters: Filters) {
  const filtersToCheck = Object.entries(filters);
  const getArrayParams = (filterParameter: httpParams): string[] => 
    filterParameter.trim().replaceAll(' ', '').split(',')

  const getPrefixAndColumn = (param: string) => param.split('.')

  return function (queryBuilder: any, params: httpParams) {
    for (const [filters, value] of filtersToCheck) {

    }
  }
}

(() => {
  const httpParams = {
    cod_servicio: 89,
    numero_oportunidad: [87821, 45201],
    serie_oportunidad: 12
  };

  const whereCotizacion = whereBuilder({
    's.cod_servicio, s.cod_oportunidad, c.cod_medio_transporte': ($, p, v) => $.where(p, v),
    's.serie_oportunidad': ($, _, v) => $.whereIn('op.serie', v),
    's.numero_oportunidad': ($, _, v) => $.whereRaw(`"op"."numero"::TEXT ILIKE '%${v}%'`)
  });


  whereCotizacion(null, httpParams);
})()
