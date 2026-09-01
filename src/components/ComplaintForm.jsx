import React, { useState, useRef } from "react";
import { useI18n } from "../i18n";
import LocationPicker from "./LocationPicker";
import "./ComplaintForm.css";

const CATEGORIES = [
  { value: "roads", labelKey: "form.category.roads" },
  { value: "water", labelKey: "form.category.water" },
  { value: "electricity", labelKey: "form.category.electricity" },
  { value: "sanitation", labelKey: "form.category.sanitation" },
  { value: "streetlight", labelKey: "form.category.streetlight" },
  { value: "other", labelKey: "form.category.other" },
];

const STEPS = ["issue", "location", "photo", "review"];

/**
 * Props:
 *  onSubmit: async (formData: FormData) => Promise<{ complaintId: string }>
 *    Caller wires this to POST /complaints. Kept generic so this component
 *    has no fetch/axios opinion baked in.
 */
export default function ComplaintForm({ onSubmit }) {
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [contact, setContact] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { complaintId }
  const [submitError, setSubmitError] = useState(null);
  const fileInputRef = useRef(null);

  const step = STEPS[stepIndex];

  const validateStep = () => {
    const next = {};
    if (step === "issue") {
      if (!category) next.category = t("form.error.category");
      if (!description.trim() || description.trim().length < 5)
        next.description = t("form.error.description");
    }
    if (step === "location") {
      if (!location) next.location = t("form.error.location");
    }
    if (step === "review") {
      const digitsOnly = contact.replace(/\D/g, "");
      if (contact && digitsOnly.length < 10) next.contact = t("form.error.contact");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = new FormData();
      payload.append("category", category);
      payload.append("description", description);
      payload.append("latitude", location[0]);
      payload.append("longitude", location[1]);
      if (contact) payload.append("contact", contact);
      if (photo) payload.append("photo", photo);

      const res = await onSubmit(payload);
      setResult(res);
    } catch (err) {
      setSubmitError(err?.message || t("form.error.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStepIndex(0);
    setCategory("");
    setDescription("");
    setLocation(null);
    removePhoto();
    setContact("");
    setErrors({});
    setResult(null);
    setSubmitError(null);
  };

  if (result) {
    return (
      <div className="complaint-form complaint-form--success">
        <h2>{t("success.title")}</h2>
        <p className="complaint-form__success-body">{t("success.body")}</p>
        <div className="complaint-form__id-row">
          <code className="complaint-form__id">{result.complaintId}</code>
          <CopyButton value={result.complaintId} />
        </div>
        <div className="complaint-form__success-actions">
          <a className="complaint-form__link-btn" href={`/track?id=${result.complaintId}`}>
            {t("success.track")}
          </a>
          <button type="button" className="complaint-form__ghost-btn" onClick={resetForm}>
            {t("success.another")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="complaint-form">
      <Stepper stepIndex={stepIndex} />

      {step === "issue" && (
        <fieldset className="complaint-form__fieldset">
          <h2>{t("form.step1.title")}</h2>

          <label className="complaint-form__field">
            <span>{t("form.category")}</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-invalid={!!errors.category}
            >
              <option value="" disabled>
                {t("form.category.placeholder")}
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </option>
              ))}
            </select>
            {errors.category && <ErrorText text={errors.category} />}
          </label>

          <label className="complaint-form__field">
            <span>{t("form.description")}</span>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("form.description.placeholder")}
              aria-invalid={!!errors.description}
            />
            <span className="complaint-form__hint">{t("form.description.hint")}</span>
            {errors.description && <ErrorText text={errors.description} />}
          </label>
        </fieldset>
      )}

      {step === "location" && (
        <fieldset className="complaint-form__fieldset">
          <h2>{t("form.step2.title")}</h2>
          <LocationPicker value={location} onChange={setLocation} />
          {errors.location && <ErrorText text={errors.location} />}
        </fieldset>
      )}

      {step === "photo" && (
        <fieldset className="complaint-form__fieldset">
          <h2>{t("form.step3.title")}</h2>

          {photoPreview ? (
            <div className="complaint-form__photo-preview">
              <img src={photoPreview} alt="" />
              <div className="complaint-form__photo-actions">
                <button type="button" onClick={() => fileInputRef.current?.click()}>
                  {t("form.photo.replace")}
                </button>
                <button type="button" onClick={removePhoto} className="complaint-form__ghost-btn">
                  {t("form.photo.remove")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="complaint-form__photo-add-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              {t("form.photo.add")}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={handlePhotoChange}
          />
          <p className="complaint-form__hint">{t("form.photo.hint")}</p>
        </fieldset>
      )}

      {step === "review" && (
        <fieldset className="complaint-form__fieldset">
          <h2>{t("form.step4.title")}</h2>

          <dl className="complaint-form__review-list">
            <ReviewRow label={t("form.review.category")}>
              {t(CATEGORIES.find((c) => c.value === category)?.labelKey || "")}
            </ReviewRow>
            <ReviewRow label={t("form.review.description")}>{description}</ReviewRow>
            <ReviewRow label={t("form.review.location")}>
              {location ? `${location[0].toFixed(5)}, ${location[1].toFixed(5)}` : "—"}
            </ReviewRow>
            <ReviewRow label={t("form.review.photo")}>
              {photo ? t("form.review.photo.attached") : t("form.review.photo.none")}
            </ReviewRow>
          </dl>

          <label className="complaint-form__field">
            <span>{t("form.contact")}</span>
            <input
              type="tel"
              inputMode="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("form.contact.placeholder")}
              aria-invalid={!!errors.contact}
            />
            <span className="complaint-form__hint">{t("form.contact.hint")}</span>
            {errors.contact && <ErrorText text={errors.contact} />}
          </label>

          {submitError && <ErrorText text={submitError} />}
        </fieldset>
      )}

      <div className="complaint-form__nav">
        {stepIndex > 0 && (
          <button type="button" className="complaint-form__ghost-btn" onClick={goBack}>
            {t("form.back")}
          </button>
        )}
        <div className="complaint-form__nav-spacer" />
        {step !== "review" ? (
          <button type="button" className="complaint-form__primary-btn" onClick={goNext}>
            {t("form.next")}
          </button>
        ) : (
          <button
            type="button"
            className="complaint-form__primary-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? t("form.submitting") : t("form.submit")}
          </button>
        )}
      </div>
    </div>
  );
}

function Stepper({ stepIndex }) {
  return (
    <ol className="complaint-form__stepper" aria-hidden="true">
      {STEPS.map((s, i) => (
        <li
          key={s}
          className={
            "complaint-form__step" +
            (i === stepIndex ? " is-active" : "") +
            (i < stepIndex ? " is-done" : "")
          }
        >
          <span className="complaint-form__step-number">{i + 1}</span>
        </li>
      ))}
    </ol>
  );
}

function ReviewRow({ label, children }) {
  return (
    <div className="complaint-form__review-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ErrorText({ text }) {
  return (
    <span className="complaint-form__error" role="alert">
      {text}
    </span>
  );
}

function CopyButton({ value }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="complaint-form__ghost-btn"
      onClick={async () => {
        await navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? t("success.copied") : t("success.copy")}
    </button>
  );
}
