"use client"

type StatusFilterSelectProps = {
  status: string
  options: { value: string; label: string }[]
}

export function StatusFilterSelect({ status, options }: StatusFilterSelectProps) {
  return (
    <select
      name="status"
      defaultValue={status}
      onChange={(event) => event.currentTarget.form?.submit()}
      className="h-9 rounded-md border bg-transparent px-3 text-sm"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
