import React, { useState } from "react";
import { useI18n } from "../i18n";
import "./StatusTracker.css";

const PRIORITY_CLASS = {
  low: "priority-low",
  medium: "priority-medium",
  high: "priority-high",
  critical: "priority-critical",
};

/**
 * Props:
 *  initialId: string | undefined — prefill from a query param (?id=...)
 *  onLookup: async (id: string) => Promise<ComplaintRecord>
 *    ComplaintRecord shape:
 *    {
 *      id, category, description, status, priority,
 *      filedOn: ISOString, department,
 *      duplicateOf?: string,
 *      timeline: [{ status, label, timestamp: ISOString, note? }]
 *    }
 *    onLookup should throw an error with a `notFound: true` property
 *    when no record matches, so this component can show the right message.
 */
export default function StatusTracker({ initialId = "", onLookup }) {
  const { t } = useI18n();
  const [id, setId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setRecord(null);
    try {
      const data = await onLookup(id.trim());
      setRecord(data);
    } catch (err) {
      setError(err?.notFound ? "notFound" : "generic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-tracker">
      <h2>{t("track.title")}</h2>

      <form className="status-tracker__search" onSubmit={handleSearch}>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder={t("track.placeholder")}
          aria-label={t("track.title")}
        />
        <button type="submit" disabled={loading}>
          {loading ? t("track.searching") : t("track.button")}
        </button>
      </form>

      {error === "notFound" && <p className="status-tracker__message">{t("track.notFound")}</p>}
      {error === "generic" && <p className="status-tracker__message">{t("track.error")}</p>}

      {record && <ComplaintDetail record={record} />}
    </div>
  );
}

function ComplaintDetail({ record }) {
  const { t } = useI18n();
  const priorityClass = PRIORITY_CLASS[record.priority] || "priority-low";

  return (
    <article className={`status-card ${priorityClass}`}>
      <header className="status-card__header">
        <span className="status-card__id">{record.id}</span>
        <span className={`status-pill status-pill--${record.status}`}>
          {t(`status.${record.status}`)}
        </span>
      </header>

      <p className="status-card__description">{record.description}</p>

      <dl className="status-card__meta">
        <div>
          <dt>{t("detail.department")}</dt>
          <dd>{record.department}</dd>
        </div>
        <div>
          <dt>{t("detail.filedOn")}</dt>
          <dd>{new Date(record.filedOn).toLocaleDateString()}</dd>
        </div>
        <div>
          <dt>{t(`priority.${record.priority}`)}</dt>
          <dd />
        </div>
      </dl>

      {record.duplicateOf && (
        <p className="status-card__duplicate">
          {t("detail.duplicateOf")}: <code>{record.duplicateOf}</code>
        </p>
      )}

      <h3 className="status-card__timeline-title">{t("detail.timeline")}</h3>
      <ol className="status-card__timeline">
        {record.timeline.map((event, i) => (
          <li key={i} className="status-card__timeline-item">
            <span className="status-card__timeline-dot" />
            <div>
              <p className="status-card__timeline-label">{event.label}</p>
              <p className="status-card__timeline-time">
                {new Date(event.timestamp).toLocaleString()}
              </p>
              {event.note && <p className="status-card__timeline-note">{event.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
