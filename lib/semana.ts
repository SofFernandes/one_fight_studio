// Retorna hoje e o intervalo dos próximos 7 dias (inclusive), em UTC,
// para evitar depender do timezone do servidor mudar o "hoje".
export function intervaloSemana() {
  const hoje = new Date();
  const hojeUTC = new Date(
    Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate())
  );
  const fimSemana = new Date(hojeUTC);
  fimSemana.setUTCDate(fimSemana.getUTCDate() + 6);

  return { hoje: hojeUTC, fimSemana };
}

function paraDiaDoAno(mes: number, dia: number, ano: number) {
  return Date.UTC(ano, mes - 1, dia);
}

// Verifica se o mês/dia de `dataNascimento` cai nos próximos `dias` (inclusive
// hoje), tratando a virada de ano (ex: hoje 28/dez, janela até 03/jan).
export function aniversarioNaSemana(
  dataNascimento: string,
  hoje: Date,
  dias = 7
): boolean {
  const nascimento = new Date(`${dataNascimento}T00:00:00Z`);
  const mesNasc = nascimento.getUTCMonth() + 1;
  const diaNasc = nascimento.getUTCDate();

  const anoHoje = hoje.getUTCFullYear();
  const candidatoEsteAno = paraDiaDoAno(mesNasc, diaNasc, anoHoje);
  const candidatoProximoAno = paraDiaDoAno(mesNasc, diaNasc, anoHoje + 1);

  const inicioMs = hoje.getTime();
  const fimMs = inicioMs + (dias - 1) * 24 * 60 * 60 * 1000;

  return (
    (candidatoEsteAno >= inicioMs && candidatoEsteAno <= fimMs) ||
    (candidatoProximoAno >= inicioMs && candidatoProximoAno <= fimMs)
  );
}

// Próxima ocorrência do aniversário (para exibir e ordenar), como Date UTC.
export function proximoAniversario(dataNascimento: string, hoje: Date): Date {
  const nascimento = new Date(`${dataNascimento}T00:00:00Z`);
  const mesNasc = nascimento.getUTCMonth() + 1;
  const diaNasc = nascimento.getUTCDate();
  const anoHoje = hoje.getUTCFullYear();

  const esteAno = paraDiaDoAno(mesNasc, diaNasc, anoHoje);
  if (esteAno >= hoje.getTime()) return new Date(esteAno);
  return new Date(paraDiaDoAno(mesNasc, diaNasc, anoHoje + 1));
}
