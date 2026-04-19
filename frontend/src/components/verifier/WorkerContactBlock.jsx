import { workerPrimaryLabel, workerSubtitle } from '@/features/verifier/workerDisplay'

/**
 * Name + email for staff; UUID only inside optional disclosure (support / cross-check).
 */
const WorkerContactBlock = ({
  item,
  className = '',
  /** Collapsed <details> with full UUID — default on for verifier workflows */
  showAccountId = true,
  summaryClassName = 'mt-1 cursor-pointer select-none text-[11px] text-brand-muted hover:text-brand-darkest',
}) => {
  const id = item?.worker_id
  const primary = workerPrimaryLabel(item)
  const sub = workerSubtitle(item)

  return (
    <div className={className}>
      <p className="font-medium leading-snug text-brand-darkest">{primary}</p>
      {sub ? <p className="mt-0.5 truncate text-xs text-brand-muted">{sub}</p> : null}
      {showAccountId && id ? (
        <details className="group">
          <summary className={summaryClassName}>Account ID (support only)</summary>
          <p className="mt-1 break-all font-mono text-[10px] leading-snug text-brand-muted">{id}</p>
        </details>
      ) : null}
    </div>
  )
}

export default WorkerContactBlock
