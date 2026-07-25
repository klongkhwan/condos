"use client"

import type React from "react"
import { useId } from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * คลาสมาตรฐานของ input/select/textarea ทั้งระบบ
 * แทนสตริงคลาสยาวๆ ที่เคยถูกคัดลอกซ้ำในทุกฟอร์ม
 */
export function fieldClass(hasError?: boolean, extra?: string) {
  return cn(
    "w-full rounded-md border bg-muted px-3 py-2 text-sm text-foreground transition-colors",
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-0",
    hasError
      ? "border-destructive focus:ring-destructive"
      : "border-input hover:border-border-strong focus:border-ring focus:ring-ring",
    extra,
  )
}

interface FieldProps {
  label: string
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode
  required?: boolean
  error?: string
  hint?: string
  className?: string
}

/**
 * ห่อ label + control + ข้อความผิดพลาด และผูก htmlFor/id ให้อัตโนมัติ
 *
 * <Field label="ชื่อ" required error={errors.name}>
 *   {(props) => <input {...props} className={fieldClass(!!errors.name)} />}
 * </Field>
 */
export function Field({ label, children, required, error, hint, className }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>

      {children({ id, "aria-invalid": !!error, "aria-describedby": describedBy })}

      {error ? (
        <p id={errorId} className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string
  error?: string
  hint?: string
  required?: boolean
  wrapperClassName?: string
  inputClassName?: string
}

export function TextField({
  label,
  error,
  hint,
  required,
  wrapperClassName,
  inputClassName,
  ...inputProps
}: TextFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      {(props) => <input {...props} {...inputProps} className={fieldClass(!!error, inputClassName)} />}
    </Field>
  )
}

type SelectFieldProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  label: string
  error?: string
  hint?: string
  required?: boolean
  wrapperClassName?: string
}

export function SelectField({
  label,
  error,
  hint,
  required,
  wrapperClassName,
  children,
  ...selectProps
}: SelectFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      {(props) => (
        <select {...props} {...selectProps} className={fieldClass(!!error)}>
          {children}
        </select>
      )}
    </Field>
  )
}

type TextAreaFieldProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
  label: string
  error?: string
  hint?: string
  required?: boolean
  wrapperClassName?: string
}

export function TextAreaField({
  label,
  error,
  hint,
  required,
  wrapperClassName,
  ...textareaProps
}: TextAreaFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      {(props) => <textarea {...props} {...textareaProps} className={fieldClass(!!error, "resize-none")} />}
    </Field>
  )
}
