import type { CostResult } from '../domain/calc'
import type { CostSheet, Item } from '../domain/types'
import { INCOTERM_HINT } from '../domain/types'
import { money, MPF_BAND_LABEL } from './format'
import { Num } from './Fields'

export function Assumptions({
  item,
  sheet,
  result,
  onChange,
}: {
  item: Item
  sheet: CostSheet
  result: CostResult
  onChange: (sheet: CostSheet) => void
}) {
  function patch(partial: Partial<CostSheet>) {
    onChange({ ...sheet, ...partial })
  }

  const insuranceHint =
    sheet.insuranceMode === 'percent'
      ? `Equivale a ${money(result.insurance)} sobre la mercancía.`
      : `Monto fijo del embarque: ${money(result.insurance)}.`

  const dutyHint = `Base del arancel: ${money(result.dutyBase)}.`
  const mpfHint =
    result.mpfBand === 'min'
      ? `El 0.3464% da ${money(result.mpfRaw)} y se sube al mínimo.`
      : result.mpfBand === 'max'
        ? `El 0.3464% da ${money(result.mpfRaw)} y se topa en el máximo.`
        : result.mpfBand === 'advalorem'
          ? `0.3464% del valor de mercancía: ${money(result.mpf)}.`
          : 'Apagado para esta hoja.'

  return (
    <form className="assume" onSubmit={(event) => event.preventDefault()}>
      <h2>Supuestos del embarque</h2>
      <p className="assume-lead">{INCOTERM_HINT[item.incoterm]}</p>

      <fieldset>
        <legend>Mercancía</legend>
        <div className="fields">
          <Num
            label="Unidades pedidas"
            value={sheet.orderedUnits}
            step="1"
            onChange={(value) => patch({ orderedUnits: value })}
          />
          <Num
            label="Merma %"
            value={sheet.damagePct}
            step="0.1"
            max={100}
            onChange={(value) => patch({ damagePct: value })}
          />
          <Num
            wide
            label="FOB unitario USD"
            hint="Precio de origen. No es el costo aterrizado."
            value={sheet.fobUnit}
            step="0.0001"
            onChange={(value) => patch({ fobUnit: value })}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Flete y seguro</legend>
        <div className="fields">
          <Num
            wide
            label="Flete internacional USD"
            value={sheet.freightIntl}
            step="1"
            onChange={(value) => patch({ freightIntl: value })}
          />
          <div className="field wide">
            <span>Seguro</span>
            <div className="choices">
              <label>
                <input
                  type="radio"
                  name={`ins-${item.id}`}
                  checked={sheet.insuranceMode === 'percent'}
                  onChange={() => patch({ insuranceMode: 'percent' })}
                />
                Porcentaje
              </label>
              <label>
                <input
                  type="radio"
                  name={`ins-${item.id}`}
                  checked={sheet.insuranceMode === 'amount'}
                  onChange={() => patch({ insuranceMode: 'amount' })}
                />
                Monto USD
              </label>
            </div>
          </div>
          {sheet.insuranceMode === 'percent' ? (
            <Num
              wide
              label="Seguro % de la mercancía"
              hint={insuranceHint}
              value={sheet.insurancePct}
              step="0.01"
              max={100}
              onChange={(value) => patch({ insurancePct: value })}
            />
          ) : (
            <Num
              wide
              label="Seguro USD"
              hint={insuranceHint}
              value={sheet.insuranceAmount}
              step="1"
              onChange={(value) => patch({ insuranceAmount: value })}
            />
          )}
          <Num
            label="Inland a Miami"
            value={sheet.inlandMiami}
            step="1"
            onChange={(value) => patch({ inlandMiami: value })}
          />
          <Num
            label="Otros USD"
            value={sheet.other}
            step="1"
            onChange={(value) => patch({ other: value })}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Aduana</legend>
        <div className="fields">
          <Num
            label="Arancel base %"
            value={sheet.baseDutyPct}
            step="0.1"
            max={100}
            onChange={(value) => patch({ baseDutyPct: value })}
          />
          <Num
            label="Arancel adicional %"
            hint="Escenario, por ejemplo Sección 301."
            value={sheet.additionalDutyPct}
            step="0.1"
            max={200}
            onChange={(value) => patch({ additionalDutyPct: value })}
          />
          <div className="field wide">
            <span>Base del arancel</span>
            <div className="choices">
              <label>
                <input
                  type="radio"
                  name={`duty-${item.id}`}
                  checked={!sheet.dutyOnCif}
                  onChange={() => patch({ dutyOnCif: false })}
                />
                Valor mercancía
              </label>
              <label>
                <input
                  type="radio"
                  name={`duty-${item.id}`}
                  checked={sheet.dutyOnCif}
                  onChange={() => patch({ dutyOnCif: true })}
                />
                CIF equivalente
              </label>
            </div>
            <small>{dutyHint}</small>
          </div>
          <label className="check wide">
            <input
              type="checkbox"
              checked={sheet.applyMpf}
              onChange={(event) => patch({ applyMpf: event.target.checked })}
            />
            <span>MPF formal · {MPF_BAND_LABEL[result.mpfBand]} · {money(result.mpf)}</span>
          </label>
          <p className="field-note wide">{mpfHint}</p>
          <label className="check wide">
            <input
              type="checkbox"
              checked={sheet.ocean}
              onChange={(event) => patch({ ocean: event.target.checked })}
            />
            <span>Océano, aplica HMF · {money(result.hmf)}</span>
          </label>
          <Num
            wide
            label="Honorario de broker USD"
            value={sheet.brokerFee}
            step="1"
            onChange={(value) => patch({ brokerFee: value })}
          />
        </div>
      </fieldset>

      <label className="field wide">
        <span>Nota de la hoja</span>
        <textarea
          rows={4}
          maxLength={2000}
          value={sheet.note}
          onChange={(event) => patch({ note: event.target.value })}
        />
      </label>
    </form>
  )
}
