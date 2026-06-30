// src/components/Form/Form.tsx
import React from "react";
import styles from "./Form.module.css";
import Buttons from "../Buttons";

import { useTranslation } from "react-i18next";
import { UI_ICONS } from "../../lib/icons";

export type Field =
  | {
      type: "text" | "email" | "tel" | "number";
      name: string;
      label: string;
      description?: string;
      required?: boolean;
      placeholder?: string;
      max?: number;
    }
  | {
      type: "textarea";
      name: string;
      label: string;
      description?: string;
      required?: boolean;
      placeholder?: string;
    }
  | {
      type: "select";
      name: string;
      label: string;
      description?: string;
      required?: boolean;
      options: { label: string; value: string }[];
    }
  | {
      type: "date" | "info";
      name: string;
      label: string;
      value: string;
    }
  | {
      type: "checkbox";
      name: string;
      label: string;
      description?: string;
      required?: boolean;
    }
  | {
      type: "file";
      name: string;
      label: string;
      description?: string;
      required?: boolean;
      multiple?: boolean;
    }
  | {
      type: "hidden";
      name: string;
      value: string;
    };

export type FormProps = {
  fields: Field[];
  onSubmit: (values: Record<string, string | FileList | boolean>) => void;
  submitLabel: string;
};

export default function Form({ fields, onSubmit, submitLabel }: FormProps) {
  const { t } = useTranslation("common");
  const [values, setValues] = React.useState<
    Record<string, string | FileList | boolean>
  >(() =>
    Object.fromEntries(
      fields
        .filter((field) => field.type === "hidden")
        .map((field) => [field.name, field.value])
    )
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [fileNames, setFileNames] = React.useState<Record<string, string[]>>(
    {}
  );

  React.useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      for (const field of fields) {
        if (field.type === "hidden") {
          next[field.name] = field.value;
        }
      }
      return next;
    });
  }, [fields]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, type } = e.target;

    if (type === "checkbox") {
      setValues({ ...values, [name]: (e.target as HTMLInputElement).checked });
    } else if (type === "file") {
      const files = (e.target as HTMLInputElement).files;
      setValues({
        ...values,
        [name]: files ?? new DataTransfer().files,
      });

      // Opdater liste med viste filnavne
      setFileNames({
        ...fileNames,
        [name]: files ? Array.from(files).map((f) => f.name) : [],
      });
    } else {
      setValues({ ...values, [name]: e.target.value });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      if (
        "required" in field &&
        field.required &&
        (values[field.name] === undefined ||
          values[field.name] === "" ||
          (field.type === "file" &&
            (values[field.name] as FileList)?.length === 0))
      ) {
        newErrors[field.name] = "Dette felt er påkrævet";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(values);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {fields.map((field) => {
        if (field.type === "hidden") {
          return (
            <input
              key={field.name}
              type="hidden"
              name={field.name}
              value={field.value}
              onChange={handleChange}
            />
          );
        }

        const error = errors[field.name];
        const description = "description" in field ? field.description : null;

        const common = {
          id: field.name,
          name: field.name,
          required: "required" in field ? field.required : undefined,
          onChange: handleChange,
          className: styles.input,
        };

        return (
          <div className={styles.row} key={field.name}>
            {field.type !== "checkbox" && field.type !== "file" && (
              <label htmlFor={field.name} className={styles.label}>
                {field.label}
                {"required" in field && field.required ? " *" : ""}
              </label>
            )}

            {field.type === "text" ||
            field.type === "email" ||
            field.type === "tel" ||
            field.type === "number" ? (
              <input
                {...common}
                type={field.type}
                placeholder={field.placeholder}
                max={field.type === "number" ? field.max : undefined}
              />
            ) : field.type === "textarea" ? (
              <textarea
                {...common}
                placeholder={field.placeholder}
                className={styles.textarea}
              />
            ) : field.type === "select" ? (
              <div className={styles.selectWrapper}>
                <select {...common} className={styles.select}>
                  <option value="">{t("form.selectPlaceholder")}</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <UI_ICONS.ChevronDown className={styles.selectIcon} />
              </div>
            ) : field.type === "checkbox" ? (
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  name={field.name}
                  required={field.required}
                  onChange={handleChange}
                />
                {field.label}
              </label>
            ) : field.type === "file" ? (
              <div className={styles.fileUploadWrapper}>
                <label className={styles.label}>
                  {field.label}
                  {"required" in field && field.required ? " *" : ""}
                </label>

                <input
                  {...common}
                  type="file"
                  multiple={field.multiple}
                  className={styles.hiddenFileInput}
                  id={field.name}
                  onChange={handleChange}
                />

                <Buttons
                  variant="secondary"
                  label={
                    field.multiple
                      ? t("form.chooseFiles")
                      : t("form.chooseFile")
                  }
                  buttonType="button"
                  fullWidth
                  onClick={() => document.getElementById(field.name)?.click()}
                />

                {fileNames[field.name]?.length > 0 && (
                  <div className={styles.fileList}>
                    {fileNames[field.name].map((name, i) => (
                      <div key={i} className={styles.fileName}>
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.input}>
                {field.type === "date" || field.type === "info"
                  ? field.value
                  : ""}
              </div>
            )}

            {description && (
              <div className={styles.description}>{description}</div>
            )}
            {error && <div className={styles.error}>{error}</div>}
          </div>
        );
      })}
      <div className={styles.actions}>
        <Buttons
          label={
            values["checkType"] === "checkin"
              ? t("Tjek-ind", "Check-in")
              : values["checkType"] === "checkout"
              ? t("Tjek-ud", "Check-out")
              : submitLabel
          }
          buttonType="submit"
          fullWidth
        />
      </div>
    </form>
  );
}
