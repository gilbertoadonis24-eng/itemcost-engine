import type { CostResult, LineId } from '../domain/calc'
import { LINE_LABEL, MPF_BAND_LABEL, money, moneyAuto } from './format'

const HEAD: LineId[] = ['merchandise', 'freight', 'insurance']
const TAIL: LineId[] = ['baseDuty', 'additionalDuty', 'mpf', 'hmf', 'broker', 'inland', 'other']

function Rows({ result, ids }: { result: CostResult; ids: LineId[] }) {
  return (
    <>
      {ids.map((id) => {
        const line = result.lines.find((row) => row.id === id)
        if (!line) return null
        const width = result.total > 0 ? (line.amount / result.total) * 100 : 0
        const quiet = line.amount === 0
        return (
          <div className={quiet ? 'stack-row is-quiet' : 'stack-row'} key={id}>
            <span className="stack-label">
              {LINE_LABEL[id]}
              {id === 'mpf' && result.mpfBand !== 'off' ? (
                <em className="band">{MPF_BAND_LABEL[result.mpfBand]}</em>
              ) : null}
            </span>
            <span className="bar" aria-hidden="true">
              <span
                className={line.amount > 0 ? 'bar-fill has-value' : 'bar-fill'}
                style={{ width: `${width}%` }}
              />
            </span>
            <span className="amt">{money(line.amount)}</span>
            <span className="unit">{moneyAuto(line.perUnit)}</span>
          </div>
        )
      })}
    </>
  )
}

export function Stack({ result }: { result: CostResult }) {
  return (
    <div className="stack">
      <div className="stack-head">
        <span>Componente</span>
        <span />
        <span>Embarque</span>
        <span>Por unidad</span>
      </div>
      <Rows result={result} ids={HEAD} />
      <div className="subtotal">
        <span>CIF equivalente</span>
        <strong>{money(result.cif)}</strong>
      </div>
      <Rows result={result} ids={TAIL} />
      <div className="subtotal landed">
        <span>Costo aterrizado</span>
        <strong>{money(result.total)}</strong>
      </div>
    </div>
  )
}
