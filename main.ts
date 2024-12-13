
type queryFunction = ($: any, p: string, v: any) => any

type Filters = {
  [key: string]: queryFunction
}

type httpParams = { [key: string]: any };

type MapedFilters = {
  // columnas sin prefijos que sirven como identificadores
  // para saber si el parametro existe en los filtros
  identifiers: (string | undefined)[],

  query: queryFunction

  // columnas con prefijos
  queryIdentifiers: (string)[]
}[]

function mapOfFilters(filters: Filters): MapedFilters {
  return Object.entries(filters).map(([f, query]) => ({
    identifiers: f.trim().replace(/\s+/g, '').split(',').map((q) => q.split('.')[1]),
    queryIdentifiers: f.trim().replaceAll(/\s+/g, '').split(','),
    query,
  }));
}

function whereBuilder(filters: Filters) {
  const filtersStructure = mapOfFilters(filters);
  return function (queryBuilder: any, params: httpParams) {
    const returnedFunctions = [];
    for (const [param, value] of Object.entries(params)) {
      for (const filter of filtersStructure) {
        if (!filter.identifiers.includes(param)) continue;
        const parameter = filter.queryIdentifiers[filter.identifiers.indexOf(param)];
        returnedFunctions.push(filter.query(null, parameter!, value))
      }
    }
    return returnedFunctions;
  }
}

(() => {
  const httpParams = {
    cod_servicio: 89,
    cod_oportunidad: 21,
    cod_medio_transporte: 321,
    numero_oportunidad: [87821, 45201],
    serie_oportunidad: 12
  };

  const filtrosA: Filters = {
    's.cod_servicio, s.cod_oportunidad, c.cod_medio_transporte': ($, p, v) => $.where(p, v),
    's.serie_oportunidad': ($, _, v) => $.whereIn('op.serie', v),
    's.numero_oportunidad': ($, _, v) => $.whereRaw(`"op"."numero"::TEXT ILIKE '%${v}%'`)
  }

  const filtrosB: Filters  = {
    [`
      s.cod_servicio,
      s.cod_oportunidad,
      c.cod_medio_transporte
    `]: (_, p, v) => `${p} = ${v}`,
    's.serie_oportunidad': (__, _, v) => `op.serie = ${v}`,
    's.numero_oportunidad': (__, _, v) => `"op"."numero"::TEXT ILIKE '%${v}%'`
  };

  const whereCotizacion = whereBuilder(filtrosB);
  const result = whereCotizacion(null, httpParams);
  console.log(result);
})()
