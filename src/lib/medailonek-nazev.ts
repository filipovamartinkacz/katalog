// Název medailonku v katalogu — jméno a příjmení jsou vždy povinná a vždy
// se zobrazí; značka/firma se k nim jen připojí pomlčkou, pokud je vyplněná.
export function getMedailonekNazev(jmeno: string, prijmeni: string, displayName?: string | null): string {
  const jmenoPrijmeni = `${jmeno} ${prijmeni}`.trim()
  const znacka = displayName?.trim()
  return znacka ? `${jmenoPrijmeni} – ${znacka}` : jmenoPrijmeni
}
